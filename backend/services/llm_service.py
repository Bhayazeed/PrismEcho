import os
from typing import Tuple
from google import genai
from google.genai import types

class ModerationService:
    """Content moderation service using Gemini AI for detecting harmful content."""
    
    # Blocklist for instant rejection (obvious violations)
    BLOCKLIST_KEYWORDS = [
        "n-word", "k-word", "racial slur",
        "kill all", "death to", "genocide", "mass shooting",
        "white supremacy", "nazi", "holocaust denial",
    ]
    
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        else:
            print("Warning: GEMINI_API_KEY not found. Using keyword-only moderation.")
            self.client = None
    
    def _check_blocklist(self, text: str) -> Tuple[bool, str]:
        """Quick check against obvious violations."""
        text_lower = text.lower()
        for keyword in self.BLOCKLIST_KEYWORDS:
            if keyword in text_lower:
                return False, "Content contains prohibited terms."
        return True, ""
    
    async def moderate_content(self, text: str) -> Tuple[bool, str]:
        """Check if content is safe. Returns (is_safe, reason)"""
        is_safe, reason = self._check_blocklist(text)
        if not is_safe:
            return is_safe, reason
        
        if self.client:
            try:
                response = self.client.models.generate_content(
                    model="gemini-3-flash-preview",
                    contents=f"""You are a content moderator. Analyze this text:
"{text}"

Flag as UNSAFE if it contains hate speech, violence, discrimination, or illegal activity.
Respond with ONLY: SAFE or UNSAFE
If UNSAFE, add a brief reason on the next line.""",
                    config=types.GenerateContentConfig(
                        thinking_config=types.ThinkingConfig(thinking_level="low")
                    ),
                )
                result = response.text.strip()
                
                if result.upper().startswith("UNSAFE"):
                    lines = result.split('\n')
                    reason = lines[1] if len(lines) > 1 else "Content flagged by AI."
                    return False, reason
                return True, ""
            except Exception as e:
                print(f"AI moderation error: {e}")
                return True, ""  # Fail open
        
        return True, ""


class LLMService:
    """LLM service for summarization, transcription, and generation."""
    
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        else:
            print("Warning: GEMINI_API_KEY not found.")
            self.client = None

    async def transcribe_and_summarize_audio(self, audio_bytes: bytes, mime_type: str = "audio/webm") -> Tuple[str, str]:
        """Transcribe audio and generate a summary. Returns (transcript, summary)"""
        if not self.client:
            return "", "Audio processing unavailable."
        
        try:
            response = self.client.models.generate_content(
                model="gemini-3-flash-preview",
                contents=[
                    types.Part.from_bytes(data=audio_bytes, mime_type=mime_type),
                    "Transcribe this audio, then summarize in 2-3 bullet points. Format:\nTRANSCRIPT: [text]\nSUMMARY:\n• [point 1]\n• [point 2]"
                ],
                config=types.GenerateContentConfig(
                    thinking_config=types.ThinkingConfig(thinking_level="low")
                ),
            )
            
            result = response.text.strip()
            transcript, summary = "", result
            
            if "TRANSCRIPT:" in result and "SUMMARY:" in result:
                parts = result.split("SUMMARY:")
                transcript = parts[0].replace("TRANSCRIPT:", "").strip()
                summary = parts[1].strip()
            
            return transcript, summary
        except Exception as e:
            print(f"Audio processing error: {e}")
            return "", f"Error: {str(e)}"

    async def summarize_voice(self, transcript: str) -> str:
        """Summarize a transcript into key points."""
        if not self.client:
            return transcript[:100] + "..." if len(transcript) > 100 else transcript
        
        try:
            response = self.client.models.generate_content(
                model="gemini-3-flash-preview",
                contents=f"""Summarize this into 2-3 bullet points (under 15 words each):
"{transcript}"
Return only bullet points.""",
                config=types.GenerateContentConfig(
                    thinking_config=types.ThinkingConfig(thinking_level="low")
                ),
            )
            return response.text.strip()
        except Exception as e:
            return f"Summary unavailable: {str(e)}"
    
    async def generate_opening_question(self, topic: str) -> str:
        """Generate an opening question for a debate topic."""
        if not self.client:
            return f"What are your thoughts on: {topic}?"
        
        try:
            response = self.client.models.generate_content(
                model="gemini-3-flash-preview",
                contents=f"""Generate a thought-provoking opening question for this debate topic:
"{topic}"
Be neutral, invite multiple perspectives, under 20 words. Return only the question.""",
                config=types.GenerateContentConfig(
                    thinking_config=types.ThinkingConfig(thinking_level="low")
                ),
            )
            return response.text.strip()
        except Exception as e:
            return f"What are your thoughts on: {topic}?"
