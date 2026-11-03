import { Suspense } from "react";
import { Library } from "@/components/library";
import { fetchBestScores } from "@/lib/scores";

async function LibraryWithBests() {
  const bests = await fetchBestScores().catch(() => ({}));
  return <Library bests={bests} />;
}

export default function BibliotecaPage() {
  return (
    <div className="fade-in">
      <section className="av-hero">
        <h1 className="flicker">ARCADE VAULT</h1>
        <div className="sub">
          INSERTA UNA MONEDA PARA JUGAR <span className="blink">_</span>
        </div>
      </section>
      <Suspense fallback={<Library bests={null} />}>
        <LibraryWithBests />
      </Suspense>
    </div>
  );
}
