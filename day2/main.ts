const game = document.createElement("canvas");
const ctx = game.getContext("2d")!;
const padding = 50;
game.width = Math.min(window.innerWidth - padding, 500);
game.height = Math.min(window.innerHeight - padding, 500);
game.style.border = "1.2px solid #fff";

document.getElementById("app")?.appendChild(game);

const prism = document.createElement("div");
prism.style.position = "fixed";
prism.innerHTML = `<svg width="300px" height="266px" viewBox="0 0 300 266" xmlns="http://www.w3.org/2000/svg"><g><path d="M300 266H0L149.999 0L300 266ZM1.9993 264.818H298L149.999 2.36444L1.9993 264.818Z" fill="white"/></g></svg>`;
document.body.appendChild(prism);

// Triangle ABC, AC//x axis

function eq(a: number, b: number) {
  return Math.abs(a - b) < 0.000000001;
}

function parseNpx(npx: string) {
  return parseInt(npx.slice(0, -2) || "0", 10);
}

function inPrism(M: Point, p: Prism) {
  const [A, B, C] = p.vertexs;
  function S(x: Point, y: Point, z: Point) {
    const yx = new Vector2(y.x - x.x, y.y - x.y);
    const yz = new Vector2(y.x - z.x, y.y - z.y);
    return Math.abs(Vector2.cross(yx, yz)) / 2;
  }
  return eq(S(A, B, C), S(A, B, M) + S(B, C, M) + S(A, C, M));
}

function line2CP(a: Point, b: Point) {
  a = a.transformC2CLT();
  b = b.transformC2CLT();
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.closePath();
  ctx.lineWidth = 1.4;
  ctx.stroke();
}

class Point {
  constructor(
    public x: number,
    public y: number,
    public base: "ScreenLT" | "CanvasLT" | "C" = "C"
  ) {}
  print() {
    console.log(`Point(${this.x}, ${this.y})`);
  }
  draw() {
    ctx.fillStyle = "white";
    const r = 5;
    const tp = this.transformC2CLT();
    ctx.beginPath();
    ctx.arc(tp.x, tp.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  }
  transformC2SLT() {
    if (this.base !== "C")
      throw `There must be an error, you're trying to transform a Point based on ${this.base} to ScreenLT.`;
    return new Point(this.x + (game.offsetLeft + game.width / 2), this.y + (game.offsetTop + game.height / 2));
  }
  transformSLT2C() {
    if (this.base !== "ScreenLT")
      throw `There must be an error, you're trying to transform a Point based on ${this.base} to C.`;
    return new Point(this.x - (game.offsetLeft + game.width / 2), -this.y + (game.offsetTop + game.height / 2));
  }
  transformC2CLT() {
    if (this.base !== "C")
      throw `There must be an error, you're trying to transform a Point based on ${this.base} to CanvasLT.`;
    return new Point(this.x + game.width / 2, game.height / 2 - this.y);
  }
}

class Vector2 {
  constructor(
    public readonly x: number,
    public readonly y: number
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
  static cross(a: Vector2, b: Vector2) {
    return a.x * b.y - a.y * b.x;
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
    console.log(`Line: y=${this.k || ""}${this.k ? "x" : ""}${this.b > 0 ? "+" : ""}${this.b || ""}`);
  }
  y(x: number) {
    return this.k * x + this.b;
  }
  static intersect(a: Line, b: Line) {
    if (eq(a.k, b.k)) return null;
    const ix = (b.b - a.b) / (a.k - b.k);
    return new Point(ix, a.k * ix + a.b);
  }
}

const theta = Math.PI / 8;
class Light extends Line {
  constructor(
    public canvasContext: CanvasRenderingContext2D,
    public inPrism: boolean,
    public N: [number, string] = [1.55, "white"],
    public S: Point = new Point(-game.width / 2 - 10, -game.height / 8),
    direction: Vector2 = new Vector2(Math.cos(theta), Math.sin(theta))
  ) {
    super(S, direction);
  }
  intersect(a: Line) {
    const u = Line.intersect(this, a);
    if (!u) return null;
    if (Vector2.dot(this.direction, new Vector2(u.x - this.S.x, u.y - this.S.y)) <= 0) return null;
    // a·b > 0 => a, b is in the same direction
    return u;
  }
  draw(prism: Prism) {
    const N = this.N[0];
    ctx.strokeStyle = this.N[1];
    const intersects: [Point, Line][] = [];
    prism.edges.forEach((e) => {
      const a = this.intersect(e);
      if (a && inPrism(a, prism)) intersects.push([a, e]);
    });
    if (!intersects.length) {
      line2CP(this.S, new Point(game.width / 2, this.y(game.width / 2)));
      return;
    }
    intersects.sort((a, b) => a[0].x - b[0].x);
    const [M, AB] = intersects[0];
    line2CP(this.S, M);
    // refraction
    // sinb = sina / N
    const sina = Math.abs(Vector2.cosine(this.direction, AB.direction));
    let sinb: number;
    if (this.inPrism) {
      if (sina - 1 / N > 0) return;
      // total reflection
      sinb = sina * N;
    } else sinb = sina / N;
    const cosb = Math.sqrt(1 - sinb * sinb);
    const cosl = (Math.sqrt(3) * cosb) / 2 + sinb / 2;
    const sinl = (sinb * Math.sqrt(3)) / 2 - cosb / 2;
    let nextDirection: Vector2;
    if (this.inPrism) nextDirection = new Vector2(cosl, -sinl);
    else nextDirection = new Vector2(cosl, sinl);
    const next = new Light(this.canvasContext, !this.inPrism, this.N, M, nextDirection);
    next.draw(prism);
  }
}

class Prism {
  _RectCenter: Point;
  EdgeLength: number;
  lights: Light[];
  constructor(public ele: HTMLDivElement) {
    // IV coordinate sys on whole screen, center at square center
    this._RectCenter = new Point(
      ele.offsetLeft + parseNpx(this.ele.style.left) + this.ele.offsetWidth / 2,
      ele.offsetTop + parseNpx(this.ele.style.top) + this.ele.offsetHeight / 2,
      "ScreenLT"
    );
    this.EdgeLength = ele.offsetWidth;

    this.lights = [
      new Light(ctx, false, [1.25, "red"]),
      new Light(ctx, false, [1.4, "orange"]),
      new Light(ctx, false, [1.55, "yellow"]),
      new Light(ctx, false, [1.7, "green"]),
      new Light(ctx, false, [1.85, "blue"]),
      new Light(ctx, false, [2, "purple"]),
    ];

    ele.addEventListener("mousedown", () => {
      const controller = new AbortController();
      let lx: number;
      let ly: number;
      document.addEventListener(
        "mousemove",
        (e) => {
          if (!lx || !ly) {
            lx = e.clientX;
            ly = e.clientY;
          }
          requestAnimationFrame(() => {
            this._move(e.clientX - lx, e.clientY - ly);
            lx = e.clientX;
            ly = e.clientY;
          });
        },
        { signal: controller.signal }
      );
      document.addEventListener("mouseup", () => controller.abort(), { signal: controller.signal, once: true });
    });
  }
  get center() {
    return this._RectCenter.transformSLT2C();
  }
  get vertexs() {
    return [
      new Point(this.center.x - this.ele.offsetWidth / 2, this.center.y - this.ele.offsetHeight / 2),
      new Point(this.center.x + this.ele.offsetWidth / 2, this.center.y - this.ele.offsetHeight / 2),
      new Point(this.center.x, this.center.y + this.ele.offsetHeight / 2),
    ];
  }
  get edges() {
    const edgeLinks = [
      [0, 1],
      [1, 2],
      [2, 0],
    ];
    const vertexs = this.vertexs;
    const resultEdges = [];
    for (const link of edgeLinks) {
      resultEdges.push(
        new Line(
          vertexs[link[0]],
          new Vector2(vertexs[link[1]].x - vertexs[link[0]].x, vertexs[link[1]].y - vertexs[link[0]].y)
        )
      );
    }
    return resultEdges;
  }
  _move(dx: number, dy: number) {
    const nx = parseNpx(this.ele.style.left) + dx;
    const ny = parseNpx(this.ele.style.top) + dy;
    this._RectCenter = new Point(this._RectCenter.x + dx, this._RectCenter.y + dy, "ScreenLT");
    this.ele.style.left = `${nx}px`;
    this.ele.style.top = `${ny}px`;
    ctx.clearRect(0, 0, game.width, game.height);
    this.lights.forEach((l) => {
      l.draw(this);
    });
  }
  moveTo(p: Point) {
    const tdp = p.transformC2SLT();
    this._move(tdp.x - this._RectCenter.x, tdp.y - this._RectCenter.y);
  }
}

const prismObj = new Prism(prism);
prismObj.moveTo(new Point(0, 0));
