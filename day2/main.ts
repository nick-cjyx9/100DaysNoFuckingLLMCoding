const game = document.createElement("canvas");
const ctx = game.getContext("2d")!;
const padding = 50;
game.width = Math.min(window.innerWidth - padding, 500);
game.height = Math.min(window.innerHeight - padding, 500);
game.style.border = "1.2px solid #fff";

document.getElementById("app")?.appendChild(game);

ctx.fillStyle = "white";
ctx.fillRect(10, 10, 20, 20);

const prism = document.createElement("div");
prism.innerHTML = `<svg width="300" height="266" viewBox="0 0 300 266" xmlns="http://www.w3.org/2000/svg"><g><path d="M300 266H0L149.999 0L300 266ZM1.9993 264.818H298L149.999 2.36444L1.9993 264.818Z" fill="white"/></g></svg>`;
document.getElementById("app")?.appendChild(prism);

// Triangle ABC, AC//x axis

function eq(a: number, b: number) {
  return a - b < 1e-9;
}

class Point {
  constructor(
    public x: number,
    public y: number
  ) {}
  print() {
    console.log(`Point(${this.x}, ${this.y})`);
  }
}

class Vector2 {
  constructor(
    public x: number,
    public y: number
  ) {}
  norm() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  print() {
    console.log(`Vector2(${this.x}, ${this.y})`);
  }
  static dot(a: Vector2, b: Vector2) {
    return a.x * b.x + a.y * b.y;
  }
  static cosine(a: Vector2, b: Vector2) {
    return Vector2.dot(a, b) / (a.norm() * b.norm());
  }
}

class Line {
  k = Infinity;
  b = Infinity;
  constructor(
    public S: Point,
    public direction: Vector2
  ) {
    this.k = direction.y / direction.x;
    this.b = S.y - this.k * S.x;
  }
  print() {
    console.log(`Line: y=${this.k}x+${this.b}`);
  }
  static intersect(a: Line, b: Line) {
    if (eq(a.k, b.k)) return null;
    const ix = (b.b - a.b) / (a.k - b.k);
    return new Point(ix, a.k * ix + a.b);
  }
}

class Light extends Line {}

class Prism {
  constructor(public ele: HTMLDivElement) {}
}
