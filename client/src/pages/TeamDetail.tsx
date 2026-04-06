import { useParams, useLocation } from "wouter";
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
} from "lucide-react";

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

function formatBudget(budget: number | null | undefined): string {
  if (!budget) return "—";
  if (budget >= 1000) {
    const b = budget / 1000;
    return `€${Number.isInteger(b) ? b : b.toFixed(1)}B`;
  }
  return `€${budget}M`;
}

function PlayerMiniCard({ player }: { player: any }) {
  const { gradient, isDiamond } = getCardGradient(Number(player.overall));

  const getAltPositions = () => {
    try {
      if (!player.altPositions) return [];
      let alts: string[] = player.altPositions.startsWith('[')
        ? JSON.parse(player.altPositions)
        : player.altPositions.split(',').map((s: string) => s.trim()).filter(Boolean);
      return alts.filter((p: string) => p !== player.position).slice(0, 2);
    } catch { return []; }
  };
  const altPositions = getAltPositions();

  return (
    <div className="fut-card fut-card-hover overflow-hidden">
      {/* Card Header */}
      <div className={`bg-gradient-to-br ${gradient} p-3 relative${isDiamond ? ' shadow-[0_0_18px_2px_rgba(139,92,246,0.45)]' : ''}`}>
        {/* Posições */}
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
        <div className="flex items-end gap-2">
          <div className="w-12 h-12 flex-shrink-0 rounded-full bg-black/20 flex items-center justify-center overflow-hidden">
            {player.imageUrl ? (
              <img
                src={player.imageUrl}
                alt={player.name}
                className="w-full h-full object-cover object-top"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                  (e.currentTarget.parentElement as HTMLElement).innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>';
                }}
              />
            ) : (
              <Users className="h-6 w-6 text-white/60" />
            )}
          </div>
          <div className="min-w-0 flex-1 pr-10">
            <h3 className={`font-black text-sm leading-tight truncate ${isDiamond ? 'text-white drop-shadow-[0_1px_4px_rgba(139,92,246,0.8)]' : 'text-white'}`}>
              {player.name}
            </h3>
            <p className="text-white/70 text-xs truncate">
              {player.nationality}{player.age ? ` · ${player.age} anos` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-3 space-y-2">
        {/* Overall / Potential */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-secondary rounded-lg py-1.5">
            <p className="text-base font-black text-primary leading-none" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{player.overall}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Overall</p>
          </div>
          <div className="bg-secondary rounded-lg py-1.5">
            <p className="text-base font-black text-blue-400 leading-none" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{player.potential ?? '—'}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Potencial</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TeamDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
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
            <Button onClick={() => window.history.back()} className="mt-4">
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
    <div className="min-h-screen flex flex-col bg-background pt-16">
      {/* Grid quadriculado de fundo */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(34,197,94,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.12) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      <Navbar />

      {/* ── Header Sticky (idêntico ao de Times) ── */}
      <div className="border-b border-border bg-card sticky top-16 z-40">
        <div className="container py-4">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Botão voltar */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.history.back()}
              className="shrink-0"
              title="Voltar"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            {/* Título + breadcrumb */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Trophy className="w-6 h-6 text-primary" />
                {isLoading ? (
                  <span className="h-6 w-40 bg-muted rounded animate-pulse inline-block" />
                ) : team ? (
                  <span className="flex items-center gap-2">
                    {team.logoUrl && (
                      <img src={team.logoUrl} alt={team.name} className="w-7 h-7 object-contain" />
                    )}
                    {team.name}
                  </span>
                ) : "Time"}
              </h1>
              {/* Breadcrumb */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <button onClick={() => window.history.back()} className="hover:text-primary transition-colors">
                  Times
                </button>
                {team?.leagueName && (
                  <>
                    <span>/</span>
                    <button onClick={() => window.history.back()} className="hover:text-primary transition-colors">
                      {team.leagueName}
                    </button>
                  </>
                )}
                {team?.name && (
                  <>
                    <span>/</span>
                    <span className="text-foreground">{team.name}</span>
                  </>
                )}
              </div>
            </div>

            {/* ── Busca de jogadores no elenco ── */}
            <div ref={searchRef} className="relative shrink-0 w-56 sm:w-64">
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
      </div>

      <main className="flex-1">
        {/* Info do Time */}
        <section className="py-10 border-b border-border/50" style={{ background: "oklch(0.12 0.01 240)" }}>
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
              <div className="rounded-xl border border-border/40 bg-black p-5 w-full flex flex-col gap-4">

                {/* Linha superior: logo + (nome/liga/estádio/descrição) */}
                <div className="flex items-start gap-5">
                  {/* Logo sem fundo cinza */}
                  <div className="flex-shrink-0 flex items-center justify-center w-20 h-20">
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
                    <h2 className="text-3xl md:text-4xl font-black leading-tight">{team.name}</h2>
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
                <div className="flex flex-wrap gap-3">
                  {team.budget != null && (
                    <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                      <Wallet className="h-4 w-4 text-green-400" />
                      <div>
                        <p className="text-xs text-muted-foreground">Orçamento</p>
                        <p className="text-sm font-bold text-green-400">{formatBudget(team.budget)}</p>
                      </div>
                    </div>
                  )}
                  {avgOverall != null && (
                    <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                      <Trophy className="h-4 w-4 text-yellow-400" />
                      <div>
                        <p className="text-xs text-muted-foreground">Overall Médio</p>
                        <p className="text-sm font-bold text-yellow-400">{avgOverall}</p>
                      </div>
                    </div>
                  )}
                  {teamPlayers && (
                    <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                      <Users className="h-4 w-4 text-blue-400" />
                      <div>
                        <p className="text-xs text-muted-foreground">Jogadores</p>
                        <p className="text-sm font-bold text-blue-400">{teamPlayers.length}</p>
                      </div>
                    </div>
                  )}
                  {bestPlayer && (
                    <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                      <Star className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Melhor Jogador</p>
                        <p className="text-sm font-bold text-primary">{bestPlayer.name} ({bestPlayer.overall})</p>
                      </div>
                    </div>
                  )}
                  {(team as any).rivalTeam && (
                    <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                      <Swords className="h-4 w-4 text-red-400" />
                      <div>
                        <p className="text-xs text-muted-foreground">Rival</p>
                        <p className="text-sm font-bold text-red-400">{(team as any).rivalTeam}</p>
                      </div>
                    </div>
                  )}
                  {(team as any).prestige != null && (
                    <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                      <Globe className="h-4 w-4 text-purple-400" />
                      <div>
                        <p className="text-xs text-muted-foreground">Prestígio Internacional</p>
                        <p className="text-sm font-bold text-purple-400">{(team as any).prestige}/10</p>
                      </div>
                    </div>
                  )}
                  {(team as any).localPrestige != null && (
                    <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
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
                <Button onClick={() => window.history.back()} className="mt-4">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Jogadores do Time */}
        <div className="container py-10">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[...Array(11)].map((_, i) => (
                <div key={i} className="fut-card animate-pulse">
                  <div className="h-20 bg-muted rounded-t-xl" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPlayers.length > 0 ? (
            <div className="space-y-8">
              {sortedGroups.map(([posGroup, groupPlayers]) => (
                <div key={posGroup}>
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-lg font-black text-primary">{posGroup}</h2>
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                      {groupPlayers.length} jogador{groupPlayers.length !== 1 ? 'es' : ''}
                    </span>
                    <div className="flex-1 h-px bg-border/50" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {groupPlayers.map((player: any) => (
                      <PlayerMiniCard key={player.id} player={player} />
                    ))}
                  </div>
                </div>
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
