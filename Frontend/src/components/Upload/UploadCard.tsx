type Props = {
  onPromptSelect?: (prompt: string) => void;
};

const QUICK_ACTIONS = [
  { icon: "✈️", label: "Plan a Trip", prompt: "Plan a 7-day trip for me." },
  { icon: "🌍", label: "Recommend Destinations", prompt: "Recommend destinations based on beaches, food, and culture." },
  { icon: "💰", label: "Budget Planner", prompt: "Help me estimate a travel budget for my next trip." },
  { icon: "🛂", label: "Visa Information", prompt: "What visa information should I check before traveling?" },
  { icon: "🎒", label: "Packing Tips", prompt: "Create a packing checklist for an international trip." },
];

export default function UploadCard({ onPromptSelect }: Props) {
  return (
    <aside className="h-fit rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-200/70 lg:sticky lg:top-6">
      <h3 className="text-sm font-bold text-slate-950">Quick Actions</h3>
      <div className="mt-3 space-y-2">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => onPromptSelect?.(action.prompt)}
            className="group flex w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-left text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-200 hover:bg-slate-50 hover:shadow-sm"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 transition group-hover:bg-blue-50">
              {action.icon}
            </span>
            {action.label}
          </button>
        ))}
      </div>
    </aside>
  );
}
