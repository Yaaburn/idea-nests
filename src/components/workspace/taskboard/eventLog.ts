import { EventLog } from "./types";

const STORAGE_KEY = "talentnet_event_log";

export function getEventLogs(): EventLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addEventLog(log: Omit<EventLog, "id" | "timestamp">) {
  const logs = getEventLogs();
  logs.unshift({
    ...log,
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
  });
  // Keep last 200 logs
  if (logs.length > 200) logs.length = 200;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}
