# Frontend foundation

Objective: scaffold the HandLab frontend and build the pure play domain (trajectories, roster rules, ball).
Branch: `feat/frontend-foundation` · Delivery: ask-on-risk · Test runner: Vitest (`npm test` in `frontend/`).

## Specs

- S1: "Por ahora empezemos con el front". Scaffold `frontend/` with React + Vite, Vitest, React Router, CSS Modules and vite-plugin-pwa (manifest and installability only), following the layered folders in CLAUDE.md (`domain`, `application`, `infrastructure`, `ui`).
- S2: "La posición de un jugador en el tiempo `t` es una función pura del dominio (`positionAt(trajectory, t)`), testeable sin DOM." Trajectories are continuous sequences of `(t, x, y)` points, with no keyframes or interpolation between key positions.
- S3: "Las trayectorias se simplifican antes de guardarse (por ejemplo, Ramer-Douglas-Peucker) para reducir puntos."
- S4: "Jugadores por lado: mínimo 1, máximo 7." "deberia ser opcional el arquero, entonces quedan como maximo 6 jugadores defensivos y una opcion para habilitar al arquero, cuando se habilite aparece directamente en el arco"
- S6: "Un único loop con `requestAnimationFrame` y un reloj compartido mueve a todos los jugadores. Esto sincroniza la reproducción y permite pausar, retroceder, cambiar la velocidad y arrastrar la línea de tiempo."
- S7: Recording by layers ("Como dijiste"): one element is recorded per pass while the already recorded ones play back on the same timeline. Samples are `(t, x, y)` taken while dragging, kept inside the court and simplified before saving. Re-recording ("La recomendada"): a new recording of an element replaces everything from the moment it starts.
- S5: "La pelota sigue al jugador, solo se mueve cuando se seleciona especificamente a ella. Los jugadores se pueden mover libremente por el dominio de la cancha, la pelota tiene que ir de jugador en jugador, como un pase o puede ser un lanzamiento al arco"
- Assumption A1: court coordinates are meters on a 20 m x 20 m half court, goal line at `y = 0`, goal centered at `x = 10` and 3 m wide.
- S8: "[CAMBIOS DE DISEÑO] - El ancho y largo debe ser el mismo por mitad de cancha, la cancha mide 40x20, pero si estamos de un solo lado deberia medir 20x20. Diseña un poco por fuera del lado del arco, unos 20px. - Cuando se pega la pelota a un jugador debe hacerlo al frente de ellos, entrando un poco en el diagrama del jugador. - Centra la cancha en el ancho de la pantalla, ahora se ve corrida un poco hacia la izquierda. [FUNCIONALIDADES] - Agrega las opciones de Reinicar, Guardar, Eliminar y Velocidad en 1.5x."

- S9: "cambiemos a keyframe las animaciones" + "1" (by steps). Supersedes S2, S3 and S7: a play is a list of steps; each step stores player positions and the ball state; playback interpolates linearly between steps, 1 s per transition; "Agregar paso" copies the current step; a pass or shot happens during the transition into the edited step and carries over to following steps with the same ball state.

- S10: "[FIXING] - Que empiece en el paso 0 - Cuando se modifique un paso que tiene paso siguientes, que los siguientes se eliminen advirtiendo las consecuencias [ADD] - Elminar Paso - Si se elimina un paso que tiene pasos siguientes, que se eliminen en cadena advirtiendo."

## Tasks

- [x] T1 (S1) scaffold frontend · route: inline · commit: a74d1e1 (build + lint green)
- [x] T2 (S2) `positionAt` · route: inline · commit: 1ecd881 (RED 6 failed → GREEN 6 passed)
- [x] T3 (S3) trajectory simplification (RDP) · route: inline · commit: d3c232f (RED 6 → GREEN)
- [x] T4 (S4) roster rules · route: inline · commits: aae9e48, reopened by L7 and fixed in ca4e428 (RED 8 → GREEN)
- [x] T5 (S5, A1) court bounds and ball possession, pass and shot · route: inline · commits: b3afcc1, d72ab82 (RED 13 → GREEN; suite 33 passed)
- [x] T6 (S4) goalkeeper appears in goal when enabled · route: inline · commit: ca4e428 (`setGoalkeeperEnabled`, start at x 10, y 0.5)
- [x] T7 (S6) shared playback clock · route: inline · commit: e0343a2 (RED 10 → GREEN)
- [x] T8 (S7) trajectory recorder for one layer · route: inline · commit: 005ca29 (RED 5 → GREEN; suite 51 passed, lint and build green)
- [x] T9 (S7) play layers (`replaceFrom`, `recordPlayerLayer`, `playDuration`, default play) · route: inline · commit: 4fd590d
- [x] T10 (S5, S7) ball holder and re-recorded ball actions · route: inline · commit: 4fd590d (RED 6 → GREEN)
- [x] T11 (S6) clock `setDuration` for recording past the end · route: inline · commit: d915abb (RED 2 → GREEN)
- [x] T12 (S4, S5) disabling the goalkeeper keeps the ball valid · route: inline · commit: 6068586 (RED 2 → GREEN)
- [x] T13 (S6, S7) whiteboard at `/pizarra`: court SVG, single rAF loop, controls, player and ball recording · route: inline · commits: 5a97c55 (jsdom + Testing Library), facb0c6 (RED 8 → GREEN; suite 75 passed, lint and build green)
- [x] T15 (S8) square 20 x 20 m court with a 0.625 m strip behind the goal line (goal depth 0.5 m), ball in front of its holder, centered board, 1.5x speed · route: inline · commit: 739499f (RED 5 → GREEN; suite 79 passed)
- [x] T16 (S8) Reiniciar erases every recording after a confirmation; Guardar and Eliminar are buttons only · route: inline · commit: see L13 (RED 4 → GREEN; suite 83 passed)
- [ ] T17 Guardar and Eliminar behavior · waits for the backend
- [x] T18 (S9) step-based keyframes replace recorded trajectories (removed `trajectory.js`, `simplifyTrajectory.js`, `trajectoryRecorder.js`) · route: inline · commits: 9b76908 (CLAUDE.md), 1fc53df (RED → GREEN; suite 72 passed, lint and build green)
- [x] T19 (S10) steps numbered from 0, editing a step with following steps deletes them after a confirmation, "Eliminar paso" deletes in chain with a confirmation, step 0 cannot be deleted · route: inline · commits: fe25821, 645ba07 (RED 11 UI + play file → GREEN; suite 81 passed)
- [ ] T14 (S6, S9) manual check in a real browser and on a phone (pointer mapping and capture are mocked in jsdom) · pending

Route evidence: no Writer trigger (units are sequential and small), so every task runs inline.

## Log

- L1 (2026-11-02): "Por ahora empezemos con el front y dime si no quedo algo claro"
- L2 (2026-11-02): "La pelota sigue al jugador, solo se mueve cuando se seleciona especificamente a ella. Los jugadores se pueden mover libremente por el dominio de la cancha, la pelota tiene que ir de jugador en jugador, como un pase o puede ser un lanzamiento al arco"
- L3: create-vite 9 ships oxlint instead of ESLint; kept it since `npm run lint` is unchanged.
- L4: `npm audit` reports deepmerge/glob advisories inside workbox-build (build-time only, pulled by vite-plugin-pwa 2.0.0); the only automatic fix downgrades to vite-plugin-pwa 1.1.0. Pending user decision.
- L5: simplification uses synchronized Euclidean distance so pauses keep their timing. Assumptions: catch radius 1 m; a release inside the goal is a shot before checking for receivers; the goalkeeper's starting position in goal is not validated yet.
- L6: next step was the playback clock (`requestAnimationFrame`) and the whiteboard SVG; blocked on how several players are recorded with a single pointer.
- L7 (2026-11-02): "Como dijiste / Los 2 supuestos estan bien / Ahora que lo pienso, deberia ser opcional el arquero, entonces quedan como maximo 6 jugadores defensivos y una opcion para habilitar al arquero, cuando se habilite aparece directamente en el arco". Court 20x20 m and 1 m catch radius confirmed; recording by layers confirmed.
- L8: goalkeeper start sits 0.5 m in front of the goal line so a ball released on it is a pass, not a shot. Open question: what re-recording an element that already has a trajectory does.
- L9 (2026-11-02): "La recomendada" (re-record replaces from its start to the end).
- L10 (2026-11-02): "Agrega" (add jsdom and Testing Library for UI tests).
- L11: review assessment over de27094..facb0c6: risk medium, review_due false (under_budget). Default play: 6 attackers vs 6-0 defense without goalkeeper, center back holding the ball. A tap without movement records nothing.
- L12 (2026-11-02): "[CAMBIOS DE DISEÑO] - El ancho y largo debe ser el mismo por mitad de cancha, la cancha mide 40x20, pero si estamos de un solo lado deberia medir 20x20. Diseña un poco por fuera del lado del arco, unos 20px. - Cuando se pega la pelota a un jugador debe hacerlo al frente de ellos, entrando un poco en el diagrama del jugador. - Centra la cancha en el ancho de la pantalla, ahora se ve corrida un poco hacia la izquierda. [FUNCIONALIDADES] - Agrega las opciones de Reinicar, Guardar, Eliminar y Velocidad en 1.5x." Assumption: attackers face the goal and defenders face the half-court line, so the held ball is drawn 0.5 m towards the goal for attackers and away from it for defenders.
- L13 (2026-11-02): "- Eso hace reiniciar. - Crea solo los botenes de guardar y eliminar". Restart keeps the goalkeeper setting because it is not a recording.
- L14 (2026-11-02): "Me vas a matar, pero cambiemos a keyframe las animaciones. Te pido una re disculpa :(" then "1" (steps). T2, T3, T8 and T9 are superseded by T18. Drag keeps the grab offset; a ball in the goal cannot be dragged; disabling the goalkeeper gives the ball back to the previous holder.
- L15 (2026-11-02): "[FIXING] - Que empiece en el paso 0 - Cuando se modifique un paso que tiene paso siguientes, que los siguientes se eliminen advirtiendo las consecuencias [ADD] - Elminar Paso - Si se elimina un paso que tiene pasos siguientes, que se eliminen en cadena advirtiendo." Decision: "Agregar paso" now always appends a copy of the last step; ball-state carry-over was removed because following steps are deleted on edit. Confirmations use window.confirm.
