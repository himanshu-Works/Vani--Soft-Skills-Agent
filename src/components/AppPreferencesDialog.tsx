import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Globe, Volume2, Mic, Zap } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AppPreferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STORAGE_KEY = "vani_app_prefs";

function loadPrefs() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {
    language: "en",
    autoPlayAI: true,
    micAutoStart: false,
    animationsEnabled: true,
    difficulty: "intermediate",
  };
}

export const AppPreferencesDialog = ({ open, onOpenChange }: AppPreferencesDialogProps) => {
  const [prefs, setPrefs] = useState(loadPrefs);

  const toggle = (key: string) =>
    setPrefs((p: any) => ({ ...p, [key]: !p[key] }));

  const set = (key: string, value: string) =>
    setPrefs((p: any) => ({ ...p, [key]: value }));

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      toast({ title: "App preferences saved!" });
      onOpenChange(false);
    } catch {
      toast({ title: "Could not save preferences", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            App Preferences
          </DialogTitle>
          <DialogDescription>Customize your VANI experience</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Language */}
          <div className="p-3 rounded-xl bg-card/40 border border-border/50 space-y-2">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              <Label className="font-medium">Interface Language</Label>
            </div>
            <Select value={prefs.language} onValueChange={(v) => set("language", v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">Hindi (हिन्दी)</SelectItem>
                <SelectItem value="mr">Marathi (मराठी)</SelectItem>
                <SelectItem value="gu">Gujarati (ગુજરાતી)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Difficulty */}
          <div className="p-3 rounded-xl bg-card/40 border border-border/50 space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <Label className="font-medium">Practice Difficulty</Label>
            </div>
            <Select value={prefs.difficulty} onValueChange={(v) => set("difficulty", v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Toggles */}
          {[
            { key: "autoPlayAI", icon: Volume2, label: "Auto-play AI Responses", desc: "Automatically speak AI answers aloud" },
            { key: "micAutoStart", icon: Mic, label: "Auto-start Microphone", desc: "Start listening immediately on practice" },
            { key: "animationsEnabled", icon: Zap, label: "UI Animations", desc: "Enable smooth transitions and animations" },
          ].map(({ key, icon: Icon, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-card/40 border border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-foreground">{label}</Label>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
              <Switch
                checked={prefs[key]}
                onCheckedChange={() => toggle(key)}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Preferences</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
