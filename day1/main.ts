const game = document.createElement('canvas');
const paddingX = 100;
const paddingY = 0;
game.width = 400 + paddingX;
game.height = 300 + paddingY;
const WIDTH = 400;
const HEIGHT = 300;
game.style.border = '1px solid #fff';
document.getElementById('app')!.appendChild(game);
document.body.style.background = 'black';

const ctx = game.getContext('2d')!;
const u8ca = new Uint8ClampedArray(4 * WIDTH * HEIGHT);
const EPS = 1e-6;

class vec2 {
  constructor(public x: number, public y: number) { }
  static add(a: vec2, b: vec2 | number) {
    return b instanceof vec2 ? new vec2(a.x + b.x, a.y + b.y) : new vec2(a.x + b, a.y + b);
  }
  static sub(a: vec2, b: vec2) {
    return new vec2(a.x - b.x, a.y - b.y);
  }
  static mul(a: vec2, b: vec2 | number) {
    return b instanceof vec2 ? new vec2(a.x * b.x, a.y * b.y) : new vec2(a.x * b, a.y * b);
  }
  static div(a: vec2, b: vec2 | number) {
    return b instanceof vec2 ? new vec2(a.x / b.x, a.y / b.y) : new vec2(a.x / b, a.y / b);
  }
  static dot(a: vec2, b: vec2) {
    return a.x * b.x + a.y * b.y;
  }
  static cos(a: vec2) {
    return new vec2(Math.cos(a.x), Math.cos(a.y));
  }
}

class vec4 {
  constructor(public x: number, public y: number, public z: number, public w: number) { }
  static add(a: vec4, b: vec4 | number) {
    return b instanceof vec4
      ? new vec4(a.x + b.x, a.y + b.y, a.z + b.z, a.w + b.w)
      : new vec4(a.x + b, a.y + b, a.z + b, a.w + b);
  }
  static mul(a: vec4, b: vec4 | number) {
    return b instanceof vec4
      ? new vec4(a.x * b.x, a.y * b.y, a.z * b.z, a.w * b.w)
      : new vec4(a.x * b, a.y * b, a.z * b, a.w * b);
  }
  static div(a: vec4, b: vec4) {
    return new vec4(
      a.x / (b.x + EPS),
      a.y / (b.y + EPS),
      a.z / (b.z + EPS),
      a.w / (b.w + EPS)
    );
  }
  static exp(a: vec4) {
    return new vec4(Math.exp(a.x), Math.exp(a.y), Math.exp(a.z), Math.exp(a.w));
  }
  static tanh(a: vec4) {
    return new vec4(Math.tanh(a.x), Math.tanh(a.y), Math.tanh(a.z), Math.tanh(a.w));
  }
}

function toByte(x: number) {
  return Math.max(0, Math.min(255, Math.floor(x * 255)));
}

function setRGBA(x: number, y: number, c: vec4) {
  const i = 4 * (y * WIDTH + x);
  u8ca[i + 0] = toByte(c.x);
  u8ca[i + 1] = toByte(c.y);
  u8ca[i + 2] = toByte(c.z);
  u8ca[i + 3] = 255;
}

function draw(time: number) {
  const r = new vec2(WIDTH, HEIGHT);

  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const I = new vec2(x, y);
      const p = vec2.div(vec2.sub(vec2.add(I, I), r), r.y);

      const zVal = 4 - 4 * Math.abs(0.7 - vec2.dot(p, p));
      let f = vec2.mul(p, zVal);
      let O = new vec4(0, 0, 0, 0);

      for (let k = 1; k <= 8; k++) {
        O = vec4.add(
          O,
          vec4.mul(
            new vec4(
              Math.sin(f.x) + 1,
              Math.sin(f.y) + 1,
              Math.sin(f.y) + 1,
              Math.sin(f.x) + 1
            ),
            Math.abs(f.x - f.y) + 0.1
          )
        );

        const t = vec2.cos(
          vec2.add(vec2.mul(new vec2(f.y, f.x), k), new vec2(k + time, k + time))
        );

        f = vec2.add(f, vec2.add(vec2.div(t, k), 0.7));
      }

      const color = vec4.tanh(
        vec4.div(
          vec4.mul(
            vec4.exp(
              vec4.add(
                vec4.mul(new vec4(-1, 1, 2, 0), -p.y),
                zVal - 4
              )
            ), 7
          ), O
        )
      );

      setRGBA(x, y, color);
    }
  }

  ctx.putImageData(new ImageData(u8ca, WIDTH, HEIGHT), paddingX / 2, paddingY / 2);
}

let start = 0;
function frame(t: number) {
  if (!start) start = t;
  draw((t - start) / 1000);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
