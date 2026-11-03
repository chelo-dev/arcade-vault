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
