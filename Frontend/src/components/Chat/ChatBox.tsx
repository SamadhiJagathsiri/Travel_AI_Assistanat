import { useEffect, useRef, useState } from "react";

import ChatInput from "./ChatInput";
import ChatWindow from "./ChatWindow";
import { sendMessage } from "../../services/api";
import type { SourceReference } from "../../types/chat";

type Message = {
  id: string;
  sender: "user" | "assistant";
  text: string;
  sources?: SourceReference[];
  isLoading?: boolean;
  isStreaming?: boolean;
};

type PendingPrompt = {
  id: number;
  text: string;
};

type Props = {
  documents: string[];
  onUploadSuccess: () => void;
  onDocumentsChange: (docs: string[]) => void;
  pendingPrompt?: PendingPrompt | null;
  onPromptSelect?: (prompt: string) => void;
  onMessagesChange?: (hasMessages: boolean) => void;
};

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function ChatBox({
  documents,
  onUploadSuccess,
  onDocumentsChange,
  pendingPrompt,
  onPromptSelect,
  onMessagesChange,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const handledPromptIdRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  useEffect(() => {
    if (!pendingPrompt || handledPromptIdRef.current === pendingPrompt.id) return;
    handledPromptIdRef.current = pendingPrompt.id;
    void handleSend(pendingPrompt.text);
  }, [pendingPrompt]);

  useEffect(() => {
    onMessagesChange?.(messages.length > 0);
  }, [messages, onMessagesChange]);

  function updateAssistantMessage(messageId: string, updates: Partial<Message>) {
    setMessages((prev) =>
      prev.map((message) => (message.id === messageId ? { ...message, ...updates } : message))
    );
  }

  async function streamAssistantResponse(messageId: string, fullText: string, sources: SourceReference[] = []) {
    if (!fullText) {
      updateAssistantMessage(messageId, {
        text: "I couldn't generate a response right now.",
        isLoading: false,
        isStreaming: false,
        sources,
      });
      return;
    }

    const chunkSize = 22;
    let index = 0;

    await new Promise<void>((resolve) => {
      const intervalId = window.setInterval(() => {
        index = Math.min(index + chunkSize, fullText.length);
        const partialText = fullText.slice(0, index);

        updateAssistantMessage(messageId, {
          text: partialText,
          isLoading: true,
          isStreaming: true,
          sources,
        });

        if (index >= fullText.length) {
          window.clearInterval(intervalId);
          updateAssistantMessage(messageId, {
            text: fullText,
            isLoading: false,
            isStreaming: false,
            sources,
          });
          resolve();
        }
      }, 20);
    });
  }

  async function handleSend(message: string, options?: { replaceMessageId?: string }) {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isLoading) return;

    let assistantMessageId: string;

    if (options?.replaceMessageId) {
      assistantMessageId = options.replaceMessageId;
      updateAssistantMessage(assistantMessageId, {
        text: "",
        isLoading: true,
        isStreaming: true,
        sources: [],
      });
    } else {
      const userMessage: Message = {
        id: createMessageId(),
        sender: "user",
        text: trimmedMessage,
      };

      const assistantMessage: Message = {
        id: createMessageId(),
        sender: "assistant",
        text: "",
        isLoading: true,
        isStreaming: true,
      };

      assistantMessageId = assistantMessage.id;
      setMessages((prev) => [...prev, userMessage, assistantMessage]);
    }

    setIsLoading(true);

    try {
      const assistantResponse = await sendMessage(trimmedMessage);

      await streamAssistantResponse(
        assistantMessageId,
        assistantResponse.answer,
        assistantResponse.sources ?? []
      );
    } catch (error) {
      console.error("Error sending chat message:", error);

      updateAssistantMessage(assistantMessageId, {
        text: "Sorry, I couldn't get a response from the server. Please try again.",
        isLoading: false,
        isStreaming: false,
        sources: [],
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegenerate(messageId: string) {
    const targetIndex = messages.findIndex((message) => message.id === messageId);
    if (targetIndex < 0) return;

    const previousUserMessage = [...messages.slice(0, targetIndex)]
      .reverse()
      .find((message) => message.sender === "user");
    if (!previousUserMessage) return;

    await handleSend(previousUserMessage.text, { replaceMessageId: messageId });
  }

  return (
    <section className="flex min-h-[720px] flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-xl shadow-slate-200/70">
      <ChatWindow
        messages={messages}
        onRegenerate={handleRegenerate}
        onPromptSelect={onPromptSelect ?? ((prompt) => void handleSend(prompt))}
      />
      <div ref={messagesEndRef} />
      <ChatInput
        onSend={handleSend}
        isLoading={isLoading}
        documents={documents}
        onUploadSuccess={onUploadSuccess}
        onDocumentsChange={onDocumentsChange}
      />
    </section>
  );
}
