import { useState, useRef } from "react";

export default function ContractUpload({ onAnalyze, loading, error }) {
  const [mode, setMode] = useState("paste");
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    if (f.type !== "application/pdf") { alert("PDF 파일만 지원됩니다."); return; }
    setFile(f);
  };

  const handleSubmit = () => {
    if (mode === "paste" && !text.trim()) return;
    if (mode === "upload" && !file) return;
    onAnalyze(mode === "paste" ? { text } : { file });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-1 bg-slate-950 rounded-xl p-1">
        {[["paste", "📋 텍스트 붙여넣기"], ["upload", "📄 PDF 첨부"]].map(([m, lbl]) => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
              mode === m ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-300"
            }`}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Input */}
      {mode === "paste" ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="계약서 전문을 여기에 붙여넣기 하세요..."
          className="w-full h-52 bg-slate-950 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-600 resize-y outline-none focus:border-indigo-500 transition-colors"
        />
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => fileRef.current.click()}
          className={`h-44 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
            dragOver ? "border-indigo-500 bg-indigo-950/30" : "border-slate-700 hover:border-slate-500"
          }`}>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
          {file ? (
            <><div className="text-3xl">✅</div><p className="text-cyan-400 text-sm font-medium">{file.name}</p></>
          ) : (
            <><div className="text-3xl">📄</div><p className="text-slate-500 text-sm">PDF 파일을 드래그하거나 클릭하여 첨부</p></>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-950/50 border border-red-800 rounded-lg px-4 py-3 text-red-300 text-sm">
          ⚠️ {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || (mode === "paste" ? !text.trim() : !file)}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-bold transition-colors"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            분석 중...
          </span>
        ) : "⚖️ 계약서 분석하기"}
      </button>
    </div>
  );
}
