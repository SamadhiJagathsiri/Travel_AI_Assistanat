import axios from "axios";
import type { ChatMessageModel, UploadedDocumentsResponse } from "../types/chat";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_URL,
});

export type ChatResponse = {
  response: ChatMessageModel;
};

export async function sendMessage(message: string): Promise<ChatMessageModel> {
  const { data } = await api.post<ChatResponse>("/chat", {
    message,
  });
  return data.response;
}

export async function getUploadedDocuments(): Promise<string[]> {
  const { data } = await api.get<UploadedDocumentsResponse>("/upload/documents");
  return data.documents;
}
