import os
import google.generativeai as genai

class LLMService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-3-flash-preview')
        else:
            print("Warning: GEMINI_API_KEY not found.")
            self.model = None

    async def summarize_text(self, text: str):
        if not self.model:
            return "LLM Service unavailable."
        
        try:
            response = self.model.generate_content(f"Summarize this into 3 bullet points: {text}")
            return response.text
        except Exception as e:
            return f"Error connecting to Gemini: {str(e)}"
