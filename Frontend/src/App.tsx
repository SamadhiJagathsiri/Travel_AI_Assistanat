import { useState } from "react";
import Header from "./components/Layout/Header";
import UploadCard from "./components/Upload/UploadCard";
import ChatBox from "./components/Chat/ChatBox";

type PendingPrompt = {
  id: number;
  text: string;
};

export default function App() {
  const [documents, setDocuments] = useState<string[]>([]);
  const [pendingPrompt, setPendingPrompt] = useState<PendingPrompt | null>(null);

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-8 md:grid-cols-5">
          <div className="md:col-span-2">
            <UploadCard
              onPromptSelect={(prompt) => setPendingPrompt({ id: Date.now(), text: prompt })}
            />
          </div>

          <div className="md:col-span-3">
            <ChatBox
              documents={documents}
              onUploadSuccess={() => {}}
              onDocumentsChange={setDocuments}
              pendingPrompt={pendingPrompt}
            />
          </div>
        </div>
      </main>
    </div>
  );
}