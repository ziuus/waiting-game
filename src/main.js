const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let scale = 1;

function resizeCanvas() {
    scale = window.devicePixelRatio || 1;
    // Physical pixels
    canvas.width = window.innerWidth * scale;
    canvas.height = window.innerHeight * scale;
    // Logical CSS pixels
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let config = null;
let currentGame = null;
let highScore = 0;
let animationId;

const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const uiLayer = document.getElementById('ui-layer');

function updateScoreDisplay() {
    if (currentGame) {
        scoreElement.textContent = currentGame.score.toString().padStart(5, '0');
        if (currentGame.score > highScore) {
            highScore = currentGame.score;
            localStorage.setItem(`${config.activeGame}-high-score`, highScore);
        }
    }
    highScoreElement.textContent = highScore.toString().padStart(5, '0');
}

async function init() {
    try {
        const response = await fetch('config.json');
        config = await response.json();
        
        // Dynamic Import of the active game plugin
        const GameModule = await import(`./games/${config.activeGame}.js`);
        const GameClass = GameModule.default;
        
        // Load high score for this specific game
        highScore = localStorage.getItem(`${config.activeGame}-high-score`) || 0;
        
        // Initialize Game
        currentGame = new GameClass(canvas, ctx, config);
        uiLayer.style.color = config.theme.scoreColor;
        
        gameLoop();
    } catch (e) {
        console.error("Failed to initialize game engine:", e);
    }
}

function gameLoop() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    // WebKitGTK Safe Clear for Transparent Windows
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'copy';
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
    
    // Apply Retina Scale for drawing
    ctx.scale(scale, scale);
    
    if (currentGame) {
        currentGame.update();
        currentGame.draw();
        updateScoreDisplay();

        if (currentGame.isGameOver) {
            drawGameOver();
        }
    }
    
    animationId = requestAnimationFrame(gameLoop);
}

function drawGameOver() {
    ctx.fillStyle = config.theme.obstacleColor;
    ctx.font = 'bold 32px Space Grotesk, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TERMINATED', window.innerWidth / 2, window.innerHeight / 2);
    ctx.font = '12px Space Grotesk, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('SPACE TO INITIALIZE', window.innerWidth / 2, window.innerHeight / 2 + 40);
}

window.addEventListener('keydown', (e) => {
    if (currentGame) {
        currentGame.onInput(e.code);
    }
    
    if (e.key === 'h' || e.key === 'H') {
        window.__TAURI__.window.getCurrent().hide();
    }
});

init();

