import { useRef, useState } from "react";
import { api } from "../../services/api";

type Props = {
  onSend: (message: string) => void | Promise<void>;
  isLoading?: boolean;
  documents: string[];
  onUploadSuccess: () => void;
  onDocumentsChange: (docs: string[]) => void;
};

export default function ChatInput({
  onSend,
  isLoading = false,
  documents,
  onUploadSuccess,
  onDocumentsChange,
}: Props) {
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSend() {
    if (!message.trim() || isLoading) return;

    void onSend(message);
    setMessage("");
  }

  function handleAttachmentClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files?.length) return;

    const file = files[0];
    if (file.type !== "application/pdf") {
      setIsError(true);
      setFeedbackMessage("Please select a PDF file.");
      return;
    }

    try {
      setUploading(true);
      setFeedbackMessage(null);
      setIsError(false);

      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const originalName = response.data.original_filename || file.name;
      onDocumentsChange([...documents, originalName]);
      setIsError(false);
      setFeedbackMessage(
        `📄 ${originalName} uploaded successfully.\n\nGlobeGuide AI will use it only when it is relevant.`
      );
      onUploadSuccess();

      // Automatically hide the notification after 4 seconds
      setTimeout(() => {
        setFeedbackMessage((prev) =>
          prev?.includes(originalName) ? null : prev
        );
      }, 4000);
    } catch (error) {
      console.error(error);
      setIsError(true);
      setFeedbackMessage("Upload failed. Please try again.");
      setTimeout(() => {
        setFeedbackMessage((prev) =>
          prev?.includes("failed") ? null : prev
        );
      }, 4000);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleRemove(docName: string) {
    onDocumentsChange(documents.filter((doc) => doc !== docName));
  }

  return (
    <div className="border-t border-slate-100 bg-white/90 p-4 backdrop-blur-xl sm:p-5">
      <div className="mx-auto max-w-4xl">
        {/* Upload Feedback temporary notification */}
        {feedbackMessage && (
          <div
            className={`mb-3 rounded-2xl p-3 text-sm font-medium border transition-all duration-200 ${
              isError
                ? "bg-red-50 text-red-700 border-red-100"
                : "bg-teal-50 text-teal-800 border-teal-100"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="whitespace-pre-line">{feedbackMessage}</div>
              <button
                type="button"
                onClick={() => setFeedbackMessage(null)}
                className="text-slate-400 hover:text-slate-600 transition font-bold"
              >
                &times;
              </button>
            </div>
          </div>
        )}

        {/* Uploaded File Indicator badges */}
        {documents.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {documents.map((doc) => (
              <div
                key={doc}
                className="flex items-center gap-1.5 rounded-full bg-teal-50 border border-teal-100/80 px-3 py-1.5 text-xs font-semibold text-teal-800 shadow-sm"
              >
                <span>📄 {doc}</span>
                <span className="text-teal-600">✓</span>
                <button
                  type="button"
                  onClick={() => handleRemove(doc)}
                  className="ml-1 text-slate-400 hover:text-red-500 transition font-bold text-sm"
                  title="Remove from session"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/80 transition focus-within:border-blue-300 focus-within:shadow-blue-100">
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={handleAttachmentClick}
              disabled={uploading}
              title="Upload travel guide (PDF)"
              className="mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg text-slate-500 transition hover:bg-slate-100 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? (
                <svg
                  className="animate-spin h-5 w-5 text-blue-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                "📎"
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <textarea
              className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-2 py-3 text-base leading-6 text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-70"
              placeholder="Ask anything about travel..."
              value={message}
              rows={1}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !isLoading) {
                  event.preventDefault();
                  handleSend();
                }
              }}
              disabled={isLoading}
            />

            <button
              onClick={handleSend}
              disabled={isLoading || !message.trim()}
              className="mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-xl text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              title="Send"
            >
              ➤
            </button>
          </div>
        </div>
        <p className="mt-2 text-center text-xs text-slate-400">
          GlobeGuide AI can use uploaded guides when they are relevant.
        </p>
      </div>
    </div>
  );
}
