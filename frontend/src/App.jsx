import { useState } from "react";
import ContractUpload from "./components/ContractUpload";
import ContractResult from "./components/ContractResult";
import Dashboard from "./components/Dashboard";

function WelcomeBanner() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
      <div className="text-center space-y-1">
        <div className="text-3xl">⚖️</div>
        <h2 className="text-base font-bold text-slate-800">ContractLens 사용 방법</h2>
        <p className="text-xs text-slate-400">계약서를 분석하고 리드타임·리스크를 자동으로 진단합니다</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          ["1️⃣", "계약서 입력", "텍스트 붙여넣기 또는 PDF·Word 파일 첨부"],
          ["2️⃣", "AI 분석", "등급·리스크·당사자 자동 추출 후 수정 가능"],
          ["3️⃣", "로그 저장", "대시보드에 누적, Excel로 성과 보고"],
        ].map(([icon, title, desc]) => (
          <div key={title} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100 space-y-1">
            <div className="text-xl">{icon}</div>
            <p className="text-xs font-bold text-slate-700">{title}</p>
            <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
        <p className="text-xs font-semibold text-slate-500 mb-2">📌 등급 기준</p>
        <div className="flex flex-wrap gap-2">
          {[
            ["L1", "48시간·표준", "bg-green-100 text-green-800 border-green-300"],
            ["L2", "5일·비표준", "bg-amber-100 text-amber-800 border-amber-300"],
            ["L3", "협의·복잡", "bg-red-100 text-red-800 border-red-300"],
            ["R1", "저위험", "bg-green-100 text-green-800 border-green-300"],
            ["R2", "중위험", "bg-amber-100 text-amber-800 border-amber-300"],
            ["R3", "고위험", "bg-red-100 text-red-800 border-red-300"],
          ].map(([g, lbl, cls]) => (
            <span key={g} className={`px-2 py-0.5 rounded-full border text-xs font-bold ${cls}`}>
              {g} {lbl}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const STORAGE_KEY = "contractlens_records";

function loadRecords() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveRecords(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    console.warn("localStorage 저장 실패");
  }
}

export default function App() {
  const [tab, setTab]       = useState("analyze");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);
  const [records, setRecords] = useState(() => loadRecords());
  const [pendingAssignee, setPendingAssignee] = useState(""); // ← 담당자 임시 보관

  const updateRecords = (newRecords) => {
    setRecords(newRecords);
    saveRecords(newRecords);
  };

  const handleAnalyze = async ({ file, text, assignee = "" }) => { // ← assignee 수신
    setLoading(true);
    setError(null);
    setResult(null);
    setPendingAssignee(assignee); // ← 저장
    try {
      let res;
      if (file) {
        const form = new FormData();
        form.append("file", file);
        res = await fetch(`${import.meta.env.VITE_API_URL}/api/analyze`, {
          method: "POST",
          body: form,
        });
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
      {
        ...record,
        assignee: pendingAssignee || record.assignee || "", // ← 담당자 포함
        id: Date.now(),
        date: new Date().toISOString().slice(0, 10),
      },
    ];
    updateRecords(newRecords);
    setResult(null);
    setPendingAssignee("");
    setTab("dashboard");
  };

  const removeRecord = (id) => {
    updateRecords(records.filter((r) => r.id !== id));
  };

  const updateRecord = (updated) => {
    updateRecords(records.map((r) => r.id === updated.id ? updated : r));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 flex items-center justify-between h-14 sticky top-0 z-10 shadow-sm">
        <button onClick={() => { setTab("analyze"); }} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-base">⚖️</div>
          <div>
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
                tab === t
                  ? "bg-indigo-600 text-white"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {tab === "analyze" && (
          <div className="space-y-5">
            <ContractUpload
                onAnalyze={handleAnalyze}
                loading={loading}
                error={error}
                assigneeOptions={[...new Set(records.map(r => r.assignee).filter(Boolean))].sort()}
              />
            {!result && !loading && <WelcomeBanner />}
            {result && <ContractResult result={result} onAddToLog={addToLog} initialAssignee={pendingAssignee} />}
          </div>
        )}
        {tab === "dashboard" && (
          <Dashboard records={records} onRemove={removeRecord} onUpdate={updateRecord} />
        )}
      </main>
    </div>
  );
}
