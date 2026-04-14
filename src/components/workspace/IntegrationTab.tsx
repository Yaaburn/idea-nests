// ═══════════════════════════════════════════════
// IntegrationTab — Project-Scoped Integration UI
// 3-mode connector: Google OAuth → Bot → CSV/XLSX
// All modes: truthful states, no fake shells.
// ═══════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  Bot,
  LogOut,
  Loader2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Shield,
  Database,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  X,
  FileUp,
  Settings2,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  getIntegrationConfig,
  saveIntegrationConfig,
  removeIntegrationConfig,
} from "@/lib/integrationConfigStore";
import { runIngestionPipeline } from "@/lib/ingestionPipeline";
import {
  startGoogleAuth,
  revokeAuth,
  fetchSheetData,
  uploadFile,
  getBotInfo,
  checkBackendHealth,
  checkGoogleOAuthConfig,
} from "@/lib/connectors/backendConnector";
import { CONNECTOR_MODES, type ConnectorMode } from "@/lib/connectors/types";
import { validateSheetUrl } from "@/lib/ingestion/mockDataGenerator";
import { buildTrustLevelLabel } from "@/lib/ingestion/ReasoningTextBuilder";
import type { CanonicalProjectData } from "@/lib/canonicalTypes";
import * as XLSX from "xlsx";
import type { RawSheetData, RawTab } from "@/lib/ingestion/types";

// ─── Types ───

type Step = "select_mode" | "configure" | "loading" | "preview" | "connected";

interface IntegrationTabProps {
  projectId: string;
  isLeader: boolean;
}

// ─── Client-side CSV/XLSX parser (fallback when backend is down) ───

function parseFileLocally(file: File): Promise<RawSheetData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("Không thể đọc file.");

        const isCSV = file.name.toLowerCase().endsWith(".csv");
        let workbook: XLSX.WorkBook;

        if (isCSV) {
          workbook = XLSX.read(data as string, { type: "string" });
        } else {
          workbook = XLSX.read(data, { type: "array" });
        }

        const tabs: RawTab[] = [];
        workbook.SheetNames.forEach((sheetName, index) => {
          const sheet = workbook.Sheets[sheetName];
          if (!sheet) return;
          const rows2d: string[][] = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            defval: "",
            raw: false,
          }) as string[][];
          if (rows2d.length < 2) return;
          const headers = rows2d[0].map((h) => String(h ?? "").trim());
          const rows = rows2d.slice(1).map((r) => r.map((c) => String(c ?? "").trim()));
          if (headers.filter((h) => h.length > 0).length < 2) return;
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
          reject(new Error("File không chứa dữ liệu hợp lệ. Cần ít nhất 2 hàng dữ liệu và 2 cột có tiêu đề."));
          return;
        }

        resolve({
          spreadsheet_id: `local_${Date.now()}`,
          title: file.name.replace(/\.(csv|xlsx|xls)$/i, ""),
          tabs,
          access_mode: "csv_upload",
        });
      } catch (err) {
        reject(new Error("Không thể đọc file. Hãy kiểm tra định dạng file."));
      }
    };
    reader.onerror = () => reject(new Error("Lỗi đọc file."));
    if (file.name.toLowerCase().endsWith(".csv")) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
}

const ACCEPTED_EXTENSIONS = [".csv", ".xlsx", ".xls"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function validateFile(file: File): string | null {
  const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (!ext || !ACCEPTED_EXTENSIONS.includes(ext)) {
    return `Định dạng không hỗ trợ (${ext || "không rõ"}). Chấp nhận: CSV, XLSX, XLS.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File quá lớn (${(file.size / 1024 / 1024).toFixed(1)}MB). Tối đa 10MB.`;
  }
  if (file.size === 0) {
    return "File rỗng.";
  }
  return null;
}

// ═══════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════

const IntegrationTab = ({ projectId, isLeader }: IntegrationTabProps) => {
  const [step, setStep] = useState<Step>("select_mode");
  const [selectedMode, setSelectedMode] = useState<ConnectorMode | null>(null);
  const [sheetUrl, setSheetUrl] = useState("");
  const [urlValid, setUrlValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CanonicalProjectData | null>(null);
  const [backendReady, setBackendReady] = useState<boolean | null>(null);
  const [googleConfigured, setGoogleConfigured] = useState<boolean | null>(null);
  const [botInfo, setBotInfo] = useState<{ email: string; configured: boolean } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSetupHelp, setShowSetupHelp] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Init: check existing config + backend health ───

  useEffect(() => {
    const existing = getIntegrationConfig(projectId);
    if (existing) {
      setSheetUrl(existing.sheet_url || "");
      setSelectedMode(existing.connector_mode);
      setStep("connected");
    }

    checkBackendHealth().then((healthy) => {
      setBackendReady(healthy);
      if (healthy) {
        checkGoogleOAuthConfig().then(setGoogleConfigured);
        getBotInfo().then(setBotInfo).catch(() => setBotInfo({ email: "", configured: false }));
      } else {
        setGoogleConfigured(false);
        setBotInfo({ email: "", configured: false });
      }
    });
  }, [projectId]);

  // ─── Check for auth callback ───

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authResult = params.get("auth");
    if (authResult === "success") {
      toast.success("Đã kết nối Google thành công!");
      window.history.replaceState({}, "", window.location.pathname);
      setSelectedMode("google_oauth");
      setStep("configure");
    } else if (authResult === "error") {
      setError("Xác thực Google không thành công. Vui lòng thử lại.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // ─── URL Validation ───

  useEffect(() => {
    setUrlValid(validateSheetUrl(sheetUrl));
  }, [sheetUrl]);

  // ─── Handlers ───

  const handleSelectMode = (mode: ConnectorMode) => {
    setSelectedMode(mode);
    setError(null);

    if (mode === "google_oauth") {
      // Preflight: check backend + config before redirect
      if (!backendReady) {
        setError("Backend chưa khởi động. Chạy 'npm run server:dev' trước khi kết nối Google.");
        return;
      }
      if (!googleConfigured) {
        setStep("configure"); // Show blocked state with setup instructions
        return;
      }
      handleGoogleAuth();
    } else if (mode === "service_account") {
      setStep("configure");
    } else {
      setStep("configure");
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const authUrl = await startGoogleAuth(projectId);
      window.location.href = authUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi kết nối Google.");
      setIsLoading(false);
    }
  };

  // ─── File Upload (with local fallback) ───

  const processFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSelectedFile(file);
    setIsLoading(true);
    setError(null);
    setStep("loading");

    try {
      let rawData: RawSheetData;

      if (backendReady) {
        // Backend route: server-side parsing
        try {
          rawData = await uploadFile(projectId, file);
        } catch {
          // Backend failed — fall back to client-side parsing
          rawData = await parseFileLocally(file);
        }
      } else {
        // No backend — always parse locally
        rawData = await parseFileLocally(file);
      }

      const data = await runIngestionPipeline(projectId, { rawData });
      setResult(data);
      setStep("preview");

      saveIntegrationConfig({
        project_id: projectId,
        sheet_url: "",
        provider: "csv_upload",
        connector_mode: "csv_upload",
        sync_interval: 0,
        column_overrides: [],
        configured_by: "current_user",
        configured_at: new Date().toISOString(),
        csv_filename: file.name,
        last_connected_at: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể đọc file.");
      setStep("configure");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input so re-selecting same file triggers onChange
    e.target.value = "";
  };

  // ─── Drag and Drop ───

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [backendReady, projectId]);

  // ─── Google Sheets fetch ───

  const handleFetchSheet = async () => {
    if (!urlValid || !selectedMode) return;
    setIsLoading(true);
    setError(null);
    setStep("loading");

    try {
      const rawData = await fetchSheetData(projectId, sheetUrl);
      const data = await runIngestionPipeline(projectId, { rawData });
      setResult(data);
      setStep("preview");

      saveIntegrationConfig({
        project_id: projectId,
        sheet_url: sheetUrl,
        provider: "google_sheets",
        connector_mode: selectedMode,
        sync_interval: 0,
        column_overrides: [],
        configured_by: "current_user",
        configured_at: new Date().toISOString(),
        last_connected_at: new Date().toISOString(),
      });
    } catch (err: any) {
      if (err.code === "AUTH_REQUIRED") {
        setError("Phiên xác thực đã hết hạn. Vui lòng kết nối lại Google.");
      } else if (err.code === "PERMISSION_DENIED") {
        setError("Không có quyền truy cập sheet này. Hãy kiểm tra quyền chia sẻ.");
      } else if (err.code === "SHEET_NOT_FOUND") {
        setError("Không tìm thấy Google Sheet. Hãy kiểm tra lại URL.");
      } else {
        setError(err instanceof Error ? err.message : "Không thể lấy dữ liệu.");
      }
      setStep("configure");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAndSave = () => {
    setStep("connected");
    toast.success("Đã lưu cấu hình tích hợp!");
  };

  const handleDisconnect = async () => {
    if (selectedMode === "google_oauth") {
      await revokeAuth(projectId).catch(() => {});
    }
    removeIntegrationConfig(projectId);
    setStep("select_mode");
    setSelectedMode(null);
    setSheetUrl("");
    setResult(null);
    setError(null);
    setSelectedFile(null);
    toast("Đã ngắt kết nối.");
  };

  const handleRefresh = async () => {
    const config = getIntegrationConfig(projectId);
    if (!config) return;

    if (config.connector_mode === "csv_upload") {
      toast.info("Chế độ CSV/Excel cần tải lại file để cập nhật.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const rawData = await fetchSheetData(projectId, config.sheet_url);
      const data = await runIngestionPipeline(projectId, { rawData });
      setResult(data);
      toast.success("Đã cập nhật dữ liệu!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi cập nhật.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Leader guard ───

  if (!isLeader) {
    return (
      <div className="p-8 text-center space-y-3">
        <Shield className="w-10 h-10 mx-auto text-muted-foreground/50" />
        <p className="text-muted-foreground text-sm">
          Chỉ trưởng nhóm dự án mới có quyền quản lý tích hợp dữ liệu.
        </p>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // STEP: Select Mode
  // ═══════════════════════════════════════════════

  if (step === "select_mode") {
    const googleMode = CONNECTOR_MODES.find(m => m.id === "google_oauth")!;
    const botMode = CONNECTOR_MODES.find(m => m.id === "service_account")!;
    const csvMode = CONNECTOR_MODES.find(m => m.id === "csv_upload")!;

    const googleBlocked = !backendReady || !googleConfigured;
    const botBlocked = !backendReady || !botInfo?.configured;

    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">Tích hợp dữ liệu</h2>
          <p className="text-sm text-muted-foreground">
            Chọn phương thức kết nối nguồn dữ liệu cho dự án này.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 text-red-700 dark:text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Mode cards */}
        <div className="grid gap-3">
          {/* Google OAuth */}
          <button
            onClick={() => handleSelectMode("google_oauth")}
            disabled={isLoading}
            className={cn(
              "flex items-start gap-4 p-4 rounded-xl border text-left transition-all",
              googleBlocked
                ? "border-border/50 opacity-60"
                : "hover:border-primary/40 hover:bg-accent/30 border-primary/20 bg-primary/5",
              "focus:outline-none focus:ring-2 focus:ring-primary/30",
              isLoading && "cursor-not-allowed"
            )}
          >
            <span className="text-2xl mt-0.5">{googleMode.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-foreground">{googleMode.label_vi}</h3>
                {!googleBlocked && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Đề xuất</Badge>
                )}
                {googleBlocked && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-300">
                    <Settings2 className="w-2.5 h-2.5 mr-0.5" /> Cần cấu hình
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{googleMode.description_vi}</p>
              {googleBlocked && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  {!backendReady ? "Backend chưa khởi động." : "Chưa cấu hình GOOGLE_CLIENT_ID."}
                </p>
              )}
            </div>
          </button>

          {/* Bot TalentNet */}
          <button
            onClick={() => handleSelectMode("service_account")}
            disabled={isLoading}
            className={cn(
              "flex items-start gap-4 p-4 rounded-xl border text-left transition-all",
              botBlocked
                ? "border-border/50 opacity-60"
                : "hover:border-primary/40 hover:bg-accent/30",
              "focus:outline-none focus:ring-2 focus:ring-primary/30",
              isLoading && "cursor-not-allowed"
            )}
          >
            <span className="text-2xl mt-0.5">{botMode.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-foreground">{botMode.label_vi}</h3>
                {botBlocked && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-300">
                    <Settings2 className="w-2.5 h-2.5 mr-0.5" /> Cần cấu hình
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{botMode.description_vi}</p>
              {botBlocked && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  {!backendReady ? "Backend chưa khởi động." : "Chưa cấu hình Service Account email."}
                </p>
              )}
            </div>
          </button>

          {/* CSV/XLSX — always available */}
          <button
            onClick={() => handleSelectMode("csv_upload")}
            disabled={isLoading}
            className={cn(
              "flex items-start gap-4 p-4 rounded-xl border text-left transition-all",
              "hover:border-primary/40 hover:bg-accent/30",
              "focus:outline-none focus:ring-2 focus:ring-primary/30",
              isLoading && "cursor-not-allowed"
            )}
          >
            <span className="text-2xl mt-0.5">{csvMode.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-foreground">{csvMode.label_vi}</h3>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 text-green-700">
                  <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> Sẵn sàng
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{csvMode.description_vi}</p>
            </div>
          </button>
        </div>

        {/* Demo mode fallback */}
        <div className="pt-2 border-t">
          <button
            onClick={() => {
              setIsLoading(true);
              runIngestionPipeline(projectId, { mock: true })
                .then(data => { setResult(data); setStep("preview"); })
                .catch(() => setError("Lỗi tải dữ liệu demo."))
                .finally(() => setIsLoading(false));
            }}
            disabled={isLoading}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {isLoading ? "Đang tải..." : "Hoặc xem demo với dữ liệu mô phỏng →"}
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // STEP: Configure
  // ═══════════════════════════════════════════════

  if (step === "configure") {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <button onClick={() => { setStep("select_mode"); setError(null); setSelectedFile(null); }} className="text-muted-foreground hover:text-foreground text-sm">
            ← Quay lại
          </button>
          <h2 className="text-lg font-semibold text-foreground">
            {CONNECTOR_MODES.find(m => m.id === selectedMode)?.label_vi}
          </h2>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 text-red-700 dark:text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* ─── GOOGLE OAUTH: Blocked state ─── */}
        {selectedMode === "google_oauth" && !googleConfigured && (
          <div className="space-y-4">
            <Card className="p-4 space-y-3 border-amber-300/50">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <Lock className="w-5 h-5" />
                <h3 className="font-medium">Chưa cấu hình Google OAuth</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Để kết nối Google Sheets, cần cấu hình OAuth credentials trong backend server.
              </p>

              <button
                onClick={() => setShowSetupHelp(!showSetupHelp)}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                {showSetupHelp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                Hướng dẫn cấu hình (dành cho developer)
              </button>

              {showSetupHelp && (
                <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg space-y-2 font-mono">
                  <p className="font-sans font-medium text-foreground">Các bước cần thực hiện:</p>
                  <ol className="list-decimal list-inside space-y-1.5 font-sans">
                    <li>Vào <strong>Google Cloud Console</strong> → APIs → Credentials</li>
                    <li>Tạo <strong>OAuth 2.0 Client ID</strong> (loại Web application)</li>
                    <li>Thêm redirect URI: <code className="bg-black/10 dark:bg-white/10 px-1 rounded">http://localhost:3001/api/auth/google/callback</code></li>
                    <li>Enable <strong>Google Sheets API</strong></li>
                    <li>Tạo hoặc sửa file <code className="bg-black/10 dark:bg-white/10 px-1 rounded">.env</code> tại gốc dự án:</li>
                  </ol>
                  <div className="bg-black/5 dark:bg-white/5 p-2 rounded text-[11px]">
                    <div>GOOGLE_CLIENT_ID=your_client_id</div>
                    <div>GOOGLE_CLIENT_SECRET=your_client_secret</div>
                    <div>GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback</div>
                  </div>
                  <p className="font-sans">Sau đó restart backend: <code className="bg-black/10 dark:bg-white/10 px-1 rounded">npm run server:dev</code></p>
                </div>
              )}
            </Card>

            <p className="text-xs text-muted-foreground text-center">
              Hoặc sử dụng chế độ <button onClick={() => handleSelectMode("csv_upload")} className="text-primary hover:underline">Tải lên CSV/Excel</button> — không cần cấu hình thêm.
            </p>
          </div>
        )}

        {/* ─── GOOGLE OAUTH: Authenticated — URL input ─── */}
        {selectedMode === "google_oauth" && googleConfigured && (
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 text-green-700 dark:text-green-400 text-sm">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <p>Đã xác thực Google. Nhập URL Google Sheet để bắt đầu phân tích.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">URL Google Sheet</label>
              <div className="relative">
                <Input
                  value={sheetUrl}
                  onChange={e => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="pr-10"
                />
                {sheetUrl && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {urlValid
                      ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                      : <AlertCircle className="w-4 h-4 text-red-400" />
                    }
                  </div>
                )}
              </div>
              {sheetUrl && !urlValid && (
                <p className="text-xs text-red-500">URL không hợp lệ. Cần có dạng: https://docs.google.com/spreadsheets/d/...</p>
              )}
            </div>

            <Button onClick={handleFetchSheet} disabled={!urlValid || isLoading} className="w-full">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Database className="w-4 h-4 mr-2" />}
              Phân tích dữ liệu
            </Button>
          </div>
        )}

        {/* ─── BOT MODE: Blocked state ─── */}
        {selectedMode === "service_account" && !botInfo?.configured && (
          <div className="space-y-4">
            <Card className="p-4 space-y-3 border-amber-300/50">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <Bot className="w-5 h-5" />
                <h3 className="font-medium">Bot TalentNet chưa được cấu hình</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Chế độ Bot yêu cầu một Google Service Account. Admin hệ thống cần thiết lập trước khi sử dụng.
              </p>

              <button
                onClick={() => setShowSetupHelp(!showSetupHelp)}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                {showSetupHelp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                Hướng dẫn cấu hình (dành cho admin)
              </button>

              {showSetupHelp && (
                <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg space-y-2">
                  <p className="font-medium text-foreground">Thiếu: GOOGLE_SERVICE_ACCOUNT_EMAIL</p>
                  <ol className="list-decimal list-inside space-y-1.5">
                    <li>Vào <strong>Google Cloud Console</strong> → IAM → Service Accounts</li>
                    <li>Tạo Service Account mới</li>
                    <li>Thêm email vào file <code className="bg-black/10 dark:bg-white/10 px-1 rounded">.env</code>:</li>
                  </ol>
                  <div className="bg-black/5 dark:bg-white/5 p-2 rounded font-mono text-[11px]">
                    GOOGLE_SERVICE_ACCOUNT_EMAIL=bot@project.iam.gserviceaccount.com
                  </div>
                  <p>Restart backend sau khi cấu hình.</p>
                </div>
              )}
            </Card>

            <p className="text-xs text-muted-foreground text-center">
              Hoặc sử dụng chế độ <button onClick={() => handleSelectMode("csv_upload")} className="text-primary hover:underline">Tải lên CSV/Excel</button> — không cần cấu hình thêm.
            </p>
          </div>
        )}

        {/* ─── BOT MODE: Configured — Instructions + URL ─── */}
        {selectedMode === "service_account" && botInfo?.configured && (
          <div className="space-y-4">
            <Card className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                <h3 className="font-medium">Hướng dẫn chia sẻ cho Bot</h3>
              </div>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Mở Google Sheet của bạn</li>
                <li>Nhấn <strong>Chia sẻ</strong> (Share)</li>
                <li>Thêm email bot dưới đây với quyền <strong>Người xem</strong> (Viewer)</li>
                <li>Nhập URL sheet vào ô bên dưới</li>
              </ol>
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                <code className="text-xs font-mono flex-1 break-all">{botInfo.email}</code>
                <Button
                  variant="ghost" size="sm"
                  onClick={() => { navigator.clipboard.writeText(botInfo.email); toast.success("Đã copy!"); }}
                  className="text-xs h-7"
                >
                  Copy
                </Button>
              </div>
            </Card>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">URL Google Sheet</label>
              <Input
                value={sheetUrl}
                onChange={e => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
              />
              {sheetUrl && !urlValid && (
                <p className="text-xs text-red-500">URL không hợp lệ.</p>
              )}
            </div>

            <Button onClick={handleFetchSheet} disabled={!urlValid || isLoading} className="w-full">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Database className="w-4 h-4 mr-2" />}
              Xác minh quyền truy cập & Phân tích
            </Button>
          </div>
        )}

        {/* ─── CSV/XLSX UPLOAD: Dropzone ─── */}
        {selectedMode === "csv_upload" && (
          <div className="space-y-4">
            {/* Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragEnter={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all",
                isDragOver
                  ? "border-primary bg-primary/10 scale-[1.01]"
                  : "border-border hover:border-primary/40 hover:bg-accent/20",
                "text-muted-foreground"
              )}
            >
              {isDragOver ? (
                <>
                  <FileUp className="w-8 h-8 text-primary animate-bounce" />
                  <p className="font-medium text-primary">Thả file tại đây</p>
                </>
              ) : selectedFile ? (
                <>
                  <FileSpreadsheet className="w-8 h-8 text-primary" />
                  <div className="text-center">
                    <p className="font-medium text-foreground">{selectedFile.name}</p>
                    <p className="text-xs mt-1">{(selectedFile.size / 1024).toFixed(1)} KB · Nhấn để chọn file khác</p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8" />
                  <div className="text-center">
                    <p className="font-medium text-foreground">Kéo thả hoặc nhấn để chọn file</p>
                    <p className="text-xs mt-1">Hỗ trợ: CSV, XLSX, XLS (tối đa 10MB)</p>
                  </div>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {!backendReady && (
              <div className="flex items-start gap-2 p-2 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <p>Backend không khả dụng — file sẽ được xử lý trực tiếp trên trình duyệt.</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // STEP: Loading
  // ═══════════════════════════════════════════════

  if (step === "loading") {
    return (
      <div className="max-w-2xl mx-auto p-6 flex flex-col items-center justify-center gap-4 py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Đang phân tích cấu trúc dữ liệu...</p>
        <Progress value={65} className="w-48 h-1.5" />
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // STEP: Preview
  // ═══════════════════════════════════════════════

  if (step === "preview" && result) {
    const { source, metadata, derived, warnings, column_mappings } = result;

    return (
      <div className="max-w-2xl mx-auto p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Kết quả phân tích</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setStep("select_mode"); setResult(null); setSelectedFile(null); }}>
              <X className="w-3 h-3 mr-1" /> Hủy
            </Button>
            <Button size="sm" onClick={handleConfirmAndSave}>
              <CheckCircle2 className="w-3 h-3 mr-1" /> Xác nhận & Lưu
            </Button>
          </div>
        </div>

        {/* Mock indicator */}
        {metadata.is_mock && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>Đang hiển thị <strong>dữ liệu mô phỏng</strong>. Kết nối nguồn thực để xem dữ liệu dự án.</p>
          </div>
        )}

        {/* Warnings */}
        {warnings.filter(w => !metadata.is_mock || w.code !== 'PARTIAL_DATA_WARNING').map((w, i) => (
          <div key={i} className={cn(
            "flex items-start gap-2 p-3 rounded-lg text-sm",
            w.severity === "error" ? "bg-red-500/10 text-red-700" : "bg-amber-500/10 text-amber-600"
          )}>
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>{w.message_vi}</p>
          </div>
        ))}

        {/* Source provenance strip */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <FileSpreadsheet className="w-4 h-4 text-primary" />
            <span className="font-medium">{source.spreadsheet_title}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">Tab: {source.tab_used}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              <Shield className="w-3 h-3 mr-1" />
              {buildTrustLevelLabel(source.trust_level)}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {source.row_count_valid} hàng hợp lệ / {source.row_count_raw} tổng
            </Badge>
            {source.access_mode !== "api_key" && (
              <Badge variant="outline" className="text-xs capitalize">
                {source.access_mode.replace("_", " ")}
              </Badge>
            )}
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-primary">{derived.total_tasks}</p>
            <p className="text-xs text-muted-foreground">Công việc</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-primary">{result.members.length}</p>
            <p className="text-xs text-muted-foreground">Thành viên</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-primary">{derived.overall_completion_pct}%</p>
            <p className="text-xs text-muted-foreground">Hoàn thành</p>
          </Card>
        </div>

        {/* Column mappings */}
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3">Ánh xạ cột</h3>
          <div className="space-y-1.5">
            {column_mappings.filter(m => m.canonical_field !== "ignore").slice(0, 8).map((m, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground truncate max-w-[40%]">{m.source_header}</span>
                <span className="text-muted-foreground mx-2">→</span>
                <span className="font-mono text-foreground">{m.canonical_field}</span>
                <Badge variant={m.confidence >= 0.9 ? "default" : "secondary"} className="text-[10px] ml-2">
                  {Math.round(m.confidence * 100)}%
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Advanced Details */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          Chi tiết nâng cao
        </button>

        {showAdvanced && (
          <Card className="p-4 space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Giả thuyết</span>
              <span className="font-mono">{metadata.hypothesis_count}</span>
            </div>
            <div className="flex justify-between">
              <span>Mâu thuẫn</span>
              <span className="font-mono">{metadata.contradiction_count}</span>
            </div>
            <div className="flex justify-between">
              <span>Độ mơ hồ</span>
              <span className="font-mono">{(metadata.ambiguity_score * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Fingerprint</span>
              <span className="font-mono truncate max-w-[50%]">{source.fingerprint_sha256.slice(0, 16)}...</span>
            </div>
            <div className="flex justify-between">
              <span>Lý do chọn tab</span>
            </div>
            <p className="text-foreground/80 bg-muted/50 p-2 rounded">{metadata.tab_selection_reason_vi}</p>
          </Card>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // STEP: Connected
  // ═══════════════════════════════════════════════

  if (step === "connected") {
    const config = getIntegrationConfig(projectId);
    if (!config) {
      setStep("select_mode");
      return null;
    }

    const modeInfo = CONNECTOR_MODES.find(m => m.id === config.connector_mode);

    return (
      <div className="max-w-2xl mx-auto p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Tích hợp dữ liệu</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={cn("w-3 h-3 mr-1", isLoading && "animate-spin")} />
              Cập nhật
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDisconnect} className="text-red-500 hover:text-red-600">
              <LogOut className="w-3 h-3 mr-1" /> Ngắt kết nối
            </Button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 text-red-700 dark:text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{modeInfo?.icon ?? "📊"}</span>
            <div>
              <p className="font-medium text-sm">{modeInfo?.label_vi ?? config.connector_mode}</p>
              <p className="text-xs text-muted-foreground">
                {config.connector_mode === "csv_upload"
                  ? `File: ${config.csv_filename ?? "không rõ"}`
                  : config.sheet_url
                }
              </p>
            </div>
            <Badge variant="default" className="ml-auto text-xs">Đã kết nối</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Kết nối lúc: {config.last_connected_at ? new Date(config.last_connected_at).toLocaleString("vi-VN") : config.configured_at}
          </p>
        </Card>

        {result && (
          <Card className="p-4 space-y-2">
            <h3 className="text-sm font-medium">Phân tích gần nhất</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xl font-bold text-primary">{result.derived.total_tasks}</p>
                <p className="text-[10px] text-muted-foreground">Công việc</p>
              </div>
              <div>
                <p className="text-xl font-bold text-primary">{result.members.length}</p>
                <p className="text-[10px] text-muted-foreground">Thành viên</p>
              </div>
              <div>
                <p className="text-xl font-bold text-primary">{result.derived.overall_completion_pct}%</p>
                <p className="text-[10px] text-muted-foreground">Hoàn thành</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  }

  return null;
};

export default IntegrationTab;
