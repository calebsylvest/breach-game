import { Game } from "./game.ts";

const container = document.getElementById("game");
if (!container) throw new Error("#game container missing");

const game = new Game(container);
game.start();

if (import.meta.env.DEV) {
  (window as unknown as { __BREACH__: Game }).__BREACH__ = game;
}
