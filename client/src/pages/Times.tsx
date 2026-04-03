import { useState } from "react";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Trophy, MapPin, Wallet, Star } from "lucide-react";
import { useLocation } from "wouter";

// Country flag emojis map
const countryFlags: Record<string, string> = {
  "Espanha": "🇪🇸",
  "Inglaterra": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "Itália": "🇮🇹",
  "Alemanha": "🇩🇪",
  "França": "🇫🇷",
  "Portugal": "🇵🇹",
  "Arábia Saudita": "🇸🇦",
  "Holanda": "🇳🇱",
};

// Prestige stars helper
function PrestigeStars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i < Math.round(value / 2) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

// Budget formatter
function formatBudget(millions: number) {
  if (millions >= 1000) return `€${(millions / 1000).toFixed(1)}B`;
  return `€${millions}M`;
}

type View = "countries" | "leagues" | "teams";

export default function Times() {
  const [view, setView] = useState<View>("countries");
  const [selectedCountry, setSelectedCountry] = useState<{ id: number; name: string } | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<{ id: number; name: string; division: number; logoUrl?: string | null } | null>(null);
  const [, navigate] = useLocation();

  const { data: countries, isLoading: loadingCountries } = trpc.countries.list.useQuery();
  const { data: leagues, isLoading: loadingLeagues } = trpc.leagues.byCountry.useQuery(
    { countryId: selectedCountry?.id ?? 0 },
    { enabled: !!selectedCountry }
  );
  const { data: teams, isLoading: loadingTeams } = trpc.teams.byLeague.useQuery(
    { leagueId: selectedLeague?.id ?? 0 },
    { enabled: !!selectedLeague }
  );

  function goToCountries() {
    setView("countries");
    setSelectedCountry(null);
    setSelectedLeague(null);
  }

  function goToLeagues(country: { id: number; name: string }) {
    setSelectedCountry(country);
    setSelectedLeague(null);
    setView("leagues");
  }

  function goToTeams(league: { id: number; name: string; division: number; logoUrl?: string | null }) {
    setSelectedLeague(league);
    setView("teams");
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-16 z-10">
        <div className="container py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={
                view === "countries"
                  ? () => navigate("/")
                  : view === "leagues"
                  ? goToCountries
                  : () => setView("leagues")
              }
              className="shrink-0"
              title="Voltar"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Trophy className="w-6 h-6 text-primary" />
                {view === "countries" && "Escolha um País"}
                {view === "leagues" && (
                  <span>
                    {countryFlags[selectedCountry?.name ?? ""] ?? ""} {selectedCountry?.name}
                  </span>
                )}
                {view === "teams" && (
                  <span className="flex items-center gap-2">
                    {selectedLeague?.logoUrl ? (
                      <img src={selectedLeague.logoUrl} alt={selectedLeague.name} className="w-7 h-7 object-contain" />
                    ) : null}
                    {selectedLeague?.name}
                  </span>
                )}
              </h1>
              {/* Breadcrumb */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <button onClick={goToCountries} className="hover:text-primary transition-colors">Países</button>
                {selectedCountry && (
                  <>
                    <span>/</span>
                    <button onClick={() => setView("leagues")} className="hover:text-primary transition-colors">
                      {selectedCountry.name}
                    </button>
                  </>
                )}
                {selectedLeague && (
                  <>
                    <span>/</span>
                    <span className="text-foreground">{selectedLeague.name}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">

        {/* ── COUNTRIES VIEW ── */}
        {view === "countries" && (
          <>
            <p className="text-muted-foreground mb-6">
              Selecione um país para explorar as ligas e times disponíveis para o modo carreira.
            </p>
            {loadingCountries ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {countries?.map((country) => (
                  <button
                    key={country.id}
                    onClick={() => goToLeagues(country)}
                    className="group relative overflow-hidden rounded-xl border border-border/50 bg-card hover:border-primary/50 hover:bg-card/80 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10 p-4 text-center"
                  >
                    {/* Placeholder for country image - will be replaced when user sends images */}
                    {country.imageUrl ? (
                      <img
                        src={country.imageUrl}
                        alt={country.name}
                        className="w-full h-36 object-contain rounded-lg mb-3"
                      />
                    ) : (
                      <div className="w-full h-36 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-3 group-hover:from-primary/30 transition-all">
                        <span className="text-5xl">{countryFlags[country.name] ?? "🌍"}</span>
                      </div>
                    )}
                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">
                      {country.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── LEAGUES VIEW ── */}
        {view === "leagues" && (
          <>
            <p className="text-muted-foreground mb-6">
              Escolha uma liga para ver os times disponíveis.
            </p>
            {loadingLeagues ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {leagues?.map((league) => (
                  <button
                    key={league.id}
                    onClick={() => goToTeams(league)}
                    className="group flex items-center justify-between rounded-xl border border-border/50 bg-card hover:border-primary/50 hover:bg-card/80 transition-all duration-200 hover:shadow-md hover:shadow-primary/10 p-5 text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 group-hover:from-primary/30 transition-all overflow-hidden">
                        {league.logoUrl ? (
                          <img src={league.logoUrl} alt={league.name} className="w-10 h-10 object-contain" />
                        ) : (
                          <Trophy className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-foreground group-hover:text-primary transition-colors">
                          {league.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {league.division === 1 ? "1ª Divisão" : `${league.division}ª Divisão`}
                        </p>
                      </div>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-muted-foreground rotate-180 group-hover:text-primary transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── TEAMS VIEW ── */}
        {view === "teams" && (
          <>

            {loadingTeams ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-36 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {teams?.map((team) => (
                  <Card
                    key={team.id}
                    onClick={() => navigate(`/times/${team.id}`)}
                    className="group border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 cursor-pointer hover:scale-[1.01]"
                  >
                    <CardContent className="p-5">
                      {/* Team header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {team.logoUrl ? (
                            <img src={team.logoUrl} alt={team.name} className="w-10 h-10 object-contain" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                              <span className="text-lg font-bold text-primary">{team.shortName?.slice(0, 2)}</span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-foreground group-hover:text-primary transition-colors leading-tight truncate">
                              {team.name}
                            </p>
                            <Badge variant="outline" className="text-xs mt-0.5 border-primary/30 text-primary">
                              {team.shortName}
                            </Badge>
                          </div>
                        </div>
                        <PrestigeStars value={team.prestige ?? 5} />
                      </div>

                      {/* Stadium */}
                      {team.stadiumName && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{team.stadiumName}</span>
                        </div>
                      )}

                      {/* Budget */}
                      {team.budget != null && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Wallet className="w-3 h-3 shrink-0" />
                          <span>Orçamento: <span className="text-green-400 font-semibold">{formatBudget(team.budget)}</span></span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
