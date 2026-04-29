import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/GlassCard";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Upload, FileText, Play, Mic, ChevronLeft, ChevronRight, Square, Volume2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { uploadAudioToAssembly, createTranscript, pollTranscript } from "@/integrations/assembly";
import { generateGeminiResponse } from "@/integrations/gemini";
import { speakText } from "@/integrations/azureTts";
import { presentationTopics } from "@/data/questionBanks";

// Placeholder slide content to show when no file is uploaded
const generateSlideContent = (index: number, topic: string) => {
  const templates = [
    { title: "Introduction", points: ["Overview of the topic", "Agenda for today", "Key objectives"] },
    { title: "Background & Context", points: ["Historical perspective", "Current landscape", "Why this matters"] },
    { title: "Key Point #1", points: ["Main argument", "Supporting evidence", "Real-world example"] },
    { title: "Key Point #2", points: ["Second major point", "Data & statistics", "Case study"] },
    { title: "Key Point #3", points: ["Third major insight", "Expert opinions", "Industry trends"] },
    { title: "Challenges & Solutions", points: ["Common obstacles", "Proposed solutions", "Implementation path"] },
    { title: "Action Plan", points: ["Step 1: Assessment", "Step 2: Planning", "Step 3: Execution"] },
    { title: "Conclusion", points: ["Summary of key points", "Call to action", "Q&A"] },
  ];
  const t = templates[index] || templates[0];
  return { title: `${t.title}: ${topic || "Your Topic"}`, points: t.points };
};

const PresentationPractice = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isRecording, audioBlob, startRecording, stopRecording, resetRecording } = useAudioRecorder();

  const [step, setStep] = useState<"upload" | "presenting" | "results">("upload");
  const [fileName, setFileName] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [currentSlide, setCurrentSlide] = useState(1);
  const [duration, setDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [voiceFeedbackEnabled, setVoiceFeedbackEnabled] = useState(false);
  const [slideNotes, setSlideNotes] = useState<string[]>(Array(8).fill(""));
  const [hasProcessed, setHasProcessed] = useState(false);
  const totalSlides = 8;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (
        file.type === "application/pdf" ||
        file.name.endsWith(".ppt") ||
        file.name.endsWith(".pptx")
      ) {
        setFileName(file.name);
        toast({ title: "File Uploaded", description: `${file.name} is ready for practice` });
      } else {
        toast({ title: "Invalid File", description: "Please upload a PDF or PPT file", variant: "destructive" });
      }
    }
  };

  const handleStartPresentation = async () => {
    if (!fileName && !selectedTopic) {
      toast({
        title: "Topic Required",
        description: "Please upload a file or select a topic to practice",
        variant: "destructive",
      });
      return;
    }
    try {
      await startRecording();
      setStep("presenting");
      setDuration(0);
      setCurrentSlide(1);
      setHasProcessed(false);
      toast({ title: "Recording Started", description: "Present your slides confidently" });
    } catch {
      toast({ title: "Error", description: "Could not access microphone", variant: "destructive" });
    }
  };

  const handleEndSession = () => {
    if (isRecording) stopRecording();
    toast({ title: "Processing", description: "Analyzing your presentation..." });
  };

  const processPresentation = async () => {
    if (!audioBlob || hasProcessed) return;
    setHasProcessed(true);
    setIsProcessing(true);
    try {
      const uploadUrl = await uploadAudioToAssembly(audioBlob);
      const created = await createTranscript(uploadUrl);
      const result = await pollTranscript(created.id);
      const transcriptText: string = result.text || "";

      const presentationName = fileName || selectedTopic || "General Presentation";
      const prompt = `You are a presentation coach. Analyze the following speech transcript from a presentation titled "${presentationName}" and provide structured feedback.

Format your response as:
**Overall Score:** [X/100]
**Structure & Organization:** [assessment + score /25]
**Clarity & Language:** [assessment + score /25]  
**Delivery & Pace:** [assessment + score /25]
**Engagement & Confidence:** [assessment + score /25]
**Top 3 Improvements:** [specific tips]
**What You Did Well:** [2-3 positives]

Transcript:
${transcriptText || "(No speech detected — please ensure your microphone is working)"}`;

      const analysisText = await generateGeminiResponse(prompt);
      setFeedback(analysisText);
      setStep("results");
      toast({ title: "Analysis Complete", description: "Review your presentation feedback" });

      if (voiceFeedbackEnabled) {
        await speakText("Presentation analysis complete. Here are your key insights.");
      }
    } catch (error) {
      console.error("Error processing presentation:", error);
      toast({ title: "Error", description: "Failed to analyze presentation. Please try again.", variant: "destructive" });
      setHasProcessed(false);
    } finally {
      setIsProcessing(false);
      resetRecording();
    }
  };

  // Duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => setDuration((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Process when audio blob is available
  useEffect(() => {
    if (audioBlob && !isProcessing && step === "presenting" && !hasProcessed) {
      processPresentation();
    }
  }, [audioBlob, step]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const currentSlideContent = generateSlideContent(currentSlide - 1, fileName || selectedTopic);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Presentation Practice</h1>
              <p className="text-xs text-muted-foreground">Upload and practice your presentation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 pb-24 animate-fade-in">

        {/* ===== UPLOAD STEP ===== */}
        {step === "upload" && (
          <>
            <GlassCard className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-xl">
                <FileText className="w-10 h-10 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-foreground">Start Your Presentation</h3>
                <p className="text-muted-foreground">Upload a file or choose a topic below</p>
              </div>

              <div className="max-w-md mx-auto">
                <label className="block cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.ppt,.pptx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <div
                    className={`p-8 border-2 border-dashed rounded-2xl transition-all ${
                      fileName
                        ? "border-primary bg-primary/5"
                        : "border-primary/50 bg-primary/5 hover:bg-primary/10"
                    }`}
                  >
                    <Upload className="w-12 h-12 mx-auto mb-3 text-primary" />
                    <p className="text-sm font-medium text-foreground">
                      {fileName || "Click to upload PDF / PPT / PPTX"}
                    </p>
                    {fileName && (
                      <p className="text-xs text-green-600 mt-2">✓ {fileName} ready</p>
                    )}
                  </div>
                </label>
              </div>

              {/* OR divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 text-muted-foreground">Or practice on a topic</span>
                </div>
              </div>

              {/* Topic selection */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-w-2xl mx-auto">
                {presentationTopics.slice(0, 9).map((topic) => (
                  <button
                    key={topic}
                    onClick={() => { setSelectedTopic(topic); setFileName(""); }}
                    className={`p-3 rounded-xl border-2 text-left text-sm transition-all ${
                      selectedTopic === topic
                        ? "border-primary bg-primary/10 shadow-lg"
                        : "border-border bg-white/40 dark:bg-white/5 hover:bg-white/60"
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>

              {(fileName || selectedTopic) && (
                <Button variant="hero" size="lg" onClick={handleStartPresentation}>
                  <Play className="w-5 h-5" />
                  Start Presentation
                </Button>
              )}
            </GlassCard>

            {/* Voice Feedback Toggle */}
            <GlassCard className="bg-accent/10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Voice Feedback</h3>
                  <p className="text-xs text-muted-foreground">Hear tips aloud after session</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={voiceFeedbackEnabled}
                    onChange={(e) => setVoiceFeedbackEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                </label>
              </div>
            </GlassCard>

            {/* Tips */}
            <GlassCard className="bg-accent/10">
              <h3 className="text-sm font-semibold text-foreground mb-3">Presentation Tips</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Maintain eye contact with your imaginary audience</li>
                <li>• Speak clearly and at a moderate pace</li>
                <li>• Use gestures to emphasize key points</li>
                <li>• Practice smooth transitions between slides</li>
                <li>• Aim for 5-7 minutes per session</li>
              </ul>
            </GlassCard>
          </>
        )}

        {/* ===== PRESENTING STEP ===== */}
        {step === "presenting" && (
          <>
            {/* Slide Display */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl aspect-video flex flex-col items-center justify-center p-8">
              {/* Slide Number Badge */}
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-white text-xs font-medium">
                Slide {currentSlide} / {totalSlides}
              </div>

              {/* Slide Title */}
              <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-6">
                {currentSlideContent.title}
              </h2>

              {/* Slide Points */}
              <ul className="space-y-3 text-left max-w-lg w-full">
                {currentSlideContent.points.map((point, i) => (
                  <li key={i} className="flex items-start gap-3 text-white/80">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span className="text-base md:text-lg">{point}</span>
                  </li>
                ))}
              </ul>

              {/* Slide Notes */}
              {(fileName || selectedTopic) && (
                <div className="absolute bottom-12 left-0 right-0 px-8">
                  <div className="text-xs text-white/30 text-center">
                    {fileName ? `📄 ${fileName}` : `📝 ${selectedTopic}`}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
                <Button
                  variant="glass"
                  size="icon"
                  onClick={() => setCurrentSlide((s) => Math.max(1, s - 1))}
                  disabled={currentSlide === 1}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div className="flex gap-1">
                  {Array.from({ length: totalSlides }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        i + 1 === currentSlide ? "w-4 bg-primary" : "w-1.5 bg-white/30"
                      }`}
                    />
                  ))}
                </div>
                <Button
                  variant="glass"
                  size="icon"
                  onClick={() => setCurrentSlide((s) => Math.min(totalSlides, s + 1))}
                  disabled={currentSlide === totalSlides}
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Slide Notes Input */}
            <GlassCard>
              <h3 className="text-sm font-semibold text-foreground mb-2">Slide Notes (Optional)</h3>
              <textarea
                value={slideNotes[currentSlide - 1]}
                onChange={(e) => {
                  const updated = [...slideNotes];
                  updated[currentSlide - 1] = e.target.value;
                  setSlideNotes(updated);
                }}
                placeholder="Add speaker notes for this slide..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-border bg-white/50 dark:bg-white/5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </GlassCard>

            {/* Recording Controls */}
            <GlassCard className="bg-gradient-to-r from-primary/10 to-accent/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {isRecording && (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg animate-pulse">
                      <Mic className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {isRecording ? "Recording..." : "Paused"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Duration: {formatDuration(duration)}
                    </p>
                  </div>
                </div>
                <Button variant="destructive" onClick={handleEndSession} disabled={isProcessing}>
                  {isProcessing ? "Analyzing..." : "End & Get Feedback"}
                </Button>
              </div>
            </GlassCard>

            {/* Real-time Stats */}
            <div className="grid grid-cols-3 gap-4">
              <GlassCard hover={false} className="text-center">
                <div className="text-2xl font-bold text-primary">{currentSlide}</div>
                <p className="text-xs text-muted-foreground mt-1">Current Slide</p>
              </GlassCard>
              <GlassCard hover={false} className="text-center">
                <div className="text-2xl font-bold text-secondary">{formatDuration(duration)}</div>
                <p className="text-xs text-muted-foreground mt-1">Time Elapsed</p>
              </GlassCard>
              <GlassCard hover={false} className="text-center">
                <div className="text-2xl font-bold text-accent">{totalSlides - currentSlide}</div>
                <p className="text-xs text-muted-foreground mt-1">Slides Left</p>
              </GlassCard>
            </div>
          </>
        )}

        {/* ===== RESULTS STEP ===== */}
        {step === "results" && feedback && (
          <GlassCard className="space-y-6 bg-gradient-to-br from-primary/10 to-secondary/10">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-xl">
                <FileText className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Presentation Complete!</h3>
              <p className="text-muted-foreground">Here's your performance analysis</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-border">
                <h4 className="font-semibold text-foreground mb-3">Detailed Feedback</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{feedback}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-border text-center">
                  <div className="text-2xl font-bold text-primary">{formatDuration(duration)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Duration</p>
                </div>
                <div className="p-4 rounded-xl bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-border text-center">
                  <div className="text-2xl font-bold text-secondary">{totalSlides}</div>
                  <p className="text-xs text-muted-foreground mt-1">Slides</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setStep("upload");
                  setFileName("");
                  setSelectedTopic("");
                  setCurrentSlide(1);
                  setDuration(0);
                  setFeedback(null);
                  setHasProcessed(false);
                  setSlideNotes(Array(8).fill(""));
                }}
                className="flex-1"
              >
                New Presentation
              </Button>
              <Button variant="hero" onClick={() => navigate("/dashboard")} className="flex-1">
                Back to Dashboard
              </Button>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
};

export default PresentationPractice;
