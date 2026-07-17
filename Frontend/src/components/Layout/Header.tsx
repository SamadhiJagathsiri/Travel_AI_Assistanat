import AssistantAvatar from "../common/AssistantAvatar";

function TravelIllustration() {
  return (
    <div className="relative hidden h-28 w-56 overflow-hidden rounded-[24px] border border-white/50 bg-white/70 shadow-lg shadow-blue-900/5 backdrop-blur md:block shrink-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(20,184,166,0.18),transparent_32%),radial-gradient(circle_at_90%_30%,rgba(37,99,235,0.15),transparent_28%)]" />
      <svg viewBox="0 0 320 160" className="absolute inset-0 h-full w-full" role="img" aria-label="Travel map illustration">
        <path
          d="M18 112 C78 68 116 126 165 82 C210 42 242 72 302 40"
          fill="none"
          stroke="#2563EB"
          strokeWidth="4"
          strokeDasharray="10 10"
          strokeLinecap="round"
        />
        <circle cx="72" cy="92" r="22" fill="#DBEAFE" />
        <path d="M72 54c-16 0-29 12-29 28 0 23 29 52 29 52s29-29 29-52c0-16-13-28-29-28z" fill="#2563EB" />
        <circle cx="72" cy="82" r="10" fill="#F8FAFC" />
        <path d="M225 38l58 18-49 13-15 43-17-37-41-14 46-10 18-13z" fill="#14B8A6" />
        <path d="M49 127h86l18-26 24 26h94" fill="none" stroke="#0F172A" strokeWidth="5" strokeLinecap="round" />
        <circle cx="250" cy="104" r="16" fill="#FEF3C7" />
      </svg>
    </div>
  );
}

type Props = {
  collapsed?: boolean;
};

export default function Header({ collapsed = false }: Props) {
  if (collapsed) {
    return (
      <header className="border-b border-slate-200/70 bg-white/90 backdrop-blur-xl py-3.5 transition-all duration-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <AssistantAvatar size={32} />
            <div>
              <h1 className="text-base font-bold text-slate-950">GlobeGuide AI</h1>
              <p className="text-xs text-slate-500 font-medium">Your intelligent travel companion</p>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur-xl py-5 transition-all duration-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-2 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
            <AssistantAvatar size={32} />
            <span>GlobeGuide AI</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Your intelligent travel companion
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-600">
            Plan smarter • Discover destinations • AI itineraries
          </p>
        </div>
        <TravelIllustration />
      </div>
    </header>
  );
}
