// ═══════════════════════════════════════════════
// useProjectRole — Role detection hook
// Determines if current user is leader/member
// For now: simulated. Extensible for real auth.
// ═══════════════════════════════════════════════

import { useMemo } from "react";
import { getCreatedProjects } from "@/lib/projectStore";

interface ProjectRoleResult {
  isLeader: boolean;
  isMember: boolean;
  role: "leader" | "member" | "viewer";
}

/**
 * Determines the current user's role in a given project.
 *
 * Simulation logic:
 * - Projects that start with "user-" were created by the current user → leader
 * - Known mock project IDs (1, 2, 3, proj_*) → leader (for demo purposes)
 * - Everything else → member
 *
 * In production, this would check against an auth service.
 */
export function useProjectRole(projectId: string | undefined): ProjectRoleResult {
  return useMemo(() => {
    if (!projectId) {
      return { isLeader: false, isMember: false, role: "viewer" as const };
    }

    // User-created projects — creator is leader
    if (projectId.startsWith("user-")) {
      const createdProjects = getCreatedProjects();
      const isCreator = createdProjects.some((p) => p.id === projectId);
      if (isCreator) {
        return { isLeader: true, isMember: true, role: "leader" as const };
      }
    }

    // Demo/mock project IDs — treat current user as leader
    const demoProjectIds = ["1", "2", "3", "proj_solarsense", "proj_codementor", "proj_ecotrack"];
    if (demoProjectIds.includes(projectId)) {
      return { isLeader: true, isMember: true, role: "leader" as const };
    }

    // Default: member
    return { isLeader: false, isMember: true, role: "member" as const };
  }, [projectId]);
}
