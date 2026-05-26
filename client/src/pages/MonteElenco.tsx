import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import TacticalField from "@/components/TacticalField";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Search,
  Users,
  Share2,
  Copy,
  Check,
  Trash2,
  ArrowLeftRight,
  ChevronLeft,
  Plus,
  X,
  Shield,
  RotateCcw,
  Pencil,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SquadMember {
  id: number;
  playerId: number;
  slot: "starter" | "bench";
  order: number;
  name: string;
  position: string;
  altPositions: string | null;
  overall: number;
  potential: number | null;
  age: number | null;
  nationality: string;
  imageUrl: string | null;
  cardType: string;
  price: number | null;
}

function formatPrice(price: number | null | undefined): string {
  if (!price) return '—';
  if (price >= 1_000_000) {
    const m = price / 1_000_000;
    return `€${m % 1 === 0 ? m : m.toFixed(1)}M`;
  }
  if (price >= 1_000) {
    const k = price / 1_000;
    return `€${k % 1 === 0 ? k : k.toFixed(0)}K`;
  }
  return `€${price}`;
}

interface Squad {
  id: number;
  teamId: number;
  teamName: string;
  teamLogoUrl: string | null;
  shareToken: string | null;
  title: string | null;
  members: SquadMember[];
}

// ─── Avatar com fallback de iniciais ────────────────────────────────────────
function PlayerAvatar({ name, imageUrl, className = "w-9 h-9" }: { name: string; imageUrl: string | null; className?: string }) {
  const [imgError, setImgError] = useState(false);
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
  const colors = ['bg-green-700','bg-blue-700','bg-purple-700','bg-red-700','bg-yellow-700','bg-pink-700','bg-indigo-700','bg-teal-700'];
  const color = colors[(name.charCodeAt(0) ?? 0) % colors.length];
  if (!imageUrl || imgError) {
    return (
      <div className={`${className} rounded-full flex-shrink-0 flex items-center justify-center ${color} text-white font-bold text-xs`}>
        {initials}
      </div>
    );
  }
  return (
    <img
      src={imageUrl}
      alt={name}
      className={`${className} rounded-full object-cover bg-zinc-800 flex-shrink-0`}
      onError={() => setImgError(true)}
    />
  );
}

// ─── Card de jogador no elenco ────────────────────────────────────────────────
function PlayerCard({
  member,
  onRemove,
  onMove,
}: {
  member: SquadMember;
  onRemove: (playerId: number) => void;
  onMove: (playerId: number, slot: "starter" | "bench") => void;
}) {
  const otherSlot = member.slot === "starter" ? "bench" : "starter";
  const otherLabel = member.slot === "starter" ? "Reserva" : "Titular";

  return (
    <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 group hover:border-green-500/40 transition-colors">
      {/* Foto */}
      <PlayerAvatar name={member.name} imageUrl={member.imageUrl} className="w-9 h-9" />
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{member.name}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-xs text-zinc-500">{member.position}</span>
          {member.age && <span className="text-xs text-zinc-600">· {member.age} anos</span>}
        </div>
      </div>
      {/* Valor + OVR */}
      <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
        <span className="text-sm font-bold text-green-400">{member.overall}</span>
        {member.price ? <span className="text-xs text-zinc-400">{formatPrice(member.price)}</span> : null}
      </div>
      {/* Ações */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={() => onMove(member.playerId, otherSlot)}
          className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white"
          title={`Mover para ${otherLabel}`}
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onRemove(member.playerId)}
          className="p-1 rounded hover:bg-red-900/40 text-zinc-400 hover:text-red-400"
          title="Remover"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Seletor de time ──────────────────────────────────────────────────────────
function TeamSelector({ onSelect }: { onSelect: (teamId: number, teamName: string) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: results } = trpc.teams.search.useQuery(
    { query },
    { enabled: query.length >= 2 }
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="max-w-md mx-auto" ref={ref}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar time..."
          className="pl-9 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
        />
      </div>
      {open && results && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden">
          {results.map((t) => (
            <button
              key={t.id}
              onClick={() => { onSelect(t.id, t.name); setQuery(""); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 transition-colors text-left"
            >
              {t.logoUrl && (
                <img src={t.logoUrl} alt={t.name} className="w-7 h-7 object-contain flex-shrink-0" />
              )}
              <div>
                <p className="text-sm font-medium text-white">{t.name}</p>
                <p className="text-xs text-zinc-500">{t.leagueName}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Busca de jogadores para adicionar ───────────────────────────────────────
function AddPlayerSearch({
  squadId,
  existingIds,
  onAdded,
}: {
  squadId: number;
  existingIds: Set<number>;
  onAdded: () => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [slot, setSlot] = useState<"starter" | "bench">("bench");
  const ref = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data: results } = trpc.players.search.useQuery(
    { query, limit: 8 },
    { enabled: query.length >= 2 }
  );

  const addPlayer = trpc.squads.addPlayer.useMutation({
    onSuccess: () => {
      utils.squads.getWithPlayers.invalidate({ squadId });
      onAdded();
      setQuery("");
      toast.success("Jogador adicionado!");
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="flex gap-2 mb-2">
        <button
          onClick={() => setSlot("bench")}
          className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${slot === "bench" ? "bg-green-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
        >
          Reserva
        </button>
        <button
          onClick={() => setSlot("starter")}
          className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${slot === "starter" ? "bg-green-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
        >
          Titular
        </button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar jogador para adicionar..."
          className="pl-9 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 text-sm"
        />
      </div>
      {open && results && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden max-h-64 overflow-y-auto">
          {results.map((p) => {
            const already = existingIds.has(p.id);
            return (
              <button
                key={p.id}
                disabled={already || addPlayer.isPending}
                onClick={() => addPlayer.mutate({ squadId, playerId: p.id, slot })}
                className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${already ? "opacity-40 cursor-not-allowed" : "hover:bg-zinc-800"}`}
              >
                <PlayerAvatar name={p.name} imageUrl={p.imageUrl} className="w-8 h-8" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{p.name}</p>
                  <p className="text-xs text-zinc-500">{p.position} · {p.club}</p>
                </div>
                <span className="text-sm font-bold text-green-400">{p.overall}</span>
                {already && <Check className="w-4 h-4 text-green-500 flex-shrink-0" />}
                {!already && <Plus className="w-4 h-4 text-zinc-500 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function MonteElenco() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [squadId, setSquadId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const utils = trpc.useUtils();

  // Buscar elenco atual
  const { data: squad, isLoading: squadLoading } = trpc.squads.getWithPlayers.useQuery(
    { squadId: squadId! },
    { enabled: !!squadId && isAuthenticated }
  );

  // Elencos do usuário
  const { data: mySquads } = trpc.squads.mySquads.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Mutations
  const getOrCreate = trpc.squads.getOrCreate.useMutation({
    onSuccess: (data) => {
      setSquadId(data.id);
    },
    onError: (e) => toast.error(e.message),
  });

  const removePlayer = trpc.squads.removePlayer.useMutation({
    onSuccess: () => {
      utils.squads.getWithPlayers.invalidate({ squadId: squadId! });
      toast.success("Jogador removido");
    },
    onError: (e) => toast.error(e.message),
  });

  const movePlayer = trpc.squads.movePlayer.useMutation({
    onSuccess: () => {
      utils.squads.getWithPlayers.invalidate({ squadId: squadId! });
    },
    onError: (e) => toast.error(e.message),
  });

  const shareMutation = trpc.squads.share.useMutation({
    onSuccess: (data) => {
      const url = `${window.location.origin}/elenco/${data.token}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      utils.squads.getWithPlayers.invalidate({ squadId: squadId! });
      toast.success("Link copiado para a área de transferência!");
    },
    onError: (e) => toast.error(e.message),
  });

  const renameMutation = trpc.squads.rename.useMutation({
    onSuccess: () => {
      utils.squads.getWithPlayers.invalidate({ squadId: squadId! });
      utils.squads.mySquads.invalidate();
      setShowTitleModal(false);
      toast.success("Título atualizado!");
    },
    onError: (e) => toast.error(e.message),
  });
  const resetMutation = trpc.squads.reset.useMutation({
    onSuccess: () => {
      utils.squads.getWithPlayers.invalidate({ squadId: squadId! });
      setShowResetConfirm(false);
      toast.success("Elenco resetado para o original do time!");
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteSquad = trpc.squads.delete.useMutation({
    onSuccess: () => {
      setSquadId(null);
      utils.squads.mySquads.invalidate();
      toast.success("Elenco deletado");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSelectTeam = useCallback((teamId: number) => {
    getOrCreate.mutate({ teamId });
  }, [getOrCreate]);

  const handleShare = useCallback(() => {
    if (!squadId) return;
    if (squad?.shareToken) {
      const url = `${window.location.origin}/elenco/${squad.shareToken}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      toast.success("Link copiado!");
    } else {
      shareMutation.mutate({ squadId });
    }
  }, [squadId, squad, shareMutation]);

  // Auth guard
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 px-4">
        <Shield className="w-16 h-16 text-green-500" />
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Faça login para montar seu elenco</h2>
          <p className="text-zinc-400">Crie e salve elencos personalizados dos seus times favoritos.</p>
        </div>
        <Button
          onClick={() => window.location.href = getLoginUrl()}
          className="bg-green-600 hover:bg-green-500 text-white"
        >
          Entrar com Manus
        </Button>
      </div>
    );
  }

  const starters = squad?.members.filter((m) => m.slot === "starter") ?? [];
  const bench = squad?.members.filter((m) => m.slot === "bench") ?? [];
  const existingIds = new Set(squad?.members.map((m) => m.playerId) ?? []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          {squadId ? (
            <button
              onClick={() => setSquadId(null)}
              className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title="Voltar para meus elencos"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => window.history.back()}
              className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title="Voltar"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-white">Monte seu Elenco</h1>
            {squad && (
              <p className="text-sm text-zinc-400 flex items-center gap-2">
                {squad.teamLogoUrl && (
                  <img src={squad.teamLogoUrl} alt="" className="w-4 h-4 object-contain inline" />
                )}
                {squad.teamName}
              </p>
            )}
          </div>
          {squad && (
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setTitleInput(squad.title ?? squad.teamName); setShowTitleModal(true); }}
                className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 gap-2"
              >
                <Pencil className="w-4 h-4" />
                <span className="hidden sm:inline">Renomear</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResetConfirm(true)}
                className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Resetar</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                disabled={shareMutation.isPending}
                className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 gap-2"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
                <span className="hidden sm:inline">{copied ? "Copiado!" : "Compartilhar"}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteSquad.mutate({ squadId: squad.id })}
                className="border-red-900/50 text-red-400 hover:bg-red-900/20 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Renomear elenco */}
      {showTitleModal && squad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-sm space-y-4">
            <h2 className="text-lg font-bold text-white">Renomear elenco</h2>
            <Input
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder="Nome do elenco..."
              className="bg-zinc-800 border-zinc-700 text-white"
              maxLength={128}
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter' && titleInput.trim()) renameMutation.mutate({ squadId: squad.id, title: titleInput.trim() }); }}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowTitleModal(false)} className="border-zinc-700 text-zinc-400">
                Cancelar
              </Button>
              <Button
                size="sm"
                disabled={!titleInput.trim() || renameMutation.isPending}
                onClick={() => renameMutation.mutate({ squadId: squad.id, title: titleInput.trim() })}
                className="bg-green-600 hover:bg-green-500 text-white"
              >
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar reset */}
      {showResetConfirm && squad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-sm space-y-4">
            <h2 className="text-lg font-bold text-white">Resetar elenco?</h2>
            <p className="text-sm text-zinc-400">
              Isso vai remover todas as suas alterações e restaurar o elenco original do <span className="text-white font-medium">{squad.teamName}</span>. Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowResetConfirm(false)} className="border-zinc-700 text-zinc-400">
                Cancelar
              </Button>
              <Button
                size="sm"
                disabled={resetMutation.isPending}
                onClick={() => resetMutation.mutate({ squadId: squad.id })}
                className="bg-red-700 hover:bg-red-600 text-white"
              >
                {resetMutation.isPending ? 'Resetando...' : 'Resetar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Seleção de time */}
        {!squadId && (
          <div className="space-y-8">
            {/* Busca */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 mb-2">
                <Users className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold">Escolha um time</h2>
              <p className="text-zinc-400 max-w-md mx-auto">
                Selecione um clube para montar seu elenco ideal. O time já virá com os jogadores atuais cadastrados.
              </p>
              <div className="relative">
                <TeamSelector onSelect={handleSelectTeam} />
              </div>
              {getOrCreate.isPending && (
                <p className="text-sm text-zinc-500 animate-pulse">Carregando elenco...</p>
              )}
            </div>

            {/* Elencos salvos */}
            {mySquads && mySquads.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                  Seus elencos salvos
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {mySquads.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSquadId(s.id)}
                      className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-green-500/40 transition-colors text-left"
                    >
                      {s.teamLogoUrl ? (
                        <img src={s.teamLogoUrl} alt={s.teamName} className="w-10 h-10 object-contain flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                          <Shield className="w-5 h-5 text-zinc-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">{s.teamName}</p>
                        <p className="text-xs text-zinc-500">
                          {s.title || "Elenco personalizado"}
                          {s.shareToken && (
                            <span className="ml-2 text-green-500">· Compartilhado</span>
                          )}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Editor do elenco */}
        {squadId && (
          <div>
            {squadLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : squad ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coluna esquerda: campo tático + titulares + reservas */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Campo tático */}
                  {starters.length > 0 && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                      <h3 className="font-semibold text-white mb-3 text-sm">Campo Tático</h3>
                      <TacticalField
                        players={starters.map((m) => ({
                          id: m.id,
                          name: m.name,
                          position: m.position,
                          overall: m.overall,
                          imageUrl: m.imageUrl,
                        }))}
                        showFormationPicker
                      />
                    </div>
                  )}
                  {/* Titulares */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                        Titulares
                        <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 text-xs">
                          {starters.length}
                        </Badge>
                      </h3>
                    </div>
                    {starters.length === 0 ? (
                      <div className="border border-dashed border-zinc-800 rounded-xl p-8 text-center text-zinc-600 text-sm">
                        Nenhum titular ainda. Adicione jogadores ao lado.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {starters.map((m) => (
                          <PlayerCard
                            key={m.id}
                            member={m}
                            onRemove={(pid) => removePlayer.mutate({ squadId: squad.id, playerId: pid })}
                            onMove={(pid, slot) => movePlayer.mutate({ squadId: squad.id, playerId: pid, slot })}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Reservas */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-zinc-500 inline-block" />
                        Reservas
                        <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 text-xs">
                          {bench.length}
                        </Badge>
                      </h3>
                    </div>
                    {bench.length === 0 ? (
                      <div className="border border-dashed border-zinc-800 rounded-xl p-8 text-center text-zinc-600 text-sm">
                        Nenhum reserva ainda.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {bench.map((m) => (
                          <PlayerCard
                            key={m.id}
                            member={m}
                            onRemove={(pid) => removePlayer.mutate({ squadId: squad.id, playerId: pid })}
                            onMove={(pid, slot) => movePlayer.mutate({ squadId: squad.id, playerId: pid, slot })}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Coluna direita: adicionar jogadores */}
                <div className="space-y-4">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                    <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                      <Plus className="w-4 h-4 text-green-500" />
                      Adicionar jogador
                    </h3>
                    <AddPlayerSearch
                      squadId={squad.id}
                      existingIds={existingIds}
                      onAdded={() => {}}
                    />
                    <p className="text-xs text-zinc-600 mt-3">
                      Escolha se o jogador entra como titular ou reserva antes de buscar.
                    </p>
                  </div>

                  {/* Stats rápidas */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
                    <h3 className="font-semibold text-white text-sm">Resumo do elenco</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-zinc-800 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-green-400">{squad.members.length}</p>
                        <p className="text-xs text-zinc-500">Jogadores</p>
                      </div>
                      <div className="bg-zinc-800 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-white">
                          {squad.members.length > 0
                            ? Math.round(squad.members.reduce((a, m) => a + m.overall, 0) / squad.members.length)
                            : "—"}
                        </p>
                        <p className="text-xs text-zinc-500">OVR Médio</p>
                      </div>
                    </div>
                    {/* Valor total do elenco */}
                    <div className="bg-zinc-800 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-yellow-400">
                        {(() => {
                          const total = squad.members.reduce((sum, m) => sum + (m.price ?? 0), 0);
                          if (total === 0) return '—';
                          if (total >= 1_000_000_000) return `€${(total / 1_000_000_000).toFixed(1)}B`;
                          if (total >= 1_000_000) return `€${(total / 1_000_000).toFixed(0)}M`;
                          if (total >= 1_000) return `€${(total / 1_000).toFixed(0)}K`;
                          return `€${total}`;
                        })()}
                      </p>
                      <p className="text-xs text-zinc-500">Valor Total do Elenco</p>
                    </div>
                    {squad.shareToken && (
                      <div className="mt-2">
                        <p className="text-xs text-zinc-500 mb-1">Link público:</p>
                        <div className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-2">
                          <p className="text-xs text-zinc-400 truncate flex-1">
                            {window.location.origin}/elenco/{squad.shareToken}
                          </p>
                          <button
                            onClick={handleShare}
                            className="text-zinc-400 hover:text-white flex-shrink-0"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
