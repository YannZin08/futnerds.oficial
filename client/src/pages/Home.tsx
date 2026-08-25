import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  BarChart3,
  Brain,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  Globe2,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663216916845/hhB4oykfDQM9yCvhQGaX3n/logo-futnerds_8f14a724.png";
const HERO_IMAGE = "/manus-storage/hero-stadium_6d45b6d5.jpeg";
const FIELD_IMAGE = "/manus-storage/field-night_4d5efd24.jpg";
const TACTICS_IMAGE = "/manus-storage/tactics_946d4bf7.jpg";
const WORLD_IMAGE = "/manus-storage/world-map_52843b5b.png";

const exploreCards = [
  {
    title: "JOGADORES",
    description: "Busque, filtre e descubra os melhores talentos.",
    image: FIELD_IMAGE,
    icon: Users,
    href: "/jogadores",
  },
  {
    title: "TIMES",
    description: "Dados completos de clubes do mundo todo.",
    image: HERO_IMAGE,
    icon: ShieldCheck,
    href: "/times",
  },
  {
    title: "SCOUTING",
    description: "Encontre jovens promessas e boas oportunidades.",
    image: TACTICS_IMAGE,
    icon: Search,
    disabled: true,
  },
  {
    title: "MODO CARREIRA",
    description: "Comece sua próxima história e conquiste tudo.",
    image: FIELD_IMAGE,
    icon: Trophy,
    disabled: true,
  },
];

const challenges = [
  {
    title: "RECONSTRUÇÃO",
    description: "Pegue um gigante em crise e devolva a glória.",
    image: HERO_IMAGE,
    icon: ShieldCheck,
    difficulty: 4,
  },
  {
    title: "ROAD TO GLORY",
    description: "Comece pequeno e leve seu time ao topo do mundo.",
    image: FIELD_IMAGE,
    icon: BarChart3,
    difficulty: 4,
  },
  {
    title: "JOVENS TALENTOS",
    description: "Monte um elenco promissor e domine o futuro.",
    image: TACTICS_IMAGE,
    icon: Brain,
    difficulty: 4,
  },
  {
    title: "DESAFIO",
    description: "Regras especiais para uma carreira ainda mais épica.",
    image: HERO_IMAGE,
    icon: Trophy,
    difficulty: 4,
  },
];

function DisabledAction({ children }: { children: React.ReactNode }) {
  return (
    <button type="button" disabled className="home-v2-disabled-action" aria-disabled="true">
      {children}
    </button>
  );
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { data: playerCount } = trpc.players.count.useQuery();
  const totalPlayers = playerCount ?? 657;
  const formattedPlayers = totalPlayers.toLocaleString("pt-BR");

  return (
    <div className="home-v2-root min-h-screen flex flex-col">
      <Navbar />

      <main>
        <section className="home-v2-hero">
          <div className="home-v2-hero-image" style={{ backgroundImage: `url(${HERO_IMAGE})` }} />
          <div className="home-v2-hero-overlay" />
          <div className="home-v2-hero-grid" />

          <div className="container home-v2-hero-inner">
            <div className="home-v2-rating-panel" aria-label="Exemplo de avaliação de jogador">
              <span className="home-v2-panel-kicker">WORLD CLASS</span>
              <span className="home-v2-panel-label">OVR</span>
              <strong>87</strong>
              <span className="home-v2-panel-label">POT</span>
              <strong className="home-v2-green-number">93</strong>
              <div className="home-v2-rating-bars" aria-hidden="true">
                {["h-2", "h-3", "h-4", "h-3", "h-5", "h-6"].map((height, index) => (
                  <span key={index} className={height} />
                ))}
              </div>
            </div>

            <div className="home-v2-hero-content">
              <div className="home-v2-badge"><Zap className="h-3.5 w-3.5" /> A comunidade FIFA mais completa do Brasil</div>
              <div className="home-v2-brand-lockup">
                <img src={LOGO_URL} alt="" />
                <h1>FUT<span>NERDS</span></h1>
              </div>
              <p className="home-v2-hero-kicker">O universo do Modo Carreira</p>
              <p className="home-v2-hero-copy">
                Dados, análises e estratégias para<br />
                <strong>elevar seu jogo ao <span>próximo nível.</span></strong>
              </p>
              <div className="home-v2-hero-actions">
                <Button size="lg" className="home-v2-primary-button" asChild>
                  <Link href="/jogadores">Explorar Jogadores <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button size="lg" variant="outline" className="home-v2-outline-button" asChild>
                  <Link href="/times">Explorar Times <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
            </div>

            <div className="home-v2-market-panel" aria-label="Painel decorativo de valor de transferência">
              <div className="home-v2-market-heading"><span>TRANSFER VALUE</span><span>↗</span></div>
              <strong>€86.5M</strong>
              <svg viewBox="0 0 190 62" preserveAspectRatio="none" aria-hidden="true">
                <polyline points="0,53 20,44 37,48 54,32 70,39 89,23 106,31 122,17 140,26 158,8 190,15" fill="none" stroke="#21d45b" strokeWidth="2" />
                <polyline points="0,62 20,53 37,57 54,41 70,48 89,32 106,40 122,26 140,35 158,17 190,24 190,62" fill="rgba(33,212,91,.14)" stroke="none" />
              </svg>
              <div className="home-v2-market-footer"><span>MARKET UPDATE</span><span>24.05.2024</span></div>
            </div>
          </div>
        </section>

        <section className="home-v2-metrics-wrap">
          <div className="container">
            <div className="home-v2-metrics">
              <div className="home-v2-metric"><Users /><div><strong>{formattedPlayers}+</strong><span>JOGADORES ANALISADOS</span></div></div>
              <div className="home-v2-metric"><ShieldCheck /><div><strong>734+</strong><span>TIMES</span></div></div>
              <div className="home-v2-metric"><Gamepad2 /><div><strong>4</strong><span>MODOS DE JOGO</span></div></div>
              <div className="home-v2-metric"><BarChart3 /><div><strong>CRESCENDO</strong><span>MEMBROS ATIVOS</span></div></div>
            </div>
          </div>
        </section>

        <section className="home-v2-explore-section">
          <div className="container">
            <div className="home-v2-section-heading">
              <h2>EXPLORE O UNIVERSO DO <span>FUTNERDS</span></h2>
              <p>Tudo que você precisa para dominar o Modo Carreira</p>
            </div>
            <div className="home-v2-explore-track">
              <button type="button" className="home-v2-carousel-arrow left" aria-label="Anterior"><ChevronLeft className="h-5 w-5" /></button>
              <div className="home-v2-explore-grid">
                {exploreCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <article key={card.title} className="home-v2-explore-card" style={{ backgroundImage: `url(${card.image})` }}>
                      <div className="home-v2-card-overlay" />
                      <div className="home-v2-explore-card-content">
                        <div className="home-v2-round-icon"><Icon className="h-4 w-4" /></div>
                        <div className="flex-1" />
                        <h3>{card.title}</h3>
                        <p>{card.description}</p>
                        {card.disabled ? <DisabledAction>Explorar <ArrowRight className="ml-1 h-3.5 w-3.5" /></DisabledAction> : <Link className="home-v2-card-link" href={card.href ?? "#"}>Explorar <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>}
                      </div>
                    </article>
                  );
                })}
              </div>
              <button type="button" className="home-v2-carousel-arrow right" aria-label="Próximo"><ChevronRight className="h-5 w-5" /></button>
            </div>
          </div>
        </section>

        <section className="home-v2-world-section">
          <div className="home-v2-world-art"><img src={WORLD_IMAGE} alt="Mapa estilizado do mundo" /><div className="home-v2-world-dot" /></div>
          <div className="container home-v2-world-inner">
            <div className="home-v2-world-copy">
              <span className="home-v2-eyebrow">EXPLORAR</span>
              <h2>FUTEBOL DO <strong>MUNDO</strong></h2>
              <p>Navegue por ligas, países e times<br />e descubra oportunidades únicas.</p>
              <div className="home-v2-country-list">
                {["🇬🇧 Inglaterra", "🇪🇸 Espanha", "🇮🇹 Itália", "🇩🇪 Alemanha", "🇫🇷 França", "🇧🇷 Brasil"].map((country) => <DisabledAction key={country}>{country}</DisabledAction>)}
                <DisabledAction><Globe2 className="h-3.5 w-3.5" /> Ver todos os países <ArrowRight className="ml-1 h-3.5 w-3.5" /></DisabledAction>
              </div>
            </div>
          </div>
        </section>

        <section className="home-v2-challenges-section">
          <div className="container">
            <div className="home-v2-section-heading">
              <span className="home-v2-eyebrow">SUA PRÓXIMA HISTÓRIA</span>
              <h2>QUAL SERÁ SUA PRÓXIMA CARREIRA?</h2>
              <p>Escolha o desafio perfeito para você e escreva sua história no futebol.</p>
            </div>
            <div className="home-v2-challenge-grid">
              {challenges.map((challenge) => {
                const Icon = challenge.icon;
                return (
                  <article key={challenge.title} className="home-v2-challenge-card" style={{ backgroundImage: `url(${challenge.image})` }}>
                    <div className="home-v2-card-overlay" />
                    <div className="home-v2-challenge-content">
                      <Icon className="home-v2-challenge-icon h-7 w-7" />
                      <h3>{challenge.title}</h3>
                      <p>{challenge.description}</p>
                      <div className="home-v2-challenge-footer"><span>DESAFIO</span><span className="home-v2-stars">{"★".repeat(challenge.difficulty)}<i>★</i></span></div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="home-v2-final-cta">
          <div className="container home-v2-final-inner">
            <div className="home-v2-final-copy">
              <span className="home-v2-eyebrow">TUDO PARA VOCÊ</span>
              <h2>DOMINAR O <strong>MODO CARREIRA</strong></h2>
              <p>Dados atualizados, análises completas e uma comunidade apaixonada por FIFA e futebol.</p>
              {isAuthenticated ? (
                <Button className="home-v2-primary-button" asChild><Link href="/jogadores">Começar agora <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
              ) : (
                <Button className="home-v2-primary-button" asChild><a href={getLoginUrl()}>Começar agora <ArrowRight className="ml-2 h-4 w-4" /></a></Button>
              )}
            </div>
            <div className="home-v2-dashboard-art" aria-hidden="true">
              <div className="home-v2-dash-list"><span>PLAYERS DATABASE</span><b>J. Bellingham <i>91</i></b><b>V. Júnior <i>89</i></b><b>R. Dias <i>88</i></b></div>
              <div className="home-v2-dash-player"><small>OVERALL</small><strong>91</strong><b>J. Bellingham</b><span>Real Madrid</span></div>
              <div className="home-v2-dash-graph"><span>TRANSFER VALUE</span><strong>€86.5M</strong><svg viewBox="0 0 190 60"><polyline points="0,52 28,41 52,46 75,30 96,35 117,20 141,28 163,9 190,16" fill="none" stroke="#20d75a" strokeWidth="2" /></svg></div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
