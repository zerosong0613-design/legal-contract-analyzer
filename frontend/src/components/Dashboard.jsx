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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
        {/* 헤더 */}
        <div className="px-6 pt-5 pb-2 shrink-0">
          <h3 className="text-base font-bold text-slate-800">로그 수정</h3>
        </div>
        {/* 스크롤 영역 */}
        <div className="overflow-y-auto px-6 pb-2 space-y-4 flex-1">

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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-slate-400 font-semibold mb-1">📅 수신일</p>
            <input
              type="date"
              value={draft.date || ""}
              onChange={(e) => u("date")(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold mb-1">✅ 회신일</p>
            <input
              type="date"
              value={draft.reply_date || ""}
              onChange={(e) => u("reply_date")(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
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

        </div>
        {/* 하단 버튼 고정 */}
        <div className="px-6 py-4 border-t border-slate-100 shrink-0 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-slate-200 text-sm text-slate-500 hover:bg-slate-50">취소</button>
          {/* ✅ 수정: onSave에 단일 draft 객체만 전달 (App.jsx의 updateRecord가 단일 레코드를 받음) */}
          <button onClick={() => onSave(draft)} className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold">저장</button>
        </div>
      </div>
    </div>
  );
}

function OverdueBadge({ date, leadGrade, replyDate }) {
  if (replyDate) return null; // 회신 완료건은 표시 안함
  if (!date) return null;
  try {
    const LEAD_TARGET = { L1: 2, L2: 5, L3: null };
    const target = LEAD_TARGET[leadGrade];
    if (target === null) return null; // L3 협의건 제외
    const d0 = new Date(date);
    const today = new Date();
    // 오늘까지 경과 영업일 계산 (주말 제외)
    let elapsed = 0;
    const cur = new Date(d0);
    cur.setDate(cur.getDate() + 1);
    while (cur <= today) {
      if (cur.getDay() !== 0 && cur.getDay() !== 6) elapsed++;
      cur.setDate(cur.getDate() + 1);
    }
    if (elapsed > target) {
      return (
        <span className="text-red-500 font-semibold text-xs bg-red-50 border border-red-200 px-2 py-0.5 rounded-full animate-pulse">
          🚨 {elapsed - target}일 초과
        </span>
      );
    }
    if (elapsed === target) {
      return (
        <span className="text-amber-600 font-semibold text-xs bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
          ⚠️ 오늘 마감
        </span>
      );
    }
    return (
      <span className="text-slate-400 text-xs">
        D-{target - elapsed}
      </span>
    );
  } catch { return null; }
}

export default function Dashboard({ records, onRemove, onUpdate }) {
  const [exporting, setExporting]       = useState(false);
  const [formalExporting, setFormalExporting] = useState(false);
  const [formalProgress, setFormalProgress]   = useState("");
  const [exportError, setExportError]   = useState(null);
  const [editTarget, setEditTarget]  = useState(null);
  const importRef = useRef();

  const byL = { L1: 0, L2: 0, L3: 0 };
  const byR = { R1: 0, R2: 0, R3: 0 };
  records.forEach((r) => {
    if (byL[r.lead_grade] !== undefined) byL[r.lead_grade]++;
    if (byR[r.risk_grade] !== undefined) byR[r.risk_grade]++;
  });

  // 영업일 계산 (주말 제외)
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

  // Excel 내보내기 (수식 포함)
  const handleExport = () => {
    setExporting(true);
    setExportError(null);
    try {
      const wb = XLSX.utils.book_new();
      const today = new Date().toLocaleDateString("ko-KR");

      // ── ① 기본 로그 (핵심 열에 Excel 수식 삽입) ─────────────────
      // 열 배치: A=수신일 B=계약명 C=우리측 D=거래상대방 E=계약유형
      //          F=리드타임등급 G=리스크등급 H=리스크유형 I=금액
      //          J=회신일 K=소요영업일(수식) L=목표영업일(수식) M=달성여부(수식)
      //          N=담당자 O=메모
      // 헤더: 3행, 데이터 시작: 4행
      const LOG_DATA_START_ROW = 4;

      const logHeaders = [
        "수신일","계약명","우리측 당사자","거래상대방","계약유형",
        "리드타임 등급","리스크 등급","리스크 유형",
        "계약금액(백만원)","회신일","소요 영업일","목표 영업일","달성 여부",
        "담당자","메모"
      ];

      const logRows = records.map((r) => [
        r.date ? new Date(r.date) : "",   // A: 수신일
        r.title || "",                     // B
        r.our_party || "SK케미칼",         // C
        r.counterparty || "",              // D
        r.contract_type || "",             // E
        r.lead_grade || "",                // F
        r.risk_grade || "",                // G
        [r.risk_type_1, r.risk_type_2, r.risk_type_3].filter(Boolean).join(", "), // H
        r.amount > 0 ? r.amount : 0,       // I
        r.reply_date ? new Date(r.reply_date) : "", // J: 회신일
        "",  // K: 소요영업일 — 아래에서 수식으로 교체
        "",  // L: 목표영업일 — 아래에서 수식으로 교체
        "",  // M: 달성여부   — 아래에서 수식으로 교체
        r.assignee || "",
        r.memo || ""
      ]);

      const ws1 = XLSX.utils.aoa_to_sheet(
        [
          [`📋 계약 기본 로그 — 생성일: ${today} / 총 ${records.length}건`],
          [],
          logHeaders,
          ...logRows,
        ],
        { cellDates: true }
      );

      // ✅ 수식 직접 삽입 (aoa_to_sheet 이후 셀 객체 교체)
      records.forEach((_, idx) => {
        const excelRow = LOG_DATA_START_ROW + idx;       // 1-based Excel 행
        const sheetRow = excelRow - 1;                    // 0-based for encode_cell

        // 날짜 서식
        const aRef = XLSX.utils.encode_cell({ r: sheetRow, c: 0 });
        const jRef = XLSX.utils.encode_cell({ r: sheetRow, c: 9 });
        if (ws1[aRef] && ws1[aRef].v) ws1[aRef].z = "yyyy-mm-dd";
        if (ws1[jRef] && ws1[jRef].v) ws1[jRef].z = "yyyy-mm-dd";

        // K: 소요 영업일
        ws1[XLSX.utils.encode_cell({ r: sheetRow, c: 10 })] = {
          t: "n",
          f: `IF(AND(A${excelRow}<>"",J${excelRow}<>""),NETWORKDAYS(A${excelRow},J${excelRow})-1,"")`,
        };
        // L: 목표 영업일
        ws1[XLSX.utils.encode_cell({ r: sheetRow, c: 11 })] = {
          t: "s",
          f: `IF(F${excelRow}="L1",2,IF(F${excelRow}="L2",5,IF(F${excelRow}="L3","협의","")))`,
        };
        // M: 달성 여부
        ws1[XLSX.utils.encode_cell({ r: sheetRow, c: 12 })] = {
          t: "s",
          f: `IF(K${excelRow}="","미회신",IF(L${excelRow}="협의","협의완료",IF(K${excelRow}<=L${excelRow},"달성","❌ "&(K${excelRow}-L${excelRow})&"일 초과")))`,
        };
      });

      ws1["!cols"] = [10,28,16,16,14,8,8,20,10,10,10,10,14,14,20].map(w => ({ wch: w }));
      XLSX.utils.book_append_sheet(wb, ws1, "① 기본로그");

      // ── ② 월별 통계 (COUNTIFS/SUMIFS 수식으로 기본로그 참조) ──────
      // 기본로그의 데이터 범위: A열(수신일), F열(리드타임), G열(리스크), I열(금액), J열(회신일), M열(달성여부), N열(담당자)
      const dataEnd = LOG_DATA_START_ROW + records.length - 1;
      const logSheet = "'① 기본로그'";

      // 월 목록 추출 (중복 제거, 정렬)
      const months = [...new Set(records.map(r => r.date?.slice(0, 7)).filter(Boolean))].sort();

      const monthHeaders = ["월","전체","L1","L2","L3","R1","R2","R3","금액(백만)","회신완료","달성","달성률"];
      // 헤더: 3행, 데이터 시작: 4행
      const MONTH_DATA_START = 4;
      const monthRows = months.map((m) => {
        const yearStr = m.slice(0, 4);
        const monStr  = String(parseInt(m.slice(5, 7)));
        return [m, "", "", "", "", "", "", "", "", "", "", ""];
      });

      const ws2 = XLSX.utils.aoa_to_sheet([
        [`📅 월별 성과 분석 — 생성일: ${today} (기본로그 수식 연동)`], [],
        monthHeaders, ...monthRows
      ]);

      // ✅ 월별 수식 직접 삽입
      months.forEach((m, idx) => {
        const excelRow = MONTH_DATA_START + idx;
        const sheetRow = excelRow - 1;
        const yr = m.slice(0, 4);
        const mo = String(parseInt(m.slice(5, 7)));
        const aCol = `'① 기본로그'!$A$${LOG_DATA_START_ROW}:$A$${dataEnd}`;
        const dateCrit = `">="&DATE(${yr},${mo},1),"<"&DATE(${yr},${mo}+1,1)`;
        const fCol = `'① 기본로그'!$F$${LOG_DATA_START_ROW}:$F$${dataEnd}`;
        const gCol = `'① 기본로그'!$G$${LOG_DATA_START_ROW}:$G$${dataEnd}`;
        const iCol = `'① 기본로그'!$I$${LOG_DATA_START_ROW}:$I$${dataEnd}`;
        const jCol = `'① 기본로그'!$J$${LOG_DATA_START_ROW}:$J$${dataEnd}`;
        const mCol = `'① 기본로그'!$M$${LOG_DATA_START_ROW}:$M$${dataEnd}`;
        const formulas = [
          `COUNTIFS(${aCol},${dateCrit})`,
          `COUNTIFS(${aCol},${dateCrit},${fCol},"L1")`,
          `COUNTIFS(${aCol},${dateCrit},${fCol},"L2")`,
          `COUNTIFS(${aCol},${dateCrit},${fCol},"L3")`,
          `COUNTIFS(${aCol},${dateCrit},${gCol},"R1")`,
          `COUNTIFS(${aCol},${dateCrit},${gCol},"R2")`,
          `COUNTIFS(${aCol},${dateCrit},${gCol},"R3")`,
          `SUMIFS(${iCol},${aCol},${dateCrit})`,
          `COUNTIFS(${aCol},${dateCrit},${jCol},"<>")`,
          `COUNTIFS(${aCol},${dateCrit},${mCol},"달성")`,
          `IF(J${excelRow}>0,TEXT(K${excelRow}/J${excelRow},"0%"),"-")`,
        ];
        formulas.forEach((f, ci) => {
          ws2[XLSX.utils.encode_cell({ r: sheetRow, c: ci + 1 })] = { t: "n", f };
        });
      });
      ws2["!cols"] = [10,6,6,6,6,6,6,6,10,8,6,8].map(w => ({ wch: w }));
      XLSX.utils.book_append_sheet(wb, ws2, "② 월별 성과분석");

      // ── ③ 담당자별 통계 ──────────────────────────────────────────
      const assignees = [...new Set(records.map(r => r.assignee || "미지정"))].sort();
      const aHeaders = ["담당자","전체","L1","L2","L3","R1","R2","R3","금액(백만)","회신완료","달성","달성률"];
      const ASSIGN_DATA_START = 4;
      const aRows = assignees.map((a) => [a, "", "", "", "", "", "", "", "", "", "", ""]);
      const ws3 = XLSX.utils.aoa_to_sheet([
        [`👤 담당자별 성과 분석 — 생성일: ${today} (기본로그 수식 연동)`], [],
        aHeaders, ...aRows
      ]);

      // ✅ 담당자별 수식 직접 삽입
      assignees.forEach((a, idx) => {
        const excelRow = ASSIGN_DATA_START + idx;
        const sheetRow = excelRow - 1;
        const nCol = `'① 기본로그'!$N$${LOG_DATA_START_ROW}:$N$${dataEnd}`;
        const fCol = `'① 기본로그'!$F$${LOG_DATA_START_ROW}:$F$${dataEnd}`;
        const gCol = `'① 기본로그'!$G$${LOG_DATA_START_ROW}:$G$${dataEnd}`;
        const iCol = `'① 기본로그'!$I$${LOG_DATA_START_ROW}:$I$${dataEnd}`;
        const jCol = `'① 기본로그'!$J$${LOG_DATA_START_ROW}:$J$${dataEnd}`;
        const mCol = `'① 기본로그'!$M$${LOG_DATA_START_ROW}:$M$${dataEnd}`;
        const formulas = [
          `COUNTIF(${nCol},"${a}")`,
          `COUNTIFS(${nCol},"${a}",${fCol},"L1")`,
          `COUNTIFS(${nCol},"${a}",${fCol},"L2")`,
          `COUNTIFS(${nCol},"${a}",${fCol},"L3")`,
          `COUNTIFS(${nCol},"${a}",${gCol},"R1")`,
          `COUNTIFS(${nCol},"${a}",${gCol},"R2")`,
          `COUNTIFS(${nCol},"${a}",${gCol},"R3")`,
          `SUMIF(${nCol},"${a}",${iCol})`,
          `COUNTIFS(${nCol},"${a}",${jCol},"<>")`,
          `COUNTIFS(${nCol},"${a}",${mCol},"달성")`,
          `IF(J${excelRow}>0,TEXT(K${excelRow}/J${excelRow},"0%"),"-")`,
        ];
        formulas.forEach((f, ci) => {
          ws3[XLSX.utils.encode_cell({ r: sheetRow, c: ci + 1 })] = { t: "n", f };
        });
      });
      ws3["!cols"] = [16,6,6,6,6,6,6,6,10,8,6,8].map(w => ({ wch: w }));
      XLSX.utils.book_append_sheet(wb, ws3, "③ 담당자별 현황");

      const today2 = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      XLSX.writeFile(wb, `법무팀_계약성과관리_${today2}.xlsx`);
    } catch (e) {
      setExportError(e.message);
    } finally {
      setExporting(false);
    }
  };

  // 정식 Excel 내보내기 (백엔드 Python)
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
      const timeout = setTimeout(() => controller.abort(), 90000);
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
          // ✅ 수정: onSave에 단일 updated 객체만 전달 → App.jsx의 updateRecord가 올바르게 처리
          onSave={(updated) => { onUpdate(updated); setEditTarget(null); }}
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
                      : <OverdueBadge date={r.date} leadGrade={r.lead_grade} replyDate={r.reply_date} />}
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
          <div className="flex gap-2">
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
