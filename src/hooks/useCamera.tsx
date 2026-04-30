import { useCallback, useEffect, useRef, useState } from "react";

interface CameraState {
  isActive: boolean;
  stream: MediaStream | null;
  error: string | null;
}

export const useCamera = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>({
    isActive: false,
    stream: null,
    error: null,
  });
  const capturedFrames = useRef<string[]>([]);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Attach stream to video element when stream or videoRef becomes available
  useEffect(() => {
    if (videoRef.current && cameraState.stream) {
      videoRef.current.srcObject = cameraState.stream;
      videoRef.current.play().catch(e => console.warn("Camera autoPlay prevented:", e));
    }
  }, [cameraState.stream, cameraState.isActive]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraState({ isActive: true, stream, error: null });
      capturedFrames.current = [];

      // Start capturing frames every 5 seconds for emotion analysis
      captureIntervalRef.current = setInterval(() => {
        captureFrame();
      }, 5000);

      return stream;
    } catch (error: any) {
      const errorMsg =
        error.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access."
          : error.name === "NotFoundError"
          ? "No camera found on this device."
          : `Camera error: ${error.message}`;
      setCameraState({ isActive: false, stream: null, error: errorMsg });
      throw new Error(errorMsg);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }

    if (cameraState.stream) {
      cameraState.stream.getTracks().forEach((track) => track.stop());
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraState({ isActive: false, stream: null, error: null });
  }, [cameraState.stream]);

  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !cameraState.isActive) return null;

    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 320;
      canvas.height = videoRef.current.videoHeight || 240;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.6);

      // Keep only last 10 frames to avoid memory issues
      capturedFrames.current = [...capturedFrames.current.slice(-9), dataUrl];
      return dataUrl;
    } catch {
      return null;
    }
  }, [cameraState.isActive]);

  const getFramesForAnalysis = useCallback((): string[] => {
    // Return at most 3 frames spread across the session
    const frames = capturedFrames.current;
    if (frames.length <= 3) return frames;
    const step = Math.floor(frames.length / 3);
    return [frames[0], frames[step], frames[frames.length - 1]];
  }, []);

  const analyzeEmotions = useCallback(
    async (frames: string[]): Promise<{ score: number; summary: string; details: Record<string, number> }> => {
      if (frames.length === 0) {
        return { score: 0, summary: "No camera data available", details: {} };
      }

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        return { score: 0, summary: "Gemini API not configured for emotion analysis", details: {} };
      }

      try {
        // Use the last captured frame for analysis
        const frame = frames[frames.length - 1];
        const base64Data = frame.split(",")[1];

        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Analyze this person's facial expression and body language for a speaking/communication assessment. 
Return a JSON object with:
- score: 0-100 (overall presentation score based on visible cues)
- eyeContact: 0-100 (estimated based on forward-facing posture)
- confidence: 0-100 (based on posture and expression)
- engagement: 0-100 (alertness and attention)
- expression: string (e.g., "confident", "nervous", "calm", "focused")
- summary: string (1-2 sentence assessment)

Return ONLY the JSON, no markdown.`,
                  },
                  {
                    inline_data: {
                      mime_type: "image/jpeg",
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
          }),
        });

        if (!response.ok) {
          throw new Error(`Gemini Vision API error: ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

        const cleanText = text.replace(/```(?:json)?/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanText);

        return {
          score: parsed.score || 0,
          summary: parsed.summary || "Analysis complete",
          details: {
            eyeContact: parsed.eyeContact || 0,
            confidence: parsed.confidence || 0,
            engagement: parsed.engagement || 0,
          },
        };
      } catch (error) {
        console.error("Emotion analysis error:", error);
        return {
          score: 50,
          summary: "Camera analysis could not be completed fully. Voice analysis used as primary metric.",
          details: { eyeContact: 50, confidence: 50, engagement: 50 },
        };
      }
    },
    []
  );

  return {
    videoRef,
    cameraState,
    startCamera,
    stopCamera,
    captureFrame,
    getFramesForAnalysis,
    analyzeEmotions,
  };
};
