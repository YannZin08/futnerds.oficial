import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  Zap,
  Trophy,
  Users,
  BarChart3,
  Newspaper,
  Star,
  TrendingUp,
  Shield,
  Target,
} from "lucide-react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663216916845/hhB4oykfDQM9yCvhQGaX3n/logo-futnerds_8f14a724.png";

const categoryLabels: Record<string, string> = {
  ultimate_team: "Ultimate Team",
  career_mode: "Modo Carreira",
  pro_clubs: "Pro Clubs",
  volta: "Volta",
  patch: "Patch",
  general: "Geral",
};

const features = [
  {
    icon: Newspaper,
    title: "Notícias em Tempo Real",
    desc: "Fique por dentro das últimas atualizações, patches e eventos do FIFA.",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
  },
  {
    icon: BarChart3,
    title: "Análise de Jogadores",
    desc: "Estatísticas detalhadas e comparações para montar o time perfeito.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Trophy,
    title: "Estratégias FUT",
    desc: "Guias e dicas para dominar o Ultimate Team e escalar divisões.",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
  },
  {
    icon: Users,
    title: "Comunidade Ativa",
    desc: "Conecte-se com outros jogadores e compartilhe suas conquistas.",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
];

const stats = [
  { label: "Jogadores Analisados", value: "20+", icon: Users },
  { label: "Notícias Publicadas", value: "6+", icon: Newspaper },
  { label: "Modos de Jogo", value: "4", icon: Trophy },
  { label: "Atualizações", value: "Diárias", icon: Zap },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { data: newsData } = trpc.news.list.useQuery({ limit: 3, featured: true });
  const { data: topPlayers } = trpc.players.list.useQuery({ limit: 4, sortBy: "overall" });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, oklch(0.65 0.20 145), transparent)" }} />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-5"
            style={{ background: "radial-gradient(circle, oklch(0.65 0.20 145), transparent)" }} />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: "linear-gradient(oklch(0.65 0.20 145) 1px, transparent 1px), linear-gradient(90deg, oklch(0.65 0.20 145) 1px, transparent 1px)",
              backgroundSize: "60px 60px"
            }} />
        </div>

        <div className="container relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8">
              <Zap className="h-3.5 w-3.5" />
              A comunidade FIFA mais completa do Brasil
            </div>

            {/* Logo + Title */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <img src={LOGO_URL} alt="FUTNERDS" className="h-20 w-20 object-contain" />
              <h1 className="text-6xl md:text-7xl font-black tracking-tight"
                style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                FUT<span className="text-primary">NERDS</span>
              </h1>
            </div>

            <p className="text-xl md:text-2xl text-muted-foreground mb-4 font-light">
              Análises, notícias e estratégias para
            </p>
            <p className="text-xl md:text-2xl font-semibold text-foreground mb-10">
              elevar seu jogo ao próximo nível
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {isAuthenticated ? (
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-12 text-base font-semibold" asChild>
                  <Link href="/dashboard">
                    Ir para o Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-12 text-base font-semibold" asChild>
                  <a href={getLoginUrl()}>
                    Entrar na Comunidade <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                </Button>
              )}
              <Button size="lg" variant="outline" className="px-8 h-12 text-base border-border hover:border-primary/50" asChild>
                <Link href="/noticias">
                  Ver Notícias
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-8 border-y border-border/50" style={{ background: "oklch(0.12 0.01 240)" }}>
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-black text-primary mb-1"
                  style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-3">Tudo que você precisa</h2>
            <p className="text-muted-foreground text-lg">Uma plataforma completa para a comunidade FIFA</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="fut-card fut-card-hover p-6">
                <div className={`inline-flex p-3 rounded-xl ${f.bg} mb-4`}>
                  <f.icon className={`h-6 w-6 ${f.color}`} />
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest News */}
      {newsData && newsData.length > 0 && (
        <section className="py-20" style={{ background: "oklch(0.12 0.01 240)" }}>
          <div className="container">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-4xl font-black mb-1">Últimas Notícias</h2>
                <p className="text-muted-foreground">Fique por dentro do mundo FIFA</p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/noticias">Ver todas <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {newsData.map((item: any) => (
                <div key={item.id} className="fut-card fut-card-hover p-6 flex flex-col gap-3">
                  <span className={`badge-${item.category} w-fit`}>
                    {categoryLabels[item.category] ?? item.category}
                  </span>
                  <h3 className="text-lg font-bold leading-tight line-clamp-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">
                    {item.summary}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto pt-2 border-t border-border/50">
                    <span>{new Date(item.publishedAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Top Players Preview */}
      {topPlayers && topPlayers.length > 0 && (
        <section className="py-20">
          <div className="container">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-4xl font-black mb-1">Top Jogadores</h2>
                <p className="text-muted-foreground">Os melhores do Ultimate Team</p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/jogadores">Ver todos <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {topPlayers.map((player: any) => (
                <div key={player.id} className="fut-card fut-card-hover p-5 text-center">
                  {/* Overall badge */}
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/20 border-2 border-primary/40 mb-3 mx-auto">
                    <span className="text-xl font-black text-primary"
                      style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                      {player.overall}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm mb-1 truncate">{player.name}</h4>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-xs text-primary font-semibold">{player.position}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground truncate">{player.club}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{player.nationality}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 fut-gradient opacity-50" />
          <div className="container relative text-center">
            <div className="max-w-2xl mx-auto">
              <img src={LOGO_URL} alt="FUTNERDS" className="h-16 w-16 mx-auto mb-6 object-contain" />
              <h2 className="text-4xl font-black mb-4">Pronto para entrar no jogo?</h2>
              <p className="text-muted-foreground text-lg mb-8">
                Junte-se à comunidade FUTNERDS e tenha acesso a conteúdo exclusivo, análises detalhadas e muito mais.
              </p>
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-10 h-12 text-base font-semibold" asChild>
                <a href={getLoginUrl()}>
                  Criar Conta Grátis <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
