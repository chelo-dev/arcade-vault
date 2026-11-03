"use client";

import Link from "next/link";
import { useState } from "react";
import type { ScoreEntry } from "@/lib/scores";

export type HallGame = { id: string; title: string; scores: ScoreEntry[] };

const fmt = (n: number) => n.toLocaleString("es-ES");
const rankClass = (i: number) => (i === 0 ? " top1" : i === 1 ? " top2" : i === 2 ? " top3" : "");
// dd/mm/aaaa en UTC, igual en servidor y cliente (sin riesgo de hidratación).
const fmtDate = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};

export function HallOfFame({ games }: { games: HallGame[] }) {
  const [tab, setTab] = useState(games[0]?.id);

  const game = games.find((g) => g.id === tab);
  const rows = game?.scores ?? [];

  return (
    <div className="av-hall fade-in">
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p className="pixel" style={{ fontSize: 10 }}>LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA</p>
      </div>

      <div className="hall-tabs">
        {games.map((g) => (
          <button
            key={g.id}
            type="button"
            className={"chip" + (tab === g.id ? " active" : "")}
            onClick={() => setTab(g.id)}
          >
            {g.title}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="pixel" style={{ fontSize: 12, textAlign: "center", margin: "48px 0" }}>
          AÚN NO HAY PUNTUACIONES
        </p>
      ) : (
        <>
          <div className="podium">
            <PodiumSlot cls="silver" pos="02" row={rows[1]} />
            <PodiumSlot cls="gold" pos="01" row={rows[0]} champion />
            <PodiumSlot cls="bronze" pos="03" row={rows[2]} />
          </div>

          <div className="hall-table">
            <div className="th">
              <div>RANGO</div>
              <div>JUGADOR</div>
              <div>PUNTUACIÓN</div>
              <div>FECHA</div>
            </div>
            {rows.map((r, i) => (
              <div key={r.id} className={"tr" + rankClass(i)} style={{ animationDelay: `${i * 50}ms` }}>
                <div className="rk">#{String(i + 1).padStart(2, "0")}</div>
                <div className="pl">{r.player_name}</div>
                <div className="sc">{fmt(r.score)}</div>
                <div className="dt">{fmtDate(r.created_at)}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Link href="/biblioteca" className="btn lg">VOLVER A LA BIBLIOTECA</Link>
      </div>
    </div>
  );
}

function PodiumSlot({
  cls,
  pos,
  row,
  champion = false,
}: {
  cls: string;
  pos: string;
  row?: ScoreEntry;
  champion?: boolean;
}) {
  return (
    <div className={"podium-slot " + cls}>
      {champion && (
        <div className="pixel" style={{ fontSize: 9, color: "var(--gold)", letterSpacing: "0.18em" }}>CAMPEÓN</div>
      )}
      <div className="rank-num" style={champion ? { fontSize: 36, marginTop: 4 } : undefined}>{pos}</div>
      <div className="name">{row?.player_name ?? "—"}</div>
      <div className="score" style={champion ? { fontSize: 20 } : undefined}>{row ? fmt(row.score) : "—"}</div>
      <div className="date">{row ? fmtDate(row.created_at) : ""}</div>
    </div>
  );
}
