// ═══════════════════════════════════════════════
// CSV/XLSX Upload Routes
// Accepts file upload, parses into RawSheetData format.
// File content is processed in-memory, never persisted.
// ═══════════════════════════════════════════════

import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';

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
router.post('/upload', upload.single('file'), (req: Request, res: Response) => {
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
    const isCSV = filename.toLowerCase().endsWith('.csv');

    let workbook: XLSX.WorkBook;

    if (isCSV) {
      // Parse CSV
      const csvText = buffer.toString('utf-8');
      workbook = XLSX.read(csvText, { type: 'string' });
    } else {
      // Parse XLSX/XLS
      workbook = XLSX.read(buffer, { type: 'buffer' });
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

      // Convert to 2D array
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

      // Skip sheets with too few non-empty headers
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

    // Return RawSheetData format
    res.json({
      spreadsheet_id: `csv_${Date.now()}`,
      title: filename.replace(/\.(csv|xlsx|xls)$/i, ''),
      tabs,
      access_mode: 'csv_upload',
    });
  } catch (err) {
    console.error('[CSV] Parse error:', err);
    res.status(500).json({
      error: 'PARSE_FAILED',
      message: 'Không thể đọc file. Vui lòng kiểm tra định dạng.',
    });
  }
});

export default router;
