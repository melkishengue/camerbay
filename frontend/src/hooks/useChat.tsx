import { apiClient } from "@/lib/axios-api-client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { StreamChat, UserResponse } from "stream-chat";
import {
  Chat,
  Streami18n,
  frTranslations,
  useCreateChatClient
} from "stream-chat-expo";
import { useAuth } from "./useAuth";

export const streami18n = new Streami18n({
  language: "fr"
});
streami18n.registerTranslation("fr", frTranslations);

interface ChatContextType {
  isConnected: boolean;
  chatClient: StreamChat | null;
  userId: string | null;
  error: string | null;
}

interface ChatData {
  token: string;
  userId: string;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Inner component that only renders when we have chat data
const ChatProviderInner: React.FC<{
  children: React.ReactNode;
  chatData: ChatData;
  userName: string;
  userImage?: string;
  onError: (error: string) => void;
}> = ({ children, chatData, userName, userImage, onError }) => {
  const chatClient = useCreateChatClient({
    apiKey: process.env.EXPO_PUBLIC_STREAM_API_KEY as string,
    userData: {
      id: chatData.userId,
      name: userName,
      image: userImage
    } as UserResponse,
    tokenOrProvider: chatData.token
  });

  // If client fails to initialize, notify parent and render children without chat
  useEffect(() => {
    if (!chatClient) {
      const timeout = setTimeout(() => {
        onError("Failed to initialize chat client");
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    }
  }, [chatClient, onError]);

  if (!chatClient) {
    // Render children without chat wrapper while client initializes
    return (
      <ChatContext.Provider
        value={{ isConnected: false, chatClient: null, userId: null, error: null }}
      >
        {children}
      </ChatContext.Provider>
    );
  }

  return (
    <ChatContext.Provider
      value={{ isConnected: true, chatClient, userId: chatData.userId, error: null }}
    >
      <Chat client={chatClient} i18nInstance={streami18n}>
        {children}
      </Chat>
    </ChatContext.Provider>
  );
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [chatData, setChatData] = useState<ChatData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user, accessToken } = useAuth();

  useEffect(() => {
    const initChat = async () => {
      if (user && accessToken) {
        try {
          const response = await apiClient.get<ChatData>("/api/v1/chat/token");

          const { token, userId } = response.data;

          setChatData({ token, userId });
          setError(null);
        } catch (error) {

          setError(
            error instanceof Error ? error.message : "Failed to initialize chat"
          );
        }
      }
    };

    initChat();
  }, [user, accessToken]);

  // If we don't have chat data or it failed, render children without chat functionality
  if (!chatData || !user || error) {
    return (
      <ChatContext.Provider
        value={{ isConnected: false, chatClient: null, userId: null, error }}
      >
        {children}
      </ChatContext.Provider>
    );
  }

  return (
    <ChatProviderInner
      chatData={chatData}
      userName={user.name || user.businessName || user.username}
      userImage={user.profilePhotoUrl}
      onError={setError}
    >
      {children}
    </ChatProviderInner>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used within ChatProvider");
  return context;
};
