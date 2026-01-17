import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from managers.connection_manager import ConnectionManager
from services.llm_service import ModerationService, LLMService
import uuid

# Load environment variables
load_dotenv()

app = FastAPI(title="PrismEcho Backend")
manager = ConnectionManager()
moderation_service = ModerationService()
llm_service = LLMService()

# In-memory room storage (replace with database in production)
rooms = {}

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---

class CreateRoomRequest(BaseModel):
    title: str
    topic: str

class CreateRoomResponse(BaseModel):
    success: bool
    room_id: str = None
    error: str = None
    opening_question: str = None

class ModerateRequest(BaseModel):
    text: str

class ModerateResponse(BaseModel):
    is_safe: bool
    reason: str = None


# --- REST Endpoints ---

@app.get("/")
async def get():
    return {"message": "PrismEcho Backend is running"}

@app.get("/api/rooms")
async def get_rooms():
    """Get all active rooms."""
    return {"rooms": list(rooms.values())}

@app.post("/api/rooms/create", response_model=CreateRoomResponse)
async def create_room(request: CreateRoomRequest):
    """Create a new debate room with content moderation."""
    
    # Validate title
    if len(request.title.strip()) < 3:
        return CreateRoomResponse(success=False, error="Title must be at least 3 characters.")
    
    if len(request.title) > 50:
        return CreateRoomResponse(success=False, error="Title must be under 50 characters.")
    
    # Validate topic
    if len(request.topic.strip()) < 10:
        return CreateRoomResponse(success=False, error="Topic must be at least 10 characters.")
    
    if len(request.topic) > 200:
        return CreateRoomResponse(success=False, error="Topic must be under 200 characters.")
    
    # Content moderation
    is_safe, reason = await moderation_service.moderate_content(request.title)
    if not is_safe:
        return CreateRoomResponse(success=False, error=f"Title rejected: {reason}")
    
    is_safe, reason = await moderation_service.moderate_content(request.topic)
    if not is_safe:
        return CreateRoomResponse(success=False, error=f"Topic rejected: {reason}")
    
    # Generate opening question
    opening_question = await llm_service.generate_opening_question(request.topic)
    
    # Create room
    room_id = f"custom-{uuid.uuid4().hex[:8]}"
    rooms[room_id] = {
        "id": room_id,
        "title": request.title.strip(),
        "topic": request.topic.strip(),
        "opening_question": opening_question,
        "participants": 0,
        "color": "from-emerald-500 to-teal-400"  # Default color for custom rooms
    }
    
    return CreateRoomResponse(
        success=True,
        room_id=room_id,
        opening_question=opening_question
    )

@app.post("/api/moderate", response_model=ModerateResponse)
async def moderate_content(request: ModerateRequest):
    """Check if content is safe."""
    is_safe, reason = await moderation_service.moderate_content(request.text)
    return ModerateResponse(is_safe=is_safe, reason=reason if not is_safe else None)


# Audio Processing Models
class AudioProcessResponse(BaseModel):
    success: bool
    transcript: str = None
    summary: str = None
    error: str = None


@app.post("/api/audio/process", response_model=AudioProcessResponse)
async def process_audio(file: bytes = None):
    """Process audio file: transcribe and summarize using Gemini 2.0."""
    from fastapi import File, UploadFile
    # Note: This is a simplified endpoint. In production, use UploadFile.
    
    if not file:
        return AudioProcessResponse(success=False, error="No audio file provided")
    
    try:
        transcript, summary = await llm_service.transcribe_and_summarize_audio(file, "audio/webm")
        return AudioProcessResponse(
            success=True,
            transcript=transcript,
            summary=summary
        )
    except Exception as e:
        return AudioProcessResponse(success=False, error=str(e))


# File upload version (better for production)
from fastapi import File, UploadFile

@app.post("/api/audio/upload")
async def upload_and_process_audio(file: UploadFile = File(...)):
    """Upload audio file for transcription and summarization."""
    
    if not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="File must be an audio file")
    
    audio_bytes = await file.read()
    
    try:
        transcript, summary = await llm_service.transcribe_and_summarize_audio(
            audio_bytes, 
            file.content_type
        )
        return {
            "success": True,
            "transcript": transcript,
            "summary": summary,
            "filename": file.filename
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/rooms/{room_id}")
async def get_room(room_id: str):
    """Get a specific room."""
    if room_id in rooms:
        return rooms[room_id]
    
    # Return preset rooms
    preset_rooms = {
        "room-a": {
            "id": "room-a",
            "title": "Philosophical Debate",
            "topic": "Is AI capable of true creativity?",
            "opening_question": "Is free will an illusion? Share your perspective.",
            "participants": 12,
            "color": "from-blue-500 to-cyan-400"
        },
        "room-b": {
            "id": "room-b",
            "title": "Policy Summit",
            "topic": "Universal Basic Income vs. Guaranteed Jobs",
            "opening_question": "Should AI be regulated? Debate the policy.",
            "participants": 8,
            "color": "from-purple-500 to-pink-400"
        }
    }
    
    if room_id in preset_rooms:
        return preset_rooms[room_id]
    
    raise HTTPException(status_code=404, detail="Room not found")


# --- WebSocket ---

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(f"Client #{client_id} says: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast(f"Client #{client_id} left the chat")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
