import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Search, SlidersHorizontal, Star, TrendingUp, Zap, Target, Shield, Dumbbell, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const PLAYERS_PER_PAGE = 60;

const positions = ["", "ST", "LW", "CM", "LB", "CB", "GK"];
const positionLabels: Record<string, string> = {
  "": "Todas",
  ST: "Atacantes",
  LW: "Pontas",
  CM: "Meio-Campo",
  LB: "Laterais",
  CB: "Zagueiros",
  GK: "Goleiro",
};

// Tradução das posições para português
const positionPtMap: Record<string, string> = {
  // Posições padrão FIFA
  ST: "ATA", CF: "ATA", RF: "ATA", LF: "ATA",
  LW: "PNT", RW: "PNT",
  CAM: "MEI", CM: "MEI", CDM: "VOL",
  LB: "LD", RB: "LD", LWB: "LE", RWB: "LD",
  CB: "ZAG",
  GK: "GOL",
  // Posições já em português (banco)
  ATA: "ATA", PNT: "PNT", MEI: "MEI", VOL: "VOL",
  LD: "LD", LE: "LE", MD: "MD", ME: "ME",
  PD: "PD", PE: "PE",
  ZAG: "ZAG", GOL: "GOL",
  // Meio-campo
  MC: "MC", MCD: "VOL",
};

// Mapeamento de posição real para grupo de filtro
const positionGroupMap: Record<string, string> = {
  // Posições padrão FIFA
  ST: "ST", CF: "ST", RF: "ST", LF: "ST",
  LW: "LW", RW: "LW",
  CAM: "CM", CM: "CM", CDM: "CM",
  LB: "LB", RB: "LB", LWB: "LB", RWB: "LB",
  CB: "CB",
  GK: "GK",
  // Posições em português (usadas no banco)
  ATA: "ST",
  PNT: "LW", PE: "LW", PD: "LW",
  MEI: "CM", VOL: "CM", MC: "CM", MCD: "CM", MD: "CM", ME: "CM",
  // Laterais: LD (lateral direito), LE (lateral esquerdo)
  LD: "LB", LE: "LB",
  ZAG: "CB",
  GOL: "GK",
};

const statIcons: Record<string, any> = {
  pace: Zap, shooting: Target, passing: TrendingUp,
  dribbling: Star, defending: Shield, physical: Dumbbell,
};

const statLabels: Record<string, string> = {
  pace: "Velocidade", shooting: "Finalização", passing: "Passe",
  dribbling: "Drible", defending: "Defesa", physical: "Físico",
};

// Calcula a cor do card baseado no overall (ignora cardType do banco que pode estar errado)
function getCardGradient(overall: number): string {
  if (overall >= 75) return "from-yellow-600 to-yellow-400";       // Gold
  if (overall >= 65) return "from-gray-500 to-gray-300";           // Silver
  return "from-orange-800 to-orange-500";                          // Bronze
}

function PlayerCard({ player, onFavorite, isFav }: { player: any; onFavorite?: () => void; isFav?: boolean }) {
  const gradientClass = getCardGradient(Number(player.overall));

  // Extrai posições alternativas únicas
  const getAltPositions = () => {
    try {
      if (!player.altPositions) return [];
      let alts: string[] = player.altPositions.startsWith('[')
        ? JSON.parse(player.altPositions)
        : player.altPositions.split(',').map((s: string) => s.trim()).filter(Boolean);
      return alts.filter((p: string) => p !== player.position);
    } catch { return []; }
  };
  const altPositions = getAltPositions();
  // Tooltip com posições alternativas
  const altTooltip = altPositions.map((p: string) => positionPtMap[p] ?? p).join(' · ');

  return (
    <div className="fut-card fut-card-hover overflow-hidden">
      {/* Card Header */}
      <div className={`bg-gradient-to-br ${gradientClass} p-4 relative`}>
        {/* Canto superior direito: todas as posições lado a lado */}
        <div className="absolute top-2 right-2 flex flex-row flex-wrap justify-end gap-0.5 max-w-[55%]">
          <span className="text-xs font-bold text-white bg-black/25 px-1.5 py-0.5 rounded whitespace-nowrap">
            {positionPtMap[player.position] ?? player.position}
          </span>
          {altPositions.map((pos: string) => (
            <span key={pos} className="text-xs font-bold text-white/80 bg-black/20 px-1.5 py-0.5 rounded whitespace-nowrap">
              {positionPtMap[pos] ?? pos}
            </span>
          ))}
        </div>
        {/* Foto + nome */}
        <div className="flex items-end gap-3">
          <div className="w-14 h-14 flex-shrink-0 rounded-full bg-black/20 flex items-center justify-center overflow-hidden">
            {player.imageUrl ? (
              <img
                src={player.imageUrl}
                alt={player.name}
                className="w-full h-full object-cover object-top"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                  (e.currentTarget.parentElement as HTMLElement).innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
                }}
              />
            ) : (
              <Users className="h-7 w-7 text-white/60" />
            )}
          </div>
          <div className="min-w-0 flex-1 pr-14">
            <h3 className="font-black text-white text-base leading-tight truncate">{player.name}</h3>
            <p className="text-white/70 text-xs truncate">
              {player.nationality}{player.age ? ` · ${player.age} anos` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{player.club}</span>
          <span className="text-muted-foreground">{player.league}</span>
        </div>

        {/* Overall / Potential */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-secondary rounded-lg py-1.5">
            <p className="text-lg font-black text-primary leading-none" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{player.overall}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Overall</p>
          </div>
          <div className="bg-secondary rounded-lg py-1.5">
            <p className="text-lg font-black text-blue-400 leading-none" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{player.potential ?? '—'}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Potencial</p>
          </div>
        </div>

        {/* Price + Favorite */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div>
            <span className="text-xs text-muted-foreground">Preço</span>
            <p className="text-sm font-bold text-primary">
              {player.price ? (() => {
                if (player.price >= 1000000) {
                  const m = player.price / 1000000;
                  return `€${Number.isInteger(m) ? m : m.toFixed(1)}M`;
                } else {
                  const k = player.price / 1000;
                  return `€${Number.isInteger(k) ? k : k.toFixed(1)}K`;
                }
              })() : "—"}
            </p>
          </div>
          {onFavorite && (
            <button
              onClick={onFavorite}
              className={`p-2 rounded-lg transition-colors ${
                isFav ? "text-yellow-400 bg-yellow-400/10" : "text-muted-foreground hover:text-yellow-400 hover:bg-yellow-400/10"
              }`}
            >
              <Star className={`h-4 w-4 ${isFav ? "fill-yellow-400" : ""}`} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  // Gera os números de página a exibir (máx 7 botões)
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-1 mt-10 flex-wrap">
      {/* Anterior */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
      >
        <ChevronLeft className="h-4 w-4" />
        Anterior
      </button>

      {/* Números */}
      {getPageNumbers().map((page, idx) =>
        page === "..." ? (
          <span key={`ellipsis-${idx}`} className="px-2 py-2 text-muted-foreground text-sm select-none">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
              currentPage === page
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
            }`}
          >
            {page}
          </button>
        )
      )}

      {/* Próximo */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
      >
        Próximo
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function Jogadores() {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: players, isLoading } = trpc.players.list.useQuery({
    limit: 9999,
    sortBy: "overall",
  });

  const { data: favorites, refetch: refetchFavorites } = trpc.players.favorites.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const addFav = trpc.players.addFavorite.useMutation({ onSuccess: () => refetchFavorites() });
  const removeFav = trpc.players.removeFavorite.useMutation({ onSuccess: () => refetchFavorites() });

  const favoriteIds = useMemo(() => new Set((favorites ?? []).map((f: any) => f.playerId)), [favorites]);

  // Verifica se um jogador pertence a um grupo de posição (posição principal OU alternativas)
  const playerMatchesPositionGroup = (p: any, group: string): boolean => {
    if (positionGroupMap[p.position] === group) return true;
    if (!p.altPositions) return false;
    const alts = typeof p.altPositions === 'string'
      ? p.altPositions.split(',').map((s: string) => s.trim()).filter(Boolean)
      : (Array.isArray(p.altPositions) ? p.altPositions : []);
    return alts.some((alt: string) => positionGroupMap[alt] === group);
  };

  const filteredPlayers = useMemo(() => {
    if (!players) return [];
    let result = players;
    if (selectedPosition) {
      result = result.filter((p: any) => playerMatchesPositionGroup(p, selectedPosition));
    }
    if (searchQuery) {
      result = result.filter((p: any) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.club.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.nationality.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return result;
  }, [players, searchQuery, selectedPosition]);

  const totalPages = Math.ceil(filteredPlayers.length / PLAYERS_PER_PAGE);

  const paginatedPlayers = useMemo(() => {
    const start = (currentPage - 1) * PLAYERS_PER_PAGE;
    return filteredPlayers.slice(start, start + PLAYERS_PER_PAGE);
  }, [filteredPlayers, currentPage]);

  // Resetar para página 1 quando filtro ou busca mudar
  const handlePositionChange = (pos: string) => {
    setSelectedPosition(pos);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFavorite = (player: any) => {
    if (!isAuthenticated) {
      toast.error("Faça login para favoritar jogadores");
      return;
    }
    if (favoriteIds.has(player.id)) {
      removeFav.mutate({ playerId: player.id });
      toast.success("Removido dos favoritos");
    } else {
      addFav.mutate({ playerId: player.id });
      toast.success("Adicionado aos favoritos!");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      {/* Grid quadriculado de fundo */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(34,197,94,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.12) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      <Navbar />
      <main className="flex-1 pt-20 relative z-10">
        {/* Header */}
        <section className="py-12 border-b border-border/50" style={{ background: "oklch(0.12 0.01 240)" }}>
          <div className="container">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-black">Análise de Jogadores</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Estatísticas detalhadas de promessas para seu modo carreira.
            </p>
          </div>
        </section>

        <div className="container py-10">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar jogador, clube ou nacionalidade..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 bg-secondary border-border"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {positions.map((pos) => (
                <button
                  key={pos}
                  onClick={() => handlePositionChange(pos)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedPosition === pos
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {positionLabels[pos]}
                </button>
              ))}
            </div>
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {filteredPlayers.length} jogadores encontrados
              </span>
            </div>
            {totalPages > 1 && (
              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
            )}
          </div>

          {/* Players Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="fut-card animate-pulse">
                  <div className="h-24 bg-muted rounded-t-xl" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="space-y-1 mt-3">
                      {[...Array(6)].map((_, j) => (
                        <div key={j} className="h-3 bg-muted rounded" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPlayers.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedPlayers.map((player: any) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    onFavorite={() => handleFavorite(player)}
                    isFav={favoriteIds.has(player.id)}
                  />
                ))}
              </div>

              {/* Paginação */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
          ) : (
            <div className="text-center py-20">
              <Users className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">Nenhum jogador encontrado.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
