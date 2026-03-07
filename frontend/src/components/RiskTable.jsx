const SEVERITY = {
  high:   { label: "높음", color: "text-red-600",    bg: "bg-red-50",    border: "border-l-red-400" },
  medium: { label: "중간", color: "text-amber-600",  bg: "bg-amber-50",  border: "border-l-amber-400" },
  low:    { label: "낮음", color: "text-green-600",  bg: "bg-green-50",  border: "border-l-green-400" },
};

export default function RiskTable({ risks }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">🔍 주요 리스크 항목</p>
      {risks.map((r, i) => {
        const sv = SEVERITY[r.severity] || SEVERITY.medium;
        return (
          <div key={i} className={`rounded-xl p-4 border-l-4 ${sv.border} bg-slate-50 border border-slate-100`}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm font-bold text-slate-800">{r.category}</span>
              <span className={`text-xs font-semibold ${sv.color} ${sv.bg} px-2 py-0.5 rounded-full`}>
                {sv.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-2">{r.description}</p>
            <p className="text-xs text-indigo-600 font-medium">→ {r.suggestion}</p>
          </div>
        );
      })}
    </div>
  );
}
