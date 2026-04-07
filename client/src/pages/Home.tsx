import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  Zap,
  Trophy,
  Users,
  BarChart3,
  Heart,
} from "lucide-react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663216916845/hhB4oykfDQM9yCvhQGaX3n/logo-futnerds_8f14a724.png";

const features = [
  {
    icon: BarChart3,
    title: "Análise de Jogadores",
    desc: "Estatísticas detalhadas e comparações para montar o time perfeito no modo carreira.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Trophy,
    title: "Estratégias FUT",
    desc: "Guias e dicas para dominar o modo carreira e escalar divisões.",
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
  {
    icon: Zap,
    title: "Atualizações Constantes",
    desc: "Conteúdo sempre atualizado para acompanhar as mudanças do jogo.",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
  },
];

// Stats são definidas dinamicamente abaixo

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { data: favoriteTeams } = trpc.teams.favorites.useQuery(undefined, { enabled: isAuthenticated });
  const { data: topPlayers } = trpc.players.list.useQuery({ limit: 4, sortBy: "overall" });
  const { data: playerCount } = trpc.players.count.useQuery();
  const totalPlayers = playerCount ?? 657;

  const stats = [
    { label: "Jogadores Analisados", value: `${totalPlayers}+` },
    { label: "Modos de Jogo", value: "4" },
    { label: "Membros", value: "Crescendo" },
    { label: "Atualizações", value: "Diárias" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.12]"
          style={{
            backgroundImage: "linear-gradient(oklch(0.65 0.20 145) 1px, transparent 1px), linear-gradient(90deg, oklch(0.65 0.20 145) 1px, transparent 1px)",
            backgroundSize: "60px 60px"
          }} />

        <div className="container relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8">
              <Zap className="h-3.5 w-3.5" />
              A comunidade FIFA mais completa do Brasil
            </div>

            {/* Logo + Title */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <img src={LOGO_URL} alt="FUTNERDS" className="h-14 w-14 sm:h-20 sm:w-20 object-contain" />
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight"
                style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                FUT<span className="text-primary">NERDS</span>
              </h1>
            </div>

            <p className="text-base sm:text-xl md:text-2xl text-muted-foreground mb-4 font-light">
              Análises e estratégias para
            </p>
            <p className="text-base sm:text-xl md:text-2xl font-semibold text-foreground mb-10">
              elevar seu jogo ao próximo nível
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {isAuthenticated ? (
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-12 text-base font-semibold" asChild>
                  <Link href="/jogadores">
                    Ver Jogadores <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-12 text-base font-semibold" asChild>
                  <a href={getLoginUrl()}>
                    Entrar na Comunidade <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                </Button>
              )}

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
            <h2 className="text-3xl sm:text-4xl font-black mb-3">Tudo que você precisa</h2>
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

      {/* Times Favoritos */}
      {isAuthenticated && favoriteTeams && favoriteTeams.length > 0 && (
        <section className="py-16">
          <div className="container">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black mb-1 flex items-center gap-2">
                  <Heart className="h-6 w-6 text-red-500 fill-red-500" />
                  Meus Times
                </h2>
                <p className="text-muted-foreground text-sm">Seus times favoritos com acesso rápido</p>
              </div>
              <Button variant="outline" asChild className="self-start sm:self-auto">
                <Link href="/times">Ver todos <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {favoriteTeams.map((team: any) => (
                <Link key={team.teamId} href={`/times/${team.teamId}`}>
                  <div className="fut-card fut-card-hover p-4 text-center cursor-pointer group">
                    <div className="w-14 h-14 mx-auto mb-3 flex items-center justify-center">
                      {team.teamLogoUrl ? (
                        <img src={team.teamLogoUrl} alt={team.teamName} className="w-full h-full object-contain" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-lg font-black text-primary">{team.teamName?.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-bold truncate group-hover:text-primary transition-colors">{team.teamName}</p>
                    {team.leagueName && (
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">{team.leagueName}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Top Players Preview */}
      {topPlayers && topPlayers.length > 0 && (
        <section className="py-20" style={{ background: "oklch(0.12 0.01 240)" }}>
          <div className="container">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black mb-1">Top Jogadores</h2>
              <p className="text-muted-foreground text-sm sm:text-base">Os overais mais altos do modo Carreira até 23 anos</p>
            </div>
            <Button variant="outline" asChild className="self-start sm:self-auto">
              <Link href="/jogadores">Ver todos <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {topPlayers.map((player: any) => (
                <div key={player.id} className="fut-card fut-card-hover p-5 text-center">
                  {/* Foto do jogador */}
                  <div className="relative w-20 h-20 mx-auto mb-3">
                    {player.imageUrl ? (
                      <img
                        src={player.imageUrl}
                        alt={player.name}
                        className="w-full h-full object-cover rounded-full border-2 border-primary/40"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }}
                      />
                    ) : null}
                    <div className={`${player.imageUrl ? 'hidden' : ''} absolute inset-0 flex items-center justify-center rounded-full bg-primary/20 border-2 border-primary/40`}>
                      <span className="text-xl font-black text-primary" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{player.overall}</span>
                    </div>
                    {/* Badge OVR sobre a foto */}
                    {player.imageUrl && (
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center border-2 border-background">
                        <span className="text-[10px] font-black text-primary-foreground">{player.overall}</span>
                      </div>
                    )}
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
          <div className="absolute inset-0 opacity-50"
            style={{ background: "radial-gradient(ellipse at center, oklch(0.25 0.08 145), transparent 70%)" }} />
          <div className="container relative text-center">
            <div className="max-w-2xl mx-auto">
              <img src={LOGO_URL} alt="FUTNERDS" className="h-16 w-16 mx-auto mb-6 object-contain" />
              <h2 className="text-3xl sm:text-4xl font-black mb-4">Pronto para entrar no jogo?</h2>
              <p className="text-muted-foreground text-lg mb-8">
                Junte-se à comunidade FUTNERDS e tenha acesso a análises detalhadas, jogadores favoritos e muito mais.
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
