// ═══════════════════════════════════════════════
// Entity Resolver — Probabilistic Identity Linkage
// Links names, emails, roles across tabs.
// Uses weighted scoring with configurable thresholds.
// ═══════════════════════════════════════════════

import {
  normalizeString,
  nameFingerprint,
  nameInitials,
  jaroWinkler,
  isEmailLike,
} from './LinguisticEngine';
import { getWeights } from './WeightConfig';
import type { EntityResolutionReport, EntityMerge, EntityConflict } from './SnapshotTypes';
import type { CanonicalMember } from '../canonicalTypes';

interface RawIdentity {
  name: string;
  email?: string;
  role?: string;
  source_tab: string;
  source_row: number;
}

interface IdentityCluster {
  canonical_name: string;
  aliases: string[];
  emails: string[];
  roles: string[];
  sources: Array<{ tab: string; row: number }>;
  merge_confidence: number;
  merge_signals: string[];
}

/**
 * Resolve entities across all tabs.
 * Collects all name-like values, clusters by probabilistic linkage.
 */
export function resolveEntities(
  identities: RawIdentity[]
): { members: CanonicalMember[]; report: EntityResolutionReport } {
  const weights = getWeights().entity_resolution;
  const thresholds = getWeights().entity_resolution_thresholds;

  const clusters: IdentityCluster[] = [];
  const conflicts: EntityConflict[] = [];

  for (const identity of identities) {
    if (!identity.name || identity.name.trim().length === 0) continue;

    let bestCluster: IdentityCluster | null = null;
    let bestScore = 0;

    for (const cluster of clusters) {
      const score = computeLinkScore(identity, cluster, weights);
      if (score > bestScore) {
        bestScore = score;
        bestCluster = cluster;
      }
    }

    if (bestCluster && bestScore >= thresholds.auto_merge) {
      // Auto-merge
      if (!bestCluster.aliases.includes(identity.name)) {
        bestCluster.aliases.push(identity.name);
      }
      if (identity.email && !bestCluster.emails.includes(identity.email)) {
        bestCluster.emails.push(identity.email);
      }
      if (identity.role && !bestCluster.roles.includes(identity.role)) {
        bestCluster.roles.push(identity.role);
      }
      bestCluster.sources.push({ tab: identity.source_tab, row: identity.source_row });
      bestCluster.merge_confidence = Math.min(bestCluster.merge_confidence, bestScore);
      bestCluster.merge_signals.push(`Merged "${identity.name}" (score: ${bestScore.toFixed(2)})`);

      // Use longer name as canonical
      if (identity.name.length > bestCluster.canonical_name.length) {
        bestCluster.canonical_name = identity.name;
      }
    } else if (bestCluster && bestScore >= thresholds.suggest_review) {
      // Suggest review
      conflicts.push({
        name_a: bestCluster.canonical_name,
        name_b: identity.name,
        similarity_score: bestScore,
        reason: `Score ${bestScore.toFixed(2)} between auto-merge (${thresholds.auto_merge}) and keep-separate (${thresholds.keep_separate})`,
        resolution: 'needs_review',
      });
      // Create new cluster for now
      clusters.push(createCluster(identity));
    } else {
      // New cluster
      clusters.push(createCluster(identity));
    }
  }

  // Build canonical members
  const members: CanonicalMember[] = clusters.map(c => ({
    name: c.canonical_name,
    normalized_key: nameFingerprint(c.canonical_name),
    role: c.roles[0] || null,
    email: c.emails[0] || null,
    alias_group: c.aliases,
  }));

  const merges: EntityMerge[] = clusters
    .filter(c => c.aliases.length > 1)
    .map(c => ({
      canonical_name: c.canonical_name,
      aliases: c.aliases,
      merge_confidence: c.merge_confidence,
      merge_signals: c.merge_signals,
    }));

  const report: EntityResolutionReport = {
    total_raw_names: identities.length,
    total_resolved_entities: clusters.length,
    merges,
    conflicts,
    unresolved: [],
  };

  return { members, report };
}

function createCluster(identity: RawIdentity): IdentityCluster {
  return {
    canonical_name: identity.name,
    aliases: [identity.name],
    emails: identity.email ? [identity.email] : [],
    roles: identity.role ? [identity.role] : [],
    sources: [{ tab: identity.source_tab, row: identity.source_row }],
    merge_confidence: 1.0,
    merge_signals: [],
  };
}

function computeLinkScore(
  identity: RawIdentity,
  cluster: IdentityCluster,
  weights: { normalized_name_similarity: number; email_equality: number; initials_match: number; role_context_match: number; co_occurrence_score: number }
): number {
  let score = 0;

  // Name similarity (best match across all aliases)
  let bestNameSim = 0;
  for (const alias of cluster.aliases) {
    const fp1 = nameFingerprint(identity.name);
    const fp2 = nameFingerprint(alias);

    if (fp1 === fp2) {
      bestNameSim = 1.0;
      break;
    }

    const jw = jaroWinkler(normalizeString(identity.name), normalizeString(alias));
    if (jw > bestNameSim) bestNameSim = jw;
  }
  score += weights.normalized_name_similarity * bestNameSim;

  // Email equality
  if (identity.email && cluster.emails.length > 0) {
    const emailMatch = cluster.emails.some(e =>
      e.toLowerCase() === identity.email!.toLowerCase()
    );
    score += weights.email_equality * (emailMatch ? 1.0 : 0);
  }

  // Initials match
  const identityInitials = nameInitials(identity.name);
  const clusterInitials = nameInitials(cluster.canonical_name);
  if (identityInitials.length >= 2 && identityInitials === clusterInitials) {
    score += weights.initials_match * 1.0;
  }

  // Role context match
  if (identity.role && cluster.roles.length > 0) {
    const roleMatch = cluster.roles.some(r =>
      normalizeString(r) === normalizeString(identity.role!)
    );
    score += weights.role_context_match * (roleMatch ? 1.0 : 0);
  }

  // Co-occurrence (same tab = weak signal)
  const sameTab = cluster.sources.some(s => s.tab === identity.source_tab);
  score += weights.co_occurrence_score * (sameTab ? 0.5 : 0);

  return score;
}

export type { RawIdentity };
