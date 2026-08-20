import { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import InteractiveGlobe from "@/components/InteractiveGlobe";
import { trpc } from "@/lib/trpc";
import { getCountryFlag } from "@/lib/countryCoordinates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Trophy, MapPin, Wallet, Star, Search, X, ArrowRight, Shuffle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLocation, useSearch } from "wouter";

const countryFlags: Record<string, string> = {
  Espanha: "🇪🇸",
  Inglaterra: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  Itália: "🇮🇹",
  Alemanha: "🇩🇪",
  França: "🇫🇷",
  Portugal: "🇵🇹",
  "Arábia Saudita": "🇸🇦",
  Holanda: "🇳🇱",
  Bélgica: "🇧🇪",
  Turquia: "🇹🇷",
  Escócia: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  Argentina: "🇦🇷",
  EUA: "🇺🇸",
};

function PrestigeStars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${i < Math.round(value / 2) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

function formatBudget(value: number | null | undefined): string {
  if (!value) return "—";
  if (value >= 1000) return `€${(value / 1000).toFixed(1)}B`;
  const rounded = parseFloat(value.toFixed(1));
  return `€${rounded}M`;
}

type View = "countries" | "leagues" | "teams";
type Country = { id: number; name: string };
type League = { id: number; name: string; division: number; logoUrl?: string | null };

export default function Times() {
  const [view, setView] = useState<View>("countries");
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [countrySearch, setCountrySearch] = useState("");
  const [, navigate] = useLocation();
  const search = useSearch();

  const { data: countries, isLoading: loadingCountries } = trpc.countries.list.useQuery();
  const { data: leagues, isLoading: loadingLeagues } = trpc.leagues.byCountry.useQuery(
    { countryId: selectedCountry?.id ?? 0 },
    { enabled: !!selectedCountry },
  );
  const { data: teams, isLoading: loadingTeams } = trpc.teams.byLeague.useQuery(
    { leagueId: selectedLeague?.id ?? 0 },
    { enabled: !!selectedLeague },
  );

  const restoreLeagueId = useMemo(() => {
    const params = new URLSearchParams(search);
    const id = params.get("leagueId");
    return id ? parseInt(id, 10) : null;
  }, [search]);
  const restoreCountryId = useMemo(() => {
    const params = new URLSearchParams(search);
    const id = params.get("countryId");
    return id ? parseInt(id, 10) : null;
  }, [search]);

  const { data: restoreLeagues } = trpc.leagues.byCountry.useQuery(
    { countryId: restoreCountryId ?? 0 },
    { enabled: restoreCountryId !== null && restoreLeagueId !== null },
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useMemo(() => searchQuery.trim(), [searchQuery]);
  const { data: searchResults, isFetching: searchLoading } = trpc.teams.search.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length >= 2 },
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!countries?.length || selectedCountry) return;
    const preferred = countries.find((country) => country.name === "Inglaterra") ?? countries[0];
    setSelectedCountry({ id: preferred.id, name: preferred.name });
  }, [countries, selectedCountry]);

  useEffect(() => {
    if (!restoreCountryId || !restoreLeagueId || !countries || !restoreLeagues) return;
    const country = countries.find((item) => item.id === restoreCountryId);
    const league = restoreLeagues.find((item) => item.id === restoreLeagueId);
    if (country && league) {
      setSelectedCountry({ id: country.id, name: country.name });
      setSelectedLeague({ id: league.id, name: league.name, division: league.division, logoUrl: league.logoUrl });
      setView("teams");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [countries, restoreCountryId, restoreLeagueId, restoreLeagues]);

  const filteredCountries = useMemo(() => {
    const query = countrySearch.trim().toLocaleLowerCase("pt-BR");
    if (!query) return countries ?? [];
    return (countries ?? []).filter((country) => country.name.toLocaleLowerCase("pt-BR").includes(query));
  }, [countries, countrySearch]);

  function selectCountry(country: Country) {
    setSelectedCountry(country);
    setSelectedLeague(null);
    setView("countries");
  }

  function goToCountries() {
    setView("countries");
    setSelectedLeague(null);
  }

  function goToLeagues(country: Country = selectedCountry as Country) {
    if (!country) return;
    setSelectedCountry(country);
    setSelectedLeague(null);
    setView("leagues");
  }

  function goToTeams(league: League) {
    setSelectedLeague(league);
    setView("teams");
  }

  const selectedFlag = selectedCountry ? (countryFlags[selectedCountry.name] ?? getCountryFlag(selectedCountry.name)) : "🌍";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="fixed left-0 right-0 top-16 z-40 border-b border-border bg-card/95 backdrop-blur-xl">
        <div className="container py-3">
          <div className="mb-2 flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={view === "countries" ? () => navigate("/") : view === "leagues" ? goToCountries : () => setView("leagues")}
              className="h-8 w-8 shrink-0"
              title="Voltar"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="flex items-center gap-1.5 truncate text-base font-bold text-foreground sm:text-xl">
                <Trophy className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">
                  {view === "countries" && "Explore o futebol mundial"}
                  {view === "leagues" && `${selectedFlag} ${selectedCountry?.name ?? "Ligas"}`}
                  {view === "teams" && selectedLeague?.name}
                </span>
              </h1>
              <div className="mt-0.5 hidden items-center gap-1 overflow-hidden text-xs text-muted-foreground sm:flex">
                <button onClick={goToCountries} className="shrink-0 transition-colors hover:text-primary">Países</button>
                {selectedCountry && (
                  <>
                    <span>/</span>
                    <button onClick={() => setView("countries")} className="max-w-[100px] truncate transition-colors hover:text-primary">{selectedCountry.name}</button>
                  </>
                )}
                {selectedLeague && (
                  <>
                    <span>/</span>
                    <span className="max-w-[120px] truncate text-foreground">{selectedLeague.name}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div ref={searchRef} className="relative w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar time diretamente..."
                value={searchQuery}
                onChange={(event) => { setSearchQuery(event.target.value); setShowDropdown(true); }}
                onFocus={() => { if (searchQuery.length >= 2) setShowDropdown(true); }}
                onKeyDown={(event) => { if (event.key === "Escape") { setShowDropdown(false); setSearchQuery(""); } }}
                className="border-border bg-secondary pl-10 pr-8"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); setShowDropdown(false); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {showDropdown && debouncedQuery.length >= 2 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                {searchLoading ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground">Buscando...</div>
                ) : searchResults && searchResults.length > 0 ? (
                  <ul>
                    {searchResults.map((team) => (
                      <li key={team.id}>
                        <button
                          onClick={() => { setShowDropdown(false); setSearchQuery(""); navigate(`/times/${team.id}`); }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-secondary"
                        >
                          {team.logoUrl ? <img src={team.logoUrl} alt={team.name} className="h-8 w-8 shrink-0 object-contain" /> : <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20"><Trophy className="h-4 w-4 text-primary" /></div>}
                          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-foreground">{team.name}</p><p className="truncate text-xs text-muted-foreground">{team.leagueName} · {team.countryName}</p></div>
                          {team.prestige != null && <PrestigeStars value={team.prestige} />}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : <div className="px-4 py-3 text-sm text-muted-foreground">Nenhum time encontrado para "{debouncedQuery}"</div>}
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="container pb-10 pt-44 sm:pt-48">
        {view === "countries" && (
          <section className="space-y-5">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_370px] xl:items-start">
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground sm:text-base">Passe o mouse sobre um país para descobrir suas ligas e times</p>
                  <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-4xl">Escolha seu próximo desafio</h2>
                </div>
                {loadingCountries ? (
                  <div className="min-h-[430px] animate-pulse rounded-[28px] bg-card sm:min-h-[570px]" />
                ) : (
                  <InteractiveGlobe
                    countries={countries ?? []}
                    selectedCountryId={selectedCountry?.id}
                    onCountrySelect={selectCountry}
                  />
                )}
              </div>

              <aside className="rounded-2xl border border-primary/25 bg-card/95 p-5 shadow-[0_0_35px_rgba(34,197,94,0.08)] sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">País selecionado</p>
                    <h2 className="mt-2 flex items-center gap-2 font-display text-3xl font-bold text-foreground sm:text-4xl"><span>{selectedFlag}</span>{selectedCountry?.name ?? "Selecione no globo"}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{loadingLeagues ? "Carregando ligas..." : `${leagues?.length ?? 0} ligas disponíveis`}</p>
                  </div>
                  <div className="hidden h-12 w-12 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-2xl sm:flex">{selectedFlag}</div>
                </div>

                <div className="space-y-2.5">
                  {(leagues ?? []).slice(0, 4).map((league) => (
                    <button
                      key={league.id}
                      onClick={() => goToTeams(league)}
                      className="group flex w-full items-center gap-3 rounded-xl border border-border/70 bg-secondary/35 p-3 text-left transition-all hover:border-primary/45 hover:bg-secondary"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-background/70">
                        {league.logoUrl ? <img src={league.logoUrl} alt={league.name} className="h-8 w-8 object-contain" /> : <Trophy className="h-5 w-5 text-primary" />}
                      </span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-foreground">{league.name}</span><span className="text-xs text-muted-foreground">{league.division === 1 ? "1ª Divisão" : `${league.division}ª Divisão`}</span></span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                    </button>
                  ))}
                  {!loadingLeagues && !leagues?.length && <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Nenhuma liga cadastrada para este país.</p>}
                </div>

                <Button onClick={() => goToLeagues()} disabled={!selectedCountry} className="mt-4 w-full gap-2 bg-primary font-bold text-primary-foreground hover:bg-primary/90">
                  Ver todas as ligas <ArrowRight className="h-4 w-4" />
                </Button>
                <button type="button" onClick={() => { const random = countries?.[Math.floor(Math.random() * (countries.length || 1))]; if (random) selectCountry(random); }} className="mt-4 flex w-full items-center justify-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80">
                  <Shuffle className="h-4 w-4" /> Escolher país aleatório
                </button>
              </aside>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card/80 p-2 sm:p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2 px-2 sm:w-44"><span className="text-sm font-semibold text-foreground">Todos os países</span><span className="text-xs text-muted-foreground">({countries?.length ?? 0})</span></div>
                <div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={countrySearch} onChange={(event) => setCountrySearch(event.target.value)} placeholder="Buscar país..." className="h-9 border-border bg-secondary pl-9" /></div>
                <div className="flex min-w-0 gap-2 overflow-x-auto pb-1 sm:pb-0">
                  {filteredCountries.map((country) => (
                    <button key={country.id} onClick={() => selectCountry(country)} className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-all ${selectedCountry?.id === country.id ? "border-primary bg-primary/10 text-primary shadow-[0_0_16px_rgba(34,197,94,0.12)]" : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}>
                      <span>{countryFlags[country.name] ?? getCountryFlag(country.name)}</span>{country.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {view === "leagues" && (
          <section>
            <p className="mb-6 text-muted-foreground">Escolha uma liga para ver os times disponíveis.</p>
            {loadingLeagues ? <div className="flex flex-col gap-3">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-xl bg-muted" />)}</div> : <div className="flex flex-col gap-3">{leagues?.map((league) => <button key={league.id} onClick={() => goToTeams(league)} className="group flex items-center justify-between rounded-xl border border-border/50 bg-card p-5 text-left transition-all hover:border-primary/50 hover:bg-card/80 hover:shadow-md hover:shadow-primary/10"><div className="flex items-center gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">{league.logoUrl ? <img src={league.logoUrl} alt={league.name} className="h-10 w-10 object-contain" /> : <Trophy className="h-6 w-6 text-primary" />}</div><div><p className="font-bold text-foreground transition-colors group-hover:text-primary">{league.name}</p><p className="text-xs text-muted-foreground">{league.division === 1 ? "1ª Divisão" : `${league.division}ª Divisão`}</p></div></div><ChevronRight className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" /></button>)}</div>}
          </section>
        )}

        {view === "teams" && (
          <section>
            {loadingTeams ? <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-xl bg-muted" />)}</div> : <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{teams?.map((team) => <Card key={team.id} onClick={() => navigate(`/times/${team.id}?leagueId=${selectedLeague?.id ?? 0}&countryId=${selectedCountry?.id ?? 0}`)} className="group cursor-pointer border-border/50 transition-all hover:scale-[1.01] hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"><CardContent className="p-5"><div className="mb-3 flex items-start justify-between"><div className="flex items-center gap-3">{team.logoUrl ? <img src={team.logoUrl} alt={team.name} className="h-10 w-10 object-contain" /> : <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5"><span className="text-lg font-bold text-primary">{team.shortName?.slice(0, 2)}</span></div>}<div className="min-w-0"><p className="truncate font-bold leading-tight text-foreground transition-colors group-hover:text-primary">{team.name}</p><Badge variant="outline" className="mt-0.5 border-primary/30 text-xs text-primary">{team.shortName}</Badge></div></div><PrestigeStars value={team.prestige ?? 5} /></div>{team.stadiumName && <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3 w-3 shrink-0" /><span className="truncate">{team.stadiumName}</span></div>}{team.budget != null && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Wallet className="h-3 w-3 shrink-0" /><span>Orçamento: <span className="font-semibold text-green-400">{formatBudget(team.budget)}</span></span></div>}</CardContent></Card>)}</div>}
          </section>
        )}
      </main>
    </div>
  );
}
