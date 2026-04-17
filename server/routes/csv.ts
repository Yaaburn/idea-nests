// ═══════════════════════════════════════════════
// CSV/XLSX Upload Routes
// Accepts file upload, parses into RawSheetData format.
// File content is processed in-memory, never persisted.
//
// XLSX support: Uses SheetJS (xlsx) library.
// - CSV: Full support (single sheet).
// - XLSX: Basic support (values only, no formulas/charts/images).
// - XLS (legacy): Best-effort, may lose formatting.
// ═══════════════════════════════════════════════

import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { logAuditEvent } from '../models/AuditLog';

// In-memory storage only — file never touches disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(csv|xlsx|xls)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file CSV hoặc Excel (.xlsx/.xls)'));
    }
  },
});

const router = Router();

// POST /api/csv/upload
// Parses uploaded CSV/XLSX and returns RawSheetData
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'NO_FILE',
        message: 'Vui lòng chọn file để tải lên.',
      });
    }

    const projectId = req.body.projectId;
    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    const buffer = req.file.buffer;
    const filename = req.file.originalname;
    const ext = filename.toLowerCase().split('.').pop() ?? '';
    const isCSV = ext === 'csv';
    const isXLSX = ext === 'xlsx';
    const isXLS = ext === 'xls';

    let workbook: XLSX.WorkBook;
    const parseWarnings: string[] = [];

    if (isCSV) {
      const csvText = buffer.toString('utf-8');
      workbook = XLSX.read(csvText, { type: 'string' });
    } else if (isXLSX) {
      workbook = XLSX.read(buffer, { type: 'buffer' });
      parseWarnings.push(
        'XLSX parsing: values and basic formatting only. ' +
        'Formulas are evaluated as cached values. Charts, images, and macros are not supported.'
      );
    } else if (isXLS) {
      workbook = XLSX.read(buffer, { type: 'buffer' });
      parseWarnings.push(
        'Legacy XLS format: best-effort parsing. ' +
        'Some formatting and data types may not be fully preserved. ' +
        'Consider converting to XLSX or CSV for best results.'
      );
    } else {
      return res.status(400).json({
        error: 'UNSUPPORTED_FORMAT',
        message: `Định dạng .${ext} không được hỗ trợ. Vui lòng dùng CSV hoặc XLSX.`,
      });
    }

    const tabs: Array<{
      tab_name: string;
      tab_index: number;
      headers: string[];
      rows: string[][];
      row_count: number;
      col_count: number;
    }> = [];

    workbook.SheetNames.forEach((sheetName, index) => {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) return;

      const data: string[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: '',
        raw: false,
      }) as string[][];

      if (data.length < 2) return;

      const headers = data[0].map(h => String(h ?? '').trim());
      const rows = data.slice(1).map(row =>
        row.map(cell => String(cell ?? '').trim())
      );

      if (headers.filter(h => h.length > 0).length < 2) return;

      tabs.push({
        tab_name: sheetName,
        tab_index: index,
        headers,
        rows,
        row_count: rows.length,
        col_count: headers.length,
      });
    });

    if (tabs.length === 0) {
      return res.status(422).json({
        error: 'EMPTY_DATA',
        message: 'File không chứa dữ liệu hợp lệ (cần ít nhất 2 hàng và 2 cột).',
      });
    }

    // Audit log
    await logAuditEvent('csv_upload', projectId, {
      filename,
      format: ext,
      tabCount: tabs.length,
      totalRows: tabs.reduce((s, t) => s + t.row_count, 0),
      result: 'success',
    });

    // Return RawSheetData format with transparency metadata
    const sourceMode = isCSV ? 'csv_snapshot' : isXLSX ? 'xlsx_snapshot' : 'xlsx_snapshot';

    res.json({
      spreadsheet_id: `${ext}_${Date.now()}`,
      title: filename.replace(/\.(csv|xlsx|xls)$/i, ''),
      tabs,
      access_mode: 'csv_upload',
      // Transparency metadata
      _parse_info: {
        source_format: ext,
        source_mode: sourceMode,
        parser_engine: 'sheetjs',
        is_multi_sheet: tabs.length > 1,
        total_sheets_in_file: workbook.SheetNames.length,
        sheets_parsed: tabs.length,
        sheets_skipped: workbook.SheetNames.length - tabs.length,
        warnings: parseWarnings,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[CSV] Parse error:', msg);

    // Audit the failure
    const projectId = req.body?.projectId ?? 'unknown';
    await logAuditEvent('csv_upload', projectId, {
      filename: req.file?.originalname ?? 'unknown',
      result: 'error',
      errorMessage: msg,
    });

    res.status(500).json({
      error: 'PARSE_FAILED',
      message: 'Không thể đọc file. Vui lòng kiểm tra định dạng.',
      detail: msg,
    });
  }
});

export default router;
