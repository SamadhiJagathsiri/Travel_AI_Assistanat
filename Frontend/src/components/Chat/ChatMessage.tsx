import { useState } from "react";
import AssistantAvatar from "../common/AssistantAvatar";
import type { SourceReference } from "../../types/chat";

type Props = {
  sender: "user" | "assistant";
  text: string;
  sources?: SourceReference[];
  isLoading?: boolean;
  isStreaming?: boolean;
  onRegenerate?: () => void;
};

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3">
      <AssistantAvatar size={48} />
      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500">
        <div className="flex items-center gap-3">
          <span>GlobeGuide AI is thinking...</span>
          <span className="inline-flex gap-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:0.3s]" />
          </span>
        </div>
      </div>
    </div>
  );
}

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    return <span key={index}>{part}</span>;
  });
}

function MarkdownText({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="space-y-2">
      {lines.map((line, index) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={index} className="h-2" />;
        }

        if (/^#{1,3}\s/.test(trimmed)) {
          return (
            <h3 key={index} className="pt-2 text-base font-bold text-slate-950">
              {trimmed.replace(/^#{1,3}\s/, "")}
            </h3>
          );
        }

        if (/^[-*•]\s+/.test(trimmed)) {
          return (
            <div key={index} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
              <p>{renderInlineMarkdown(trimmed.replace(/^[-*•]\s+/, ""))}</p>
            </div>
          );
        }

        if (/^\d+\.\s+/.test(trimmed)) {
          const [number] = trimmed.match(/^\d+/) ?? [String(index + 1)];
          return (
            <div key={index} className="flex gap-2">
              <span className="font-bold text-blue-600">{number}.</span>
              <p>{renderInlineMarkdown(trimmed.replace(/^\d+\.\s+/, ""))}</p>
            </div>
          );
        }

        return <p key={index}>{renderInlineMarkdown(trimmed)}</p>;
      })}
    </div>
  );
}

export default function ChatMessage({
  sender,
  text,
  sources = [],
  isLoading = false,
  isStreaming = false,
  onRegenerate,
}: Props) {
  const isUser = sender === "user";
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"like" | "dislike" | null>(null);
  const [shared, setShared] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  }

  function handleLike() {
    setFeedback((prev) => (prev === "like" ? null : "like"));
  }

  function handleDislike() {
    setFeedback((prev) => (prev === "dislike" ? null : "dislike"));
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "GlobeGuide AI Answer",
          text: text,
        });
        return;
      } catch (error) {
        console.error("Web Share failed, falling back to clipboard:", error);
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setShared(true);
      window.setTimeout(() => setShared(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  }

  if (!isUser && isLoading && !text) {
    return (
      <article className="message-enter flex justify-start">
        <TypingIndicator />
      </article>
    );
  }

  return (
    <article className={`message-enter flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[92%] gap-3 sm:max-w-[84%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        {!isUser && <AssistantAvatar size={48} className="mt-1" />}

        <div
          className={`rounded-[20px] px-5 py-4 text-sm leading-7 transition-all ${
            isUser
              ? "rounded-tr-md bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "rounded-tl-md border border-slate-200 bg-white text-slate-800 shadow-lg shadow-slate-200/70"
          }`}
        >
          <div className={isUser ? "whitespace-pre-wrap" : "prose-travel"}>
            {isUser ? text : <MarkdownText text={text} />}
          </div>

          {!isUser && sources.length > 0 && !isLoading && (
            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold text-blue-800">
                <span>📄</span>
                <span>Based on uploaded guide</span>
              </div>
              <div className="space-y-1">
                {Array.from(new Set(sources.map((s) => s.document))).map((doc) => (
                  <div key={doc} className="text-sm font-semibold text-slate-700">
                    {doc}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isUser && !isLoading && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={handleCopy}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-50"
              >
                📋 {copied ? "Copied" : "Copy"}
              </button>
              <button
                onClick={onRegenerate}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-50"
              >
                🔄 Regenerate
              </button>
              <button
                onClick={handleLike}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:-translate-y-0.5 ${
                  feedback === "like"
                    ? "border-blue-200 bg-blue-50 text-blue-600 shadow-sm shadow-blue-100"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
                title={feedback === "like" ? "Liked" : "Like this response"}
              >
                👍
              </button>
              <button
                onClick={handleDislike}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:-translate-y-0.5 ${
                  feedback === "dislike"
                    ? "border-red-200 bg-red-50 text-red-600 shadow-sm shadow-red-100"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
                title={feedback === "dislike" ? "Disliked" : "Dislike this response"}
              >
                👎
              </button>
              <button
                onClick={handleShare}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:-translate-y-0.5 ${
                  shared
                    ? "border-teal-200 bg-teal-50 text-teal-600"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
                title="Share response"
              >
                {shared ? "✓ Copied" : "🔗 Share"}
              </button>
            </div>
          )}

          {isStreaming && !isUser && text && (
            <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-blue-600">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              Writing
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
