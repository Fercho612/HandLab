# Frontend foundation

Objective: scaffold the HandLab frontend and build the pure play domain (trajectories, roster rules, ball).
Branch: `feat/frontend-foundation` · Delivery: ask-on-risk · Test runner: Vitest (`npm test` in `frontend/`).

## Specs

- S1: "Por ahora empezemos con el front". Scaffold `frontend/` with React + Vite, Vitest, React Router, CSS Modules and vite-plugin-pwa (manifest and installability only), following the layered folders in CLAUDE.md (`domain`, `application`, `infrastructure`, `ui`).
- S2: "La posición de un jugador en el tiempo `t` es una función pura del dominio (`positionAt(trajectory, t)`), testeable sin DOM." Trajectories are continuous sequences of `(t, x, y)` points, with no keyframes or interpolation between key positions.
- S3: "Las trayectorias se simplifican antes de guardarse (por ejemplo, Ramer-Douglas-Peucker) para reducir puntos."
- S4: "Jugadores por lado: mínimo 1, máximo 7." "deberia ser opcional el arquero, entonces quedan como maximo 6 jugadores defensivos y una opcion para habilitar al arquero, cuando se habilite aparece directamente en el arco"
- S6: "Un único loop con `requestAnimationFrame` y un reloj compartido mueve a todos los jugadores. Esto sincroniza la reproducción y permite pausar, retroceder, cambiar la velocidad y arrastrar la línea de tiempo."
- S7: Recording by layers ("Como dijiste"): one element is recorded per pass while the already recorded ones play back on the same timeline. Samples are `(t, x, y)` taken while dragging, kept inside the court and simplified before saving.
- S5: "La pelota sigue al jugador, solo se mueve cuando se seleciona especificamente a ella. Los jugadores se pueden mover libremente por el dominio de la cancha, la pelota tiene que ir de jugador en jugador, como un pase o puede ser un lanzamiento al arco"
- Assumption A1: court coordinates are meters on a 20 m x 20 m half court, goal line at `y = 0`, goal centered at `x = 10` and 3 m wide.

## Tasks

- [x] T1 (S1) scaffold frontend · route: inline · commit: a74d1e1 (build + lint green)
- [x] T2 (S2) `positionAt` · route: inline · commit: 1ecd881 (RED 6 failed → GREEN 6 passed)
- [x] T3 (S3) trajectory simplification (RDP) · route: inline · commit: d3c232f (RED 6 → GREEN)
- [x] T4 (S4) roster rules · route: inline · commits: aae9e48, reopened by L7 and fixed in ca4e428 (RED 8 → GREEN)
- [x] T5 (S5, A1) court bounds and ball possession, pass and shot · route: inline · commits: b3afcc1, d72ab82 (RED 13 → GREEN; suite 33 passed)
- [x] T6 (S4) goalkeeper appears in goal when enabled · route: inline · commit: ca4e428 (`setGoalkeeperEnabled`, start at x 10, y 0.5)
- [x] T7 (S6) shared playback clock · route: inline · commit: e0343a2 (RED 10 → GREEN)
- [x] T8 (S7) trajectory recorder for one layer · route: inline · commit: 005ca29 (RED 5 → GREEN; suite 51 passed, lint and build green)
- [ ] T9 (S6, S7) whiteboard SVG with the requestAnimationFrame loop and layer recording · route: inline · blocked on re-recording semantics

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
