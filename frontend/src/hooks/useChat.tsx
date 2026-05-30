import React, { createContext, useContext } from "react";
import { useAuth } from "./useAuth";

interface ChatContextType {
  isConnected: boolean;
  userId: string | null;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return (
    <ChatContext.Provider value={{ isConnected: !!userId, userId }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used within ChatProvider");
  return context;
};
