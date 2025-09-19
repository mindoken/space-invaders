// src/sprite.js
class Sprite {
  constructor(img, x, y, w, h) {
    this.img = img;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
}

// src/cannon.js
class Cannon {
  constructor(x, y, sprite, maxHp = 3) {
    this.x = x;
    this.y = y;
    this._sprite = sprite;
    this.hp = maxHp;
    this.maxHp = maxHp;
    this.destroyed = false;
  }
  draw(ctx, time) {
    ctx.drawImage(this._sprite.img, this._sprite.x, this._sprite.y, this._sprite.w, this._sprite.h, this.x, this.y, this._sprite.w, this._sprite.h);
  }
  takeDamage(amount = 1) {
    if (this.destroyed)
      return;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.destroyed = true;
    }
  }
}

// src/bullet.js
class Bullet {
  constructor(x, y, vy, w, h, color) {
    this.x = x;
    this.y = y;
    this.vy = vy;
    this.w = w;
    this.h = h;
    this.color = color;
  }
  update(time) {
    this.y += this.vy;
  }
  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }
}

// src/alien.js
class Alien {
  constructor(x, y, [spriteA, spriteB], maxHp = 1) {
    this.x = x;
    this.y = y;
    this._spriteA = spriteA;
    this._spriteB = spriteB;
    this.hp = maxHp;
    this.maxHp = maxHp;
    this.destroyed = false;
  }
  draw(ctx, time) {
    let sp = Math.ceil(time / 1000) % 2 === 0 ? this._spriteA : this._spriteB;
    ctx.drawImage(sp.img, sp.x, sp.y, sp.w, sp.h, this.x, this.y, sp.w, sp.h);
  }
  takeDamage(amount = 1) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.destroyed = true;
    }
  }
}

// src/input-handler.js
class InputHandler {
  constructor() {
    this.down = {};
    this.pressed = {};
    document.addEventListener("keydown", (e) => {
      this.down[e.code] = true;
    });
    document.addEventListener("keyup", (e) => {
      delete this.down[e.code];
      delete this.pressed[e.code];
    });
  }
  isDown(code) {
    return this.down[code];
  }
  isPressed(code) {
    if (this.pressed[code]) {
      return false;
    } else if (this.down[code]) {
      return this.pressed[code] = true;
    }
    return false;
  }
}

// assets/invaders.png
var invaders_default = "./invaders-01smhj7c.png";

// src/game.js
var assets;
var sprites = {
  aliens: [],
  cannon: null,
  bunker: null
};
var gameState = {
  bullets: [],
  aliens: [],
  cannon: null,
  enemyBullets: [],
  alienDirection: 1,
  alienSpeed: 0.5,
  alienDropY: 20,
  lastEnemyFire: 0,
  baseReload: 2000,
  score: 0,
  isGameOver: false,
  isVictory: false
};
var inputHandler = new InputHandler;
var CanvasHeight;
function preload(onPreloadComplete) {
  assets = new Image;
  assets.addEventListener("load", () => {
    sprites.cannon = new Sprite(assets, 62, 0, 22, 16);
    sprites.bunker = new Sprite(assets, 84, 8, 36, 24);
    sprites.aliens = [
      [new Sprite(assets, 0, 0, 22, 16), new Sprite(assets, 0, 16, 22, 16)],
      [new Sprite(assets, 22, 0, 16, 16), new Sprite(assets, 22, 16, 16, 16)],
      [new Sprite(assets, 38, 0, 24, 16), new Sprite(assets, 38, 16, 24, 16)]
    ];
    onPreloadComplete();
  });
  assets.src = invaders_default;
}
function init(canvas) {
  circleFormation(sprites.aliens, 200, canvas.width / 2, canvas.height / 4);
  gameState.cannon = new Cannon(100, canvas.height - 100, sprites.cannon);
  CanvasHeight = canvas.height;
}
function update(time, stopGame) {
  if (gameState.isGameOver || gameState.isVictory)
    return;
  if (inputHandler.isDown("ArrowLeft")) {
    gameState.cannon.x -= 4;
  }
  if (inputHandler.isDown("ArrowRight")) {
    gameState.cannon.x += 4;
  }
  gameState.cannon.x = Math.max(0, Math.min(600 - gameState.cannon._sprite.w, gameState.cannon.x));
  if (inputHandler.isPressed("Space")) {
    const bulletX = gameState.cannon.x + 10;
    const bulletY = gameState.cannon.y;
    gameState.bullets.push(new Bullet(bulletX, bulletY, -8, 2, 6, "#fff"));
  }
  moveAliens(600);
  if (gameState.aliens.some((alien) => alien.y > CanvasHeight - 120)) {
    gameState.isGameOver = true;
    return;
  }
  handleEnemyFire(time);
  [...gameState.bullets, ...gameState.enemyBullets].forEach((b) => b.update(time));
  handleCollisions();
  cleanupEntities();
  if (gameState.aliens.length === 0) {
    gameState.isVictory = true;
  }
  if (gameState.cannon.destroyed) {
    gameState.isGameOver = true;
  }
}
function draw(canvas, time) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  ctx.font = "16px monospace";
  ctx.textBaseline = "top";
  ctx.fillText(`HP: ${gameState.cannon.hp}`, 10, 10);
  ctx.fillText(`Score: ${gameState.score}`, canvas.width - 120, 10);
  if (gameState.isGameOver) {
    ctx.fillStyle = "red";
    ctx.font = "48px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);
    return;
  }
  if (gameState.isVictory) {
    ctx.fillStyle = "green";
    ctx.font = "48px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Victory", canvas.width / 2, canvas.height / 2);
    return;
  }
  gameState.aliens.forEach((a) => a.draw(ctx, time));
  gameState.cannon.draw(ctx);
  gameState.bullets.forEach((b) => b.draw(ctx));
  gameState.enemyBullets.forEach((b) => b.draw(ctx));
}
function moveAliens(canvasWidth) {
  const { aliens, alienDirection, alienSpeed, alienDropY } = gameState;
  let minX = Infinity;
  let maxX = -Infinity;
  aliens.forEach((a) => {
    const w = a._spriteA.w;
    minX = Math.min(minX, a.x);
    maxX = Math.max(maxX, a.x + w);
  });
  const willGoLeftEdge = minX + alienDirection * alienSpeed < 0;
  const willGoRightEdge = maxX + alienDirection * alienSpeed > canvasWidth;
  if (willGoLeftEdge || willGoRightEdge) {
    aliens.forEach((a) => {
      a.y += alienDropY;
    });
    gameState.alienDirection = -alienDirection;
  } else {
    aliens.forEach((a) => {
      a.x += alienDirection * alienSpeed;
    });
  }
}
function rectsIntersect(r1, r2) {
  return !(r2.x > r1.x + r1.w || r2.x + r2.w < r1.x || r2.y > r1.y + r1.h || r2.y + r2.h < r1.y);
}
function handleCollisions() {
  for (const bullet of gameState.bullets) {
    const prevY = bullet.y - bullet.vy;
    const sweep = {
      x: bullet.x,
      y: Math.min(prevY, bullet.y),
      w: bullet.w,
      h: Math.abs(bullet.vy) + bullet.h
    };
    for (const alien of gameState.aliens) {
      const aw = alien._spriteA.w;
      const ah = alien._spriteA.h;
      const aRect = { x: alien.x, y: alien.y, w: aw, h: ah };
      if (!bullet.destroyed && !alien.destroyed && rectsIntersect(sweep, aRect)) {
        bullet.destroyed = true;
        alien.takeDamage(1);
        if (alien.destroyed)
          gameState.score += 100;
      }
    }
  }
  const cannon = gameState.cannon;
  const cRect = { x: cannon.x, y: cannon.y, w: cannon._sprite.w, h: cannon._sprite.h };
  for (const eb of gameState.enemyBullets) {
    if (rectsIntersect({ x: eb.x, y: eb.y, w: eb.w, h: eb.h }, cRect) && !eb.destroyed && !cannon.destroyed) {
      eb.destroyed = true;
      cannon.takeDamage(1);
    }
  }
}
function cleanupEntities() {
  gameState.bullets = gameState.bullets.filter((b) => !b.destroyed && b.y + b.h > 0 && b.y < CanvasHeight);
  gameState.enemyBullets = gameState.enemyBullets.filter((b) => !b.destroyed && b.y > 0);
  gameState.aliens = gameState.aliens.filter((a) => !a.destroyed);
}
function handleEnemyFire(time) {
  const { aliens, lastEnemyFire, baseReload } = gameState;
  const aliveCount = aliens.length;
  if (aliveCount === 0)
    return;
  const reloadTime = baseReload * (aliveCount / (3 * 10));
  if (time - lastEnemyFire < reloadTime)
    return;
  const columns = {};
  aliens.forEach((alien) => {
    const col = Math.floor(alien.x / 30);
    if (!columns[col] || alien.y > columns[col].y) {
      columns[col] = alien;
    }
  });
  const shooters = Object.values(columns);
  const shooter = shooters[Math.floor(Math.random() * shooters.length)];
  if (shooter) {
    const bx = shooter.x + shooter._spriteA.w / 2;
    const by = shooter.y + shooter._spriteA.h;
    gameState.enemyBullets.push(new Bullet(bx, by, 4, 2, 6, "#fff"));
    gameState.lastEnemyFire = time;
  }
}
function circleFormation(spriteSets, R, cx, cy) {
  gameState.aliens = [];
  const spacingX = 30;
  const spacingY = 30;
  for (let dx = -R;dx <= R; dx += spacingX) {
    for (let dy = -R;dy <= R; dy += spacingY) {
      if (dx * dx + dy * dy <= R * R) {
        const centerX = cx + dx;
        const centerY = cy + dy;
        const type = Math.floor(Math.random() * spriteSets.length);
        const sprite = spriteSets[type][0];
        const x = centerX - sprite.w / 2;
        const y = centerY - sprite.h / 2;
        gameState.aliens.push(new Alien(x, y, spriteSets[type], 3));
      }
    }
  }
}

// src/index.js
var canvas = document.getElementById("cnvs");
canvas.width = 600;
canvas.height = window.innerHeight;
var tickLength = 15;
var lastTick;
var lastRender;
var stopCycle;
function run(tFrame) {
  stopCycle = window.requestAnimationFrame(run);
  const nextTick = lastTick + tickLength;
  let numTicks = 0;
  if (tFrame > nextTick) {
    const timeSinceTick = tFrame - lastTick;
    numTicks = Math.floor(timeSinceTick / tickLength);
  }
  for (let i = 0;i < numTicks; i++) {
    lastTick = lastTick + tickLength;
    update(lastTick, stopGame);
  }
  draw(canvas, tFrame);
  lastRender = tFrame;
}
function stopGame() {
  window.cancelAnimationFrame(stopCycle);
}
function onPreloadComplete() {
  lastTick = performance.now();
  lastRender = lastTick;
  stopCycle = null;
  init(canvas);
  run();
}
preload(onPreloadComplete);
