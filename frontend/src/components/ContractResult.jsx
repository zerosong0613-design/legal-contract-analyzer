import RiskTable from "./RiskTable";

const GRADE_STYLE = {
  L1: "bg-green-100 text-green-800 border-green-300",
  L2: "bg-amber-100 text-amber-800 border-amber-300",
  L3: "bg-red-100 text-red-800 border-red-300",
  R1: "bg-green-100 text-green-800 border-green-300",
  R2: "bg-amber-100 text-amber-800 border-amber-300",
  R3: "bg-red-100 text-red-800 border-red-300",
};

const LEAD_LABEL = { L1: "1일 내 검토", L2: "3일 내 검토", L3: "협의 필요" };
const RISK_LABEL = { R1: "저위험", R2: "중위험 · 수정 권고", R3: "고위험 · 즉각 협상 필요" };

function Badge({ grade }) {
  return (
    <span className={`inline-block px-3 py-0.5 rounded-full border text-xs font-bold ${GRADE_STYLE[grade] || "bg-slate-100 text-slate-600 border-slate-300"}`}>
      {grade}
    </span>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm text-slate-800 font-semibold">{value || "—"}</p>
    </div>
  );
}

export default function ContractResult({ result, onAddToLog }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">분석 결과</p>
          <h2 className="text-lg font-bold text-slate-900">{result.title}</h2>
        </div>
        <button
          onClick={() => onAddToLog(result)}
          className="shrink-0 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
        >
          + 로그에 추가
        </button>
      </div>

      {/* Basic info */}
      <div className="grid grid-cols-2 gap-3">
        <InfoCard label="상대방" value={result.counterparty} />
        <InfoCard label="계약 유형" value={result.contract_type} />
        <InfoCard label="계약 기간" value={result.duration} />
        <InfoCard label="계약 금액" value={result.amount > 0 ? `${result.amount}백만원` : "명시 없음"} />
      </div>

      {/* Grade cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">⏱ 리드타임 등급</p>
          <Badge grade={result.lead_grade} />
          <p className="text-xs text-slate-500 mt-2">{LEAD_LABEL[result.lead_grade]}</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">🛡 리스크 등급</p>
          <Badge grade={result.risk_grade} />
          <p className="text-xs text-slate-500 mt-2">{RISK_LABEL[result.risk_grade]}</p>
        </div>
      </div>

      {/* Risk tags */}
      {[result.risk_type_1, result.risk_type_2, result.risk_type_3].filter(Boolean).length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {[result.risk_type_1, result.risk_type_2, result.risk_type_3].filter(Boolean).map((t, i) => (
            <span key={i} className="px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium">
              🏷 {t}
            </span>
          ))}
        </div>
      )}

      {/* Risk table */}
      {result.risks?.length > 0 && <RiskTable risks={result.risks} />}

      {/* Summary */}
      {result.summary && (
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">📝 법무팀 종합 의견</p>
          <p className="text-sm text-slate-700 leading-relaxed">{result.summary}</p>
        </div>
      )}
    </div>
  );
}
