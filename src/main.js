const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let scale = 1;

function resizeCanvas() {
    scale = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * scale;
    canvas.height = window.innerHeight * scale;
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
        const newScoreText = currentGame.score.toString().padStart(5, '0');
        if (scoreElement.textContent !== newScoreText) {
            scoreElement.textContent = newScoreText;
            // Subtle pop animation for score
            if (currentGame.score % 100 === 0 && currentGame.score > 0) {
                gsap.fromTo(scoreElement, 
                    { scale: 1.2, color: '#fff', textShadow: '0 0 20px #fff' }, 
                    { scale: 1, color: '#68BA7F', textShadow: '0 0 10px rgba(104, 186, 127, 0.5)', duration: 0.5, ease: "back.out(1.7)" }
                );
            }
        }
        
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
        
        const GameModule = await import(`./games/${config.activeGame}.js`);
        const GameClass = GameModule.default;
        
        highScore = localStorage.getItem(`${config.activeGame}-high-score`) || 0;
        
        currentGame = new GameClass(canvas, ctx, config);
        uiLayer.style.color = config.theme.scoreColor;
        if (config.showScore === false) {
            uiLayer.style.display = 'none';
        }
        
        gameLoop();
    } catch (e) {
        console.error("Failed to initialize game engine:", e);
    }
}

let isRunning = true;
let isPaused = false;

function gameLoop() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    if (!isRunning) return;
    
    // Stable Clear
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply DPI Scale
    ctx.scale(scale, scale);
    
    if (currentGame) {
        if (!isPaused) {
            currentGame.update();
        }
        currentGame.draw();
        updateScoreDisplay();

        if (currentGame.isGameOver) {
            drawGameOver();
            return; // Halt loop completely to save resources
        }
    }
    
    if (isPaused) {
        drawPaused();
    } else {
        resetPaused();
    }
    
    animationId = requestAnimationFrame(gameLoop);
}

let gameOverShown = false;

function drawGameOver() {
    if (!gameOverShown) {
        gameOverShown = true;
        const gameOverLayer = document.getElementById('game-over-layer');
        gameOverLayer.style.pointerEvents = 'auto';
        gameOverLayer.querySelector('.go-title').textContent = 'TERMINATED';
        gameOverLayer.querySelector('.go-subtitle').textContent = 'SPACE TO INITIALIZE';
        gsap.to(gameOverLayer, { opacity: 1, duration: 0.8, ease: "power2.out" });
        gsap.fromTo('.go-title', 
            { y: -50, scale: 0.8, opacity: 0 }, 
            { y: 0, scale: 1, opacity: 1, duration: 0.8, ease: "elastic.out(1, 0.5)", delay: 0.2 }
        );
        gsap.fromTo('.go-subtitle', 
            { y: 20, opacity: 0 }, 
            { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.5 }
        );
    }
}

function resetGameOver() {
    if (gameOverShown) {
        gameOverShown = false;
        const gameOverLayer = document.getElementById('game-over-layer');
        gameOverLayer.style.pointerEvents = 'none';
        gsap.to(gameOverLayer, { opacity: 0, duration: 0.3 });
    }
}

let pausedShown = false;

function drawPaused() {
    if (!pausedShown && !gameOverShown) {
        pausedShown = true;
        const gameOverLayer = document.getElementById('game-over-layer');
        gameOverLayer.querySelector('.go-title').textContent = 'PAUSED';
        gameOverLayer.querySelector('.go-subtitle').textContent = 'CLICK OR FOCUS TO RESUME';
        gsap.to(gameOverLayer, { opacity: 1, duration: 0.3 });
    }
}

function resetPaused() {
    if (pausedShown) {
        pausedShown = false;
        if (!gameOverShown) {
            const gameOverLayer = document.getElementById('game-over-layer');
            gsap.to(gameOverLayer, { opacity: 0, duration: 0.3 });
        }
    }
}

window.addEventListener('keydown', (e) => {
    if (currentGame) {
        const wasGameOver = currentGame.isGameOver;
        currentGame.onInput(e.code);
        
        // If the game was restarted from game over state, resume loop
        if (wasGameOver && !currentGame.isGameOver && isRunning) {
            resetGameOver();
            gameLoop();
        }
    }
    
    if (e.key === 'h' || e.key === 'H') {
        window.__TAURI__.window.getCurrent().hide();
    }
});

// Resource Optimizations: Halt rendering entirely when hidden
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        isRunning = false;
    } else {
        isRunning = true;
        if (currentGame && !currentGame.isGameOver) gameLoop();
    }
});

window.addEventListener('blur', () => {
    isPaused = true;
});

window.addEventListener('focus', () => {
    isPaused = false;
    if (isRunning && currentGame && !currentGame.isGameOver) {
        gameLoop();
    }
});

init();
