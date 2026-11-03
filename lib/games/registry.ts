import type { CreateGame } from "@/lib/games/contract";
import { createAsteroids } from "@/lib/games/asteroids";

export type RealGame = { create: CreateGame; width: number; height: number };

/** Juegos reales (canvas) indexados por id de `lib/games.ts`. */
export const REAL_GAMES: Record<string, RealGame> = {
  rocas: { create: createAsteroids, width: 800, height: 600 },
};

export const isRealGame = (id: string) => id in REAL_GAMES;
