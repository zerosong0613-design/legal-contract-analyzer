import { useState, useRef } from "react";
import * as XLSX from "xlsx";

const LEAD_TARGET = { L1: 2, L2: 5, L3: null };

// 한국 공휴일 목록 (매년 업데이트 필요 — 서버에서 계산한 값을 표시하는 보조 함수)
// 프론트엔드에서는 주말만 제외한 영업일로 표시 (공휴일은 Excel에서 정확히 반영됨)
function workingDays(d0, d1) {
  let count = 0;
  const cur = new Date(d0);
  cur.setDate(cur.getDate() + 1);
  while (cur <= d1) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function AchieveBadge({ recvDate, replyDate, leadGrade }) {
  try {
    const d0 = new Date(recvDate);
    const d1 = new Date(replyDate);
    const elapsed = workingDays(d0, d1);
    const target = LEAD_TARGET[leadGrade];
    if (target === null) return <span className="text-slate-400">🤝 협의완료 ({elapsed}영업일)</span>;
    if (elapsed <= target) return <span className="text-green-600 font-semibold">✅ 달성 ({elapsed}/{target}영업일)</span>;
    return <span className="text-red-500 font-semibold">❌ {elapsed-target}일 초과 ({elapsed}/{target}영업일)</span>;
  } catch { return null; }
}

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
function EditModal({ record, onSave, onClose, assigneeOptions = [] }) {
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

        {/* 담당자 - 자동완성 */}
        <div>
          <p className="text-xs text-slate-400 font-semibold mb-1">담당자</p>
          <input
            type="text"
            list="modal-assignee-options"
            value={draft.assignee || ""}
            onChange={(e) => u("assignee")(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
          <datalist id="modal-assignee-options">
            {assigneeOptions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>

        <div>
          <p className="text-xs text-slate-400 font-semibold mb-1">계약 금액 (백만원, 없으면 0)</p>
          <input
            type="number"
            value={draft.amount || 0}
            onChange={(e) => u("amount")(Number(e.target.value))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div>
          <p className="text-xs text-slate-400 font-semibold mb-1">회신일 (검토 완료 후 직접 입력)</p>
          <input
            type="date"
            value={draft.reply_date || ""}
            onChange={(e) => u("reply_date")(e.target.value)}
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
  const [exporting, setExporting]       = useState(false);   // 빠른 Excel
  const [formalExporting, setFormalExporting] = useState(false); // 정식 Excel
  const [formalProgress, setFormalProgress]   = useState("");    // 진행 메시지
  const [exportError, setExportError]   = useState(null);
  const [editTarget, setEditTarget]  = useState(null);
  const importRef = useRef();

  const byL = { L1: 0, L2: 0, L3: 0 };
  const byR = { R1: 0, R2: 0, R3: 0 };
  records.forEach((r) => {
    if (byL[r.lead_grade] !== undefined) byL[r.lead_grade]++;
    if (byR[r.risk_grade] !== undefined) byR[r.risk_grade]++;
  });

  // 영업일 계산 (주말 제외, 공휴일은 Excel 버전에서 정확히 반영)
  const calcWorkingDays = (d0str, d1str) => {
    try {
      const d0 = new Date(d0str), d1 = new Date(d1str);
      let count = 0, cur = new Date(d0);
      cur.setDate(cur.getDate() + 1);
      while (cur <= d1) {
        const dow = cur.getDay();
        if (dow !== 0 && dow !== 6) count++;
        cur.setDate(cur.getDate() + 1);
      }
      return count;
    } catch { return ""; }
  };

  const LEAD_TARGET_MAP = { L1: 2, L2: 5, L3: null };

  // Excel 내보내기 (클라이언트 직접 생성 — 즉시)
  const handleExport = () => {
    setExporting(true);
    setExportError(null);
    try {
      const wb = XLSX.utils.book_new();
      const today = new Date().toLocaleDateString("ko-KR");

      // ── ① 기본 로그 ──────────────────────────────────
      const logHeaders = [
        "수신일","계약명","우리측 당사자","거래상대방","계약유형",
        "리드타임 등급","리스크 등급","리스크 유형",
        "계약금액(백만원)","회신일","소요 영업일","목표 영업일","달성 여부",
        "담당자","메모"
      ];
      const logRows = records.map(r => {
        const elapsed = r.reply_date && r.date ? calcWorkingDays(r.date, r.reply_date) : "";
        const target = LEAD_TARGET_MAP[r.lead_grade];
        let achieved = "";
        if (elapsed !== "") {
          if (target === null) achieved = "협의";
          else achieved = elapsed <= target ? "달성" : `${elapsed - target}일 초과`;
        }
        return [
          r.date || "", r.title || "", r.our_party || "SK케미칼", r.counterparty || "",
          r.contract_type || "", r.lead_grade || "", r.risk_grade || "",
          [r.risk_type_1, r.risk_type_2, r.risk_type_3].filter(Boolean).join(", "),
          r.amount > 0 ? r.amount : 0,
          r.reply_date || "", elapsed, target ?? "협의", achieved,
          r.assignee || "", r.memo || ""
        ];
      });
      const ws1 = XLSX.utils.aoa_to_sheet([
        [`📋 계약 기본 로그 — 생성일: ${today} / 총 ${records.length}건`],
        [],
        logHeaders,
        ...logRows
      ]);
      ws1["!cols"] = [10,28,16,16,14,8,8,20,10,10,8,8,10,14,20].map(w => ({ wch: w }));
      XLSX.utils.book_append_sheet(wb, ws1, "① 기본로그");

      // ── ② 월별 통계 ──────────────────────────────────
      const monthMap = {};
      records.forEach(r => {
        if (!r.date) return;
        const m = r.date.slice(0, 7);
        if (!monthMap[m]) monthMap[m] = { total:0, l1:0, l2:0, l3:0, r1:0, r2:0, r3:0, amount:0, replied:0, achieved:0 };
        monthMap[m].total++;
        if (r.lead_grade === "L1") monthMap[m].l1++;
        if (r.lead_grade === "L2") monthMap[m].l2++;
        if (r.lead_grade === "L3") monthMap[m].l3++;
        if (r.risk_grade === "R1") monthMap[m].r1++;
        if (r.risk_grade === "R2") monthMap[m].r2++;
        if (r.risk_grade === "R3") monthMap[m].r3++;
        monthMap[m].amount += r.amount || 0;
        if (r.reply_date && r.date) {
          const wd = calcWorkingDays(r.date, r.reply_date);
          const td = LEAD_TARGET_MAP[r.lead_grade];
          monthMap[m].replied++;
          if (td === null || wd <= td) monthMap[m].achieved++;
        }
      });
      const monthHeaders = ["월","전체","L1","L2","L3","R1","R2","R3","금액(백만)","회신완료","달성","달성률"];
      const monthRows = Object.keys(monthMap).sort().map(m => {
        const v = monthMap[m];
        const rate = v.replied > 0 ? `${Math.round(v.achieved/v.replied*100)}%` : "-";
        return [m, v.total, v.l1, v.l2, v.l3, v.r1, v.r2, v.r3, v.amount, v.replied, v.achieved, rate];
      });
      const ws2 = XLSX.utils.aoa_to_sheet([
        [`📅 월별 성과 분석 — 생성일: ${today}`], [],
        monthHeaders, ...monthRows
      ]);
      ws2["!cols"] = [10,6,6,6,6,6,6,6,10,8,6,8].map(w => ({ wch: w }));
      XLSX.utils.book_append_sheet(wb, ws2, "② 월별 성과분석");

      // ── ③ 담당자별 통계 ──────────────────────────────
      const assigneeMap = {};
      records.forEach(r => {
        const a = r.assignee || "미지정";
        if (!assigneeMap[a]) assigneeMap[a] = { total:0, l1:0, l2:0, l3:0, r1:0, r2:0, r3:0, amount:0, replied:0, achieved:0 };
        assigneeMap[a].total++;
        if (r.lead_grade === "L1") assigneeMap[a].l1++;
        if (r.lead_grade === "L2") assigneeMap[a].l2++;
        if (r.lead_grade === "L3") assigneeMap[a].l3++;
        if (r.risk_grade === "R1") assigneeMap[a].r1++;
        if (r.risk_grade === "R2") assigneeMap[a].r2++;
        if (r.risk_grade === "R3") assigneeMap[a].r3++;
        assigneeMap[a].amount += r.amount || 0;
        if (r.reply_date && r.date) {
          const wd = calcWorkingDays(r.date, r.reply_date);
          const td = LEAD_TARGET_MAP[r.lead_grade];
          assigneeMap[a].replied++;
          if (td === null || wd <= td) assigneeMap[a].achieved++;
        }
      });
      const aHeaders = ["담당자","전체","L1","L2","L3","R1","R2","R3","금액(백만)","회신완료","달성","달성률"];
      const aRows = Object.keys(assigneeMap).sort().map(a => {
        const v = assigneeMap[a];
        const rate = v.replied > 0 ? `${Math.round(v.achieved/v.replied*100)}%` : "-";
        return [a, v.total, v.l1, v.l2, v.l3, v.r1, v.r2, v.r3, v.amount, v.replied, v.achieved, rate];
      });
      const ws3 = XLSX.utils.aoa_to_sheet([
        [`👤 담당자별 성과 분석 — 생성일: ${today}`], [],
        aHeaders, ...aRows
      ]);
      ws3["!cols"] = [16,6,6,6,6,6,6,6,10,8,6,8].map(w => ({ wch: w }));
      XLSX.utils.book_append_sheet(wb, ws3, "③ 담당자별 현황");

      // 다운로드
      const today2 = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      XLSX.writeFile(wb, `법무팀_계약성과관리_${today2}.xlsx`);
    } catch (e) {
      setExportError(e.message);
    } finally {
      setExporting(false);
    }
  };

  // 정식 Excel 내보내기 (백엔드 Python — 공휴일 반영 + 스타일링)
  const handleFormalExport = async () => {
    setFormalExporting(true);
    setExportError(null);
    setFormalProgress("서버 연결 중... (최대 1분 소요)");
    const STEPS = [
      [8000,  "데이터 전송 완료, Excel 생성 중..."],
      [20000, "시트 생성 중..."],
      [40000, "차트·스타일 적용 중..."],
      [60000, "거의 완료됐어요..."],
    ];
    const timers = STEPS.map(([ms, msg]) => setTimeout(() => setFormalProgress(msg), ms));
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90000); // 90초
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "내보내기 실패");
      const blob  = await res.blob();
      const url   = URL.createObjectURL(blob);
      const a     = document.createElement("a");
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      a.href = url; a.download = `법무팀_계약성과관리_정식_${today}.xlsx`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      if (e.name === "AbortError") {
        setExportError("서버 응답 시간 초과 (90초). 잠시 후 다시 시도해 주세요.");
      } else {
        setExportError(e.message);
      }
    } finally {
      timers.forEach(clearTimeout);
      setFormalExporting(false);
      setFormalProgress("");
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
          assigneeOptions={[...new Set(records.map(r => r.assignee).filter(Boolean))].sort()}
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
                    <span>💰 {r.amount > 0 ? `${r.amount}백만원` : "-"}</span>
                    {r.assignee && <span>✏️ {r.assignee}</span>}
                    {r.reply_date
                      ? <AchieveBadge recvDate={r.date} replyDate={r.reply_date} leadGrade={r.lead_grade} />
                      : <span className="text-slate-300">회신일 미입력</span>}
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

          {/* 버튼 영역 — 빠른 Excel / 정식 Excel */}
          <div className="flex gap-2">
            {/* 빠른 Excel: 브라우저 즉시 생성 */}
            <button
              onClick={handleExport}
              disabled={exporting || formalExporting}
              className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              {exporting
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />생성 중...</>
                : <>⚡ 빠른 Excel<span className="text-white/70 text-xs font-normal">(즉시)</span></>
              }
            </button>

            {/* 정식 Excel: 백엔드 Python — 공휴일 반영 + 차트 스타일 */}
            <button
              onClick={handleFormalExport}
              disabled={exporting || formalExporting}
              className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              {formalExporting
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span className="text-xs">{formalProgress}</span></>
                : <>📊 정식 Excel<span className="text-white/70 text-xs font-normal">(공휴일·차트)</span></>
              }
            </button>
          </div>

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
