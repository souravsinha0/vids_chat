import logging
from openai import OpenAI
import google.generativeai as genai
from sqlalchemy.orm import Session
from ..config import settings
from .. import models
from .embedding_service import generate_query_embedding

logger = logging.getLogger(__name__)


class LLMProvider:
    def summarize(self, context: str) -> str:
        raise NotImplementedError

    def answer_question(self, context: str, question: str) -> str:
        raise NotImplementedError


class OpenAIProvider(LLMProvider):
    def __init__(self):
        self.client = OpenAI(api_key=settings.openai_api_key)
        self.model = "gpt-4o-mini"

    def summarize(self, context: str) -> str:
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert video analyst. You will receive a combined context "
                        "that may include visual descriptions from video frames, audio characteristics, "
                        "and a speech transcript. Use ALL available information to produce a "
                        "comprehensive summary of the video."
                    )
                },
                {
                    "role": "user",
                    "content": (
                        f"{context}\n\n"
                        "Based on the above information, provide a comprehensive summary of this video. "
                        "Include: what the video is about, what is happening, who is involved, "
                        "the setting, mood, and any key moments. "
                        "If there is no speech, rely on the visual description."
                    )
                }
            ],
            temperature=0.5,
            max_tokens=600
        )
        return response.choices[0].message.content.strip()

    def answer_question(self, context: str, question: str) -> str:
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert video analyst. Answer questions about a video using "
                        "the provided context which includes visual descriptions, audio info, "
                        "and any speech transcript. If the answer is not in the context, say so."
                    )
                },
                {
                    "role": "user",
                    "content": f"Context:\n{context}\n\nQuestion: {question}\nAnswer:"
                }
            ],
            temperature=0.3,
            max_tokens=400
        )
        return response.choices[0].message.content.strip()


class GeminiProvider(LLMProvider):
    def __init__(self):
        genai.configure(api_key=settings.gemini_api_key)
        self.model = genai.GenerativeModel(settings.gemini_model)

    def summarize(self, context: str) -> str:
        # prompt = (
        #     f"{context}\n\n"
        #     "Based on the above information, provide a comprehensive summary of this video. "
        #     "Include: what the video is about, what is happening, who is involved, "
        #     "the setting, mood, and any key moments. "
        #     "If there is no speech, rely on the visual description."
        # )
        prompt = (
            f"{context}\n\n"
            "You are an expert, neutral video summarizer. Your goal is to create a clear, concise, and engaging summary of the video based on the provided frame descriptions (and any transcript or audio context if available).\n\n"
            "Create a well-structured summary with the following format:\n\n"
            "1. **Brief Overview** (3-4 sentences maximum)\n"
            "   - What the video is about, its main topic or purpose, and overall context.\n\n"
            "2. **Key Content & Flow**\n"
            "   - Describe the main events, scenes, actions, or topics in logical order.\n"
            "   - Highlight what is happening visually and (if present) what is being said or explained.\n"
            "   - For slide-based or informational videos, summarize the important points, processes, data, or takeaways.\n"
            "   - For narrative, entertainment, or action videos, focus on the story progression, key moments, and developments.\n\n"
            "3. **Important Details & Highlights**\n"
            "   - Key facts, results, messages, techniques, or notable elements shown in the video.\n"
            "   - Mention any important data, demonstrations, examples, or outcomes.\n\n"
            "4. **Conclusion / Final Message** (if applicable)\n"
            "   - How the video ends and any closing takeaway or call-to-action.\n\n"
            "Important Guidelines:\n"
            "- Adapt your style and depth naturally to the video type. Be factual and objective.\n"
            "- Prioritize visual information from the frames since this is a frame-based tool.\n"
            "- If the video has audio/speech, incorporate the spoken content. If it is mute or silent, rely primarily on the visual descriptions.\n"
            "- Do NOT force or mention 'mood', 'atmosphere', 'environment', 'cinematic style', 'emotional tone', or 'setting' unless they are genuinely central to understanding the video.\n"
            "- Keep the summary readable, scannable, and balanced in length (aim for brevity while covering the essentials).\n"
            "- Use bullet points or short paragraphs for clarity when helpful.\n"
            "- Never invent content that is not supported by the frames or provided context."
        )
        response = self.model.generate_content(prompt)
        return response.text.strip() if response.text else "Unable to generate summary."

    def answer_question(self, context: str, question: str) -> str:
        prompt = (
            "You are an expert video analyst. Answer the question using the provided context "
            "which includes visual descriptions, audio info, and any speech transcript.\n\n"
            f"Context:\n{context}\n\nQuestion: {question}\nAnswer:"
        )
        logger.info(f"[Gemini] Sending prompt (first 500 chars): {prompt[:500]}...")
        response = self.model.generate_content(prompt)
        logger.info(f"[Gemini] Received response.text: {response.text}")
        return response.text.strip() if response.text else "Unable to generate answer."


class OllamaProvider(LLMProvider):
    def __init__(self):
        import httpx
        self.base_url = settings.ollama_base_url
        self.model = settings.ollama_model

    def _chat(self, prompt: str) -> str:
        import httpx
        response = httpx.post(
            f"{self.base_url}/api/generate",
            json={"model": self.model, "prompt": prompt, "stream": False},
            timeout=120
        )
        return response.json()["response"].strip()

    def summarize(self, context: str) -> str:
        return self._chat(
            f"{context}\n\nProvide a comprehensive summary of this video based on the above context."
        )

    def answer_question(self, context: str, question: str) -> str:
        return self._chat(
            f"Context:\n{context}\n\nQuestion: {question}\nAnswer:"
        )


class OnPremProvider(LLMProvider):
    """OpenAI-compatible API for vLLM or any self-hosted model."""
    def __init__(self):
        self.client = OpenAI(
            api_key="EMPTY",  # vLLM doesn't need a real key
            base_url=settings.on_prem_model_url
        )
        self.model = settings.on_prem_model_name

    def summarize(self, context: str) -> str:
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert video analyst. Use the provided context "
                        "(visual descriptions, audio info, speech transcript) to produce "
                        "a comprehensive video summary."
                    )
                },
                {
                    "role": "user",
                    "content": (
                        f"{context}\n\n"
                        "Provide a comprehensive summary of this video. Include what is happening, "
                        "who is involved, the setting, mood, and key moments. "
                        "If there is no speech, rely on the visual description."
                    )
                }
            ],
            temperature=0.5,
            max_tokens=600
        )
        return response.choices[0].message.content.strip()

    def answer_question(self, context: str, question: str) -> str:
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert video analyst. Answer questions about a video "
                        "using the provided context. If the answer is not in the context, say so."
                    )
                },
                {
                    "role": "user",
                    "content": f"Context:\n{context}\n\nQuestion: {question}\nAnswer:"
                }
            ],
            temperature=0.3,
            max_tokens=400
        )
        return response.choices[0].message.content.strip()


def get_llm_provider() -> LLMProvider:
    if settings.llm_provider == "openai":
        return OpenAIProvider()
    elif settings.llm_provider == "gemini":
        return GeminiProvider()
    elif settings.llm_provider == "local":
        return OllamaProvider()
    elif settings.llm_provider == "onprem":
        return OnPremProvider()
    else:
        raise ValueError(f"Unsupported LLM provider: {settings.llm_provider}")


def generate_summary(video_id: int):
    from ..database import SessionLocal
    db = SessionLocal()
    video = db.query(models.Video).get(video_id)
    if not video or not video.transcript_path:
        db.close()
        return

    with open(video.transcript_path, 'r', encoding='utf-8') as f:
        context = f.read()

    provider = get_llm_provider()
    try:
        summary = provider.summarize(context)
        video.summary = summary
        db.commit()
        logger.info(f"Summary generated for video {video_id}")
    except Exception as e:
        logger.error(f"Summarization failed: {e}")
    finally:
        db.close()


def answer_question(video_id: int, question: str, db: Session) -> str:
    from sqlalchemy import text

    logger.info(f"[answer_question] video_id={video_id}, question={question}")
    question_emb = generate_query_embedding(question)

    try:
        similar_chunks = db.execute(
            text("""
                SELECT content FROM transcript_chunks
                WHERE video_id = :video_id AND embedding IS NOT NULL
                ORDER BY embedding <-> CAST(:emb AS vector)
                LIMIT 5
            """),
            {"video_id": video_id, "emb": question_emb}
        ).fetchall()
    except Exception as e:
        logger.warning(f"Vector search failed, using fallback: {e}")
        db.rollback()
        similar_chunks = db.execute(
            text("SELECT content FROM transcript_chunks WHERE video_id = :video_id LIMIT 5"),
            {"video_id": video_id}
        ).fetchall()

    logger.info(f"[answer_question] Retrieved {len(similar_chunks)} chunks")
    if not similar_chunks:
        return "No content found for this video."

    context = "\n\n".join([row[0] for row in similar_chunks if row[0]])
    if not context:
        return "No valid content found for this video."
    
    logger.info(f"[answer_question] Context length: {len(context)} chars, first 300: {context[:300]}...")
    provider = get_llm_provider()
    answer = provider.answer_question(context, question)
    logger.info(f"[answer_question] LLM returned answer: {answer}")
    return answer if answer else "Unable to generate answer."
