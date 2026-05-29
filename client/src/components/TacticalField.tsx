import { useState, useRef, useCallback, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface TacticalPlayer {
  id: number;
  name: string;
  position: string;
  overall: number;
  imageUrl: string | null;
}

interface Props {
  players: TacticalPlayer[];
  /** Formação controlada externamente, ex: "4-3-3" */
  formation?: string;
  /** Callback quando usuário muda a formação */
  onFormationChange?: (formation: string) => void;
  /** Se true, exibe seletor de formação */
  showFormationPicker?: boolean;
  /** Se true, permite arrastar jogadores */
  draggable?: boolean;
  className?: string;
}

// ─── Formações disponíveis ────────────────────────────────────────────────────
// lines: número de jogadores por linha, do GK (índice 0) ao ataque (último índice)
const FORMATIONS: Record<string, { label: string; lines: number[] }> = {
  // ── 3 defensores ──────────────────────────────────────────────────────────
  "3-1-4-2":        { label: "3-1-4-2",        lines: [1, 3, 1, 4, 2] },
  "3-4-1-2":        { label: "3-4-1-2",        lines: [1, 3, 4, 1, 2] },
  "3-4-2-1":        { label: "3-4-2-1",        lines: [1, 3, 4, 2, 1] },
  "3-4-3":          { label: "3-4-3",          lines: [1, 3, 4, 3] },
  "3-4-3 Diamond":  { label: "3-4-3 Diamond",  lines: [1, 3, 4, 3] },
  "3-4-3 Flat":     { label: "3-4-3 Flat",     lines: [1, 3, 4, 3] },
  "3-5-1-1":        { label: "3-5-1-1",        lines: [1, 3, 5, 1, 1] },
  "3-5-2":          { label: "3-5-2",          lines: [1, 3, 5, 2] },

  // ── 4 defensores ──────────────────────────────────────────────────────────
  "4-1-2-1-2 Narrow": { label: "4-1-2-1-2 Narrow", lines: [1, 4, 1, 2, 1, 2] },
  "4-1-2-1-2 Wide":   { label: "4-1-2-1-2 Wide",   lines: [1, 4, 1, 2, 1, 2] },
  "4-1-3-2":          { label: "4-1-3-2",           lines: [1, 4, 1, 3, 2] },
  "4-1-4-1":          { label: "4-1-4-1",           lines: [1, 4, 1, 4, 1] },
  "4-2-1-3":          { label: "4-2-1-3",           lines: [1, 4, 2, 1, 3] },
  "4-2-2-2":          { label: "4-2-2-2",           lines: [1, 4, 2, 2, 2] },
  "4-2-3-1 Narrow":   { label: "4-2-3-1 Narrow",   lines: [1, 4, 2, 3, 1] },
  "4-2-3-1 Wide":     { label: "4-2-3-1 Wide",     lines: [1, 4, 2, 3, 1] },
  "4-2-4":            { label: "4-2-4",             lines: [1, 4, 2, 4] },
  "4-3-1-2":          { label: "4-3-1-2",           lines: [1, 4, 3, 1, 2] },
  "4-3-2-1":          { label: "4-3-2-1",           lines: [1, 4, 3, 2, 1] },
  "4-3-3 Flat":       { label: "4-3-3 Flat",       lines: [1, 4, 3, 3] },
  "4-3-3 Holding":    { label: "4-3-3 Holding",    lines: [1, 4, 3, 3] },
  "4-3-3 Defend":     { label: "4-3-3 Defend",     lines: [1, 4, 3, 3] },
  "4-3-3 Attack":     { label: "4-3-3 Attack",     lines: [1, 4, 3, 3] },
  "4-3-3 False 9":    { label: "4-3-3 False 9",    lines: [1, 4, 3, 3] },
  "4-4-1-1 Attack":   { label: "4-4-1-1 Attack",   lines: [1, 4, 4, 1, 1] },
  "4-4-1-1 Midfield": { label: "4-4-1-1 Midfield", lines: [1, 4, 4, 1, 1] },
  "4-4-2 Flat":       { label: "4-4-2 Flat",       lines: [1, 4, 4, 2] },
  "4-4-2 Holding":    { label: "4-4-2 Holding",    lines: [1, 4, 4, 2] },
  "4-5-1 Attack":     { label: "4-5-1 Attack",     lines: [1, 4, 5, 1] },
  "4-5-1 Flat":       { label: "4-5-1 Flat",       lines: [1, 4, 5, 1] },

  // ── 5 defensores ──────────────────────────────────────────────────────────
  "5-1-2-2":          { label: "5-1-2-2",           lines: [1, 5, 1, 2, 2] },
  "5-2-1-2":          { label: "5-2-1-2",           lines: [1, 5, 2, 1, 2] },
  "5-2-2-1":          { label: "5-2-2-1",           lines: [1, 5, 2, 2, 1] },
  "5-2-3":            { label: "5-2-3",             lines: [1, 5, 2, 3] },
  "5-3-2":            { label: "5-3-2",             lines: [1, 5, 3, 2] },
  "5-4-1 Flat":       { label: "5-4-1 Flat",       lines: [1, 5, 4, 1] },
  "5-4-1 Diamond":    { label: "5-4-1 Diamond",    lines: [1, 5, 4, 1] },
};

// Chave padrão
const DEFAULT_FORMATION = "4-3-3 Flat";

// Lista ordenada para o dropdown
const FORMATION_KEYS = Object.keys(FORMATIONS);

function normalizePosition(pos: string): string {
  const p = pos.toUpperCase().trim();
  if (p.includes("GOL") || p === "GK" || p === "GKP") return "GOL";
  if (p === "ZAG" || p === "CB" || p === "DC") return "ZAG";
  if (p === "LD" || p === "RB" || p === "DR") return "LD";
  if (p === "LE" || p === "LB" || p === "DL") return "LE";
  if (p === "LAT") return "LAT";
  if (p === "VOL" || p === "CDM" || p === "DM") return "VOL";
  if (p === "MC" || p === "CM" || p === "MF") return "MC";
  if (p === "MEI" || p === "MED") return "MEI";
  if (p === "MO" || p === "CAM" || p === "AM") return "MO";
  if (p === "ME" || p === "LM" || p === "ML") return "ME";
  if (p === "MD" || p === "RM" || p === "MR") return "MD";
  if (p === "PE" || p === "LW" || p === "EL") return "PE";
  if (p === "PD" || p === "RW" || p === "ER") return "PD";
  if (p === "ATA" || p === "ST" || p === "CF" || p === "CA") return "ATA";
  if (p === "SA" || p === "SS") return "SA";
  return p;
}

function getPositionOrder(pos: string): number {
  const p = normalizePosition(pos);
  if (p === "GOL") return 0;
  if (["ZAG","LD","LE","LAT"].includes(p)) return 1;
  if (["VOL","MC","MEI","ME","MD"].includes(p)) return 2;
  if (["MO","PE","PD","ATA","SA"].includes(p)) return 3;
  return 2;
}

function assignPlayersToLines(players: TacticalPlayer[], lines: number[]): TacticalPlayer[][] {
  const sorted = [...players].sort((a, b) => getPositionOrder(a.position) - getPositionOrder(b.position));
  const result: TacticalPlayer[][] = [];
  let idx = 0;
  for (const count of lines) {
    result.push(sorted.slice(idx, idx + count));
    idx += count;
  }
  return result;
}

// ─── Avatar do jogador no campo ──────────────────────────────────────────────
function FieldPlayerNode({
  player, x, y, isSelected, isSwapTarget, interactive,
  onClick,
}: {
  player: TacticalPlayer; x: number; y: number;
  isSelected: boolean; isSwapTarget: boolean; interactive: boolean;
  onClick: (id: number) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const initials = player.name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
  const colors = ["#16a34a","#2563eb","#9333ea","#dc2626","#d97706","#0891b2","#be185d"];
  const colorIdx = player.name.charCodeAt(0) % colors.length;
  const color = colors[colorIdx];
  const parts = player.name.trim().split(" ");
  const shortName = parts.length > 1 ? `${parts[0][0]}. ${parts.slice(-1)[0]}` : player.name;

  // Visual: selecionado = anel amarelo pulsante; alvo de troca = anel verde
  const ringStroke = isSelected ? "#facc15" : isSwapTarget ? "#4ade80" : "white";
  const ringWidth = isSelected || isSwapTarget ? 3 : 2;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      style={{ cursor: interactive ? "pointer" : "default" }}
      onClick={interactive ? () => onClick(player.id) : undefined}
    >
      {/* Sombra */}
      <ellipse cx={0} cy={22} rx={16} ry={4} fill="rgba(0,0,0,0.35)" />
      {/* Anel de seleção animado */}
      {isSelected && (
        <circle cx={0} cy={0} r={22} fill="none" stroke="#facc15" strokeWidth={2} strokeDasharray="4 3" opacity={0.8} />
      )}
      {/* Círculo do avatar */}
      <circle cx={0} cy={0} r={18} fill={imgError || !player.imageUrl ? color : "transparent"} stroke={ringStroke} strokeWidth={ringWidth} />
      {!imgError && player.imageUrl ? (
        <>
          <defs>
            <clipPath id={`clip-${player.id}`}>
              <circle cx={0} cy={0} r={17} />
            </clipPath>
          </defs>
          <image
            href={player.imageUrl}
            x={-17} y={-17} width={34} height={34}
            clipPath={`url(#clip-${player.id})`}
            onError={() => setImgError(true)}
          />
          <circle cx={0} cy={0} r={18} fill="none" stroke={ringStroke} strokeWidth={ringWidth} />
        </>
      ) : (
        <text x={0} y={5} textAnchor="middle" fontSize={11} fontWeight="bold" fill="white">{initials}</text>
      )}
      {/* Badge OVR */}
      <rect x={-14} y={-30} width={28} height={13} rx={4} fill="#111827" opacity={0.9} />
      <text x={0} y={-20} textAnchor="middle" fontSize={9} fontWeight="bold" fill="#4ade80">{player.overall}</text>
      {/* Nome */}
      <rect x={-28} y={22} width={56} height={13} rx={3} fill="rgba(0,0,0,0.65)" />
      <text x={0} y={32} textAnchor="middle" fontSize={8} fill="white" fontWeight="500">{shortName}</text>
    </g>
  );
}

// ─── Campo SVG ────────────────────────────────────────────────────────────────
function FootballPitch({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 340 520" className="w-full h-full" style={{ maxHeight: "520px" }}>
      {/* Gramado */}
      <rect x={0} y={0} width={340} height={520} rx={8} fill="#2d6a2d" />
      {/* Listras */}
      {Array.from({ length: 10 }).map((_, i) => (
        <rect key={i} x={0} y={i * 52} width={340} height={26} fill={i % 2 === 0 ? "rgba(0,0,0,0.06)" : "transparent"} />
      ))}
      {/* Bordas do campo */}
      <rect x={16} y={16} width={308} height={488} rx={4} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2} />
      {/* Linha do meio */}
      <line x1={16} y1={260} x2={324} y2={260} stroke="rgba(255,255,255,0.6)" strokeWidth={2} />
      {/* Círculo central */}
      <circle cx={170} cy={260} r={50} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2} />
      <circle cx={170} cy={260} r={3} fill="rgba(255,255,255,0.8)" />
      {/* Área grande (ataque) */}
      <rect x={70} y={16} width={200} height={80} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2} />
      {/* Área pequena (ataque) */}
      <rect x={120} y={16} width={100} height={36} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2} />
      {/* Pênalti (ataque) */}
      <circle cx={170} cy={68} r={3} fill="rgba(255,255,255,0.8)" />
      <path d="M 120 96 A 50 50 0 0 1 220 96" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2} />
      {/* Área grande (defesa) */}
      <rect x={70} y={424} width={200} height={80} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2} />
      {/* Área pequena (defesa) */}
      <rect x={120} y={468} width={100} height={36} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2} />
      {/* Pênalti (defesa) */}
      <circle cx={170} cy={452} r={3} fill="rgba(255,255,255,0.8)" />
      <path d="M 120 424 A 50 50 0 0 0 220 424" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2} />
      {/* Cantos */}
      <path d="M 16 16 A 8 8 0 0 1 24 16" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={1.5} />
      <path d="M 316 16 A 8 8 0 0 0 324 16" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={1.5} />
      <path d="M 16 504 A 8 8 0 0 0 16 496" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={1.5} />
      <path d="M 324 504 A 8 8 0 0 1 324 496" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={1.5} />
      {children}
    </svg>
  );
}

// ─── Dropdown de formações ────────────────────────────────────────────────────
function FormationDropdown({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (f: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const label = FORMATIONS[selected]?.label ?? "Selecione aqui";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm font-medium text-white hover:bg-zinc-700 transition-colors min-w-[160px] justify-between"
      >
        <span>{label}</span>
        <ChevronDown
          size={14}
          className={`text-zinc-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden"
          style={{ minWidth: "200px", maxHeight: "320px", overflowY: "auto" }}
        >
          {FORMATION_KEYS.map((f) => (
            <button
              key={f}
              onClick={() => {
                onChange(f);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left transition-colors ${
                selected === f
                  ? "bg-green-700/40 text-green-300 font-semibold"
                  : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <span>{FORMATIONS[f].label}</span>
              {selected === f && <Check size={13} className="text-green-400 flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function TacticalField({
  players,
  formation,
  onFormationChange,
  showFormationPicker = true,
  draggable = false,
  className = "",
}: Props) {
  const available = players.slice(0, 11);

  // Formação: estado local para resposta imediata na UI, sincronizado com prop externa
  const [localFormation, setLocalFormation] = useState(() => {
    // Se a formação externa existe no mapa, usa ela; senão tenta o default
    if (formation && FORMATIONS[formation]) return formation;
    return DEFAULT_FORMATION;
  });

  // Sincronizar quando a prop externa muda (ex: ao carregar squad do banco)
  useEffect(() => {
    if (formation && formation !== localFormation) {
      // Aceita qualquer formação — inclusive as antigas com 9 opções
      setLocalFormation(FORMATIONS[formation] ? formation : DEFAULT_FORMATION);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formation]);

  const selectedFormation = localFormation;

  const handleFormationChange = useCallback((f: string) => {
    setLocalFormation(f);       // atualiza UI imediatamente
    onFormationChange?.(f);     // persiste no banco em background
  }, [onFormationChange]);

  // Seleção por clique: trocar posições entre dois jogadores
  const [orderedPlayers, setOrderedPlayers] = useState<TacticalPlayer[]>(available);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Sincronizar quando players externos mudam
  const prevPlayersRef = useRef<TacticalPlayer[]>(available);
  if (JSON.stringify(prevPlayersRef.current.map(p => p.id)) !== JSON.stringify(available.map(p => p.id))) {
    prevPlayersRef.current = available;
    setOrderedPlayers(available);
    setSelectedId(null);
  }

  const handlePlayerClick = useCallback((clickedId: number) => {
    setSelectedId(prev => {
      if (prev === null) {
        // Primeiro clique: seleciona o jogador
        return clickedId;
      }
      if (prev === clickedId) {
        // Clicou no mesmo: deseleciona
        return null;
      }
      // Segundo clique em jogador diferente: troca posições
      setOrderedPlayers(players => {
        const next = [...players];
        const fromIdx = next.findIndex(p => p.id === prev);
        const toIdx = next.findIndex(p => p.id === clickedId);
        if (fromIdx === -1 || toIdx === -1) return players;
        [next[fromIdx], next[toIdx]] = [next[toIdx], next[fromIdx]];
        return next;
      });
      return null; // deseleciona após trocar
    });
  }, []);

  const formationData = FORMATIONS[selectedFormation] ?? FORMATIONS[DEFAULT_FORMATION];
  const lines = assignPlayersToLines(orderedPlayers, formationData.lines);

  const fieldTop = 40;
  const fieldBottom = 490;
  const fieldHeight = fieldBottom - fieldTop;
  const numLines = lines.length;
  const yPositions = lines.map((_, i) => {
    const reversed = numLines - 1 - i;
    return fieldTop + (reversed / (numLines - 1)) * fieldHeight;
  });

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {showFormationPicker && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-zinc-500 font-medium">Formação:</span>
          <FormationDropdown selected={selectedFormation} onChange={handleFormationChange} />
        </div>
      )}

      {draggable && (
        <p className="text-xs text-zinc-500 text-center">
          {selectedId !== null
            ? "Agora clique em outro jogador para trocar a posição"
            : "Clique em um jogador para selecioná-lo"}
        </p>
      )}

      {orderedPlayers.length === 0 ? (
        <div className="flex items-center justify-center h-64 border border-dashed border-zinc-700 rounded-xl text-zinc-600 text-sm">
          Adicione titulares para ver o campo tático
        </div>
      ) : (
        <div className="relative w-full rounded-xl overflow-hidden" style={{ aspectRatio: "340/520" }}>
          <FootballPitch>
            {lines.map((linePlayers, lineIdx) => {
              const y = yPositions[lineIdx];
              const count = linePlayers.length;
              return linePlayers.map((player, pIdx) => {
                const x = count === 1
                  ? 170
                  : 50 + (pIdx / (count - 1)) * 240;
                return (
                  <FieldPlayerNode
                    key={player.id}
                    player={player}
                    x={x}
                    y={y}
                    isSelected={selectedId === player.id}
                    isSwapTarget={selectedId !== null && selectedId !== player.id}
                    interactive={draggable}
                    onClick={handlePlayerClick}
                  />
                );
              });
            })}
          </FootballPitch>
        </div>
      )}
    </div>
  );
}
