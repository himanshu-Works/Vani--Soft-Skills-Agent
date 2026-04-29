import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/GlassCard";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Mic, Play, Square, Volume2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { generateGeminiResponse } from "@/integrations/gemini";
import { speakText } from "@/integrations/azureTts";
import { uploadAudioToAssembly, createTranscript, pollTranscript } from "@/integrations/assembly";
import { gdTopics } from "@/data/questionBanks";

interface Message {
  role: string;
  content: string;
  personality?: string;
  color?: string;
}

const participantPool = [
  { name: "Aisha", personality: "Analytical", color: "#8B5CF6", avatar: "A" },
  { name: "Ravi", personality: "Creative", color: "#F59E0B", avatar: "R" },
  { name: "Maya", personality: "Pragmatic", color: "#10B981", avatar: "M" },
  { name: "Karan", personality: "Skeptical", color: "#EF4444", avatar: "K" },
];

const aggressionLevels = [
  { value: "polite", label: "Polite", desc: "Respectful, turn-taking" },
  { value: "balanced", label: "Balanced", desc: "Natural flow" },
  { value: "competitive", label: "Competitive", desc: "Interruptions allowed" },
];

// GD Room component — circular avatar layout
const GDRoom = ({
  participants,
  messages,
  currentSpeaker,
  isSpeaking,
}: {
  participants: typeof participantPool;
  messages: Message[];
  currentSpeaker: string | null;
  isSpeaking: boolean;
}) => {
  const lastMsg = messages.filter((m) => m.role !== "system").slice(-1)[0];

  // Positions for avatars in a semi-circle (top)
  const positions = [
    { top: "10%", left: "15%" },
    { top: "5%", left: "40%" },
    { top: "10%", right: "15%" },
    { top: "30%", right: "5%" },
  ].slice(0, participants.length);

  return (
    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-slate-800 via-slate-700 to-slate-900 shadow-2xl" style={{ minHeight: "320px" }}>
      {/* Room ambiance */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-slate-900 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
      </div>

      {/* Table */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-40 h-20 bg-amber-900/60 rounded-full border border-amber-700/40 shadow-xl" />
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white/40 text-[10px] font-medium">
        GROUP DISCUSSION
      </div>

      {/* AI Participant Avatars */}
      {participants.map((p, i) => {
        const isTalking = currentSpeaker === p.name && isSpeaking;
        const pos = positions[i] || { top: "20%", left: "20%" };
        return (
          <div
            key={p.name}
            className="absolute flex flex-col items-center gap-1 transition-all"
            style={pos}
          >
            {/* Speech bubble */}
            {isTalking && lastMsg?.role === p.name && (
              <div
                className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white text-slate-800 text-xs rounded-xl px-3 py-2 shadow-lg z-10 max-w-40 animate-fade-in"
                style={{ border: `2px solid ${p.color}` }}
              >
                <p className="line-clamp-2">{lastMsg.content}</p>
                <div
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45"
                  style={{ background: p.color }}
                />
              </div>
            )}

            {/* Avatar circle */}
            <div className={`relative w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-xl border-3 transition-all ${isTalking ? "scale-110" : ""}`}
              style={{ background: `radial-gradient(circle, ${p.color}cc, ${p.color}88)`, borderColor: isTalking ? "#FCD34D" : "transparent", borderWidth: "3px" }}
            >
              {p.avatar}
              {isTalking && (
                <div className="absolute inset-0 rounded-full animate-ping" style={{ background: `${p.color}44` }} />
              )}
            </div>
            <span className="text-white text-[10px] font-medium">{p.name}</span>
            <span className="text-white/50 text-[8px]">{p.personality}</span>
          </div>
        );
      })}

      {/* User Avatar (bottom center) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg shadow-xl border-3 border-primary/50">
          YOU
        </div>
        <span className="text-white text-[10px] font-medium">You</span>
      </div>
    </div>
  );
};

const GroupDiscussion = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isRecording, audioBlob, startRecording, stopRecording, resetRecording } = useAudioRecorder();
  const [step, setStep] = useState<"setup" | "discussion" | "results">("setup");
  const [config, setConfig] = useState({ participants: 3, aggression: "balanced", topic: "" });
  const [participants, setParticipants] = useState<typeof participantPool>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [roundCount, setRoundCount] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showAllTopics, setShowAllTopics] = useState(false);

  const displayedTopics = showAllTopics ? gdTopics : gdTopics.slice(0, 8);

  const handleStartDiscussion = async () => {
    if (!config.topic) {
      toast({ title: "Topic Required", description: "Please select a discussion topic", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    try {
      const selected = participantPool.slice(0, config.participants);
      setParticipants(selected);
      setMessages([{ role: "system", content: `Topic: ${config.topic}` }]);
      setStep("discussion");
      toast({ title: "Discussion Started", description: "AI participants are ready" });
      handleAITurn(selected[0], []);
    } catch (error) {
      console.error("Error starting discussion:", error);
      toast({ title: "Error", description: "Failed to initialize discussion", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAITurn = async (participant: typeof participantPool[0], history: Message[]) => {
    setCurrentSpeaker(participant.name);
    setIsProcessing(true);
    try {
      const historyText = history.map((m) => `${m.role}: ${m.content}`).join("\n");
      const aggressionInstruction =
        config.aggression === "polite"
          ? "Be respectful and wait for others to finish."
          : config.aggression === "competitive"
          ? "Be assertive, challenge others, interrupt occasionally."
          : "Be natural and conversational.";
      const prompt = `You are ${participant.name}, a ${participant.personality} participant in a group discussion about "${config.topic}". ${aggressionInstruction}

Conversation so far:
${historyText}

Respond with 1-2 sentences in a natural, conversational tone. Make a clear, relevant point.`;
      const response = await generateGeminiResponse(prompt);
      const aiMessage: Message = { role: participant.name, content: response, personality: participant.personality, color: participant.color };
      setMessages((prev) => [...prev, aiMessage]);
      await speakMessage(response);
    } catch (error) {
      console.error("Error getting AI response:", error);
    } finally {
      setIsProcessing(false);
      setCurrentSpeaker(null);
    }
  };

  const speakMessage = async (text: string) => {
    setIsSpeaking(true);
    try {
      await speakText(text);
    } catch {
      console.error("TTS error");
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleUserTurn = async () => {
    try {
      await startRecording();
      toast({ title: "Recording", description: "Share your thoughts" });
    } catch {
      toast({ title: "Error", description: "Could not access microphone", variant: "destructive" });
    }
  };

  const processUserResponse = async () => {
    if (!audioBlob) return;
    setIsProcessing(true);
    try {
      const uploadUrl = await uploadAudioToAssembly(audioBlob);
      const created = await createTranscript(uploadUrl);
      const result = await pollTranscript(created.id);
      const userMessage: Message = { role: "You", content: result.text };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      const newRoundCount = roundCount + 1;
      setRoundCount(newRoundCount);
      if (newRoundCount >= 8) {
        await getFeedback(newMessages);
      } else {
        const nextParticipant = participants[newRoundCount % participants.length];
        await handleAITurn(nextParticipant, newMessages);
      }
      resetRecording();
    } catch (error) {
      console.error("Error processing response:", error);
      toast({ title: "Error", description: "Failed to process your response", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const getFeedback = async (history: Message[]) => {
    setIsProcessing(true);
    try {
      const conversationText = history
        .filter((m) => m.role !== "system")
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n\n");
      const prompt = `You are a group discussion coach. Analyze this GD on "${config.topic}".

Provide structured feedback:
**Participation Score:** [X/100]
**Strengths:** [list 3]
**Areas to Improve:** [list 3]
**Communication Style:** [assessment]
**Listening Skills:** [assessment]
**Leadership Presence:** [assessment]
**Top 3 Tips:** [specific actionable tips]

Conversation:
${conversationText}`;
      const feedbackText = await generateGeminiResponse(prompt);
      setFeedback(feedbackText);
      setStep("results");
      toast({ title: "Discussion Complete", description: "Review your feedback" });
      await speakMessage("Group discussion complete. Here is your performance feedback.");
    } catch (error) {
      console.error("Error getting feedback:", error);
      toast({ title: "Error", description: "Failed to generate feedback", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (audioBlob && !isProcessing && step === "discussion") {
      processUserResponse();
    }
  }, [audioBlob]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Group Discussion</h1>
              <p className="text-xs text-muted-foreground">Practice with AI participants</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 pb-24 animate-fade-in">

        {/* ===== SETUP ===== */}
        {step === "setup" && (
          <>
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Discussion Topic</h3>
                <span className="text-xs text-muted-foreground">{gdTopics.length} topics</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {displayedTopics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => setConfig({ ...config, topic })}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      config.topic === topic ? "border-primary bg-primary/10 shadow-lg" : "border-border bg-white/40 dark:bg-white/5 hover:bg-white/60"
                    }`}
                  >
                    <p className="font-medium text-foreground text-sm">{topic}</p>
                  </button>
                ))}
              </div>
              <button onClick={() => setShowAllTopics(!showAllTopics)} className="mt-3 text-xs text-primary hover:underline">
                {showAllTopics ? "Show less" : `Show all ${gdTopics.length} topics`}
              </button>
            </GlassCard>

            <GlassCard>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                AI Participants: {config.participants}
              </h3>
              <div className="flex gap-3">
                {[2, 3, 4].map((num) => (
                  <button
                    key={num}
                    onClick={() => setConfig({ ...config, participants: num })}
                    className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                      config.participants === num ? "border-primary bg-primary/10 shadow-lg" : "border-border bg-white/40 dark:bg-white/5 hover:bg-white/60"
                    }`}
                  >
                    <Users className="w-6 h-6 mx-auto mb-1" />
                    <p className="text-sm font-medium">{num} AI</p>
                  </button>
                ))}
              </div>
            </GlassCard>

            <GlassCard>
              <h3 className="text-lg font-semibold text-foreground mb-4">Discussion Style</h3>
              <div className="space-y-3">
                {aggressionLevels.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setConfig({ ...config, aggression: level.value })}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      config.aggression === level.value ? "border-primary bg-primary/10 shadow-lg" : "border-border bg-white/40 dark:bg-white/5 hover:bg-white/60"
                    }`}
                  >
                    <p className="font-medium text-foreground">{level.label}</p>
                    <p className="text-sm text-muted-foreground">{level.desc}</p>
                  </button>
                ))}
              </div>
            </GlassCard>

            {/* Participant preview */}
            <GlassCard>
              <h3 className="text-sm font-semibold text-foreground mb-3">Your AI Teammates</h3>
              <div className="flex gap-3">
                {participantPool.slice(0, config.participants).map((p) => (
                  <div key={p.name} className="flex flex-col items-center gap-1">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg"
                      style={{ background: `radial-gradient(circle, ${p.color}dd, ${p.color}99)` }}
                    >
                      {p.avatar}
                    </div>
                    <span className="text-xs text-foreground font-medium">{p.name}</span>
                    <span className="text-[10px] text-muted-foreground">{p.personality}</span>
                  </div>
                ))}
              </div>
            </GlassCard>

            <Button
              variant="hero"
              size="lg"
              onClick={handleStartDiscussion}
              className="w-full"
              disabled={!config.topic}
            >
              <Play className="w-5 h-5" />
              Start Discussion
            </Button>
          </>
        )}

        {/* ===== DISCUSSION ===== */}
        {step === "discussion" && participants.length > 0 && (
          <>
            {/* Immersive GD Room */}
            <GDRoom
              participants={participants}
              messages={messages}
              currentSpeaker={currentSpeaker}
              isSpeaking={isSpeaking}
            />

            {/* Topic */}
            <GlassCard className="text-center bg-gradient-to-r from-primary/10 to-secondary/10">
              <h3 className="text-lg font-bold text-foreground mb-1">{config.topic}</h3>
              <p className="text-sm text-muted-foreground">
                {participants.length} AI participants • {config.aggression} style
              </p>
            </GlassCard>

            {/* Discussion Feed */}
            <GlassCard className="space-y-3 max-h-72 overflow-y-auto">
              {messages.filter((m) => m.role !== "system").map((msg, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
                    msg.role === "You" ? "bg-primary/10 ml-4" : "bg-card/60"
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs shadow-md"
                    style={{
                      background: msg.role === "You"
                        ? "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))"
                        : `radial-gradient(circle, ${msg.color || "#888"}cc, ${msg.color || "#888"}88)`,
                    }}
                  >
                    {msg.role === "You" ? "Y" : msg.role.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p
                        className="text-xs font-semibold"
                        style={{ color: msg.role === "You" ? "hsl(var(--primary))" : msg.color || "#888" }}
                      >
                        {msg.role}
                        {msg.personality && <span className="text-muted-foreground font-normal"> ({msg.personality})</span>}
                      </p>
                      {currentSpeaker === msg.role && isSpeaking && (
                        <Volume2 className="w-3 h-3 text-primary animate-pulse" />
                      )}
                    </div>
                    <p className="text-sm text-foreground break-words">{msg.content}</p>
                  </div>
                </div>
              ))}

              {isProcessing && !currentSpeaker && (
                <div className="text-center py-2">
                  <p className="text-xs text-muted-foreground animate-pulse">Processing...</p>
                </div>
              )}
            </GlassCard>

            {/* Your Turn */}
            {!isSpeaking && !currentSpeaker && (
              <GlassCard className="bg-gradient-to-r from-accent/20 to-primary/20 border-2 border-accent">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">Your Turn</p>
                    <p className="text-xs text-muted-foreground">Share your perspective on the topic</p>
                  </div>
                  {!isRecording ? (
                    <Button variant="hero" size="lg" onClick={handleUserTurn} disabled={isProcessing}>
                      <Mic className="w-5 h-5" />
                      Speak
                    </Button>
                  ) : (
                    <Button variant="destructive" size="lg" onClick={() => stopRecording()}>
                      <Send className="w-5 h-5" />
                      Send
                    </Button>
                  )}
                </div>
              </GlassCard>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <GlassCard hover={false} className="text-center">
                <div className="text-xl font-bold text-primary">{participants.length + 1}</div>
                <p className="text-xs text-muted-foreground">Participants</p>
              </GlassCard>
              <GlassCard hover={false} className="text-center">
                <div className="text-xl font-bold text-secondary">{messages.filter((m) => m.role !== "system").length}</div>
                <p className="text-xs text-muted-foreground">Exchanges</p>
              </GlassCard>
              <GlassCard hover={false} className="text-center">
                <div className="text-xl font-bold text-accent">{roundCount}/8</div>
                <p className="text-xs text-muted-foreground">Rounds</p>
              </GlassCard>
            </div>

            <Button
              variant="outline"
              onClick={() => getFeedback(messages)}
              className="w-full"
              disabled={isProcessing || isSpeaking}
            >
              <Square className="w-4 h-4" />
              End Discussion & Get Feedback
            </Button>
          </>
        )}

        {/* ===== RESULTS ===== */}
        {step === "results" && feedback && (
          <GlassCard className="space-y-6 bg-gradient-to-br from-primary/10 to-secondary/10">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-xl">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Discussion Complete!</h3>
              <p className="text-muted-foreground">Here's your performance analysis</p>
            </div>

            <div className="p-4 rounded-xl bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-border">
              <h4 className="font-semibold text-foreground mb-3">Detailed Feedback</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{feedback}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-border text-center">
                <div className="text-2xl font-bold text-primary">{participants.length + 1}</div>
                <p className="text-xs text-muted-foreground mt-1">Total Participants</p>
              </div>
              <div className="p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-border text-center">
                <div className="text-2xl font-bold text-secondary">
                  {messages.filter((m) => m.role === "You").length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Your Contributions</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setStep("setup");
                  setConfig({ participants: 3, aggression: "balanced", topic: "" });
                  setParticipants([]);
                  setMessages([]);
                  setRoundCount(0);
                  setFeedback(null);
                }}
                className="flex-1"
              >
                New Discussion
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

export default GroupDiscussion;
