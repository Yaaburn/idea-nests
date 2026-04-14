// ═══════════════════════════════════════════════
// Mock Data Generator — Self-Contained
// Generates realistic Vietnamese project data
// for demo mode when no backend/connector is available.
// NO external dependencies. Pure functions only.
// ═══════════════════════════════════════════════

import type { RawTab, RawSheetData } from './types';

const NAMES = [
  'Nguyễn Văn An', 'Trần Thị Bình', 'Lê Hoàng Cường',
  'Phạm Minh Đức', 'Vũ Thị Em', 'Đỗ Quang Phúc',
  'Hoàng Thị Giang', 'Bùi Văn Hải', 'Đinh Thị Inh',
  'Cao Thanh Khoa', 'Lý Văn Long', 'Mai Thị Minh',
];

const STATUSES_VI = ['Hoàn thành', 'Đang làm', 'Chưa bắt đầu', 'Chờ duyệt', 'Bị chặn'];
const PRIORITIES_VI = ['Cao', 'Trung bình', 'Thấp', 'Khẩn cấp'];

function mockDate(monthOffset: number, dayOffset: number): string {
  const d = new Date(2025, monthOffset, dayOffset + 1);
  return d.toISOString().slice(0, 10);
}

function generateTaskTab(): RawTab {
  const headers = [
    'Tên công việc', 'Trạng thái', 'Người phụ trách',
    'Ưu tiên', 'Hạn chót', 'Ngày bắt đầu', '% Hoàn thành', 'Ghi chú',
  ];

  const tasks = [
    'Thiết kế giao diện dashboard', 'Xây dựng API backend',
    'Viết unit test', 'Tích hợp Google Sheets', 'Thiết kế database schema',
    'Deploy staging server', 'Review code sprint 3', 'Chuẩn bị demo khách hàng',
    'Tối ưu hiệu suất query', 'Viết tài liệu kỹ thuật', 'Setup CI/CD pipeline',
    'Nghiên cứu AI model', 'Thiết kế UX flow mới', 'Fix bug production',
    'Cập nhật dependencies',
  ];

  const rows: string[][] = tasks.map((task, i) => [
    task,
    STATUSES_VI[i % STATUSES_VI.length],
    NAMES[i % NAMES.length],
    PRIORITIES_VI[i % PRIORITIES_VI.length],
    mockDate(Math.floor(i / 4), (i * 3) % 28),
    mockDate(Math.floor(i / 4) - 1, (i * 2) % 28),
    String(Math.min(100, Math.floor(Math.random() * 110))),
    i % 3 === 0 ? 'Cần review thêm' : '',
  ]);

  return {
    tab_name: 'Công việc',
    tab_index: 0,
    headers,
    rows,
    row_count: rows.length,
    col_count: headers.length,
  };
}

function generateMemberTab(): RawTab {
  const headers = ['Họ tên', 'Vai trò', 'Email', 'Phòng ban'];
  const roles = [
    'Lead Developer', 'UI/UX Designer', 'Backend Dev', 'QA Engineer',
    'DevOps', 'Product Manager', 'Data Analyst', 'Frontend Dev',
    'Scrum Master', 'Business Analyst', 'Mobile Dev', 'Security Engineer',
  ];
  const depts = ['Kỹ thuật', 'Thiết kế', 'Chất lượng', 'Hạ tầng', 'Sản phẩm', 'Phân tích'];

  const rows: string[][] = NAMES.map((name, i) => {
    const emailName = name
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .toLowerCase().replace(/\s+/g, '.');
    return [
      name,
      roles[i % roles.length],
      `${emailName}@company.vn`,
      depts[i % depts.length],
    ];
  });

  return {
    tab_name: 'Thành viên',
    tab_index: 1,
    headers,
    rows,
    row_count: rows.length,
    col_count: headers.length,
  };
}

export function generateMockSheetData(projectId: string): RawSheetData {
  return {
    spreadsheet_id: `mock_${projectId}`,
    title: 'Dữ liệu mô phỏng — TalentNet Demo',
    tabs: [generateTaskTab(), generateMemberTab()],
    access_mode: 'api_key',
  };
}

/**
 * Validates Google Sheets URL format.
 * Moved here from deleted googleSheetsService.ts.
 */
export function validateSheetUrl(url: string): boolean {
  return /https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9-_]+/.test(url);
}

export function extractSpreadsheetId(url: string): string {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : '';
}
