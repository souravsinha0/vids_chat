from faster_whisper import WhisperModel
import torch
import logging
from ..config import settings

logger = logging.getLogger(__name__)

# Load model once at module level to avoid reloading on every request
_whisper_model = None

def get_whisper_model() -> WhisperModel:
    global _whisper_model
    if _whisper_model is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        compute_type = "float16" if device == "cuda" else "int8"
        logger.info(f"Loading Whisper model '{settings.whisper_model}' on {device}")
        _whisper_model = WhisperModel(settings.whisper_model, device=device, compute_type=compute_type)
    return _whisper_model


def transcribe_audio(audio_path: str, progress_callback=None) -> str:
    """
    Transcribe audio using Whisper.
    Returns empty string if no speech is detected (music, ambient, silent).
    Does NOT raise — caller decides what to do with empty transcript.
    """
    try:
        model = get_whisper_model()
        segments, info = model.transcribe(
            audio_path,
            beam_size=5,
            vad_filter=True,           # Skip non-speech segments
            vad_parameters={
                "min_silence_duration_ms": 500,
                "speech_pad_ms": 200,
            }
        )

        transcript_parts = []
        for segment in segments:
            text = segment.text.strip()
            if text:
                transcript_parts.append(text)
            if progress_callback and info.duration > 0:
                progress_callback(segment.end / info.duration)

        result = " ".join(transcript_parts)
        if not result.strip():
            logger.info("Whisper found no speech in audio (music/ambient/silent video)")
        else:
            logger.info(f"Whisper transcribed {len(result)} characters of speech")

        return result

    except Exception as e:
        logger.warning(f"Whisper transcription failed: {e}")
        return ""  # Return empty, let multimodal analysis handle it