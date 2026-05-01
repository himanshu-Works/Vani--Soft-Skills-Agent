import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, BellOff, Mail, Megaphone } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface NotificationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STORAGE_KEY = "vani_notification_prefs";

function loadPrefs() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {
    practiceReminders: true,
    weeklyReport: true,
    achievementAlerts: true,
    emailNotifications: false,
  };
}

export const NotificationsDialog = ({ open, onOpenChange }: NotificationsDialogProps) => {
  const [prefs, setPrefs] = useState(loadPrefs);

  const toggle = (key: keyof typeof prefs) =>
    setPrefs((p: typeof prefs) => ({ ...p, [key]: !p[key] }));

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      toast({ title: "Notification preferences saved!" });
      onOpenChange(false);
    } catch {
      toast({ title: "Could not save preferences", variant: "destructive" });
    }
  };

  const notifItems = [
    {
      key: "practiceReminders" as const,
      icon: Bell,
      label: "Practice Reminders",
      desc: "Daily reminders to keep your streak going",
    },
    {
      key: "weeklyReport" as const,
      icon: Megaphone,
      label: "Weekly Progress Report",
      desc: "Get a summary of your weekly performance",
    },
    {
      key: "achievementAlerts" as const,
      icon: Bell,
      label: "Achievement Alerts",
      desc: "Get notified when you earn a new badge",
    },
    {
      key: "emailNotifications" as const,
      icon: Mail,
      label: "Email Notifications",
      desc: "Receive notifications via email",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notifications
          </DialogTitle>
          <DialogDescription>Configure your alert preferences</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {notifItems.map(({ key, icon: Icon, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-card/40 border border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-foreground cursor-pointer">{label}</Label>
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
