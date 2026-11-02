# CLAUDE.md - HandLab

HandLab es una aplicación (PWA) que cuenta con una "pizarra" que es la mitad de una cancha de Handball, en ella se puede aprender tacticas del juego, crear jugadas como animaciones y poder revisarlas.  

## Stack
- Language/runtime: JavaScript, Python 3.12
- Framework: React + Vite, FastAPI
- Routing (frontend): React Router
- Styles (frontend): CSS Modules (built into Vite, no extra dependency)
- Data: PostgreSQL (Docker), Alembic (migrations)
- Tests: Vitest (jsdom + Testing Library for UI components), Pytest
- Lint (backend): Ruff
- PWA: vite-plugin-pwa (manifest and installability only, no offline caching of plays)

## Commands
Frontend (`frontend/`):
- Install: `npm install`
- Dev: `npm run dev`
- Test: `npm test`
- Lint: `npm run lint`

Backend (`backend/`):
- Install: `pip install -r requirements.txt`
- Database: `docker compose up -d db`
- Migrate: `alembic upgrade head`
- New migration: `alembic revision --autogenerate -m "<message>"`
- Dev: `uvicorn app.main:app --reload`
- Lint: `ruff check .`
- Test: `pytest`

## Arquitectura
Monorepo with two apps (planned structure, folders not created yet):

```
HandLab/
├── frontend/            # React + Vite PWA
│   └── src/
│       ├── domain/          # Play, Trajectory, Player, Court: pure logic, no framework imports
│       ├── application/     # use cases (create play, record trajectory, play animation)
│       ├── infrastructure/  # adapters: API client
│       └── ui/              # components and pages (whiteboard, play list, viewer)
└── backend/             # FastAPI
    └── app/
        ├── domain/          # entities and business rules, no FastAPI/SQL imports
        ├── application/     # use cases and ports (repository interfaces)
        ├── infrastructure/  # adapters: PostgreSQL repositories, migrations
        └── api/             # FastAPI routers and request/response schemas
```

- Dependency rule (both apps): `ui`/`api` -> `application` -> `domain`. `infrastructure` implements ports defined in `application`.
- `domain` never imports from other layers.
- Frontend and backend communicate only through the HTTP API; no shared code.
- Tests mirror the source tree (`frontend/src/...` -> Vitest, `backend/tests/...` -> Pytest).

## Convenciones
- Commits empiezan con: (`feat:`, `fix:`, `docs:`).
- Codigo/Nombres de variables en Ingles.
- Texto de la Aplicacion en Español. 
- Escribir los tests primero para cualquier cambio de comportamiento.
- Pequeños commits, una preocupación cada uno.
- Nunca comitear `.env`.

## No hacer
- No agregar nada al stack sin consultar y justificar.

## Dominio
- No hay modo sin conexión. Si el usuario no tiene conexión al intentar una acción que la requiere, se le notifica que no tiene conexión y la acción no se ejecuta.
- Autenticación: email + contraseña. El backend emite un JWT de acceso (vida corta) y un refresh token, ambos en cookies httpOnly. Las contraseñas se guardan hasheadas (argon2 o bcrypt).
- Las jugadas se arman por pasos (keyframes): cada paso guarda la posición de cada jugador y el estado de la pelota. Al reproducir, todo se interpola linealmente entre pasos consecutivos; cada transición dura 1 s.
- Agregar un paso copia el paso actual; luego se mueven los jugadores o la pelota en ese paso.
- Jugadores por lado: mínimo 1, máximo 7.
- El lado defensivo puede tener como máximo 6 jugadores de campo.
- El arquero es opcional: se habilita con una opción y, al habilitarlo, aparece directamente en el arco.
- Los jugadores se modelan como SVG.
- Los jugadores se mueven libremente dentro de la cancha.
- Cada jugada tiene una pelota, modelada como SVG y animada con el mismo modelo de pasos que los jugadores.
- La pelota sigue al jugador que la tiene: mientras está en posesión, se dibuja al frente de ese jugador (los atacantes miran al arco, los defensores a la mitad de cancha).
- La pelota solo se mueve por sí misma cuando el usuario la selecciona específicamente. Ese movimiento es un pase (termina en otro jugador, que pasa a tenerla) o un lanzamiento al arco, y ocurre en la transición entre el paso anterior y el paso editado. El cambio se aplica también a los pasos siguientes que tenían la pelota en el mismo estado.
- Las lecciones (sección "Aprende") se componen de textos y jugadas. Cualquier usuario puede crear lecciones.
- Jugadas y lecciones son públicas o privadas. Las públicas aparecen en un feed.
- Cada usuario tiene un perfil con foto y descripción.

### Renderizado y animación
- Puramente 2D. La optimización es un criterio de diseño.
- La posición de un jugador en el tiempo `t` es una función pura del dominio (`playerPositionAt(play, playerId, t)`), testeable sin DOM.
- Un único loop con `requestAnimationFrame` y un reloj compartido mueve a todos los jugadores. Esto sincroniza la reproducción y permite pausar, retroceder, cambiar la velocidad y arrastrar la línea de tiempo.
- En cada frame se escribe `transform: translate(x, y)` directo sobre los elementos SVG (vía refs). No se usa estado de React por frame, para no re-renderizar.
- No agregar librerías de animación ni de canvas. Solo evaluar Canvas 2D si el profiling muestra un problema real con SVG.