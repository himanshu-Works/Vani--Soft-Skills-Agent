import { Home, LayoutDashboard, TrendingUp, User, BookOpen, MessageCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: LayoutDashboard, label: "Practice", path: "/dashboard", requiresAuth: true },
  { icon: MessageCircle, label: "English", path: "/chatbot", requiresAuth: true },
  { icon: BookOpen, label: "Learn", path: "/blog" },
  { icon: TrendingUp, label: "Progress", path: "/progress", requiresAuth: true },
  { icon: User, label: "Profile", path: "/profile", requiresAuth: true },
];

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [hideTimer, setHideTimer] = useState<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    setIsVisible(true);
    if (hideTimer) clearTimeout(hideTimer);
    const timer = setTimeout(() => setIsVisible(false), 6000);
    setHideTimer(timer);
  }, [hideTimer]);

  useEffect(() => {
    resetTimer();
    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerHeight - e.clientY < 150) resetTimer();
    };
    const handleClick = () => resetTimer();
    const handleTouch = () => resetTimer();

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleClick);
    window.addEventListener("touchstart", handleTouch);

    return () => {
      if (hideTimer) clearTimeout(hideTimer);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("touchstart", handleTouch);
    };
  }, [resetTimer]);

  const handleNavClick = (path: string, requiresAuth?: boolean) => {
    if (requiresAuth && !user) {
      navigate("/auth");
      return;
    }
    navigate(path);
  };

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-xl border-t border-border z-50 safe-bottom transition-transform duration-500",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="flex justify-around items-center h-20 px-2 max-w-2xl mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              id={`nav-${item.label.toLowerCase()}`}
              onClick={() => handleNavClick(item.path, item.requiresAuth)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 min-w-[52px]",
                isActive
                  ? "text-primary scale-110"
                  : "text-muted-foreground hover:text-foreground hover:scale-105"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "animate-scale-in")} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
