import { useEffect, useMemo, useRef, useState } from "react";
import Globe from "react-globe.gl";
import { feature } from "topojson-client";
import countriesTopology from "world-atlas/countries-110m.json";
import { Compass, Move3D, RotateCcw } from "lucide-react";
import { toCountryPoints, type CountryPoint } from "@/lib/countryCoordinates";

const EARTH_TEXTURE = "/manus-storage/earth-night_5287ff3d.jpg";
const EARTH_TOPOLOGY = "/manus-storage/earth-topology_62f27f76.png";

const countryFeatures = (feature(
  countriesTopology as any,
  countriesTopology.objects.countries as any,
) as any).features;

const countryNameAliases: Record<string, string> = {
  Brazil: "Brasil",
  England: "Inglaterra",
  Spain: "Espanha",
  Italy: "Itália",
  Germany: "Alemanha",
  France: "França",
  Portugal: "Portugal",
  "Saudi Arabia": "Arábia Saudita",
  Netherlands: "Holanda",
  Belgium: "Bélgica",
  Turkey: "Turquia",
  Scotland: "Escócia",
  Argentina: "Argentina",
  "United States of America": "EUA",
};

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
  const [width, setWidth] = useState(760);
  const [isReady, setIsReady] = useState(false);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const points = useMemo(() => toCountryPoints(countries), [countries]);
  const selectedPoint = points.find((point) => point.id === selectedCountryId);
  const selectedRing = selectedPoint ? [selectedPoint] : [];

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(([entry]) => {
      setWidth(Math.max(300, Math.floor(entry.contentRect.width)));
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    controls.autoRotate = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.minDistance = 175;
    controls.maxDistance = 350;
    globeRef.current.pointOfView({ lat: 20, lng: -18, altitude: 2.05 }, 0);
    setIsReady(true);
  }, [width]);

  useEffect(() => {
    if (!globeRef.current || !selectedPoint) return;
    globeRef.current.pointOfView(
      { lat: selectedPoint.lat, lng: selectedPoint.lng, altitude: 2.08 },
      650,
    );
  }, [selectedPoint]);

  const resetView = () => {
    globeRef.current?.pointOfView({ lat: 20, lng: -18, altitude: 2.05 }, 650);
  };

  return (
    <div ref={containerRef} className="relative h-[440px] w-full overflow-hidden sm:h-[600px] lg:h-[640px]">
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_50%_56%,rgba(53,255,115,0.12),transparent_42%)]" />
      <div className="pointer-events-none absolute bottom-[-18%] left-[8%] right-[8%] z-[1] h-[35%] rounded-[50%] bg-[radial-gradient(ellipse,rgba(32,255,100,0.2),transparent_68%)] blur-2xl" />

      <Globe
        ref={globeRef}
        width={width}
        height={width < 640 ? 440 : 640}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl={EARTH_TEXTURE}
        bumpImageUrl={EARTH_TOPOLOGY}
        showAtmosphere
        atmosphereColor="#42f879"
        atmosphereAltitude={0.1}
        rendererConfig={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        polygonsData={countryFeatures}
        polygonAltitude={(polygon) => {
          const country = polygon as { properties?: { name?: string } };
          const name = country.properties?.name;
          return name === selectedPoint?.name || name === hoveredCountry ? 0.045 : 0.008;
        }}
        polygonCapColor={(polygon) => {
          const country = polygon as { properties?: { name?: string } };
          const name = country.properties?.name;
          return name === selectedPoint?.name || name === hoveredCountry
            ? "rgba(70, 255, 124, 0.28)"
            : "rgba(42, 82, 55, 0.018)";
        }}
        polygonSideColor={() => "rgba(61, 255, 123, 0.06)"}
        polygonStrokeColor={() => "rgba(107, 255, 155, 0.48)"}
        polygonLabel={(polygon) => {
          const country = polygon as { properties?: { name?: string } };
          return `<div style="font-family:Inter,sans-serif;padding:6px 9px;border:1px solid rgba(74,255,135,.35);border-radius:7px;background:#0b110d;color:#eaffef">${country.properties?.name ?? "País"}</div>`;
        }}
        polygonsTransitionDuration={250}
        onPolygonHover={(polygon) => {
          const country = polygon as { properties?: { name?: string } } | null;
          setHoveredCountry(country?.properties?.name ?? null);
        }}
        onPolygonClick={(polygon) => {
          const countryName = (polygon as { properties?: { name?: string } }).properties?.name;
          const match = countries.find((country) => country.name === (countryName ? countryNameAliases[countryName] ?? countryName : ""));
          if (match) onCountrySelect({ id: match.id, name: match.name });
        }}
        pointsData={points}
        pointLat={(point) => (point as CountryPoint).lat}
        pointLng={(point) => (point as CountryPoint).lng}
        pointColor={(point) =>
          (point as CountryPoint).id === selectedCountryId ? "#efff83" : "#50ff8b"
        }
        pointAltitude={(point) =>
          (point as CountryPoint).id === selectedCountryId ? 0.12 : 0.055
        }
        pointRadius={(point) =>
          (point as CountryPoint).id === selectedCountryId ? 0.65 : 0.34
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
        ringsData={selectedRing}
        ringLat={(point) => (point as CountryPoint).lat}
        ringLng={(point) => (point as CountryPoint).lng}
        ringColor={() => "#dfff75"}
        ringMaxRadius={3.4}
        ringPropagationSpeed={2.4}
        ringRepeatPeriod={1200}
      />

      <div className="pointer-events-none absolute left-5 top-5 z-[2] flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/52 sm:left-8 sm:top-7 sm:text-[11px]">
        <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_#22c55e]" />
        {isReady ? "Globo interativo" : "Carregando globo"}
      </div>
      <div className="pointer-events-none absolute right-5 top-5 z-[2] hidden items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/60 sm:right-8 sm:top-7 sm:flex">
        <Compass className="h-3.5 w-3.5" /> Passe o mouse sobre um país
      </div>
      <div className="absolute bottom-6 left-5 z-[2] flex items-center gap-2 text-[10px] text-white/35 sm:bottom-8 sm:left-8 sm:text-xs">
        <Move3D className="h-3.5 w-3.5 text-primary/70" /> Arraste para girar
      </div>
      <button
        type="button"
        onClick={resetView}
        className="absolute bottom-6 right-5 z-[2] flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white/50 backdrop-blur-md transition hover:border-primary/60 hover:text-primary sm:bottom-8 sm:right-8"
        title="Centralizar globo"
        aria-label="Centralizar globo"
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
