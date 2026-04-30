/**
 * Unified transcription — tries AssemblyAI first, falls back to Web Speech API.
 * The Web Speech API fallback records live text during recording instead of
 * processing a blob, so we store the live transcript in a singleton store.
 */

import { uploadAudioToAssembly, createTranscript, pollTranscript } from "./assembly";

// ─── Live Transcription Store ─────────────────────────────────────────────────
// When AssemblyAI key is absent, we run Web Speech API in parallel with the
// MediaRecorder and store the live transcript here so processAnswer() can read it.

let liveTranscript = "";
let recognitionInstance: any = null;

export function getLiveTranscript(): string {
  return liveTranscript;
}

export function clearLiveTranscript() {
  liveTranscript = "";
}

export function startLiveSpeechRecognition() {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.warn("Web Speech API not supported — use Chrome for best results.");
    return;
  }

  liveTranscript = "";
  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.continuous = true;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: any) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        liveTranscript += event.results[i][0].transcript + " ";
      }
    }
  };

  recognition.onerror = (event: any) => {
    if (event.error !== "no-speech") {
      console.warn("Speech recognition error:", event.error);
    }
  };

  try {
    recognition.start();
    recognitionInstance = recognition;
  } catch (e) {
    console.warn("Could not start speech recognition:", e);
  }
}

export function stopLiveSpeechRecognition(): string {
  if (recognitionInstance) {
    try { recognitionInstance.stop(); } catch {}
    recognitionInstance = null;
  }
  return liveTranscript.trim();
}

// ─── Primary Transcription ─────────────────────────────────────────────────────

/**
 * Transcribe an audio Blob.
 * 1. Tries AssemblyAI if VITE_ASSEMBLYAI_API_KEY is configured.
 * 2. Falls back to the live transcript captured during recording.
 */
export async function transcribeAudioBlob(blob: Blob): Promise<string> {
  const apiKey = import.meta.env.VITE_ASSEMBLYAI_API_KEY;

  if (apiKey && apiKey.length > 10) {
    try {
      console.log("Transcribing via AssemblyAI...");
      const uploadUrl = await uploadAudioToAssembly(blob);
      const created = await createTranscript(uploadUrl);
      const result = await pollTranscript(created.id);
      clearLiveTranscript(); // clean up live transcript since AssemblyAI succeeded
      return result.text || "";
    } catch (err) {
      console.warn("AssemblyAI failed, falling back to live transcript:", err);
    }
  } else {
    console.warn("VITE_ASSEMBLYAI_API_KEY not set — using browser speech recognition.");
  }

  // Fallback: return whatever the live Web Speech API captured
  const fallback = getLiveTranscript();
  clearLiveTranscript();

  if (!fallback) {
    throw new Error(
      "No transcript captured. AssemblyAI key missing and browser speech recognition captured nothing. Please speak clearly or add your AssemblyAI API key to Vercel."
    );
  }

  return fallback;
}
