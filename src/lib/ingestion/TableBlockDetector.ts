// ═══════════════════════════════════════════════
// Table-Block Detector — §5
// Scans first N rows to find actual data regions.
// Does NOT assume row 0 is header or A1 anchoring.
// Returns scored candidate blocks for each tab.
// ═══════════════════════════════════════════════

import { normalizeHeader } from './LinguisticEngine';
import { UNIFIED_SYNONYMS } from './LinguisticEngine';

// ─── Types ───

export interface TableBlock {
  start_row: number;
  end_row: number;
  start_col: number;
  end_col: number;
  header_row: number;
  headers: string[];
  density_score: number;
  header_uniqueness_score: number;
  semantic_header_score: number;
  type_diversity_score: number;
  row_coherence_score: number;
  operational_signal_score: number;
  table_block_score: number;
}

// ─── Main Entry ───

const MAX_SCAN_ROWS = 50;

/**
 * Detect all candidate table blocks within the first MAX_SCAN_ROWS rows.
 * Returns them sorted by table_block_score descending.
 */
export function detectTableBlocks(
  allRows: string[][],
  colCount: number
): TableBlock[] {
  if (allRows.length < 2 || colCount < 2) return [];

  const scanRows = allRows.slice(0, MAX_SCAN_ROWS);
  const candidateHeaders = findCandidateHeaderRows(scanRows, colCount);
  const blocks: TableBlock[] = [];

  for (const headerIdx of candidateHeaders) {
    const block = buildBlock(allRows, headerIdx, colCount);
    if (block) blocks.push(block);
  }

  // Also try row 0 if not already a candidate (graceful fallback)
  if (candidateHeaders.length === 0 || !candidateHeaders.includes(0)) {
    if (allRows.length > 1) {
      const block = buildBlock(allRows, 0, colCount);
      if (block) blocks.push(block);
    }
  }

  blocks.sort((a, b) => b.table_block_score - a.table_block_score);
  return blocks;
}

/**
 * Select the best block from detected candidates.
 */
export function selectBestBlock(blocks: TableBlock[]): TableBlock | null {
  if (blocks.length === 0) return null;
  return blocks[0];
}

// ─── Candidate Header Detection ───

function findCandidateHeaderRows(rows: string[][], colCount: number): number[] {
  const candidates: Array<{ row: number; score: number }> = [];

  for (let r = 0; r < rows.length && r < MAX_SCAN_ROWS - 1; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    // A header row should:
    // 1. Have mostly non-empty cells
    // 2. Have mostly string (non-numeric) cells
    // 3. Have unique values
    // 4. Be followed by at least 2 data rows

    const effectiveCols = Math.min(row.length, colCount);
    let nonEmpty = 0;
    let stringCells = 0;
    const seen = new Set<string>();
    let hasDuplicate = false;

    for (let c = 0; c < effectiveCols; c++) {
      const val = (row[c] ?? '').trim();
      if (val.length > 0) {
        nonEmpty++;
        if (!/^\d+(\.\d+)?$/.test(val)) stringCells++;
        if (seen.has(val.toLowerCase())) hasDuplicate = true;
        seen.add(val.toLowerCase());
      }
    }

    if (effectiveCols === 0) continue;
    const fillRatio = nonEmpty / effectiveCols;
    const stringRatio = nonEmpty > 0 ? stringCells / nonEmpty : 0;
    const uniqueRatio = nonEmpty > 0 ? seen.size / nonEmpty : 0;

    // Must have enough non-empty cells, mostly strings, mostly unique
    if (fillRatio < 0.4 || stringRatio < 0.5 || nonEmpty < 2) continue;

    // Check data rows below
    let dataRowsBelowCount = 0;
    for (let dr = r + 1; dr < Math.min(r + 6, rows.length); dr++) {
      const dataRow = rows[dr];
      if (!dataRow) continue;
      const filled = dataRow.filter((v, i) => i < effectiveCols && v && v.trim() !== '').length;
      if (filled >= 2) dataRowsBelowCount++;
    }

    if (dataRowsBelowCount < 2) continue;

    // Score the candidate
    let score = fillRatio * 0.3 + stringRatio * 0.25 + uniqueRatio * 0.2;
    score += Math.min(dataRowsBelowCount / 5, 1) * 0.15;
    if (!hasDuplicate) score += 0.1;

    // Bonus for semantic header matches
    let semanticHits = 0;
    for (let c = 0; c < effectiveCols; c++) {
      const val = (row[c] ?? '').trim();
      if (val && matchesAnyCanonicalField(val)) semanticHits++;
    }
    if (nonEmpty > 0) score += (semanticHits / nonEmpty) * 0.2;

    candidates.push({ row: r, score });
  }

  // Sort by score, take top 3
  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, 3).map(c => c.row);
}

// ─── Block Builder ───

function buildBlock(
  allRows: string[][],
  headerIdx: number,
  colCount: number
): TableBlock | null {
  const headerRow = allRows[headerIdx];
  if (!headerRow) return null;

  const effectiveCols = Math.min(headerRow.length, colCount);
  const headers = headerRow.slice(0, effectiveCols).map(h => (h ?? '').trim());

  // Find data extent below header
  let dataEnd = headerIdx + 1;
  let consecutiveEmpty = 0;

  for (let r = headerIdx + 1; r < allRows.length; r++) {
    const row = allRows[r];
    if (!row) { consecutiveEmpty++; continue; }

    const filled = row.filter((v, i) => i < effectiveCols && v && v.trim() !== '').length;
    if (filled === 0) {
      consecutiveEmpty++;
      if (consecutiveEmpty >= 3) break;
    } else {
      consecutiveEmpty = 0;
      dataEnd = r + 1;
    }
  }

  const dataRowCount = dataEnd - headerIdx - 1;
  if (dataRowCount < 1) return null;

  const dataRows = allRows.slice(headerIdx + 1, dataEnd);

  // ─── Score Components ───

  // 1. Density score: non-empty cells / total cells in data region
  let filledCells = 0;
  let totalCells = 0;
  for (const row of dataRows) {
    for (let c = 0; c < effectiveCols; c++) {
      totalCells++;
      if (row[c] && row[c].trim() !== '') filledCells++;
    }
  }
  const densityScore = totalCells > 0 ? filledCells / totalCells : 0;

  // 2. Header uniqueness
  const nonEmptyHeaders = headers.filter(h => h.length > 0);
  const uniqueHeaders = new Set(nonEmptyHeaders.map(h => h.toLowerCase()));
  const headerUniquenessScore = nonEmptyHeaders.length > 0
    ? uniqueHeaders.size / nonEmptyHeaders.length
    : 0;

  // 3. Semantic header score: how many headers match canonical fields
  let semanticHits = 0;
  for (const h of nonEmptyHeaders) {
    if (matchesAnyCanonicalField(h)) semanticHits++;
  }
  const semanticHeaderScore = nonEmptyHeaders.length > 0
    ? semanticHits / nonEmptyHeaders.length
    : 0;

  // 4. Type diversity: how many different value types exist across columns
  let typesFound = 0;
  const sampleData = dataRows.slice(0, 15);
  let hasDate = false, hasNumber = false, hasText = false, hasEmail = false;

  for (let c = 0; c < effectiveCols; c++) {
    const vals = sampleData.map(r => (r[c] ?? '').trim()).filter(Boolean);
    for (const v of vals) {
      if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) hasEmail = true;
      else if (/^\d{1,2}[/.\-]\d{1,2}[/.\-]\d{2,4}$/.test(v) || /^\d{4}-\d{1,2}-\d{1,2}$/.test(v)) hasDate = true;
      else if (/^\d+(\.\d+)?%?$/.test(v)) hasNumber = true;
      else if (v.length > 0) hasText = true;
    }
  }
  if (hasDate) typesFound++;
  if (hasNumber) typesFound++;
  if (hasText) typesFound++;
  if (hasEmail) typesFound++;
  const typeDiversityScore = Math.min(typesFound / 3, 1);

  // 5. Row coherence: what fraction of data rows have consistent column fill patterns
  const colFillCounts = new Array(effectiveCols).fill(0);
  for (const row of sampleData) {
    for (let c = 0; c < effectiveCols; c++) {
      if (row[c] && row[c].trim() !== '') colFillCounts[c]++;
    }
  }
  const sampleLen = sampleData.length || 1;
  const fillRatios = colFillCounts.map(c => c / sampleLen);
  // Coherence = 1 - variance of fill ratios
  const avgFill = fillRatios.reduce((a, b) => a + b, 0) / (fillRatios.length || 1);
  const variance = fillRatios.reduce((s, r) => s + (r - avgFill) ** 2, 0) / (fillRatios.length || 1);
  const rowCoherenceScore = Math.max(0, 1 - variance * 4);

  // 6. Operational signal: does this look like task/work data vs summary
  let opSignal = 0;
  if (dataRowCount >= 5) opSignal += 0.3;
  if (dataRowCount >= 10) opSignal += 0.2;
  if (semanticHits >= 2) opSignal += 0.3;
  if (typesFound >= 3) opSignal += 0.2;
  const operationalSignalScore = Math.min(opSignal, 1);

  // ─── Composite Score (§5 formula) ───
  const tableBlockScore =
    0.25 * densityScore +
    0.20 * headerUniquenessScore +
    0.20 * semanticHeaderScore +
    0.15 * typeDiversityScore +
    0.10 * rowCoherenceScore +
    0.10 * operationalSignalScore;

  return {
    start_row: headerIdx,
    end_row: dataEnd - 1,
    start_col: 0,
    end_col: effectiveCols - 1,
    header_row: headerIdx,
    headers,
    density_score: round(densityScore),
    header_uniqueness_score: round(headerUniquenessScore),
    semantic_header_score: round(semanticHeaderScore),
    type_diversity_score: round(typeDiversityScore),
    row_coherence_score: round(rowCoherenceScore),
    operational_signal_score: round(operationalSignalScore),
    table_block_score: round(tableBlockScore),
  };
}

// ─── Helpers ───

function matchesAnyCanonicalField(header: string): boolean {
  const nh = normalizeHeader(header);
  if (!nh) return false;
  for (const synonyms of Object.values(UNIFIED_SYNONYMS)) {
    for (const syn of synonyms) {
      if (nh === syn) return true;
      // Containment check
      if (nh.length >= 4 && syn.length >= 4) {
        if (nh.includes(syn) || syn.includes(nh)) return true;
      }
    }
  }
  return false;
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}
