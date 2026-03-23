import { useState } from "react";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Newspaper, Filter, TrendingUp, Star } from "lucide-react";

const categoryLabels: Record<string, string> = {
  ultimate_team: "Ultimate Team",
  career_mode: "Modo Carreira",
  pro_clubs: "Pro Clubs",
  volta: "Volta",
  patch: "Patch",
  general: "Geral",
};

const categories = [
  { value: "", label: "Todas" },
  { value: "ultimate_team", label: "Ultimate Team" },
  { value: "career_mode", label: "Modo Carreira" },
  { value: "pro_clubs", label: "Pro Clubs" },
  { value: "patch", label: "Patches" },
  { value: "general", label: "Geral" },
];

export default function Noticias() {
  const [selectedCategory, setSelectedCategory] = useState("");

  const { data: news, isLoading } = trpc.news.list.useQuery({
    limit: 20,
    category: selectedCategory || undefined,
  });

  const { data: featured } = trpc.news.list.useQuery({ limit: 1, featured: true });
  const featuredNews = featured?.[0];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-20">
        {/* Header */}
        <section className="py-12 border-b border-border/50" style={{ background: "oklch(0.12 0.01 240)" }}>
          <div className="container">
            <div className="flex items-center gap-3 mb-2">
              <Newspaper className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-black">Notícias FIFA</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Tudo sobre Ultimate Team, patches, modos de jogo e muito mais
            </p>
          </div>
        </section>

        <div className="container py-10">
          {/* Featured News */}
          {featuredNews && (
            <div className="fut-card p-8 mb-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 opacity-5 rounded-full"
                style={{ background: "radial-gradient(circle, oklch(0.65 0.20 145), transparent)", transform: "translate(30%, -30%)" }} />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">Destaque</span>
                  <span className={`badge-${featuredNews.category}`}>
                    {categoryLabels[featuredNews.category] ?? featuredNews.category}
                  </span>
                </div>
                <h2 className="text-3xl font-black mb-3 leading-tight">{featuredNews.title}</h2>
                <p className="text-muted-foreground text-base leading-relaxed mb-4 max-w-3xl">
                  {featuredNews.summary}
                </p>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground">
                    {new Date(featuredNews.publishedAt).toLocaleDateString("pt-BR", {
                      day: "2-digit", month: "long", year: "numeric"
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Category Filter */}
          <div className="flex items-center gap-2 mb-8 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedCategory === cat.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* News Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="fut-card p-6 animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/3 mb-3" />
                  <div className="h-6 bg-muted rounded w-full mb-2" />
                  <div className="h-6 bg-muted rounded w-4/5 mb-4" />
                  <div className="h-4 bg-muted rounded w-full mb-2" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : news && news.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.map((item: any) => (
                <article key={item.id} className="fut-card fut-card-hover p-6 flex flex-col gap-3 group">
                  <div className="flex items-center justify-between">
                    <span className={`badge-${item.category}`}>
                      {categoryLabels[item.category] ?? item.category}
                    </span>
                    {item.featured && (
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    )}
                  </div>
                  <h3 className="text-lg font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">
                    {item.summary}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto pt-3 border-t border-border/50">
                    <TrendingUp className="h-3 w-3" />
                    <span>{new Date(item.publishedAt).toLocaleDateString("pt-BR", {
                      day: "2-digit", month: "short", year: "numeric"
                    })}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Newspaper className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">Nenhuma notícia encontrada nesta categoria.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
