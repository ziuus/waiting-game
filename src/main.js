const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas to a large enough area for the bottom of the screen
canvas.width = window.innerWidth;
canvas.height = 500; 

let score = 0;
let gameSpeed = 8;
let isGameOver = false;
let animationId;

// GROUND_OFFSET: Lowered to 20 to sit closer to the screen border
const GROUND_OFFSET = 20; 

const dino = {
    targetX: canvas.width * 0.25, // Goal: Half of the first half (25%)
    x: -50, // Start off-screen to the left
    y: canvas.height - GROUND_OFFSET - 60,
    width: 30,
    height: 60,
    dy: 0,
    jumpForce: 15,
    gravity: 0.7,
    grounded: false,
    color: '#68BA7F',
    isIntro: true // Flag for the startup run
};

const obstacles = [];

function createObstacle() {
    // Only create obstacles after intro is done
    if (dino.isIntro) return;
    
    const height = Math.random() * 50 + 30;
    obstacles.push({
        x: canvas.width,
        y: canvas.height - height - GROUND_OFFSET,
        width: 30,
        height: height,
        color: '#ff4b2b'
    });
}

function update() {
    if (isGameOver) return;

    // Startup Animation Logic
    if (dino.isIntro) {
        if (dino.x < dino.targetX) {
            dino.x += 5; // Run speed during intro
        } else {
            dino.x = dino.targetX;
            dino.isIntro = false;
        }
    }

    // Dino physics
    if (!dino.grounded) {
        dino.dy += dino.gravity;
        dino.y += dino.dy;
    }

    if (dino.y + dino.height > canvas.height - GROUND_OFFSET) {
        dino.y = canvas.height - dino.height - GROUND_OFFSET;
        dino.dy = 0;
        dino.grounded = true;
    }

    // Move obstacles
    if (!dino.isIntro) {
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
                if (score % 5 === 0) gameSpeed += 0.5;
            }
        });

        if (Math.random() < 0.015) {
            if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < canvas.width - 400) {
                createObstacle();
            }
        }
    }

    draw();
    animationId = requestAnimationFrame(update);
}

function drawDino(x, y) {
    ctx.fillStyle = dino.color;
    // Body
    ctx.fillRect(x, y + 15, 30, 30);
    // Head
    ctx.fillRect(x + 15, y, 20, 18);
    // Eye
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 28, y + 5, 4, 4);
    // Legs
    ctx.fillStyle = dino.color;
    const legOffset = Math.sin(Date.now() / 50) * 8;
    ctx.fillRect(x + 4, y + 45, 8, 15 + (dino.grounded ? legOffset : 0));
    ctx.fillRect(x + 20, y + 45, 8, 15 - (dino.grounded ? legOffset : 0));
}

function drawCactus(x, y, w, h) {
    ctx.fillStyle = '#ff4b2b';
    ctx.fillRect(x + w/4, y, w/2, h);
    ctx.fillRect(x, y + h/3, w, h/6);
    ctx.fillRect(x, y + h/6, w/6, h/6);
    ctx.fillRect(x + w - w/6, y + h/6, w/6, h/6);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // No background, just the kinetic objects
    ctx.shadowBlur = 20;
    ctx.shadowColor = dino.color;
    drawDino(dino.x, dino.y);

    ctx.shadowBlur = 15;
    obstacles.forEach(obstacle => {
        ctx.shadowColor = obstacle.color;
        drawCactus(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });

    ctx.shadowBlur = 0;

    if (isGameOver) {
        ctx.fillStyle = '#ff4b2b';
        ctx.font = 'bold 32px Space Grotesk, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('TERMINATED', canvas.width / 2, canvas.height / 2);
        ctx.font = '12px Space Grotesk, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText('SPACE TO INITIALIZE', canvas.width / 2, canvas.height / 2 + 40);
    }
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (isGameOver) {
            isGameOver = false;
            score = 0;
            obstacles.length = 0;
            gameSpeed = 8;
            update();
        } else if (dino.grounded) {
            dino.dy = -dino.jumpForce;
            dino.grounded = false;
        }
    }
    
    // Global hide remains in H for convenience when focused
    if (e.key === 'h' || e.key === 'H') {
        window.__TAURI__.window.getCurrent().hide();
    }
});

// Auto-start loop
update();
