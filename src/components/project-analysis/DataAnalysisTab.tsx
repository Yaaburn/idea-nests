// ═══════════════════════════════════════════════
// DataAnalysisTab — Canonical data visualization
// Renders FROM ingested data, NOT from hardcoded mocks
// Phase 4: backend-mediated, connector-agnostic
// ═══════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  RefreshCw,
  Loader2,
  Database,
  AlertCircle,
  CheckCircle2,
  Users,
  ListTodo,
  TrendingUp,
  Clock,
  AlertTriangle,
  BarChart3,
  Link as LinkIcon,
  Shield,
  Info,
  Fingerprint,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { runIngestionPipeline } from "@/lib/ingestionPipeline";
import { getIntegrationConfig, hasIntegrationConfig } from "@/lib/integrationConfigStore";
import { useProjectRole } from "@/hooks/useProjectRole";
import { fetchSheetData } from "@/lib/connectors/backendConnector";
import { buildTrustLevelLabel } from "@/lib/ingestion/ReasoningTextBuilder";
import type { CanonicalProjectData, CanonicalStatus } from "@/lib/canonicalTypes";
import { toast } from "sonner";

interface DataAnalysisTabProps {
  projectId: string;
}

const STATUS_COLORS: Record<CanonicalStatus, string> = {
  todo: "#94a3b8",
  in_progress: "#3b82f6",
  in_review: "#f59e0b",
  done: "#22c55e",
  blocked: "#ef4444",
  cancelled: "#6b7280",
  unknown: "#a78bfa",
};

const STATUS_LABELS: Record<CanonicalStatus, string> = {
  todo: "Chưa bắt đầu",
  in_progress: "Đang làm",
  in_review: "Đang duyệt",
  done: "Hoàn thành",
  blocked: "Bị chặn",
  cancelled: "Đã hủy",
  unknown: "Không rõ",
};

export const DataAnalysisTab = ({ projectId }: DataAnalysisTabProps) => {
  const { isLeader } = useProjectRole(projectId);
  const [data, setData] = useState<CanonicalProjectData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRetryable, setIsRetryable] = useState(false);

  const hasConfig = hasIntegrationConfig(projectId);

  const runIngestion = useCallback(async () => {
    if (!hasConfig) return;
    setLoading(true);
    setError(null);
    setIsRetryable(false);
    try {
      const config = getIntegrationConfig(projectId);

      if (config && config.connector_mode !== "csv_upload" && config.sheet_url) {
        // Try fetching real data via backend
        try {
          const rawData = await fetchSheetData(projectId, config.sheet_url);
          const result = await runIngestionPipeline(projectId, { rawData });
          setData(result);
          return;
        } catch (backendErr: any) {
          if (backendErr.code === "AUTH_REQUIRED") {
            setError("Phiên xác thực đã hết hạn. Vui lòng kết nối lại từ tab Tích hợp.");
            setIsRetryable(false);
            return;
          }
          // Fall through to mock if backend unavailable
          console.warn("[DataAnalysis] Backend fetch failed, falling back to mock:", backendErr.message);
        }
      }

      // Fallback: mock mode
      const result = await runIngestionPipeline(projectId, { mock: true });
      setData(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi không xác định";
      setError(msg);
      setIsRetryable(true);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [projectId, hasConfig]);

  // Run on mount
  useEffect(() => {
    runIngestion();
  }, [runIngestion]);

  // ─── No config: Leader CTA ───
  if (!hasConfig && isLeader) {
    return (
      <Card className="p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-600/10 flex items-center justify-center mx-auto mb-4">
          <Database className="h-8 w-8 text-violet-500" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Chưa kết nối nguồn dữ liệu</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
          Kết nối Google Sheets từ tab <strong>Tích hợp</strong> để xem phân tích dữ liệu tự động.
        </p>
        <Badge variant="outline" className="gap-1">
          <LinkIcon className="h-3 w-3" />
          Đi đến Tích hợp để thiết lập
        </Badge>
      </Card>
    );
  }

  // ─── No config: Member message ───
  if (!hasConfig && !isLeader) {
    return (
      <Card className="p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
          <Shield className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Dữ liệu chưa sẵn sàng</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Trưởng dự án chưa kết nối nguồn dữ liệu. Phân tích sẽ hiển thị khi nguồn dữ liệu đã được cấu hình.
        </p>
      </Card>
    );
  }


  // ─── Loading ───
  if (loading && !data) {
    return (
      <Card className="p-12 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-violet-500 mx-auto mb-4" />
        <p className="font-medium">Đang phân tích dữ liệu...</p>
        <p className="text-sm text-muted-foreground mt-1">
          Hệ thống đang nhận dạng cấu trúc và chuẩn hóa dữ liệu
        </p>
      </Card>
    );
  }

  // ─── Error ───
  if (error) {
    return (
      <Card className="p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-7 w-7 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold mb-2 text-red-600">Lỗi phân tích dữ liệu</h3>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        {isRetryable ? (
          <Button variant="outline" onClick={runIngestion} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Thử lại
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">
            Lỗi này không thể tự khắc phục. Vui lòng kiểm tra URL hoặc quyền truy cập.
          </p>
        )}
      </Card>
    );
  }

  if (!data) return null;

  // ─── Prepare chart data ───
  const statusData = Object.entries(data.derived.tasks_by_status)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      name: STATUS_LABELS[status as CanonicalStatus] || status,
      value: count,
      fill: STATUS_COLORS[status as CanonicalStatus] || "#94a3b8",
    }));

  const assigneeData = Object.entries(data.derived.tasks_by_assignee)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => ({
      name: name.length > 12 ? name.slice(0, 12) + "…" : name,
      fullName: name,
      tasks: count,
      completed: data.derived.completion_rate_by_assignee[name] || 0,
    }));

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-violet-500" />
            Phân tích dữ liệu dự án
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dữ liệu từ {data.source.provider} · Cập nhật {new Date(data.ingested_at).toLocaleString("vi-VN")}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={runIngestion}
          disabled={loading}
          className="gap-1.5"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Làm mới
        </Button>
      </div>

      {/* Source Authenticity Strip */}
      <div className="flex items-center flex-wrap gap-3 px-3 py-2 rounded-lg bg-muted/30 border text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Database className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground">{data.source.spreadsheet_title}</span>
        </div>
        <span>·</span>
        <span>Tab: <strong>{data.source.tab_used}</strong></span>
        <span>·</span>
        <span>{buildTrustLevelLabel(data.source.trust_level)}</span>
        {data.source.tabs_inspected.length > 1 && (
          <>
            <span>·</span>
            <span>{data.source.tabs_inspected.length} tab đã kiểm tra</span>
          </>
        )}
        <div className="flex items-center gap-1">
          <Fingerprint className="h-3 w-3" />
          <span className="font-mono">{data.source.fingerprint_sha256.slice(0, 8)}…</span>
        </div>
        {data.metadata.is_mock && (
          <Badge variant="outline" className="text-[10px] border-yellow-500/30 text-yellow-600">
            Dữ liệu mô phỏng
          </Badge>
        )}
      </div>

      {/* Mock mode warning */}
      {data.metadata.is_mock && (
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 bg-yellow-500/5 border border-yellow-500/20 text-xs text-yellow-700">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
          Đang sử dụng dữ liệu mô phỏng. Cấu hình VITE_GOOGLE_API_KEY để lấy dữ liệu thực từ Google Sheets.
        </div>
      )}

      {/* Contradiction Warning */}
      {data.metadata.contradiction_count > 0 && (
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 bg-yellow-500/5 border border-yellow-500/20 text-xs text-yellow-700">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
          Phát hiện {data.metadata.contradiction_count} tín hiệu mâu thuẫn trong dữ liệu nguồn. Kết quả phân tích có thể chưa chính xác hoàn toàn.
        </div>
      )}

      {/* Warnings */}
      {data.warnings.length > 0 && (
        <div className="space-y-2">
          {data.warnings.map((w, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-xs",
                w.severity === "error" && "bg-red-500/5 border border-red-500/20 text-red-700",
                w.severity === "warning" && "bg-yellow-500/5 border border-yellow-500/20 text-yellow-700",
                w.severity === "info" && "bg-blue-500/5 border border-blue-500/20 text-blue-700"
              )}
            >
              <Info className="h-3.5 w-3.5 flex-shrink-0" />
              {w.message_vi}
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <ListTodo className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">Tổng công việc</span>
          </div>
          <div className="text-2xl font-bold">{data.derived.total_tasks}</div>
          <div className="text-[10px] text-muted-foreground">
            {data.source.rows_skipped > 0 && `${data.source.rows_skipped} hàng bỏ qua`}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-xs text-muted-foreground">Hoàn thành</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{data.derived.overall_completion_pct}%</div>
          <Progress value={data.derived.overall_completion_pct} className="h-1.5 mt-1" />
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-violet-500" />
            <span className="text-xs text-muted-foreground">Thành viên</span>
          </div>
          <div className="text-2xl font-bold">{data.members.length}</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Độ tin cậy</span>
          </div>
          <div className={cn(
            "text-2xl font-bold",
            data.mapping_confidence >= 0.8 && "text-green-600",
            data.mapping_confidence >= 0.5 && data.mapping_confidence < 0.8 && "text-yellow-600",
            data.mapping_confidence < 0.5 && "text-red-600"
          )}>
            {Math.round(data.mapping_confidence * 100)}%
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie */}
        <Card className="p-5">
          <h4 className="font-semibold text-sm mb-4">Phân bổ trạng thái</h4>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
              >
                {statusData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "11px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Assignee Workload Bar */}
        <Card className="p-5">
          <h4 className="font-semibold text-sm mb-4">Khối lượng theo thành viên</h4>
          {assigneeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={assigneeData} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number, name: string) => [
                    value,
                    name === "tasks" ? "Công việc" : "% Hoàn thành",
                  ]}
                />
                <Bar dataKey="tasks" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="tasks" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
              Không có dữ liệu phân công
            </div>
          )}
        </Card>
      </div>

      {/* Overdue & Blocked */}
      {(data.derived.overdue_count > 0 || data.derived.blocked_count > 0) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {data.derived.overdue_count > 0 && (
            <Card className="p-4 border-yellow-500/20 bg-yellow-500/5">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-700">Trễ hạn</span>
              </div>
              <p className="text-2xl font-bold text-yellow-700">{data.derived.overdue_count}</p>
              <p className="text-xs text-yellow-600 mt-1">công việc quá hạn chưa hoàn thành</p>
            </Card>
          )}
          {data.derived.blocked_count > 0 && (
            <Card className="p-4 border-red-500/20 bg-red-500/5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-700">Bị chặn</span>
              </div>
              <p className="text-2xl font-bold text-red-700">{data.derived.blocked_count}</p>
              <p className="text-xs text-red-600 mt-1">công việc đang bị tắc nghẽn</p>
            </Card>
          )}
        </div>
      )}

      {/* Members Detail */}
      {data.members.length > 0 && (
        <Card className="p-5">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-violet-500" />
            Thành viên được nhận dạng ({data.members.length})
          </h4>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.members.map((member) => (
              <div key={member.normalized_key} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-white">
                    {member.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{member.name}</p>
                  {member.role && (
                    <p className="text-[10px] text-muted-foreground truncate">{member.role}</p>
                  )}
                  {member.email && (
                    <p className="text-[10px] text-muted-foreground truncate">{member.email}</p>
                  )}
                </div>
                <div className="ml-auto text-right flex-shrink-0">
                  <div className="text-sm font-bold">
                    {data.derived.tasks_by_assignee[member.name] || 0}
                  </div>
                  <div className="text-[9px] text-muted-foreground">tasks</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Source Provenance Footer */}
      <Card className="p-4 bg-muted/20">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5" />
          <span>
            Nguồn: {data.source.provider} · {data.source.row_count_raw} hàng gốc · {data.source.row_count_valid} hàng hợp lệ
            {data.source.rows_skipped > 0 && ` · ${data.source.rows_skipped} bỏ qua`}
            {" · "}Độ tin cậy ánh xạ: {Math.round(data.mapping_confidence * 100)}%
            {data.metadata.is_mock && " · ⚠ Chế độ mô phỏng"}
          </span>
        </div>
      </Card>
    </div>
  );
};
