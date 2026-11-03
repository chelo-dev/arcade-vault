"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createAsteroids } from "@/lib/games/asteroids";
import { useSession } from "@/lib/session";

const GAME_ID = "rocas";

export function AsteroidsPlayer() {
  const { user, saveScore } = useSession();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [saved, setSaved] = useState(false);

  // El juego se monta una sola vez; el callback lee siempre la sesión actual.
  const onGameOverRef = useRef<(score: number) => void>(() => {});
  useEffect(() => {
    onGameOverRef.current = (score) => {
      saveScore({ game: GAME_ID, score, name: user?.name ?? "INVITADO" });
      setSaved(true);
    };
  }, [saveScore, user]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return createAsteroids(canvas, {
      onGameOver: (score) => onGameOverRef.current(score),
    });
  }, []);

  // Tras Game Over, Espacio reinicia la partida: se oculta el aviso.
  useEffect(() => {
    if (!saved) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") setSaved(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [saved]);

  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <div className="hud-actions">
          <Link href={`/juegos/${GAME_ID}`} className="btn ghost">
            SALIR
          </Link>
        </div>
      </div>

      <div className="crt">
        <div className="crt-screen">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="asteroids-canvas"
            aria-label="Juego Asteroids"
          />
        </div>
        <div className="crt-bottom">
          <span className="led">SEÑAL OK</span>
          <span>ROCAS · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>

      {saved && (
        <div style={{ textAlign: "center" }} role="status">
          <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
        </div>
      )}
    </div>
  );
}
