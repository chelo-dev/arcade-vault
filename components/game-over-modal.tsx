import Link from "next/link";

type GameOverModalProps = {
  score: number;
  name: string;
  saved: boolean;
  saving?: boolean;
  error?: string | null;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onRestart: () => void;
};

export function GameOverModal({
  score,
  name,
  saved,
  saving = false,
  error = null,
  onNameChange,
  onSave,
  onRestart,
}: GameOverModalProps) {
  return (
    <div className="modal-bd">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="gameover-title">
        <h2 id="gameover-title">FIN DEL JUEGO</h2>
        <div className="final-label">PUNTUACIÓN FINAL</div>
        <div className="final">{score.toLocaleString("es-ES")}</div>
        {!saved ? (
          <div className="input-row">
            <input
              value={name}
              onChange={(e) => onNameChange(e.target.value.toUpperCase().slice(0, 10))}
              placeholder="TUS INICIALES"
              aria-label="Tus iniciales"
            />
            <button type="button" className="btn yellow" onClick={onSave} disabled={saving}>
              GUARDAR PUNTUACIÓN
            </button>
          </div>
        ) : (
          <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
        )}
        {error && !saved && (
          <div
            role="alert"
            className="mono"
            style={{ color: "var(--magenta)", fontSize: 12, letterSpacing: "0.12em", marginTop: 10 }}
          >
            ▸ {error}
          </div>
        )}
        <div className="actions">
          <button type="button" className="btn" onClick={onRestart}>JUGAR DE NUEVO</button>
          <Link href="/biblioteca" className="btn magenta">VOLVER AL VAULT</Link>
        </div>
      </div>
    </div>
  );
}
