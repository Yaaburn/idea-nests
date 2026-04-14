// ═══════════════════════════════════════════════
// Connector Error Types
// Single typed error class for the entire connector layer.
// All userMessage strings are Vietnamese.
// ═══════════════════════════════════════════════

export type ConnectorErrorCode =
  | 'INVALID_URL'
  | 'AUTH_REQUIRED'
  | 'PERMISSION_DENIED'
  | 'SHEET_NOT_FOUND'
  | 'EMPTY_DATA'
  | 'QUOTA_EXCEEDED'
  | 'NETWORK_ERROR'
  | 'UNSUPPORTED_STRUCTURE'
  | 'AUTH_TIMEOUT';

const ERROR_MESSAGES: Record<ConnectorErrorCode, string> = {
  INVALID_URL: 'URL Google Sheet không hợp lệ. Vui lòng kiểm tra lại đường dẫn.',
  AUTH_REQUIRED: 'Sheet này yêu cầu đăng nhập Google để truy cập.',
  PERMISSION_DENIED: 'Bạn không có quyền xem sheet này. Vui lòng yêu cầu chủ sheet chia sẻ quyền xem.',
  SHEET_NOT_FOUND: 'Không tìm thấy Google Sheet từ đường dẫn đã cung cấp.',
  EMPTY_DATA: 'Google Sheet không có đủ dữ liệu để phân tích. Cần ít nhất 3 hàng và 2 cột.',
  QUOTA_EXCEEDED: 'Hệ thống gọi Google Sheets quá nhiều lần. Vui lòng thử lại sau 1 phút.',
  NETWORK_ERROR: 'Không thể kết nối tới Google Sheets. Kiểm tra kết nối mạng và thử lại.',
  UNSUPPORTED_STRUCTURE: 'Đã lấy được dữ liệu nhưng không xác định được cấu trúc phù hợp để phân tích.',
  AUTH_TIMEOUT: 'Hết thời gian chờ đăng nhập. Vui lòng thử lại.',
};

const RETRYABLE_CODES: Set<ConnectorErrorCode> = new Set([
  'QUOTA_EXCEEDED',
  'NETWORK_ERROR',
]);

export class ConnectorError extends Error {
  public readonly code: ConnectorErrorCode;
  public readonly userMessage: string;
  public readonly retryable: boolean;

  constructor(
    code: ConnectorErrorCode,
    userMessage?: string,
    retryable?: boolean
  ) {
    const msg = userMessage ?? ERROR_MESSAGES[code];
    super(msg);
    this.name = 'ConnectorError';
    this.code = code;
    this.userMessage = msg;
    this.retryable = retryable ?? RETRYABLE_CODES.has(code);
  }
}
