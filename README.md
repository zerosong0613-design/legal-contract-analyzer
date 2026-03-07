# ⚖️ ContractLens — 계약서 AI 분석 시스템

계약서를 붙여넣거나 PDF를 업로드하면 **Gemini 1.5 Pro**가 자동으로 분석합니다.
결과를 누적해서 **법무팀 Excel 대시보드**로 내보낼 수 있습니다.

---

## 📁 프로젝트 구조

```
legal-ai-contract/
├── frontend/                  # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/
│   │   │   ├── ContractUpload.jsx   # 텍스트 붙여넣기 / PDF 업로드
│   │   │   ├── ContractResult.jsx   # 분석 결과 표시
│   │   │   ├── RiskTable.jsx        # 리스크 항목 테이블
│   │   │   └── Dashboard.jsx        # 누적 로그 + Excel 내보내기
│   │   └── App.jsx
│   └── ...
│
├── backend/                   # Node.js + Express
│   ├── server.js              # API 서버 (POST /api/analyze)
│   ├── analyzeContract.js     # PDF 파싱 + Gemini 호출 로직
│   ├── geminiClient.js        # Gemini API 클라이언트
│   └── .env.example
│
├── prompts/
│   └── contractAnalysisPrompt.md   # 분석 프롬프트 (L/R 등급 기준 포함)
│
└── README.md
```

---

## 🚀 빠른 시작

### 1. 저장소 클론

```bash
git clone https://github.com/your-org/legal-ai-contract.git
cd legal-ai-contract
```

### 2. 백엔드 설정

```bash
cd backend
npm install

# .env 파일 생성
cp .env.example .env
# .env 파일에 GEMINI_API_KEY 입력

npm run dev   # http://localhost:4000
```

### 3. 프론트엔드 설정

```bash
cd frontend
npm install
cp .env.example .env

npm run dev   # http://localhost:5173
```

---

## 🔑 Gemini API 키 발급

1. [Google AI Studio](https://aistudio.google.com/app/apikey) 접속
2. **"Create API key"** 클릭
3. 발급된 키를 `backend/.env`의 `GEMINI_API_KEY=` 에 입력

> 사내 환경에서 Google Workspace 계정으로 접속하면 팀 공유 키 사용 가능

---

## 📊 분석 결과

| 항목 | 내용 |
|------|------|
| 기본 정보 | 계약 제목, 상대방, 유형, 기간, 금액 |
| 리드타임 등급 | L1 (1일) / L2 (3일) / L3 (협의 필요) |
| 리스크 등급 | R1 (저위험) / R2 (중위험) / R3 (고위험) |
| 리스크 항목 | 카테고리, 심각도, 내용, 수정 방향 |
| 종합 의견 | 법무팀 관점 3~5문장 요약 |

### Excel 내보내기 시트 구성

- **① 기본로그** — 전 계약 통합 로그 (기존 법무팀 서식 호환)
- **② R3 가치기록** — 고위험 계약 선별 기록
- **③ 분기성과요약** — L/R 등급 분포, 리스크 태그 집계

---

## ⚙️ API 명세

### `POST /api/analyze`

**PDF 파일 전송 (multipart/form-data)**
```
file: <PDF binary>
```

**텍스트 전송 (application/json)**
```json
{ "text": "계약서 전문..." }
```

**응답**
```json
{
  "ok": true,
  "data": {
    "title": "의료기기 납품 및 공급 계약서",
    "counterparty": "유한회사 더조이",
    "contract_type": "공급계약",
    "duration": "2025-01-01 ~ 2025-12-31",
    "amount": 500,
    "lead_grade": "L2",
    "risk_grade": "R3",
    "risk_type_1": "배상책임",
    "risks": [...],
    "summary": "..."
  }
}
```

---

## 🛠 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express, Multer |
| AI | Google Gemini 1.5 Pro |
| PDF 파싱 | pdf-parse |
| Excel 출력 | SheetJS (xlsx) |

---

## 📝 프롬프트 커스터마이징

`prompts/contractAnalysisPrompt.md` 파일에서 등급 기준과 리스크 유형을 팀 기준에 맞게 수정할 수 있습니다.
서버 재시작 없이 파일만 수정하면 바로 반영됩니다.
