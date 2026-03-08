import { useState } from "react";

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

export default function Dashboard({ records, onRemove }) {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

  const byL = { L1: 0, L2: 0, L3: 0 };
  const byR = { R1: 0, R2: 0, R3: 0 };
  records.forEach(r => {
    if (byL[r.lead_grade] !== undefined) byL[r.lead_grade]++;
    if (byR[r.risk_grade] !== undefined) byR[r.risk_grade]++;
  });

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "내보내기 실패");
      }

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      a.href     = url;
      a.download = `법무팀_계약성과관리_${today}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setExportError(e.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-7 gap-2">
        {[
          { label: "전체",  val: records.length, color: "text-indigo-600" },
          { label: "L1",    val: byL.L1,         color: "text-green-600"  },
          { label: "L2",    val: byL.L2,         color: "text-amber-600"  },
          { label: "L3",    val: byL.L3,         color: "text-red-600"    },
          { label: "R1",    val: byR.R1,         color: "text-green-600"  },
          { label: "R2",    val: byR.R2,         color: "text-amber-600"  },
          { label: "R3",    val: byR.R3,         color: "text-red-600"    },
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
                    <span>👤 {r.counterparty}</span>
                    <span>🗂 {r.contract_type}</span>
                    {r.amount > 0 && <span>💰 {r.amount}백만원</span>}
                    {r.assignee && <span>✏️ {r.assignee}</span>}
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
                <button
                  onClick={() => onRemove(r.id)}
                  className="shrink-0 px-2.5 py-1 rounded-lg bg-red-50 border border-red-100 text-red-500 text-xs hover:bg-red-100 transition-colors"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>

          {exportError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-600 text-sm">
              ⚠️ {exportError}
            </div>
          )}

          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            {exporting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Excel 생성 중...
              </>
            ) : (
              <>
                📊 세련된 Excel 보고서 다운로드 ({records.length}건)
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}
