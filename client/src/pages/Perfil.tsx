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
import { User, Edit3, Save, X, Lock, ArrowRight } from "lucide-react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663216916845/hhB4oykfDQM9yCvhQGaX3n/logo-futnerds_8f14a724.png";

export default function Perfil() {
  const { user, isAuthenticated, loading } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ username: "", bio: "", favoriteTeam: "" });

  const { data: profile } = trpc.user.profile.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();

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
        <section className="py-12 border-b border-border/50" style={{ background: "oklch(0.12 0.01 240)" }}>
          <div className="container">
            <div className="flex items-center gap-3 mb-2">
              <User className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-black">Meu Perfil</h1>
            </div>
            <p className="text-muted-foreground">Gerencie suas informações e preferências</p>
          </div>
        </section>

        <div className="container py-10">
          <div className="max-w-2xl mx-auto">
            <div className="fut-card p-8">
              {/* Avatar + Name */}
              <div className="flex items-center gap-5 mb-8 pb-8 border-b border-border/50">
                <Avatar className="h-20 w-20 border-2 border-primary/40">
                  <AvatarImage src={user?.avatar ?? undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary text-2xl font-black">
                    {user?.name?.charAt(0).toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-black">{user?.name ?? "Usuário"}</h2>
                  <p className="text-muted-foreground text-sm">{user?.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <img src={LOGO_URL} alt="" className="h-4 w-4 object-contain" />
                    <span className="text-xs text-primary font-semibold">Membro FUTNERDS</span>
                  </div>
                </div>
                <div className="ml-auto">
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
