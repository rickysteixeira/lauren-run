const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Load Lauren's sprite
const laurenImage = new Image();
laurenImage.src = 'female_jump.png';

// Lana mode trigger
let lanaCode = [];
const lanaTrigger = ['l', 'a', 'n', 'a'];
document.addEventListener('keydown', function (e) {
  lanaCode.push(e.key.toLowerCase());
  if (lanaCode.length > 4) lanaCode.shift();
  if (lanaCode.join('') === lanaTrigger.join('')) {
    activateLaurenMode();
    lanaCode = [];
  }
});

// Game state
let laurenY = canvas.height - 40 - 10;
let laurenVelocity = 0;
let gravity = 1;
let isJumping = false;
let frameCount = 0;
let gameOver = false;
let groundX = 0;
let groundSpeed = 1.5;
const groundHeight = 40;
const groundY = canvas.height - groundHeight - 10;

let obstacles = [];
let targets = [];
let luigis = [];

const obstacleFrequency = 160;
const targetFrequency = 250;
const luigiFrequency = 600;

let isInvincible = false;
let invincibleTimer = 0;

function updateScoreDisplay() {
  document.getElementById('score').textContent = frameCount;
  const high = localStorage.getItem('laurenHighScore') || 0;
  document.getElementById('highScore').textContent = high;
}

document.addEventListener('keydown', function (e) {
  if (e.code === 'Space' && !isJumping) {
    laurenVelocity = -15;
    isJumping = true;
  }
});

function spawnObstacle() {
  const isNightShift = Math.random() < 0.2; // 20% chance

  const baseSize = 20;
  const maxExtraSize = Math.min(30, frameCount / 100);
  const size = baseSize + Math.random() * maxExtraSize;

  if (isNightShift) {
    const groan = document.getElementById('groanSound');
    groan.play();

    obstacles.push({
      x: canvas.width + 60,
      y: groundY - 30,
      width: 80,
      height: 20,
      isNightShift: true
    });
  } else {
    obstacles.push({
      x: canvas.width + size,
      y: groundY,
      width: size,
      height: size,
      isNightShift: false
    });
  }
}

function spawnTarget() {
  targets.push({ x: canvas.width + 30, y: groundY - 20, width: 60, height: 30 });
}

function spawnLuigi() {
  luigis.push({ x: canvas.width + 30, y: groundY - 25, width: 60, height: 30 });
}

function checkCollision(obj) {
  const laurenX = 110;
  const laurenWidth = 20;
  const laurenHeight = 30;
  return (
    laurenX < obj.x + obj.width &&
    laurenX + laurenWidth > obj.x &&
    laurenY < obj.y + obj.height &&
    laurenY + laurenHeight > obj.y
  );
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameOver) {
    document.getElementById('finalScore').textContent = frameCount;
    document.getElementById('gameOverScreen').classList.remove('hidden');
    const high = localStorage.getItem('laurenHighScore') || 0;
    if (frameCount > high) {
      localStorage.setItem('laurenHighScore', frameCount);
    }
    return;
  }

  frameCount++;

  if (frameCount % obstacleFrequency === 0) spawnObstacle();
  if (frameCount % targetFrequency === 0) spawnTarget();
  if (frameCount % luigiFrequency === 0) spawnLuigi();

  // Obstacles
  obstacles.forEach((ob, i) => {
    ob.x -= groundSpeed;

    if (ob.isNightShift) {
      ctx.font = 'bold 20px Arial';
      ctx.fillStyle = '#8B0000';
      ctx.fillText('NIGHT SHIFT', ob.x, ob.y);
    } else {
      ctx.fillStyle = '#444';
      ctx.fillRect(ob.x, ob.y, ob.width, ob.height);
    }

    if (checkCollision(ob) && !isInvincible) {
      if (ob.isNightShift) {
        const hit = document.getElementById('hitSound');
        hit.volume = 0.4;
        hit.play();
        canvas.classList.add('shake');
        setTimeout(() => canvas.classList.remove('shake'), 300);
      }
      gameOver = true;
    }

    if (ob.x + ob.width < 0) obstacles.splice(i, 1);
  });

  // Targets
  targets.forEach((t, i) => {
    t.x -= groundSpeed;
    ctx.font = 'bold 24px Arial';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeText('TARGET', t.x, t.y);
    ctx.fillStyle = 'red';
    ctx.fillText('TARGET', t.x, t.y);

    if (checkCollision(t)) {
      frameCount += 100;
      targets.splice(i, 1);
      const bonus = document.createElement('div');
      bonus.textContent = '+100!';
      bonus.style.position = 'fixed';
      bonus.style.left = '120px';
      bonus.style.top = '100px';
      bonus.style.fontSize = '24px';
      bonus.style.color = 'green';
      bonus.style.fontWeight = 'bold';
      bonus.style.animation = 'fadeOut 2s ease forwards';
      document.body.appendChild(bonus);
      setTimeout(() => bonus.remove(), 2000);
    }

    if (t.x + t.width < 0) targets.splice(i, 1);
  });

  // Luigi
  luigis.forEach((luigi, i) => {
    luigi.x -= groundSpeed;
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = 'green';
    ctx.fillText('LUIGI', luigi.x, luigi.y);

    if (checkCollision(luigi)) {
      isInvincible = true;
      invincibleTimer = 300;
      luigis.splice(i, 1);

      const msg = document.createElement('div');
      const quotes = [
        'how is INF doing so far',
        'Hey, lets schedule a visit for tomorrow'
      ];
      msg.textContent = quotes[Math.floor(Math.random() * quotes.length)];

      msg.style.position = 'fixed';
      msg.style.top = '50px';
      msg.style.left = '50%';
      msg.style.transform = 'translateX(-50%)';
      msg.style.color = '#008000';
      msg.style.background = 'white';
      msg.style.padding = '10px';
      msg.style.fontWeight = 'bold';
      msg.style.borderRadius = '8px';
      msg.style.zIndex = 999;
      document.body.appendChild(msg);
      setTimeout(() => msg.remove(), 3000);
    }

    if (luigi.x + luigi.width < 0) luigis.splice(i, 1);
  });

  // Ground
  groundX -= groundSpeed;
  if (groundX <= -canvas.width) groundX = 0;
  ctx.fillStyle = '#654321';
  ctx.fillRect(groundX, canvas.height - groundHeight, canvas.width, groundHeight);
  ctx.fillRect(groundX + canvas.width, canvas.height - groundHeight, canvas.width, groundHeight);

  // Lauren physics
  laurenY += laurenVelocity;
  laurenVelocity += gravity;
  if (laurenY > groundY) {
    laurenY = groundY;
    laurenVelocity = 0;
    isJumping = false;
  }

  ctx.drawImage(laurenImage, 100, laurenY - 40, 40, 40);

  updateScoreDisplay();

  if (frameCount % 200 === 0 && groundSpeed < 10) groundSpeed += 0.5;
  if (isInvincible) {
    invincibleTimer--;
    if (invincibleTimer <= 0) isInvincible = false;
  }

  requestAnimationFrame(gameLoop);
}

function activateLaurenMode() {
  document.body.classList.add('lauren-mode');
  const audio = document.getElementById('lanaAudio');
  audio.volume = 0.5;
  audio.play();

  const banner = document.createElement('div');
  banner.textContent = 'Escaped Amazon. Found peace. 💅';
  banner.style.position = 'absolute';
  banner.style.top = '10px';
  banner.style.left = '50%';
  banner.style.transform = 'translateX(-50%)';
  banner.style.fontSize = '20px';
  banner.style.color = '#ff69b4';
  banner.style.fontWeight = 'bold';
  banner.style.textShadow = '1px 1px 2px #000';
  banner.style.zIndex = '999';
  document.body.appendChild(banner);
}

function restartGame() {
  gameOver = false;
  frameCount = 0;
  obstacles = [];
  targets = [];
  luigis = [];
  laurenY = groundY;
  laurenVelocity = 0;
  isJumping = false;
  document.getElementById('gameOverScreen').classList.add('hidden');
  gameLoop();
}

gameLoop();
