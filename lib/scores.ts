import { createClient as createServerClient } from "@/lib/supabase/server";

export type ScoreEntry = {
  id: string;
  player_name: string;
  score: number;
  created_at: string;
};

export type PlayerBest = { score: number; rank: number; created_at: string };

// Orden del ranking: score desc, created_at asc (a igual puntuación gana la más antigua).
export async function fetchTopScores(
  gameId: string,
  limit = 12,
): Promise<ScoreEntry[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("scores")
    .select("id, player_name, score, created_at")
    .eq("game_id", gameId)
    .order("score", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data;
}

export async function fetchPlayableGames(): Promise<
  { id: string; title: string }[]
> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("games")
    .select("id, title")
    .eq("playable", true);

  if (error) throw new Error(error.message);
  return data;
}

// Mejor puntuación por juego jugable; los demás no tienen filas posibles (RLS), así que no aparecen.
export async function fetchBestScores(): Promise<Record<string, number>> {
  const games = await fetchPlayableGames();
  const entries = await Promise.all(
    games.map(async (g) => [g.id, (await fetchTopScores(g.id, 1))[0]?.score] as const),
  );
  return Object.fromEntries(entries.filter((e): e is [string, number] => e[1] !== undefined));
}

export type GameStats = { plays: number; saved: number; best: number | null };

export async function fetchGameStats(gameId: string): Promise<GameStats> {
  const supabase = await createServerClient();
  const [plays, saved, best] = await Promise.all([
    supabase.from("plays").select("id", { count: "exact", head: true }).eq("game_id", gameId),
    supabase.from("scores").select("id", { count: "exact", head: true }).eq("game_id", gameId),
    supabase
      .from("scores")
      .select("score")
      .eq("game_id", gameId)
      .order("score", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const failed = plays.error ?? saved.error ?? best.error;
  if (failed) throw new Error(failed.message);
  return { plays: plays.count ?? 0, saved: saved.count ?? 0, best: best.data?.score ?? null };
}
