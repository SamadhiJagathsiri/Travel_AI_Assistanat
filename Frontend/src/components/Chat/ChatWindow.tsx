import ChatMessage from "./ChatMessage";
import AssistantAvatar from "../common/AssistantAvatar";
import type { SourceReference } from "../../types/chat";

type Message = {
  id: string;
  sender: "user" | "assistant";
  text: string;
  sources?: SourceReference[];
  isLoading?: boolean;
  isStreaming?: boolean;
};

type Props = {
  messages: Message[];
  onRegenerate: (messageId: string) => void;
  onPromptSelect: (prompt: string) => void;
};

const EMPTY_PROMPTS = [
  { icon: "✈️", prompt: "Plan a 7-day trip to Japan" },
  { icon: "🏖", prompt: "Recommend hidden beaches in Sri Lanka" },
  { icon: "🍜", prompt: "What local foods should I try in South Korea?" },
  { icon: "💰", prompt: "Estimate a budget for Switzerland" },
  { icon: "🗺", prompt: "Create a 10-day Italy itinerary" },
];

function EmptyChatState({ onPromptSelect }: { onPromptSelect: (prompt: string) => void }) {
  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-4 py-6 text-center select-none">
      <AssistantAvatar size={48} className="mb-3" />
      <p className="text-sm font-semibold text-blue-700">Hi, I'm GlobeGuide AI</p>
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
        Where should we go next?
      </h2>
      <p className="mt-2.5 max-w-2xl text-sm leading-6 text-slate-600 font-medium">
        I'm here to help you plan trips, discover destinations, answer travel questions, and use uploaded travel guides whenever they're relevant.
      </p>

      <div className="mt-6 grid w-full gap-3 sm:grid-cols-2">
        {EMPTY_PROMPTS.map((item) => (
          <button
            key={item.prompt}
            onClick={() => onPromptSelect(item.prompt)}
            className="group flex items-center gap-3 rounded-[20px] border border-slate-200 bg-white p-3.5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md hover:shadow-blue-50"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl transition group-hover:bg-blue-50">
              {item.icon}
            </span>
            <p className="text-xs sm:text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition line-clamp-2">
              {item.prompt}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ChatWindow({ messages, onRegenerate, onPromptSelect }: Props) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FAFC_100%)]">
      <div className="travel-scroll flex-1 overflow-y-auto px-4 py-5 sm:px-7">
        {messages.length === 0 ? (
          <EmptyChatState onPromptSelect={onPromptSelect} />
        ) : (
          <div className="mx-auto max-w-4xl space-y-5">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                sender={message.sender}
                text={message.text}
                sources={message.sources ?? []}
                isLoading={message.isLoading}
                isStreaming={message.isStreaming}
                onRegenerate={message.sender === "assistant" ? () => onRegenerate(message.id) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
