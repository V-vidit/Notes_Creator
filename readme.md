# 📘 Video Note Extraction AI

An AI-powered backend system that:
- 🎥 Accepts a YouTube video URL or uploaded video
- 🎙️ Extracts audio
- 🧠 Transcribes using Whisper (local)
- 🧩 Splits transcript into semantic chunks
- 🤖 Generates structured topic-wise notes using a local LLM (Ollama + Mistral)
- 📄 Returns clean structured JSON

✅ Fully local  
✅ No paid APIs  
✅ Portfolio-ready AI backend  

---

# 🚀 Architecture

YouTube Video  
↓  
yt-dlp (audio extraction)  
↓  
ffmpeg  
↓  
Whisper (speech → text)  
↓  
Semantic Chunking  
↓  
Mistral (via Ollama)  
↓  
Structured Topic Notes  

---

# 🛠 Tech Stack

- Python 3.10+
- FastAPI
- Whisper
- yt-dlp
- ffmpeg
- Ollama
- Mistral (7B model)

---

# 📦 Full Setup Guide

## 1️⃣ Clone Repository

```bash
git clone <your_repo_url>
cd Notes_Creator
```

---

## 2️⃣ Create Virtual Environment

### 🟢 On Mac / Linux

```bash
python3 -m venv venv
source venv/bin/activate
```

### 🟢 On Windows (PowerShell)

```powershell
python -m venv venv
venv\Scripts\activate
```

If execution policy error appears:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then activate again.

---

## 3️⃣ Install Python Dependencies

```bash
pip install -r requirements.txt
```

If installing manually:

```bash
pip install fastapi uvicorn openai-whisper yt-dlp requests python-multipart
```

---

## 4️⃣ Install ffmpeg (Required)

### 🟢 On Mac (Homebrew)

```bash
brew install ffmpeg
```

Verify:

```bash
which ffmpeg
```

If not detected:

```bash
export PATH="/opt/homebrew/bin:$PATH"
```

Add permanently in `~/.zshrc` if needed.

---

### 🟢 On Windows

1. Download ffmpeg from: https://ffmpeg.org/download.html  
2. Extract it.  
3. Add the `bin` folder to System Environment Variables → PATH  
4. Restart terminal  

Verify:

```powershell
ffmpeg -version
```

---

## 5️⃣ Install Ollama (Local LLM)

### 🟢 On Mac

```bash
brew install ollama
```

### 🟢 On Windows

Download and install from:  
https://ollama.com/download

---

## 6️⃣ Start Ollama Server

Open Terminal 1:

```bash
ollama serve
```

Leave this running.

---

## 7️⃣ Download Mistral Model

Open Terminal 2:

```bash
ollama pull mistral
```

Test:

```bash
ollama run mistral
```

Exit with:

```
/bye
```

---

## 8️⃣ Run FastAPI Server

```bash
uvicorn main:app --reload
```

Server runs at:

http://127.0.0.1:8000  

Swagger Docs:

http://127.0.0.1:8000/docs  

---

# 📡 API Endpoints

## 🎥 Upload Video

POST `/transcribe`

Form-data:
```
file: video.mp4
```

---

## 🔗 YouTube URL

POST `/transcribe-youtube`

```json
{
  "url": "https://youtube.com/..."
}
```

Response:

```json
{
  "transcript": "...",
  "topics": [
    {
      "title": "Topic Name",
      "summary": "Short explanation...",
      "key_points": [
        "Point 1",
        "Point 2"
      ]
    }
  ]
}
```

---

# ⚠️ Common Errors & Fixes

## ❌ ffmpeg not found

Make sure:
```
ffmpeg -version
```
works in terminal.

---

## ❌ Ollama connection refused

Make sure:
```
ollama serve
```
is running.

---

## ❌ JSON parsing error from LLM

Local models sometimes add extra text.  
The code includes fallback handling.

---

# 📁 Project Structure

```
Notes_Creator/
│
├── main.py
├── requirements.txt
├── .gitignore
├── README.md
└── venv/
```

---

# 🔥 Future Improvements

- Parallel LLM chunk processing
- Global summary generation
- Flashcards generation
- React frontend integration
- Background task queue
- Vector database (RAG-ready)

---

# 👨‍💻 Author

Built as an AI Core learning project to understand:
- Speech-to-text pipelines
- Local LLM integration
- Structured AI outputs
- Backend AI architecture