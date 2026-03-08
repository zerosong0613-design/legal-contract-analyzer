import { useState } from "react";
import ContractUpload from "./components/ContractUpload";
import ContractResult from "./components/ContractResult";
import Dashboard from "./components/Dashboard";

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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 flex items-center justify-between h-14 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-base">⚖️</div>
          <div>
            <span className="text-sm font-bold text-slate-800 tracking-tight">ContractLens</span>
            <span className="ml-2 text-xs text-slate-400 hidden sm:inline">계약서 AI 분석 · 리드타임 · 리스크 진단</span>
          </div>
        </div>
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
            <ContractUpload onAnalyze={handleAnalyze} loading={loading} error={error} />
            {result && <ContractResult result={result} onAddToLog={addToLog} />}
          </div>
        )}
        {tab === "dashboard" && (
          <Dashboard records={records} onRemove={removeRecord} />
        )}
      </main>
    </div>
  );
}
