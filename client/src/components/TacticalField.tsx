import { useState, useRef, useCallback } from "react";

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
const FORMATIONS: Record<string, { label: string; lines: number[] }> = {
  "4-3-3":   { label: "4-3-3",   lines: [1, 4, 3, 3] },
  "4-4-2":   { label: "4-4-2",   lines: [1, 4, 4, 2] },
  "4-2-3-1": { label: "4-2-3-1", lines: [1, 4, 2, 3, 1] },
  "3-5-2":   { label: "3-5-2",   lines: [1, 3, 5, 2] },
  "3-4-3":   { label: "3-4-3",   lines: [1, 3, 4, 3] },
  "5-3-2":   { label: "5-3-2",   lines: [1, 5, 3, 2] },
  "5-4-1":   { label: "5-4-1",   lines: [1, 5, 4, 1] },
  "4-5-1":   { label: "4-5-1",   lines: [1, 4, 5, 1] },
  "4-1-4-1": { label: "4-1-4-1", lines: [1, 4, 1, 4, 1] },
};

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
  player, x, y, isDragging, isDropTarget, draggable,
  onDragStart, onDragEnd, onDrop,
}: {
  player: TacticalPlayer; x: number; y: number;
  isDragging: boolean; isDropTarget: boolean; draggable: boolean;
  onDragStart: (id: number) => void;
  onDragEnd: () => void;
  onDrop: (targetId: number) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const initials = player.name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
  const colors = ["#16a34a","#2563eb","#9333ea","#dc2626","#d97706","#0891b2","#be185d"];
  const colorIdx = player.name.charCodeAt(0) % colors.length;
  const color = colors[colorIdx];
  const parts = player.name.trim().split(" ");
  const shortName = parts.length > 1 ? `${parts[0][0]}. ${parts.slice(-1)[0]}` : player.name;

  const opacity = isDragging ? 0.4 : 1;
  const highlightStroke = isDropTarget ? "#facc15" : "white";
  const highlightWidth = isDropTarget ? 3 : 2;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      style={{ cursor: draggable ? "grab" : "default", opacity }}
      onMouseDown={draggable ? () => onDragStart(player.id) : undefined}
      onMouseUp={draggable ? () => onDrop(player.id) : undefined}
      onTouchStart={draggable ? () => onDragStart(player.id) : undefined}
      onTouchEnd={draggable ? () => onDrop(player.id) : undefined}
    >
      {/* Sombra */}
      <ellipse cx={0} cy={22} rx={16} ry={4} fill="rgba(0,0,0,0.35)" />
      {/* Círculo do avatar */}
      <circle cx={0} cy={0} r={18} fill={imgError || !player.imageUrl ? color : "transparent"} stroke={highlightStroke} strokeWidth={highlightWidth} />
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
          <circle cx={0} cy={0} r={18} fill="none" stroke={highlightStroke} strokeWidth={highlightWidth} />
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

  // Formação: controlada externamente se `formation` prop fornecida, senão interna
  const [internalFormation, setInternalFormation] = useState(formation ?? "4-3-3");
  const selectedFormation = formation ?? internalFormation;

  const handleFormationChange = useCallback((f: string) => {
    setInternalFormation(f);
    onFormationChange?.(f);
  }, [onFormationChange]);

  // Drag-and-drop: trocar posições entre dois jogadores
  const [orderedPlayers, setOrderedPlayers] = useState<TacticalPlayer[]>(available);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const draggingIdRef = useRef<number | null>(null);

  // Sincronizar quando players externos mudam
  const prevPlayersRef = useRef<TacticalPlayer[]>(available);
  if (JSON.stringify(prevPlayersRef.current.map(p => p.id)) !== JSON.stringify(available.map(p => p.id))) {
    prevPlayersRef.current = available;
    setOrderedPlayers(available);
  }

  const handleDragStart = useCallback((id: number) => {
    setDraggingId(id);
    draggingIdRef.current = id;
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    draggingIdRef.current = null;
  }, []);

  const handleDrop = useCallback((targetId: number) => {
    const fromId = draggingIdRef.current;
    if (fromId === null || fromId === targetId) {
      handleDragEnd();
      return;
    }
    setOrderedPlayers(prev => {
      const next = [...prev];
      const fromIdx = next.findIndex(p => p.id === fromId);
      const toIdx = next.findIndex(p => p.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      [next[fromIdx], next[toIdx]] = [next[toIdx], next[fromIdx]];
      return next;
    });
    handleDragEnd();
  }, [handleDragEnd]);

  const formationData = FORMATIONS[selectedFormation] ?? FORMATIONS["4-3-3"];
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
    <div
      className={`flex flex-col gap-3 ${className}`}
      onMouseUp={draggable ? handleDragEnd : undefined}
      onMouseLeave={draggable ? handleDragEnd : undefined}
    >
      {showFormationPicker && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-zinc-500 font-medium">Formação:</span>
          {Object.keys(FORMATIONS).map((f) => (
            <button
              key={f}
              onClick={() => handleFormationChange(f)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                selectedFormation === f
                  ? "bg-green-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {draggable && (
        <p className="text-xs text-zinc-500 text-center">
          Clique em um jogador e depois em outro para trocar as posições no campo
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
                    isDragging={draggingId === player.id}
                    isDropTarget={draggingId !== null && draggingId !== player.id}
                    draggable={draggable}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDrop={handleDrop}
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
