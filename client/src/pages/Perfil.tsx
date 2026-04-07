import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  User, Edit3, Save, X, Lock, ArrowRight, Heart, Star,
  Trophy, Users, Calendar, Shield, Zap, Camera
} from "lucide-react";
import { Link } from "wouter";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663216916845/hhB4oykfDQM9yCvhQGaX3n/logo-futnerds_8f14a724.png";

function getBadge(favoriteTeamsCount: number, favoritePlayersCount: number) {
  const total = favoriteTeamsCount + favoritePlayersCount;
  if (total >= 20) return { label: "Técnico Elite", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/30", icon: Trophy };
  if (total >= 10) return { label: "Analista", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/30", icon: Zap };
  if (total >= 3) return { label: "Scout", color: "text-primary", bg: "bg-primary/10 border-primary/30", icon: Shield };
  return { label: "Nerd Iniciante", color: "text-muted-foreground", bg: "bg-muted/20 border-border", icon: Users };
}

export default function Perfil() {
  const { user, isAuthenticated, loading } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ username: "", bio: "", favoriteTeam: "" });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const { data: profile } = trpc.user.profile.useQuery(undefined, { enabled: isAuthenticated });
  const { data: favoriteTeams } = trpc.teams.favorites.useQuery(undefined, { enabled: isAuthenticated });
  const { data: favoritePlayers } = trpc.players.favorites.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();
  const removeFavTeam = trpc.teams.removeFavorite.useMutation({ onSuccess: () => utils.teams.favorites.invalidate() });
  const removeFavPlayer = trpc.players.removeFavorite.useMutation({ onSuccess: () => utils.players.favorites.invalidate() });

  const uploadAvatar = trpc.user.uploadAvatar.useMutation({
    onSuccess: (data) => {
      setAvatarPreview(data.url);
      utils.user.profile.invalidate();
      toast.success("Foto de perfil atualizada!");
      setUploadingAvatar(false);
    },
    onError: () => {
      toast.error("Erro ao atualizar foto de perfil");
      setUploadingAvatar(false);
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 5MB.");
      return;
    }
    setUploadingAvatar(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      uploadAvatar.mutate({ base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

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

  const teamsCount = favoriteTeams?.length ?? 0;
  const playersCount = favoritePlayers?.length ?? 0;
  const badge = getBadge(teamsCount, playersCount);
  const BadgeIcon = badge.icon;
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-16">

        {/* Banner + Avatar Hero */}
        <div className="relative">
          {/* Banner */}
          <div
            className="h-36 sm:h-48 w-full"
            style={{
              background: "linear-gradient(135deg, oklch(0.18 0.06 140) 0%, oklch(0.12 0.03 240) 50%, oklch(0.10 0.01 240) 100%)",
              backgroundImage: `linear-gradient(135deg, oklch(0.18 0.06 140) 0%, oklch(0.12 0.03 240) 60%, oklch(0.10 0.01 240) 100%), repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.03) 39px, rgba(255,255,255,0.03) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.03) 39px, rgba(255,255,255,0.03) 40px)`,
            }}
          />

          {/* Avatar flutuando sobre o banner */}
          <div className="container">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-16 pb-4 sm:pb-6">
              <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background ring-2 ring-primary/40 shadow-xl">
                  <AvatarImage src={avatarPreview ?? profile?.avatar ?? user?.avatar ?? undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary text-3xl sm:text-4xl font-black">
                    {user?.name?.charAt(0).toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                {/* Overlay de câmera ao hover */}
                <div className={`absolute inset-0 rounded-full flex items-center justify-center transition-opacity ${
                  uploadingAvatar ? "bg-black/60 opacity-100" : "bg-black/50 opacity-0 group-hover:opacity-100"
                }`}>
                  {uploadingAvatar
                    ? <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Camera className="h-7 w-7 text-white" />
                  }
                </div>
                {/* Badge indicator */}
                <div className={`absolute -bottom-1 -right-1 rounded-full border p-1.5 ${badge.bg}`}>
                  <BadgeIcon className={`h-3.5 w-3.5 ${badge.color}`} />
                </div>
              </div>

              <div className="flex-1 min-w-0 pb-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-black leading-tight">
                      {profile?.username || user?.name || "Usuário"}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${badge.bg} ${badge.color}`}>
                        <BadgeIcon className="h-3 w-3" />
                        {badge.label}
                      </span>
                      {memberSince && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Membro desde {memberSince}
                        </span>
                      )}
                    </div>
                  </div>
                  {!editing ? (
                    <Button variant="outline" size="sm" onClick={startEditing} className="self-start sm:self-auto">
                      <Edit3 className="h-4 w-4 mr-2" /> Editar Perfil
                    </Button>
                  ) : (
                    <div className="flex gap-2 self-start sm:self-auto">
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
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Coluna esquerda: Info do perfil */}
            <div className="lg:col-span-1 space-y-4">
              <div className="fut-card p-5">
                <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                  <User className="h-4 w-4" /> Informações
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Nome de usuário
                    </label>
                    {editing ? (
                      <Input
                        value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                        placeholder="Seu username"
                        className="bg-secondary border-border h-9 text-sm"
                      />
                    ) : (
                      <p className="text-sm text-foreground">{profile?.username || <span className="text-muted-foreground italic text-xs">Não definido</span>}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Bio
                    </label>
                    {editing ? (
                      <Input
                        value={form.bio}
                        onChange={(e) => setForm({ ...form, bio: e.target.value })}
                        placeholder="Fale um pouco sobre você..."
                        className="bg-secondary border-border h-9 text-sm"
                      />
                    ) : (
                      <p className="text-sm text-foreground">{profile?.bio || <span className="text-muted-foreground italic text-xs">Não definido</span>}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Time favorito
                    </label>
                    {editing ? (
                      <Input
                        value={form.favoriteTeam}
                        onChange={(e) => setForm({ ...form, favoriteTeam: e.target.value })}
                        placeholder="Ex: Real Madrid, Barcelona..."
                        className="bg-secondary border-border h-9 text-sm"
                      />
                    ) : (
                      <p className="text-sm text-foreground">{profile?.favoriteTeam || <span className="text-muted-foreground italic text-xs">Não definido</span>}</p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold">Email:</span> {user?.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Badge card */}
              <div className={`fut-card p-5 border ${badge.bg}`}>
                <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <Trophy className="h-4 w-4" /> Conquista
                </h3>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl border ${badge.bg}`}>
                    <BadgeIcon className={`h-6 w-6 ${badge.color}`} />
                  </div>
                  <div>
                    <p className={`font-black text-base ${badge.color}`}>{badge.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {teamsCount + playersCount < 3
                        ? `Favorite ${3 - (teamsCount + playersCount)} item(s) para evoluir`
                        : teamsCount + playersCount < 10
                        ? `Favorite ${10 - (teamsCount + playersCount)} item(s) para evoluir`
                        : teamsCount + playersCount < 20
                        ? `Favorite ${20 - (teamsCount + playersCount)} item(s) para evoluir`
                        : "Nível máximo atingido!"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna direita: Favoritos */}
            <div className="lg:col-span-2 space-y-6">

              {/* Times Favoritos */}
              <div className="fut-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500 fill-red-500" /> Times Favoritos
                  </h3>
                  <Button variant="ghost" size="sm" asChild className="text-xs h-7">
                    <Link href="/times">Explorar <ArrowRight className="ml-1 h-3 w-3" /></Link>
                  </Button>
                </div>
                {favoriteTeams && favoriteTeams.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {favoriteTeams.map((team: any) => {
                      const logoUrl = team.teamLogoUrl ?? team.logoUrl;
                      const teamName = team.teamName ?? team.name;
                      const leagueLogo = team.leagueLogoUrl;
                      const leagueName = team.leagueName;
                      const prestige = team.prestige;
                      return (
                        <div key={team.teamId} className="relative">
                          {/* Botão remover — fora do Link, sempre visível */}
                          <button
                            onClick={() => removeFavTeam.mutate({ teamId: team.teamId })}
                            className="absolute top-1.5 right-1.5 z-10 bg-background/90 rounded-full p-1 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 border border-border/60 transition-colors"
                            title="Remover favorito"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          <Link href={`/times/${team.teamId}`}>
                            <div className="fut-card fut-card-hover p-3 text-center cursor-pointer transition-all">
                              {/* Logo do time */}
                              <div className="w-14 h-14 mx-auto mb-2 flex items-center justify-center">
                                {logoUrl ? (
                                  <img src={logoUrl} alt={teamName} className="w-full h-full object-contain" />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                                    <span className="text-base font-black text-primary">{teamName?.charAt(0)}</span>
                                  </div>
                                )}
                              </div>
                              <p className="text-xs font-bold truncate">{teamName}</p>
                              {/* Liga com logo */}
                              {leagueName && (
                                <div className="flex items-center justify-center gap-1 mt-1">
                                  {leagueLogo && <img src={leagueLogo} alt={leagueName} className="w-3.5 h-3.5 object-contain" />}
                                  <p className="text-[10px] text-muted-foreground truncate">{leagueName}</p>
                                </div>
                              )}
                              {/* Prestígio */}
                              {prestige != null && (
                                <div className="flex items-center justify-center gap-0.5 mt-1">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <span key={i} className={`text-[10px] ${i < prestige ? 'text-yellow-400' : 'text-muted-foreground/30'}`}>★</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Heart className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nenhum time favoritado ainda</p>
                    <Button variant="ghost" size="sm" asChild className="mt-2 text-primary text-xs">
                      <Link href="/times">Explorar times</Link>
                    </Button>
                  </div>
                )}
              </div>

              {/* Jogadores Favoritos */}
              <div className="fut-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" /> Jogadores Favoritos
                  </h3>
                  <Button variant="ghost" size="sm" asChild className="text-xs h-7">
                    <Link href="/jogadores">Explorar <ArrowRight className="ml-1 h-3 w-3" /></Link>
                  </Button>
                </div>
                {favoritePlayers && favoritePlayers.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {favoritePlayers.map((fav: any) => {
                      const p = fav.player || fav;
                      const overall = p.overall ?? fav.overall;
                      const name = p.name ?? fav.name;
                      const position = p.position ?? fav.position;
                      const club = p.club ?? fav.club;
                      const clubLogoUrl = p.clubLogoUrl ?? fav.clubLogoUrl;
                      const imageUrl = p.imageUrl ?? fav.imageUrl;
                      const nationality = p.nationality ?? fav.nationality;
                      const age = p.age ?? fav.age;
                      const playerId = fav.playerId ?? p.id;
                      return (
                        <div key={playerId} className="relative group flex items-center gap-3 rounded-xl border border-border/50 bg-card/50 p-3 hover:border-primary/30 transition-colors">
                          {/* Foto do jogador */}
                          <div className="w-14 h-14 rounded-lg bg-primary/10 flex-shrink-0 overflow-hidden flex items-center justify-center border border-border/50">
                            {imageUrl ? (
                              <img src={imageUrl} alt={name} className="w-full h-full object-cover object-top" />
                            ) : (
                              <User className="h-6 w-6 text-primary/60" />
                            )}
                          </div>
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">{name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {clubLogoUrl && (
                                <img src={clubLogoUrl} alt={club} className="w-4 h-4 object-contain flex-shrink-0" />
                              )}
                              <p className="text-xs text-muted-foreground truncate">{club}</p>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary">{position}</span>
                              {nationality && <span className="text-[10px] text-muted-foreground">{nationality}</span>}
                              {age && <span className="text-[10px] text-muted-foreground">{age} anos</span>}
                            </div>
                          </div>
                          {/* Overall */}
                          <div className="text-right shrink-0 mr-5">
                            <p className="text-xl font-black text-primary leading-none">{overall}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">OVR</p>
                          </div>
                          <button
                            onClick={() => removeFavPlayer.mutate({ playerId })}
                            className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 rounded-full p-1 hover:text-red-400 border border-border/50"
                            title="Remover favorito"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Star className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nenhum jogador favoritado ainda</p>
                    <Button variant="ghost" size="sm" asChild className="mt-2 text-primary text-xs">
                      <Link href="/jogadores">Explorar jogadores</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
