import Link from "next/link";

type GameOverModalProps = {
  score: number;
  name: string;
  saved: boolean;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onRestart: () => void;
};

export function GameOverModal({
  score,
  name,
  saved,
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
            <button type="button" className="btn yellow" onClick={onSave}>GUARDAR PUNTUACIÓN</button>
          </div>
        ) : (
          <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
        )}
        <div className="actions">
          <button type="button" className="btn" onClick={onRestart}>JUGAR DE NUEVO</button>
          <Link href="/biblioteca" className="btn magenta">VOLVER AL VAULT</Link>
        </div>
      </div>
    </div>
  );
}
