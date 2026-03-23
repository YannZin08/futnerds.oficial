import { Link } from "wouter";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663216916845/hhB4oykfDQM9yCvhQGaX3n/logo-futnerds_8f14a724.png";

export default function Footer() {
  return (
    <footer className="border-t border-border/50 mt-auto"
      style={{ background: "oklch(0.08 0.01 240)" }}>
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img src={LOGO_URL} alt="FUTNERDS" className="h-10 w-10 object-contain" />
              <span className="font-bold text-xl tracking-wider"
                style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                FUT<span className="text-primary">NERDS</span>
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              A comunidade definitiva para jogadores de FIFA. Análises, notícias, estratégias e muito mais para elevar seu jogo.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Navegação</h4>
            <ul className="space-y-2">
              {[
                { href: "/", label: "Início" },
                { href: "/jogadores", label: "Jogadores" },
                { href: "/perfil", label: "Meu Perfil" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Modos */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Modos FIFA</h4>
            <ul className="space-y-2">
              {["Ultimate Team", "Modo Carreira", "Pro Clubs", "Volta Football"].map((mode) => (
                <li key={mode}>
                  <span className="text-sm text-muted-foreground">{mode}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © 2025 FUTNERDS. Todos os direitos reservados.
          </p>
          <p className="text-xs text-muted-foreground">
            Site não oficial. FIFA e EA FC são marcas registradas da EA Sports.
          </p>
        </div>
      </div>
    </footer>
  );
}
