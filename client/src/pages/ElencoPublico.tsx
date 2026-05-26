import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Users, ArrowLeft } from "lucide-react";
import TacticalField from "@/components/TacticalField";

const FALLBACK = "https://cdn.sofifa.net/player_0.svg";

function PlayerRow({ member }: { member: any }) {
  return (
    <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
      <img
        src={member.imageUrl || FALLBACK}
        alt={member.name}
        className="w-9 h-9 rounded-full object-cover bg-zinc-800 flex-shrink-0"
        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK; }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{member.name}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-xs text-zinc-500">{member.position}</span>
          {member.age && <span className="text-xs text-zinc-600">· {member.age} anos</span>}
          <span className="text-xs text-zinc-600">· {member.nationality}</span>
        </div>
      </div>
      <span className="text-sm font-bold text-green-400 flex-shrink-0">{member.overall}</span>
    </div>
  );
}

export default function ElencoPublico() {
  const { token } = useParams<{ token: string }>();
  const [, navigate] = useLocation();

  const { data: squad, isLoading } = trpc.squads.byToken.useQuery(
    { token: token ?? "" },
    { enabled: !!token }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!squad) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 px-4 text-center">
        <Shield className="w-16 h-16 text-zinc-600" />
        <h2 className="text-2xl font-bold text-white">Elenco não encontrado</h2>
        <p className="text-zinc-400">Este link pode ter expirado ou sido removido.</p>
        <Button onClick={() => navigate("/")} variant="outline" className="border-zinc-700 text-zinc-300">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao início
        </Button>
      </div>
    );
  }

  const starters = squad.members.filter((m: any) => m.slot === "starter");
  const bench = squad.members.filter((m: any) => m.slot === "bench");
  const avgOvr = squad.members.length > 0
    ? Math.round(squad.members.reduce((a: number, m: any) => a + m.overall, 0) / squad.members.length)
    : null;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950">
        <div className="max-w-4xl mx-auto px-4 py-5">
          <div className="flex items-center gap-4">
            {squad.teamLogoUrl ? (
              <img src={squad.teamLogoUrl} alt={squad.teamName} className="w-12 h-12 object-contain" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                <Shield className="w-6 h-6 text-zinc-500" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-white">{squad.teamName}</h1>
              <p className="text-sm text-zinc-400">
                {squad.title || "Elenco personalizado"} · {squad.members.length} jogadores
                {avgOvr && <span className="ml-2 text-green-400 font-medium">OVR médio: {avgOvr}</span>}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Campo tático */}
        {starters.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <h3 className="font-semibold text-white mb-3 text-sm">Campo Tático</h3>
            <TacticalField
              players={starters.map((m: any) => ({
                id: m.id,
                name: m.name,
                position: m.position,
                overall: m.overall,
                imageUrl: m.imageUrl ?? null,
              }))}
              showFormationPicker={false}
            />
          </div>
        )}
        {/* Titulares */}
        <div>
          <h2 className="font-semibold text-white flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            Titulares
            <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 text-xs">
              {starters.length}
            </Badge>
          </h2>
          {starters.length === 0 ? (
            <p className="text-zinc-600 text-sm">Nenhum titular definido.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {starters.map((m: any) => <PlayerRow key={m.id} member={m} />)}
            </div>
          )}
        </div>

        {/* Reservas */}
        {bench.length > 0 && (
          <div>
            <h2 className="font-semibold text-white flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-zinc-500 inline-block" />
              Reservas
              <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 text-xs">
                {bench.length}
              </Badge>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {bench.map((m: any) => <PlayerRow key={m.id} member={m} />)}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="border border-zinc-800 rounded-xl p-6 text-center bg-zinc-900/50">
          <Users className="w-8 h-8 text-green-500 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">Monte o seu próprio elenco</p>
          <p className="text-zinc-400 text-sm mb-4">
            Escolha um time, personalize os jogadores e compartilhe com seus amigos.
          </p>
          <Button
            onClick={() => navigate("/monte-elenco")}
            className="bg-green-600 hover:bg-green-500 text-white"
          >
            Criar meu elenco
          </Button>
        </div>
      </div>
    </div>
  );
}
