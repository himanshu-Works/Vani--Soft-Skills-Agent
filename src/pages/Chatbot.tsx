import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/GlassCard";
import { BottomNav } from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Mic, Volume2, BookOpen, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateGeminiResponse } from "@/integrations/gemini";
import { speakText } from "@/integrations/azureTts";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

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
        "Hello! 👋 I'm your **English Language Expert**. I can help you with grammar, vocabulary, pronunciation, writing, idioms, and everything else about the English language.\n\nWhat would you like to learn today? You can ask me anything about English!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    // Simple markdown-like formatting
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

      {/* Input Area */}
      <div className="sticky bottom-20 bg-card/90 backdrop-blur-lg border-t border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-3 items-end">
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
                placeholder="Ask anything about English language..."
                rows={1}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background/80 focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm text-foreground placeholder:text-muted-foreground transition-all"
                style={{ maxHeight: "120px" }}
              />
            </div>
            <Button
              variant="hero"
              size="icon"
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="rounded-xl h-12 w-12 flex-shrink-0"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Chatbot;
