"""
Multimodal video analysis service.
Extracts visual frames + audio description + speech transcript,
then combines them into a rich content description.
This handles videos with no speech (music, ambient, celebrations, etc.)
"""
import os
import base64
import logging
import subprocess
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


def extract_frames(video_path: str, num_frames: int = 8) -> list[str]:
    """Extract evenly-spaced frames from video as base64 JPEG strings."""
    frames = []
    try:
        # Get video duration
        result = subprocess.run(
            [
                "ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                video_path
            ],
            capture_output=True, text=True, timeout=30
        )
        duration = float(result.stdout.strip() or "0")
        if duration <= 0:
            return []

        # Extract frames at evenly-spaced timestamps
        interval = duration / (num_frames + 1)
        for i in range(1, num_frames + 1):
            timestamp = interval * i
            frame_path = f"{video_path}_frame_{i}.jpg"
            subprocess.run(
                [
                    "ffmpeg", "-ss", str(timestamp),
                    "-i", video_path,
                    "-frames:v", "1",
                    "-q:v", "3",
                    "-y", frame_path
                ],
                capture_output=True, timeout=30
            )
            if os.path.exists(frame_path):
                with open(frame_path, "rb") as f:
                    frames.append(base64.b64encode(f.read()).decode("utf-8"))
                os.remove(frame_path)

    except Exception as e:
        logger.warning(f"Frame extraction failed: {e}")

    return frames


def detect_audio_characteristics(audio_path: str) -> dict:
    """
    Detect audio characteristics: silence ratio, volume levels.
    Returns a dict with has_speech_likely, is_mostly_silent, notes.
    """
    result = {"has_speech_likely": True, "is_mostly_silent": False, "notes": ""}
    try:
        # Use ffmpeg silencedetect to check how much silence there is
        proc = subprocess.run(
            [
                "ffmpeg", "-i", audio_path,
                "-af", "silencedetect=noise=-30dB:d=0.5",
                "-f", "null", "-"
            ],
            capture_output=True, text=True, timeout=60
        )
        output = proc.stderr
        silence_count = output.count("silence_start")
        silence_end_count = output.count("silence_end")

        # Count total silence duration
        total_silence = 0.0
        for line in output.splitlines():
            if "silence_duration" in line:
                try:
                    total_silence += float(line.split("silence_duration:")[-1].strip())
                except ValueError:
                    pass

        # Get audio duration
        dur_proc = subprocess.run(
            [
                "ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                audio_path
            ],
            capture_output=True, text=True, timeout=30
        )
        duration = float(dur_proc.stdout.strip() or "1")
        silence_ratio = total_silence / max(duration, 1)

        if silence_ratio > 0.8:
            result["is_mostly_silent"] = True
            result["has_speech_likely"] = False
            result["notes"] = "Video is mostly silent."
        elif silence_ratio > 0.5:
            result["has_speech_likely"] = False
            result["notes"] = "Video has significant non-speech audio (music/ambient)."
        else:
            result["notes"] = "Video likely contains speech."

    except Exception as e:
        logger.warning(f"Audio analysis failed: {e}")

    return result


def analyze_frames_with_gemini(frames_b64: list[str], filename: str) -> str:
    """Send frames to Gemini Vision and get a visual description."""
    if not frames_b64:
        return ""

    try:
        import google.generativeai as genai
        from ..config import settings

        genai.configure(api_key=settings.gemini_api_key)
        model = genai.GenerativeModel("gemini-2.5-flash-lite")

        # Build content parts: text prompt + images
        parts = [
            f"These are {len(frames_b64)} evenly-spaced frames from a video file named '{filename}'. "
            "Analyze what is happening in this video. Describe:\n"
            "1. The setting/environment (indoor, outdoor, office, party, etc.)\n"
            "2. People present and what they are doing\n"
            "3. Any visible text, signs, or on-screen content\n"
            "4. The overall mood and activity\n"
            "5. Key events or moments visible across the frames\n"
            "Be specific and detailed. This description will be used to answer questions about the video."
        ]

        for frame_b64 in frames_b64:
            import google.generativeai as genai_types
            parts.append({
                "inline_data": {
                    "mime_type": "image/jpeg",
                    "data": frame_b64
                }
            })

        response = model.generate_content(parts)
        return response.text.strip()

    except Exception as e:
        logger.warning(f"Gemini vision analysis failed: {e}")
        return ""


def analyze_frames_with_openai(frames_b64: list[str], filename: str) -> str:
    """Send frames to OpenAI Vision and get a visual description."""
    if not frames_b64:
        return ""

    try:
        from openai import OpenAI
        from ..config import settings

        client = OpenAI(api_key=settings.openai_api_key)

        messages_content = [
            {
                "type": "text",
                "text": (
                    f"These are {len(frames_b64)} evenly-spaced frames from a video named '{filename}'. "
                    "Analyze what is happening. Describe: the setting, people and their actions, "
                    "visible text or content, overall mood, and key events across the frames. "
                    "Be specific and detailed."
                )
            }
        ]
        for frame_b64 in frames_b64:
            messages_content.append({
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{frame_b64}", "detail": "low"}
            })

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": messages_content}],
            max_tokens=800
        )
        return response.choices[0].message.content.strip()

    except Exception as e:
        logger.warning(f"OpenAI vision analysis failed: {e}")
        return ""


def build_video_context(
    filename: str,
    transcript: str,
    visual_description: str,
    audio_notes: str
) -> str:
    """
    Combine transcript + visual description + audio notes into
    a single rich context string for summarization and Q&A.
    """
    parts = []

    parts.append(f"=== VIDEO FILE: {filename} ===\n")

    if visual_description:
        parts.append(f"=== VISUAL CONTENT (from video frames) ===\n{visual_description}\n")

    if audio_notes:
        parts.append(f"=== AUDIO CHARACTERISTICS ===\n{audio_notes}\n")

    if transcript and transcript.strip():
        parts.append(f"=== SPEECH TRANSCRIPT ===\n{transcript.strip()}\n")
    else:
        parts.append(
            "=== SPEECH TRANSCRIPT ===\n"
            "No speech detected. The video may contain music, ambient sounds, or no audio.\n"
        )

    return "\n".join(parts)


def analyze_video_multimodal(
    video_path: str,
    filename: str,
    transcript: str,
    audio_path: Optional[str] = None
) -> str:
    """
    Main entry point. Combines visual frame analysis + audio characteristics
    + whisper transcript into a rich content description.

    Works for:
    - Videos with speech (adds visual context on top)
    - Videos with only music/ambient (uses visual analysis)
    - Silent videos (uses visual analysis only)
    - Animated videos (describes animation content)
    """
    from ..config import settings

    logger.info(f"Starting multimodal analysis for: {filename}")

    # Step 1: Detect audio characteristics
    audio_notes = ""
    if audio_path and os.path.exists(audio_path):
        audio_info = detect_audio_characteristics(audio_path)
        audio_notes = audio_info["notes"]
        logger.info(f"Audio analysis: {audio_notes}")

    # Step 2: Extract visual frames
    frames_b64 = extract_frames(video_path, num_frames=8)
    logger.info(f"Extracted {len(frames_b64)} frames for visual analysis")

    # Step 3: Analyze frames with available vision model
    visual_description = ""
    if frames_b64:
        if settings.llm_provider == "gemini" and settings.gemini_api_key:
            visual_description = analyze_frames_with_gemini(frames_b64, filename)
        elif settings.llm_provider == "openai" and settings.openai_api_key:
            visual_description = analyze_frames_with_openai(frames_b64, filename)
        elif settings.gemini_api_key:
            # Fallback to Gemini vision even if primary provider is local
            visual_description = analyze_frames_with_gemini(frames_b64, filename)
        elif settings.openai_api_key:
            visual_description = analyze_frames_with_openai(frames_b64, filename)

        if visual_description:
            logger.info("Visual analysis completed successfully")
        else:
            logger.warning("Visual analysis returned empty result")

    # Step 4: Build combined context
    combined = build_video_context(filename, transcript, visual_description, audio_notes)
    logger.info(f"Multimodal context built: {len(combined)} characters")

    return combined
