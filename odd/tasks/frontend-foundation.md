# Frontend foundation

Objective: scaffold the HandLab frontend and build the pure play domain (trajectories, roster rules, ball).
Branch: `feat/frontend-foundation` · Delivery: ask-on-risk · Test runner: Vitest (`npm test` in `frontend/`).

## Specs

- S1: "Por ahora empezemos con el front". Scaffold `frontend/` with React + Vite, Vitest, React Router, CSS Modules and vite-plugin-pwa (manifest and installability only), following the layered folders in CLAUDE.md (`domain`, `application`, `infrastructure`, `ui`).
- S2: "La posición de un jugador en el tiempo `t` es una función pura del dominio (`positionAt(trajectory, t)`), testeable sin DOM." Trajectories are continuous sequences of `(t, x, y)` points, with no keyframes or interpolation between key positions.
- S3: "Las trayectorias se simplifican antes de guardarse (por ejemplo, Ramer-Douglas-Peucker) para reducir puntos."
- S4: "Jugadores por lado: mínimo 1, máximo 7." "El lado defensivo puede tener como máximo 6 jugadores de campo y uno debe ser el arquero, ubicado en el arco."
- S5: "La pelota sigue al jugador, solo se mueve cuando se seleciona especificamente a ella. Los jugadores se pueden mover libremente por el dominio de la cancha, la pelota tiene que ir de jugador en jugador, como un pase o puede ser un lanzamiento al arco"
- Assumption A1: court coordinates are meters on a 20 m x 20 m half court, goal line at `y = 0`, goal centered at `x = 10` and 3 m wide.

## Tasks

- [ ] T1 (S1) scaffold frontend · route: inline · commit: —
- [ ] T2 (S2) `positionAt` · route: inline · commit: —
- [ ] T3 (S3) trajectory simplification (RDP) · route: inline · commit: —
- [ ] T4 (S4) roster rules · route: inline · commit: —
- [ ] T5 (S5, A1) court bounds and ball possession, pass and shot · route: inline · commit: —

Route evidence: no Writer trigger (units are sequential and small), so every task runs inline.

## Log

- L1 (2026-11-02): "Por ahora empezemos con el front y dime si no quedo algo claro"
- L2 (2026-11-02): "La pelota sigue al jugador, solo se mueve cuando se seleciona especificamente a ella. Los jugadores se pueden mover libremente por el dominio de la cancha, la pelota tiene que ir de jugador en jugador, como un pase o puede ser un lanzamiento al arco"
- L3: create-vite 9 ships oxlint instead of ESLint; kept it since `npm run lint` is unchanged.
