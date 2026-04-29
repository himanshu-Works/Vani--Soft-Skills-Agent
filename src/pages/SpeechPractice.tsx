import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/GlassCard";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mic, Square, Sparkles, Camera, CameraOff, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useCamera } from "@/hooks/useCamera";
import { uploadAudioToAssembly, createTranscript, pollTranscript } from "@/integrations/assembly";
import { generateGeminiResponse } from "@/integrations/gemini";
import { speakText } from "@/integrations/azureTts";
import { speechTopics } from "@/data/questionBanks";

interface FeedbackData {
  text: string;
  score: number;
  subscores?: {
    fluency: number;
    clarity: number;
    grammar: number;
    confidence: number;
  };
  cameraScore?: number;
  cameraSummary?: string;
}

const SpeechPractice = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isRecording, audioBlob, startRecording, stopRecording, resetRecording } = useAudioRecorder();
  const { videoRef, cameraState, startCamera, stopCamera, getFramesForAnalysis, analyzeEmotions } = useCamera();

  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [customTopic, setCustomTopic] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [voiceFeedbackEnabled, setVoiceFeedbackEnabled] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [showAllTopics, setShowAllTopics] = useState(false);

  const displayedTopics = showAllTopics ? speechTopics : speechTopics.slice(0, 9);

  const handleToggleCamera = async () => {
    if (cameraEnabled) {
      stopCamera();
      setCameraEnabled(false);
    } else {
      try {
        await startCamera();
        setCameraEnabled(true);
        toast({ title: "Camera Active", description: "Your expressions will be analyzed in feedback" });
      } catch (error: any) {
        toast({ title: "Camera Error", description: error.message, variant: "destructive" });
      }
    }
  };

  const handleStartRecording = async () => {
    if (!selectedTopic && !customTopic) {
      toast({ title: "Topic Required", description: "Please select or enter a topic first", variant: "destructive" });
      return;
    }
    try {
      await startRecording();
      setFeedback(null);
      toast({ title: "Recording Started", description: "Speak clearly about your chosen topic" });
    } catch {
      toast({ title: "Error", description: "Could not access microphone", variant: "destructive" });
    }
  };

  const handleStopRecording = () => {
    stopRecording();
    toast({ title: "Processing", description: "Transcribing and analyzing your speech..." });
  };

  const processAudio = async () => {
    if (!audioBlob) return;
    setIsProcessing(true);
    try {
      // Step 1: Transcribe audio
      const uploadUrl = await uploadAudioToAssembly(audioBlob);
      const created = await createTranscript(uploadUrl);
      const result = await pollTranscript(created.id);
      const transcriptText: string = result.text || "";

      // Step 2: Analyze with Gemini
      const topic = selectedTopic || customTopic;
      const prompt = `You are a speech coach. Analyze the following speech on the topic "${topic}" and return a JSON object with:
- feedback: detailed paragraph feedback (string)
- score: overall score 0-100 (number)
- subscores: { fluency: 0-25, clarity: 0-25, grammar: 0-25, confidence: 0-25 }

Return ONLY the JSON, no markdown wrapper.

Speech transcript:
${transcriptText}`;

      const analysisRaw = await generateGeminiResponse(prompt);
      let analysis: FeedbackData = { feedback: analysisRaw, score: 0, text: analysisRaw };

      try {
        const cleanJson = analysisRaw.replace(/```(?:json)?/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanJson);
        if (typeof parsed?.feedback === "string" && typeof parsed?.score === "number") {
          analysis = {
            text: parsed.feedback,
            score: parsed.score,
            subscores: parsed.subscores,
          };
        }
      } catch {}

      // Step 3: Analyze camera frames if camera was enabled
      if (cameraEnabled) {
        const frames = getFramesForAnalysis();
        if (frames.length > 0) {
          const emotionResult = await analyzeEmotions(frames);
          analysis.cameraScore = emotionResult.score;
          analysis.cameraSummary = emotionResult.summary;
        }
      }

      setFeedback(analysis);
      toast({ title: "Analysis Complete", description: `Score: ${analysis.score}/100` });

      if (voiceFeedbackEnabled) {
        playVoiceFeedback(analysis.text);
      }
    } catch (error) {
      console.error("Error processing audio:", error);
      toast({ title: "Error", description: "Failed to process audio. Please try again.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
      resetRecording();
    }
  };

  useEffect(() => {
    if (audioBlob && !isProcessing && !feedback) {
      processAudio();
    }
  }, [audioBlob]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => { if (cameraEnabled) stopCamera(); };
  }, []);

  const playVoiceFeedback = async (text: string) => {
    setIsPlayingAudio(true);
    try {
      await speakText(text);
    } catch {}
    setIsPlayingAudio(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">AI Speech Practice</h1>
              <p className="text-xs text-muted-foreground">Practice speaking on any topic</p>
            </div>
            <Button
              variant={cameraEnabled ? "destructive" : "outline"}
              size="sm"
              onClick={handleToggleCamera}
              className="gap-2"
            >
              {cameraEnabled ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
              {cameraEnabled ? "Camera On" : "Camera Off"}
            </Button>
          </div>
        </div>
      </div>

      {/* Camera Preview */}
      {cameraEnabled && (
        <div className="fixed top-20 right-4 z-30">
          <div className="relative w-32 h-24 rounded-xl overflow-hidden border-2 border-primary shadow-xl">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover scale-x-[-1]"
            />
            <div className="absolute bottom-1 left-1 flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white text-[8px] font-medium">LIVE</span>
            </div>
          </div>
        </div>
      )}

      {/* Camera Error */}
      {cameraState.error && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <div className="px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 text-sm">
            📷 {cameraState.error}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 pb-24 animate-fade-in">
        {/* Topic Selection */}
        {!isRecording && (
          <>
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Choose Your Topic</h3>
                <span className="text-xs text-muted-foreground">{speechTopics.length} topics</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {displayedTopics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => { setSelectedTopic(topic); setCustomTopic(""); }}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      selectedTopic === topic
                        ? "border-primary bg-primary/10 shadow-lg scale-105"
                        : "border-border bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10"
                    }`}
                  >
                    <p className="text-sm font-medium text-foreground">{topic}</p>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowAllTopics(!showAllTopics)}
                className="mt-3 text-xs text-primary hover:underline"
              >
                {showAllTopics ? "Show less" : `Show all ${speechTopics.length} topics`}
              </button>
            </GlassCard>

            <GlassCard>
              <h3 className="text-lg font-semibold text-foreground mb-4">Or Enter Custom Topic</h3>
              <input
                type="text"
                value={customTopic}
                onChange={(e) => { setCustomTopic(e.target.value); setSelectedTopic(null); }}
                placeholder="Type your topic here..."
                className="w-full px-4 py-3 rounded-xl border border-border bg-white/60 dark:bg-white/5 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all text-foreground placeholder:text-muted-foreground"
              />
            </GlassCard>
          </>
        )}

        {/* Recording Interface */}
        <GlassCard className="text-center space-y-6 bg-gradient-to-br from-primary/5 to-secondary/5">
          {isRecording && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-2xl font-bold text-foreground">{selectedTopic || customTopic}</h3>
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-2xl animate-pulse">
                    <Mic className="w-16 h-16 text-white" />
                  </div>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-secondary blur-xl opacity-50 animate-glow" />
                </div>
              </div>
              <p className="text-muted-foreground">Listening to your speech...</p>
            </div>
          )}

          {!isRecording && (selectedTopic || customTopic) && (
            <div className="space-y-4 animate-scale-in">
              <Sparkles className="w-12 h-12 mx-auto text-primary" />
              <h3 className="text-xl font-semibold text-foreground">Ready to Practice</h3>
              <p className="text-muted-foreground">
                Topic: <span className="font-semibold text-foreground">{selectedTopic || customTopic}</span>
              </p>
            </div>
          )}

          {isProcessing && (
            <div className="space-y-3">
              <div className="flex justify-center gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-full bg-primary animate-bounce"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
              <p className="text-muted-foreground text-sm">Analyzing your speech...</p>
            </div>
          )}

          <div className="flex justify-center gap-4 pt-4">
            {!isRecording ? (
              <Button
                variant="hero"
                size="lg"
                onClick={handleStartRecording}
                disabled={!selectedTopic && !customTopic}
              >
                <Mic className="w-5 h-5" />
                Start Recording
              </Button>
            ) : (
              <Button variant="destructive" size="lg" onClick={handleStopRecording}>
                <Square className="w-5 h-5" />
                Stop Recording
              </Button>
            )}
          </div>
        </GlassCard>

        {/* Feedback */}
        {feedback && (
          <GlassCard className="bg-gradient-to-br from-primary/10 to-secondary/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Your Performance</h3>
              <div className="text-3xl font-bold text-primary">{feedback.score}/100</div>
            </div>

            {/* Score Bar */}
            <div className="space-y-1">
              <div className="h-3 bg-white/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-1000"
                  style={{ width: `${feedback.score}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">{feedback.score}% overall</p>
            </div>

            {/* Subscores */}
            {feedback.subscores && (
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(feedback.subscores).map(([key, val]) => (
                  <div key={key} className="p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-border">
                    <p className="text-xs text-muted-foreground capitalize mb-1">{key}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-white/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                          style={{ width: `${(val / 25) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-foreground">{val}/25</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Camera Score */}
            {feedback.cameraScore !== undefined && (
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <p className="text-xs font-semibold text-blue-600 mb-1">📷 Expression Analysis</p>
                <p className="text-sm text-foreground">{feedback.cameraSummary}</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-white/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                      style={{ width: `${feedback.cameraScore}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-blue-600">{feedback.cameraScore}/100</span>
                </div>
              </div>
            )}

            {/* Text Feedback */}
            <div className="prose prose-sm max-w-none">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{feedback.text}</p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => playVoiceFeedback(feedback.text)}
                disabled={isPlayingAudio}
                className="gap-2"
              >
                <Volume2 className={`w-4 h-4 ${isPlayingAudio ? "animate-pulse" : ""}`} />
                {isPlayingAudio ? "Speaking..." : "Hear Feedback"}
              </Button>
              <Button
                variant="outline"
                onClick={() => { setFeedback(null); setSelectedTopic(null); setCustomTopic(""); }}
                className="flex-1"
              >
                Practice Again
              </Button>
            </div>
          </GlassCard>
        )}

        {/* Voice Feedback Toggle */}
        {!isRecording && !isProcessing && (
          <GlassCard className="bg-accent/10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Auto Voice Feedback</h3>
                <p className="text-xs text-muted-foreground">Hear your results aloud automatically</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={voiceFeedbackEnabled}
                  onChange={(e) => setVoiceFeedbackEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
              </label>
            </div>
          </GlassCard>
        )}

        {/* Tips */}
        {!isRecording && !feedback && !isProcessing && (
          <GlassCard className="bg-accent/10">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              Tips for Better Practice
            </h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Speak clearly and at a natural pace</li>
              <li>• Structure your thoughts before speaking</li>
              <li>• Try to speak for at least 2-3 minutes</li>
              <li>• Practice in a quiet environment</li>
              <li>• Enable camera for expression feedback</li>
            </ul>
          </GlassCard>
        )}
      </div>
    </div>
  );
};

export default SpeechPractice;
