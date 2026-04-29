import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/GlassCard";
import { BottomNav } from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Clock, X, Volume2 } from "lucide-react";
import { blogPosts, BlogPost } from "@/data/blogPosts";
import { speakText } from "@/integrations/azureTts";
import { useToast } from "@/hooks/use-toast";

const Blog = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const categories = ["All", ...Array.from(new Set(blogPosts.map((p) => p.category)))];

  const filteredPosts =
    activeCategory === "All" ? blogPosts : blogPosts.filter((p) => p.category === activeCategory);

  const speakArticle = async (content: string) => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      // Clean markdown and read aloud
      const cleanText = content
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/#{1,3} /g, "")
        .substring(0, 1000); // Limit to first 1000 chars for TTS
      await speakText(cleanText);
    } catch {
      toast({ title: "Could not play audio", variant: "destructive" });
    } finally {
      setIsSpeaking(false);
    }
  };

  const formatContent = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n\n/g, "</p><p class='mb-4'>")
      .replace(/\n/g, "<br/>");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center shadow-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Learn from the Best</h1>
                <p className="text-xs text-muted-foreground">
                  Insights from world-class speakers & communicators
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? "bg-primary text-white shadow-lg"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Hero Banner */}
        <GlassCard className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 text-center space-y-3">
          <div className="text-4xl">📖</div>
          <h2 className="text-2xl font-bold text-foreground">
            Learn from the World's Best Communicators
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover the secrets of speaking excellence from legends who conquered the fear of
            English, overcame stage fright, and inspired millions with their words.
          </p>
        </GlassCard>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post, index) => (
            <div
              key={post.id}
              className="animate-fade-up cursor-pointer"
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => setSelectedPost(post)}
            >
              <GlassCard className="h-full flex flex-col space-y-4 hover:shadow-xl transition-all duration-300 group">
                {/* Gradient Banner */}
                <div
                  className={`h-24 rounded-xl bg-gradient-to-br ${post.color} flex items-center justify-center text-4xl shadow-lg group-hover:scale-105 transition-transform`}
                >
                  {post.emoji}
                </div>

                {/* Category Badge */}
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                    {post.category}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {post.readTime}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-foreground text-base leading-snug group-hover:text-primary transition-colors">
                  {post.title}
                </h3>

                {/* Author */}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${post.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
                  >
                    {post.author.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{post.author}</p>
                    <p className="text-xs text-muted-foreground">{post.authorRole}</p>
                  </div>
                </div>

                {/* Excerpt */}
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                  {post.excerpt}
                </p>

                <Button variant="outline" size="sm" className="w-full group-hover:border-primary group-hover:text-primary transition-colors">
                  Read Full Article →
                </Button>
              </GlassCard>
            </div>
          ))}
        </div>
      </div>

      {/* Article Modal */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="bg-card border border-border rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-card/95 backdrop-blur-lg border-b border-border px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedPost.emoji}</span>
                <div>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                    {selectedPost.category}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => speakArticle(selectedPost.content)}
                  className={isSpeaking ? "text-primary" : ""}
                >
                  <Volume2 className={`w-5 h-5 ${isSpeaking ? "animate-pulse" : ""}`} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setSelectedPost(null)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Article Content */}
            <div className="px-6 py-6 space-y-4">
              <h2 className="text-2xl font-bold text-foreground leading-tight">
                {selectedPost.title}
              </h2>

              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${selectedPost.color} flex items-center justify-center text-white text-sm font-bold`}
                >
                  {selectedPost.author.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{selectedPost.author}</p>
                  <p className="text-xs text-muted-foreground">{selectedPost.authorRole}</p>
                </div>
                <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {selectedPost.readTime}
                </span>
              </div>

              <div
                className="prose prose-sm max-w-none text-foreground leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: `<p class='mb-4'>${formatContent(selectedPost.content)}</p>`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Blog;
