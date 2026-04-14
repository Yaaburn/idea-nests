// ═══════════════════════════════════════════════
// Connector Types — Shared between frontend and backend
// ═══════════════════════════════════════════════

export type ConnectorMode = 'google_oauth' | 'service_account' | 'csv_upload';

export interface ConnectorStatus {
  connected: boolean;
  connector_mode: ConnectorMode | null;
  project_id: string;
  expires_at?: number;
  error?: string;
}

export interface BackendApiError {
  error: string;
  message: string;
}

/**
 * Mode descriptions for UI display.
 */
export const CONNECTOR_MODES: Array<{
  id: ConnectorMode;
  label_vi: string;
  description_vi: string;
  icon: string;
  recommended: boolean;
  requires_backend: boolean;
}> = [
  {
    id: 'google_oauth',
    label_vi: 'Kết nối với Google',
    description_vi: 'Đăng nhập Google để truy cập sheet riêng tư. Token được quản lý an toàn bởi server.',
    icon: '🔗',
    recommended: true,
    requires_backend: true,
  },
  {
    id: 'service_account',
    label_vi: 'Bot TalentNet',
    description_vi: 'Chia sẻ quyền xem sheet cho bot. Phù hợp đồng bộ dài hạn cho cả nhóm.',
    icon: '🤖',
    recommended: false,
    requires_backend: true,
  },
  {
    id: 'csv_upload',
    label_vi: 'Tải lên CSV/Excel',
    description_vi: 'Tải file dữ liệu trực tiếp. Không cần kết nối mạng — phù hợp khi cần kiểm soát cao.',
    icon: '📄',
    recommended: false,
    requires_backend: true,
  },
];
