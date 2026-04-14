// ═══════════════════════════════════════════════
// Integration Config Store
// Persists ONLY configuration (never canonical data)
// Per-project, leader-only management
// ═══════════════════════════════════════════════

import type { ProjectIntegrationConfig, ColumnMapping } from "./canonicalTypes";

const STORAGE_KEY = "talentnet_project_integrations";

// ─── Read ───

function getAll(): ProjectIntegrationConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(configs: ProjectIntegrationConfig[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
}

// ─── Public API ───

export function getIntegrationConfig(
  projectId: string
): ProjectIntegrationConfig | null {
  const configs = getAll();
  return configs.find((c) => c.project_id === projectId) ?? null;
}

export function saveIntegrationConfig(
  config: ProjectIntegrationConfig
): void {
  const configs = getAll();
  const idx = configs.findIndex((c) => c.project_id === config.project_id);
  if (idx !== -1) {
    configs[idx] = config;
  } else {
    configs.push(config);
  }
  saveAll(configs);
}

export function removeIntegrationConfig(projectId: string): void {
  const configs = getAll();
  saveAll(configs.filter((c) => c.project_id !== projectId));
}

export function updateColumnOverrides(
  projectId: string,
  overrides: ColumnMapping[]
): void {
  const config = getIntegrationConfig(projectId);
  if (config) {
    config.column_overrides = overrides;
    saveIntegrationConfig(config);
  }
}

export function hasIntegrationConfig(projectId: string): boolean {
  return getIntegrationConfig(projectId) !== null;
}
