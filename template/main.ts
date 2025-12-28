const game = document.createElement("canvas");
const ctx = game.getContext("2d")!;
const padding = 50;
game.width = Math.min(window.innerWidth - padding, 500);
game.height = Math.min(window.innerHeight - padding, 500);
game.style.border = "1.2px solid #fff";

document.getElementById("app")?.appendChild(game);

ctx.fillStyle = "white";
ctx.fillRect(10, 10, 20, 20);
