import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import {
  LayoutDashboard,
  Newspaper,
  Users,
  Star,
  Trophy,
  TrendingUp,
  ArrowRight,
  Lock,
  Zap,
  Target,
  Shield,
  Dumbbell,
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

const statIcons: Record<string, any> = {
  pace: Zap, shooting: Target, passing: TrendingUp,
  dribbling: Star, defending: Shield, physical: Dumbbell,
};

const statLabels: Record<string, string> = {
  pace: "Vel", shooting: "Fin", passing: "Pas",
  dribbling: "Dri", defending: "Def", physical: "Fís",
};

function StatMini({ value, label, icon: Icon }: { value: number; label: string; icon: any }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-bold text-foreground">{value}</span>
      <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function UnauthenticatedDashboard() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-20 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6 py-20">
          <div className="inline-flex p-4 rounded-full bg-primary/10 mb-6">
            <Lock className="h-10 w-10 text-primary" />
          </div>
          <img src={LOGO_URL} alt="FUTNERDS" className="h-16 w-16 mx-auto mb-4 object-contain" />
          <h2 className="text-3xl font-black mb-3">Área Exclusiva</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Faça login para acessar seu dashboard personalizado com notícias, jogadores favoritos e muito mais.
          </p>
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 w-full h-12 text-base font-semibold" asChild>
            <a href={getLoginUrl()}>
              Entrar na Comunidade <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth();

  const { data: recentNews } = trpc.news.list.useQuery({ limit: 4 }, { enabled: isAuthenticated });
  const { data: topPlayers } = trpc.players.list.useQuery({ limit: 6, sortBy: "overall" }, { enabled: isAuthenticated });
  const { data: favorites } = trpc.players.favorites.useQuery(undefined, { enabled: isAuthenticated });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 pt-20 flex items-center justify-center">
          <div className="text-center">
            <img src={LOGO_URL} alt="FUTNERDS" className="h-16 w-16 mx-auto mb-4 object-contain animate-pulse" />
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated) return <UnauthenticatedDashboard />;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-20">
        {/* Welcome Header */}
        <section className="py-10 border-b border-border/50" style={{ background: "oklch(0.12 0.01 240)" }}>
          <div className="container">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 border-2 border-primary/40">
                <AvatarImage src={user?.avatar ?? undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-xl font-black">
                  {user?.name?.charAt(0).toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-muted-foreground text-sm">Bem-vindo de volta,</p>
                <h1 className="text-3xl font-black">
                  {user?.name ?? user?.email ?? "Jogador"}
                </h1>
              </div>
              <div className="ml-auto hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
                <img src={LOGO_URL} alt="" className="h-6 w-6 object-contain" />
                <span className="text-sm font-semibold text-primary">Membro FUTNERDS</span>
              </div>
            </div>
          </div>
        </section>

        <div className="container py-10 space-y-10">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Notícias Disponíveis", value: recentNews?.length ?? 0, icon: Newspaper, color: "text-yellow-400", bg: "bg-yellow-400/10" },
              { label: "Jogadores no DB", value: topPlayers?.length ?? 0, icon: Users, color: "text-primary", bg: "bg-primary/10" },
              { label: "Favoritos", value: favorites?.length ?? 0, icon: Star, color: "text-orange-400", bg: "bg-orange-400/10" },
              { label: "Modos de Jogo", value: 4, icon: Trophy, color: "text-blue-400", bg: "bg-blue-400/10" },
            ].map((stat) => (
              <div key={stat.label} className="fut-card p-5">
                <div className={`inline-flex p-2.5 rounded-xl ${stat.bg} mb-3`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="text-3xl font-black mb-1" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent News */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-black flex items-center gap-2">
                  <Newspaper className="h-6 w-6 text-primary" /> Notícias Recentes
                </h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/noticias">Ver todas <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </div>
              <div className="space-y-3">
                {recentNews?.map((item: any) => (
                  <div key={item.id} className="fut-card fut-card-hover p-4 flex gap-4">
                    <div className="flex-1 min-w-0">
                      <span className={`badge-${item.category} text-xs mb-2 inline-block`}>
                        {categoryLabels[item.category] ?? item.category}
                      </span>
                      <h4 className="font-semibold text-sm leading-tight line-clamp-2 mb-1">{item.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.summary}</p>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(item.publishedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Players Sidebar */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-black flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-primary" /> Top Jogadores
                </h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/jogadores">Ver <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </div>
              <div className="space-y-3">
                {topPlayers?.map((player: any, idx: number) => (
                  <div key={player.id} className="fut-card fut-card-hover p-3 flex items-center gap-3">
                    <span className="text-lg font-black text-muted-foreground w-6 text-center"
                      style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                      {idx + 1}
                    </span>
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 border border-primary/30 shrink-0">
                      <span className="text-sm font-black text-primary">{player.overall}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{player.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{player.position} · {player.club}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Favorites Section */}
          {favorites && favorites.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-black flex items-center gap-2">
                  <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" /> Meus Favoritos
                </h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {favorites.map((fav: any) => (
                  <div key={fav.id} className="fut-card p-3 text-center">
                    <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-2">
                      <span className="text-sm font-black text-primary">{fav.player.overall}</span>
                    </div>
                    <p className="text-xs font-semibold truncate">{fav.player.name}</p>
                    <p className="text-xs text-primary">{fav.player.position}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div>
            <h2 className="text-2xl font-black mb-4">Explorar</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { href: "/noticias", icon: Newspaper, label: "Notícias FIFA", desc: "Últimas atualizações e eventos", color: "text-yellow-400", bg: "bg-yellow-400/10" },
                { href: "/jogadores", icon: Users, label: "Jogadores", desc: "Análise e estatísticas completas", color: "text-primary", bg: "bg-primary/10" },
                { href: "/perfil", icon: LayoutDashboard, label: "Meu Perfil", desc: "Gerencie suas informações", color: "text-blue-400", bg: "bg-blue-400/10" },
              ].map((link) => (
                <Link key={link.href} href={link.href}>
                  <div className="fut-card fut-card-hover p-5 flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${link.bg}`}>
                      <link.icon className={`h-6 w-6 ${link.color}`} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{link.label}</p>
                      <p className="text-xs text-muted-foreground">{link.desc}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
