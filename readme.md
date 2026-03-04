# 📘 Video Note Extraction AI

An AI-powered application that transforms YouTube videos or uploaded videos into structured notes:

- 🎥 Accepts a YouTube video URL or uploaded video file
- 🎙️ Extracts audio using yt-dlp
- 🧠 Transcribes audio using Whisper (local, offline)
- 🧩 Splits transcript into semantic chunks using Sentence Transformers
- 🤖 Generates structured topic-wise notes using a local LLM (Ollama)
- 📄 Exports results as TXT files

✅ Fully local - No paid APIs required
✅ Fast transcript access - Read transcript while AI generates summary
✅ Portfolio-ready full-stack AI application

---

# 🚀 Quick Start (Normal Users)

## Prerequisites

1. **Ollama** - Download from https://ollama.com/download and install
2. **ffmpeg** - Required for audio processing
   - Windows: Download from https://ffmpeg.org/download.html, extract, add `bin` folder to PATH
   - Mac: `brew install ffmpeg`
3. **downlad the zip file of this repo**

## Setup (One-time)

1. Double-click `setup.bat` 
2. Wait for dependencies to install

## Running the App

1. Double-click `run.bat`
2. Wait for backend to load (shows "All Started!")
3. Open browser: http://localhost:5173
4. Go to **Models** tab → Select a model → Click "Load Model"
5. Go to **Home** tab → Enter YouTube URL or upload video → Click Transcribe
6. Watch progress on **Result** tab

---

# 🛠 Developer Setup

## Prerequisites

- Python 3.10+
- Node.js 18+
- Ollama installed
- ffmpeg installed

## Step 1: Clone Repository

```bash
git clone https://github.com/Babar-Meet/AI-Transcribe-Summarize-any-video
cd AI-Transcribe-Summarize-any-video
```

## Step 2: Backend Setup

### Create Virtual Environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
```

### Install Backend Dependencies

```bash
pip install -r requirements.txt
```

### Download Ollama Model

```bash
ollama pull llama3.2
# or any model you want to use
```

## Step 3: Frontend Setup

```bash
cd frontend
npm install
```

## Step 4: Run Development Servers

### Terminal 1 - Start Ollama

```bash
ollama serve
```

### Terminal 2 - Start Backend

```bash
uvicorn main:app --reload
```

### Terminal 3 - Start Frontend

```bash
cd frontend
npm run dev
```

Access the app at: http://localhost:5173

---

# 📖 How It Works

## Architecture Flow

```
YouTube URL / Video File
         ↓
  yt-dlp (extract audio)
         ↓
  Whisper (speech → text)
         ↓
  Semantic Chunking
  (Sentence Transformers)
         ↓
  Ollama LLM
  (generate structured notes)
         ↓
  Frontend Display
```

## Key Features

### 1. Fast Transcript Access
- Transcript becomes available immediately after Whisper transcription
- Users can read and export transcript while AI processes summary
- No waiting for AI to finish

### 2. Flexible AI Processing
- Users can select any Ollama model
- Different models produce different quality/speed results
- AI summary generation may take time depending on:
  - Video length
  - Model size
  - Computer performance

### 3. Redux State Management
- All application state managed in Redux store
- Separate slices for:
  - Models (available models, selected model)
  - Processing (loading states)
  - Results (transcript, topics, stats)
  - Progress (step tracking)

### 4. React Router Navigation
- Three main pages:
  - **Home**: Input YouTube URL or upload video
  - **Models**: Select and load Ollama model
  - **Result**: View progress and results

---

# 📁 Project Structure

```
Notes_Creator/
│
├── main.py                 # FastAPI backend
├── requirements.txt        # Python dependencies
├── setup.bat             # One-time setup script
├── run.bat              # Run the application
│
└── frontend/            # React frontend
    ├── src/
    │   ├── store/           # Redux store
    │   │   ├── index.js
    │   │   └── slices/
    │   │       └── appSlice.js
    │   ├── pages/
    │   │   ├── Home.jsx     # Input page
    │   │   ├── Models.jsx   # Model selection
    │   │   └── Result.jsx   # Progress & results
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   └── Layout.jsx
    │   ├── services/
    │   │   └── api.js       # API calls
    │   ├── App.jsx
    │   ├── App.css
    │   └── main.jsx
    └── package.json
```

---

# 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/models` | Get available Ollama models |
| POST | `/load-model` | Load a specific model |
| POST | `/kill-model` | Stop running model |
| POST | `/transcribe` | Transcribe video file |
| POST | `/transcribe-youtube` | Transcribe YouTube URL (SSE) |

---

# ⚠️ Common Issues

## Ollama not found
- Ensure Ollama is installed and in PATH
- Run `ollama serve` in terminal

## ffmpeg not found
- Install ffmpeg and add to system PATH
- Restart terminal after installation

## Model takes too long
- This is normal! Large models need time
- You can read the transcript while waiting
- Try a smaller model (like llama3.2:1b)

## 403 Forbidden (YouTube)
- Add authentication cookies to `frontend/public/cookie.txt`
- See yt-dlp cookie format

---

# 🔥 Future Improvements

- [ ] Add more Ollama models
- [ ] Video file transcription with progress
- [ ] Multiple export formats (PDF, Markdown)
- [ ] History of processed videos
- [ ] User accounts (optional)
- [ ] Batch processing
- [ ] Flashcard generation

---

# 👨‍💻 Built With

**Backend:**
- Python 3.10+
- FastAPI
- Whisper (speech-to-text)
- yt-dlp (YouTube extraction)
- Sentence Transformers (semantic chunking)
- Ollama (local LLM)

**Frontend:**
- React 19
- Redux Toolkit (state management)
- React Router DOM (navigation)
- Vite (build tool)

---

# 📜 License

MIT License - Feel free to use and modify!
