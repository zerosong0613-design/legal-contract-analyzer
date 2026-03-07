# ⚖️ ContractLens — 계약서 AI 분석 시스템

계약서를 붙여넣거나 PDF/Word 파일을 업로드하면 **Gemini 2.0 Flash**가 자동 분석합니다.
결과를 누적해서 **법무팀 Excel 대시보드**로 내보낼 수 있습니다.

## 📁 프로젝트 구조

```
legal-ai-contract/
├── backend/
│   ├── server.js              # Express API 서버
│   ├── analyzeContract.js     # PDF/Word 파싱 + Gemini 호출
│   ├── geminiClient.js        # Gemini 2.0 Flash 클라이언트
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── components/
│   │       ├── ContractUpload.jsx   # 텍스트/PDF/Word 입력
│   │       ├── ContractResult.jsx   # 분석 결과 표시
│   │       ├── RiskTable.jsx        # 리스크 항목 테이블
│   │       └── Dashboard.jsx        # 누적 로그 + Excel 내보내기
│   └── package.json
│
├── prompts/
│   └── contractAnalysisPrompt.md
└── README.md
```

## 🚀 배포 구조

- **Backend**: Render (https://legal-contract-analyzer-p2an.onrender.com)
- **Frontend**: Vercel

## ⚙️ 환경변수

### Backend (Render)
```
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=https://your-app.vercel.app
PORT=4000
```

### Frontend (Vercel)
```
VITE_API_URL=https://legal-contract-analyzer-p2an.onrender.com
```

## 📊 분석 결과

| 항목 | 내용 |
|------|------|
| 기본 정보 | 제목, 상대방, 유형, 기간, 금액 |
| 리드타임 등급 | L1 (1일) / L2 (3일) / L3 (협의 필요) |
| 리스크 등급 | R1 (저위험) / R2 (중위험) / R3 (고위험) |
| 리스크 항목 | 카테고리, 심각도, 내용, 수정 방향 |
| Excel 출력 | ① 기본로그 ② R3 가치기록 ③ 분기성과요약 |
