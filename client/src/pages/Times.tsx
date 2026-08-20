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
        <Star key={i} className={`h-3 w-3 ${i < Math.round(value / 2) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );
}

function formatBudget(value: number | null | undefined): string {
  if (!value) return "—";
  if (value >= 1000) return `€${(value / 1000).toFixed(1)}B`;
  return `€${parseFloat(value.toFixed(1))}M`;
}

type View = "countries" | "leagues" | "teams";
type Country = { id: number; name: string };
type League = { id: number; name: string; division: number; logoUrl?: string | null };

export default function Times() {
  const [view, setView] = useState<View>("countries");
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [countrySearch, setCountrySearch] = useState("");
  const [teamSearch, setTeamSearch] = useState("");
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  const [, navigate] = useLocation();
  const search = useSearch();
  const teamSearchRef = useRef<HTMLDivElement>(null);

  const { data: countries, isLoading: loadingCountries } = trpc.countries.list.useQuery();
  const { data: leagues, isLoading: loadingLeagues } = trpc.leagues.byCountry.useQuery(
    { countryId: selectedCountry?.id ?? 0 },
    { enabled: !!selectedCountry },
  );
  const { data: teams, isLoading: loadingTeams } = trpc.teams.byLeague.useQuery(
    { leagueId: selectedLeague?.id ?? 0 },
    { enabled: !!selectedLeague },
  );

  const params = useMemo(() => new URLSearchParams(search), [search]);
  const restoreLeagueId = params.get("leagueId") ? Number(params.get("leagueId")) : null;
  const restoreCountryId = params.get("countryId") ? Number(params.get("countryId")) : null;
  const { data: restoreLeagues } = trpc.leagues.byCountry.useQuery(
    { countryId: restoreCountryId ?? 0 },
    { enabled: restoreCountryId !== null && restoreLeagueId !== null },
  );

  const trimmedTeamSearch = teamSearch.trim();
  const { data: searchResults, isFetching: searchLoading } = trpc.teams.search.useQuery(
    { query: trimmedTeamSearch },
    { enabled: trimmedTeamSearch.length >= 2 },
  );

  useEffect(() => {
    if (!countries?.length || selectedCountry) return;
    const preferred = countries.find((country) => country.name === "Inglaterra") ?? countries[0];
    setSelectedCountry({ id: preferred.id, name: preferred.name });
  }, [countries, selectedCountry]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (teamSearchRef.current && !teamSearchRef.current.contains(event.target as Node)) setShowTeamDropdown(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    const priority = ["Brasil", "Inglaterra", "Espanha", "Itália", "Alemanha"];
    return (countries ?? [])
      .filter((country) => !query || country.name.toLocaleLowerCase("pt-BR").includes(query))
      .sort((a, b) => {
        const priorityA = priority.indexOf(a.name);
        const priorityB = priority.indexOf(b.name);
        if (priorityA !== -1 || priorityB !== -1) return (priorityA === -1 ? 99 : priorityA) - (priorityB === -1 ? 99 : priorityB);
        return a.name.localeCompare(b.name, "pt-BR");
      });
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
    <div className="min-h-screen bg-[#020303] text-foreground">
      <Navbar />

      {view === "countries" ? (
        <main className="min-h-[calc(100vh-4rem)] px-4 pb-5 pt-[104px] sm:px-8 sm:pt-[112px] lg:px-10 xl:px-12">
          <div className="mx-auto max-w-[1500px]">
            <div className="mb-5 flex items-end justify-between gap-6 px-1 sm:mb-7">
              <div>
                <h1 className="font-display text-3xl font-bold leading-none tracking-tight text-white sm:text-4xl lg:text-[46px]">Explore o futebol mundial</h1>
                <p className="mt-2 text-sm text-white/55 sm:text-base">Passe o mouse sobre um país para descobrir suas ligas e times</p>
              </div>
              <div className="hidden w-[390px] lg:block">
                <CountrySearch value={countrySearch} onChange={setCountrySearch} />
              </div>
            </div>

            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_390px] xl:gap-7">
              <section className="relative min-w-0">
                <div className="lg:hidden"><CountrySearch value={countrySearch} onChange={setCountrySearch} /></div>
                {loadingCountries ? <div className="h-[440px] animate-pulse rounded-2xl bg-[#07100a] sm:h-[600px]" /> : <InteractiveGlobe countries={countries ?? []} selectedCountryId={selectedCountry?.id} onCountrySelect={selectCountry} />}
              </section>

              <aside className="rounded-[18px] border border-white/[0.13] border-t-2 border-t-primary/80 bg-[#0b0d0c] p-5 shadow-[0_0_35px_rgba(0,0,0,0.22)] sm:p-6">
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">País selecionado</p>
                    <h2 className="mt-2 font-display text-4xl font-bold leading-none text-white sm:text-[44px]">{selectedCountry?.name ?? "Selecione"}</h2>
                    <p className="mt-3 text-sm text-white/45">{loadingLeagues ? "Carregando ligas..." : `${leagues?.length ?? 0} ligas disponíveis`}</p>
                  </div>
                  <span className="text-3xl leading-none" aria-hidden="true">{selectedFlag}</span>
                </div>

                <div className="space-y-2">
                  {(leagues ?? []).slice(0, 4).map((league) => (
                    <button key={league.id} onClick={() => goToTeams(league)} className="group flex w-full items-center gap-3 rounded-xl border border-white/[0.08] bg-[#0f1210] px-3 py-3 text-left transition hover:border-primary/45 hover:bg-[#121914]">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black/20">
                        {league.logoUrl ? <img src={league.logoUrl} alt={league.name} className="h-8 w-8 object-contain" /> : <Trophy className="h-5 w-5 text-white/70" />}
                      </span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-white/85">{league.name}</span><span className="mt-0.5 block text-xs text-white/35">{league.division === 1 ? "1ª Divisão" : `${league.division}ª Divisão`}</span></span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-white/45 transition group-hover:text-primary" />
                    </button>
                  ))}
                  {!loadingLeagues && !leagues?.length && <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-white/40">Nenhuma liga cadastrada para este país.</p>}
                </div>

                <Button onClick={() => goToLeagues()} disabled={!selectedCountry} className="mt-5 h-12 w-full gap-2 rounded-lg bg-primary text-sm font-bold text-black hover:bg-primary/90">Ver times <ArrowRight className="h-4 w-4" /></Button>
                <button type="button" onClick={() => { const random = countries?.[Math.floor(Math.random() * (countries.length || 1))]; if (random) selectCountry(random); }} className="mt-5 flex w-full items-center justify-center gap-2 text-sm font-semibold text-primary/85 transition hover:text-primary"><Shuffle className="h-4 w-4" /> Escolher país aleatório</button>
              </aside>
            </div>

            <div className="mt-5 flex items-center gap-3 overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0a0c0b] px-4 py-3 sm:mt-6 sm:px-5">
              <button type="button" onClick={goToCountries} className="flex shrink-0 items-center gap-2 border-r border-white/10 pr-5 text-sm font-semibold text-white/80"><span>Todos os países</span><ChevronLeft className="h-4 w-4 rotate-90 text-white/55" /></button>
              <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {(filteredCountries.length ? filteredCountries : countries ?? []).map((country) => (
                  <button key={country.id} onClick={() => selectCountry(country)} className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${selectedCountry?.id === country.id ? "border-primary bg-primary/10 text-primary" : "border-white/[0.1] bg-[#101311] text-white/60 hover:border-primary/45 hover:text-white"}`}>
                    <span className="text-base">{countryFlags[country.name] ?? getCountryFlag(country.name)}</span>{country.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>
      ) : (
        <main className="min-h-[calc(100vh-4rem)] px-4 pb-10 pt-8 sm:px-8 lg:px-10 xl:px-12">
          <div className="mx-auto max-w-[1500px]">
            <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-white/10 pb-5">
              <Button variant="ghost" size="icon" onClick={view === "leagues" ? goToCountries : () => setView("leagues")} className="h-9 w-9"><ChevronLeft className="h-4 w-4" /></Button>
              <div className="min-w-0 flex-1"><h1 className="truncate font-display text-3xl font-bold text-white">{view === "leagues" ? `${selectedFlag} ${selectedCountry?.name ?? "Ligas"}` : selectedLeague?.name}</h1><p className="mt-1 text-sm text-white/45"><button onClick={goToCountries} className="hover:text-primary">Países</button>{selectedCountry && ` / ${selectedCountry.name}`}{selectedLeague && ` / ${selectedLeague.name}`}</p></div>
              <div ref={teamSearchRef} className="relative w-full sm:w-[310px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <Input value={teamSearch} onChange={(event) => { setTeamSearch(event.target.value); setShowTeamDropdown(true); }} onFocus={() => teamSearch.length >= 2 && setShowTeamDropdown(true)} placeholder="Buscar time diretamente..." className="border-white/10 bg-[#0d100e] pl-10 text-white placeholder:text-white/30" />
                {teamSearch && <button onClick={() => { setTeamSearch(""); setShowTeamDropdown(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 hover:text-white"><X className="h-4 w-4" /></button>}
                {showTeamDropdown && trimmedTeamSearch.length >= 2 && <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#0c0f0d] shadow-2xl">{searchLoading ? <div className="p-4 text-sm text-white/45">Buscando...</div> : searchResults?.length ? searchResults.map((team) => <button key={team.id} onClick={() => { setShowTeamDropdown(false); setTeamSearch(""); navigate(`/times/${team.id}`); }} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/5"><Trophy className="h-5 w-5 text-primary" /><span className="min-w-0 flex-1 truncate text-sm text-white">{team.name}</span></button>) : <div className="p-4 text-sm text-white/45">Nenhum time encontrado.</div>}</div>}
              </div>
            </div>

            {view === "leagues" && <section><p className="mb-5 text-white/50">Escolha uma liga para ver os times disponíveis.</p>{loadingLeagues ? <div className="space-y-3">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-xl bg-[#0b100d]" />)}</div> : <div className="space-y-3">{leagues?.map((league) => <button key={league.id} onClick={() => goToTeams(league)} className="group flex w-full items-center justify-between rounded-xl border border-white/10 bg-[#0b0e0c] p-5 text-left hover:border-primary/45"><span className="flex items-center gap-4"><span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">{league.logoUrl ? <img src={league.logoUrl} alt={league.name} className="h-10 w-10 object-contain" /> : <Trophy className="h-6 w-6 text-primary" />}</span><span><span className="block font-bold text-white group-hover:text-primary">{league.name}</span><span className="text-xs text-white/40">{league.division === 1 ? "1ª Divisão" : `${league.division}ª Divisão`}</span></span></span><ChevronRight className="h-5 w-5 text-white/35 group-hover:text-primary" /></button>)}</div>}</section>}

            {view === "teams" && <section>{loadingTeams ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-xl bg-[#0b100d]" />)}</div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{teams?.map((team) => <Card key={team.id} onClick={() => navigate(`/times/${team.id}?leagueId=${selectedLeague?.id ?? 0}&countryId=${selectedCountry?.id ?? 0}`)} className="group cursor-pointer border-white/10 bg-[#0b0e0c] hover:border-primary/45"><CardContent className="p-5"><div className="mb-3 flex items-start justify-between"><div className="flex items-center gap-3">{team.logoUrl ? <img src={team.logoUrl} alt={team.name} className="h-10 w-10 object-contain" /> : <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><span className="font-bold text-primary">{team.shortName?.slice(0, 2)}</span></div>}<div className="min-w-0"><p className="truncate font-bold text-white group-hover:text-primary">{team.name}</p><Badge variant="outline" className="mt-0.5 border-primary/30 text-xs text-primary">{team.shortName}</Badge></div></div><PrestigeStars value={team.prestige ?? 5} /></div>{team.stadiumName && <div className="mb-2 flex items-center gap-1.5 text-xs text-white/45"><MapPin className="h-3 w-3" /><span className="truncate">{team.stadiumName}</span></div>}{team.budget != null && <div className="flex items-center gap-1.5 text-xs text-white/45"><Wallet className="h-3 w-3" /><span>Orçamento: <span className="font-semibold text-primary">{formatBudget(team.budget)}</span></span></div>}</CardContent></Card>)}</div>}</section>}
          </div>
        </main>
      )}
    </div>
  );
}

function CountrySearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder="Buscar país..." className="h-11 rounded-full border-white/10 bg-[#111311] pl-11 text-white placeholder:text-white/35 focus:border-primary/60" />
    </div>
  );
}
