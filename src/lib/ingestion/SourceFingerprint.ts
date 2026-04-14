// ═══════════════════════════════════════════════
// Source Fingerprint
// SHA-256 content fingerprint via crypto.subtle.
// Based on content only — never includes volatile timestamps.
// ═══════════════════════════════════════════════

import type { SourceFingerprintData, RawTab } from './types';

export async function computeFingerprint(
  spreadsheetId: string,
  spreadsheetTitle: string,
  selectedTabs: RawTab[],
  inspectedTabNames: string[]
): Promise<SourceFingerprintData> {
  // Build content string for hashing
  const parts: string[] = [
    spreadsheetId,
    spreadsheetTitle,
    ...selectedTabs.map((t) => t.tab_name),
  ];

  // Add headers from selected tabs
  for (const tab of selectedTabs) {
    parts.push(`HEADERS:${tab.headers.join('|')}`);
  }

  // Add first N row signatures per tab — normalized content only
  const MAX_ROW_SIGNATURES = 10;
  let rowSignatureCount = 0;
  for (const tab of selectedTabs) {
    const sigRows = tab.rows.slice(0, MAX_ROW_SIGNATURES);
    for (const row of sigRows) {
      // Take first 5 cells of each row to keep fingerprint stable
      const sig = row.slice(0, 5).map((v) => (v ?? '').trim()).join('|');
      parts.push(`ROW:${sig}`);
      rowSignatureCount++;
    }
  }

  const contentString = parts.join('\n');
  const encoded = new TextEncoder().encode(contentString);

  let fingerprint: string;
  try {
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    fingerprint = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback for environments without crypto.subtle
    fingerprint = simpleHash(contentString);
  }

  return {
    fingerprint_sha256: fingerprint,
    source_kind: 'google_sheets',
    spreadsheet_id: spreadsheetId,
    inspected_tabs: inspectedTabNames,
    selected_tabs: selectedTabs.map((t) => t.tab_name),
    row_signature_count: rowSignatureCount,
  };
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}
