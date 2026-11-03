import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CanvasGamePlayer } from "@/components/canvas-game-player";
import { GamePlayer } from "@/components/game-player";
import { GAMES } from "@/lib/games";
import { isRealGame } from "@/lib/games/registry";

export function generateStaticParams() {
  return GAMES.map((g) => ({ id: g.id }));
}

export default function PlayPage(props: PageProps<"/juegos/[id]/jugar">) {
  return (
    <Suspense fallback={null}>
      <Play params={props.params} />
    </Suspense>
  );
}

async function Play({
  params,
}: {
  params: PageProps<"/juegos/[id]/jugar">["params"];
}) {
  const { id } = await params;
  const game = GAMES.find((g) => g.id === id);
  if (!game) notFound();

  if (isRealGame(game.id)) return <CanvasGamePlayer game={game} />;

  return <GamePlayer game={game} />;
}
