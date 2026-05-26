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

/**
 * Shared utility for color manipulation
 * Fixes greedy regex bugs and provides a consistent implementation
 */
window.colorWithAlpha = function(color, alpha) {
    if (!color) return `rgba(255, 255, 255, ${alpha})`;
    if (color.startsWith('rgba(')) {
        // Precise regex: match components before the last comma
        return color.replace(/rgba\((.*),\s*[\d.]+\)/i, `rgba($1, ${alpha})`);
    }
    if (color.startsWith('rgb(')) {
        return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
    }
    if (color.startsWith('#')) {
        const hex = color.slice(1);
        const normalized = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
        const value = parseInt(normalized, 16);
        const r = (value >> 16) & 255;
        const g = (value >> 8) & 255;
        const b = value & 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color;
};

const getGameSelect = () => document.getElementById('game-select');
const getDiffSelect = () => document.getElementById('difficulty-select');
const getSubtitle = () => document.querySelector('.go-subtitle');

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
    
    const newHighScoreText = highScore.toString().padStart(5, '0');
    if (highScoreElement.textContent !== newHighScoreText) {
        highScoreElement.textContent = newHighScoreText;
    }
}

function getEnabledGames() {
    return (config.games || []).filter((game) => game.enabled !== false);
}

function normalizeGameId(gameId) {
    const enabled = getEnabledGames();
    return enabled.some((game) => game.id === gameId) ? gameId : (enabled[0]?.id || 'dino');
}

function applyGameSettings() {
    config.activeGame = normalizeGameId(config.activeGame || 'dino');
    config.activeDifficulty = config.activeDifficulty || 'normal';

    if (config.difficultyModes?.[config.activeDifficulty]?.[config.activeGame]) {
        config.difficulty = config.difficultyModes[config.activeDifficulty][config.activeGame];
    } else if (config.difficulty?.[config.activeGame]) {
        config.difficulty = config.difficulty[config.activeGame];
    }

    config.activeTheme = config.themes?.[config.activeGame] || {
        player: '#68BA7F',
        obstacle: '#ff4b2b',
        score: 'rgba(104, 186, 127, 0.8)'
    };

    uiLayer.style.color = config.activeTheme.score;
    scoreElement.style.color = config.activeTheme.score;
    scoreElement.style.textShadow = `0 0 10px ${config.activeTheme.score}`;

    if (currentGame) currentGame.config = config;
}

function populateGameSelector() {
    const gameSelect = getGameSelect();
    if (!gameSelect) return;
    gameSelect.innerHTML = '';
    for (const game of getEnabledGames()) {
        const option = document.createElement('option');
        option.value = game.id;
        option.textContent = game.name;
        gameSelect.appendChild(option);
    }
    gameSelect.value = config.activeGame;
}

function bindMenuControls() {
    const gameSelect = getGameSelect();
    const diffSelect = getDiffSelect();

    if (gameSelect) {
        populateGameSelector();
        gameSelect.onchange = async (e) => {
            config.activeGame = e.target.value;
            await loadActiveGame({ persist: true });
        };
    }

    if (diffSelect) {
        diffSelect.value = config.activeDifficulty;
        diffSelect.onchange = async (e) => {
            config.activeDifficulty = e.target.value;
            await loadActiveGame({ persist: true });
        };
    }
}

function renderMenuSubtitle(message = 'SPACE TO INITIALIZE') {
    const subtitle = getSubtitle();
    if (!subtitle) return;

    subtitle.innerHTML = `
        ${message}<br><br>
        <div style="display: flex; gap: 10px; margin-top: 15px; justify-content: center;">
            <select id="game-select" style="background: rgba(0,0,0,0.5); color: white; border: 1px solid white; padding: 5px; font-family: inherit;"></select>
            <select id="difficulty-select" style="background: rgba(0,0,0,0.5); color: white; border: 1px solid white; padding: 5px; font-family: inherit;">
                <option value="easy">Easy</option>
                <option value="normal">Normal</option>
                <option value="hard">Hard</option>
            </select>
        </div>
    `;
    bindMenuControls();
}

async function persistPreferences() {
    try {
        await window.__TAURI__.core.invoke('save_preferences', {
            activeGame: config.activeGame,
            activeDifficulty: config.activeDifficulty
        });
    } catch (error) {
        console.warn('Failed to save preferences:', error);
    }
}

async function loadActiveGame({ persist = false } = {}) {
    if (animationId) cancelAnimationFrame(animationId);

    applyGameSettings();
    highScore = Number(localStorage.getItem(`${config.activeGame}-high-score`) || 0);

    const GameModule = await import(`./games/${config.activeGame}.js`);
    const GameClass = GameModule.default;
    currentGame = new GameClass(canvas, ctx, config);

    scoreElement.textContent = '00000';
    highScoreElement.textContent = highScore.toString().padStart(5, '0');
    resetGameOver();

    if (persist) await persistPreferences();
    if (isRunning) gameLoop();
}

async function init() {
    try {
        // Load config from Rust (supports external ~/.config/waiting-game/config.json)
        config = await window.__TAURI__.core.invoke('get_config');
        
        // Apply configurable background — default fully transparent
        const bg = config.background || { opacity: 0, color: '0, 0, 0' };
        const container = document.getElementById('game-container');
        container.style.background = `rgba(${bg.color}, ${bg.opacity})`;

        config.activeGame = normalizeGameId(config.activeGame || 'dino');
        config.activeDifficulty = config.activeDifficulty || 'normal';

        bindMenuControls();

        if (config.showScore === false) {
            uiLayer.style.display = 'none';
        }

        await loadActiveGame();
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
    
    if (isPaused) {
        drawPaused();
        return; // CPU Optimization: Halt loop while paused
    } else {
        resetPaused();
    }
    
    // Stable Clear
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply DPI Scale
    ctx.scale(scale, scale);
    
    if (currentGame) {
        currentGame.update();
        currentGame.draw();
        updateScoreDisplay();

        if (currentGame.isGameOver) {
            drawGameOver();
            return; // Halt loop completely to save resources
        }
    }
    
    animationId = requestAnimationFrame(gameLoop);
}

let gameOverShown = false;

function drawGameOver() {
    if (!gameOverShown) {
        gameOverShown = true;
        const gameOverLayer = document.getElementById('game-over-layer');
        gameOverLayer.classList.add('terminated');
        gameOverLayer.style.display = 'flex';
        gameOverLayer.style.pointerEvents = 'auto';
        gameOverLayer.querySelector('.go-title').textContent = 'TERMINATED';
        renderMenuSubtitle('SPACE TO INITIALIZE');
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
        gameOverLayer.classList.remove('terminated'); // Remove blur immediately
        gsap.to(gameOverLayer, { 
            opacity: 0, 
            duration: 0.3, 
            onComplete: () => {
                if (!gameOverShown && !pausedShown) {
                    gameOverLayer.style.display = 'none';
                }
            }
        });
    }
}

let pausedShown = false;

function drawPaused() {
    if (!pausedShown && !gameOverShown) {
        pausedShown = true;
        const gameOverLayer = document.getElementById('game-over-layer');
        gameOverLayer.classList.remove('terminated'); // Ensure no blur when just paused
        gameOverLayer.style.display = 'flex';
        gameOverLayer.querySelector('.go-title').textContent = 'PAUSED';
        gameOverLayer.querySelector('.go-subtitle').innerHTML = 'CLICK TO RESUME<br><br><button id="hide-btn" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-family: inherit; font-size: 14px;">HIDE [H]</button>';
        
        document.getElementById('hide-btn').onclick = (e) => {
            e.stopPropagation();
            window.__TAURI__.core.invoke('hide_window');
        };

        gsap.to(gameOverLayer, { opacity: 1, duration: 0.3 });
    }
}

function resetPaused() {
    if (pausedShown) {
        pausedShown = false;
        if (!gameOverShown) {
            const gameOverLayer = document.getElementById('game-over-layer');
            gsap.to(gameOverLayer, { 
                opacity: 0, 
                duration: 0.3, 
                onComplete: () => {
                    if (!gameOverShown && !pausedShown) {
                        gameOverLayer.style.display = 'none';
                    }
                }
            });
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
        window.__TAURI__.core.invoke('hide_window');
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
