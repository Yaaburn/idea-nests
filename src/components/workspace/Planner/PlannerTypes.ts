export type ViewMode = "day" | "week" | "month";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  color: string;
  type: "meeting" | "deadline" | "milestone" | "task";
  attendees?: Attendee[];
  location?: string;
  conferenceLink?: string;
  description?: string;
}

export interface Attendee {
  id: string;
  name: string;
  avatar: string;
  email?: string;
  isExternal?: boolean;
}

export interface QuickEventData {
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  attendees: string[];
  location: string;
  conferenceLink: string;
  description: string;
  color: string;
  notifyEmail: boolean;
  notifyInApp: boolean;
  syncGoogleCalendar: boolean;
}

export interface Reminder {
  id: string;
  title: string;
  time: string;
  status: "urgent" | "normal" | "completed";
}

export interface SmartSuggestion {
  id: string;
  tag: string;
  time: string;
  description: string;
  type: "primary" | "secondary";
}

// Grid constants
export const SLOT_HEIGHT = 16;
export const HOUR_HEIGHT = SLOT_HEIGHT * 4;
export const DAY_START_HOUR = 0;
export const DAY_END_HOUR = 24;
export const TIME_COLUMN_WIDTH = 72;
export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const WEEK_GRID_TEMPLATE = `${TIME_COLUMN_WIDTH}px repeat(7, minmax(0, 1fr))`;
export const DAY_GRID_TEMPLATE = `${TIME_COLUMN_WIDTH}px minmax(0, 1fr)`;

export const EVENT_COLORS = [
  { name: "Lavender", value: "bg-purple-100 text-purple-700 border-purple-400 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-600", hex: "#d8b4fe" },
  { name: "Sky", value: "bg-sky-100 text-sky-700 border-sky-400 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-600", hex: "#7dd3fc" },
  { name: "Mint", value: "bg-emerald-100 text-emerald-700 border-emerald-400 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-600", hex: "#6ee7b7" },
  { name: "Peach", value: "bg-orange-100 text-orange-700 border-orange-400 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-600", hex: "#fdba74" },
  { name: "Rose", value: "bg-rose-100 text-rose-700 border-rose-400 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-600", hex: "#fda4af" },
  { name: "Cyan", value: "bg-cyan-100 text-cyan-700 border-cyan-400 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-600", hex: "#67e8f9" },
  { name: "Amber", value: "bg-amber-100 text-amber-700 border-amber-400 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-600", hex: "#fcd34d" },
  { name: "Indigo", value: "bg-indigo-100 text-indigo-700 border-indigo-400 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-600", hex: "#a5b4fc" },
];

export const mockAttendees: Attendee[] = [
  { id: "1", name: "Sarah J.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150", email: "sarah@example.com" },
  { id: "2", name: "Marcus T.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", email: "marcus@example.com" },
  { id: "3", name: "Maria L.", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150", email: "maria@example.com" },
  { id: "4", name: "James W.", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150", email: "james@example.com" },
  { id: "5", name: "Alex K.", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150", email: "alex@example.com" },
];

export const mockEvents: CalendarEvent[] = [
  {
    id: "1",
    title: "Sprint Planning",
    date: new Date().toISOString().split("T")[0],
    startTime: "10:00",
    endTime: "11:30",
    color: "bg-purple-100 text-purple-700 border-purple-400 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-600",
    type: "meeting",
    attendees: [mockAttendees[0], mockAttendees[1]],
  },
  {
    id: "2",
    title: "Design Review",
    date: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split("T")[0]; })(),
    startTime: "14:00",
    endTime: "15:00",
    color: "bg-sky-100 text-sky-700 border-sky-400 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-600",
    type: "meeting",
    attendees: [mockAttendees[2]],
  },
  {
    id: "3",
    title: "TalentNet",
    date: new Date().toISOString().split("T")[0],
    startTime: "14:15",
    endTime: "15:15",
    color: "bg-cyan-100 text-cyan-700 border-cyan-400 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-600",
    type: "meeting",
    attendees: [mockAttendees[0], mockAttendees[3]],
  },
  {
    id: "4",
    title: "Team Standup",
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "09:30",
    color: "bg-emerald-100 text-emerald-700 border-emerald-400 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-600",
    type: "meeting",
  },
  {
    id: "5",
    title: "Code Review",
    date: (() => { const d = new Date(); d.setDate(d.getDate() + 2); return d.toISOString().split("T")[0]; })(),
    startTime: "11:00",
    endTime: "12:00",
    color: "bg-purple-100 text-purple-700 border-purple-400 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-600",
    type: "task",
  },
];

export const defaultQuickEventData: QuickEventData = {
  date: "",
  startTime: "09:00",
  endTime: "10:00",
  title: "",
  attendees: [],
  location: "",
  conferenceLink: "",
  description: "",
  color: "bg-purple-100 text-purple-700 border-purple-400 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-600",
  notifyEmail: false,
  notifyInApp: true,
  syncGoogleCalendar: false,
};

