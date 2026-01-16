import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "clipboard-chat-history";
const MAX_CONVERSATIONS = 10;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
  type?: "text" | "code" | "image";
  imageUrl?: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

const getInitialMessage = (): ChatMessage => ({
  role: "assistant",
  content: "Hello! I'm your AI Assistant. I can help you with:\n\n- **Answering questions** on any topic\n- **Writing and debugging code**\n- **Explaining concepts** clearly\n- **Creative writing** and brainstorming\n- **Generating images** from text descriptions\n\nHow can I assist you today?",
  timestamp: Date.now(),
  type: "text",
});

export const useChatPersistence = (userId: string | null) => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Get current conversation
  const currentConversation = conversations.find(c => c.id === currentConversationId);
  const messages = currentConversation?.messages || [getInitialMessage()];

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ChatConversation[];
        setConversations(parsed);
        if (parsed.length > 0) {
          setCurrentConversationId(parsed[0].id);
        }
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save to localStorage whenever conversations change
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    }
  }, [conversations, loading]);

  // Start a new conversation
  const startNewConversation = useCallback(() => {
    const newConversation: ChatConversation = {
      id: generateId(),
      title: "New Chat",
      messages: [getInitialMessage()],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setConversations(prev => {
      const updated = [newConversation, ...prev].slice(0, MAX_CONVERSATIONS);
      return updated;
    });
    setCurrentConversationId(newConversation.id);
    
    return newConversation.id;
  }, []);

  // Add message to current conversation
  const addMessage = useCallback((message: ChatMessage) => {
    setConversations(prev => {
      return prev.map(conv => {
        if (conv.id === currentConversationId) {
          const updatedMessages = [...conv.messages, { ...message, timestamp: Date.now() }];
          // Update title from first user message
          let title = conv.title;
          if (title === "New Chat" && message.role === "user") {
            title = message.content.slice(0, 40) + (message.content.length > 40 ? "..." : "");
          }
          return {
            ...conv,
            messages: updatedMessages,
            title,
            updatedAt: Date.now(),
          };
        }
        return conv;
      });
    });
  }, [currentConversationId]);

  // Update last assistant message (for streaming)
  const updateLastAssistantMessage = useCallback((content: string, imageUrl?: string) => {
    setConversations(prev => {
      return prev.map(conv => {
        if (conv.id === currentConversationId) {
          const messages = [...conv.messages];
          const lastIndex = messages.length - 1;
          if (lastIndex >= 0 && messages[lastIndex].role === "assistant") {
            messages[lastIndex] = {
              ...messages[lastIndex],
              content,
              imageUrl,
              type: imageUrl ? "image" : "text",
            };
          }
          return { ...conv, messages, updatedAt: Date.now() };
        }
        return conv;
      });
    });
  }, [currentConversationId]);

  // Switch to a conversation
  const switchConversation = useCallback((id: string) => {
    setCurrentConversationId(id);
  }, []);

  // Delete a conversation
  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => {
      const updated = prev.filter(c => c.id !== id);
      if (id === currentConversationId && updated.length > 0) {
        setCurrentConversationId(updated[0].id);
      } else if (updated.length === 0) {
        setCurrentConversationId(null);
      }
      return updated;
    });
  }, [currentConversationId]);

  // Clear current conversation
  const clearCurrentConversation = useCallback(() => {
    if (currentConversationId) {
      setConversations(prev => {
        return prev.map(conv => {
          if (conv.id === currentConversationId) {
            return {
              ...conv,
              messages: [getInitialMessage()],
              title: "New Chat",
              updatedAt: Date.now(),
            };
          }
          return conv;
        });
      });
    }
  }, [currentConversationId]);

  return {
    conversations,
    currentConversation,
    currentConversationId,
    messages,
    loading,
    startNewConversation,
    addMessage,
    updateLastAssistantMessage,
    switchConversation,
    deleteConversation,
    clearCurrentConversation,
  };
};
