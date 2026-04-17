const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

canvas.width = 500;
canvas.height = 150;

let score = 0;
let gameSpeed = 5;
let isGameOver = false;
let animationId;

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

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Ground line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.stroke();

    // Dino
    ctx.fillStyle = dino.color;
    ctx.fillRect(dino.x, dino.y, dino.width, dino.height);

    // Obstacles
    obstacles.forEach(obstacle => {
        ctx.fillStyle = obstacle.color;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });

    if (isGameOver) {
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER - PRESS SPACE TO RESTART', canvas.width / 2, canvas.height / 2);
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
