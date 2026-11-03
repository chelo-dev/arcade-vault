export type GameStats = { score: number; lives: number; level: number };

export type GameOptions = {
  /** Se llama una vez por partida, cuando termina. */
  onGameOver: (score: number) => void;
  /** Se llama cuando la partida se reinicia (tecla o `restart()`). */
  onRestart: () => void;
  /** Se llama cuando cambia la puntuación, las vidas o el nivel. */
  onStats: (stats: GameStats) => void;
};

export type GameControls = {
  /** Reinicia la partida desde la app (botón JUGAR DE NUEVO). */
  restart: () => void;
  /** Pausa o reanuda la partida (botón PAUSA/REANUDAR). */
  setPaused: (paused: boolean) => void;
  /** Termina la partida en curso (botón FIN). */
  end: () => void;
  /** Retira listeners y cancela el bucle. */
  destroy: () => void;
};

/** Monta el juego sobre el canvas y arranca el bucle. */
export type CreateGame = (
  canvas: HTMLCanvasElement,
  options: GameOptions,
) => GameControls;
