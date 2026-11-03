import { createClient as createBrowserClient } from "@/lib/supabase/client";
import type { PlayerBest } from "@/lib/scores";

export async function submitScore(input: {
  gameId: string;
  playerName: string;
  score: number;
}): Promise<void> {
  const supabase = createBrowserClient();
  const { error } = await supabase.from("scores").insert({
    game_id: input.gameId,
    player_name: input.playerName,
    score: input.score,
  });

  if (error) throw new Error(error.message);
}

export async function fetchPlayerBest(
  gameId: string,
  playerName: string,
): Promise<PlayerBest | null> {
  const supabase = createBrowserClient();

  const { data: best, error } = await supabase
    .from("scores")
    .select("score, created_at")
    .eq("game_id", gameId)
    .eq("player_name", playerName)
    .order("score", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!best) return null;

  // Rango = filas con mayor puntuación + 1.
  const { count, error: rankError } = await supabase
    .from("scores")
    .select("id", { count: "exact", head: true })
    .eq("game_id", gameId)
    .gt("score", best.score);

  if (rankError) throw new Error(rankError.message);
  return {
    score: best.score,
    rank: (count ?? 0) + 1,
    created_at: best.created_at,
  };
}
