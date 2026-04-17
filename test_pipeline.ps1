# TalentNet Pipeline Diagnostic Test Script
# Tests the 9-Pass pipeline and displays data at each layer.

$API = "http://localhost:3001/api"
$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  TalentNet 9-Pass Pipeline -- Diagnostic Test" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Health Check
Write-Host "[STEP 1] Health Check" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$API/health" -Method GET
    Write-Host "  OK - Server: $($health.status) | Service: $($health.service)" -ForegroundColor Green
}
catch {
    Write-Host "  FAIL - Server not responding. Run: npm run server:dev" -ForegroundColor Red
    exit 1
}

# Step 2: Find project with snapshot
Write-Host ""
Write-Host "[STEP 2] Finding project with active snapshot..." -ForegroundColor Yellow

$foundProjectId = $null

# Try project ID "1" (seen in server logs)
$testIds = @("1", "2", "3")
foreach ($tid in $testIds) {
    try {
        $resp = Invoke-RestMethod -Uri "$API/snapshots/$tid/latest" -Method GET -ErrorAction SilentlyContinue
        if ($resp.found -eq $true) {
            $foundProjectId = $tid
            Write-Host "  Found project: $tid (snapshot: $($resp.snapshot_id))" -ForegroundColor Green
            break
        }
    }
    catch {}
}

if (-not $foundProjectId) {
    Write-Host "  No active snapshot found for test project IDs." -ForegroundColor Yellow
    Write-Host "  Please open http://localhost:8080, create a project, connect Google Sheet, and sync." -ForegroundColor White
    exit 0
}

$PID_TEST = $foundProjectId

# Step 3: BRONZE LAYER
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  LAYER 1: BRONZE (Raw data from Google Sheet)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

try {
    $bronze = Invoke-RestMethod -Uri "$API/snapshots/$PID_TEST/bronze" -Method GET
    if ($bronze.found) {
        $b = $bronze.bronze
        Write-Host "  Total tabs: $($b.total_tabs)" -ForegroundColor White
        Write-Host "  Total rows: $($b.total_rows)" -ForegroundColor White
        Write-Host ""
        foreach ($tab in $b.tabs) {
            Write-Host "  --- Tab: '$($tab.tab_name)' ($($tab.row_count) rows x $($tab.col_count) cols) ---" -ForegroundColor Magenta
            $headerStr = ($tab.headers -join " | ")
            Write-Host "    Headers: $headerStr" -ForegroundColor DarkGray
            $sampleCount = [Math]::Min(2, $tab.rows.Count)
            for ($i = 0; $i -lt $sampleCount; $i++) {
                $cells = @()
                $limit = [Math]::Min(5, $tab.rows[$i].Count)
                for ($j = 0; $j -lt $limit; $j++) {
                    $cells += $tab.rows[$i][$j]
                }
                $rowStr = $cells -join " | "
                Write-Host "    Row ${i}: $rowStr" -ForegroundColor DarkGray
            }
            Write-Host ""
        }
    }
    else {
        Write-Host "  No Bronze data found" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 4: FULL DIAGNOSTIC
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  FULL DIAGNOSTIC: Bronze -> Silver -> Gold" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

try {
    $diag = Invoke-RestMethod -Uri "$API/snapshots/$PID_TEST/diagnostic" -Method GET
    if ($diag.found) {
        Write-Host ""
        Write-Host "  Snapshot: $($diag.snapshot_id)" -ForegroundColor White
        Write-Host "  Version:  $($diag.version)" -ForegroundColor White
        Write-Host "  Source:   $($diag.source_mode)" -ForegroundColor White
        Write-Host "  Created:  $($diag.created_at)" -ForegroundColor White

        # Summary
        Write-Host ""
        Write-Host "  +-- SUMMARY ---------------------------------+" -ForegroundColor Green
        Write-Host "  |  Tasks:           $($diag.summary.task_count)" -ForegroundColor White
        Write-Host "  |  Members:         $($diag.summary.member_count)" -ForegroundColor White
        Write-Host "  |  Master Records:  $($diag.summary.master_task_count)" -ForegroundColor White
        Write-Host "  |  Tabs:            $($diag.summary.tab_count)" -ForegroundColor White
        Write-Host "  |  Confidence:      $($diag.summary.mapping_confidence)" -ForegroundColor White
        Write-Host "  |  Quality:         $($diag.summary.overall_quality)" -ForegroundColor White
        Write-Host "  +--------------------------------------------+" -ForegroundColor Green

        # SILVER LAYER
        $silver = $diag.silver
        Write-Host ""
        Write-Host "  +-- SILVER LAYER ----------------------------+" -ForegroundColor Blue
        Write-Host "  |  Tasks (backward-compat): $($silver.task_count)" -ForegroundColor White
        Write-Host "  |  Members:                 $($silver.member_count)" -ForegroundColor White
        Write-Host "  |  MASTER_TASK_FACT:         $($silver.master_task_fact_count)" -ForegroundColor Yellow
        Write-Host "  |  Column Mappings:          $($silver.column_mappings.Count)" -ForegroundColor White
        Write-Host "  |  Mapping Confidence:       $($silver.mapping_confidence)" -ForegroundColor White
        Write-Host "  +--------------------------------------------+" -ForegroundColor Blue

        # Column Mappings
        if ($silver.column_mappings.Count -gt 0) {
            Write-Host ""
            Write-Host "  COLUMN MAPPINGS:" -ForegroundColor Blue
            foreach ($m in $silver.column_mappings) {
                $conf = [Math]::Round($m.confidence * 100)
                Write-Host "    [$conf%%] '$($m.source_header)' -> $($m.canonical_field) ($($m.detection_method))" -ForegroundColor DarkGray
            }
        }

        # Members
        if ($silver.members.Count -gt 0) {
            Write-Host ""
            Write-Host "  MEMBERS:" -ForegroundColor Blue
            foreach ($mem in $silver.members) {
                $emailStr = ""
                if ($mem.email) { $emailStr = " <$($mem.email)>" }
                $roleStr = ""
                if ($mem.role) { $roleStr = " [$($mem.role)]" }
                Write-Host "    * $($mem.display_name)${emailStr}${roleStr}" -ForegroundColor White
            }
        }

        # MASTER_TASK_FACT
        if ($silver.master_task_fact_count -gt 0 -and $silver.master_task_fact.Count -gt 0) {
            Write-Host ""
            Write-Host "  +-- MASTER_TASK_FACT (Canonical Dataset) ----+" -ForegroundColor Yellow
            Write-Host "  |  Grain: 1 ROW = 1 TASK RECORD PER SNAPSHOT |" -ForegroundColor Yellow
            Write-Host "  +--------------------------------------------+" -ForegroundColor Yellow

            $showCount = [Math]::Min(5, $silver.master_task_fact.Count)
            for ($i = 0; $i -lt $showCount; $i++) {
                $fact = $silver.master_task_fact[$i]
                Write-Host ""
                Write-Host "    -- Record #$($i+1) --" -ForegroundColor Yellow
                Write-Host "    task_id:           $($fact.task_id)" -ForegroundColor White
                Write-Host "    task_name:         $($fact.task_name)" -ForegroundColor White
                Write-Host "    status_normalized: $($fact.status_normalized)" -ForegroundColor White
                Write-Host "    assignee_name:     $($fact.assignee_name)" -ForegroundColor White
                Write-Host "    priority:          $($fact.priority_normalized)" -ForegroundColor White
                Write-Host "    deadline:          $($fact.deadline)" -ForegroundColor White
                Write-Host "    progress_pct:      $($fact.progress_pct)" -ForegroundColor White
                Write-Host "    completion_flag:   $($fact.completion_flag)" -ForegroundColor White
                Write-Host "    blocker_flag:      $($fact.blocker_flag)" -ForegroundColor White
                Write-Host "    delay_days:        $($fact.delay_days)" -ForegroundColor White
                Write-Host "    source_tab:        $($fact.source_tab_name)" -ForegroundColor DarkGray
                Write-Host "    source_row:        $($fact.source_row_index)" -ForegroundColor DarkGray
                Write-Host "    snapshot_id:       $($fact.snapshot_id)" -ForegroundColor DarkGray
            }
            if ($silver.master_task_fact.Count -gt 5) {
                $remaining = $silver.master_task_fact.Count - 5
                Write-Host ""
                Write-Host "    ... and $remaining more records" -ForegroundColor DarkGray
            }
        }
        else {
            Write-Host ""
            Write-Host "  MASTER_TASK_FACT: empty (no data processed yet)" -ForegroundColor Yellow
        }

        # GOLD LAYER
        $gold = $diag.gold
        Write-Host ""
        Write-Host "  +-- GOLD LAYER (Analysis-Ready Views) -------+" -ForegroundColor Magenta
        Write-Host "  |  Generated at: $($gold.generated_at)" -ForegroundColor White
        Write-Host "  |  View count:   $($gold.view_keys.Count)" -ForegroundColor White
        $viewList = $gold.view_keys -join ", "
        Write-Host "  |  Views: $viewList" -ForegroundColor White
        Write-Host "  +--------------------------------------------+" -ForegroundColor Magenta

        foreach ($viewKey in $gold.view_keys) {
            $view = $gold.views.$viewKey
            Write-Host ""
            Write-Host "    [VIEW] $viewKey" -ForegroundColor Magenta
            Write-Host "       Intent:     $($view.intent)" -ForegroundColor White
            Write-Host "       Rows:       $($view.row_count)" -ForegroundColor White
            Write-Host "       Confidence: $($view.confidence)" -ForegroundColor White
            if ($view.explanation_vi) {
                Write-Host "       VI: $($view.explanation_vi)" -ForegroundColor DarkCyan
            }
            if ($view.explanation_en) {
                Write-Host "       EN: $($view.explanation_en)" -ForegroundColor DarkCyan
            }
            if ($view.transformation_formula) {
                Write-Host "       Formula: $($view.transformation_formula)" -ForegroundColor DarkGray
            }
            if ($view.warnings -and $view.warnings.Count -gt 0) {
                $warnStr = $view.warnings -join "; "
                Write-Host "       WARN: $warnStr" -ForegroundColor Yellow
            }
            if ($view.data_sample -and $view.data_sample.Count -gt 0) {
                Write-Host "       Sample data:" -ForegroundColor DarkGray
                foreach ($row in $view.data_sample) {
                    $rowJson = $row | ConvertTo-Json -Depth 1 -Compress
                    if ($rowJson.Length -gt 120) { $rowJson = $rowJson.Substring(0, 117) + "..." }
                    Write-Host "         $rowJson" -ForegroundColor DarkGray
                }
            }
        }

        # Quality
        Write-Host ""
        Write-Host "  +-- QUALITY METRICS -------------------------+" -ForegroundColor Red
        Write-Host "  |  Overall:       $($diag.quality.overall_quality)" -ForegroundColor White
        Write-Host "  |  Completeness:  $($diag.quality.completeness_score)" -ForegroundColor White
        Write-Host "  |  Contradiction: $($diag.quality.contradiction_score)" -ForegroundColor White
        Write-Host "  |  Anomalies:     $($diag.quality.anomaly_count)" -ForegroundColor White
        Write-Host "  +--------------------------------------------+" -ForegroundColor Red
    }
    else {
        Write-Host "  No snapshot found for project $PID_TEST" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 5: Retrieval Index
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  RETRIEVAL INDEX (AI Algorithm Routing)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

try {
    $retrieval = Invoke-RestMethod -Uri "$API/snapshots/$PID_TEST/retrieval-index" -Method GET
    if ($retrieval.found -and $retrieval.retrieval_index.routes) {
        foreach ($route in $retrieval.retrieval_index.routes) {
            $conf = [Math]::Round($route.confidence * 100)
            $avail = "NO"
            if ($route.is_available) { $avail = "YES" }
            Write-Host "  [$avail] $($route.intent_key) -> $($route.recommended_view_key) (${conf}%% confidence)" -ForegroundColor White
            Write-Host "       $($route.explanation)" -ForegroundColor DarkGray
        }
    }
}
catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 6: Save diagnostic JSON files
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  SAVING DIAGNOSTIC FILES" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$outDir = Join-Path $PSScriptRoot "diagnostic_output"
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

try {
    $diagJson = Invoke-RestMethod -Uri "$API/snapshots/$PID_TEST/diagnostic" -Method GET
    $diagJson | ConvertTo-Json -Depth 20 | Out-File (Join-Path $outDir "diagnostic_full.json") -Encoding utf8
    Write-Host "  Saved: diagnostic_full.json (Full Bronze/Silver/Gold)" -ForegroundColor Green

    $silverResp = Invoke-RestMethod -Uri "$API/snapshots/$PID_TEST/silver" -Method GET
    if ($silverResp.found -and $silverResp.silver.master_task_fact) {
        $silverResp.silver.master_task_fact | ConvertTo-Json -Depth 10 | Out-File (Join-Path $outDir "master_task_fact.json") -Encoding utf8
        Write-Host "  Saved: master_task_fact.json (MASTER_TASK_FACT canonical dataset)" -ForegroundColor Green
    }

    $qualResp = Invoke-RestMethod -Uri "$API/snapshots/$PID_TEST/quality" -Method GET
    if ($qualResp.found) {
        $qualResp | ConvertTo-Json -Depth 10 | Out-File (Join-Path $outDir "quality_report.json") -Encoding utf8
        Write-Host "  Saved: quality_report.json" -ForegroundColor Green
    }

    $retResp = Invoke-RestMethod -Uri "$API/snapshots/$PID_TEST/retrieval-index" -Method GET
    if ($retResp.found) {
        $retResp | ConvertTo-Json -Depth 10 | Out-File (Join-Path $outDir "retrieval_index.json") -Encoding utf8
        Write-Host "  Saved: retrieval_index.json" -ForegroundColor Green
    }

    Write-Host ""
    Write-Host "  Output folder: $outDir" -ForegroundColor Cyan
}
catch {
    Write-Host "  ERROR saving files: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  TEST COMPLETE" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor White
Write-Host "  1. Open http://localhost:8080 -> Project -> Analysis" -ForegroundColor White
Write-Host "  2. Open DevTools (F12) -> Network -> filter 'snapshot'" -ForegroundColor White
Write-Host "  3. Check response JSON for Gold layer data" -ForegroundColor White
Write-Host "  4. diagnostic_output/ folder has data for algorithm dev" -ForegroundColor White
Write-Host ""
