// ═══════════════════════════════════════════════
// Tab Lifecycle Detector — §9
// Compares current vs previous snapshot tabs.
// Assigns: new | existing_unchanged | existing_changed
//          | deprecated_missing | ambiguous_match
// ═══════════════════════════════════════════════

import { normalizeString, jaroWinkler } from './LinguisticEngine';
import type { TabLifecycleResult, TabLifecycleReport } from './SnapshotTypes';
import type { BronzeTab } from './SnapshotTypes';

// ─── Configuration ───

const THRESHOLDS = {
  unchanged: 0.85,
  ambiguous_high: 0.85,
  ambiguous_low: 0.60,
  new_tab: 0.60,
};

// ─── Main Entry ───

/**
 * Detect tab lifecycle status by comparing current tabs
 * against previous snapshot tabs.
 */
export function detectTabLifecycles(
  currentTabs: BronzeTab[],
  previousTabs: BronzeTab[] | null,
): TabLifecycleReport {
  const now = new Date().toISOString();

  if (!previousTabs || previousTabs.length === 0) {
    // First snapshot: everything is new
    const results: TabLifecycleResult[] = currentTabs.map(tab => ({
      tab_name: tab.tab_name,
      version_status: 'new' as const,
      similarity_score: 0,
      matched_previous_tab: null,
      tab_name_similarity: 0,
      header_jaccard_similarity: 0,
      semantic_profile_similarity: 0,
      row_scale_similarity: 0,
    }));

    return {
      results,
      new_tabs: results.map(r => r.tab_name),
      deprecated_tabs: [],
      changed_tabs: [],
      unchanged_tabs: [],
      ambiguous_tabs: [],
      generated_at: now,
    };
  }

  const results: TabLifecycleResult[] = [];
  const matchedPrevious = new Set<string>();

  for (const currentTab of currentTabs) {
    let bestMatch: TabLifecycleResult | null = null;
    let bestScore = 0;

    for (const prevTab of previousTabs) {
      if (matchedPrevious.has(prevTab.tab_name)) continue;

      const similarity = computeTabSimilarity(currentTab, prevTab);
      if (similarity.composite > bestScore) {
        bestScore = similarity.composite;
        bestMatch = {
          tab_name: currentTab.tab_name,
          version_status: 'new',
          similarity_score: similarity.composite,
          matched_previous_tab: prevTab.tab_name,
          tab_name_similarity: similarity.nameSim,
          header_jaccard_similarity: similarity.headerJaccard,
          semantic_profile_similarity: similarity.semanticSim,
          row_scale_similarity: similarity.rowScaleSim,
        };
      }
    }

    if (bestMatch && bestScore >= THRESHOLDS.unchanged) {
      // Check if content actually changed
      const contentChanged = hasContentChanged(
        currentTab,
        previousTabs.find(t => t.tab_name === bestMatch!.matched_previous_tab)!,
      );
      bestMatch.version_status = contentChanged ? 'existing_changed' : 'existing_unchanged';
      matchedPrevious.add(bestMatch.matched_previous_tab!);
    } else if (bestMatch && bestScore >= THRESHOLDS.ambiguous_low) {
      bestMatch.version_status = 'ambiguous_match';
      matchedPrevious.add(bestMatch.matched_previous_tab!);
    } else {
      bestMatch = {
        tab_name: currentTab.tab_name,
        version_status: 'new',
        similarity_score: 0,
        matched_previous_tab: null,
        tab_name_similarity: 0,
        header_jaccard_similarity: 0,
        semantic_profile_similarity: 0,
        row_scale_similarity: 0,
      };
    }

    results.push(bestMatch);
  }

  // Detect deprecated tabs (in previous but not matched)
  const deprecatedResults: TabLifecycleResult[] = [];
  for (const prevTab of previousTabs) {
    if (!matchedPrevious.has(prevTab.tab_name)) {
      deprecatedResults.push({
        tab_name: prevTab.tab_name,
        version_status: 'deprecated_missing',
        similarity_score: 0,
        matched_previous_tab: null,
        tab_name_similarity: 0,
        header_jaccard_similarity: 0,
        semantic_profile_similarity: 0,
        row_scale_similarity: 0,
      });
    }
  }

  const allResults = [...results, ...deprecatedResults];

  return {
    results: allResults,
    new_tabs: allResults.filter(r => r.version_status === 'new').map(r => r.tab_name),
    deprecated_tabs: allResults.filter(r => r.version_status === 'deprecated_missing').map(r => r.tab_name),
    changed_tabs: allResults.filter(r => r.version_status === 'existing_changed').map(r => r.tab_name),
    unchanged_tabs: allResults.filter(r => r.version_status === 'existing_unchanged').map(r => r.tab_name),
    ambiguous_tabs: allResults.filter(r => r.version_status === 'ambiguous_match').map(r => r.tab_name),
    generated_at: now,
  };
}

// ─── Similarity Computation (§9 formula) ───

interface TabSimilarity {
  nameSim: number;
  headerJaccard: number;
  semanticSim: number;
  rowScaleSim: number;
  composite: number;
}

function computeTabSimilarity(current: BronzeTab, previous: BronzeTab): TabSimilarity {
  // 1. Tab name similarity (Jaro-Winkler on normalized names)
  const nameSim = jaroWinkler(
    normalizeString(current.tab_name),
    normalizeString(previous.tab_name),
  );

  // 2. Header Jaccard similarity
  const currentHeaders = new Set(current.headers.map(h => normalizeString(h)));
  const previousHeaders = new Set(previous.headers.map(h => normalizeString(h)));
  const intersection = [...currentHeaders].filter(h => previousHeaders.has(h));
  const union = new Set([...currentHeaders, ...previousHeaders]);
  const headerJaccard = union.size > 0 ? intersection.length / union.size : 0;

  // 3. Semantic profile similarity (column count + type distribution)
  const colCountRatio = Math.min(current.col_count, previous.col_count) /
    Math.max(current.col_count, previous.col_count, 1);
  const semanticSim = colCountRatio; // Simplified; full version uses column type profiles

  // 4. Row scale similarity (order of magnitude comparison)
  const logCurrent = Math.log10(Math.max(current.row_count, 1));
  const logPrevious = Math.log10(Math.max(previous.row_count, 1));
  const rowScaleSim = logCurrent > 0 || logPrevious > 0
    ? 1 - Math.abs(logCurrent - logPrevious) / Math.max(logCurrent, logPrevious, 1)
    : 1;

  // Composite (§9 weights)
  const composite =
    0.30 * nameSim +
    0.35 * headerJaccard +
    0.20 * semanticSim +
    0.15 * Math.max(0, rowScaleSim);

  return {
    nameSim: round(nameSim),
    headerJaccard: round(headerJaccard),
    semanticSim: round(semanticSim),
    rowScaleSim: round(Math.max(0, rowScaleSim)),
    composite: round(composite),
  };
}

function hasContentChanged(current: BronzeTab, previous: BronzeTab): boolean {
  // Quick checks: header or row count changed
  if (current.row_count !== previous.row_count) return true;
  if (current.col_count !== previous.col_count) return true;

  // Header content changed
  const ch = current.headers.join('|');
  const ph = previous.headers.join('|');
  if (ch !== ph) return true;

  // Sample first 5 rows for content comparison
  const sampleSize = Math.min(5, current.rows.length, previous.rows.length);
  for (let r = 0; r < sampleSize; r++) {
    const cr = (current.rows[r] ?? []).join('|');
    const pr = (previous.rows[r] ?? []).join('|');
    if (cr !== pr) return true;
  }

  return false;
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}
