import { useState } from "react";
import RiskTable from "./RiskTable";

const GRADE_STYLE = {
  L1: "bg-green-100 text-green-800 border-green-300",
  L2: "bg-amber-100 text-amber-800 border-amber-300",
  L3: "bg-red-100 text-red-800 border-red-300",
  R1: "bg-green-100 text-green-800 border-green-300",
  R2: "bg-amber-100 text-amber-800 border-amber-300",
  R3: "bg-red-100 text-red-800 border-red-300",
};

const LEAD_LABEL = { L1: "48시간(2일) 내 검토", L2: "5일 내 검토", L3: "협의 필요" };
const RISK_LABEL = { R1: "저위험", R2: "중위험 · 수정 권고", R3: "고위험 · 즉각 협상 필요" };
const LEAD_GRADES = ["L1", "L2", "L3"];
const RISK_GRADES = ["R1", "R2", "R3"];

function EditableField({ label, value, onChange, type = "text", placeholder = "—" }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">{label}</p>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-slate-800 font-semibold outline-none border-b border-transparent focus:border-indigo-300 transition-colors placeholder-slate-300"
      />
    </div>
  );
}

function GradeSelector({ label, value, options, onChange }) {
  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
      <div className="flex gap-2">
        {options.map((g) => (
          <button key={g} onClick={() => onChange(g)}
            className={`px-3 py-1 rounded-full border text-xs font-bold transition-all ${
              value === g
                ? `${GRADE_STYLE[g]} ring-2 ring-offset-1 ring-current`
                : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
            }`}
          >{g}</button>
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-2">
        {label.includes("리드") ? LEAD_LABEL[value] : RISK_LABEL[value]}
      </p>
    </div>
  );
}

export default function ContractResult({ result, onAddToLog, initialAssignee = "" }) {
  const [draft, setDraft] = useState({ ...result, assignee: initialAssignee });
  const [saved, setSaved] = useState(false);

  const update = (key) => (val) => setDraft((d) => ({ ...d, [key]: val }));

  const handleSave = () => {
    onAddToLog(draft);
    setSaved(true);
  };

  if (saved) {
    return (
      <div className="bg-white rounded-2xl border border-emerald-200 p-6 shadow-sm text-center space-y-4">
        <div className="text-4xl">✅</div>
        <p className="text-slate-700 font-bold">로그에 저장됐습니다</p>
        <p className="text-sm text-slate-400">대시보드에서 누적 현황을 확인하세요</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">분석 결과 — 저장 전 수정 가능</p>
          <input
            value={draft.title || ""}
            onChange={(e) => update("title")(e.target.value)}
            className="text-lg font-bold text-slate-900 bg-transparent outline-none border-b-2 border-transparent focus:border-indigo-400 transition-colors w-full"
            placeholder="계약서 제목"
          />
        </div>
        <button
          onClick={handleSave}
          className="shrink-0 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-colors shadow-sm whitespace-nowrap"
        >
          + 로그에 추가
        </button>
      </div>

      {/* 수정 안내 */}
      <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
        <span className="text-amber-500 text-sm">✏️</span>
        <p className="text-xs text-amber-700">AI 분석 결과를 저장 전에 수정할 수 있습니다. 잘못된 항목이 있으면 직접 고쳐주세요.</p>
      </div>

      {/* 기본 정보 — 당사자 포함 */}
      <div className="grid grid-cols-2 gap-3">
        <EditableField label="우리 측 당사자" value={draft.our_party} onChange={update("our_party")} placeholder="SK케미칼 측 표기" />
        <EditableField label="거래상대방" value={draft.counterparty} onChange={update("counterparty")} />
        <EditableField label="계약 유형" value={draft.contract_type} onChange={update("contract_type")} />
        <EditableField label="계약 기간" value={draft.duration} onChange={update("duration")} />
        <EditableField label="계약 금액 (백만원)" value={draft.amount > 0 ? String(draft.amount) : ""} onChange={(v) => update("amount")(Number(v) || 0)} type="number" placeholder="금액 없음" />
        <EditableField label="담당자" value={draft.assignee} onChange={update("assignee")} placeholder="이름 입력" />
      </div>

      {/* 등급 선택 */}
      <div className="grid grid-cols-2 gap-3">
        <GradeSelector label="⏱ 리드타임 등급" value={draft.lead_grade} options={LEAD_GRADES} onChange={update("lead_grade")} />
        <GradeSelector label="🛡 리스크 등급"   value={draft.risk_grade} options={RISK_GRADES} onChange={update("risk_grade")} />
      </div>

      {/* 리스크 태그 */}
      {[draft.risk_type_1, draft.risk_type_2, draft.risk_type_3].filter(Boolean).length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {[draft.risk_type_1, draft.risk_type_2, draft.risk_type_3].filter(Boolean).map((t, i) => (
            <span key={i} className="px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium">
              🏷 {t}
            </span>
          ))}
        </div>
      )}

      {/* 리스크 테이블 */}
      {draft.risks?.length > 0 && <RiskTable risks={draft.risks} />}

      {/* 종합 의견 */}
      {draft.summary && (
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">📝 법무팀 종합 의견</p>
          <p className="text-sm text-slate-700 leading-relaxed">{draft.summary}</p>
        </div>
      )}
    </div>
  );
}
