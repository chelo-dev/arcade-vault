"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { GameOverModal } from "@/components/game-over-modal";
import { PlayerStats } from "@/components/player-stats";
import type { GameControls } from "@/lib/games/contract";
import { REAL_GAMES } from "@/lib/games/registry";
import type { Game } from "@/lib/games";
import { recordPlay, submitScore } from "@/lib/scores-client";
import { useSession } from "@/lib/session";

const INITIAL_STATS = { score: 0, lives: 3, level: 1 };

export function CanvasGamePlayer({ game }: { game: Game }) {
  const { user } = useSession();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameControls | null>(null);
  const [over, setOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [stats, setStats] = useState(INITIAL_STATS);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // null = sin editar: sigue al usuario de la sesión, que se lee de localStorage tras montar.
  const [nameInput, setNameInput] = useState<string | null>(null);

  const real = REAL_GAMES[game.id];
  const name = nameInput ?? user?.name ?? "INVITADO";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const controls = real.create(canvas, {
      onGameOver: () => {
        void recordPlay(game.id);
        setPaused(false);
        setSaved(false);
        setSaving(false);
        setSaveError(null);
        setOver(true);
      },
      onRestart: () => setOver(false),
      onStats: setStats,
    });
    gameRef.current = controls;
    return () => {
      controls.destroy();
      gameRef.current = null;
    };
  }, [game.id, real]);

  const togglePause = () => {
    const next = !paused;
    setPaused(next);
    gameRef.current?.setPaused(next);
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await submitScore({
        gameId: game.id,
        playerName: name.trim() || "INVITADO",
        score: stats.score,
      });
      setSaved(true);
    } catch {
      setSaveError("NO SE PUDO GUARDAR. REINTENTA");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <PlayerStats name={name} score={stats.score} lives={stats.lives} level={stats.level} />
        <div className="hud-actions">
          <button type="button" className="btn yellow" onClick={togglePause} disabled={over}>
            {paused ? "REANUDAR" : "PAUSA"}
          </button>
          <button type="button" className="btn magenta" onClick={() => gameRef.current?.end()} disabled={over}>
            FIN
          </button>
          <Link href={`/juegos/${game.id}`} className="btn ghost">
            SALIR
          </Link>
        </div>
      </div>

      <div className="crt">
        <div className="crt-screen">
          <canvas
            ref={canvasRef}
            width={real.width}
            height={real.height}
            className="game-canvas"
            aria-label={`Juego ${game.title}`}
          />
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
          score={stats.score}
          name={name}
          saved={saved}
          saving={saving}
          error={saveError}
          onNameChange={setNameInput}
          onSave={save}
          onRestart={() => gameRef.current?.restart()}
        />
      )}
    </div>
  );
}
