import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AsteroidsPlayer } from "@/components/asteroids-player";
import { GamePlayer } from "@/components/game-player";
import { GAMES } from "@/lib/games";

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

  if (game.id === "rocas") return <AsteroidsPlayer game={game} />;

  return <GamePlayer game={game} />;
}
