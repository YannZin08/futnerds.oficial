import { useEffect, useMemo, useRef, useState } from "react";
import Globe from "react-globe.gl";
import { Compass, Move3D, RotateCcw, ZoomIn } from "lucide-react";
import { toCountryPoints, type CountryPoint } from "@/lib/countryCoordinates";

const EARTH_TEXTURE = "/manus-storage/earth-night_5287ff3d.jpg";
const EARTH_TOPOLOGY = "/manus-storage/earth-topology_62f27f76.png";

type InteractiveGlobeProps = {
  countries: Array<{ id: number; name: string }>;
  selectedCountryId?: number | null;
  onCountrySelect: (country: { id: number; name: string }) => void;
};

export default function InteractiveGlobe({
  countries,
  selectedCountryId,
  onCountrySelect,
}: InteractiveGlobeProps) {
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [isReady, setIsReady] = useState(false);
  const points = useMemo(() => toCountryPoints(countries), [countries]);
  const selectedPoint = points.find((point) => point.id === selectedCountryId);

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(([entry]) => {
      setWidth(Math.max(280, Math.floor(entry.contentRect.width)));
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    controls.autoRotate = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 165;
    controls.maxDistance = 320;
    setIsReady(true);
  }, [width]);

  useEffect(() => {
    if (!globeRef.current || !selectedPoint) return;
    globeRef.current.pointOfView(
      { lat: selectedPoint.lat, lng: selectedPoint.lng, altitude: 1.75 },
      700,
    );
  }, [selectedPoint]);

  const resetView = () => {
    globeRef.current?.pointOfView({ lat: 18, lng: -18, altitude: 2.05 }, 700);
  };

  return (
    <div
      ref={containerRef}
      className="relative min-h-[430px] overflow-hidden rounded-[28px] border border-primary/20 bg-[#050807] shadow-[0_0_70px_rgba(34,197,94,0.12)] sm:min-h-[570px]"
    >
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_50%_53%,rgba(42,255,119,0.15),transparent_42%),linear-gradient(180deg,rgba(3,8,6,0.2),rgba(0,0,0,0.25))]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-[-25%] z-[1] h-1/2 bg-[radial-gradient(ellipse,rgba(41,255,114,0.24),transparent_65%)] blur-2xl" />

      <Globe
        ref={globeRef}
        width={width}
        height={width < 640 ? 430 : 570}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl={EARTH_TEXTURE}
        bumpImageUrl={EARTH_TOPOLOGY}
        showAtmosphere
        atmosphereColor="#42f879"
        atmosphereAltitude={0.12}
        rendererConfig={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        pointsData={points}
        pointLat={(point) => (point as CountryPoint).lat}
        pointLng={(point) => (point as CountryPoint).lng}
        pointColor={(point) =>
          (point as CountryPoint).id === selectedCountryId ? "#eaff74" : "#4dff89"
        }
        pointAltitude={(point) =>
          (point as CountryPoint).id === selectedCountryId ? 0.1 : 0.045
        }
        pointRadius={(point) =>
          (point as CountryPoint).id === selectedCountryId ? 0.7 : 0.42
        }
        pointResolution={12}
        pointLabel={(point) => {
          const country = point as CountryPoint;
          return `<div style="font-family:Inter,sans-serif;padding:7px 10px;border:1px solid rgba(74,255,135,.45);border-radius:8px;background:#0d1711;color:#eaffef;box-shadow:0 0 18px rgba(34,197,94,.25)">${country.flag} ${country.name}</div>`;
        }}
        onPointClick={(point) => {
          const country = point as CountryPoint;
          onCountrySelect({ id: country.id, name: country.name });
        }}
      />

      <div className="pointer-events-none absolute left-4 top-4 z-[2] flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/65 backdrop-blur-md sm:left-6 sm:top-6 sm:text-xs">
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary shadow-[0_0_10px_#22c55e]" />
        {isReady ? "Globo interativo" : "Carregando globo"}
      </div>

      <div className="absolute bottom-4 left-4 z-[2] flex items-center gap-2 text-[10px] text-white/45 sm:bottom-6 sm:left-6 sm:text-xs">
        <Move3D className="h-3.5 w-3.5 text-primary/80" />
        Arraste para girar · role para aproximar
      </div>

      <div className="absolute bottom-4 right-4 z-[2] flex items-center gap-1.5 sm:bottom-6 sm:right-6">
        <div className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-[10px] text-white/50 backdrop-blur-md sm:flex">
          <ZoomIn className="h-3.5 w-3.5 text-primary/80" /> Zoom
        </div>
        <button
          type="button"
          onClick={resetView}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/25 bg-black/55 text-white/70 backdrop-blur-md transition-colors hover:border-primary/70 hover:text-primary"
          title="Centralizar globo"
          aria-label="Centralizar globo"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="pointer-events-none absolute right-5 top-5 z-[2] hidden items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-primary/65 sm:flex">
        <Compass className="h-3.5 w-3.5" /> Selecione um país
      </div>
    </div>
  );
}
