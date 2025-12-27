class Vec2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  screen(ctx) {
    return new Vec2((this.x + 1) / 2 * ctx.WIDTH, (1 - (this.y + 1) / 2) * ctx.HEIGHT);
  }
}

class Vec3 {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  project(dz) {
    return new Vec2(this.x / (this.z + dz), this.y / (this.z + dz));
  }
  translateY(dy) {
    this.y += dy;
    return this;
  }
  rotateXZ(theta) {
    // (r*cosT, r*sinT) -> (r*cos(T+d), r*sin(T+d)) = (rcosTcosd-rsinTsind, rsinTcosd+rsindcosT)
    // (rcosTcosd-rsinTsind, rsinTcosd+rsindcosT) = (x0cosd-y0sind, y0cosd+x0sind)
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    const nx = this.x * c - this.z * s;
    const nz = this.z * c + this.x * s;
    this.x = nx;
    this.z = nz;
    return this;
  }
}

class CanvasCtx {
  constructor(canvas, sw, sh, bg = 'black', fg = 'green', fps = 60, rw = 20, rh = 20) {
    this.context = canvas.getContext("2d");
    this.WIDTH = sw;
    this.HEIGHT = sh;
    this.BACKGROUND = bg;
    this.FOREGROUND = fg;
    this.FPS = fps;
    this.rectH = rh;
    this.rectW = rw;
    this.model = null;
  }
  clear() {
    this.context.clearRect(0, 0, this.WIDTH, this.HEIGHT);
  }
  draw(vec2) {
    this.context.fillStyle = this.FOREGROUND;
    this.context.fillRect(vec2.x - this.rectW / 2, vec2.y - this.rectH / 2, this.rectW, this.rectH);
  }
  line(v1, v2) {
    this.context.lineWidth = 3;
    this.context.strokeStyle = this.FOREGROUND
    this.context.beginPath();
    this.context.moveTo(v1.x, v1.y);
    this.context.lineTo(v2.x, v2.y);
    this.context.closePath();
    this.context.stroke();
  }
  import_model(model) {
    this.model = model;
  }
  rotate_model(viewDistance = 1) {
    if (!this.model) {
      console.log("No model loaded!!!");
      return;
    }
    const theta = Math.PI / ctx.FPS;
    function frame() {
      ctx.clear();
      for (const v of this.model.vectors) {
        v.rotateXZ(theta);
      }
      for (const f of this.model.lines) {
        for (let i = 0; i < f.length; ++i) {
          const a = this.model.vectors[f[i]];
          const b = this.model.vectors[f[(i + 1) % f.length]];
          ctx.line(
            a.project(viewDistance).screen(ctx),
            b.project(viewDistance).screen(ctx)
          );
        }
      }
      requestAnimationFrame(frame.bind(this));
    }
    requestAnimationFrame(frame.bind(this));
  }
}

class BaseModel {
  constructor(vectors = [], lines = []) {
    this.vectors = vectors;
    this.lines = lines;
  }
  translateY(dy) {
    this.vectors.forEach((v) => {
      v.translateY(dy);
    })
  }
}

const CubeModel = new BaseModel([
  new Vec3(0.25, 0.25, 0.25),
  new Vec3(-0.25, 0.25, 0.25),
  new Vec3(-0.25, -0.25, 0.25),
  new Vec3(0.25, -0.25, 0.25),
  new Vec3(0.25, 0.25, -0.25),
  new Vec3(-0.25, 0.25, -0.25),
  new Vec3(-0.25, -0.25, -0.25),
  new Vec3(0.25, -0.25, -0.25),
], [
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7]
])

class ObjModel {
  constructor(obj = '') {
    this.obj = obj;
  }
  convert() {
    const vs = [];
    const ls = [];
    for (const l of this.obj.split('\n')) {
      if (l.startsWith('v ')) {
        const tv = l.split(' ').slice(1).map(parseFloat);
        vs.push(new Vec3(...tv));
      } else if (l.startsWith('f ')) {
        const tls = l.split(' ').slice(1).map((ls) => parseInt(ls.split('/')[0]) - 1);
        ls.push(tls);
      }
    }
    return new BaseModel(vs, ls);
  }
}

const ctx = new CanvasCtx(game, 500, 500);

fetch('./penger.obj').then((x) => {
  x.text().then((obj) => {
    const PengerModel = new ObjModel(obj).convert();
    PengerModel.translateY(-1.6);
    ctx.import_model(PengerModel);
    ctx.rotate_model(2.8);
  })
})
