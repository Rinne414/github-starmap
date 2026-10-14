// Categories and subjects shared by own repos and stars. The zh labels of the
// original 15 categories and their subjects match the gold labels in
// tests/fixtures/stars-gold.json, so do not rename them.

export interface Label {
  zh: string;
  en: string;
}

export interface CategoryDef {
  key: string;
  label: Label;
  /** Noun used in the fun title, e.g. "煉圖師". */
  noun: Label;
}

export interface SubjectDef {
  key: string;
  category: string;
  label: Label;
}

export const OTHER = "other";

export const CATEGORIES: readonly CategoryDef[] = [
  { key: "ai-image", label: { zh: "AI 繪圖與 ComfyUI", en: "AI Art & ComfyUI" }, noun: { zh: "煉圖師", en: "Image Alchemist" } },
  { key: "ai-lora", label: { zh: "LoRA 訓練與資料集", en: "LoRA Training & Datasets" }, noun: { zh: "煉丹師", en: "Model Tuner" } },
  { key: "video", label: { zh: "影片與動畫", en: "Video & Animation" }, noun: { zh: "導演", en: "Director" } },
  { key: "audio", label: { zh: "音訊與語音", en: "Audio & Speech" }, noun: { zh: "調音師", en: "Sound Smith" } },
  { key: "coding-agent", label: { zh: "AI 編程代理", en: "AI Coding Agents" }, noun: { zh: "代理馴獸師", en: "Agent Wrangler" } },
  { key: "llm", label: { zh: "LLM 應用與框架", en: "LLM Apps & Frameworks" }, noun: { zh: "模型工匠", en: "LLM Artisan" } },
  { key: "gateway", label: { zh: "API 閘道與帳號工具", en: "API Gateways & Accounts" }, noun: { zh: "接線生", en: "Switchboard Operator" } },
  { key: "chatbot", label: { zh: "聊天機器人與 IM", en: "Chatbots & IM" }, noun: { zh: "機器人飼主", en: "Bot Keeper" } },
  { key: "vision", label: { zh: "電腦視覺與影像處理", en: "Computer Vision & Imaging" }, noun: { zh: "視覺獵人", en: "Vision Hunter" } },
  { key: "image-mgmt", label: { zh: "圖片管理與瀏覽", en: "Image Management" }, noun: { zh: "圖庫管理員", en: "Gallery Curator" } },
  { key: "downloader", label: { zh: "下載與爬蟲", en: "Downloaders & Scrapers" }, noun: { zh: "搬運工", en: "Data Hauler" } },
  { key: "education", label: { zh: "教育與學習", en: "Education & Learning" }, noun: { zh: "教頭", en: "Mentor" } },
  { key: "frontend", label: { zh: "前端與設計", en: "Frontend & Design" }, noun: { zh: "像素工匠", en: "Pixel Crafter" } },
  { key: "system", label: { zh: "Windows 與系統工具", en: "Windows & System Tools" }, noun: { zh: "系統玩家", en: "Power User" } },
  { key: "backend", label: { zh: "後端與資料庫", en: "Backend & Databases" }, noun: { zh: "後端鐵匠", en: "Backend Smith" } },
  { key: "devops", label: { zh: "DevOps 與雲端", en: "DevOps & Cloud" }, noun: { zh: "雲端舵手", en: "Cloud Captain" } },
  { key: "data-ml", label: { zh: "資料科學與機器學習", en: "Data Science & ML" }, noun: { zh: "數據偵探", en: "Data Detective" } },
  { key: "mobile-game", label: { zh: "行動與遊戲開發", en: "Mobile & Game Dev" }, noun: { zh: "掌上造物者", en: "Pocket Maker" } },
  { key: "devtools", label: { zh: "開發工具與程式語言", en: "Dev Tools & Languages" }, noun: { zh: "工具控", en: "Tool Geek" } },
  { key: OTHER, label: { zh: "其他", en: "Other" }, noun: { zh: "探險家", en: "Explorer" } },
];

const SUBJECT_GROUPS: Record<string, [key: string, zh: string, en: string][]> = {
  "ai-image": [
    ["novelai", "NovelAI", "NovelAI"],
    ["anima", "Anima", "Anima"],
    ["comfyui", "ComfyUI 節點", "ComfyUI Nodes"],
    ["sd-webui", "Stable Diffusion WebUI", "Stable Diffusion WebUI"],
    ["flux", "Flux", "Flux"],
    ["gemini-image", "Gemini 圖像", "Gemini Image"],
    ["gpt-image", "GPT Image", "GPT Image"],
    ["prompt-tags", "提示詞與標籤", "Prompts & Tags"],
    ["danbooru", "Danbooru", "Danbooru"],
    ["pixiv", "Pixiv", "Pixiv"],
    ["artist-style", "畫師風格", "Artist Styles"],
  ],
  "ai-lora": [
    ["lora-training", "LoRA 訓練", "LoRA Training"],
    ["dataset", "資料集整理", "Dataset Curation"],
  ],
  video: [
    ["minimax-h3", "MiniMax H3", "MiniMax H3"],
    ["ai-video", "AI 影片生成", "AI Video Generation"],
    ["ai-drama", "AI 短劇", "AI Short Drama"],
    ["code-video", "程式碼渲染影片", "Code-rendered Video"],
    ["explainer-video", "教學影片", "Explainer Videos"],
    ["video-editing", "影片剪輯", "Video Editing"],
  ],
  audio: [
    ["tts", "TTS", "TTS"],
    ["music", "音樂生成", "Music Generation"],
    ["subtitles", "字幕", "Subtitles & Transcription"],
  ],
  "coding-agent": [
    ["claude-code", "Claude Code", "Claude Code"],
    ["codex", "Codex", "Codex"],
    ["opencode", "OpenCode", "OpenCode"],
    ["agent-skills", "Agent Skills", "Agent Skills"],
    ["mcp", "MCP", "MCP"],
    ["multi-agent", "多代理協作", "Multi-agent Teams"],
    ["browser-automation", "瀏覽器自動化", "Browser Automation"],
  ],
  llm: [
    ["agent-framework", "Agent 框架", "Agent Frameworks"],
    ["rag", "RAG", "RAG"],
    ["llm-training", "LLM 訓練", "LLM Training"],
    ["local-inference", "本地推理", "Local Inference"],
    ["roleplay", "角色扮演", "Roleplay"],
    ["doc-generation", "文件與簡報生成", "Docs & Slides Generation"],
    ["assistant", "個人 AI 助理", "Personal AI Assistants"],
    ["model-eval", "AI 模型評測", "Model Evaluation"],
  ],
  gateway: [
    ["api-gateway", "API 閘道", "API Gateways"],
    ["account-switch", "帳號切換", "Account Switching"],
  ],
  chatbot: [
    ["astrbot", "AstrBot", "AstrBot"],
    ["qq", "QQ", "QQ"],
    ["telegram", "Telegram", "Telegram"],
    ["wechat", "微信", "WeChat"],
    ["chat-analysis", "聊天記錄分析", "Chat History Analysis"],
  ],
  vision: [
    ["detection", "物件偵測與分割", "Detection & Segmentation"],
    ["bg-removal", "去背", "Background Removal"],
    ["super-resolution", "超解析", "Super-resolution"],
    ["ocr", "OCR", "OCR"],
    ["ai-watermark", "AI 浮水印偵測", "AI Watermark Detection"],
    ["faceswap", "換臉", "Face Swap"],
    ["manga-translation", "漫畫翻譯", "Manga Translation"],
  ],
  "image-mgmt": [
    ["image-management", "圖片管理", "Image Management"],
    ["image-metadata", "圖片中繼資料", "Image Metadata"],
  ],
  downloader: [
    ["downloader", "下載器", "Downloaders"],
    ["scraper", "爬蟲", "Scrapers"],
  ],
  education: [
    ["ai-tutor", "AI 家教", "AI Tutors"],
    ["lms", "LMS 整合", "LMS Integration"],
    ["chemistry", "化學教學", "Chemistry Teaching"],
    ["classroom", "課堂活動與測驗", "Classroom Activities & Quizzes"],
    ["awesome", "Awesome 清單", "Awesome Lists"],
    ["coding-practice", "程式練習", "Coding Practice"],
  ],
  frontend: [
    ["ui-library", "UI 元件庫", "UI Component Libraries"],
    ["design-system", "設計系統", "Design Systems"],
    ["web-3d", "3D 與動態網頁", "3D & Motion Web"],
    ["frontend-framework", "前端框架", "Frontend Frameworks"],
    ["sites", "網站與部落格", "Websites & Blogs"],
    ["browser-extension", "瀏覽器擴充", "Browser Extensions"],
  ],
  system: [
    ["windows-tools", "Windows 工具", "Windows Tools"],
    ["terminal", "終端機", "Terminal"],
    ["network-proxy", "網路代理", "Network Proxy"],
    ["productivity", "桌面生產力", "Desktop Productivity"],
    ["translation", "翻譯與 i18n", "Translation & i18n"],
  ],
  backend: [
    ["web-framework", "Web 框架", "Web Frameworks"],
    ["database", "資料庫", "Databases"],
  ],
  devops: [
    ["containers", "容器與 Kubernetes", "Containers & Kubernetes"],
    ["cicd-cloud", "CI/CD 與雲端部署", "CI/CD & Cloud Deploys"],
    ["self-hosted", "自架服務", "Self-hosting"],
    ["monitoring", "監控與日誌", "Monitoring & Logging"],
  ],
  "data-ml": [
    ["ml-framework", "機器學習框架", "ML Frameworks"],
    ["data-analysis", "資料分析與視覺化", "Data Analysis & Viz"],
  ],
  "mobile-game": [
    ["mobile-app", "行動 App", "Mobile Apps"],
    ["game-dev", "遊戲開發", "Game Development"],
  ],
  devtools: [
    ["programming-language", "程式語言", "Programming Languages"],
    ["editor-ide", "編輯器與 IDE", "Editors & IDEs"],
    ["build-test", "建置與測試", "Build & Test"],
    ["libraries", "程式庫與套件", "Libraries & Packages"],
    ["templates", "範本與範例", "Templates & Examples"],
    ["git-tools", "Git 與 GitHub 工具", "Git & GitHub Tools"],
    ["security", "資安與驗證", "Security & Auth"],
  ],
  [OTHER]: [
    ["business", "商業與變現", "Business & Monetization"],
    ["quant-trading", "量化與交易", "Quant & Trading"],
  ],
};

export const SUBJECTS: readonly SubjectDef[] = Object.entries(SUBJECT_GROUPS).flatMap(
  ([category, rows]) => rows.map(([key, zh, en]) => ({ key, category, label: { zh, en } })),
);

export const CATEGORY_BY_KEY = new Map(CATEGORIES.map((c) => [c.key, c]));
export const SUBJECT_BY_KEY = new Map(SUBJECTS.map((s) => [s.key, s]));

/** Order used for tie-breaks and legend listing. */
export const CATEGORY_ORDER = new Map(CATEGORIES.map((c, i) => [c.key, i]));
