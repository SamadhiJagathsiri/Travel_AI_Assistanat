import axios from "axios";
import type { ChatMessageModel, UploadedDocumentsResponse, SourceReference } from "../types/chat";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_URL,
});

export type ChatResponse = {
  response: ChatMessageModel;
};

export async function sendMessage(message: string, activeDocNames: string[] = []): Promise<ChatMessageModel> {
  const { data } = await api.post<ChatResponse>("/chat", {
    message,
    active_doc_names: activeDocNames,
  });
  return data.response;
}

export async function getUploadedDocuments(): Promise<string[]> {
  const { data } = await api.get<UploadedDocumentsResponse>("/upload/documents");
  return data.documents;
}

export async function sendMessageStream(
  message: string,
  activeDocNames: string[],
  onChunk: (text: string) => void,
  onSources: (sources: SourceReference[]) => void
): Promise<void> {
  const response = await fetch(`${API_URL}/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, active_doc_names: activeDocNames }),
  });

  if (!response.ok) {
    throw new Error("Failed to send message");
  }

  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const payload = JSON.parse(line);
        if (payload.type === "sources") {
          onSources(payload.sources);
        } else if (payload.type === "text") {
          onChunk(payload.text);
        }
      } catch (e) {
        console.error("Error parsing stream line:", e);
      }
    }
  }
}
