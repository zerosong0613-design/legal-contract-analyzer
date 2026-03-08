import { useState, useRef } from "react";

const ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".docx"];

function isAcceptedFile(file) {
  if (!file) return false;
  const name = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

function fileIcon(file) {
  if (!file) return "📎";
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "📕";
  return "📘";
}

export default function ContractUpload({ onAnalyze, loading, error, assigneeOptions = [] }) {
  const [mode, setMode]         = useState("paste");
  const [text, setText]         = useState("");
  const [file, setFile]         = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [assignee, setAssignee] = useState("");
  const fileRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    if (!isAcceptedFile(f)) {
      alert("PDF 또는 Word(.doc/.docx) 파일만 지원됩니다.");
      return;
    }
    setFile(f);
  };

  const handleSubmit = () => {
    if (mode === "paste" && !text.trim()) return;
    if (mode === "upload" && !file) return;
    const payload = mode === "paste" ? { text } : { file };
    if (assignee.trim()) payload.assignee = assignee.trim();
    onAnalyze(payload);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {[["paste", "📋 텍스트 붙여넣기"], ["upload", "📎 파일 첨부 (PDF/Word)"]].map(([m, lbl]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
              mode === m
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>

      {/* Input area */}
      {mode === "paste" ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="계약서 전문을 여기에 붙여넣기 하세요..."
          className="w-full h-52 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 placeholder-slate-400 resize-y outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-colors"
        />
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => fileRef.current.click()}
          className={`h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
            dragOver
              ? "border-indigo-400 bg-indigo-50"
              : "border-slate-300 hover:border-indigo-300 hover:bg-slate-50"
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
          {file ? (
            <>
              <div className="text-4xl">{fileIcon(file)}</div>
              <p className="text-indigo-600 text-sm font-semibold">{file.name}</p>
              <p className="text-slate-400 text-xs">클릭하여 다른 파일 선택</p>
            </>
          ) : (
            <>
              <div className="text-4xl">📎</div>
              <p className="text-slate-600 text-sm font-medium">파일을 드래그하거나 클릭하여 업로드</p>
              <p className="text-slate-400 text-xs">지원 형식: PDF · Word (.doc / .docx)</p>
            </>
          )}
        </div>
      )}

      {/* 담당자 입력 - 기존 이름 자동완성 */}
      <div className="flex items-center gap-2">
        <span className="text-slate-400 text-sm shrink-0">✏️ 담당자</span>
        <input
          type="text"
          list="assignee-options"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          placeholder="이름 입력 (선택)"
          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-colors"
        />
        <datalist id="assignee-options">
          {assigneeOptions.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-600 text-sm">
          ⚠️ {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || (mode === "paste" ? !text.trim() : !file)}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
      >
        {loading ? (
          <span className="flex flex-col items-center justify-center gap-1">
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              분석 중...
            </span>
            <span className="text-xs text-white/70">처음 실행 시 서버 시작으로 최대 1분 소요될 수 있습니다</span>
          </span>
        ) : (
          "⚖️ 계약서 분석하기"
        )}
      </button>
    </div>
  );
}
