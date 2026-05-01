import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HelpCircle, Mail, MessageSquare, BookOpen, ExternalLink, Send, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface HelpSupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FAQ = [
  {
    q: "How do I start a practice session?",
    a: "Go to the Practice tab from the bottom navigation, then select any activity like Speech Practice, Mock Interview, etc.",
  },
  {
    q: "How does scoring work?",
    a: "Your score is calculated based on grammar accuracy, vocabulary usage, fluency, and confidence in your responses.",
  },
  {
    q: "Can I use VANI offline?",
    a: "VANI requires an internet connection for AI features. Core navigation works offline.",
  },
  {
    q: "How do I reset my progress?",
    a: "Contact our support team at support@vani-ai.com and we'll help you reset your data.",
  },
];

export const HelpSupportDialog = ({ open, onOpenChange }: HelpSupportDialogProps) => {
  const [activeSection, setActiveSection] = useState<"home" | "faq" | "contact">("home");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({ subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.subject.trim() || !contactForm.message.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    // In a real app, this would send to a backend
    setSubmitted(true);
    toast({ title: "Message sent!", description: "We'll get back to you within 24 hours." });
    setTimeout(() => {
      setSubmitted(false);
      setContactForm({ subject: "", message: "" });
      setActiveSection("home");
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            Help &amp; Support
          </DialogTitle>
          <DialogDescription>Get assistance with VANI</DialogDescription>
        </DialogHeader>

        {activeSection === "home" && (
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">How can we help you today?</p>
            {[
              { icon: BookOpen, label: "FAQs", desc: "Common questions answered", action: () => setActiveSection("faq") },
              { icon: MessageSquare, label: "Contact Support", desc: "Send us a message", action: () => setActiveSection("contact") },
              {
                icon: Mail,
                label: "Email Us",
                desc: "support@vani-ai.com",
                action: () => window.open("mailto:support@vani-ai.com", "_blank"),
              },
              {
                icon: ExternalLink,
                label: "Documentation",
                desc: "Read the full guide",
                action: () => window.open("https://github.com/Hemanth-Thaluru/Vani--Soft-Skills-Agent", "_blank"),
              },
            ].map(({ icon: Icon, label, desc, action }) => (
              <button
                key={label}
                onClick={action}
                className="w-full flex items-center gap-4 p-3 rounded-xl bg-card/40 hover:bg-card/70 border border-border/50 hover:border-primary/40 transition-all text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto" />
              </button>
            ))}
          </div>
        )}

        {activeSection === "faq" && (
          <div className="space-y-3 py-2">
            <button
              onClick={() => setActiveSection("home")}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              ← Back
            </button>
            <h3 className="font-semibold text-foreground">Frequently Asked Questions</h3>
            <div className="space-y-2">
              {FAQ.map((item, idx) => (
                <div key={idx} className="rounded-xl border border-border/50 overflow-hidden">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-card/60 transition-all"
                  >
                    <span className="text-sm font-medium text-foreground">{item.q}</span>
                    <span className="text-muted-foreground ml-2">{expandedFaq === idx ? "▲" : "▼"}</span>
                  </button>
                  {expandedFaq === idx && (
                    <div className="px-3 pb-3 text-sm text-muted-foreground border-t border-border/30 pt-2">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === "contact" && (
          <div className="py-2">
            <button
              onClick={() => setActiveSection("home")}
              className="text-sm text-primary hover:underline flex items-center gap-1 mb-3"
            >
              ← Back
            </button>
            {submitted ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="font-semibold text-foreground">Message Sent!</p>
                <p className="text-sm text-muted-foreground mt-1">We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="help-subject">Subject</Label>
                  <Input
                    id="help-subject"
                    placeholder="What do you need help with?"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm((p) => ({ ...p, subject: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="help-message">Message</Label>
                  <Textarea
                    id="help-message"
                    placeholder="Describe your issue or question..."
                    rows={4}
                    value={contactForm.message}
                    onChange={(e) => setContactForm((p) => ({ ...p, message: e.target.value }))}
                  />
                </div>
                <Button type="submit" className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </form>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
