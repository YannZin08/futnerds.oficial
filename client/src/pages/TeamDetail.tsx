import { useParams, useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useRef, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  Users,
  Trophy,
  Wallet,
  Building2,
  Star,
  Globe,
  MapPin,
  Swords,
  Search,
  X,
  Heart,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

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

function getCardGradient(overall: number): { gradient: string; isDiamond: boolean } {
  if (overall >= 90) return { gradient: "from-cyan-400 via-blue-300 to-purple-400", isDiamond: true };
  if (overall >= 80) return { gradient: "from-yellow-600 to-yellow-400", isDiamond: false };
  if (overall >= 70) return { gradient: "from-gray-500 to-gray-300", isDiamond: false };
  return { gradient: "from-orange-800 to-orange-500", isDiamond: false };
}

// Budget formatter — banco armazena em milhões (ex: 176 = €176M, 1.7 = €1.7M)
function formatBudget(budget: number | null | undefined): string {
  if (!budget) return "—";
  if (budget >= 1000) return `€${(budget / 1000).toFixed(1)}B`;
  const rounded = parseFloat(budget.toFixed(1));
  return `€${rounded}M`;
}

function formatPrice(price: number | null | undefined): string {
  if (!price) return '—';
  if (price >= 1_000_000) {
    const m = price / 1_000_000;
    return `€${Number.isInteger(m) ? m : m.toFixed(1)}M`;
  }
  if (price >= 1_000) {
    const k = price / 1_000;
    return `€${Number.isInteger(k) ? k : k.toFixed(0)}K`;
  }
  return `€${price}`;
}

function getOvrColor(ovr: number): string {
  if (ovr >= 90) return 'text-purple-400';
  if (ovr >= 85) return 'text-yellow-400';
  if (ovr >= 80) return 'text-yellow-300';
  if (ovr >= 75) return 'text-green-400';
  if (ovr >= 70) return 'text-green-300';
  return 'text-muted-foreground';
}

function getOvrBg(ovr: number): string {
  if (ovr >= 90) return 'bg-purple-500/20 border border-purple-500/40';
  if (ovr >= 85) return 'bg-yellow-500/20 border border-yellow-500/40';
  if (ovr >= 80) return 'bg-yellow-500/10 border border-yellow-500/30';
  if (ovr >= 75) return 'bg-primary/20 border border-primary/40';
  if (ovr >= 70) return 'bg-primary/10 border border-primary/20';
  return 'bg-secondary border border-border';
}

function PlayerRow({ player }: { player: any }) {
  const ovr = Number(player.overall);
  const pot = player.potential ? Number(player.potential) : null;

  const getAllPositions = () => {
    try {
      const main = positionPtMap[player.position] ?? player.position;
      if (!player.altPositions) return [main];
      let alts: string[] = player.altPositions.startsWith('[')
        ? JSON.parse(player.altPositions)
        : player.altPositions.split(',').map((s: string) => s.trim()).filter(Boolean);
      const altPt = alts
        .map((p: string) => positionPtMap[p] ?? p)
        .filter((p: string) => p !== main);
      return [main, ...altPt.slice(0, 3)];
    } catch { return [positionPtMap[player.position] ?? player.position]; }
  };
  const positions = getAllPositions();

  return (
    <div className="grid items-center border-b border-border/30 last:border-0 hover:bg-white/5 transition-colors px-3 py-2.5"
      style={{ gridTemplateColumns: '44px 1fr 140px 52px 52px 72px' }}>

      {/* Foto */}
      <div className="w-10 h-10 flex-shrink-0 rounded-full overflow-hidden bg-secondary flex items-center justify-center">
        {player.imageUrl ? (
          <img
            src={player.imageUrl}
            alt={player.name}
            className="w-full h-full object-cover object-top"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
              (e.currentTarget.parentElement as HTMLElement).innerHTML =
                '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>';
            }}
          />
        ) : (
          <Users className="h-5 w-5 text-muted-foreground" />
        )}
      </div>

      {/* Nome + Nacionalidade */}
      <div className="min-w-0 pl-2">
        <p className="font-bold text-sm text-foreground truncate leading-tight">{player.name}</p>
        <div className="flex items-center gap-1 mt-0.5">
          {player.nationality && (
            <span className="text-[11px] text-muted-foreground truncate">{player.nationality}</span>
          )}
          {player.age && (
            <span className="text-[11px] text-muted-foreground/50">· {player.age}a</span>
          )}
        </div>
      </div>

      {/* Posições */}
      <div className="flex items-center justify-center gap-1 flex-wrap">
        {positions.map((pos: string) => (
          <span key={pos} className="text-[10px] font-bold text-primary bg-primary/15 px-1.5 py-0.5 rounded whitespace-nowrap">{pos}</span>
        ))}
      </div>

      {/* OVR */}
      <div className="flex flex-col items-center justify-center">
        <span className={`text-base font-black leading-none ${getOvrColor(ovr)}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>{ovr}</span>
        <span className="text-[7px] text-muted-foreground uppercase tracking-wide mt-0.5">OVR</span>
      </div>

      {/* POT */}
      <div className="flex flex-col items-center justify-center">
        <span className="text-base font-black leading-none text-blue-400" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{pot ?? '—'}</span>
        <span className="text-[7px] text-muted-foreground uppercase tracking-wide mt-0.5">POT</span>
      </div>

      {/* Valor */}
      <div className="text-right">
        <span className="text-sm font-bold text-primary">{formatPrice(player.price)}</span>
      </div>
    </div>
  );
}

export default function TeamDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const search = useSearch();

  // Ler leagueId e countryId da URL para restaurar o estado ao voltar
  const backUrl = useMemo(() => {
    const p = new URLSearchParams(search);
    const leagueId = p.get("leagueId");
    const countryId = p.get("countryId");
    if (leagueId && countryId) {
      return `/times?leagueId=${leagueId}&countryId=${countryId}`;
    }
    return "/times";
  }, [search]);
  const teamId = parseInt(params.id ?? "0", 10);

  // Busca de jogadores no elenco
  const [playerSearch, setPlayerSearch] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        // apenas fecha se clicar fora
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { isAuthenticated } = useAuth();

  // Favorito
  const { data: isFav, refetch: refetchFav } = trpc.teams.isFavorited.useQuery(
    { teamId },
    { enabled: isAuthenticated && !!teamId }
  );
  const addFav = trpc.teams.addFavorite.useMutation({
    onSuccess: () => { refetchFav(); toast.success("Time adicionado aos favoritos!"); },
  });
  const removeFav = trpc.teams.removeFavorite.useMutation({
    onSuccess: () => { refetchFav(); toast.success("Time removido dos favoritos."); },
  });

  const { data: team, isLoading: teamLoading } = trpc.teams.byId.useQuery(
    { id: teamId },
    { enabled: !!teamId }
  );

  const { data: teamPlayers, isLoading: playersLoading } = trpc.teamPlayers.byTeam.useQuery(
    { teamName: team?.name ?? "" },
    { enabled: !!team?.name }
  );

  const isLoading = teamLoading || (!!team && playersLoading);

  // Filtra jogadores pelo nome digitado
  const filteredPlayers = useMemo(() => {
    if (!teamPlayers) return [];
    const q = playerSearch.trim().toLowerCase();
    if (!q) return teamPlayers;
    return teamPlayers.filter((p: any) => p.name.toLowerCase().includes(q));
  }, [teamPlayers, playerSearch]);

  if (!teamId) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 pt-20 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Time não encontrado.</p>
            <Button onClick={() => navigate(backUrl)} className="mt-4">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Agrupa jogadores filtrados por posição
  const positionGroups: Record<string, any[]> = {};
  const positionOrder = ["GOL", "ZAG", "LD", "LE", "VOL", "MEI", "MC", "PNT", "ATA"];
  for (const p of filteredPlayers) {
    const pos = positionPtMap[p.position] ?? p.position;
    if (!positionGroups[pos]) positionGroups[pos] = [];
    positionGroups[pos].push(p);
  }

  const sortedGroups = Object.entries(positionGroups).sort(([a], [b]) => {
    const ai = positionOrder.indexOf(a);
    const bi = positionOrder.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const avgOverall = teamPlayers && teamPlayers.length > 0
    ? Math.round(teamPlayers.reduce((acc: number, p: any) => acc + Number(p.overall), 0) / teamPlayers.length)
    : null;

  const bestPlayer = teamPlayers && teamPlayers.length > 0
    ? teamPlayers.reduce((best: any, p: any) => Number(p.overall) > Number(best.overall) ? p : best, teamPlayers[0])
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Grid quadriculado de fundo */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(34,197,94,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.12) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      <Navbar />

      {/* ── Header Fixo ── */}
      <div className="border-b border-border bg-card fixed top-16 left-0 right-0 z-40">
        <div className="container py-2.5">
          {/* Linha 1: voltar + nome do time + favorito */}
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(backUrl)}
              className="shrink-0 h-8 w-8"
              title="Voltar"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-xl font-bold text-foreground flex items-center gap-2 truncate">
                {isLoading ? (
                  <span className="h-5 w-32 bg-muted rounded animate-pulse inline-block" />
                ) : team ? (
                  <span className="flex items-center gap-2 truncate">
                    {team.logoUrl && (
                      <img src={team.logoUrl} alt={team.name} className="w-6 h-6 object-contain shrink-0" />
                    )}
                    <span className="truncate">{team.name}</span>
                  </span>
                ) : "Time"}
              </h1>
              {/* Breadcrumb - esconde no mobile */}
              <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <button onClick={() => navigate(backUrl)} className="hover:text-primary transition-colors">Times</button>
                {team?.leagueName && (<><span>/</span><button onClick={() => navigate(backUrl)} className="hover:text-primary transition-colors">{team.leagueName}</button></>)}
                {team?.name && (<><span>/</span><span className="text-foreground">{team.name}</span></>)}
              </div>
            </div>

            {/* Botão Favorito */}
            {isAuthenticated && team && (
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8"
                title={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                onClick={() => isFav ? removeFav.mutate({ teamId }) : addFav.mutate({ teamId })}
                disabled={addFav.isPending || removeFav.isPending}
              >
                <Heart className={`w-4 h-4 transition-colors ${isFav ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-400'}`} />
              </Button>
            )}
          </div>

          {/* Linha 2: busca (largura total no mobile) */}
          <div ref={searchRef} className="relative w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar jogador no elenco..."
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Escape") setPlayerSearch(""); }}
                className="pl-10 pr-8 bg-secondary border-border"
              />
              {playerSearch && (
                <button
                  onClick={() => setPlayerSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 pt-40 sm:pt-44" style={{position: 'relative', zIndex: 2, backgroundColor: 'oklch(0.10 0.01 240)'}}>
        {/* Info do Time */}
        <section className="py-10 border-b border-border/50" style={{position: 'relative', zIndex: 2, backgroundColor: 'oklch(0.10 0.01 240)'}}>
          <div className="container">
            {isLoading ? (
              <div className="flex items-center gap-6 animate-pulse">
                <div className="w-24 h-24 rounded-xl bg-muted flex-shrink-0" />
                <div className="space-y-3 flex-1">
                  <div className="h-8 bg-muted rounded w-64" />
                  <div className="h-4 bg-muted rounded w-40" />
                </div>
              </div>
            ) : team ? (
              <div className="fut-card p-5 w-full flex flex-col gap-4" style={{backgroundColor: 'oklch(0.15 0.01 240)', backgroundImage: 'none', background: 'oklch(0.15 0.01 240)'}}>

                {/* Linha superior: logo + (nome/liga/estádio/descrição) */}
                <div className="flex items-start gap-3 sm:gap-5">
                  {/* Logo sem fundo cinza */}
                  <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20">
                    {team.logoUrl ? (
                      <img
                        src={team.logoUrl}
                        alt={team.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                          (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="text-3xl font-black text-muted-foreground">' + (team.name?.charAt(0) ?? '?') + '</div>';
                        }}
                      />
                    ) : (
                      <span className="text-3xl font-black text-muted-foreground">{team.name?.charAt(0) ?? '?'}</span>
                    )}
                  </div>

                  {/* Nome + liga/estádio + descrição */}
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <h2 className="text-xl sm:text-3xl md:text-4xl font-black leading-tight">{team.name}</h2>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      {team.leagueName && (
                        <div className="flex items-center gap-1.5">
                          {team.leagueLogoUrl && (
                            <img src={team.leagueLogoUrl} alt={team.leagueName} className="w-5 h-5 object-contain" />
                          )}
                          <span>{team.leagueName}</span>
                        </div>
                      )}
                      {team.stadiumName && (
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-4 w-4" />
                          <span>{team.stadiumName}</span>
                        </div>
                      )}
                    </div>
                    {(team as any).description ? (
                      <p className="text-[13px] text-muted-foreground leading-relaxed mt-1">
                        {(team as any).description}
                      </p>
                    ) : (
                      <p className="text-[13px] text-muted-foreground italic mt-1">Sem descrição disponível.</p>
                    )}
                  </div>
                </div>

                {/* Divisor */}
                <div className="border-t border-border/30" />

                {/* Stats dentro do card */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
                  {team.budget != null && (
                    <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{backgroundColor: 'oklch(0.20 0.01 240)'}}>
                      <Wallet className="h-4 w-4 text-green-400" />
                      <div>
                        <p className="text-xs text-muted-foreground">Orçamento</p>
                        <p className="text-sm font-bold text-green-400">{formatBudget(team.budget)}</p>
                      </div>
                    </div>
                  )}
                  {avgOverall != null && (
                    <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{backgroundColor: 'oklch(0.20 0.01 240)'}}>
                      <Trophy className="h-4 w-4 text-yellow-400" />
                      <div>
                        <p className="text-xs text-muted-foreground">Overall Médio</p>
                        <p className="text-sm font-bold text-yellow-400">{avgOverall}</p>
                      </div>
                    </div>
                  )}
                  {teamPlayers && (
                    <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{backgroundColor: 'oklch(0.20 0.01 240)'}}>
                      <Users className="h-4 w-4 text-blue-400" />
                      <div>
                        <p className="text-xs text-muted-foreground">Jogadores</p>
                        <p className="text-sm font-bold text-blue-400">{teamPlayers.length}</p>
                      </div>
                    </div>
                  )}
                  {bestPlayer && (
                    <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{backgroundColor: 'oklch(0.20 0.01 240)'}}>
                      <Star className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Melhor Jogador</p>
                        <p className="text-sm font-bold text-primary">{bestPlayer.name} ({bestPlayer.overall})</p>
                      </div>
                    </div>
                  )}
                  {(team as any).rivalTeam && (
                    <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{backgroundColor: 'oklch(0.20 0.01 240)'}}>
                      <Swords className="h-4 w-4 text-red-400" />
                      <div>
                        <p className="text-xs text-muted-foreground">Rival</p>
                        <p className="text-sm font-bold text-red-400">{(team as any).rivalTeam}</p>
                      </div>
                    </div>
                  )}
                  {(team as any).prestige != null && (
                    <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{backgroundColor: 'oklch(0.20 0.01 240)'}}>
                      <Globe className="h-4 w-4 text-purple-400" />
                      <div>
                        <p className="text-xs text-muted-foreground">Prestígio Internacional</p>
                        <p className="text-sm font-bold text-purple-400">{(team as any).prestige}/10</p>
                      </div>
                    </div>
                  )}
                  {(team as any).localPrestige != null && (
                    <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{backgroundColor: 'oklch(0.20 0.01 240)'}}>
                      <MapPin className="h-4 w-4 text-orange-400" />
                      <div>
                        <p className="text-xs text-muted-foreground">Prestígio Local</p>
                        <p className="text-sm font-bold text-orange-400">{(team as any).localPrestige}/10</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Time não encontrado.</p>
                <Button onClick={() => navigate(backUrl)} className="mt-4">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Jogadores do Time */}
        <div className="container py-10" style={{position: 'relative', zIndex: 2}}>
          {/* Aviso de filtro ativo */}
          {playerSearch.trim() && (
            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Search className="h-4 w-4" />
              <span>
                Mostrando <strong className="text-foreground">{filteredPlayers.length}</strong> jogador{filteredPlayers.length !== 1 ? 'es' : ''} para "{playerSearch}"
              </span>
              <button
                onClick={() => setPlayerSearch("")}
                className="ml-1 text-primary hover:underline"
              >
                Limpar
              </button>
            </div>
          )}

          {playersLoading ? (
            <div className="rounded-xl overflow-hidden border border-border/50" style={{backgroundColor: 'oklch(0.13 0.01 240)'}}>
              {[...Array(11)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-3 border-b border-border/30 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-secondary flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-secondary rounded w-2/5" />
                    <div className="h-2.5 bg-secondary/60 rounded w-1/4" />
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-secondary flex-shrink-0" />
                  <div className="w-9 h-9 rounded-lg bg-secondary flex-shrink-0" />
                  <div className="w-14 h-4 rounded bg-secondary flex-shrink-0 hidden sm:block" />
                </div>
              ))}
            </div>
          ) : filteredPlayers.length > 0 ? (
            <div className="rounded-xl overflow-hidden border border-border/50" style={{backgroundColor: 'oklch(0.13 0.01 240)'}}>
              {/* Cabeçalho */}
              <div className="grid items-center px-3 py-2.5 border-b border-border/50" style={{backgroundColor: 'oklch(0.17 0.01 240)', gridTemplateColumns: '44px 1fr 140px 52px 52px 72px'}}>
                <div />
                <div className="pl-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Nome</div>
                <div className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Posições</div>
                <div className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">OVR</div>
                <div className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">POT</div>
                <div className="text-right text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Valor</div>
              </div>
              {/* Linhas */}
              {filteredPlayers.map((player: any) => (
                <PlayerRow key={player.id} player={player} />
              ))}
            </div>
          ) : teamPlayers && teamPlayers.length > 0 ? (
            <div className="text-center py-16">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum jogador encontrado para "{playerSearch}".</p>
              <button onClick={() => setPlayerSearch("")} className="mt-2 text-sm text-primary hover:underline">
                Limpar busca
              </button>
            </div>
          ) : team ? (
            <div className="text-center py-16">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum jogador encontrado para este time.</p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                Os dados de jogadores podem não estar disponíveis para este clube.
              </p>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}
