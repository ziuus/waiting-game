export default class NeonBreakoutGame {
    constructor(canvas, ctx, config) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.config = config;
        this.reset();
    }

    reset() {
        this.score = 0;
        this.isGameOver = false;
        this.particles = [];
        this.trail = [];
        this.frame = 0;

        this.paddle = {
            width: 150,
            height: 18,
            x: window.innerWidth / 2 - 75,
            y: window.innerHeight - 95,
            targetX: window.innerWidth / 2 - 75,
            speed: 0,
            color: this.config.activeTheme.player
        };

        const speed = this.config.difficulty.initialSpeed || 7;
        this.ball = {
            x: window.innerWidth / 2,
            y: this.paddle.y - 28,
            radius: 10,
            dx: speed * (Math.random() > 0.5 ? 1 : -1),
            dy: -speed,
            speed,
            color: '#FFFFFF'
        };

        this.keys = new Set();
        this.createBricks();
    }

    createBricks() {
        const columns = Math.max(8, Math.min(14, Math.floor(window.innerWidth / 135)));
        const rows = Math.max(4, Math.min(8, Math.round(this.config.difficulty.obstacleGap || 8)));
        const margin = 64;
        const gap = 12;
        const totalGap = gap * (columns - 1);
        const brickWidth = (window.innerWidth - margin * 2 - totalGap) / columns;
        const brickHeight = 24;
        const startY = 95;
        const palette = [this.config.activeTheme.obstacle, '#7C4DFF', '#39FF14', '#FF2D55', '#FFD60A'];

        this.bricks = [];
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
                this.bricks.push({
                    x: margin + col * (brickWidth + gap),
                    y: startY + row * (brickHeight + gap),
                    width: brickWidth,
                    height: brickHeight,
                    hp: row < 2 ? 2 : 1,
                    maxHp: row < 2 ? 2 : 1,
                    color: palette[(row + col) % palette.length],
                    pulse: Math.random() * Math.PI * 2
                });
            }
        }
    }

    update() {
        if (this.isGameOver) return;

        this.frame++;
        this.updatePaddle();
        this.updateBall();
        this.updateParticles();
        this.updateTrail();

        if (this.bricks.length === 0) {
            this.nextWave();
        }
    }

    updatePaddle() {
        const moveSpeed = 15;
        if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) this.paddle.speed = -moveSpeed;
        else if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) this.paddle.speed = moveSpeed;
        else this.paddle.speed *= 0.82;

        this.paddle.x += this.paddle.speed;
        this.paddle.x = Math.max(18, Math.min(window.innerWidth - this.paddle.width - 18, this.paddle.x));
    }

    updateBall() {
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;
        this.trail.push({ x: this.ball.x, y: this.ball.y, life: 1 });

        if (this.ball.x - this.ball.radius <= 0 || this.ball.x + this.ball.radius >= window.innerWidth) {
            this.ball.dx *= -1;
            this.ball.x = Math.max(this.ball.radius, Math.min(window.innerWidth - this.ball.radius, this.ball.x));
            this.burst({ x: this.ball.x, y: this.ball.y }, this.config.activeTheme.obstacle, 8, 0.8);
        }

        if (this.ball.y - this.ball.radius <= 0) {
            this.ball.dy *= -1;
            this.ball.y = this.ball.radius;
            this.burst({ x: this.ball.x, y: this.ball.y }, this.config.activeTheme.player, 8, 0.8);
        }

        if (this.ball.y - this.ball.radius > window.innerHeight) {
            this.isGameOver = true;
            this.burst({ x: this.ball.x, y: window.innerHeight - 30 }, '#FF2D55', 42, 1.7);
            return;
        }

        this.handlePaddleCollision();
        this.handleBrickCollisions();
    }

    handlePaddleCollision() {
        const b = this.ball;
        const p = this.paddle;
        if (
            b.x + b.radius > p.x &&
            b.x - b.radius < p.x + p.width &&
            b.y + b.radius > p.y &&
            b.y - b.radius < p.y + p.height &&
            b.dy > 0
        ) {
            const hit = (b.x - (p.x + p.width / 2)) / (p.width / 2);
            const angle = hit * (Math.PI / 3);
            const speed = Math.min(15, Math.hypot(b.dx, b.dy) + 0.08);
            b.dx = Math.sin(angle) * speed;
            b.dy = -Math.cos(angle) * speed;
            b.y = p.y - b.radius - 1;
            this.burst({ x: b.x, y: p.y }, p.color, 16, 1.1);
        }
    }

    handleBrickCollisions() {
        const b = this.ball;
        for (let i = this.bricks.length - 1; i >= 0; i--) {
            const brick = this.bricks[i];
            const closestX = Math.max(brick.x, Math.min(b.x, brick.x + brick.width));
            const closestY = Math.max(brick.y, Math.min(b.y, brick.y + brick.height));
            const distX = b.x - closestX;
            const distY = b.y - closestY;

            if (distX * distX + distY * distY <= b.radius * b.radius) {
                const overlapX = Math.min(Math.abs(b.x - brick.x), Math.abs(b.x - (brick.x + brick.width)));
                const overlapY = Math.min(Math.abs(b.y - brick.y), Math.abs(b.y - (brick.y + brick.height)));
                if (overlapX < overlapY) b.dx *= -1;
                else b.dy *= -1;

                brick.hp--;
                this.score += 10;
                this.burst({ x: b.x, y: b.y }, brick.color, 18, 1.15);
                if (brick.hp <= 0) {
                    this.bricks.splice(i, 1);
                    this.score += 25;
                }
                break;
            }
        }
    }

    nextWave() {
        this.score += 250;
        this.ball.speed = Math.min(16, this.ball.speed + 1);
        this.ball.dx = this.ball.speed * (Math.random() > 0.5 ? 1 : -1);
        this.ball.dy = -this.ball.speed;
        this.ball.x = window.innerWidth / 2;
        this.ball.y = this.paddle.y - 35;
        this.createBricks();
        this.burst({ x: window.innerWidth / 2, y: window.innerHeight / 2 }, this.config.activeTheme.player, 60, 2);
    }

    updateTrail() {
        this.trail = this.trail.map((p) => ({ ...p, life: p.life - 0.08 })).filter((p) => p.life > 0);
    }

    updateParticles() {
        this.particles = this.particles
            .map((p) => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - 0.035, size: p.size * 0.96 }))
            .filter((p) => p.life > 0);
    }

    burst(point, color, count, force) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (Math.random() * 3 + 1) * force;
            this.particles.push({
                x: point.x,
                y: point.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: Math.random() * 0.55 + 0.35,
                size: Math.random() * 4 + 2,
                color
            });
        }
    }

    draw() {
        this.drawBackdrop();
        this.drawBricks();
        this.drawPaddle();
        this.drawTrail();
        this.drawBall();
        this.drawParticles();
        this.ctx.shadowBlur = 0;
        this.ctx.globalAlpha = 1;
    }

    drawBackdrop() {
        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = this.colorWithAlpha(this.config.activeTheme.player, 0.06);
        ctx.lineWidth = 1;
        const step = 54;
        const drift = (this.frame * 0.5) % step;
        for (let x = -step; x < window.innerWidth + step; x += step) {
            ctx.beginPath();
            ctx.moveTo(x + drift, 0);
            ctx.lineTo(x + drift - 180, window.innerHeight);
            ctx.stroke();
        }
        ctx.restore();
    }

    drawBricks() {
        const ctx = this.ctx;
        this.bricks.forEach((brick) => {
            const glow = 12 + Math.sin(this.frame * 0.06 + brick.pulse) * 4;
            ctx.save();
            ctx.shadowColor = brick.color;
            ctx.shadowBlur = glow;
            ctx.fillStyle = this.colorWithAlpha(brick.color, brick.hp === brick.maxHp ? 0.78 : 0.45);
            ctx.strokeStyle = this.colorWithAlpha('#FFFFFF', 0.55);
            ctx.lineWidth = 1.5;
            this.roundedRect(brick.x, brick.y, brick.width, brick.height, 8);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = this.colorWithAlpha('#FFFFFF', 0.18);
            this.roundedRect(brick.x + 6, brick.y + 4, brick.width - 12, 5, 3);
            ctx.fill();
            ctx.restore();
        });
    }

    drawPaddle() {
        const ctx = this.ctx;
        const p = this.paddle;
        const gradient = ctx.createLinearGradient(p.x, p.y, p.x + p.width, p.y);
        gradient.addColorStop(0, this.colorWithAlpha('#FFFFFF', 0.25));
        gradient.addColorStop(0.5, p.color);
        gradient.addColorStop(1, this.config.activeTheme.obstacle);

        ctx.save();
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 24;
        ctx.fillStyle = gradient;
        ctx.strokeStyle = this.colorWithAlpha('#FFFFFF', 0.8);
        ctx.lineWidth = 2;
        this.roundedRect(p.x, p.y, p.width, p.height, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = this.colorWithAlpha('#FFFFFF', 0.35);
        this.roundedRect(p.x + 14, p.y + 4, p.width - 28, 4, 3);
        ctx.fill();
        ctx.restore();
    }

    drawTrail() {
        const ctx = this.ctx;
        this.trail.forEach((p) => {
            ctx.save();
            ctx.globalAlpha = p.life * 0.45;
            ctx.shadowColor = this.config.activeTheme.obstacle;
            ctx.shadowBlur = 16;
            ctx.fillStyle = this.config.activeTheme.obstacle;
            ctx.beginPath();
            ctx.arc(p.x, p.y, this.ball.radius * p.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    drawBall() {
        const ctx = this.ctx;
        const b = this.ball;
        const gradient = ctx.createRadialGradient(b.x - 3, b.y - 4, 2, b.x, b.y, b.radius + 7);
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(0.45, this.config.activeTheme.obstacle);
        gradient.addColorStop(1, this.config.activeTheme.player);

        ctx.save();
        ctx.shadowColor = this.config.activeTheme.obstacle;
        ctx.shadowBlur = 28;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
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

    roundedRect(x, y, width, height, radius) {
        const ctx = this.ctx;
        const r = Math.min(radius, width / 2, height / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + width - r, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + r);
        ctx.lineTo(x + width, y + height - r);
        ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
        ctx.lineTo(x + r, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    colorWithAlpha(color, alpha) {
        if (!color) return `rgba(255, 255, 255, ${alpha})`;
        if (color.startsWith('rgba(')) return color.replace(/rgba\(([^)]+),\s*[^,)]+\)$/i, `rgba($1, ${alpha})`);
        if (color.startsWith('rgb(')) return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
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
    }

    onInput(code) {
        if (code === 'Space' && this.isGameOver) {
            this.reset();
            return;
        }
        if (code === 'Space' && !this.isGameOver) {
            this.ball.dy = -Math.abs(this.ball.dy || this.ball.speed);
            this.burst({ x: this.ball.x, y: this.ball.y }, this.config.activeTheme.player, 8, 0.8);
            return;
        }
        if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(code)) {
            this.keys.add(code);
            setTimeout(() => this.keys.delete(code), 90);
        }
    }
}
