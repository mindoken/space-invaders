import Sprite from './sprite'
import Cannon from './cannon'
import Bullet from './bullet'
import Alien from './alien'
import InputHandler from './input-handler'

import assetPath from '../assets/invaders.png'

let assets;
const sprites = {
  aliens: [],
  cannon: null,
  bunker: null
};
const gameState = {
  bullets: [],
  enemyBullets: [],
  aliens: [],
  cannon: null,
  alienDirection: 1,
  alienSpeed: 0.5,
  alienDropY: 20,
  lastEnemyFire:  0,
  baseReload:     1000,
  score: 0,
  isGameOver:     false,
  isVictory:      false
};
const inputHandler = new InputHandler();

let CanvasHeight;

export function preload(onPreloadComplete) {
  assets = new Image();
	assets.addEventListener("load", () => {
    sprites.cannon = new Sprite(assets, 62, 0, 22, 16);
    sprites.bunker = new Sprite(assets, 84, 8, 36, 24);
    sprites.aliens = [
      [new Sprite(assets,  0, 0, 22, 16), new Sprite(assets,  0, 16, 22, 16)],
			[new Sprite(assets, 22, 0, 16, 16), new Sprite(assets, 22, 16, 16, 16)],
			[new Sprite(assets, 38, 0, 24, 16), new Sprite(assets, 38, 16, 24, 16)]
    ]

    onPreloadComplete();
  });
	assets.src = assetPath;
}

export function init(canvas) {
  //circleFormation(sprites.aliens, 200, canvas.width / 2, canvas.height / 4);
   heartFormation(sprites.aliens, 170, canvas.width / 2, canvas.height / 3);
  gameState.cannon = new Cannon(
    100, canvas.height - 100,
    sprites.cannon
  );

  CanvasHeight = canvas.height;
}

export function update(time, stopGame) {
  if (gameState.isGameOver || gameState.isVictory) return;

	if (inputHandler.isDown('ArrowLeft')) {
		gameState.cannon.x -= 4;
	}

	if (inputHandler.isDown('ArrowRight')) {
		gameState.cannon.x += 4;
	}
  gameState.cannon.x = Math.max(0, Math.min(600 - gameState.cannon._sprite.w, gameState.cannon.x));

  if (inputHandler.isPressed('Space')) {
    const bulletX = gameState.cannon.x + 10;
    const bulletY = gameState.cannon.y;
		gameState.bullets.push(new Bullet(bulletX, bulletY, -8, 2, 6, "#fff"));
	}

   moveAliens(600);

  if (gameState.aliens.some(alien => alien.y > (CanvasHeight - 120))) {
    gameState.isGameOver = true;
    return;
  }

 handleEnemyFire(time);

  [...gameState.bullets, ...gameState.enemyBullets].forEach(b => b.update(time));

  handleCollisions();
  cleanupEntities();
  if (gameState.aliens.length === 0) {
    gameState.isVictory = true;
  }
  if (gameState.cannon.destroyed) {
    gameState.isGameOver = true;
  }
}

export function draw(canvas, time) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';
  ctx.font = '16px monospace';
  ctx.textBaseline = 'top';
  ctx.fillText(`HP: ${gameState.cannon.hp}`, 10, 10);
  ctx.fillText(`Score: ${gameState.score}`, canvas.width - 120, 10);

  if (gameState.isGameOver) {
    ctx.fillStyle = 'red';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Game Over', canvas.width/2, canvas.height/2);
    return;
  }

  if (gameState.isVictory) {
    ctx.fillStyle = 'green';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Victory', canvas.width/2, canvas.height/2);
    return;
  }

  gameState.aliens.forEach(a => a.draw(ctx, time));
  gameState.cannon.draw(ctx);
  gameState.bullets.forEach(b => b.draw(ctx));
   gameState.enemyBullets.forEach(b => b.draw(ctx));
}

export function moveAliens(canvasWidth) {
  const { aliens, alienDirection, alienSpeed, alienDropY } = gameState;


  let minX = Infinity;
  let maxX = -Infinity;
  aliens.forEach(a => {

    const w = a._spriteA.w;
    minX = Math.min(minX, a.x);
    maxX = Math.max(maxX, a.x + w);
  });


  const willGoLeftEdge  = minX + alienDirection * alienSpeed < 0;
  const willGoRightEdge = maxX + alienDirection * alienSpeed > canvasWidth;

  if (willGoLeftEdge || willGoRightEdge) {

    aliens.forEach(a => {
      a.y += alienDropY;
    });
    gameState.alienDirection = -alienDirection;
  } else {

    aliens.forEach(a => {
      a.x += alienDirection * alienSpeed;
    });
  }
}

export function rectsIntersect(r1, r2) {
  return !(
    r2.x > r1.x + r1.w ||
    r2.x + r2.w < r1.x ||
    r2.y > r1.y + r1.h ||
    r2.y + r2.h < r1.y
  )
}

export function handleCollisions() {
  for (const bullet of gameState.bullets) {

    const prevY = bullet.y - bullet.vy
    const sweep = {
      x: bullet.x,
      y: Math.min(prevY, bullet.y),
      w: bullet.w,
      h: Math.abs(bullet.vy) + bullet.h
    }

    for (const alien of gameState.aliens) {
      const aw = alien._spriteA.w
      const ah = alien._spriteA.h
      const aRect = { x: alien.x, y: alien.y, w: aw, h: ah }

      if (!bullet.destroyed && !alien.destroyed && rectsIntersect(sweep, aRect)) {
        bullet.destroyed = true
        alien.takeDamage(1);
        if (alien.destroyed) gameState.score+=100;
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


export function cleanupEntities() {
  gameState.bullets = gameState.bullets.filter(b =>
    !b.destroyed && b.y + b.h > 0 && b.y < CanvasHeight
  )
  gameState.enemyBullets = gameState.enemyBullets.filter(b => !b.destroyed && b.y > 0);
  gameState.aliens = gameState.aliens.filter(a => !a.destroyed)
}


export function handleEnemyFire(time) {
  const { aliens, lastEnemyFire, baseReload } = gameState;
  const aliveCount = aliens.length;
  if (aliveCount === 0) return;

  const reloadTime = baseReload * (aliveCount / (3 * 10));
  if (time - lastEnemyFire < reloadTime) return;


  const columns = {};
  aliens.forEach(alien => {
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
    gameState.enemyBullets.push(
      new Bullet(bx, by, 4, 2, 6, '#fff')
    );
    gameState.lastEnemyFire = time;
  }

}



function originalFormation(spriteSets) {
  gameState.aliens = [];
  const alienTypes = [1, 0, 1, 2, 0, 2];
  for (let i = 0; i < alienTypes.length; i++) {
    for (let j = 0; j < 10; j++) {
      const type = alienTypes[i];
      let x = 30 + j * 30 + (type === 1 ? 3 : 0);
      let y = 30 + i * 30;
      gameState.aliens.push(new Alien(x, y, spriteSets[type], 3));
    }
  }
}


function splitFormation(spriteSets, canvasWidth) {
  gameState.aliens = [];
  const alienTypes = [1, 0, 1, 2, 0, 2];
  const halfCols = 5; 
  for (let i = 0; i < alienTypes.length; i++) {
    for (let j = 0; j < halfCols; j++) {
      const type = alienTypes[i];

      let xL = 30 + j * 30 + (type === 1 ? 3 : 0);
      let y  = 30 + i * 30;
      gameState.aliens.push(new Alien(xL, y, spriteSets[type], 3));

      let xR = canvasWidth - (30 + (halfCols - 1 - j) * 30) - spriteSets[type][0].w + (type === 1 ? 3 : 0);
      gameState.aliens.push(new Alien(xR, y, spriteSets[type], 3));
    }
  }
}

function heartFormation(spriteSets, scale, cx, cy) {
  gameState.aliens = [];
  const spacing = 25; // расстояние между пришельцами

  // Пройдемся по сетке точек в прямоугольнике, содержащем сердце
  // x и y — смещённые координаты относительно центра
  // Уравнение сердца (в нормированных координатах):
  // (x² + y² - 1)³ - x² * y³ <= 0
  // Здесь x и y в диапазоне примерно [-1.5, 1.5]

  const step = spacing / scale; // шаг в нормированных координатах

  for (let x = -1.5; x <= 1.5; x += step) {
    for (let y = -1.5; y <= 1.5; y += step) {
      const val = Math.pow(x * x + y * y - 1, 3) - x * x * y * y * y;
      if (val <= 0) { // точка внутри сердца

        // Переводим нормированные координаты в пиксели
        const px = cx + x * scale;
        const py = cy - y * scale; // минус для правильной ориентации

        // Выбираем случайный тип пришельца
        const type = Math.floor(Math.random() * spriteSets.length);
        const sprite = spriteSets[type][0];
        const alienX = px - sprite.w / 2;
        const alienY = py - sprite.h / 2;

        // Проверка границ канваса (предполагается ширина 600)
        if (alienX >= 0 && alienX + sprite.w <= 600 && alienY >= 0) {
          gameState.aliens.push(new Alien(alienX, alienY, spriteSets[type], 3));
        }
      }
    }
  }
}

function circleFormation(spriteSets, R, cx, cy) {
  gameState.aliens = [];
  const spacingX = 30; 
  const spacingY = 30;  

  for (let dx = -R; dx <= R; dx += spacingX) {
    for (let dy = -R; dy <= R; dy += spacingY) {
      if (dx*dx + dy*dy <= R*R) {

        const centerX = cx + dx;
        const centerY = cy + dy;

        const type = Math.floor(Math.random() * spriteSets.length);

        const sprite = spriteSets[type][0];
        const x = centerX - sprite.w / 2;
        const y = centerY - sprite.h / 2;

        gameState.aliens.push(
          new Alien(x, y, spriteSets[type], 3)
        );
      }
    }
  }
}
