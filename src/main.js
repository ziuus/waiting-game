const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');

canvas.width = 500;
canvas.height = 150;

let score = 0;
let highScore = parseInt(localStorage.getItem('waiting_game_hi') || '0');
let gameSpeed = 5;
let isGameOver = false;
let animationId;

// Initialize High Score UI
highScoreElement.innerText = `HI ${highScore.toString().padStart(5, '0')}`;

const dino = {
    x: 50,
    y: 110,
    width: 20,
    height: 40,
    dy: 0,
    jumpForce: 12,
    gravity: 0.6,
    grounded: false,
    color: '#68BA7F'
};

const obstacles = [];

function createObstacle() {
    const height = Math.random() * 30 + 20;
    obstacles.push({
        x: canvas.width,
        y: canvas.height - height,
        width: 20,
        height: height,
        color: '#ff4b2b'
    });
}

function update() {
    if (isGameOver) return;

    // Dino physics
    if (!dino.grounded) {
        dino.dy += dino.gravity;
        dino.y += dino.dy;
    }

    if (dino.y + dino.height > canvas.height) {
        dino.y = canvas.height - dino.height;
        dino.dy = 0;
        dino.grounded = true;
    }

    // Move obstacles
    obstacles.forEach((obstacle, index) => {
        obstacle.x -= gameSpeed;

        // Collision detection
        if (
            dino.x < obstacle.x + obstacle.width &&
            dino.x + dino.width > obstacle.x &&
            dino.y < obstacle.y + obstacle.height &&
            dino.y + dino.height > obstacle.y
        ) {
            isGameOver = true;
        }

        // Remove off-screen obstacles
        if (obstacle.x + obstacle.width < 0) {
            obstacles.splice(index, 1);
            score++;
            scoreElement.innerText = score.toString().padStart(5, '0');
            
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('waiting_game_hi', highScore.toString());
                highScoreElement.innerText = `HI ${highScore.toString().padStart(5, '0')}`;
            }
            
            if (score % 10 === 0) gameSpeed += 0.2;
        }
    });

    if (Math.random() < 0.02) {
        if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < canvas.width - 150) {
            createObstacle();
        }
    }

    draw();
    animationId = requestAnimationFrame(update);
}

function drawDino(x, y) {
    ctx.fillStyle = dino.color;
    // Body
    ctx.fillRect(x, y + 10, 20, 20);
    // Head
    ctx.fillRect(x + 10, y, 15, 12);
    // Eye
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 18, y + 3, 3, 3);
    // Legs
    ctx.fillStyle = dino.color;
    const legOffset = Math.sin(Date.now() / 50) * 5;
    ctx.fillRect(x + 2, y + 30, 5, 10 + (dino.grounded ? legOffset : 0));
    ctx.fillRect(x + 13, y + 30, 5, 10 - (dino.grounded ? legOffset : 0));
}

function drawCactus(x, y, w, h) {
    ctx.fillStyle = '#ff4b2b';
    // Main stem
    ctx.fillRect(x + w/4, y, w/2, h);
    // Arms
    ctx.fillRect(x, y + h/3, w, h/6);
    ctx.fillRect(x, y + h/6, w/6, h/6);
    ctx.fillRect(x + w - w/6, y + h/6, w/6, h/6);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Subtle ground shadow
    ctx.fillStyle = 'rgba(104, 186, 127, 0.1)';
    ctx.fillRect(0, canvas.height - 2, canvas.width, 2);

    // Dino with glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = dino.color;
    drawDino(dino.x, dino.y);

    // Obstacles with glow
    ctx.shadowBlur = 10;
    obstacles.forEach(obstacle => {
        ctx.shadowColor = obstacle.color;
        drawCactus(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });

    // Reset shadow for text
    ctx.shadowBlur = 0;
...
    if (isGameOver) {
        ctx.fillStyle = '#ff4b2b';
        ctx.font = 'bold 24px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 10);
        ctx.font = '14px Inter, sans-serif';
        ctx.fillStyle = 'white';
        ctx.fillText('PRESS SPACE TO RESTART', canvas.width / 2, canvas.height / 2 + 20);
    }
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (isGameOver) {
            isGameOver = false;
            score = 0;
            scoreElement.innerText = '00000';
            obstacles.length = 0;
            gameSpeed = 5;
            update();
        } else if (dino.grounded) {
            dino.dy = -dino.jumpForce;
            dino.grounded = false;
        }
    }
    
    // Hide window with H
    if (e.key === 'h' || e.key === 'H') {
        window.__TAURI__.window.getCurrent().hide();
    }
});

update();
