from fastapi import FastAPI, UploadFile
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi import Query
from sentence_transformers import SentenceTransformer
import numpy as np
import whisper
import yt_dlp
import tempfile
import os
import requests
import json
import subprocess
import shutil
import asyncio

app = FastAPI()

# Add CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = whisper.load_model("base")
embed_model = SentenceTransformer("all-MiniLM-L6-v2")

class VideoURL(BaseModel):
    url: str
    model: str = None


def get_ollama_models():
    """Get list of available Ollama models using ollama list command"""
    try:
        ollama_path = shutil.which("ollama")
        if not ollama_path:
            return {"error": "Ollama not found in PATH", "models": []}
        
        result = subprocess.run(
            ["ollama", "list"],
            capture_output=True,
            text=True,
            timeout=30,
            shell=True
        )
        
        if result.returncode == 0:
            lines = result.stdout.strip().split("\n")
            models = []
            for line in lines[1:]:
                if line.strip():
                    parts = line.split()
                    if parts and len(parts) >= 1:
                        models.append(parts[0])
            return {"models": models, "raw": result.stdout}
        else:
            return {"error": result.stderr, "models": [], "raw": result.stdout}
    except FileNotFoundError:
        return {"error": "Ollama executable not found. Is Ollama installed?", "models": []}
    except Exception as e:
        return {"error": str(e), "models": [], "raw": ""}


def load_ollama_model(model_name):
    """Load an Ollama model if not already loaded"""
    try:
        result = subprocess.run(
            ["ollama", "list"],
            capture_output=True,
            text=True,
            timeout=30,
            shell=True
        )
        return True
    except Exception as e:
        print(f"Error loading model: {e}")
        return False


def kill_ollama_model():
    """Kill/stop the running Ollama model"""
    try:
        subprocess.run(
            ["ollama", "stop"],
            capture_output=True,
            timeout=10,
            shell=True
        )
        return True
    except:
        pass
    
    try:
        subprocess.run(
            ["taskkill", "/F", "/IM", "ollama.exe"],
            capture_output=True,
            timeout=10,
            shell=True
        )
        return True
    except Exception as e:
        print(f"Error killing model: {e}")
        return False


@app.get("/models")
async def get_models():
    """Get list of available Ollama models"""
    result = get_ollama_models()
    return result


@app.post("/load-model")
async def load_model_endpoint(model_name: str):
    """Load a specific Ollama model"""
    success = load_ollama_model(model_name)
    return {"success": success, "model": model_name}


@app.post("/kill-model")
async def kill_model_endpoint():
    """Kill the running Ollama model"""
    success = kill_ollama_model()
    return {"success": success}


def download_audio_temp(url: str):
    with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
        temp_name = tmp_file.name

    ydl_opts = {
        'format': 'bestaudio[ext=m4a]/bestaudio/best',
        'outtmpl': temp_name + ".%(ext)s",
        'quiet': True,
        'noplaylist': True,
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        downloaded_file = ydl.prepare_filename(info)

    return downloaded_file


def semantic_chunk(transcript, threshold=0.75):
    sentences = transcript.split(". ")

    if len(sentences) <= 1:
        return [transcript]
    
    embeddings = embed_model.encode(sentences)

    chunks = []
    current_chunk = sentences[0]

    for i in range(1,len(sentences)):
        sim = np.dot(embeddings[i], embeddings[i-1]) / (
            np.linalg.norm(embeddings[i]) * np.linalg.norm(embeddings[i-1])
        )

        if sim < threshold: 
            chunks.append(current_chunk)
            current_chunk=sentences[i]
        else:
            current_chunk += ". " + sentences[i]
        
        chunks.append(current_chunk)
        return chunks


def generate_structured_notes(chunks, model_name=None):
    """Process all chunks together in a single LLM call for better results."""
    topics = []
    total_chunks = len(chunks)
    
    if not model_name:
        models_result = get_ollama_models()
        available_models = models_result.get("models", [])
        if available_models:
            selected_model = available_models[0]
        else:
            selected_model = "gpt-oss:20b"
    else:
        selected_model = model_name

    # Combine all chunks into a single prompt
    combined_content = "\n\n".join([f"--- Section {i+1} ---\n{chunk}" for i, chunk in enumerate(chunks)])
    
    prompt = f"""
You are an expert educator. Below is a transcript that has been split into {total_chunks} sections.

{combined_content}

For EACH section, extract the following information and return it as a JSON array. Each element in the array represents one section.

Return a JSON array in this format (one object per section):

[
  {{
    "title": "short topic title for this section",
    "summary": "3-5 sentence summary of this section",
    "key_points": ["key point 1", "key point 2", "key point 3", "key point 4", "key point 5"]
  }},
  ...
]

Ensure you have exactly {total_chunks} entries in the array, one for each section. Return ONLY valid JSON, no explanation."""

    try:
        # No timeout - let the client PC take as long as it needs
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": selected_model,
                "prompt": prompt,
                "stream": False
            },
            timeout=None  # No timeout - let it run as long as needed
        )
        
        result = response.json()
        content = result.get("response", "")

        # Try to parse the JSON response
        try:
            # Clean up potential markdown code blocks
            content = content.strip()
            if content.startswith("```json"):
                content = content[7:]
            elif content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            
            topics = json.loads(content.strip())
            
            # Ensure we have a list
            if not isinstance(topics, list):
                topics = [topics]
        except json.JSONDecodeError as e:
            # If JSON parsing fails, create fallback entries for each chunk
            topics = []
            for i, chunk in enumerate(chunks):
                topics.append({
                    "title": f"Section {i+1}",
                    "summary": chunk[:200] + "..." if len(chunk) > 200 else chunk,
                    "key_points": ["Could not parse LLM response"]
                })
    except Exception as e:
        # On error, create fallback entries
        for i, chunk in enumerate(chunks):
            topics.append({
                "title": f"Section {i+1}",
                "summary": str(e),
                "key_points": []
            })

    return topics, selected_model


@app.post("/transcribe")
async def transcribe_video(file: UploadFile, model: str = None):
    file_path = f"temp_{file.filename}"

    with open(file_path, "wb") as f:
        f.write(await file.read())

    result = model.transcribe(file_path, fp16=False)
    transcript = result["text"]
    
    os.remove(file_path)
    
    # Generate structured notes if model provided
    topics = []
    actual_model = None
    
    if model:
        chunks = semantic_chunk(transcript)
        structured_notes, actual_model = generate_structured_notes(chunks, model)
        return {
            "transcript": transcript,
            "topics": structured_notes,
            "word_count": len(transcript.split()),
            "chunk_count": len(chunks),
            "model_used": actual_model
        }
    
    return {"transcript": transcript}


@app.post("/transcribe-youtube")
async def transcribe_youtube(video: VideoURL):
    """Transcribe YouTube video with progress updates using SSE"""
    
    async def progress_generator():
        try:
            # Step 1: Extract Audio - START
            yield f"data: {json.dumps({'step': 1, 'status': 'in_progress', 'message': '📥 Extracting audio from YouTube video...', 'progress': 5})}\n\n"
            await asyncio.sleep(0.5)
            
            # Download audio
            audio_file = download_audio_temp(video.url)
            
            # Step 1: Extract Audio - DONE
            yield f"data: {json.dumps({'step': 1, 'status': 'done', 'message': '✅ Audio extracted!', 'progress': 20})}\n\n"
            await asyncio.sleep(0.3)
            
            # Step 2: Transcribe - START
            yield f"data: {json.dumps({'step': 2, 'status': 'in_progress', 'message': '🎙️ Transcribing with Whisper AI...', 'progress': 30})}\n\n"
            
            result = model.transcribe(audio_file, fp16=False)
            transcript = result["text"]
            word_count = len(transcript.split())
            
            # Step 2: Transcribe - DONE - Send transcript immediately!
            yield f"data: {json.dumps({'step': 2, 'status': 'done', 'message': f'✅ Transcribed! ({word_count} words)', 'progress': 40, 'transcript_ready': True, 'transcript': transcript, 'word_count': word_count})}\n\n"
            await asyncio.sleep(0.3)
            
            # Clean up audio file
            if os.path.exists(audio_file):
                os.remove(audio_file)
            
            # Step 3: Chunk Text - START
            yield f"data: {json.dumps({'step': 3, 'status': 'in_progress', 'message': '✂️ Creating semantic chunks...', 'progress': 50})}\n\n"
            
            chunks = semantic_chunk(transcript)
            
            # Step 3: Chunk Text - DONE
            yield f"data: {json.dumps({'step': 3, 'status': 'done', 'message': f'✅ Created {len(chunks)} chunks', 'progress': 60, 'chunks_ready': True, 'chunk_count': len(chunks)})}\n\n"
            await asyncio.sleep(0.3)
            
            # Step 4: AI Processing - START
            model_to_use = video.model if video.model else "auto-select"
            yield f"data: {json.dumps({'step': 4, 'status': 'in_progress', 'message': f'🤖 Generating summary with {model_to_use}... (This may take a while)', 'progress': 70, 'ai_processing': True, 'transcript': transcript, 'topics': [], 'word_count': word_count, 'chunk_count': len(chunks), 'model_used': model_to_use})}\n\n"
            
            # This is where LLM processes - may take a while on slow PCs
            structured_notes, actual_model = generate_structured_notes(chunks, video.model)
            
            # Step 4: AI Processing - DONE
            yield f"data: {json.dumps({'step': 4, 'status': 'done', 'message': f'✅ Summary generated!', 'progress': 90})}\n\n"
            await asyncio.sleep(0.3)
            
            # Final result - Step 5: Complete
            final_result = {
                "transcript": transcript,
                "topics": structured_notes,
                "word_count": word_count,
                "chunk_count": len(chunks),
                "model_used": actual_model,
                "ai_complete": True
            }
            
            yield f"data: {json.dumps({'step': 5, 'status': 'done', 'message': '🎉 All done!', 'progress': 100, 'result': final_result})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'step': -1, 'message': f'❌ Error: {str(e)}', 'progress': 0, 'error': True})}\n\n"
    
    return StreamingResponse(progress_generator(), media_type="text/event-stream")


@app.post("/transcribe-youtube-sync")
async def transcribe_youtube_sync(video: VideoURL):
    """Synchronous version for simple transcription without progress"""
    try:
        audio_file = download_audio_temp(video.url)
        result = model.transcribe(audio_file, fp16=False)
        transcript = result["text"]
        
        if os.path.exists(audio_file):
            os.remove(audio_file)
        
        chunks = semantic_chunk(transcript)
        structured_notes, actual_model = generate_structured_notes(chunks, video.model)
        
        return {
            "transcript": transcript,
            "topics": structured_notes,
            "word_count": len(transcript.split()),
            "chunk_count": len(chunks),
            "model_used": actual_model
        }

    except Exception as e:
        return {"error": str(e)}
