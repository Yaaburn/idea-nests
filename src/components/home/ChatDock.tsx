import { useState, useCallback } from "react";
import FloatingChatWindow from "./FloatingChatWindow";

export interface ChatUser {
  id: string;
  name: string;
  avatar: string;
  online?: boolean;
}

export interface ChatWindow {
  id: string;
  user: ChatUser;
  minimized: boolean;
  unread: number;
}

interface ChatDockProps {
  windows: ChatWindow[];
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onMaximize: (id: string) => void;
  onSendMessage: (windowId: string, message: string) => void;
}

const MAX_VISIBLE_WINDOWS = 3;

const ChatDock = ({
  windows,
  onClose,
  onMinimize,
  onMaximize,
  onSendMessage,
}: ChatDockProps) => {
  const visibleWindows = windows.slice(0, MAX_VISIBLE_WINDOWS);
  const overflowCount = Math.max(0, windows.length - MAX_VISIBLE_WINDOWS);

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-end gap-2">
      {/* Render visible chat windows */}
      {visibleWindows.map((window, index) => (
        <FloatingChatWindow
          key={window.id}
          window={window}
          onClose={() => onClose(window.id)}
          onMinimize={() => onMinimize(window.id)}
          onMaximize={() => onMaximize(window.id)}
          onSendMessage={(message) => onSendMessage(window.id, message)}
        />
      ))}

      {/* Overflow indicator */}
      {overflowCount > 0 && (
        <div className="h-12 px-4 bg-card border rounded-full shadow-lg flex items-center justify-center text-sm font-medium text-muted-foreground hover:bg-muted transition-colors cursor-pointer">
          +{overflowCount} cuộc trò chuyện
        </div>
      )}
    </div>
  );
};

export default ChatDock;
