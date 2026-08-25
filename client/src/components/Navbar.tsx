import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, X, ChevronDown, User, LogOut, Search } from "lucide-react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663216916845/hhB4oykfDQM9yCvhQGaX3n/logo-futnerds_8f14a724.png";

type NavLink = {
  href: string;
  label: string;
  disabled?: boolean;
};

const navLinks: NavLink[] = [
  { href: "/", label: "Início" },
  { href: "/jogadores", label: "Jogadores" },
  { href: "/times", label: "Times" },
  { href: "#scouting", label: "Scouting", disabled: true },
  { href: "#modo-carreira", label: "Modo Carreira", disabled: true },
  { href: "#rankings", label: "Rankings", disabled: true },
];

const desktopLinkClass = "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200";
const mobileLinkClass = "block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const isActive = (href: string) => location === href;

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06]"
      style={{ background: "oklch(0.07 0.012 145 / 0.92)", backdropFilter: "blur(14px)" }}
    >
      <div className="container">
        <div className="flex items-center justify-between h-16 gap-3">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <img
              src={LOGO_URL}
              alt="FUTNERDS"
              className="h-10 w-10 object-contain transition-transform duration-300 group-hover:scale-110"
            />
            <span className="font-bold text-xl tracking-wider text-foreground" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
              FUT<span className="text-primary">NERDS</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => {
              if (link.disabled) {
                return (
                  <button key={link.label} type="button" disabled className={`${desktopLinkClass} text-muted-foreground/70`}>
                    {link.label}
                  </button>
                );
              }
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${desktopLinkClass} ${isActive(link.href) ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              disabled
              aria-label="Buscar"
              className="flex h-9 w-10 items-center justify-center rounded-lg border border-white/[0.1] bg-black/20 text-muted-foreground/80"
            >
              <Search className="h-4 w-4" />
            </button>
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-lg border border-white/[0.1] bg-black/20 px-2.5 py-1.5 transition-colors hover:border-primary/40 hover:bg-primary/5">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user.avatar ?? undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                        {user.name?.charAt(0).toUpperCase() ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="max-w-[120px] truncate text-xs font-medium text-foreground">
                      {user.name ?? user.email ?? "Usuário"}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/perfil" className="flex items-center gap-2"><User className="h-4 w-4" />Meu Perfil</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => logout()}>
                    <LogOut className="mr-2 h-4 w-4" />Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" asChild><a href={getLoginUrl()}>Entrar</a></Button>
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" asChild><a href={getLoginUrl()}>Cadastrar</a></Button>
              </div>
            )}
          </div>

          <button
            type="button"
            className="rounded-lg p-2 transition-colors hover:bg-secondary md:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="space-y-1 border-t border-white/[0.06] py-3 md:hidden">
            {navLinks.map((link) => link.disabled ? (
              <button key={link.label} type="button" disabled className={`${mobileLinkClass} w-full text-left text-muted-foreground/60`}>
                {link.label}
              </button>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={`${mobileLinkClass} ${isActive(link.href) ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex gap-2 border-t border-white/[0.06] px-4 pt-2">
              {isAuthenticated ? (
                <Button variant="ghost" size="sm" className="w-full" onClick={() => logout()}><LogOut className="mr-2 h-4 w-4" />Sair</Button>
              ) : (
                <>
                  <Button variant="ghost" size="sm" className="flex-1" asChild><a href={getLoginUrl()}>Entrar</a></Button>
                  <Button size="sm" className="flex-1 bg-primary text-primary-foreground" asChild><a href={getLoginUrl()}>Cadastrar</a></Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
