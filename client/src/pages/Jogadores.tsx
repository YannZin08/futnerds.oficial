import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Users, Search, SlidersHorizontal, Star, TrendingUp, Zap, Target, Shield, Dumbbell, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, X, Filter } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  ST: "ATA", CF: "ATA", RF: "ATA", LF: "ATA",
  LW: "PNT", RW: "PNT",
  CAM: "MEI", CM: "MEI", CDM: "VOL",
  LB: "LD", RB: "LD", LWB: "LE", RWB: "LD",
  CB: "ZAG",
  GK: "GOL",
  ATA: "ATA", PNT: "PNT", MEI: "MEI", VOL: "VOL",
  LD: "LD", LE: "LE", MD: "MD", ME: "ME",
  PD: "PD", PE: "PE",
  ZAG: "ZAG", GOL: "GOL",
  MC: "MC", MCD: "VOL",
};

// Mapeamento de posição real para grupo de filtro
const positionGroupMap: Record<string, string> = {
  ST: "ST", CF: "ST", RF: "ST", LF: "ST",
  LW: "LW", RW: "LW",
  CAM: "CM", CM: "CM", CDM: "CM",
  LB: "LB", RB: "LB", LWB: "LB", RWB: "LB",
  CB: "CB",
  GK: "GK",
  ATA: "ST",
  PNT: "LW", PE: "LW", PD: "LW",
  MEI: "CM", VOL: "CM", MC: "CM", MCD: "CM", MD: "CM", ME: "CM",
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

function getCardGradient(overall: number): { gradient: string; isDiamond: boolean } {
  if (overall >= 90) return { gradient: "from-cyan-400 via-blue-300 to-purple-400", isDiamond: true };
  if (overall >= 80) return { gradient: "from-yellow-600 to-yellow-400", isDiamond: false };
  if (overall >= 70) return { gradient: "from-gray-500 to-gray-300", isDiamond: false };
  return { gradient: "from-orange-800 to-orange-500", isDiamond: false };
}

function PlayerCard({ player, onFavorite, isFav }: { player: any; onFavorite?: () => void; isFav?: boolean }) {
  const { gradient: gradientClass, isDiamond } = getCardGradient(Number(player.overall));
  const [, setLocation] = useLocation();

  const getAltPositions = () => {
    try {
      if (!player.altPositions) return [];
      let alts: string[] = player.altPositions.startsWith('[')
        ? JSON.parse(player.altPositions)
        : player.altPositions.split(',').map((s: string) => s.trim()).filter(Boolean);
      // Deduplica e remove a posição principal
      const seen = new Set<string>();
      return alts.filter((p: string) => {
        if (p === player.position || seen.has(p)) return false;
        seen.add(p);
        return true;
      });
    } catch { return []; }
  };
  const altPositions = getAltPositions();

  return (
    <div className="fut-card fut-card-hover overflow-hidden">
      {/* Card Header */}
      <div className={`bg-gradient-to-br ${gradientClass} p-3 sm:p-4 relative${isDiamond ? ' shadow-[0_0_18px_2px_rgba(139,92,246,0.45)]' : ''}`}>
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
        <div className="flex items-end gap-2 sm:gap-3">
          <div className="w-10 h-10 sm:w-14 sm:h-14 flex-shrink-0 rounded-full bg-black/20 flex items-center justify-center overflow-hidden">
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
          <div className="min-w-0 flex-1 pr-10 sm:pr-14">
            <h3 className={`font-black text-sm sm:text-base leading-tight truncate ${isDiamond ? 'text-white drop-shadow-[0_1px_4px_rgba(139,92,246,0.8)]' : 'text-white'}`}>{player.name}</h3>
            <p className="text-white/70 text-xs truncate">
              {player.nationality}{player.age ? ` · ${player.age} anos` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {player.clubLogoUrl ? (
              <button
                onClick={() => {
                  if (player.teamId) setLocation(`/times/${player.teamId}`);
                }}
                className={`w-6 h-6 flex-shrink-0 rounded bg-white/5 flex items-center justify-center overflow-hidden transition-transform ${
                  player.teamId ? 'hover:scale-110 cursor-pointer' : 'cursor-default'
                }`}
                title={player.teamId ? `Ver ${player.club}` : player.club}
              >
                <img
                  src={player.clubLogoUrl}
                  alt={player.club}
                  className="w-full h-full object-contain"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              </button>
            ) : null}
            <span className="text-muted-foreground truncate">{player.club}</span>
          </div>
          <span className="text-muted-foreground flex-shrink-0">{player.league}</span>
        </div>

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
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {getPageNumbers().map((page, idx) =>
        page === "..." ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">…</span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
              currentPage === page
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {page}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// Componente de slider com label de range
function RangeSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: [number, number];
  min: number;
  max: number;
  step?: number;
  onChange: (v: [number, number]) => void;
  format?: (v: number) => string;
}) {
  const fmt = format ?? ((v: number) => String(v));
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <span className="text-xs text-muted-foreground tabular-nums">
          {fmt(value[0])} – {fmt(value[1])}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step ?? 1}
        value={value}
        onValueChange={(v) => onChange(v as [number, number])}
        className="w-full"
      />
    </div>
  );
}

export default function Jogadores() {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<
    "overall_desc" | "overall_asc" | "potential_desc" | "potential_asc" |
    "price_desc" | "price_asc" | "age_asc" | "age_desc" | "name_asc" | "name_desc"
  >("overall_desc");
  const [filterLeague, setFilterLeague] = useState("");
  const [filterNationality, setFilterNationality] = useState("");

  // Filtros de range — null = não alterado pelo usuário (sem filtro)
  const [ageRange, setAgeRange] = useState<[number, number] | null>(null);
  const [overallRange, setOverallRange] = useState<[number, number] | null>(null);
  const [potentialRange, setPotentialRange] = useState<[number, number] | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);

  // Toggles especiais
  const [onlyPromessas, setOnlyPromessas] = useState(false);
  const [onlyVeteranos, setOnlyVeteranos] = useState(false);
  const [onlyLivres, setOnlyLivres] = useState(false);

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

  const playerMatchesPositionGroup = (p: any, group: string): boolean => {
    if (positionGroupMap[p.position] === group) return true;
    if (!p.altPositions) return false;
    const alts = typeof p.altPositions === 'string'
      ? p.altPositions.split(',').map((s: string) => s.trim()).filter(Boolean)
      : (Array.isArray(p.altPositions) ? p.altPositions : []);
    return alts.some((alt: string) => positionGroupMap[alt] === group);
  };

  // Calcula os limites reais dos dados para os sliders
  const dataRanges = useMemo(() => {
    if (!players || players.length === 0) return {
      minAge: 16, maxAge: 39,
      minOvr: 58, maxOvr: 91,
      minPot: 79, maxPot: 95,
      minPrice: 0, maxPrice: 172500000,
    };
    let minAge = 99, maxAge = 0;
    let minOvr = 99, maxOvr = 0;
    let minPot = 99, maxPot = 0;
    let minPrice = Infinity, maxPrice = 0;
    for (const p of players as any[]) {
      const age = Number(p.age ?? 0);
      const ovr = Number(p.overall ?? 0);
      const pot = Number(p.potential ?? 0);
      const price = Number(p.price ?? 0);
      if (age > 0) { minAge = Math.min(minAge, age); maxAge = Math.max(maxAge, age); }
      if (ovr > 0) { minOvr = Math.min(minOvr, ovr); maxOvr = Math.max(maxOvr, ovr); }
      if (pot > 0) { minPot = Math.min(minPot, pot); maxPot = Math.max(maxPot, pot); }
      if (price > 0) { minPrice = Math.min(minPrice, price); maxPrice = Math.max(maxPrice, price); }
    }
    return {
      minAge: minAge === 99 ? 16 : minAge,
      maxAge: maxAge === 0 ? 39 : maxAge,
      minOvr: minOvr === 99 ? 58 : minOvr,
      maxOvr: maxOvr === 0 ? 91 : maxOvr,
      minPot: minPot === 99 ? 79 : minPot,
      maxPot: maxPot === 0 ? 95 : maxPot,
      minPrice: minPrice === Infinity ? 0 : minPrice,
      maxPrice: maxPrice === 0 ? 172500000 : maxPrice,
    };
  }, [players]);

  // Listas únicas para filtros de dropdown
  const allLeagues = useMemo(() => {
    if (!players) return [];
    const set = new Set<string>();
    (players as any[]).forEach((p) => { if (p.league) set.add(p.league); });
    return Array.from(set).sort();
  }, [players]);

  const allNationalities = useMemo(() => {
    if (!players) return [];
    const set = new Set<string>();
    (players as any[]).forEach((p) => { if (p.nationality) set.add(p.nationality); });
    return Array.from(set).sort();
  }, [players]);

  const filteredPlayers = useMemo(() => {
    if (!players) return [];
    let result = players as any[];

    if (selectedPosition) {
      result = result.filter((p) => playerMatchesPositionGroup(p, selectedPosition));
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.club.toLowerCase().includes(q) ||
        p.nationality.toLowerCase().includes(q)
      );
    }
    if (filterLeague) {
      result = result.filter((p) => p.league === filterLeague);
    }
    if (filterNationality) {
      result = result.filter((p) => p.nationality === filterNationality);
    }

    // Filtros de range (só aplica se diferente do padrão)
    if (ageRange) {
      const [ageMin, ageMax] = ageRange;
      result = result.filter((p) => { const v = Number(p.age ?? 0); return v >= ageMin && v <= ageMax; });
    }
    if (overallRange) {
      const [ovrMin, ovrMax] = overallRange;
      result = result.filter((p) => { const v = Number(p.overall ?? 0); return v >= ovrMin && v <= ovrMax; });
    }
    if (potentialRange) {
      const [potMin, potMax] = potentialRange;
      result = result.filter((p) => { const v = Number(p.potential ?? 0); return v >= potMin && v <= potMax; });
    }
    if (priceRange) {
      const [priceMin, priceMax] = priceRange;
      result = result.filter((p) => { const v = Number(p.price ?? 0); return v >= priceMin && v <= priceMax; });
    }

    // Toggles especiais
    if (onlyPromessas) result = result.filter((p) => Number(p.age) <= 21);
    if (onlyVeteranos) result = result.filter((p) => Number(p.age) >= 30);
    if (onlyLivres) result = result.filter((p) => !p.club || p.club.trim() === '');

    // Ordenação
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "overall_desc":   return (b.overall ?? 0) - (a.overall ?? 0);
        case "overall_asc":    return (a.overall ?? 0) - (b.overall ?? 0);
        case "potential_desc": return (b.potential ?? 0) - (a.potential ?? 0);
        case "potential_asc":  return (a.potential ?? 0) - (b.potential ?? 0);
        case "price_desc":     return (b.price ?? 0) - (a.price ?? 0);
        case "price_asc":      return (a.price ?? 0) - (b.price ?? 0);
        case "age_asc":        return (a.age ?? 0) - (b.age ?? 0);
        case "age_desc":       return (b.age ?? 0) - (a.age ?? 0);
        case "name_asc":       return (a.name ?? '').localeCompare(b.name ?? '');
        case "name_desc":      return (b.name ?? '').localeCompare(a.name ?? '');
        default:               return 0;
      }
    });
    return result;
  }, [players, searchQuery, selectedPosition, sortBy, filterLeague, filterNationality,
      ageRange, overallRange, potentialRange, priceRange,
      onlyPromessas, onlyVeteranos, onlyLivres]);

  const totalPages = Math.ceil(filteredPlayers.length / PLAYERS_PER_PAGE);

  const paginatedPlayers = useMemo(() => {
    const start = (currentPage - 1) * PLAYERS_PER_PAGE;
    return filteredPlayers.slice(start, start + PLAYERS_PER_PAGE);
  }, [filteredPlayers, currentPage]);

  const handlePositionChange = (pos: string) => {
    setSelectedPosition(pos);
    setCurrentPage(1);
  };

  const handleSortToggle = (field: "overall" | "potential" | "price" | "age" | "name") => {
    const descKey = `${field}_desc` as typeof sortBy;
    const ascKey  = `${field}_asc`  as typeof sortBy;
    setSortBy(sortBy === descKey ? ascKey : descKey);
    setCurrentPage(1);
  };

  // Conta filtros ativos
  const activeFiltersCount = [
    filterLeague,
    filterNationality,
    ageRange ? 'age' : '',
    overallRange ? 'ovr' : '',
    potentialRange ? 'pot' : '',
    priceRange ? 'price' : '',
    onlyPromessas ? 'promessa' : '',
    onlyVeteranos ? 'veterano' : '',
    onlyLivres ? 'livre' : '',
  ].filter(Boolean).length;

  const clearAdvancedFilters = () => {
    setFilterLeague("");
    setFilterNationality("");
    setAgeRange(null);
    setOverallRange(null);
    setPotentialRange(null);
    setPriceRange(null);
    setOnlyPromessas(false);
    setOnlyVeteranos(false);
    setOnlyLivres(false);
    setCurrentPage(1);
  };

  const formatPrice = (v: number) => {
    if (v >= 1000000) return `€${(v / 1000000).toFixed(0)}M`;
    if (v >= 1000) return `€${(v / 1000).toFixed(0)}K`;
    return `€${v}`;
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

      {/* ── Header Fixo ── */}
      <div className="border-b border-border bg-card fixed top-16 left-0 right-0 z-40">
        <div className="container py-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary shrink-0" />
            <h1 className="text-base sm:text-xl font-bold text-foreground truncate">Análise de Jogadores</h1>
            <p className="hidden sm:block text-xs text-muted-foreground ml-1">— Estatísticas para seu modo carreira</p>
          </div>
        </div>
      </div>

      <main className="flex-1 relative z-10">
        <div className="container pt-32 sm:pt-36 pb-8">
          {/* Filters */}
          <div className="flex flex-col gap-4 mb-8">
            {/* Linha 1: busca + botão filtros */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar jogador, clube ou nacionalidade..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 bg-secondary border-border"
                />
              </div>
              {/* Botão Filtros Avançados */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2 shrink-0 relative">
                    <Filter className="h-4 w-4" />
                    Filtros
                    {activeFiltersCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <Filter className="h-5 w-5 text-primary" />
                      Filtros Avançados
                    </SheetTitle>
                  </SheetHeader>

                  <div className="mt-6 flex flex-col gap-6 pb-6">

                    {/* ── Liga ── */}
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-foreground">Liga</label>
                      <Select value={filterLeague} onValueChange={(v) => { setFilterLeague(v === "__all__" ? "" : v); setCurrentPage(1); }}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Todas as ligas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Todas as ligas</SelectItem>
                          {allLeagues.map((l) => (
                            <SelectItem key={l} value={l}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* ── Nacionalidade ── */}
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-foreground">Nacionalidade</label>
                      <Select value={filterNationality} onValueChange={(v) => { setFilterNationality(v === "__all__" ? "" : v); setCurrentPage(1); }}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Todos os países" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Todos os países</SelectItem>
                          {allNationalities.map((n) => (
                            <SelectItem key={n} value={n}>{n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* ── Separador ── */}
                    <div className="border-t border-border/50" />

                    {/* ── Sliders de Range ── */}
                    {!isLoading && (
                      <>
                        <RangeSlider
                          label="Idade"
                          value={ageRange ?? [dataRanges.minAge, dataRanges.maxAge]}
                          min={dataRanges.minAge}
                          max={dataRanges.maxAge}
                          onChange={(v) => { setAgeRange(v); setCurrentPage(1); }}
                        />
                        <RangeSlider
                          label="Overall"
                          value={overallRange ?? [dataRanges.minOvr, dataRanges.maxOvr]}
                          min={dataRanges.minOvr}
                          max={dataRanges.maxOvr}
                          onChange={(v) => { setOverallRange(v); setCurrentPage(1); }}
                        />
                        <RangeSlider
                          label="Potencial"
                          value={potentialRange ?? [dataRanges.minPot, dataRanges.maxPot]}
                          min={dataRanges.minPot}
                          max={dataRanges.maxPot}
                          onChange={(v) => { setPotentialRange(v); setCurrentPage(1); }}
                        />
                        <RangeSlider
                          label="Valor de Mercado"
                          value={priceRange ?? [dataRanges.minPrice, dataRanges.maxPrice]}
                          min={dataRanges.minPrice}
                          max={dataRanges.maxPrice}
                          step={500000}
                          onChange={(v) => { setPriceRange(v); setCurrentPage(1); }}
                          format={formatPrice}
                        />
                      </>
                    )}

                    {/* ── Separador ── */}
                    <div className="border-t border-border/50" />

                    {/* ── Toggles Especiais ── */}
                    <div className="flex flex-col gap-4">
                      <p className="text-sm font-semibold text-foreground">Categorias</p>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="toggle-promessas" className="text-sm font-medium cursor-pointer">
                            🌟 Promessas
                          </Label>
                          <p className="text-xs text-muted-foreground">Jogadores com até 21 anos</p>
                        </div>
                        <Switch
                          id="toggle-promessas"
                          checked={onlyPromessas}
                          onCheckedChange={(v) => { setOnlyPromessas(v); if (v) setOnlyVeteranos(false); setCurrentPage(1); }}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="toggle-veteranos" className="text-sm font-medium cursor-pointer">
                            🏆 Veteranos
                          </Label>
                          <p className="text-xs text-muted-foreground">Jogadores com 30 anos ou mais</p>
                        </div>
                        <Switch
                          id="toggle-veteranos"
                          checked={onlyVeteranos}
                          onCheckedChange={(v) => { setOnlyVeteranos(v); if (v) setOnlyPromessas(false); setCurrentPage(1); }}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="toggle-livres" className="text-sm font-medium cursor-pointer">
                            🆓 Jogadores Livres
                          </Label>
                          <p className="text-xs text-muted-foreground">Sem clube (free agents)</p>
                        </div>
                        <Switch
                          id="toggle-livres"
                          checked={onlyLivres}
                          onCheckedChange={(v) => { setOnlyLivres(v); setCurrentPage(1); }}
                        />
                      </div>
                    </div>

                    {/* ── Limpar filtros ── */}
                    {activeFiltersCount > 0 && (
                      <Button variant="outline" onClick={clearAdvancedFilters} className="gap-2 mt-2 border-destructive/50 text-destructive hover:bg-destructive/10">
                        <X className="h-4 w-4" />
                        Limpar todos os filtros ({activeFiltersCount})
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Linha 2: posições */}
            <div className="flex gap-1.5 flex-wrap">
              {positions.map((pos) => (
                <button
                  key={pos}
                  onClick={() => handlePositionChange(pos)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    selectedPosition === pos
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {positionLabels[pos]}
                </button>
              ))}
            </div>

            {/* Linha 3: botões de ordenação toggle */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-xs text-muted-foreground font-medium">Ordenar:</span>
              {([
                { field: "overall"   as const, label: "Overall"   },
                { field: "potential" as const, label: "Potencial"  },
                { field: "price"     as const, label: "Valor"      },
                { field: "age"       as const, label: "Idade"      },
                { field: "name"      as const, label: "Nome A–Z"   },
              ]).map(({ field, label }) => {
                const isActive = sortBy === `${field}_desc` || sortBy === `${field}_asc`;
                const isDesc   = sortBy === `${field}_desc`;
                const Icon     = !isActive ? ArrowUpDown : isDesc ? ArrowDown : ArrowUp;
                return (
                  <button
                    key={field}
                    onClick={() => handleSortToggle(field)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/30"
                        : "bg-secondary text-muted-foreground border-border hover:text-foreground hover:border-primary/40"
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Tags de filtros ativos */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-muted-foreground">Filtros ativos:</span>
                {filterLeague && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                    {filterLeague}
                    <button onClick={() => { setFilterLeague(""); setCurrentPage(1); }}><X className="h-3 w-3" /></button>
                  </span>
                )}
                {filterNationality && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                    {filterNationality}
                    <button onClick={() => { setFilterNationality(""); setCurrentPage(1); }}><X className="h-3 w-3" /></button>
                  </span>
                )}
                {onlyPromessas && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium">
                    🌟 Promessas
                    <button onClick={() => { setOnlyPromessas(false); setCurrentPage(1); }}><X className="h-3 w-3" /></button>
                  </span>
                )}
                {onlyVeteranos && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium">
                    🏆 Veteranos
                    <button onClick={() => { setOnlyVeteranos(false); setCurrentPage(1); }}><X className="h-3 w-3" /></button>
                  </span>
                )}
                {onlyLivres && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">
                    🆓 Livres
                    <button onClick={() => { setOnlyLivres(false); setCurrentPage(1); }}><X className="h-3 w-3" /></button>
                  </span>
                )}
                {ageRange && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-xs font-medium">
                    Idade: {ageRange[0]}–{ageRange[1]}
                    <button onClick={() => { setAgeRange(null); setCurrentPage(1); }}><X className="h-3 w-3" /></button>
                  </span>
                )}
                {overallRange && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-xs font-medium">
                    OVR: {overallRange[0]}–{overallRange[1]}
                    <button onClick={() => { setOverallRange(null); setCurrentPage(1); }}><X className="h-3 w-3" /></button>
                  </span>
                )}
                {potentialRange && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-xs font-medium">
                    POT: {potentialRange[0]}–{potentialRange[1]}
                    <button onClick={() => { setPotentialRange(null); setCurrentPage(1); }}><X className="h-3 w-3" /></button>
                  </span>
                )}
                {priceRange && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-xs font-medium">
                    Valor: {formatPrice(priceRange[0])}–{formatPrice(priceRange[1])}
                    <button onClick={() => { setPriceRange(null); setCurrentPage(1); }}><X className="h-3 w-3" /></button>
                  </span>
                )}
              </div>
            )}
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
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
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
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
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
              {activeFiltersCount > 0 && (
                <Button variant="outline" onClick={clearAdvancedFilters} className="mt-4 gap-2">
                  <X className="h-4 w-4" />
                  Limpar filtros
                </Button>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
