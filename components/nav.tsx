"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/lib/session";

export function Nav() {
  const pathname = usePathname();
  const { user, signOut } = useSession();
  const [open, setOpen] = useState(false);

  const active = {
    inicio: pathname.startsWith("/games"),
    biblioteca: pathname.startsWith("/biblioteca") || pathname.startsWith("/juegos"),
    salon: pathname.startsWith("/salon"),
    about: pathname.startsWith("/about"),
    auth: pathname.startsWith("/auth"),
  };
  const cls = (on: boolean) => (on ? "active" : undefined);
  const close = () => setOpen(false);

  return (
    <>
      <nav className="av-nav">
        <Link href="/games" className="logo">
          <div className="logo-mark"></div>
          <div className="logo-text neon-cyan">
            ARCADE <span className="neon-magenta">VAULT</span>
          </div>
        </Link>
        <div className="links">
          <Link href="/games" className={cls(active.inicio)}>Inicio</Link>
          <Link href="/biblioteca" className={cls(active.biblioteca)}>Biblioteca</Link>
          <Link href="/salon" className={cls(active.salon)}>Salón de la Fama</Link>
          <Link href="/about" className={cls(active.about)}>Acerca de</Link>
        </div>
        <div className="spacer"></div>
        <div className="coin-counter">
          <span className="coin"></span>
          <span>CRÉDITOS · 03</span>
        </div>
        {user ? (
          <button type="button" className="btn ghost auth-btn" onClick={signOut}>
            {user.name} ▾
          </button>
        ) : (
          <Link href="/auth" className="btn auth-btn">Iniciar Sesión</Link>
        )}
        <button
          type="button"
          className="btn ghost hamburger"
          onClick={() => setOpen(true)}
          aria-label="Menú"
          aria-expanded={open}
        >
          ≡
        </button>
      </nav>

      <div className={"av-mobile-backdrop" + (open ? " open" : "")} onClick={close}></div>
      <aside className={"av-mobile-panel" + (open ? " open" : "")} inert={!open}>
        <div className="pixel neon-cyan" style={{ fontSize: 11, marginBottom: 16 }}>MENÚ</div>
        <Link href="/games" className={cls(active.inicio)} onClick={close}>Inicio</Link>
        <Link href="/biblioteca" className={cls(active.biblioteca)} onClick={close}>Biblioteca</Link>
        <Link href="/salon" className={cls(active.salon)} onClick={close}>Salón de la Fama</Link>
        <Link href="/about" className={cls(active.about)} onClick={close}>Acerca de</Link>
        <Link href="/auth" className={cls(active.auth)} onClick={close}>
          {user ? "Cuenta" : "Iniciar Sesión"}
        </Link>
        <div style={{ flex: 1 }}></div>
        <div className="pixel" style={{ fontSize: 9, color: "var(--ink-faint)", letterSpacing: "0.16em" }}>
          CRÉDITOS · 03
        </div>
      </aside>
    </>
  );
}
