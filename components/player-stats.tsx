type PlayerStatsProps = {
  name: string;
  score: number;
  lives: number;
  level: number;
};

export function PlayerStats({ name, score, lives, level }: PlayerStatsProps) {
  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
      <div className="hud-stat">
        <div className="l">Jugador</div>
        <div className="v" style={{ color: "var(--ink)" }}>{name}</div>
      </div>
      <div className="hud-stat">
        <div className="l">Puntuación</div>
        <div className="v">{score.toLocaleString("es-ES")}</div>
      </div>
      <div className="hud-stat lives">
        <div className="l">Vidas</div>
        <div className="v">{"♥ ".repeat(lives).trim()}</div>
      </div>
      <div className="hud-stat level">
        <div className="l">Nivel</div>
        <div className="v">{String(level).padStart(2, "0")}</div>
      </div>
    </div>
  );
}
