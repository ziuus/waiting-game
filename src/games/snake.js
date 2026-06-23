export default class CyberSnakeGame {
    constructor(canvas, ctx, config) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.config = config;
        this.reset();
    }

    reset() {
        this.score = 0;
        this.isGameOver = false;
        this.cellSize = 24;
        this.cols = Math.max(12, Math.floor(window.innerWidth / this.cellSize));
        this.rows = Math.max(10, Math.floor(window.innerHeight / this.cellSize));
        this.offsetX = (window.innerWidth - this.cols * this.cellSize) / 2;
        this.offsetY = (window.innerHeight - this.rows * this.cellSize) / 2;
        this.speed = this.config.difficulty.initialSpeed || 7;
        this.stepMs = 1000 / this.speed;
        this.lastStep = performance.now();
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.pulse = 0;
        this.particles = [];

        const startX = Math.floor(this.cols * 0.3);
        const startY = Math.floor(this.rows * 0.5);
        this.snake = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY },
            { x: startX - 3, y: startY }
        ];

        this.obstacles = this.createObstacles();
        this.spawnFood();
    }

    createObstacles() {
        const total = Math.max(4, Math.floor((this.cols * this.rows) / (this.config.difficulty.obstacleGap || 260)));
        const obstacles = [];

        for (let i = 0; i < total; i++) {
            let cell;
            let tries = 0;
            do {
                cell = {
                    x: Math.floor(Math.random() * (this.cols - 6)) + 3,
                    y: Math.floor(Math.random() * (this.rows - 6)) + 3
                };
                tries++;
            } while (tries < 80 && this.isNearSnakeStart(cell));
            obstacles.push(cell);
        }

        return obstacles;
    }

    isNearSnakeStart(cell) {
        const head = this.snake?.[0] || { x: Math.floor(this.cols * 0.3), y: Math.floor(this.rows * 0.5) };
        return Math.abs(cell.x - head.x) < 6 && Math.abs(cell.y - head.y) < 5;
    }

    isOccupied(cell, includeFood = false) {
        const onSnake = this.snake.some((part) => part.x === cell.x && part.y === cell.y);
        const onObstacle = this.obstacles.some((obs) => obs.x === cell.x && obs.y === cell.y);
        const onFood = includeFood && this.food && this.food.x === cell.x && this.food.y === cell.y;
        return onSnake || onObstacle || onFood;
    }

    spawnFood() {
        let cell;
        let tries = 0;
        do {
            cell = {
                x: Math.floor(Math.random() * (this.cols - 4)) + 2,
                y: Math.floor(Math.random() * (this.rows - 4)) + 2
            };
            tries++;
        } while (tries < 200 && this.isOccupied(cell));

        this.food = cell;
        this.burst(cell, this.config.activeTheme.player, 10, 0.9);
    }

    update() {
        if (this.isGameOver) return;

        const now = performance.now();
        this.pulse += 0.08;
        this.updateParticles();

        if (now - this.lastStep < this.stepMs) return;
        this.lastStep = now;
        this.step();
    }

    step() {
        this.direction = this.nextDirection;
        const head = this.snake[0];
        const newHead = {
            x: head.x + this.direction.x,
            y: head.y + this.direction.y
        };

        if (
            newHead.x < 0 || newHead.y < 0 ||
            newHead.x >= this.cols || newHead.y >= this.rows ||
            this.snake.some((part) => part.x === newHead.x && part.y === newHead.y) ||
            this.obstacles.some((obs) => obs.x === newHead.x && obs.y === newHead.y)
        ) {
            this.isGameOver = true;
            this.burst(head, this.config.activeTheme.obstacle, 34, 1.5);
            return;
        }

        this.snake.unshift(newHead);

        if (newHead.x === this.food.x && newHead.y === this.food.y) {
            this.score++;
            this.speed = Math.min(18, this.speed + 0.25);
            this.stepMs = 1000 / this.speed;
            this.burst(newHead, this.config.activeTheme.player, 18, 1.2);
            this.spawnFood();
        } else {
            this.snake.pop();
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.035;
            p.size *= 0.97;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    burst(cell, color, count, force) {
        const center = this.cellToPixel(cell, true);
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (Math.random() * 3 + 1.2) * force;
            this.particles.push({
                x: center.x,
                y: center.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: Math.random() * 0.5 + 0.45,
                size: Math.random() * 4 + 2,
                color
            });
        }
    }

    cellToPixel(cell, center = false) {
        const inset = center ? this.cellSize / 2 : 0;
        return {
            x: this.offsetX + cell.x * this.cellSize + inset,
            y: this.offsetY + cell.y * this.cellSize + inset
        };
    }

    draw() {
        this.drawGrid();
        this.drawObstacles();
        this.drawFood();
        this.drawSnake();
        this.drawParticles();
        this.ctx.shadowBlur = 0;
    }

    drawGrid() {
        const ctx = this.ctx;
        const gridColor = this.colorWithAlpha(this.config.activeTheme.player, 0.08);
        ctx.save();
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;

        for (let x = 0; x <= this.cols; x += 2) {
            const px = this.offsetX + x * this.cellSize;
            ctx.beginPath();
            ctx.moveTo(px, this.offsetY);
            ctx.lineTo(px, this.offsetY + this.rows * this.cellSize);
            ctx.stroke();
        }

        for (let y = 0; y <= this.rows; y += 2) {
            const py = this.offsetY + y * this.cellSize;
            ctx.beginPath();
            ctx.moveTo(this.offsetX, py);
            ctx.lineTo(this.offsetX + this.cols * this.cellSize, py);
            ctx.stroke();
        }

        ctx.strokeStyle = this.colorWithAlpha(this.config.activeTheme.player, 0.35);
        ctx.shadowBlur = 14;
        ctx.shadowColor = this.config.activeTheme.player;
        ctx.strokeRect(this.offsetX, this.offsetY, this.cols * this.cellSize, this.rows * this.cellSize);
        ctx.restore();
    }

    drawSnake() {
        const ctx = this.ctx;
        const primary = this.config.activeTheme.player;
        const glow = 12 + Math.sin(this.pulse) * 5;

        this.snake.forEach((segment, index) => {
            const pos = this.cellToPixel(segment);
            const size = this.cellSize - 5;
            const isHead = index === 0;
            const alpha = Math.max(0.35, 1 - index * 0.035);

            ctx.save();
            ctx.translate(pos.x + this.cellSize / 2, pos.y + this.cellSize / 2);
            if (isHead) ctx.rotate(Math.atan2(this.direction.y, this.direction.x));

            ctx.shadowColor = primary;
            ctx.shadowBlur = isHead ? glow + 10 : glow;
            ctx.fillStyle = this.colorWithAlpha(primary, alpha);
            ctx.strokeStyle = this.colorWithAlpha('#FFFFFF', isHead ? 0.9 : 0.35);
            ctx.lineWidth = isHead ? 2 : 1;

            if (isHead) {
                ctx.beginPath();
                ctx.moveTo(size / 2 + 2, 0);
                ctx.lineTo(-size / 2, -size / 2);
                ctx.lineTo(-size / 3, 0);
                ctx.lineTo(-size / 2, size / 2);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#FFFFFF';
                ctx.shadowBlur = 8;
                ctx.fillRect(0, -6, 4, 3);
                ctx.fillRect(0, 3, 4, 3);
            } else {
                this.roundedRect(ctx, -size / 2, -size / 2, size, size, 7);
                ctx.fill();
                ctx.stroke();
            }

            ctx.restore();
        });
    }

    drawFood() {
        const ctx = this.ctx;
        const pos = this.cellToPixel(this.food, true);
        const radius = 6 + Math.sin(this.pulse * 2) * 2;

        ctx.save();
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = this.config.activeTheme.player;
        ctx.lineWidth = 3;
        ctx.shadowColor = this.config.activeTheme.player;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius + 7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    drawObstacles() {
        const ctx = this.ctx;
        const color = this.config.activeTheme.obstacle;
        this.obstacles.forEach((obs) => {
            const pos = this.cellToPixel(obs, true);
            const r = this.cellSize * 0.42;
            ctx.save();
            ctx.translate(pos.x, pos.y);
            ctx.rotate(Math.PI / 4 + this.pulse * 0.01);
            ctx.shadowColor = color;
            ctx.shadowBlur = 18;
            ctx.fillStyle = this.colorWithAlpha(color, 0.78);
            ctx.strokeStyle = this.colorWithAlpha('#FFFFFF', 0.65);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -r);
            ctx.lineTo(r, 0);
            ctx.lineTo(0, r);
            ctx.lineTo(-r, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        });
    }

    drawParticles() {
        const ctx = this.ctx;
        this.particles.forEach((p) => {
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 12;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    roundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    colorWithAlpha(color, alpha) {
        return window.colorWithAlpha(color, alpha);
    }

    onInput(code) {
        if (code === 'Space' && this.isGameOver) {
            this.reset();
            return;
        }

        const inputs = {
            ArrowUp: { x: 0, y: -1 },
            KeyW: { x: 0, y: -1 },
            ArrowDown: { x: 0, y: 1 },
            KeyS: { x: 0, y: 1 },
            ArrowLeft: { x: -1, y: 0 },
            KeyA: { x: -1, y: 0 },
            ArrowRight: { x: 1, y: 0 },
            KeyD: { x: 1, y: 0 }
        };

        const next = inputs[code];
        if (!next) return;
        if (next.x + this.direction.x === 0 && next.y + this.direction.y === 0) return;
        this.nextDirection = next;
    }
}
