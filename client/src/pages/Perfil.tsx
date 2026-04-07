import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { User, Edit3, Save, X, Lock, ArrowRight, Heart, Star } from "lucide-react";
import { Link } from "wouter";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663216916845/hhB4oykfDQM9yCvhQGaX3n/logo-futnerds_8f14a724.png";

export default function Perfil() {
  const { user, isAuthenticated, loading } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ username: "", bio: "", favoriteTeam: "" });

  const { data: profile } = trpc.user.profile.useQuery(undefined, { enabled: isAuthenticated });
  const { data: favoriteTeams } = trpc.teams.favorites.useQuery(undefined, { enabled: isAuthenticated });
  const { data: favoritePlayers } = trpc.players.favorites.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();
  const removeFavTeam = trpc.teams.removeFavorite.useMutation({ onSuccess: () => utils.teams.favorites.invalidate() });
  const removeFavPlayer = trpc.players.removeFavorite.useMutation({ onSuccess: () => utils.players.favorites.invalidate() });

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Perfil atualizado com sucesso!");
      setEditing(false);
      utils.user.profile.invalidate();
    },
    onError: () => toast.error("Erro ao atualizar perfil"),
  });

  const startEditing = () => {
    setForm({
      username: profile?.username ?? "",
      bio: profile?.bio ?? "",
      favoriteTeam: profile?.favoriteTeam ?? "",
    });
    setEditing(true);
  };

  const handleSave = () => {
    updateProfile.mutate(form);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 pt-20 flex items-center justify-center">
          <img src={LOGO_URL} alt="FUTNERDS" className="h-16 w-16 animate-pulse object-contain" />
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 pt-20 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6 py-20">
            <div className="inline-flex p-4 rounded-full bg-primary/10 mb-6">
              <Lock className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-3xl font-black mb-3">Faça Login</h2>
            <p className="text-muted-foreground mb-8">
              Você precisa estar logado para acessar seu perfil.
            </p>
            <Button size="lg" className="bg-primary text-primary-foreground w-full h-12" asChild>
              <a href={getLoginUrl()}>Entrar <ArrowRight className="ml-2 h-5 w-5" /></a>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-20">
        <section className="py-8 sm:py-12 border-b border-border/50" style={{ background: "oklch(0.12 0.01 240)" }}>
          <div className="container">
            <div className="flex items-center gap-3 mb-2">
              <User className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <h1 className="text-2xl sm:text-4xl font-black">Meu Perfil</h1>
            </div>
            <p className="text-muted-foreground text-sm sm:text-base">Gerencie suas informações e preferências</p>
          </div>
        </section>

        <div className="container py-10">
          <div className="max-w-2xl mx-auto space-y-8">

            {/* Times Favoritos */}
            {favoriteTeams && favoriteTeams.length > 0 && (
              <div className="fut-card p-4 sm:p-6">
                <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                  Times Favoritos
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {favoriteTeams.map((team: any) => (
                    <div key={team.teamId} className="relative group">
                      <Link href={`/times/${team.teamId}`}>
                        <div className="fut-card fut-card-hover p-3 text-center cursor-pointer">
                          <div className="w-10 h-10 mx-auto mb-2 flex items-center justify-center">
                            {team.logoUrl ? (
                              <img src={team.logoUrl} alt={team.name} className="w-full h-full object-contain" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="text-sm font-black text-primary">{team.name?.charAt(0)}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs font-bold truncate">{team.name}</p>
                          {team.leagueName && <p className="text-[10px] text-muted-foreground truncate">{team.leagueName}</p>}
                        </div>
                      </Link>
                      <button
                        onClick={() => removeFavTeam.mutate({ teamId: team.teamId })}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 rounded-full p-0.5 hover:text-red-400"
                        title="Remover favorito"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Jogadores Favoritos */}
            {favoritePlayers && favoritePlayers.length > 0 && (
              <div className="fut-card p-4 sm:p-6">
                <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  Jogadores Favoritos
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {favoritePlayers.map((player: any) => (
                    <div key={player.playerId} className="relative group flex items-center gap-3 fut-card p-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex-shrink-0 overflow-hidden flex items-center justify-center">
                        {player.imageUrl ? (
                          <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover object-top" />
                        ) : (
                          <User className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{player.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{player.club} · {player.position}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-primary">{player.overall}</p>
                        <p className="text-[10px] text-muted-foreground">OVR</p>
                      </div>
                      <button
                        onClick={() => removeFavPlayer.mutate({ playerId: player.playerId })}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 rounded-full p-0.5 hover:text-red-400"
                        title="Remover favorito"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="fut-card p-4 sm:p-8">
              {/* Avatar + Name */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-border/50">
                <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-primary/40 self-start sm:self-auto">
                  <AvatarImage src={user?.avatar ?? undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary text-2xl font-black">
                    {user?.name?.charAt(0).toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-black">{user?.name ?? "Usuário"}</h2>
                  <p className="text-muted-foreground text-sm">{user?.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <img src={LOGO_URL} alt="" className="h-4 w-4 object-contain" />
                    <span className="text-xs text-primary font-semibold">Membro FUTNERDS</span>
                  </div>
                </div>
                <div className="sm:ml-auto self-start">
                  {!editing ? (
                    <Button variant="outline" size="sm" onClick={startEditing}>
                      <Edit3 className="h-4 w-4 mr-2" /> Editar
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSave} disabled={updateProfile.isPending}
                        className="bg-primary text-primary-foreground">
                        <Save className="h-4 w-4 mr-2" /> Salvar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Fields */}
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                    Nome de usuário
                  </label>
                  {editing ? (
                    <Input
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      placeholder="Seu username"
                      className="bg-secondary border-border"
                    />
                  ) : (
                    <p className="text-foreground">{profile?.username || <span className="text-muted-foreground italic">Não definido</span>}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                    Bio
                  </label>
                  {editing ? (
                    <Input
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      placeholder="Fale um pouco sobre você..."
                      className="bg-secondary border-border"
                    />
                  ) : (
                    <p className="text-foreground">{profile?.bio || <span className="text-muted-foreground italic">Não definido</span>}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                    Time favorito
                  </label>
                  {editing ? (
                    <Input
                      value={form.favoriteTeam}
                      onChange={(e) => setForm({ ...form, favoriteTeam: e.target.value })}
                      placeholder="Ex: Real Madrid, Barcelona..."
                      className="bg-secondary border-border"
                    />
                  ) : (
                    <p className="text-foreground">{profile?.favoriteTeam || <span className="text-muted-foreground italic">Não definido</span>}</p>
                  )}
                </div>

                <div className="pt-4 border-t border-border/50">
                  <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                    Membro desde
                  </label>
                  <p className="text-foreground">
                    {profile?.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
