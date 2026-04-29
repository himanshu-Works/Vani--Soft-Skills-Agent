export interface VoiceOption {
  id: string;
  name: string;
  gender: string;
  voiceName: string;
  pitch?: string;
  rate?: string;
}

export const voiceOptions: VoiceOption[] = [
  { id: "jenny", name: "Jenny (Female)", gender: "Female", voiceName: "en-US-JennyNeural", pitch: "0%", rate: "0%" },
  { id: "guy", name: "Guy (Male)", gender: "Male", voiceName: "en-US-GuyNeural", pitch: "0%", rate: "0%" },
  { id: "aria", name: "Aria (Neutral)", gender: "Neutral", voiceName: "en-US-AriaNeural", pitch: "-5%", rate: "-5%" },
  { id: "davis", name: "Davis (Deep Male)", gender: "Male", voiceName: "en-US-DavisNeural", pitch: "-10%", rate: "-5%" },
  { id: "sara", name: "Sara (Warm Female)", gender: "Female", voiceName: "en-US-SaraNeural", pitch: "5%", rate: "-5%" },
];

export function getSelectedVoice(): VoiceOption {
  const stored = localStorage.getItem("vani-voice-preference");
  if (stored) {
    const found = voiceOptions.find((v) => v.id === stored);
    if (found) return found;
  }
  return voiceOptions[0];
}

export function setSelectedVoice(voiceId: string) {
  localStorage.setItem("vani-voice-preference", voiceId);
}

// Fallback TTS using browser's built-in speechSynthesis
function speakWithBrowser(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error("Browser speech synthesis not supported"));
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Try to pick a good voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(
      (v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("female")
    ) || voices.find((v) => v.lang.startsWith("en"));
    if (englishVoice) utterance.voice = englishVoice;

    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(e);
    window.speechSynthesis.speak(utterance);
  });
}

export async function speakText(text: string, voiceId?: string): Promise<void> {
  try {
    const apiKey = import.meta.env.VITE_AZURE_API_KEY;
    const region = import.meta.env.VITE_AZURE_REGION || "centralindia";
    
    const sanitizedText = sanitizeTextForSpeech(text);

    // If no Azure key or text is empty after sanitization, fall back
    if (!apiKey || !sanitizedText) {
      if (!apiKey && sanitizedText) {
        console.warn("Azure TTS API key not configured — using browser speech synthesis");
        await speakWithBrowser(sanitizedText);
      }
      return;
    }

    const voice = voiceId
      ? voiceOptions.find((v) => v.id === voiceId) || getSelectedVoice()
      : getSelectedVoice();

    console.log("Speaking text with voice:", voice.name);

    const ssml = `<speak version='1.0' xml:lang='en-US'>
      <voice xml:lang='en-US' name='${voice.voiceName}'>
        <prosody pitch='${voice.pitch || "0%"}' rate='${voice.rate || "0%"}' volume='loud'>
          ${escapeXml(sanitizedText)}
        </prosody>
      </voice>
    </speak>`;

    const res = await fetch(
      `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": apiKey,
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
        },
        body: ssml,
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Azure TTS Error:", res.status, errorText);
      console.warn("Azure TTS failed — falling back to browser speech synthesis");
      await speakWithBrowser(sanitizedText);
      return;
    }

    const blob = await res.blob();

    if (blob.size === 0) {
      console.warn("Azure TTS returned empty blob — falling back to browser speech");
      await speakWithBrowser(sanitizedText);
      return;
    }

    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);

    await new Promise<void>((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      audio.onerror = (e) => {
        URL.revokeObjectURL(audioUrl);
        reject(e);
      };
      audio.play().catch(reject);
    });

    console.log("Audio playback completed");
  } catch (error) {
    console.error("Error in speakText:", error);
    // Last resort fallback
    try {
      const fallbackText = sanitizeTextForSpeech(text);
      if (fallbackText) {
        await speakWithBrowser(fallbackText);
      }
    } catch (fallbackError) {
      console.error("Browser TTS also failed:", fallbackError);
      throw error;
    }
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function sanitizeTextForSpeech(text: string): string {
  if (!text) return text;
  return text
    // Remove URLs
    .replace(/https?:\/\/[^\s]+/g, '')
    // Remove common markdown symbols (asterisks, underscores, hashtags, tildes, backticks, bullet points)
    .replace(/[*_#~`>•-]/g, '')
    // Remove emojis using unicode properties
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
    // Replace multiple spaces with a single space
    .replace(/\s+/g, ' ')
    .trim();
}