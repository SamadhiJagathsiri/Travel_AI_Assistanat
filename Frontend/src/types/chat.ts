export type SourceReference = {
  document: string;
  chunk?: number | null;
  page?: string | null;
};

export type ChatMessageModel = {
  answer: string;
  provider: string;
  model: string;
  sources?: SourceReference[];
};

export type UploadedDocumentsResponse = {
  documents: string[];
};
