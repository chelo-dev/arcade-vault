"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GameOverModal } from "@/components/game-over-modal";
import { PlayerStats } from "@/components/player-stats";
import type { Game } from "@/lib/games";
import { useSession } from "@/lib/session";

const LIVES = 3;
const POINTS_PER_LEVEL = 2500;

export function GamePlayer({ game }: { game: Game }) {
  const { user, saveScore } = useSession();
  const [score, setScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [saved, setSaved] = useState(false);
  // null = sin editar: sigue al usuario de la sesión, que se lee de localStorage tras montar.
  const [nameInput, setNameInput] = useState<string | null>(null);

  const name = nameInput ?? user?.name ?? "INVITADO";
  const level = 1 + Math.floor(score / POINTS_PER_LEVEL);

  // Score simulado: solo corre en cliente, tras montar.
  useEffect(() => {
    if (over || paused) return;
    const t = setInterval(() => setScore((s) => s + Math.floor(10 + Math.random() * 90)), 220);
    return () => clearInterval(t);
  }, [over, paused]);

  const restart = () => {
    setScore(0);
    setPaused(false);
    setOver(false);
    setSaved(false);
  };

  const save = () => {
    saveScore({ game: game.id, score, name: name.trim() || "INVITADO" });
    setSaved(true);
  };

  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <PlayerStats name={name} score={score} lives={LIVES} level={level} />
        <div className="hud-actions">
          <button type="button" className="btn yellow" onClick={() => setPaused((p) => !p)}>
            {paused ? "REANUDAR" : "PAUSA"}
          </button>
          <button type="button" className="btn magenta" onClick={() => setOver(true)}>FIN</button>
          <Link href={`/juegos/${game.id}`} className="btn ghost">SALIR</Link>
        </div>
      </div>

      <div className="crt">
        <div className="crt-screen">
          <div className="game-arena">
            <div className="grid-floor"></div>
            <div className="enemy e1"></div>
            <div className="enemy e2"></div>
            <div className="enemy e3"></div>
            <div className="player-ship"></div>
          </div>
          {paused && (
            <div className="crt-content" style={{ background: "rgba(0,0,0,0.6)", zIndex: 5 }}>
              <div>
                <div className="pixel neon-yellow" style={{ fontSize: 22 }}>EN PAUSA</div>
                <div className="mono" style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 10, letterSpacing: "0.16em" }}>
                  PULSA REANUDAR PARA CONTINUAR
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="crt-bottom">
          <span className="led">SEÑAL OK</span>
          <span>{game.title} · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>

      {over && (
        <GameOverModal
          score={score}
          name={name}
          saved={saved}
          onNameChange={setNameInput}
          onSave={save}
          onRestart={restart}
        />
      )}
    </div>
  );
}
