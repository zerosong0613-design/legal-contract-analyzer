import { useState, useRef } from "react";

const GRADE_STYLE = {
  L1: "bg-green-100 text-green-800 border-green-300",
  L2: "bg-amber-100 text-amber-800 border-amber-300",
  L3: "bg-red-100 text-red-800 border-red-300",
  R1: "bg-green-100 text-green-800 border-green-300",
  R2: "bg-amber-100 text-amber-800 border-amber-300",
  R3: "bg-red-100 text-red-800 border-red-300",
};

function Badge({ grade }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full border text-xs font-bold ${GRADE_STYLE[grade] || "bg-slate-100 text-slate-600 border-slate-300"}`}>
      {grade}
    </span>
  );
}

// 로그 항목 수정 모달
function EditModal({ record, onSave, onClose }) {
  const [draft, setDraft] = useState({ ...record });
  const u = (key) => (val) => setDraft((d) => ({ ...d, [key]: val }));

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md space-y-4 p-6">
        <h3 className="text-base font-bold text-slate-800">로그 수정</h3>

        {[
          ["계약서 제목", "title"],
          ["우리측 당사자", "our_party"],
          ["거래상대방", "counterparty"],
          ["계약 유형", "contract_type"],
          ["계약 기간", "duration"],
          ["담당자", "assignee"],
          ["메모", "memo"],
        ].map(([label, key]) => (
          <div key={key}>
            <p className="text-xs text-slate-400 font-semibold mb-1">{label}</p>
            <input
              value={draft[key] || ""}
              onChange={(e) => u(key)(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        ))}

        <div>
          <p className="text-xs text-slate-400 font-semibold mb-1">계약 금액 (백만원, 없으면 0)</p>
          <input
            type="number"
            value={draft.amount || 0}
            onChange={(e) => u("amount")(Number(e.target.value))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* 등급 선택 */}
        {[["리드타임 등급", "lead_grade", ["L1","L2","L3"]], ["리스크 등급", "risk_grade", ["R1","R2","R3"]]].map(([label, key, opts]) => (
          <div key={key}>
            <p className="text-xs text-slate-400 font-semibold mb-1">{label}</p>
            <div className="flex gap-2">
              {opts.map((g) => (
                <button key={g} onClick={() => u(key)(g)}
                  className={`px-3 py-1 rounded-full border text-xs font-bold transition-all ${
                    draft[key] === g ? `${GRADE_STYLE[g]} ring-2 ring-offset-1 ring-current` : "bg-white text-slate-400 border-slate-200"
                  }`}
                >{g}</button>
              ))}
            </div>
          </div>
        ))}

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-slate-200 text-sm text-slate-500 hover:bg-slate-50">취소</button>
          <button onClick={() => onSave(draft)} className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold">저장</button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ records, onRemove, onUpdate }) {
  const [exporting, setExporting]   = useState(false);
  const [exportError, setExportError] = useState(null);
  const [editTarget, setEditTarget]  = useState(null);
  const importRef = useRef();

  const byL = { L1: 0, L2: 0, L3: 0 };
  const byR = { R1: 0, R2: 0, R3: 0 };
  records.forEach((r) => {
    if (byL[r.lead_grade] !== undefined) byL[r.lead_grade]++;
    if (byR[r.risk_grade] !== undefined) byR[r.risk_grade]++;
  });

  // Excel 내보내기
  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "내보내기 실패");
      const blob  = await res.blob();
      const url   = URL.createObjectURL(blob);
      const a     = document.createElement("a");
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      a.href = url; a.download = `법무팀_계약성과관리_${today}.xlsx`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setExportError(e.message);
    } finally {
      setExporting(false);
    }
  };

  // JSON 백업
  const handleBackup = () => {
    const blob  = new Blob([JSON.stringify(records, null, 2)], { type: "application/json" });
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    a.href = url; a.download = `contractlens_backup_${today}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  // JSON 복원
  const handleRestore = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!Array.isArray(data)) throw new Error("올바른 백업 파일이 아닙니다.");
        if (window.confirm(`${data.length}건의 로그를 복원합니다. 기존 로그에 추가됩니다.`)) {
          onUpdate([...records, ...data.filter((d) => !records.find((r) => r.id === d.id))]);
        }
      } catch {
        alert("파일을 읽을 수 없습니다. JSON 백업 파일을 선택해주세요.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-4">
      {/* 수정 모달 */}
      {editTarget && (
        <EditModal
          record={editTarget}
          onSave={(updated) => { onUpdate(records.map((r) => r.id === updated.id ? updated : r)); setEditTarget(null); }}
          onClose={() => setEditTarget(null)}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-7 gap-2">
        {[
          { label: "전체", val: records.length,  color: "text-indigo-600" },
          { label: "L1",   val: byL.L1,          color: "text-green-600"  },
          { label: "L2",   val: byL.L2,          color: "text-amber-600"  },
          { label: "L3",   val: byL.L3,          color: "text-red-600"    },
          { label: "R1",   val: byR.R1,          color: "text-green-600"  },
          { label: "R2",   val: byR.R2,          color: "text-amber-600"  },
          { label: "R3",   val: byR.R3,          color: "text-red-600"    },
        ].map(({ label, val, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-3 text-center shadow-sm">
            <p className="text-xs text-slate-400 font-semibold">{label}</p>
            <p className={`text-xl font-black font-mono ${color}`}>{val}</p>
          </div>
        ))}
      </div>

      {records.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-400 shadow-sm">
          <div className="text-4xl mb-3">📂</div>
          <p className="text-sm">아직 분석된 계약서가 없습니다.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {records.map((r, i) => (
              <div key={r.id} className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-start gap-3 shadow-sm">
                <span className="shrink-0 w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-bold text-slate-800">{r.title}</span>
                    <Badge grade={r.lead_grade} />
                    <Badge grade={r.risk_grade} />
                    <span className="text-xs text-slate-400">{r.date}</span>
                  </div>
                  <div className="flex gap-3 text-xs text-slate-500 flex-wrap">
                    {r.our_party && <span>🏢 {r.our_party}</span>}
                    <span>👤 {r.counterparty}</span>
                    <span>🗂 {r.contract_type}</span>
                    {/* 금액 0이면 "-" 표시 */}
                    <span>💰 {r.amount > 0 ? `${r.amount}백만원` : "-"}</span>
                    {r.assignee && <span>✏️ {r.assignee}</span>}
                    {r.memo && <span>📌 {r.memo}</span>}
                  </div>
                  {r.risk_type_1 && (
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {[r.risk_type_1, r.risk_type_2, r.risk_type_3].filter(Boolean).map((t, j) => (
                        <span key={j} className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs">
                          🏷 {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => setEditTarget(r)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs hover:bg-indigo-100 transition-colors"
                  >수정</button>
                  <button
                    onClick={() => onRemove(r.id)}
                    className="px-2.5 py-1 rounded-lg bg-red-50 border border-red-100 text-red-500 text-xs hover:bg-red-100 transition-colors"
                  >삭제</button>
                </div>
              </div>
            ))}
          </div>

          {exportError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-600 text-sm">
              ⚠️ {exportError}
            </div>
          )}

          {/* 버튼 영역 */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            {exporting ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Excel 생성 중...</>
            ) : (
              <>📊 법무팀 계약성과관리 Excel 다운로드 ({records.length}건)</>
            )}
          </button>

          {/* 백업/복원 */}
          <div className="flex gap-2">
            <button
              onClick={handleBackup}
              className="flex-1 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition-colors shadow-sm"
            >
              💾 JSON 백업
            </button>
            <button
              onClick={() => importRef.current.click()}
              className="flex-1 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition-colors shadow-sm"
            >
              📂 JSON 복원
            </button>
            <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleRestore} />
          </div>
          <p className="text-xs text-slate-400 text-center -mt-2">
            브라우저 변경·캐시 삭제 전에 JSON 백업을 권장합니다
          </p>
        </>
      )}
    </div>
  );
}
