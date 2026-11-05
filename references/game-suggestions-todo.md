# Sugerencias de juegos — To Do

> Mantenido por el agente `game-planner`. Última actualización: 2026-11-05.

## Pendientes

- [ ] **DUELO PIXEL** (`duelo-pixel`, VERSUS) — ⭐ recomendado (ronda 2) · sugerido 2026-11-05 · total 33/35
  - Encaje: duelo de paletas en solitario contra la CPU, 800×600, 3 vidas (tantos encajados), nivel = tantos ganados (CPU y pelota más rápidas); primer juego VERSUS jugable, reusa ficha y `cover-duelo`, coste muy bajo. Siguiente paso: `/game-spec duelo-pixel: duelo de paletas de diseño propio en solitario contra CPU, 800x600, puntos por devolución x nivel y bonus por tanto ganado, 3 vidas = tantos encajados, nivel sube con cada tanto ganado, efecto según punto de impacto; 2P local fuera de alcance`.
- [ ] **SERPENTINA** (`serpentina`, ARCADE) — ⭐ recomendado (ronda 1) · sugerido 2026-11-05 · total 32/35
  - Encaje: serpiente de neón en rejilla 40×30 sobre 800×600, 3 vidas y nivel por velocidad; coste muy bajo y reusa la ficha y `cover-snake`. Siguiente paso: `/game-spec serpentina: snake de diseño propio, rejilla 40x30 en 800x600, núcleos que valen 10×nivel, núcleo bonus temporal, 3 vidas, nivel cada 5 núcleos`.
- [ ] **INVASORES** (`invasores`, SHOOTER) — alternativa · sugerido 2026-11-05 · total 30/35
  - Encaje: oleadas en formación con escudos erosionables y nave bonus; puntuación y vidas/oleada ideales, pero sería el 2.º shooter y requiere sprites propios. Siguiente paso: `/game-spec invasores: shooter de oleadas en formación de diseño propio, 800x600, 3 vidas, nivel = oleada`.
- [ ] **RANARIA** (`ranaria`, ARCADE) — alternativa · sugerido 2026-11-05 · total 30/35
  - Encaje: cruce de carriles y río con temporizador, 5 refugios por nivel; mapeo de stats directo, coste medio. Siguiente paso: `/game-spec ranaria: cruce de autopista y río de diseño propio, 800x600, 3 vidas, nivel al llenar los 5 refugios, bonus por tiempo`.
- [ ] **GLOTÓN** (`gloton`, ARCADE) — alternativa · sugerido 2026-11-05 · total 28/35
  - Encaje: laberinto propio con orbes y 4 espectros de comportamiento distinto, núcleo de poder que invierte la persecución; leaderboard excelente, pero coste alto (IA, túneles, modos) y riesgo de originalidad si se calca el laberinto o los personajes clásicos. Siguiente paso: `/game-spec gloton: persecución en laberinto de diseño propio, 800x600, 4 espectros con IA propia, 3 vidas, nivel = laberinto completado`.
- [ ] **ORBES** (`orbes`, PUZZLE) — alternativa · sugerido 2026-11-05 · total 27/35
  - Encaje: lanzador de orbes de neón en rejilla hexagonal, grupos de 3+ estallan y los colgantes caen con bonus; el techo baja cada N disparos. Equilibra PUZZLE, pero requiere ficha nueva y formato vertical (~480×600). Siguiente paso: `/game-spec orbes: lanzador de orbes de diseño propio, rejilla hexagonal, 480x600, apuntar con flechas, 3 vidas (la masa cruza la línea), nivel = tablero`.
- [ ] **ESTELA** (`estela`, VERSUS) — ⭐ recomendado (VERSUS) (ronda 3) · sugerido 2026-11-05 · total 34/35
  - Encaje: Motos de luz vs 1–3 CPU, rejilla 80×60 en 800×600; coste muy bajo. Siguiente paso: `/game-spec estela: duelo de motos de luz de diseño propio contra 1–3 motos CPU, 800x600, rejilla 80x60, flechas giran + espacio turbo limitado, gana el último en pie, +1×nivel por paso, +500×nivel por ronda ganada, +200 por rival encerrado, 3 vidas = rondas perdidas, nivel = ronda; ficha VERSUS nueva + migración playable`.
- [ ] **DESCENSO** (`descenso`, ARCADE) — ⭐ recomendado (ARCADE) (ronda 3) · sugerido 2026-11-05 · total 33/35
  - Encaje: Aterrizaje con física; reusa física de nave de rocas; plataformas ×1–×5. Siguiente paso: `/game-spec descenso: aterrizaje con física de diseño propio, 800x600, nave vectorial neón (izq/der giran, arriba empuja), terreno procedural con plataformas multiplicadoras x1-x5, combustible limitado, puntos = base x multiplicador + combustible sobrante, 3 naves, nivel = terreno`.
- [ ] **VÓRTICE** (`vortice`, SHOOTER) — ⭐ recomendado (SHOOTER) (ronda 3) · sugerido 2026-11-05 · total 33/35
  - Encaje: Arena con dos sticks (WASD + flechas), multiplicador por bajas sin daño; reusa colisiones de rocas. Siguiente paso: `/game-spec vortice: shooter de arena de diseño propio, 800x600, WASD mueve y flechas disparan en 8 direcciones, enemigos geométricos neón (perseguidor, errante, divisor), puntos x multiplicador por bajas encadenadas sin daño, 3 vidas, nivel = oleada; ficha SHOOTER nueva + migración playable`.
- [ ] **TRÍADA** (`triada`, PUZZLE) — ⭐ recomendado (PUZZLE) (ronda 3) · sugerido 2026-11-05 · total 32/35
  - Encaje: Columnas de 3 gemas, 460×600; reusa base de rejilla de caida; 2.º juego de bloques que caen. Siguiente paso: `/game-spec triada: puzzle de columnas de diseño propio, 460x600, columna de 3 gemas neón que cae y rota con arriba, se eliminan 3+ en línea (incl. diagonal) con cadenas, puntos = 10 × gemas × cadena × nivel, 3 prismas comodín como vidas, nivel cada 30 gemas, Game Over al desbordar; ficha PUZZLE nueva`.
- [ ] **ASFALTO** (`asfalto`, ARCADE) — alternativa (ronda 3) · sugerido 2026-11-05 · total 32/35
  - Encaje: Carreras top-down esquivando tráfico, gasolina; synthwave. Siguiente paso: `/game-spec asfalto: carreras top-down de diseño propio, 800x600, coche neón en 4 carriles con scroll vertical, esquivar tráfico, recoger gasolina, puntos por distancia x velocidad + bonus por adelantamiento al límite, 3 choques, nivel = tramo de 2 km`.
- [ ] **BLINDADOS** (`blindados`, VERSUS) — alternativa (ronda 3) · sugerido 2026-11-05 · total 32/35
  - Encaje: Tanques top-down en arena con muros destructibles; coste medio. Siguiente paso: `/game-spec blindados: duelo de tanques top-down de diseño propio, 800x600, muros destructibles y bloques de acero, flechas + espacio, tanques CPU con patrulla y línea de visión, 100×nivel por tanque, bonus sin daño, 3 vidas, nivel = arena; ficha VERSUS nueva + migración playable`.
- [ ] **ÓRBITA** (`orbita`, SHOOTER) — alternativa (ronda 3) · sugerido 2026-11-05 · total 32/35
  - Encaje: Túnel radial pseudo-3D; evitar formas/nombres del clásico. Siguiente paso: `/game-spec orbita: shooter de túnel radial de diseño propio, 800x600, túnel poligonal ~560px, nave en el borde rota con izq/der y dispara al centro, enemigos propios por carriles, bomba de pulso 1 por túnel, 3 vidas, nivel = túnel; ficha SHOOTER nueva + migración playable`.
- [ ] **CERCO** (`cerco`, ARCADE) — alternativa (ronda 3) · sugerido 2026-11-05 · total 31/35
  - Encaje: Captura de territorio 75 %; flood fill, coste medio. Siguiente paso: `/game-spec cerco: captura de territorio de diseño propio, 800x600, trazar desde el borde con flechas (trazo lento puntúa doble), enemigo que rebota y rastreadores de borde, objetivo 75 %, puntos = área x nivel + bonus, 3 vidas, nivel = tablero`.
- [ ] **ASCENSO** (`ascenso`, ARCADE) — alternativa (ronda 3) · sugerido 2026-11-05 · total 31/35
  - Encaje: Plataformas verticales infinitas, 460×600. Siguiente paso: `/game-spec ascenso: plataformas verticales infinitas de diseño propio, 460x600, salto automático e izq/der con wrap lateral, plataformas fijas/móviles/frágiles, gemas, puntos = altura + gemas, 3 vidas, nivel cada 500 m`.
- [ ] **ENJAMBRE** (`enjambre`, ARCADE) — alternativa (ronda 3) · sugerido 2026-11-05 · total 31/35
  - Encaje: Esquivar proyectiles sin disparar, multiplicador por roce. Siguiente paso: `/game-spec enjambre: esquivar proyectiles de diseño propio sin disparo, 800x600, hitbox mínima, patrones por oleada, puntos por segundo vivo x multiplicador por roce + chispas, 3 vidas, nivel = oleada cada 30 s`.
- [ ] **CAUDAL** (`caudal`, PUZZLE) — alternativa (ronda 3) · sugerido 2026-11-05 · total 31/35
  - Encaje: Tuberías de plasma con cola de piezas; más variado que TRÍADA. Siguiente paso: `/game-spec caudal: puzzle de tuberías de plasma de diseño propio, 800x600, rejilla 10x7 con cola de 5 piezas, cursor con flechas + espacio, flujo tras cuenta atrás, 50 por tramo + bonus por cruces, 3 vidas (derrame antes de la distancia mínima), nivel = tablero; ficha PUZZLE nueva`.
- [ ] **ECO** (`eco`, PUZZLE) — alternativa (ronda 3) · sugerido 2026-11-05 · total 31/35
  - Encaje: Memoria de secuencias con WebAudio; bonus de velocidad para desempatar. Siguiente paso: `/game-spec eco: puzzle de memoria de diseño propio, 800x600, 4 pads neón en cruz asignados a flechas con tonos WebAudio, secuencia +1 por ronda, puntos = 10 × longitud × nivel + bonus por velocidad, 3 vidas = fallos, nivel = longitud; ficha PUZZLE nueva`.
- [ ] **CENTELLA** (`centella`, SHOOTER) — alternativa (ronda 3) · sugerido 2026-11-05 · total 31/35
  - Encaje: Scroll vertical 460×600 con jefe por sector. Siguiente paso: `/game-spec centella: shooter de scroll vertical de diseño propio, 460x600, flechas + espacio, oleadas con patrones y jefe por sector, combo y potenciadores, 3 vidas, nivel = sector; ficha SHOOTER nueva + migración playable`.
- [ ] **BALUARTE** (`baluarte`, SHOOTER) — alternativa (ronda 3) · sugerido 2026-11-05 · total 31/35
  - Encaje: Defensa antimisiles, 6 cúpulas = vidas; con teclado algo forzado. Siguiente paso: `/game-spec baluarte: defensa antimisiles de diseño propio, 800x600, mira con flechas y 3 baterías A/S/D con munición limitada, explosiones en cadena, 6 cúpulas = vidas, bonus por cúpulas y munición, nivel = oleada; ficha SHOOTER nueva + migración playable`.
- [ ] **CAÑONAZO** (`canonazo`, VERSUS) — alternativa (ronda 3) · sugerido 2026-11-05 · total 30/35
  - Encaje: Artillería por turnos vs cañón CPU, viento, 15 s/turno. Siguiente paso: `/game-spec canonazo: artillería por turnos de diseño propio contra cañón CPU, 800x600, terreno destructible, viento, flechas para ángulo y potencia, espacio dispara, 15 s por turno, impacto 300×nivel + bonus por distancia, 3 vidas, nivel = rival; ficha VERSUS nueva + migración playable`.
- [ ] **PRISMA** (`prisma`, PUZZLE) — alternativa (ronda 3) · sugerido 2026-11-05 · total 30/35
  - Encaje: Match-3 contrarreloj 8×8; cursor de teclado. Siguiente paso: `/game-spec prisma: match-3 contrarreloj de diseño propio, 800x600, tablero 8x8, cursor con flechas + espacio para intercambiar, cascadas, puntos = 10 × tamaño × cascada × nivel, barra de tiempo, 3 vidas = barajados, nivel por meta de puntos; ficha PUZZLE nueva`.
- [ ] **PENA MÁXIMA** (`pena-maxima`, VERSUS) — alternativa (ronda 3) · sugerido 2026-11-05 · total 29/35
  - Encaje: Tanda de penaltis lanzar/parar; flojo en estética CRT. Siguiente paso: `/game-spec pena-maxima: tanda de penaltis de diseño propio contra CPU, 800x600, elegir zona con flechas y potencia con barra, parar moviendo el portero, tandas de 3 con muerte súbita, gol 100/200, parada 150, 3 vidas = tandas perdidas, nivel = tanda; ficha VERSUS nueva + migración playable`.
- [ ] **ESTOCADA** (`estocada`, VERSUS) — alternativa (ronda 3) · sugerido 2026-11-05 · total 29/35
  - Encaje: Esgrima con guardias alta/media/baja; el más caro de VERSUS. Siguiente paso: `/game-spec estocada: duelo de esgrima de diseño propio contra CPU, 800x600 lateral, figuras vectoriales neón, izq/der avanzar, arriba/abajo guardia, Z estocada, X parada, asaltos a 5 tocados, 100×nivel por tocado, 3 vidas = asaltos perdidos, nivel = rival; ficha VERSUS nueva + migración playable`.
- [ ] **FUSIÓN** (`fusion`, PUZZLE) — alternativa (ronda 3) · sugerido 2026-11-05 · total 29/35
  - Encaje: Fusión de potencias de 2 (núcleos de energía); partidas largas. Siguiente paso: `/game-spec fusion: puzzle de fusión de núcleos de energía de diseño propio, 800x600, tablero 4x4, deslizar con flechas, fusiones doblan valor, puntos = suma de fusiones, 3 vidas = deshacer, nivel = exponente máximo, Game Over sin movimientos; ficha PUZZLE nueva`.
- [ ] **GRUTA** (`gruta`, SHOOTER) — alternativa (ronda 3) · sugerido 2026-11-05 · total 28/35
  - Encaje: Scroll horizontal por caverna con combustible (propuesto como ESTELA, renombrado por choque con el VERSUS); el más caro de SHOOTER. Siguiente paso: `/game-spec gruta: shooter de scroll horizontal de diseño propio por caverna procedural, 800x600, disparo frontal + bomba en parábola, combustible que se recarga destruyendo depósitos (barra en el canvas), puntos por objetivos + distancia + bonus por tramo, 3 vidas, nivel = tramo; ficha SHOOTER nueva + migración playable`.

## Aplazados

## Hechos / descartados
