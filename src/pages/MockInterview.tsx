import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/GlassCard";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Briefcase, Mic, Play, Square, Volume2,
  CheckCircle2, Upload, FileText, Camera, CameraOff, User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useCamera } from "@/hooks/useCamera";
import { generateGeminiResponse } from "@/integrations/gemini";
import { speakText } from "@/integrations/azureTts";
import { uploadAudioToAssembly, createTranscript, pollTranscript } from "@/integrations/assembly";
import { jobRoles } from "@/data/questionBanks";

const MockInterview = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isRecording, audioBlob, startRecording, stopRecording, resetRecording } = useAudioRecorder();
  const { videoRef, cameraState, startCamera, stopCamera, getFramesForAnalysis, analyzeEmotions } = useCamera();

  const [step, setStep] = useState<"setup" | "interview" | "results">("setup");
  const [config, setConfig] = useState({ role: "", difficulty: "medium", type: "behavioral" });
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [questions, setQuestions] = useState<Array<{ question: string; category: string }>>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cvText, setCvText] = useState<string | null>(null);
  const [cvFileName, setCvFileName] = useState<string | null>(null);
  const [isReadingCv, setIsReadingCv] = useState(false);

  const difficulties = ["easy", "medium", "hard"];
  const interviewTypes = ["behavioral", "technical", "situational", "general"];

  const handleToggleCamera = async () => {
    if (cameraEnabled) {
      stopCamera();
      setCameraEnabled(false);
    } else {
      try {
        await startCamera();
        setCameraEnabled(true);
        toast({ title: "Camera Active", description: "Your expressions will be included in feedback" });
      } catch (error: any) {
        toast({ title: "Camera Error", description: error.message, variant: "destructive" });
      }
    }
  };

  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["application/pdf", "text/plain", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

    if (!allowed.includes(file.type) && !file.name.endsWith(".txt")) {
      toast({ title: "Invalid File", description: "Please upload a PDF, DOCX, or TXT file", variant: "destructive" });
      return;
    }

    setIsReadingCv(true);
    setCvFileName(file.name);

    try {
      if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        const text = await file.text();
        setCvText(text);
      } else {
        // For PDF/DOCX — read as text (basic extraction)
        const text = await file.text();
        setCvText(text.substring(0, 3000)); // Limit for API
      }
      toast({ title: "CV Uploaded", description: "Interview questions will be tailored to your CV" });
    } catch {
      toast({ title: "Error reading CV", variant: "destructive" });
      setCvText(null);
      setCvFileName(null);
    } finally {
      setIsReadingCv(false);
    }
  };

  const handleStartInterview = async () => {
    if (!config.role) {
      toast({ title: "Role Required", description: "Please select a job role", variant: "destructive" });
      return;
    }
    setIsLoadingQuestions(true);
    try {
      let prompt: string;
      if (cvText) {
        prompt = `You are an interviewer. Based on the following CV/resume, generate exactly 7 ${config.difficulty} ${config.type} interview questions tailored to the candidate's background, skills, and experience.

CV Content:
${cvText}

Return ONLY a valid JSON array:
[
  {"question": "Question?", "category": "${config.type}"},
  ...7 items total
]`;
      } else {
        prompt = `Generate exactly 7 ${config.difficulty} ${config.type} interview questions for a ${config.role} position.

Return ONLY a valid JSON array:
[
  {"question": "Question?", "category": "${config.type}"},
  ...7 items total
]`;
      }

      const raw = await generateGeminiResponse(prompt);
      let qs: Array<{ question: string; category: string }> = [];

      try {
        let jsonText = raw.trim();
        const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) jsonText = codeBlockMatch[1].trim();
        const jsonArrayMatch = jsonText.match(/\[[\s\S]*\]/);
        if (jsonArrayMatch) jsonText = jsonArrayMatch[0];
        const parsed = JSON.parse(jsonText);
        if (Array.isArray(parsed) && parsed.length > 0) qs = parsed;
        else throw new Error("Not a valid array");
      } catch {
        qs = [{ question: raw.trim(), category: config.type }];
      }

      if (!qs.length || !qs[0].question) throw new Error("No valid questions generated");

      setQuestions(qs);
      setStep("interview");
      toast({ title: "Interview Started", description: `${qs.length} questions loaded` });
      await speakQuestion(qs[0].question);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate questions",
        variant: "destructive",
      });
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const speakQuestion = async (question: string) => {
    if (!question?.trim()) return;
    setIsSpeaking(true);
    try {
      await speakText(question);
    } catch (error) {
      console.error("Error speaking question:", error);
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleStartAnswer = async () => {
    try {
      await startRecording();
      toast({ title: "Recording", description: "Answer the question clearly" });
    } catch {
      toast({ title: "Error", description: "Could not access microphone", variant: "destructive" });
    }
  };

  const handleStopAnswer = () => stopRecording();

  const processAnswer = async () => {
    if (!audioBlob) return;
    setIsProcessing(true);
    try {
      const uploadUrl = await uploadAudioToAssembly(audioBlob);
      const created = await createTranscript(uploadUrl);
      const result = await pollTranscript(created.id);
      const transcriptText: string = result.text || "";

      const newAnswers = [...answers, transcriptText];
      setAnswers(newAnswers);

      // ✅ Stop "Processing..." spinner and reset recording FIRST
      setIsProcessing(false);
      resetRecording();

      if (currentQuestionIndex < questions.length - 1) {
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);           // advance UI to next question
        toast({ title: "Next Question", description: "Listen and answer" });
        await speakQuestion(questions[nextIndex].question); // then speak it
      } else {
        await getFeedback(newAnswers);
      }
    } catch (error) {
      console.error("Error processing answer:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process answer",
        variant: "destructive",
      });
      setIsProcessing(false);
      resetRecording();
    }
  };

  const getFeedback = async (allAnswers: string[]) => {
    setIsProcessing(true);
    try {
      const qaList = questions
        .map((q, i) => `Q${i + 1}: ${q.question}\nA${i + 1}: ${allAnswers[i] || "(no answer)"}`)
        .join("\n\n");

      let cameraFeedback = "";
      if (cameraEnabled) {
        const frames = getFramesForAnalysis();
        if (frames.length > 0) {
          const emotionResult = await analyzeEmotions(frames);
          cameraFeedback = `\n\n**Expression & Body Language Analysis:**\n${emotionResult.summary} (Score: ${emotionResult.score}/100)`;
        }
      }

      const prompt = `You are an expert interview coach. Analyze the following interview Q&A and provide structured feedback.

Format your response as:
**Overall Performance:** [score/100]
**Strengths:** [list 3 strengths]
**Areas for Improvement:** [list 3 areas]
**Communication Style:** [assessment]
**Top 3 Action Items:** [specific tips]

Interview Q&A:
${qaList}`;

      const feedbackText = await generateGeminiResponse(prompt);
      setFeedback(feedbackText + cameraFeedback);
      setStep("results");
      toast({ title: "Interview Complete", description: "Review your feedback" });
      await speakQuestion("Interview complete. Here is your performance summary.");
    } catch (error) {
      console.error("Error getting feedback:", error);
      toast({ title: "Error", description: "Failed to generate feedback", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (audioBlob && !isProcessing && step === "interview") {
      processAnswer();
    }
  }, [audioBlob]);

  useEffect(() => {
    return () => { if (cameraEnabled) stopCamera(); };
  }, []);

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
              <h1 className="text-xl font-bold text-foreground">Mock Interview</h1>
              <p className="text-xs text-muted-foreground">Practice with AI interviewer</p>
            </div>
            {step === "setup" && (
              <Button
                variant={cameraEnabled ? "destructive" : "outline"}
                size="sm"
                onClick={handleToggleCamera}
                className="gap-2"
              >
                {cameraEnabled ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                {cameraEnabled ? "Cam On" : "Cam Off"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Camera PiP */}
      {cameraEnabled && (
        <div className="fixed top-20 right-4 z-30">
          <div className="relative w-36 h-28 rounded-xl overflow-hidden border-2 border-primary shadow-xl">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-white text-[8px] font-medium flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> YOU
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 pb-24 animate-fade-in">

        {/* ===== SETUP STEP ===== */}
        {step === "setup" && (
          <>
            {/* CV Upload */}
            <GlassCard>
              <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Upload CV (Optional)
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Upload your resume to get interview questions tailored to your experience and target role.
              </p>
              <label className="block cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleCvUpload}
                  className="hidden"
                />
                <div className={`p-4 border-2 border-dashed rounded-xl transition-all text-center ${
                  cvFileName ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-primary/5"
                }`}>
                  {isReadingCv ? (
                    <p className="text-sm text-muted-foreground animate-pulse">Reading CV...</p>
                  ) : cvFileName ? (
                    <div className="flex items-center justify-center gap-2 text-primary">
                      <FileText className="w-5 h-5" />
                      <span className="text-sm font-medium">{cvFileName}</span>
                      <span className="text-xs text-green-600">✓ Ready</span>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Click to upload PDF, DOCX, or TXT</p>
                    </div>
                  )}
                </div>
              </label>
            </GlassCard>

            {/* Job Role Selection */}
            <GlassCard>
              <h3 className="text-lg font-semibold text-foreground mb-4">Select Job Role</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {jobRoles.map((role) => (
                  <button
                    key={role}
                    onClick={() => { setIsCustomRole(false); setConfig({ ...config, role }); }}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      !isCustomRole && config.role === role
                        ? "border-primary bg-primary/10 shadow-lg scale-105"
                        : "border-border bg-white/40 dark:bg-white/5 hover:bg-white/60"
                    }`}
                  >
                    <Briefcase className="w-4 h-4 mb-1 text-primary" />
                    <p className="text-xs font-medium text-foreground">{role}</p>
                  </button>
                ))}
                <button
                  onClick={() => { setIsCustomRole(true); setConfig({ ...config, role: "" }); }}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${
                    isCustomRole ? "border-primary bg-primary/10 shadow-lg scale-105" : "border-border bg-white/40 dark:bg-white/5 hover:bg-white/60"
                  }`}
                >
                  <Briefcase className="w-4 h-4 mb-1 text-primary" />
                  <p className="text-xs font-medium text-foreground">Custom Role</p>
                </button>
              </div>
              {isCustomRole && (
                <div className="mt-4">
                  <Input
                    placeholder="e.g. Senior React Developer"
                    value={config.role}
                    onChange={(e) => setConfig({ ...config, role: e.target.value })}
                    className="bg-white/50 dark:bg-white/5"
                  />
                </div>
              )}
            </GlassCard>

            {/* Difficulty */}
            <GlassCard>
              <h3 className="text-lg font-semibold text-foreground mb-4">Difficulty Level</h3>
              <div className="flex gap-3">
                {difficulties.map((level) => (
                  <button
                    key={level}
                    onClick={() => setConfig({ ...config, difficulty: level })}
                    className={`flex-1 px-4 py-3 rounded-xl border-2 capitalize transition-all ${
                      config.difficulty === level ? "border-primary bg-primary/10 shadow-lg" : "border-border bg-white/40 dark:bg-white/5 hover:bg-white/60"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </GlassCard>

            {/* Interview Type */}
            <GlassCard>
              <h3 className="text-lg font-semibold text-foreground mb-4">Interview Type</h3>
              <div className="grid grid-cols-2 gap-3">
                {interviewTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setConfig({ ...config, type })}
                    className={`px-4 py-3 rounded-xl border-2 capitalize transition-all ${
                      config.type === type ? "border-primary bg-primary/10 shadow-lg" : "border-border bg-white/40 dark:bg-white/5 hover:bg-white/60"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </GlassCard>

            <Button
              variant="hero"
              size="lg"
              onClick={handleStartInterview}
              className="w-full"
              disabled={!config.role || isLoadingQuestions}
            >
              <Play className="w-5 h-5" />
              {isLoadingQuestions ? "Generating Questions..." : "Start Interview"}
            </Button>
          </>
        )}

        {/* ===== INTERVIEW STEP ===== */}
        {step === "interview" && questions.length > 0 && (
          <>
            {/* Interviewer Avatar Room */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-800 via-slate-700 to-slate-900 shadow-2xl">
              {/* Office environment backdrop */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-900 to-transparent" />
                <div className="absolute top-4 left-8 w-16 h-20 bg-slate-600 rounded opacity-40" />
                <div className="absolute top-4 right-8 w-16 h-20 bg-slate-600 rounded opacity-40" />
              </div>

              <div className="relative p-8 text-center">
                {/* Interviewer */}
                <div className="flex justify-center mb-4">
                  <div className={`relative ${isSpeaking ? "animate-bounce" : ""}`}>
                    {/* Avatar body */}
                    <div className={`w-24 h-24 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center shadow-2xl border-4 ${isSpeaking ? "border-yellow-400" : "border-white/20"} transition-all`}>
                      <User className="w-12 h-12 text-white" />
                    </div>
                    {/* Speaking indicator */}
                    {isSpeaking && (
                      <>
                        <div className="absolute inset-0 rounded-full bg-yellow-400/30 animate-ping" />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                          <Volume2 className="w-3 h-3 text-white animate-pulse" />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Desk */}
                <div className="mx-auto w-48 h-3 bg-gradient-to-r from-amber-800 to-amber-700 rounded-full shadow-lg mb-4" />

                <p className="text-xs text-slate-400 mb-2">AI Interviewer</p>

                {/* Question display */}
                <div className="bg-black/30 backdrop-blur rounded-2xl p-4 max-w-lg mx-auto">
                  <p className="text-sm font-medium text-white/80 mb-1">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </p>
                  <p className="text-white text-sm leading-relaxed">
                    {questions[currentQuestionIndex]?.question || "Loading question..."}
                  </p>
                  {isSpeaking && (
                    <div className="flex justify-center gap-1 mt-3">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="w-1 bg-yellow-400 rounded-full animate-bounce"
                          style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 0.1}s` }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Interview Configuration */}
            <GlassCard className="bg-gradient-to-r from-primary/10 to-secondary/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Interviewing for</p>
                  <h3 className="text-lg font-bold text-foreground">{config.role}</h3>
                  {cvFileName && (
                    <p className="text-xs text-primary mt-1 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> CV-based questions
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground capitalize">{config.type}</p>
                  <p className="text-xs text-muted-foreground capitalize">{config.difficulty} difficulty</p>
                </div>
              </div>
            </GlassCard>

            {/* Recording Controls */}
            <GlassCard className="text-center space-y-4">
              {isRecording && (
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-2xl animate-pulse">
                      <Mic className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-secondary blur-xl opacity-50 animate-glow" />
                  </div>
                </div>
              )}

              {isProcessing && (
                <div className="flex justify-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
              )}

              <Button
                variant={isRecording ? "destructive" : "hero"}
                size="lg"
                onClick={isRecording ? handleStopAnswer : handleStartAnswer}
                disabled={isProcessing || isSpeaking}
              >
                {isRecording ? (
                  <><Square className="w-5 h-5" /> Stop Answer</>
                ) : isProcessing ? "Processing..." : (
                  <><Mic className="w-5 h-5" /> Start Answer</>
                )}
              </Button>
            </GlassCard>

            {/* Progress */}
            <GlassCard hover={false}>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-foreground">
                    {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>
            </GlassCard>
          </>
        )}

        {/* ===== RESULTS STEP ===== */}
        {step === "results" && feedback && (
          <GlassCard className="space-y-6 bg-gradient-to-br from-primary/10 to-secondary/10">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-xl">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Interview Complete!</h3>
              <p className="text-muted-foreground">Here's your performance summary</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-border">
                <h4 className="font-semibold text-foreground mb-3">Detailed Feedback</h4>
                <div className="prose prose-sm max-w-none">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{feedback}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-border">
                <h4 className="font-semibold text-foreground mb-2">Your Answers</h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {answers.map((answer, index) => (
                    <div key={index} className="text-xs">
                      <p className="text-primary font-medium">Q{index + 1}: {questions[index]?.question}</p>
                      <p className="text-muted-foreground mt-1">A: {answer || "(No answer recorded)"}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setStep("setup");
                  setConfig({ role: "", difficulty: "medium", type: "behavioral" });
                  setQuestions([]);
                  setAnswers([]);
                  setCurrentQuestionIndex(0);
                  setFeedback(null);
                  setCvText(null);
                  setCvFileName(null);
                }}
                className="flex-1"
              >
                Try Another Role
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

export default MockInterview;