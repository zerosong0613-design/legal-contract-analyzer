import * as XLSX from "xlsx";

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

function exportToExcel(records) {
  const wb = XLSX.utils.book_new();

  // ① 기본 로그
  const headers = ["날짜","계약명","거래상대방","계약유형","등급(L)","등급(R)","리스크유형","계약금액(백만원)","담당자","완료여부","Risk_Type_1","Risk_Type_2","Risk_Type_3"];
  const rows = records.map(r => [
    r.date, r.title, r.counterparty, r.contract_type,
    r.lead_grade, r.risk_grade, r.risk_type_1, r.amount || 0,
    r.assignee || "", "완료",
    r.risk_type_1, r.risk_type_2 || "", r.risk_type_3 || "",
  ]);
  const ws1 = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws1["!cols"] = [10,30,20,15,8,8,15,15,12,10,15,15,15].map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, ws1, "① 기본로그");

  // ② R3 가치 기록
  const r3 = records.filter(r => r.risk_grade === "R3");
  const ws2 = XLSX.utils.aoa_to_sheet([
    ["날짜","계약명","금액(백만원)","상대방","종합의견","개선수준","보고대상"],
    ...r3.map(r => [r.date, r.title, r.amount || 0, r.counterparty, r.summary || "", "1_방어", "Y"]),
  ]);
  XLSX.utils.book_append_sheet(wb, ws2, "② R3 가치기록");

  // ③ 분기 성과 요약
  const byL = { L1: 0, L2: 0, L3: 0 };
  const byR = { R1: 0, R2: 0, R3: 0 };
  const tags = {};
  records.forEach(r => {
    if (byL[r.lead_grade] !== undefined) byL[r.lead_grade]++;
    if (byR[r.risk_grade] !== undefined) byR[r.risk_grade]++;
    [r.risk_type_1, r.risk_type_2, r.risk_type_3].filter(Boolean).forEach(t => {
      tags[t] = (tags[t] || 0) + 1;
    });
  });
  const ws3 = XLSX.utils.aoa_to_sheet([
    ["분기 성과 요약"], ["전체 계약", records.length], [],
    ["리드타임 등급"], ["L1", byL.L1], ["L2", byL.L2], ["L3", byL.L3], [],
    ["리스크 등급"], ["R1", byR.R1], ["R2", byR.R2], ["R3", byR.R3], [],
    ["리스크 태그", "건수"],
    ...Object.entries(tags).sort((a, b) => b[1] - a[1]),
  ]);
  XLSX.utils.book_append_sheet(wb, ws3, "③ 분기성과요약");

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  XLSX.writeFile(wb, `법무팀_계약성과관리_${date}.xlsx`);
}

export default function Dashboard({ records, onRemove }) {
  const byL = { L1: 0, L2: 0, L3: 0 };
  const byR = { R1: 0, R2: 0, R3: 0 };
  records.forEach(r => {
    if (byL[r.lead_grade] !== undefined) byL[r.lead_grade]++;
    if (byR[r.risk_grade] !== undefined) byR[r.risk_grade]++;
  });

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-7 gap-2">
        {[
          { label: "전체", val: records.length, color: "text-indigo-600" },
          { label: "L1", val: byL.L1, color: "text-green-600" },
          { label: "L2", val: byL.L2, color: "text-amber-600" },
          { label: "L3", val: byL.L3, color: "text-red-600" },
          { label: "R1", val: byR.R1, color: "text-green-600" },
          { label: "R2", val: byR.R2, color: "text-amber-600" },
          { label: "R3", val: byR.R3, color: "text-red-600" },
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

          <button
            onClick={() => exportToExcel(records)}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            📊 Excel 대시보드 다운로드 ({records.length}건) → 법무팀_계약성과관리.xlsx
          </button>
        </>
      )}
    </div>
  );
}
