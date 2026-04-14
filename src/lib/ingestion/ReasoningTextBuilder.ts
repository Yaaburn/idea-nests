// ═══════════════════════════════════════════════
// Reasoning Text Builder
// Converts technical scores into Vietnamese UI strings.
// ═══════════════════════════════════════════════

import type { TabAnalysis, BestTabSelection, EnhancedColumnMapping } from './SmartSchemaDetector';
import type { ContradictionReport } from './types';

export function buildTabSelectionReason(selection: BestTabSelection): string {
  return selection.explanation_vi;
}

export function buildTabRejectionReason(analysis: TabAnalysis): string {
  const reasons: string[] = [];

  if (analysis.profile.likely_shape === 'summary') {
    reasons.push('Tab này là bảng tổng hợp, không phải danh sách chi tiết');
  }
  if (analysis.profile.likely_shape === 'notes') {
    reasons.push('Tab này chứa ghi chú dạng tự do');
  }
  if (analysis.profile.noise_penalty > 0) {
    reasons.push(`Tên tab "${analysis.tab.tab_name}" gợi ý đây không phải dữ liệu chính`);
  }
  if (analysis.score.final_score < 20) {
    reasons.push('Điểm phát hiện cấu trúc quá thấp');
  }
  if (analysis.tab.row_count < 3) {
    reasons.push('Quá ít dữ liệu (dưới 3 hàng)');
  }

  return reasons.length > 0
    ? `Bỏ qua tab "${analysis.tab.tab_name}": ${reasons.join('; ')}`
    : `Bỏ qua tab "${analysis.tab.tab_name}": điểm không đủ cao`;
}

export function buildMappingReason(mapping: EnhancedColumnMapping): string {
  if (mapping.canonical_field === 'ignore') {
    return 'Không tìm thấy ánh xạ phù hợp';
  }

  const tierLabel =
    mapping.action_tier === 'auto_apply' ? 'Tự động ánh xạ' :
    mapping.action_tier === 'suggest_review' ? 'Đề xuất — cần xác nhận' :
    'Chưa ánh xạ';

  return `${tierLabel}: ${mapping.reasoning}`;
}

export function buildContradictionSummary(report: ContradictionReport): string {
  if (!report.is_contradictory) {
    return 'Không phát hiện mâu thuẫn trong dữ liệu nguồn.';
  }

  const severity =
    report.severity === 'high' ? 'nghiêm trọng' :
    report.severity === 'medium' ? 'vừa phải' :
    'nhẹ';

  return `Phát hiện ${report.contradictions.length} mâu thuẫn (mức ${severity}). ` +
    report.contradictions[0] +
    (report.fallback_recommendation ? `. ${report.fallback_recommendation}` : '');
}

export function buildTrustLevelLabel(trustLevel: string): string {
  switch (trustLevel) {
    case 'public_unverified': return 'Công khai (chưa xác minh chủ sở hữu)';
    case 'authenticated_private_sheet': return 'Riêng tư (đã xác thực)';
    case 'authenticated_user_access': return 'Công khai (đã đăng nhập)';
    case 'service_account_verified': return 'Bot TalentNet (xác thực tự động)';
    case 'csv_upload_unverified': return 'Tải lên thủ công (chưa xác minh)';
    case 'shared_but_unverified_owner': return 'Được chia sẻ (chưa xác minh)';
    case 'insufficient_provenance': return 'Chưa đủ thông tin nguồn gốc';
    default: return 'Không xác định';
  }
}
