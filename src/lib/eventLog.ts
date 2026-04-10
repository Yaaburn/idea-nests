// Event log system for News Feed (US-20)
// Stores structured events that will power the Home News Feed in Sprint 2.

export type EventType =
  | "task_completed"
  | "task_overdue"
  | "subtask_completed"
  | "file_attached"
  | "task_created"
  | "task_moved";

export interface FeedEvent {
  id: string;
  type: EventType;
  timestamp: string;
  actor: string; // user who triggered the event
  projectId?: string;
  data: {
    taskId: string;
    taskTitle: string;
    columnFrom?: string;
    columnTo?: string;
    milestone?: string;
    subtaskTitle?: string;
    subtaskProgress?: string; // e.g. "3/5"
    fileName?: string;
    fileUrl?: string;
  };
}

const STORAGE_KEY = "talentnet_feed_events";
const MAX_EVENTS = 200;

export function getFeedEvents(): FeedEvent[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function logFeedEvent(event: Omit<FeedEvent, "id" | "timestamp">): FeedEvent {
  const full: FeedEvent = {
    ...event,
    id: crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2),
    timestamp: new Date().toISOString(),
  };

  const events = getFeedEvents();
  events.unshift(full);
  // Keep bounded
  if (events.length > MAX_EVENTS) events.length = MAX_EVENTS;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));

  // Dispatch a custom DOM event so other components can react in real-time
  window.dispatchEvent(new CustomEvent("feed-event", { detail: full }));

  return full;
}

// Helper to get overdue tasks from the event log
export function getOverdueEvents(): FeedEvent[] {
  return getFeedEvents().filter(e => e.type === "task_overdue");
}
