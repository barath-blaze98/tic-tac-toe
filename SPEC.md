# Multiplayer Tic Tac Toe — Architecture Spec

> **For coding agents.** Follow this spec precisely. Do not deviate from the folder structure, event contracts, or game logic rules defined here.

---

## Meta

| Field | Value |
|---|---|
| Project | Multiplayer Tic Tac Toe |
| Frontend Hosting | GitHub Pages (static) |
| Backend Hosting | Render (Node.js web service) |
| Real-time Transport | Socket.io over WebSocket |
| Database | None — in-memory only |
| Auth | Room ID + pass key (no user accounts) |

---

## Folder Structure

```
/
├── frontend/                        # Deployed to GitHub Pages
│   ├── index.html
│   ├── style.css
│   ├── js/
│   │   ├── main.js                  # Entry point — bootstraps UI state
│   │   ├── socket.js                # All Socket.io client logic (ONLY file that touches the socket)
│   │   ├── ui.js                    # DOM rendering functions — no game logic here
│   │   └── game.js                  # Client-side constants (symbols, statuses) — NO logic
│   └── assets/
│
└── backend/                         # Deployed to Render
    ├── server.js                    # HTTP server bootstrap (raw Node http — no Express)
    ├── socket-handler.js            # Registers all socket event listeners
    ├── room-manager.js              # Room CRUD and in-memory store
    ├── game-engine.js               # Win/draw detection, move validation, board logic
    └── package.json
```

### Rules

- `socket.js` on the frontend is the **single point of contact** with the server. No other frontend file may import or reference the socket.
- `game-engine.js` on the backend owns **all game logic**. No game logic lives on the client.
- `ui.js` only reads state and renders — it never writes state.

---

## Backend Stack

```json
{
  "dependencies": {
    "socket.io": "^4.x",
    "bcryptjs": "^2.x"
  }
}
```

**No Express.** Use a raw Node.js `http` server:

```js
// server.js
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer();
const io = new Server(server, {
  cors: { origin: "https://<your-github-pages-domain>", methods: ["GET", "POST"] }
});

require('./socket-handler')(io);

server.listen(process.env.PORT || 3000);
```

---

## In-Memory Room Store

Managed exclusively by `room-manager.js`. No other file may read or write the store directly.

```js
// Shape of each room in the Map
{
  roomId: String,           // 6-char alphanumeric, e.g. "X7K2PQ"
  passKeyHash: String,      // bcrypt hash of the pass key
  players: [
    { socketId: String, role: "X" | "O" }
  ],                        // max length: 2
  board: Array(9).fill(null),  // null | "X" | "O"
  turn: "X" | "O",
  status: "waiting" | "playing" | "ended",
  replayVotes: Set<socketId>
}
```

### Room Manager API (internal)

| Function | Description |
|---|---|
| `createRoom(passKey)` | Hashes key, generates roomId, stores room, returns roomId |
| `joinRoom(roomId, passKey)` | Verifies hash, adds player, returns role or error |
| `getRoom(roomId)` | Returns room object or null |
| `applyMove(roomId, index)` | Validates turn + cell, updates board, returns updated room |
| `registerReplayVote(roomId, socketId)` | Adds vote, returns vote count |
| `resetRoom(roomId)` | Clears board, swaps starting turn, clears votes, sets status to "playing" |
| `removePlayer(roomId, socketId)` | Removes player, sets status to "waiting" or deletes room if empty |

---

## WebSocket Event Contracts

### Client → Server

#### `create_room`
```json
{
  "passKey": "string (4–20 chars)"
}
```
_Server response:_ `room_created` or `error`

---

#### `join_room`
```json
{
  "roomId": "string (6 chars)",
  "passKey": "string"
}
```
_Server response:_ `game_start` emitted to both players, or `error` to this client

---

#### `make_move`
```json
{
  "roomId": "string",
  "index": "number (0–8)"
}
```
_Server response:_ `board_update` emitted to both players, or `error` to this client

---

#### `replay_request`
```json
{
  "roomId": "string"
}
```
_Server response:_ `replay_vote` to both players; `game_start` to both when votes reach 2

---

#### `leave_room`
```json
{
  "roomId": "string"
}
```
_Server response:_ `player_left` emitted to the remaining player

---

### Server → Client

#### `room_created`
```json
{
  "roomId": "string"
}
```
Sent only to the creator. They must share the roomId and passKey with their opponent out-of-band.

---

#### `game_start`
```json
{
  "board": [null, null, null, null, null, null, null, null, null],
  "turn": "X",
  "role": "X" | "O"
}
```
Emitted to each player individually (role differs per player).

---

#### `board_update`
```json
{
  "board": ["X", null, "O", null, null, null, null, null, null],
  "turn": "X" | "O",
  "winner": "X" | "O" | "draw" | null
}
```
Emitted to both players after every valid move. If `winner` is non-null, the game has ended.

---

#### `replay_vote`
```json
{
  "votes": 1 | 2
}
```
Emitted to both players when a replay vote is cast.

---

#### `player_left`
```json
{}
```
Emitted to the remaining player when their opponent disconnects or leaves.

---

#### `error`
```json
{
  "code": "ROOM_NOT_FOUND" | "WRONG_PASSKEY" | "ROOM_FULL" | "NOT_YOUR_TURN" | "CELL_TAKEN" | "GAME_NOT_STARTED",
  "message": "string"
}
```
Emitted only to the client that triggered the error.

---

## Game Logic Rules

All of the following rules are enforced **server-side only** in `game-engine.js`. The client never validates moves.

### Move Validation
- Reject if `status !== "playing"`
- Reject if the moving player's role !== `turn`
- Reject if `board[index] !== null`

### Win Detection
Check all 8 winning lines after every move:
```
Rows:    [0,1,2], [3,4,5], [6,7,8]
Columns: [0,3,6], [1,4,7], [2,5,8]
Diagonals: [0,4,8], [2,4,6]
```
If all cells in any line are the same non-null value → that value is the winner.

### Draw Detection
If no winner and `board.every(cell => cell !== null)` → result is `"draw"`.

### Turn Order
- Game always starts with `"X"`.
- On replay, the starting turn swaps (if X started last game, O starts next).

### Replay
- Either player may vote after `status === "ended"`.
- A player may not vote more than once.
- When `replayVotes.size === 2`, call `resetRoom` and emit `game_start` to both players.

### Disconnect Handling
- On `disconnect`, check all rooms for this socketId.
- If found, call `removePlayer` and emit `player_left` to the remaining player.
- This must use the built-in Socket.io `disconnect` event, not `leave_room`.

---

## Render Deployment

- Set environment variable `PORT` — Render injects this automatically.
- `package.json` start script must be: `"start": "node server.js"`
- Enable **CORS** in the Socket.io server config, scoped to your exact GitHub Pages origin. Do not use `origin: "*"` in production.

---

## Constraints & Non-Goals

- No database. If the server restarts, all active rooms are lost. This is acceptable.
- No user accounts or persistent identity.
- No spectator mode.
- No chat.
- No mobile-specific backend logic — the frontend handles responsive UI.
- Maximum 2 players per room. Reject any `join_room` if `players.length === 2`.