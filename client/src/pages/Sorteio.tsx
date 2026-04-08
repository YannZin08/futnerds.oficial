import { useState, useRef, useEffect, useCallback } from "react";
import { Shuffle, Plus, X, Trophy, Clock, Search, Loader2, Dices, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";

type TeamItem = {
  id?: number;
  teamId: number;
  teamName: string;
  teamLogoUrl?: string | null;
  leagueName?: string | null;
  countryName?: string | null;
  budget?: number | null;
  prestige?: number | null;
};

function getDifficultyLabel(prestige: number | null | undefined): { label: string; color: string } {
  if (!prestige) return { label: "Desconhecida", color: "text-muted-foreground" };
  if (prestige >= 9) return { label: "Extremo", color: "text-red-500" };
  if (prestige >= 7) return { label: "Difícil", color: "text-orange-400" };
  if (prestige >= 5) return { label: "Médio", color: "text-yellow-400" };
  return { label: "Fácil", color: "text-green-400" };
}

export default function Sorteio() {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TeamItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [localList, setLocalList] = useState<TeamItem[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [result, setResult] = useState<TeamItem | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [loadingTheme, setLoadingTheme] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const spinIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const utils = trpc.useUtils();

  // Queries
  const { data: spinList } = trpc.spin.getList.useQuery(undefined, { enabled: isAuthenticated });
  const { data: spinHistory } = trpc.spin.getHistory.useQuery(undefined, { enabled: isAuthenticated });
  const { data: rawSearchData } = trpc.teams.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length >= 2 }
  );

  // Mutations
  const addItem = trpc.spin.addItem.useMutation({ onSuccess: () => utils.spin.getList.invalidate() });
  const removeItem = trpc.spin.removeItem.useMutation({ onSuccess: () => utils.spin.getList.invalidate() });
  const recordResult = trpc.spin.recordResult.useMutation({ onSuccess: () => utils.spin.getHistory.invalidate() });

  // Sincronizar lista local com banco (quando autenticado)
  useEffect(() => {
    if (spinList && isAuthenticated) {
      setLocalList(spinList as TeamItem[]);
    }
  }, [spinList, isAuthenticated]);

  // Atualizar resultados de busca - mapear rawSearchData para TeamItem
  useEffect(() => {
    if (rawSearchData && rawSearchData.length > 0 && searchQuery.length >= 2) {
      const mapped = rawSearchData.map((t: any) => ({
        teamId: t.id,
        teamName: t.name,
        teamLogoUrl: t.logoUrl,
        leagueName: t.leagueName,
        countryName: t.countryName,
        budget: t.budget,
        prestige: t.prestige,
      }));
      setSearchResults(mapped);
      setShowDropdown(true);
    } else if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, [rawSearchData, searchQuery]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addTeam = useCallback((team: TeamItem) => {
    const alreadyIn = localList.some((t) => t.teamId === team.teamId);
    if (alreadyIn) return;
    const newItem = { ...team };
    setLocalList((prev) => [...prev, newItem]);
    if (isAuthenticated) {
      addItem.mutate({ teamId: team.teamId });
    }
    setSearchQuery("");
    setShowDropdown(false);
  }, [localList, isAuthenticated, addItem]);

  const removeTeam = useCallback((teamId: number) => {
    setLocalList((prev) => prev.filter((t) => t.teamId !== teamId));
    if (isAuthenticated) {
      removeItem.mutate({ teamId });
    }
  }, [isAuthenticated, removeItem]);

  const addThematicList = useCallback(async (label: string, teamNames: string[]) => {
    setLoadingTheme(label);
    try {
      const results = await Promise.all(
        teamNames.map((name) =>
          utils.teams.search.fetch({ query: name })
        )
      );
      results.forEach((teams, i) => {
        if (teams && teams.length > 0) {
          const t = teams[0] as any;
          const item: TeamItem = {
            teamId: t.id,
            teamName: t.name,
            teamLogoUrl: t.logoUrl,
            leagueName: t.leagueName,
            countryName: t.countryName,
            budget: t.budget,
            prestige: t.prestige,
          };
          addTeam(item);
        }
      });
    } catch (e) {
      console.error('Erro ao carregar lista temática', e);
    } finally {
      setLoadingTheme(null);
    }
  }, [utils, addTeam]);

  const startSpin = useCallback(() => {
    if (localList.length < 2 || isSpinning) return;
    setResult(null);
    setShowResult(false);
    setIsSpinning(true);
    setConfetti(false);

    // Escolher o vencedor antecipadamente
    const winnerIndex = Math.floor(Math.random() * localList.length);
    const winner = localList[winnerIndex];

    let speed = 80;
    let currentIndex = 0;
    let elapsed = 0;
    const totalDuration = 3000; // 3 segundos
    const slowdownStart = 2000; // começa a desacelerar em 2s

    function tick() {
      setHighlightedIndex(currentIndex % localList.length);
      currentIndex++;
      elapsed += speed;

      if (elapsed >= totalDuration) {
        // Forçar parar no vencedor
        setHighlightedIndex(winnerIndex);
        if (spinIntervalRef.current) clearTimeout(spinIntervalRef.current);
        setTimeout(() => {
          setIsSpinning(false);
          setHighlightedIndex(null);
          setResult(winner);
          setShowResult(true);
          setConfetti(true);
          if (isAuthenticated) {
            recordResult.mutate({ teamId: winner.teamId });
          }
          setTimeout(() => setConfetti(false), 3000);
        }, 400);
        return;
      }

      // Desacelerar progressivamente
      if (elapsed > slowdownStart) {
        const progress = (elapsed - slowdownStart) / (totalDuration - slowdownStart);
        speed = 80 + progress * 320; // de 80ms a 400ms
      }

      spinIntervalRef.current = setTimeout(tick, speed);
    }

    spinIntervalRef.current = setTimeout(tick, speed);
  }, [localList, isSpinning, isAuthenticated, recordResult]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (spinIntervalRef.current) clearTimeout(spinIntervalRef.current);
    };
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <Dices className="h-16 w-16 text-primary mb-4" />
        <h1 className="text-3xl font-black mb-2">Sorteio de Time</h1>
        <p className="text-muted-foreground mb-6">Faça login para salvar sua lista e sortear seu próximo time do modo carreira.</p>
        <Button asChild>
          <a href={getLoginUrl()}>Entrar para sortear</a>
        </Button>
      </div>
    );
  }

  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen py-10">
      {/* Confetti */}
      {confetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-sm animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 60}%`,
                backgroundColor: ["#22c55e", "#16a34a", "#4ade80", "#ffffff", "#86efac"][i % 5],
                animationDuration: `${0.5 + Math.random() * 1}s`,
                animationDelay: `${Math.random() * 0.5}s`,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          ))}
        </div>
      )}

      <div className="container max-w-4xl">
        {/* Botão Voltar */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1 as any)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Voltar
          </button>
        </div>
        {/* Header */}
        <div className="mb-8 text-center">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663216916845/hhB4oykfDQM9yCvhQGaX3n/logo-futnerds_8f14a724.png"
            alt="FUTNERDS"
            className="w-20 h-20 object-contain mx-auto mb-4"
          />
          <h1 className="text-3xl sm:text-4xl font-black mb-2">Sorteio de Time</h1>
          <p className="text-muted-foreground">Monte sua lista e deixe o destino escolher seu próximo modo carreira</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna principal: busca + lista */}
          <div className="lg:col-span-2 space-y-4">
            {/* Campo de busca */}
            <div className="fut-card p-4 overflow-visible" style={{ position: 'relative', zIndex: 20 }}>
              <h2 className="font-bold mb-3 flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                Adicionar Time
              </h2>
              <div ref={searchRef} className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar time pelo nome..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                    className="pl-9"
                  />
                </div>
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border border-border rounded-lg shadow-xl max-h-64 overflow-y-auto">
                    {searchResults.map((team) => (
                      <button
                        key={team.teamId}
                        onMouseDown={(e) => { e.preventDefault(); addTeam(team); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors text-left"
                      >
                        {team.teamLogoUrl ? (
                          <img src={team.teamLogoUrl} alt={team.teamName} className="w-7 h-7 object-contain flex-shrink-0" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-primary">{team.teamName?.charAt(0)}</span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{team.teamName}</p>
                          <p className="text-xs text-muted-foreground truncate">{team.leagueName} · {team.countryName}</p>
                        </div>
                        {localList.some((t) => t.teamId === team.teamId) && (
                          <span className="ml-auto text-xs text-primary font-semibold flex-shrink-0">Na lista</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {showDropdown && searchQuery.length >= 2 && searchResults.length === 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border border-border rounded-lg shadow-xl p-4 text-center text-muted-foreground text-sm">
                    Nenhum time encontrado
                  </div>
                )}
              </div>
            </div>

            {/* Lista de times */}
            <div className="fut-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold flex items-center gap-2">
                  <Shuffle className="h-4 w-4 text-primary" />
                  Minha Lista
                  <span className="text-xs text-muted-foreground font-normal">({localList.length} times)</span>
                </h2>
                {localList.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      localList.forEach((t) => isAuthenticated && removeItem.mutate({ teamId: t.teamId }));
                      setLocalList([]);
                    }}
                  >
                    Limpar tudo
                  </Button>
                )}
              </div>

              {localList.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Dices className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Adicione pelo menos 2 times para sortear</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {localList.map((team, idx) => (
                    <div
                      key={team.teamId}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-150 ${
                        highlightedIndex === idx
                          ? "border-primary bg-primary/10 shadow-[0_0_12px_rgba(34,197,94,0.4)] scale-[1.02]"
                          : "border-border bg-card/50"
                      }`}
                    >
                      {team.teamLogoUrl ? (
                        <img src={team.teamLogoUrl} alt={team.teamName} className="w-8 h-8 object-contain flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary">{team.teamName?.charAt(0)}</span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">{team.teamName}</p>
                        <p className="text-xs text-muted-foreground truncate">{team.leagueName}</p>
                      </div>
                      <button
                        onClick={() => removeTeam(team.teamId)}
                        className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                        disabled={isSpinning}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Botão Sortear */}
            <Button
              className="w-full h-14 text-lg font-black"
              disabled={localList.length < 2 || isSpinning}
              onClick={startSpin}
            >
              {isSpinning ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Sorteando...
                </>
              ) : (
                <>
                  <Dices className="mr-2 h-5 w-5" />
                  {localList.length < 2 ? "Adicione pelo menos 2 times" : "Sortear!"}
                </>
              )}
            </Button>
          </div>

          {/* Coluna lateral: resultado + histórico */}
          <div className="space-y-4">
            {/* Resultado */}
            {showResult && result ? (
              <div className="fut-card p-5 text-center border-primary/50 shadow-[0_0_24px_rgba(34,197,94,0.2)]">
                <div className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">🎉 Resultado</div>
                {result.teamLogoUrl ? (
                  <img
                    src={result.teamLogoUrl}
                    alt={result.teamName}
                    className="w-24 h-24 object-contain mx-auto mb-3"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                    <span className="text-3xl font-black text-primary">{result.teamName?.charAt(0)}</span>
                  </div>
                )}
                <h3 className="text-xl font-black mb-1">{result.teamName}</h3>
                <p className="text-sm text-muted-foreground mb-1">{result.leagueName}</p>
                <p className="text-xs text-muted-foreground mb-3">{result.countryName}</p>
                {result.budget && (
                  <p className="text-xs text-muted-foreground mb-1">
                    Orçamento: <span className="text-foreground font-semibold">€{result.budget}M</span>
                  </p>
                )}
                {result.prestige !== undefined && (
                  <p className={`text-sm font-bold mb-4 ${getDifficultyLabel(result.prestige).color}`}>
                    Dificuldade: {getDifficultyLabel(result.prestige).label}
                  </p>
                )}
                <div className="flex flex-col gap-2">
                  <Button size="sm" variant="outline" onClick={startSpin} disabled={isSpinning}>
                    <Shuffle className="mr-2 h-3 w-3" />
                    Sortear novamente
                  </Button>
                  <Button size="sm" asChild>
                    <Link href={`/times/${result.teamId}`}>Ver time</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="fut-card p-5 text-center border-dashed">
                <Dices className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                <p className="text-sm text-muted-foreground">O resultado aparecerá aqui após o sorteio</p>
              </div>
            )}

            {/* Histórico */}
            {spinHistory && spinHistory.length > 0 && (
              <div className="fut-card p-4">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Últimos Sorteios
                </h3>
                <div className="space-y-2">
                  {spinHistory.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-2 py-1.5 border-b border-border/50 last:border-0">
                      {item.teamLogoUrl ? (
                        <img src={item.teamLogoUrl} alt={item.teamName} className="w-6 h-6 object-contain flex-shrink-0" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-primary">{item.teamName?.charAt(0)}</span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate">{item.teamName}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{item.leagueName}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sugestões temáticas */}
            <div className="fut-card p-4">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                Listas Temáticas
              </h3>
              <p className="text-xs text-muted-foreground mb-2">Clique para adicionar times sugeridos:</p>
              <div className="space-y-1.5">
                {[
                  { label: "⚽ Gigantes Europeus", teams: ["Real Madrid", "FC Barcelona", "Manchester City", "Bayern München", "Paris Saint-Germain"] },
                  { label: "🌱 Desafio Difícil", teams: ["Notts County", "Crawley Town", "Barrow", "Salford City"] },
                  { label: "🇧🇷 Brasil", teams: ["Flamengo", "Palmeiras", "São Paulo", "Corinthians", "Atlético Mineiro"] },
                ].map((theme) => (
                  <button
                    key={theme.label}
                    disabled={loadingTheme === theme.label}
                    className="w-full text-left text-xs px-3 py-2 rounded-md bg-accent/50 hover:bg-accent transition-colors disabled:opacity-60 disabled:cursor-wait flex items-center gap-2"
                    onClick={() => addThematicList(theme.label, theme.teams)}
                  >
                    {loadingTheme === theme.label && <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />}
                    {theme.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
