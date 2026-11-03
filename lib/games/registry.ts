import type { CreateGame } from "@/lib/games/contract";
import { createArkanoid } from "@/lib/games/arkanoid";
import { createAsteroids } from "@/lib/games/asteroids";
import { createTetris } from "@/lib/games/tetris";

export type RealGame = { create: CreateGame; width: number; height: number };

/** Juegos reales (canvas) indexados por id de `lib/games.ts`. */
export const REAL_GAMES: Record<string, RealGame> = {
  rocas: { create: createAsteroids, width: 800, height: 600 },
  caida: { create: createTetris, width: 460, height: 600 },
  "bloque-buster": { create: createArkanoid, width: 800, height: 600 },
};

export const isRealGame = (id: string) => id in REAL_GAMES;
