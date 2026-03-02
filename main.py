from fastapi import FastAPI, UploadFile
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import numpy as np
import whisper
import yt_dlp
import tempfile
import os
import requests
import json

app = FastAPI()
model = whisper.load_model("base")
embed_model = SentenceTransformer("all-MiniLM-L6-v2")

class VideoURL(BaseModel):
    url: str


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
    
def generate_basic_notes(chunks):
    notes=[]

    for idx, chunk in enumerate(chunks):
        notes.append({
            "topic": f"Topic {idx+1}",
            "content": chunk,
            "summary": chunk[:200]
        })

        return notes

def generate_structured_notes(chunks):
    topics = []

    for chunk in chunks:
        prompt = f"""
You are an expert educator.

From this lecture section:

\"\"\"{chunk}\"\"\"

Extract:
1. A short topic title
2. A 3-5 sentence summary
3. 5 key bullet points

Return ONLY valid JSON in this format:

{{
  "title": "",
  "summary": "",
  "key_points": []
}}
"""

        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "mistral",
                "prompt": prompt,
                "stream": False
            }
        )

        result = response.json()
        content = result["response"]

        try:
            topics.append(json.loads(content))
        except:
            topics.append({
                "title": "Parsing Error",
                "summary": content,
                "key_points": []
            })

    return topics

@app.post("/transcribe")
async def transcribe_video(file: UploadFile):
    file_path = f"temp_{file.filename}"

    with open(file_path, "wb") as f:
        f.write(await file.read())

    result = model.transcribe(file_path, fp16=False)

    os.remove(file_path)

    return {"transcript": result["text"]}


@app.post("/transcribe-youtube")
async def transcribe_youtube(video: VideoURL):
    try:
        audio_file = download_audio_temp(video.url)
        result = model.transcribe(audio_file, fp16=False)

        transcript = result["text"]

        chunks = semantic_chunk(transcript)
        structured_notes=generate_structured_notes(chunks)

        return {
            "transcript": transcript,
            "topics": structured_notes
        }

    except Exception as e:
        return {"error": str(e)}

    finally:
        if 'audio_file' in locals() and os.path.exists(audio_file):
            os.remove(audio_file)