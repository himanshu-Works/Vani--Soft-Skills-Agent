import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/GlassCard";
import { BottomNav } from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Volume2, BookOpen, Sparkles, Mic, MicOff, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateGeminiResponse } from "@/integrations/gemini";
import { speakText } from "@/integrations/azureTts";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

type RecordingState = "idle" | "recording" | "processing";

const quickQuestions = [
  "What are the 12 tenses in English?",
  "When do I use 'a' vs 'an'?",
  "Explain active and passive voice",
  "What are common English idioms?",
  "How do I use semicolons correctly?",
  "Difference between 'affect' and 'effect'",
  "What are modal verbs?",
  "How to improve English vocabulary?",
  "Explain direct and indirect speech",
  "What is subject-verb agreement?",
];

const ENGLISH_SYSTEM_PROMPT = `You are VANI's English Language Expert — a friendly, knowledgeable, and encouraging teacher specializing in the English language. 

Your expertise covers:
- Grammar (tenses, parts of speech, sentence structure, punctuation)
- Vocabulary (word meanings, synonyms, antonyms, idioms, phrasal verbs, collocations)
- Pronunciation and phonetics
- Writing skills (essays, emails, reports, letters)
- Reading comprehension
- Common errors made by Indian English speakers
- English for professional settings (interviews, presentations, GDs)
- Literature and language history when asked

Guidelines:
- Always give clear, practical explanations with examples
- Use relatable examples relevant to Indian students and professionals
- Be encouraging and patient — never make the user feel bad for not knowing something
- Format your answers with clear headings, bullet points, and examples
- Keep answers focused but comprehensive
- When explaining grammar rules, always give 3+ examples
- Add a "Quick Tip" at the end of each response

You only answer questions about the English language and communication. If asked about unrelated topics, politely redirect to English language learning.`;

const Chatbot = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "ai",
      content:
        "Hello! 👋 I'm your **English Language Expert**. I can help you with grammar, vocabulary, pronunciation, writing, idioms, and everything else about the English language.\n\nWhat would you like to learn today? You can ask me anything about English — by typing or using the 🎤 voice button!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [transcript, setTranscript] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  // ─── Speech Recognition ──────────────────────────────────────────────────
  const isSpeechSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const startRecording = useCallback(() => {
    if (!isSpeechSupported) {
      toast({
        title: "Voice not supported",
        description: "Your browser doesn't support voice input. Try Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    let finalTranscript = "";

    recognition.onstart = () => {
      setRecordingState("recording");
      setTranscript("");
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    };

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " ";
        } else {
          interim += result[0].transcript;
        }
      }
      setTranscript((finalTranscript + interim).trim());
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "no-speech") {
        toast({ title: "No speech detected", description: "Please speak clearly into your microphone." });
      } else if (event.error === "not-allowed") {
        toast({
          title: "Microphone access denied",
          description: "Please allow microphone access and try again.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Voice error", description: `Error: ${event.error}`, variant: "destructive" });
      }
      stopRecording();
    };

    recognition.onend = () => {
      if (recognitionRef.current) {
        // Recognition ended but we didn't stop it — auto-restart
        // (This handles Android/browser timeouts)
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSpeechSupported, toast]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setRecordingState("idle");
    setRecordingTime(0);
  }, []);

  const stopAndSend = useCallback(() => {
    // Capture current transcript before stopping
    setTranscript((currentTranscript) => {
      const text = currentTranscript.trim();
      stopRecording();
      if (text) {
        // Small delay to let state settle
        setTimeout(() => {
          sendMessage(text);
          setTranscript("");
        }, 100);
      } else {
        toast({ title: "No speech detected", description: "Please try speaking again." });
        setTranscript("");
      }
      return "";
    });
  }, [stopRecording, toast]);

  const handleMicClick = () => {
    if (recordingState === "idle") {
      startRecording();
    } else if (recordingState === "recording") {
      stopAndSend();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ─── Messaging ────────────────────────────────────────────────────────────
  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const conversationHistory = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
        .join("\n\n");

      const prompt = `${ENGLISH_SYSTEM_PROMPT}

Previous conversation:
${conversationHistory}

User's latest question: ${messageText}

Please provide a helpful, clear response about the English language:`;

      const response = await generateGeminiResponse(prompt);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not get a response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const speakMessage = async (messageId: string, text: string) => {
    if (speakingId === messageId) return;
    setSpeakingId(messageId);
    try {
      await speakText(text);
    } catch {
      toast({ title: "Could not play audio", variant: "destructive" });
    } finally {
      setSpeakingId(null);
    }
  };

  const formatMessage = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, "<code class='bg-primary/10 px-1 rounded text-primary text-xs'>$1</code>")
      .replace(/\n/g, "<br/>");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background flex flex-col pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">English Expert</h1>
                <p className="text-xs text-muted-foreground">Ask anything about English</p>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Questions */}
      <div className="max-w-4xl mx-auto w-full px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {quickQuestions.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="flex-shrink-0 px-3 py-2 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all whitespace-nowrap"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 space-y-4 overflow-y-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
          >
            {message.role === "ai" && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 mr-3 shadow-md mt-1">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                message.role === "user"
                  ? "bg-gradient-to-br from-primary to-secondary text-white rounded-br-none"
                  : "bg-card border border-border rounded-bl-none"
              }`}
            >
              <div
                className={`text-sm leading-relaxed ${message.role === "user" ? "text-white" : "text-foreground"}`}
                dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
              />
              {message.role === "ai" && (
                <button
                  onClick={() => speakMessage(message.id, message.content.replace(/<[^>]+>/g, ""))}
                  className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <Volume2 className={`w-3 h-3 ${speakingId === message.id ? "animate-pulse text-primary" : ""}`} />
                  {speakingId === message.id ? "Speaking..." : "Listen"}
                </button>
              )}
              <p className={`text-xs mt-1 ${message.role === "user" ? "text-white/70" : "text-muted-foreground"}`}>
                {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 mr-3 shadow-md mt-1">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-bl-none px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.1s" }} />
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.2s" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Voice Recording Overlay */}
      {recordingState === "recording" && (
        <div className="max-w-4xl mx-auto w-full px-4 pb-2">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 animate-pulse-slow">
            <div className="relative flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <div className="absolute w-6 h-6 rounded-full bg-red-500/30 animate-ping" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-400">
                🎤 Listening... {formatTime(recordingTime)}
              </p>
              {transcript && (
                <p className="text-xs text-muted-foreground mt-0.5 italic truncate">
                  "{transcript}"
                </p>
              )}
            </div>
            <button
              onClick={stopAndSend}
              className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 transition-colors flex items-center gap-1"
            >
              <Square className="w-3 h-3" /> Stop & Send
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="sticky bottom-20 bg-card/90 backdrop-blur-lg border-t border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-3 items-end">
            {/* Mic Button */}
            <button
              id="voice-input-btn"
              onClick={handleMicClick}
              disabled={isLoading}
              title={recordingState === "idle" ? "Start voice input" : "Stop & send"}
              className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm ${
                recordingState === "recording"
                  ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                  : "bg-card border border-border text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/5"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {recordingState === "recording" ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>

            {/* Text Input */}
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={
                  recordingState === "recording"
                    ? "Listening... speak now"
                    : "Ask anything about English language..."
                }
                rows={1}
                disabled={recordingState === "recording"}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background/80 focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm text-foreground placeholder:text-muted-foreground transition-all disabled:opacity-60"
                style={{ maxHeight: "120px" }}
              />
            </div>

            {/* Send Button */}
            <Button
              variant="hero"
              size="icon"
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading || recordingState === "recording"}
              className="rounded-xl h-12 w-12 flex-shrink-0"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Press Enter to send • Shift+Enter for new line • 🎤 for voice
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Chatbot;
