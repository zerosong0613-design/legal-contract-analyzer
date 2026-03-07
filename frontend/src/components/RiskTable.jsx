const SEVERITY = {
  high:   { label: "높음", bar: "bg-red-500",    text: "text-red-300",    bg: "border-l-red-500" },
  medium: { label: "중간", bar: "bg-amber-400",  text: "text-amber-300",  bg: "border-l-amber-400" },
  low:    { label: "낮음", bar: "bg-emerald-500",text: "text-emerald-300",bg: "border-l-emerald-500" },
};

export default function RiskTable({ risks }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500 font-mono">🔍 주요 리스크 항목</p>
      {risks.map((r, i) => {
        const sv = SEVERITY[r.severity] || SEVERITY.medium;
        return (
          <div key={i} className={`bg-slate-950 rounded-xl p-4 border-l-[3px] ${sv.bg}`}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm font-semibold text-slate-100">{r.category}</span>
              <span className={`text-xs font-bold ${sv.text}`}>{sv.label}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-2">{r.description}</p>
            <p className="text-xs text-indigo-400">→ {r.suggestion}</p>
          </div>
        );
      })}
    </div>
  );
}
