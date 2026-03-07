import RiskTable from "./RiskTable";

const GRADE_CLASS = {
  L1: "bg-emerald-900/40 text-emerald-300 border-emerald-700",
  L2: "bg-amber-900/40 text-amber-300 border-amber-700",
  L3: "bg-red-900/40 text-red-300 border-red-700",
  R1: "bg-emerald-900/40 text-emerald-300 border-emerald-700",
  R2: "bg-amber-900/40 text-amber-300 border-amber-700",
  R3: "bg-red-900/40 text-red-300 border-red-700",
};

function Badge({ grade }) {
  return (
    <span className={`inline-block px-3 py-0.5 rounded-full border text-xs font-bold font-mono ${GRADE_CLASS[grade] || "bg-slate-800 text-slate-300 border-slate-600"}`}>
      {grade}
    </span>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="bg-slate-950 rounded-xl p-3">
      <p className="text-xs text-slate-500 font-mono mb-1">{label}</p>
      <p className="text-sm text-slate-100 font-medium">{value || "—"}</p>
    </div>
  );
}

export default function ContractResult({ result, onAddToLog }) {
  const leadLabel = { L1: "1일 내 검토", L2: "3일 내 검토", L3: "협의 필요" };
  const riskLabel = { R1: "저위험", R2: "중위험 · 수정 권고", R3: "고위험 · 즉각 협상 필요" };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 animate-fade-in">
      {/* Title + action */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 font-mono tracking-widest mb-1">ANALYSIS RESULT</p>
          <h2 className="text-lg font-bold text-slate-100">{result.title}</h2>
        </div>
        <button
          onClick={() => onAddToLog(result)}
          className="shrink-0 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 rounded-xl text-sm font-bold transition-colors"
        >
          + 로그에 추가
        </button>
      </div>

      {/* Basic info grid */}
      <div className="grid grid-cols-2 gap-3">
        <InfoCard label="상대방" value={result.counterparty} />
        <InfoCard label="계약 유형" value={result.contract_type} />
        <InfoCard label="계약 기간" value={result.duration} />
        <InfoCard label="계약 금액" value={result.amount > 0 ? `${result.amount}백만원` : "명시 없음"} />
      </div>

      {/* Grade cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-950 rounded-xl p-4">
          <p className="text-xs text-slate-500 font-mono mb-2">⏱ 리드타임 등급</p>
          <Badge grade={result.lead_grade} />
          <p className="text-xs text-slate-400 mt-2">{leadLabel[result.lead_grade]}</p>
        </div>
        <div className="bg-slate-950 rounded-xl p-4">
          <p className="text-xs text-slate-500 font-mono mb-2">🛡 리스크 등급</p>
          <Badge grade={result.risk_grade} />
          <p className="text-xs text-slate-400 mt-2">{riskLabel[result.risk_grade]}</p>
        </div>
      </div>

      {/* Risk tags */}
      {[result.risk_type_1, result.risk_type_2, result.risk_type_3].filter(Boolean).length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {[result.risk_type_1, result.risk_type_2, result.risk_type_3].filter(Boolean).map((t, i) => (
            <span key={i} className="px-3 py-1 rounded-lg bg-indigo-950/60 border border-indigo-800 text-indigo-300 text-xs">
              🏷 {t}
            </span>
          ))}
        </div>
      )}

      {/* Risk table */}
      {result.risks?.length > 0 && <RiskTable risks={result.risks} />}

      {/* Summary */}
      {result.summary && (
        <div className="bg-slate-950 rounded-xl p-4">
          <p className="text-xs text-slate-500 font-mono mb-2">📝 법무팀 종합 의견</p>
          <p className="text-sm text-slate-300 leading-relaxed">{result.summary}</p>
        </div>
      )}
    </div>
  );
}
