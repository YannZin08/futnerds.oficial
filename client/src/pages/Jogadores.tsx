import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Search, SlidersHorizontal, Star, TrendingUp, Zap, Target, Shield, Dumbbell } from "lucide-react";
import { toast } from "sonner";

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

// Mapeamento de posição real para grupo de filtro
const positionGroupMap: Record<string, string> = {
  ST: "ST", CF: "ST", RF: "ST", LF: "ST",
  LW: "LW", RW: "LW",
  CAM: "CM", CM: "CM", CDM: "CM",
  LB: "LB", RB: "LB", LWB: "LB", RWB: "LB",
  CB: "CB",
  GK: "GK",
};

const statIcons: Record<string, any> = {
  pace: Zap, shooting: Target, passing: TrendingUp,
  dribbling: Star, defending: Shield, physical: Dumbbell,
};

const statLabels: Record<string, string> = {
  pace: "Velocidade", shooting: "Finalização", passing: "Passe",
  dribbling: "Drible", defending: "Defesa", physical: "Físico",
};

const cardTypeColors: Record<string, string> = {
  gold: "from-yellow-600 to-yellow-400",
  silver: "from-gray-500 to-gray-300",
  bronze: "from-orange-800 to-orange-500",
  toty: "from-blue-900 to-blue-600",
  tots: "from-purple-800 to-purple-500",
  icon: "from-gray-800 to-gray-600",
  hero: "from-red-800 to-red-500",
  special: "from-purple-600 to-pink-500",
};

function StatBar({ value, label, icon: Icon }: { value: number; label: string; icon: any }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
      <span className="text-xs text-muted-foreground w-16 shrink-0">{label}</span>
      <div className="fut-stat-bar flex-1">
        <div className="fut-stat-fill" style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-bold text-foreground w-6 text-right">{value}</span>
    </div>
  );
}

function PlayerCard({ player, onFavorite, isFav }: { player: any; onFavorite?: () => void; isFav?: boolean }) {
  const gradientClass = cardTypeColors[player.cardType] || cardTypeColors.gold;

  return (
    <div className="fut-card fut-card-hover overflow-hidden">
      {/* Card Header */}
      <div className={`bg-gradient-to-br ${gradientClass} p-4 relative`}>
        <div className="absolute top-2 right-2 flex flex-col items-center">
          <span className="text-2xl font-black text-white drop-shadow"
            style={{ fontFamily: "'Rajdhani', sans-serif" }}>
            {player.overall}
          </span>
          <span className="text-xs font-bold text-white/80">{player.position}</span>
        </div>
        <div className="flex items-end gap-3">
          <div className="w-14 h-14 rounded-full bg-black/20 flex items-center justify-center">
            <Users className="h-7 w-7 text-white/60" />
          </div>
          <div>
            <h3 className="font-black text-white text-base leading-tight">{player.name}</h3>
            <p className="text-white/70 text-xs">
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
            <span className="text-xs text-muted-foreground">Preço FUT</span>
            <p className="text-sm font-bold text-primary">
              {player.price ? `${(player.price / 1000).toFixed(0)}K` : "—"}
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

export default function Jogadores() {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("");
  const [sortBy, setSortBy] = useState<"overall" | "price">("overall");
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);

  const { data: players, isLoading } = trpc.players.list.useQuery({
    limit: 50,
    sortBy,
  });

  const { data: favorites, refetch: refetchFavorites } = trpc.players.favorites.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const addFav = trpc.players.addFavorite.useMutation({ onSuccess: () => refetchFavorites() });
  const removeFav = trpc.players.removeFavorite.useMutation({ onSuccess: () => refetchFavorites() });

  const favoriteIds = useMemo(() => new Set((favorites ?? []).map((f: any) => f.playerId)), [favorites]);

  const filteredPlayers = useMemo(() => {
    if (!players) return [];
    let result = players;
    if (selectedPosition) {
      result = result.filter((p: any) => positionGroupMap[p.position] === selectedPosition);
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
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-20">
        {/* Header */}
        <section className="py-12 border-b border-border/50" style={{ background: "oklch(0.12 0.01 240)" }}>
          <div className="container">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-black">Análise de Jogadores</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Estatísticas detalhadas dos melhores jogadores do Ultimate Team
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
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary border-border"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {positions.map((pos) => (
                <button
                  key={pos}
                  onClick={() => setSelectedPosition(pos)}
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
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy("overall")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  sortBy === "overall" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                Overall
              </button>
              <button
                onClick={() => setSortBy("price")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  sortBy === "price" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                Preço
              </button>
            </div>
          </div>

          {/* Results count */}
          <div className="flex items-center gap-2 mb-6">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {filteredPlayers.length} jogadores encontrados
            </span>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPlayers.map((player: any) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  onFavorite={() => handleFavorite(player)}
                  isFav={favoriteIds.has(player.id)}
                />
              ))}
            </div>
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
