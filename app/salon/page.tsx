import { Suspense } from "react";
import { HallOfFame, type HallGame } from "@/components/hall-of-fame";
import { fetchPlayableGames, fetchTopScores } from "@/lib/scores";

const TOP = 12;

async function SalonContent() {
  let games: HallGame[];
  try {
    const playable = await fetchPlayableGames();
    games = await Promise.all(
      playable.map(async (g) => ({ ...g, scores: await fetchTopScores(g.id, TOP) })),
    );
  } catch {
    return (
      <div className="av-hall fade-in">
        <div className="hall-head">
          <h1>SALÓN DE LA FAMA</h1>
          <p className="pixel" style={{ fontSize: 10, color: "var(--magenta)" }}>
            NO SE PUDO CARGAR EL RANKING. INTÉNTALO DE NUEVO MÁS TARDE
          </p>
        </div>
      </div>
    );
  }
  return <HallOfFame games={games} />;
}

export default function SalonPage() {
  return (
    <Suspense
      fallback={
        <div className="av-hall">
          <div className="hall-head">
            <h1>SALÓN DE LA FAMA</h1>
            <p className="pixel" style={{ fontSize: 10 }}>CARGANDO RANKING…</p>
          </div>
        </div>
      }
    >
      <SalonContent />
    </Suspense>
  );
}
