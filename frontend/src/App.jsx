import { useState } from "react";
import ContractUpload from "./components/ContractUpload";
import ContractResult from "./components/ContractResult";
import Dashboard from "./components/Dashboard";

const STORAGE_KEY = "contractlens_records";

function loadRecords() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}
function saveRecords(records) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); }
  catch { console.warn("localStorage 저장 실패"); }
}

function WelcomeBanner() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-5">
      {/* 상단 컬러 배너 */}
      <div className="bg-indigo-600 px-6 py-5">
        <h2 className="text-white text-lg font-bold mb-1">ContractLens 사용 방법</h2>
        <p className="text-indigo-200 text-sm">AI가 계약서를 분석하고 리드타임·리스크 등급을 자동으로 산정합니다</p>
      </div>

      {/* 3단계 안내 */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 px-2 py-4">
        {[
          { step: "01", icon: "📄", title: "계약서 입력", desc: "텍스트를 붙여넣거나\nPDF·Word 파일 업로드" },
          { step: "02", icon: "🤖", title: "AI 자동 분석", desc: "GPT-4o mini가 조항을\n분석하고 등급 산정 (10초)" },
          { step: "03", icon: "📊", title: "결과 저장·보고서", desc: "로그 누적 후\nExcel 보고서 다운로드" },
        ].map(({ step, icon, title, desc }) => (
          <div key={step} className="px-4 text-center">
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-xs font-bold text-indigo-400 mb-0.5">STEP {step}</div>
            <div className="text-sm font-bold text-slate-700 mb-1">{title}</div>
            <p className="text-xs text-slate-400 whitespace-pre-line leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* 등급 설명 */}
      <div className="border-t border-slate-100 px-6 py-4 bg-slate-50">
        <p className="text-xs font-bold text-slate-500 mb-2">📌 등급 기준</p>
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { badge: "L1", color: "bg-green-100 text-green-700", desc: "표준·반복 계약 → 48시간 내" },
            { badge: "L2", color: "bg-amber-100 text-amber-700", desc: "비표준 조항 포함 → 5일 내" },
            { badge: "L3", color: "bg-red-100 text-red-700",   desc: "복잡·고액·신규 유형 → 협의" },
            { badge: "R1", color: "bg-green-100 text-green-700", desc: "균형 잡힌 조항 (저위험)" },
            { badge: "R2", color: "bg-amber-100 text-amber-700", desc: "수정 필요 항목 존재 (중위험)" },
            { badge: "R3", color: "bg-red-100 text-red-700",   desc: "즉각 협상 필요 (고위험)" },
          ].map(({ badge, color, desc }) => (
            <span key={badge} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1">
              <span className={`font-bold px-1.5 py-0.5 rounded ${color}`}>{badge}</span>
              <span className="text-slate-500">{desc}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab]         = useState("analyze");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);
  const [records, setRecords] = useState(() => loadRecords());
  const [pendingAssignee, setPendingAssignee] = useState("");

  const updateRecords = (newRecords) => {
    setRecords(newRecords);
    saveRecords(newRecords);
  };

  const goHome = () => {
    setTab("analyze");
    setResult(null);
    setError(null);
  };

  const handleAnalyze = async ({ file, text, assignee = "" }) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setPendingAssignee(assignee);
    try {
      let res;
      if (file) {
        const form = new FormData();
        form.append("file", file);
        res = await fetch(`${import.meta.env.VITE_API_URL}/api/analyze`, { method: "POST", body: form });
      } else {
        res = await fetch(`${import.meta.env.VITE_API_URL}/api/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
      }
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setResult(json.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const addToLog = (record) => {
    const newRecords = [
      ...records,
      { ...record, assignee: pendingAssignee || record.assignee || "", id: Date.now(), date: new Date().toISOString().slice(0, 10) },
    ];
    updateRecords(newRecords);
    // 저장 후 자동 이동 없음 — ContractResult에서 완료 메시지 표시
    setPendingAssignee("");
  };

  const removeRecord = (id) => updateRecords(records.filter((r) => r.id !== id));

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 flex items-center justify-between h-14 sticky top-0 z-10 shadow-sm">
        {/* 로고 클릭 → 홈 */}
        <button onClick={goHome} className="flex items-center gap-3 hover:opacity-75 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-base">⚖️</div>
          <div className="text-left">
            <span className="text-sm font-bold text-slate-800 tracking-tight">ContractLens</span>
            <span className="ml-2 text-xs text-slate-400 hidden sm:inline">계약서 AI 분석 · 리드타임 · 리스크 진단</span>
          </div>
        </button>

        <nav className="flex gap-1">
          {[
            ["analyze", "📋 계약서 분석"],
            ["dashboard", `📂 대시보드 (${records.length})`],
          ].map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                tab === t ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {tab === "analyze" && (
          <div className="space-y-0">
            {/* 결과가 없을 때만 웰컴 배너 표시 */}
            {!result && !loading && <WelcomeBanner />}
            <ContractUpload onAnalyze={handleAnalyze} loading={loading} error={error} />
            {result && <div className="mt-5"><ContractResult result={result} onAddToLog={addToLog} /></div>}
          </div>
        )}
        {tab === "dashboard" && (
          <Dashboard records={records} onRemove={removeRecord} />
        )}
      </main>
    </div>
  );
}
