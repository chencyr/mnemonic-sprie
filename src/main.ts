import "./style.css";

type Mode = "title" | "playing" | "complete";

type Vec2 = {
  x: number;
  y: number;
};

type Rune = Vec2 & {
  id: number;
  collected: boolean;
};

declare global {
  interface Window {
    advanceTime?: (ms: number) => void;
    render_game_to_text?: () => string;
  }
}

const canvas = document.querySelector<HTMLCanvasElement>("#game");

if (!canvas) {
  throw new Error("Missing #game canvas");
}

const renderingContext = canvas.getContext("2d");

if (!renderingContext) {
  throw new Error("Canvas 2D context is unavailable");
}

const ctx: CanvasRenderingContext2D = renderingContext;

const world = {
  width: 960,
  height: 540,
};

const keys = new Set<string>();
let lastFrame = performance.now();

const state = {
  mode: "title" as Mode,
  elapsed: 0,
  score: 0,
  player: {
    x: world.width / 2,
    y: world.height - 88,
    radius: 16,
    speed: 220,
  },
  runes: [
    { id: 1, x: 210, y: 390, collected: false },
    { id: 2, x: 480, y: 278, collected: false },
    { id: 3, x: 735, y: 164, collected: false },
  ] as Rune[],
};

function resetGame() {
  state.mode = "playing";
  state.elapsed = 0;
  state.score = 0;
  state.player.x = world.width / 2;
  state.player.y = world.height - 88;
  for (const rune of state.runes) {
    rune.collected = false;
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function distance(a: Vec2, b: Vec2) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function update(dt: number) {
  if (state.mode !== "playing") {
    return;
  }

  state.elapsed += dt;

  const move = { x: 0, y: 0 };
  if (keys.has("arrowleft") || keys.has("a")) move.x -= 1;
  if (keys.has("arrowright") || keys.has("d")) move.x += 1;
  if (keys.has("arrowup") || keys.has("w")) move.y -= 1;
  if (keys.has("arrowdown") || keys.has("s")) move.y += 1;

  const length = Math.hypot(move.x, move.y) || 1;
  state.player.x = clamp(
    state.player.x + (move.x / length) * state.player.speed * dt,
    state.player.radius,
    world.width - state.player.radius,
  );
  state.player.y = clamp(
    state.player.y + (move.y / length) * state.player.speed * dt,
    state.player.radius,
    world.height - state.player.radius,
  );

  for (const rune of state.runes) {
    if (!rune.collected && distance(state.player, rune) < state.player.radius + 18) {
      rune.collected = true;
      state.score += 1;
    }
  }

  if (state.score === state.runes.length) {
    state.mode = "complete";
  }
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, world.height);
  gradient.addColorStop(0, "#28313f");
  gradient.addColorStop(0.5, "#171b22");
  gradient.addColorStop(1, "#101318");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, world.width, world.height);

  ctx.strokeStyle = "rgba(246, 241, 223, 0.11)";
  ctx.lineWidth = 2;
  for (let y = 118; y < world.height; y += 78) {
    ctx.beginPath();
    ctx.moveTo(110, y);
    ctx.lineTo(world.width - 110, y - 34);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(95, 183, 166, 0.18)";
  ctx.beginPath();
  ctx.moveTo(480, 74);
  ctx.lineTo(260, 486);
  ctx.lineTo(700, 486);
  ctx.closePath();
  ctx.fill();
}

function drawRunes() {
  for (const rune of state.runes) {
    if (rune.collected) {
      continue;
    }

    ctx.fillStyle = "#f1c65b";
    ctx.strokeStyle = "#fff3bd";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(rune.x, rune.y, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#27303a";
    ctx.font = "700 18px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(rune.id), rune.x, rune.y + 1);
  }
}

function drawPlayer() {
  ctx.fillStyle = "#5fb7a6";
  ctx.strokeStyle = "#c6fff1";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(state.player.x, state.player.y, state.player.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawHud() {
  ctx.fillStyle = "#f6f1df";
  ctx.font = "600 18px Inter, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(`Runes ${state.score}/${state.runes.length}`, 28, 24);
}

function drawTitle() {
  ctx.fillStyle = "rgba(16, 19, 24, 0.72)";
  ctx.fillRect(0, 0, world.width, world.height);
  ctx.fillStyle = "#f6f1df";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 52px Inter, sans-serif";
  ctx.fillText("Mnemonic Spire", world.width / 2, 214);
  ctx.font = "500 20px Inter, sans-serif";
  ctx.fillText("Press Enter to begin", world.width / 2, 282);
  ctx.fillText("Move with WASD or arrow keys", world.width / 2, 318);
}

function drawComplete() {
  ctx.fillStyle = "rgba(16, 19, 24, 0.72)";
  ctx.fillRect(0, 0, world.width, world.height);
  ctx.fillStyle = "#f6f1df";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 44px Inter, sans-serif";
  ctx.fillText("Spire Remembered", world.width / 2, 238);
  ctx.font = "500 20px Inter, sans-serif";
  ctx.fillText("Press Enter to restart", world.width / 2, 298);
}

function render() {
  ctx.clearRect(0, 0, world.width, world.height);
  drawBackground();
  drawRunes();
  drawPlayer();
  drawHud();

  if (state.mode === "title") {
    drawTitle();
  } else if (state.mode === "complete") {
    drawComplete();
  }
}

function frame(now: number) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

function renderGameToText() {
  return JSON.stringify({
    note: "Coordinates use canvas pixels with origin at top-left, x increases right, y increases down.",
    mode: state.mode,
    player: {
      x: Math.round(state.player.x),
      y: Math.round(state.player.y),
      radius: state.player.radius,
    },
    runes: state.runes.map((rune) => ({
      id: rune.id,
      x: rune.x,
      y: rune.y,
      collected: rune.collected,
    })),
    score: state.score,
    elapsed: Number(state.elapsed.toFixed(2)),
  });
}

window.render_game_to_text = renderGameToText;
window.advanceTime = (ms: number) => {
  const steps = Math.max(1, Math.round(ms / (1000 / 60)));
  for (let i = 0; i < steps; i += 1) {
    update(1 / 60);
  }
  render();
};

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  keys.add(key);

  if (key === "enter" && state.mode !== "playing") {
    resetGame();
  }

  if (key === "f") {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void canvas.requestFullscreen();
    }
  }
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

render();
requestAnimationFrame(frame);
