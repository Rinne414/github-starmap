// Keyword tables for the rule classifier. Latin terms match on word
// boundaries (case-insensitive); terms containing CJK match as substrings, so
// list both Traditional and Simplified spellings.

export interface KeywordEntry {
  terms: string[];
  languages?: string[];
  /** Multiplier on the final score, for broad subjects that should lose ties. */
  weight?: number;
  /**
   * How strongly this subject pulls the item into its category (default 1).
   * Domain tags such as Codex or Danbooru describe what a tool is about, not
   * what it does, so a Pixiv downloader still lands in 下載與爬蟲.
   */
  pull?: number;
}

export const SUBJECT_KEYWORDS: Record<string, KeywordEntry> = {
  // AI 繪圖與 ComfyUI
  novelai: { terms: ["novelai", "novel ai", "nai", "nai3", "nai4", "nai5", "nai diffusion", "novelai api"], pull: 0.6 },
  anima: { terms: ["anima", "anima 2b", "anima2b"], pull: 0.6 },
  comfyui: { terms: ["comfyui", "comfy", "comfyui nodes", "custom node", "custom nodes", "comfyui custom node"] },
  "sd-webui": { terms: ["sd webui", "stable diffusion webui", "automatic1111", "a1111", "sd forge", "fooocus", "webui extension", "sd scripts"], pull: 0.8 },
  flux: { terms: ["flux", "flux1", "flux.1", "krea", "krea2", "z image", "qwen image"] },
  "gemini-image": { terms: ["nano banana", "gemini image", "gemini 2 5 flash image", "imagen"] },
  "gpt-image": { terms: ["gpt image", "gpt image 1", "gpt image 2", "dall e", "dalle"] },
  "prompt-tags": { terms: ["tag", "tags", "tagger", "image prompt", "image prompts", "art prompt", "art prompts", "sd prompt", "nai prompt", "prompt tag", "prompt tags", "prompt studio", "prompt library", "prompt gallery", "prompt card", "prompt cards", "prompt builder", "prompt generator", "image to prompt", "image2prompt", "anime prompt", "wildcards", "tipo", "dantaggen", "提示词", "提示詞", "标签", "標籤", "咒语", "咒語", "画师串", "反推"], pull: 0.8 },
  danbooru: { terms: ["danbooru", "booru", "gelbooru", "d站"], pull: 0.5 },
  pixiv: { terms: ["pixiv", "p站"], pull: 0.5 },
  "artist-style": { terms: ["artist", "artists", "artist style", "artist styles", "style explorer", "画师", "畫師", "画风", "畫風"], pull: 0.6 },

  // LoRA 訓練與資料集
  "lora-training": { terms: ["lora", "lycoris", "kohya", "kohya ss", "dreambooth", "lora scripts", "sd trainer", "training toolkit", "lora training", "炼丹", "煉丹", "lora训练", "lora 训练", "lora 訓練"] },
  dataset: { terms: ["dataset", "datasets", "dataset creation", "dataset management", "captioning", "caption", "tagging", "image annotation", "annotation", "wd14", "tag editor", "image dataset", "training set", "dataset tag", "数据集", "資料集", "打标", "打標", "标注", "標註", "训练集", "訓練集"] },

  // 影片與動畫
  "minimax-h3": { terms: ["minimax h3", "minimaxh3", "h3vae", "hailuo", "海螺"] },
  "ai-video": { terms: ["video generation", "ai video", "text to video", "image to video", "t2v", "i2v", "video2video", "character animation", "image animation", "seedance", "kling", "veo", "runway", "sora", "hunyuanvideo", "ai filmmaking", "film production", "video production", "视频生成", "影片生成", "图生视频", "圖生影片", "文生视频", "ai 视频", "ai视频", "ai 影视", "ai影视", "影视生产"] },
  "ai-drama": { terms: ["short drama", "ai short drama", "ai comic", "短剧", "短劇", "漫剧", "漫劇"] },
  "code-video": { terms: ["remotion", "manim", "code rendered", "kinetic typography", "motion graphics", "programmatic video", "pv", "music video", "代码渲染", "程式碼渲染"] },
  "explainer-video": { terms: ["explainer video", "explainer", "educational video", "teaching video", "教学视频", "教學影片", "讲解视频", "科普视频"] },
  "video-editing": { terms: ["video editor", "video editing", "ffmpeg", "lossless", "film analysis", "剪辑", "剪輯", "拉片", "出片"] },

  // 音訊與語音
  tts: { terms: ["tts", "text to speech", "speech synthesis", "voice cloning", "vits", "speech generation", "语音合成", "語音合成", "配音", "声音克隆", "聲音克隆"] },
  music: { terms: ["music generation", "midi", "midi file", "synthesizer", "synth", "sound synthesis", "dsp", "csound", "supercollider", "daw", "music programming", "music source separation", "source separation", "msst", "uvr", "audio generation", "suno", "singing voice", "音乐生成", "音樂生成", "音源分离", "人声分离", "人聲分離"] },
  subtitles: { terms: ["subtitle", "subtitles", "srt", "asr", "whisper", "speech to text", "transcription", "transcribe", "dictation", "字幕", "听写", "聽寫", "语音识别", "語音辨識"] },

  // AI 編程代理
  "claude-code": { terms: ["claude code", "claudecode", "claude code plugin", "claude code skill", "claude code hooks"], pull: 0.6 },
  codex: { terms: ["codex", "codex cli", "openai codex", "codexapp", "codex app"], pull: 0.6 },
  opencode: { terms: ["opencode"], pull: 0.6 },
  "agent-skills": { terms: ["skill", "skills", "agent skills", "claude skills", "skillset"], pull: 0.3 },
  mcp: { terms: ["mcp", "mcp server", "model context protocol"], pull: 0.6 },
  "multi-agent": { terms: ["multi agent", "multi agents", "agent team", "agent teams", "parallel agents", "subagent", "subagents", "agent swarm", "agency", "fleet of", "多代理", "多智能体", "多智能體"], pull: 0.8 },
  "browser-automation": { terms: ["browser automation", "browser use", "playwright", "puppeteer", "headless", "cdp", "selenium", "浏览器自动化", "瀏覽器自動化"], pull: 0.7 },

  // LLM 應用與框架
  "agent-framework": { terms: ["agent framework", "agentic framework", "autonomous agent", "llm agent", "langchain", "langgraph", "autogen", "crewai", "workflow automation", "n8n", "dify", "agent os", "self evolving agent", "harness engineering"] },
  rag: { terms: ["rag", "retrieval augmented", "knowledge base", "notebook lm", "notebooklm", "embedding", "embeddings", "知识库", "知識庫"] },
  "llm-training": { terms: ["llm training", "gpts", "train gpt", "gpt2", "nanogpt", "tokenizer", "tokenizers", "bpe", "language model training", "reinforcement learning", "rlhf", "grpo", "rl training", "pretraining", "from scratch", "sft", "abliteration", "censorship removal", "verl", "peft", "预训练", "預訓練", "大模型训练"] },
  "local-inference": { terms: ["llm inference", "inference", "inference library", "inference engine", "llms locally", "local llm", "local llms", "running llms", "run llms", "on device", "llama.cpp", "llama cpp", "ggml", "gguf", "ollama", "vllm", "lm studio", "mlx", "consumer hardware", "quantization", "exllama", "本地推理", "本地部署大模型"] },
  roleplay: { terms: ["roleplay", "roleplaying", "role play", "sillytavern", "character card", "ai companion", "角色扮演", "人设", "人設"] },
  "doc-generation": { terms: ["ppt", "pptx", "powerpoint", "aippt", "ai ppt", "ppt generation", "ppt generator", "powerpoint generation", "slide generation", "generate slides", "ai slides", "ai presentation", "presentation generation", "paper writing", "academic writing", "paper generation", "paper2slides", "演示文稿", "简报", "簡報", "幻灯片", "软著"] },
  assistant: { terms: ["personal ai assistant", "personal assistant", "ai assistant", "openclaw", "proactive", "agent memory", "个人助理", "個人助理", "私人助理", "ai 助手", "ai助手"] },
  "model-eval": { pull: 0.7, terms: ["llm benchmark", "benchmark", "benchmarks", "eval", "evals", "model evaluation", "leaderboard", "arena", "评测", "評測", "跑分"] },

  // API 閘道與帳號工具
  "api-gateway": { terms: ["api gateway", "ai gateway", "llm gateway", "llm router", "openai compatible", "api proxy", "proxy api", "newapi", "new api", "one api", "sub2api", "token", "api 代理", "api代理", "中转", "中轉", "反代", "网关", "閘道", "分发", "分發"] },
  "account-switch": { terms: ["account manager", "account switching", "account switcher", "switch accounts", "switcher", "switch", "multi account", "account sharing", "cursor pro", "账号", "帳號", "帐号", "续杯", "号池", "號池"] },

  // 聊天機器人與 IM
  astrbot: { terms: ["astrbot", "astrbot plugin"] },
  qq: { terms: ["qq", "qqbot", "onebot", "onebot11", "qqnt", "qq nt", "llonebot", "napcat", "tim", "群聊"] },
  telegram: { terms: ["telegram", "telegram bot"], pull: 0.8 },
  wechat: { terms: ["wechat", "weixin", "wx", "微信", "公众号", "公眾號", "视频号", "視頻號"], pull: 0.6 },
  "chat-analysis": { terms: ["chat history", "chat analyzer", "chat export", "chat exporter", "chat exports", "聊天记录", "聊天記錄", "群聊消息", "爬楼"] },

  // 電腦視覺與影像處理
  detection: { terms: ["yolo", "yolov8", "detector", "探测器", "探測器", "检测器", "檢測器", "识别器", "識別器", "recognizer", "sam", "sam2", "sam3", "segment anything", "segmentation", "image segmentation", "object detection", "groundingdino", "检测", "偵測", "打码", "打碼"] },
  "bg-removal": { terms: ["background removal", "background remover", "remove background", "rembg", "matting", "image matting", "birefnet", "去背", "抠图", "摳圖"] },
  "super-resolution": { terms: ["super resolution", "upscale", "upscaler", "upscaling", "esrgan", "real esrgan", "waifu2x", "dlss", "image restoration", "超分", "超解析"] },
  ocr: { terms: ["ocr", "text recognition", "文字识别", "文字辨識"] },
  "ai-watermark": { terms: ["synthid", "ai watermark", "watermark detection", "ai generated detection", "水印检测", "浮水印偵測"] },
  faceswap: { terms: ["faceswap", "face swap", "deepfake", "deepfacelab", "deepfacelive", "roop", "facefusion", "换脸", "換臉"] },
  "manga-translation": { terms: ["manga translator", "manga translation", "translate manga", "comic translation", "scanlation", "漫画翻译", "漫畫翻譯", "嵌字"] },

  // 圖片管理與瀏覽
  "image-management": { terms: ["image browser", "image browsing", "image viewer", "image previewer", "image hosting", "图床", "圖床", "图片浏览", "圖片瀏覽", "看图", "看圖", "asset management", "reference manager", "similar image", "similar images", "image search", "photo management", "图片管理", "圖片管理", "素材库", "素材庫", "图库", "圖庫", "相似图片", "参考素材", "參考素材"] },
  "image-metadata": { terms: ["metadata", "exif", "prompt reader", "image metadata", "pnginfo", "png info", "元数据", "中繼資料", "元資料"] },

  // 下載與爬蟲
  downloader: { terms: ["download", "downloader", "downloads", "youtube dl", "yt dlp", "aria2", "batch download", "gallery dl", "grabber", "下载", "下載"] },
  scraper: { terms: ["crawler", "crawl", "crawling", "scraper", "scraping", "web scraping", "spider", "data extraction", "爬虫", "爬蟲", "采集", "採集"] },

  // 教育與學習
  "ai-tutor": { terms: ["tutor", "tutoring", "ai tutor", "learning coach", "classroom", "interactive learning", "家教", "辅导", "輔導"] },
  lms: { terms: ["lms", "moodle", "canvas lms", "google classroom", "lti", "blackboard"] },
  chemistry: { terms: ["chemistry", "chemical", "molecule", "periodic table", "化学", "化學"] },
  classroom: { terms: ["quiz", "quizzes", "kahoot", "flashcard", "flashcards", "exam", "测验", "測驗", "题库", "題庫", "课堂", "課堂"] },
  awesome: { terms: ["awesome", "awesome list", "curated list", "roadmap", "cheatsheet", "cheat sheet", "interview", "tutorial", "tutorials", "course", "courses", "course material", "workshop", "workshops", "talk", "talks", "lecture", "lectures", "book", "books", "guide", "handbook", "learning resources", "programming books", "resources", "collection of", "list of", "beginner", "beginners", "learn", "notes", "学习路线", "學習路線", "教程", "面试", "面試"], weight: 0.7 },

  "coding-practice": { terms: ["leetcode", "algorithms", "data structure", "data structures", "advent of code", "adventofcode", "aoc", "kata", "katas", "exercise", "exercises", "exercism", "homework", "assignment", "coursework", "cs50", "project euler", "competitive programming", "刷题", "刷題", "数据结构", "資料結構"] },

  // 前端與設計
  "ui-library": { terms: ["component library", "components library", "ui library", "ui kit", "react components", "vue components", "shadcn", "radix ui", "ui components", "component", "components", "web components", "headless ui", "组件库", "組件庫", "元件庫"] },
  "design-system": { terms: ["design system", "design tokens", "figma", "ui ux", "ui/ux", "font", "fonts", "typeface", "icons", "icon", "icon set", "emoji", "svg", "colors", "palette", "color scheme", "colorscheme", "theme", "themes", "css framework", "stylesheet", "stylesheets", "css in js", "tailwind", "tailwindcss", "unocss", "postcss", "design md", "material design", "material 3", "design tool", "设计系统", "設計系統", "风格提取"] },
  "web-3d": { terms: ["three.js", "threejs", "webgl", "webxr", "vr", "glsl", "shader", "shaders", "html canvas", "canvas api", "3d", "raytracing", "ray tracing", "demoscene", "canvas 2d", "creative coding", "css animations", "web animation", "animated", "gsap", "creative websites", "动画网页", "動畫網頁", "动效", "動效"] },

  "frontend-framework": { terms: ["react", "reactjs", "react hooks", "vue", "vuejs", "vue3", "nuxt", "nuxtjs", "svelte", "sveltekit", "solidjs", "solid js", "angular", "preact", "remix", "remix stack", "next.js", "nextjs", "astro", "gatsby", "qwik", "jsx", "vdom", "virtual dom", "spa", "server components", "state management", "redux", "zustand", "mobx", "pinia", "router", "javascript framework"], pull: 0.7 },
  sites: { terms: ["github.io", "blog", "blogs", "website", "web site", "homepage", "home page", "personal site", "personal website", "portfolio", "static site", "static site generator", "ssg", "hugo", "jekyll", "hexo", "vitepress", "docusaurus", "documentation site", "docs site", "landing page", "articles", "personal articles", "diary", "journal", "记录", "記錄", "日记", "日記", "博客", "部落格", "个人网站", "個人網站", "官网", "官網", "网站", "網站"] },
  "browser-extension": { terms: ["browser extension", "chrome extension", "edge extension", "firefox extension", "firefox addon", "web extension", "webextension", "browser extensions", "userscript", "user script", "tampermonkey", "greasemonkey", "violentmonkey", "bookmarklet", "浏览器扩展", "浏览器插件", "瀏覽器擴充", "油猴"], pull: 0.8 },

  // Windows 與系統工具
  "windows-tools": { terms: ["windows", "windows 11", "win11", "cleaner", "duplicates", "optimizer", "winui", "winui3", "file manager", "debloat", "debloater", "registry", "powertoys", "tsf", "input method", "ime", "window manager", "tiling", "x11", "wayland", "macos app", "menu bar", "menubar", "hammerspoon", "raycast", "alfred", "工具箱", "输入法", "輸入法"], pull: 0.8 },
  terminal: { terms: ["terminal", "terminal emulator", "cmd", "命令行", "命令列", "ghostty", "tmux", "dotfiles", "dot files", "shell", "shell prompt", "shell script", "shell scripts", "zsh", "bash", "fish", "powershell", "statusline", "tui", "command line", "coreutils", "终端", "終端"] },
  "network-proxy": { terms: ["clash", "mihomo", "v2ray", "xray", "sing box", "shadowsocks", "trojan", "vpn", "wireguard", "tailscale", "ip quality", "ipquality", "proxy", "socks5", "dns", "翻墙", "科学上网", "ip质量"] },
  productivity: { terms: ["productivity", "clipboard", "pdf", "docx", "office", "excel", "word document", "rss", "rss reader", "feed reader", "阅读器", "閱讀器", "note taking", "notes app", "obsidian", "notion", "logseq", "todo", "todo list", "todomvc", "pomodoro", "calendar", "bookmarks", "time tracker", "activity tracker", "screen time", "剪切板", "剪贴板", "桌面整理", "启动器", "啟動器"] },

  translation: { terms: ["translation", "translations", "translator", "translate", "translating", "i18n", "l10n", "localization", "localisation", "翻译", "翻譯", "汉化", "漢化", "本地化"], pull: 0.8 },

  // 後端與資料庫
  "web-framework": { terms: ["web framework", "django", "flask", "fastapi", "express", "expressjs", "nestjs", "fastify", "hono", "spring boot", "rails", "ruby on rails", "sinatra", "laravel", "symfony", "symfony component", "symfony bundle", "silex", "composer", "phoenix", "gin", "koa", "asgi", "wsgi", "rest api", "restful", "graphql", "grpc", "http", "http server", "http client", "web server", "websocket", "websockets", "fetch", "api client", "network application framework", "backend", "api server", "microservices", "middleware", "email", "mailer", "后端", "後端"] },
  database: { terms: ["database", "databases", "sql", "postgres", "postgresql", "mysql", "sqlite", "redis", "mongodb", "orm", "prisma", "supabase", "clickhouse", "elasticsearch", "duckdb", "sqlite utils", "migrations", "key value", "kv", "cache", "caching", "queue", "search engine", "full text search", "fuzzy search", "搜索引擎", "搜尋引擎", "存储", "儲存", "storage", "crdt", "raft", "consensus", "数据库", "資料庫"] },

  // DevOps 與雲端
  containers: { terms: ["docker", "kubernetes", "k8s", "helm", "container", "containers", "podman", "docker compose", "容器"], pull: 0.7 },
  "cicd-cloud": { terms: ["ci/cd", "cicd", "ci cd", "github actions", "jenkins", "continuous integration", "terraform", "ansible", "infrastructure as code", "gitops", "argocd", "serverless", "github action", "travis ci", "infrastructure", "aws", "amazon web services", "google cloud", "cloudflare", "cloudflare worker", "cloudflare workers", "vercel", "netlify", "heroku", "fly.io", "deploy", "deployment", "vagrant", "packer", "nomad", "consul", "virtual machine", "virtualbox", "vmware", "hypervisor", "nix", "nixos", "packaging"] },
  "self-hosted": { terms: ["self hosted", "网盘", "網盤", "cloud drive", "file sharing", "file server", "selfhosted", "self host", "homelab", "home server", "nas", "自托管", "自架", "私有化部署"], pull: 0.6 },
  monitoring: { terms: ["monitoring", "observability", "prometheus", "grafana", "logging", "tracing", "opentelemetry", "uptime", "监控", "監控"] },

  // 資料科學與機器學習
  "ml-framework": { terms: ["machine learning", "deep learning", "neural net", "neural nets", "neural network library", "svm", "support vector machine", "model merge", "model merging", "模型融合", "distillation", "蒸馏", "蒸餾", "word2vec", "particle swarm", "粒子群", "神经网络", "神經網路", "random forest", "decision tree", "decision trees", "k means", "kmeans", "clustering", "naive bayes", "convnet", "convnets", "cnn", "rnn", "lstm", "autograd", "backpropagation", "gpu computation", "cuda", "pytorch", "tensorflow", "jax", "keras", "scikit learn", "sklearn", "neural network", "neural networks", "huggingface", "transformers", "机器学习", "機器學習", "深度学习", "深度學習"], pull: 0.6 },
  "data-analysis": { terms: ["data analysis", "data science", "datasette", "datasette plugin", "csv", "spreadsheet", "dataset", "datasets", "open data", "scipy", "scientific", "scientific computing", "math", "mathematics", "numerical", "linear algebra", "astronomy", "astrophysics", "simulation", "probabilistic", "gis", "geospatial", "maps", "openstreetmap", "geojson", "leaflet", "chart", "charts", "plot", "plotting", "pandas", "numpy", "jupyter", "data visualization", "visualization", "dataviz", "plotly", "matplotlib", "d3", "echarts", "dashboard", "kaggle", "statistics", "polars", "数据分析", "資料分析", "可视化", "視覺化"] },

  // 行動與遊戲開發
  "mobile-app": { terms: ["android", "ios", "react native", "flutter", "swiftui", "mobile app", "apk", "jetpack compose", "安卓"], pull: 0.6, languages: ["Swift", "Kotlin", "Dart", "Objective-C"] },
  "game-dev": { terms: ["game engine", "gamedev", "game development", "godot", "unity", "unity3d", "unreal", "unreal engine", "bevy", "pygame", "phaser", "physics engine", "game", "games", "emulator", "emulators", "emulation", "nes", "famicom", "gameboy", "game boy", "chip8", "chip 8", "pico 8", "pico8", "retro", "minecraft", "roguelike", "tetris", "chess", "sudoku", "wordle", "rogue like", "roguelite", "genshin", "game record", "mod", "mods", "modding", "模组", "模組", "galgame", "visual novel", "视觉小说", "視覺小說", "dota", "dota2", "steam", "touhou", "东方project", "原神", "崩坏", "崩壞", "明日方舟", "碧蓝航线", "碧藍航線", "赛马娘", "賽馬娘", "desktop pet", "virtual pet", "tamagotchi", "桌宠", "桌寵", "电子宠物", "電子寵物", "游戏", "遊戲", "游戏引擎", "遊戲引擎", "游戏开发", "遊戲開發"], languages: ["GDScript"] },

  // 開發工具與程式語言
  "programming-language": { terms: ["programming language", "compiler", "interpreter", "parser", "parsers", "parsing", "ast", "grammar", "textmate grammar", "syntax highlighting", "syntax highlighter", "shiki", "regex", "regexp", "regular expression", "regular expressions", "ecmascript", "tc39", "proposal", "macros", "type system", "type inference", "webassembly", "wasm", "bytecode", "runtime", "language server", "lsp", "javascript runtime", "runtime for javascript", "superset of javascript", "type checker", "编程语言", "程式語言", "编译器", "編譯器"] },
  "editor-ide": { terms: ["vscode", "vs code", "visual studio code", "neovim", "nvim", "vim", "emacs", "jetbrains", "code editor", "text editor", "ide", "vscode extension", "vim plugin", "language server protocol", "编辑器", "編輯器"], languages: ["Vim Script", "Vim script", "Emacs Lisp"] },
  "build-test": { terms: ["linter", "lint", "eslint", "prettier", "formatter", "bundler", "webpack", "esbuild", "rollup", "build tool", "build system", "test framework", "testing", "testing library", "test runner", "jest", "vitest", "pytest", "cypress", "unit test", "mock", "mocking", "code quality", "static analysis", "type checking", "eslint config", "eslint plugin", "bundle", "swc", "vite", "vite plugin", "babel", "babel plugin", "babel macro", "macro", "transpiler", "polyfill", "polyfills", "shim", "codemod", "module loader", "tsconfig", "profiler", "profiling", "performance monitor", "npm publish", "monorepo", "package manager", "pnpm", "yarn", "npm"] },
  libraries: { terms: ["library", "libraries", "lib", "package", "packages", "npm package", "crate", "crates", "gem", "module", "modules", "sdk", "bindings", "binding", "wrapper", "utilities", "utility", "utils", "helper", "helpers", "implementation", "routines", "logger", "json", "yaml", "toml", "string", "strings", "datetime", "uuid", "hash", "hashing", "encoding", "async", "promise", "promises", "stream", "streams", "event emitter", "filesystem", "file system", "argument parser", "代码库", "函数库", "函式庫", "工具库", "工具庫"], pull: 0.8 },
  templates: { terms: ["template", "templates", "starter", "starter kit", "boilerplate", "scaffold", "scaffolding", "cookiecutter", "example", "examples", "demo", "demos", "playground", "sandbox", "showcase", "sample", "samples", "test repo", "reproduction", "repro", "epic stack", "create app", "模板", "示例", "范例", "範例"], pull: 0.8 },
  "git-tools": { terms: ["git", "gitlab", "github api", "github cli", "github app", "github bot", "github notifications", "github profile", "github stars", "github issues", "github profile", "readme", "badge", "badges", "pull request", "pull requests", "git hooks", "changelog", "release notes", "diff tool", "version control"] },
  security: { terms: ["security", "secure", "cryptography", "encryption", "encrypt", "password", "passwords", "password hashing", "auth", "authentication", "authorization", "oauth", "jwt", "login", "2fa", "totp", "csrf", "xss", "vulnerability", "vulnerabilities", "penetration testing", "pentest", "ctf", "fuzzer", "fuzzing", "malware", "virus", "病毒", "reverse engineering", "firewall", "secrets", "helmet", "cors", "安全", "加密", "逆向"] },

  // 其他
  business: { terms: ["monetization", "saas", "startup", "marketing", "make money", "ecommerce", "e commerce", "side hustle", "变现", "變現", "赚钱", "賺錢", "创业", "創業", "副业", "副業", "省钱", "理财", "理財"] },
  "quant-trading": { terms: ["quant", "quantitative", "trading", "stock", "stocks", "cryptocurrency", "cryptocurrencies", "blockchain", "ethereum", "solidity", "web3", "defi", "nft", "backtest", "backtesting", "forex", "bitcoin", "量化", "股票", "炒股", "看盘", "看盤", "a股", "股市"] },
};

/** Category-level signals for items that clearly belong somewhere but fit no subject. */
export const CATEGORY_KEYWORDS: Record<string, KeywordEntry> = {
  "ai-image": { terms: ["stable diffusion", "sdxl", "noobai", "illustrious", "pony diffusion", "animagine", "二次元模型", "2次元模型", "动漫模型", "anime model", "photoshop plugin", "sampler", "samplers", "k diffusion", "euler a", "scheduler", "image generation", "text2image", "text to image", "txt2img", "ai art", "krita", "diffusion model", "dit", "inpainting", "生图", "生圖", "文生图", "绘画", "繪畫", "绘图", "繪圖", "出图"] },
  "coding-agent": { terms: ["coding agent", "coding agents", "agent native", "ai code generation", "llm code generation", "ai code assistant", "code assistant", "agent harness", "cursor", "windsurf", "kiro", "copilot", "aider", "vibe coding", "gemini cli", "ai ide", "agent ide", "ade"] },
  llm: { terms: ["llm", "llms", "large language model", "prompt engineering", "system prompt", "system prompts", "chatgpt prompts", "gpt prompts", "llm prompts", "ai prompts", "prompt template", "prompt templates", "anthropic", "openai", "large language models", "chatgpt", "gpt", "deepseek", "qwen", "llama", "ai client", "language model", "language models", "vision language model", "vision language models", "vlm", "vlms", "multimodal llm", "flash attention", "jailbreak", "ai research", "ai4s", "大模型", "写作", "寫作"] },
  vision: { terms: ["computer vision", "photo", "photograph", "camera", "picture", "pictures", "图片", "圖片", "图像", "圖像", "image classification", "clip", "aesthetic", "image quality", "opencv", "mosaic", "image processing", "ncnn", "gfpgan", "图像处理", "影像處理", "马赛克", "馬賽克"] },
  audio: { terms: ["audio", "speech", "voice", "sound", "隔音", "噪音", "音乐", "音樂", "乐器", "樂器", "music", "music player", "audio player", "player", "podcast", "spotify", "音频", "音訊", "语音", "語音"] },
  video: { terms: ["video", "animation", "live2d", "vmd", "mmd", "视频", "影片", "动画", "動畫"] },
  chatbot: { terms: ["bot", "chatbot", "robot", "discord bot", "机器人", "機器人"] },
  "image-mgmt": { terms: ["gallery", "image viewer", "photos", "相册", "相簿"] },
  "ai-lora": { terms: ["training", "finetune", "finetuning", "fine tune", "fine tuning", "trainer"] },
  education: { terms: ["education", "e learning", "teaching", "learning", "vocabulary", "language learning", "单词", "單詞", "背诵", "背誦", "记单词", "記單詞", "教学", "教學", "学习", "學習", "课程", "課程"] },
  frontend: { terms: ["frontend", "front end", "slides", "slideshow", "presentation", "presentations", "reveal.js", "slidev", "css", "html", "react", "vue", "svelte", "tailwind", "tailwindcss", "nextjs", "web design", "ui", "ux", "前端"] },
  system: { terms: ["desktop", "desktop app", "system tool", "utility", "ebpf", "kernel", "linux kernel", "driver", "drivers", "firmware", "embedded", "microcontroller", "arduino", "raspberry pi", "iot", "esp32", "operating system", "ros", "robotics", "robot operating system", "kinect", "hardware", "diy", "pcb", "3d printing", "3d打印", "3d 打印", "电路", "電路", "传感器", "感測器", "sensor", "sensors", "气象", "氣象", "weather station", "观测站", "觀測站", "usb", "屏幕", "螢幕", "单片机", "單片機", "树莓派", "樹莓派", "硬件", "硬體", "系统工具", "系統工具"] },
  devtools: { terms: ["developer tools", "developer tool", "devtools", "dev tools", "github", "license", "licence", "许可证", "許可證", "cli", "cli tool", "cli app", "command line tool", "debugger", "debugging", "开发工具", "開發工具"] },
  "data-ml": { terms: ["data", "analytics", "jupyter notebook", "algorithm", "算法", "演算法", "模型", "classifier", "classification", "分类模型", "分類模型"] },
  backend: { terms: ["api", "apis", "server side", "php", "distributed systems", "distributed system", "microservice"] },
};

/**
 * Topics that only describe the tech stack an app is built with ("react",
 * "typescript"); they say nothing about what the repo is about, so the
 * classifier ignores them in the topics field.
 */
export const STACK_TOPICS = new Set([
  "react", "vue", "vue3", "vuejs", "svelte", "vite", "typescript", "javascript", "python", "python3",
  "rust", "golang", "go", "java", "kotlin", "swift", "csharp", "dotnet", "cpp", "nodejs", "node",
  "tailwind", "tailwindcss", "nextjs", "electron", "tauri", "tauri-app", "flutter", "dart", "zig",
  "pyqt6", "gradio", "tkinter", "vuetifyjs", "open-source", "opensource", "oss", "hacktoberfest", "ai", "free",
  // platforms and storage an app runs on, rather than what it is about
  "windows", "macos", "linux", "android", "ios", "cross-platform", "multiplatform", "desktop-app",
  "sqlite", "postgresql", "postgres", "mysql", "redis", "mongodb", "docker",
]);

/**
 * Last resort for repos no keyword matched (often own repos with no topics and
 * a one-word description): guess the category from the main language. These
 * items get a category but no subject.
 */
export const LANGUAGE_FALLBACK: Record<string, string> = Object.fromEntries(
  Object.entries({
    frontend: ["HTML", "CSS", "SCSS", "Sass", "Less", "Stylus", "Vue", "Svelte", "Astro", "MDX", "JavaScript", "TypeScript", "CoffeeScript", "Elm", "Handlebars", "EJS", "Pug", "ReScript", "PureScript", "LiveScript"],
    backend: ["PHP", "Ruby", "Elixir", "Erlang", "Java", "Scala", "Groovy", "Blade", "Twig", "Hack", "Perl"],
    devtools: ["Python", "Rust", "Go", "C", "C++", "Zig", "Haskell", "OCaml", "Nim", "Crystal", "D", "V", "Assembly", "Lua", "Clojure", "F#", "Racket", "Scheme", "Common Lisp", "Makefile", "CMake", "Starlark", "WebAssembly", "Raku", "Tcl", "Vim Script", "Vim script", "Emacs Lisp"],
    "data-ml": ["Jupyter Notebook", "R", "Julia", "MATLAB", "Fortran", "Stata", "SAS", "Mathematica", "Cuda"],
    system: ["Shell", "PowerShell", "Batchfile", "AutoHotkey", "AppleScript", "C#", "Visual Basic .NET", "NSIS", "Inno Setup"],
    devops: ["Dockerfile", "HCL", "Nix", "Jsonnet", "Puppet"],
    "mobile-game": ["Swift", "Kotlin", "Dart", "Objective-C", "Objective-C++", "GDScript", "ShaderLab", "HLSL"],
  }).flatMap(([category, languages]) => languages.map((language) => [language, category])),
);
