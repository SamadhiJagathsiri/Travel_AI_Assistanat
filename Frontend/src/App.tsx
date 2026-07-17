import { useState } from "react";
import Header from "./components/Layout/Header";
import UploadCard from "./components/Upload/UploadCard";
import ChatBox from "./components/Chat/ChatBox";

export default function App() {
  const [showSuggestedQuestions, setShowSuggestedQuestions] = useState(false);

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50">
      <Header />

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-5">
          {/* Upload Section - Left Sidebar */}
          <div className="md:col-span-2">
            <UploadCard onUploadSuccess={() => setShowSuggestedQuestions(true)} />
          </div>

          {/* Chat Section - Right Main Content */}
          <div className="md:col-span-3">
            <ChatBox showSuggestedQuestions={showSuggestedQuestions} />
          </div>
        </div>
      </main>
    </div>
  );
}
