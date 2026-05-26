export default class DefenderGame {
    constructor(canvas, ctx, config) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.config = config;
        this.reset();
    }

    reset() {
        this.score = 0;
        this.isGameOver = false;
        this.frame = 0;
        this.enemies = [];
        this.bullets = [];
        this.enemyShots = [];
        this.particles = [];
        this.stars = this.createStars();
        this.lastShot = 0;
        this.spawnTimer = 0;

        this.ship = {
            x: 96,
            y: window.innerHeight / 2,
            targetY: window.innerHeight / 2,
            width: 56,
            height: 34,
            speed: this.config.difficulty.jumpForce || 8,
            shield: 3,
            invincible: 0
        };
    }

    createStars() {
        const count = Math.max(50, Math.min(140, Math.floor(window.innerWidth / 12)));
        return Array.from({ length: count }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            size: Math.random() * 2 + 0.6,
            speed: Math.random() * 2 + 0.5,
            alpha: Math.random() * 0.45 + 0.18
        }));
    }

    update() {
        if (this.isGameOver) return;

        this.frame++;
        this.updateStars();
        this.updateShip();
        this.updateBullets();
        this.updateEnemies();
        this.updateEnemyShots();
        this.updateParticles();
        this.spawnEnemies();
        this.checkCollisions();
        this.score += 1;
    }

    updateStars() {
        const baseSpeed = this.config.difficulty.initialSpeed || 6;
        this.stars.forEach((star) => {
            star.x -= star.speed + baseSpeed * 0.15;
            if (star.x < -8) {
                star.x = window.innerWidth + 8;
                star.y = Math.random() * window.innerHeight;
            }
        });
    }

    updateShip() {
        this.ship.y += (this.ship.targetY - this.ship.y) * 0.22;
        this.ship.y = Math.max(52, Math.min(window.innerHeight - 52, this.ship.y));
        this.ship.targetY = Math.max(52, Math.min(window.innerHeight - 52, this.ship.targetY));
        if (this.ship.invincible > 0) this.ship.invincible--;
    }

    updateBullets() {
        this.bullets = this.bullets
            .map((bullet) => ({ ...bullet, x: bullet.x + bullet.speed, life: bullet.life - 1 }))
            .filter((bullet) => bullet.x < window.innerWidth + 80 && bullet.life > 0);
    }

    updateEnemies() {
        const speed = this.config.difficulty.initialSpeed || 6;
        const fireChance = this.config.difficulty.gravity || 0.14;
        this.enemies = this.enemies
            .map((enemy) => {
                enemy.x -= speed + enemy.drift;
                enemy.y += Math.sin((this.frame + enemy.phase) * 0.04) * enemy.wave;
                enemy.pulse += 0.08;

                if (Math.random() < fireChance / 120) {
                    this.enemyShots.push({
                        x: enemy.x - 18,
                        y: enemy.y,
                        speed: speed + 4,
                        radius: 5,
                        life: 180
                    });
                }

                return enemy;
            })
            .filter((enemy) => enemy.x > -90 && enemy.hp > 0);
    }

    updateEnemyShots() {
        this.enemyShots = this.enemyShots
            .map((shot) => ({ ...shot, x: shot.x - shot.speed, life: shot.life - 1 }))
            .filter((shot) => shot.x > -40 && shot.life > 0);
    }

    updateParticles() {
        this.particles = this.particles
            .map((p) => ({
                ...p,
                x: p.x + p.vx,
                y: p.y + p.vy,
                vx: p.vx * 0.98,
                vy: p.vy * 0.98,
                life: p.life - 0.035,
                size: p.size * 0.965
            }))
            .filter((p) => p.life > 0 && p.size > 0.2);
    }

    spawnEnemies() {
        this.spawnTimer--;
        if (this.spawnTimer > 0) return;

        const gap = Math.max(28, this.config.difficulty.obstacleGap || 54);
        this.spawnTimer = gap + Math.random() * gap * 0.55;
        const size = Math.random() > 0.78 ? 46 : 34;

        this.enemies.push({
            x: window.innerWidth + 70,
            y: 70 + Math.random() * (window.innerHeight - 140),
            width: size,
            height: size,
            hp: size > 40 ? 2 : 1,
            drift: Math.random() * 2.4,
            wave: Math.random() * 2.2 + 0.4,
            phase: Math.random() * 100,
            pulse: Math.random() * Math.PI * 2
        });
    }

    checkCollisions() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];

            for (let b = this.bullets.length - 1; b >= 0; b--) {
                const bullet = this.bullets[b];
                if (this.circleRectCollision(bullet.x, bullet.y, bullet.radius, enemy)) {
                    this.bullets.splice(b, 1);
                    enemy.hp--;
                    this.burst(bullet.x, bullet.y, this.config.activeTheme.obstacle, 14, 1);
                    this.score += 45;
                    if (enemy.hp <= 0) {
                        this.enemies.splice(i, 1);
                        this.burst(enemy.x, enemy.y, this.config.activeTheme.obstacle, 30, 1.5);
                        this.score += 120;
                    }
                    break;
                }
            }

            if (this.ship.invincible === 0 && this.rectsOverlap(this.shipBounds(), enemy)) {
                this.takeHit(enemy.x, enemy.y);
                this.enemies.splice(i, 1);
            }
        }

        for (let i = this.enemyShots.length - 1; i >= 0; i--) {
            const shot = this.enemyShots[i];
            if (this.ship.invincible === 0 && this.circleRectCollision(shot.x, shot.y, shot.radius, this.shipBounds())) {
                this.enemyShots.splice(i, 1);
                this.takeHit(shot.x, shot.y);
            }
        }
    }

    takeHit(x, y) {
        this.ship.shield--;
        this.ship.invincible = 70;
        this.burst(x, y, '#FFFFFF', 38, 1.7);
        this.burst(this.ship.x, this.ship.y, this.config.activeTheme.player, 24, 1.2);
        if (this.ship.shield <= 0) {
            this.isGameOver = true;
            this.burst(this.ship.x, this.ship.y, '#FF2D55', 80, 2.2);
        }
    }

    shipBounds() {
        return {
            x: this.ship.x - this.ship.width / 2,
            y: this.ship.y - this.ship.height / 2,
            width: this.ship.width,
            height: this.ship.height
        };
    }

    rectsOverlap(a, b) {
        return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
    }

    circleRectCollision(cx, cy, radius, rect) {
        const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.height));
        const dx = cx - closestX;
        const dy = cy - closestY;
        return dx * dx + dy * dy <= radius * radius;
    }

    shoot() {
        if (this.frame - this.lastShot < 10) return;
        this.lastShot = this.frame;
        this.bullets.push({
            x: this.ship.x + 38,
            y: this.ship.y,
            speed: 18,
            radius: 5,
            life: 90
        });
        this.burst(this.ship.x + 42, this.ship.y, this.config.activeTheme.player, 8, 0.65);
    }

    burst(x, y, color, count, force) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (Math.random() * 3.5 + 0.8) * force;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: Math.random() * 0.55 + 0.35,
                size: Math.random() * 4 + 2,
                color
            });
        }
    }

    draw() {
        this.drawStarfield();
        this.drawHudLines();
        this.drawBullets();
        this.drawEnemies();
        this.drawEnemyShots();
        this.drawShip();
        this.drawParticles();
        this.ctx.globalAlpha = 1;
        this.ctx.shadowBlur = 0;
    }

    drawStarfield() {
        const ctx = this.ctx;
        ctx.save();
        this.stars.forEach((star) => {
            ctx.globalAlpha = star.alpha;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(star.x, star.y, star.size * 5, star.size);
        });
        ctx.restore();
    }

    drawHudLines() {
        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = this.colorWithAlpha(this.config.activeTheme.player, 0.12);
        ctx.lineWidth = 1;
        const step = 80;
        const drift = (this.frame * 1.6) % step;
        for (let x = -step; x < window.innerWidth + step; x += step) {
            ctx.beginPath();
            ctx.moveTo(x - drift, 0);
            ctx.lineTo(x - drift + 120, window.innerHeight);
            ctx.stroke();
        }
        ctx.restore();
    }

    drawShip() {
        const ctx = this.ctx;
        const ship = this.ship;
        const flicker = ship.invincible > 0 && Math.floor(this.frame / 4) % 2 === 0;
        if (flicker) return;

        ctx.save();
        ctx.translate(ship.x, ship.y);
        ctx.shadowColor = this.config.activeTheme.player;
        ctx.shadowBlur = 22;

        ctx.fillStyle = this.colorWithAlpha(this.config.activeTheme.player, 0.92);
        ctx.strokeStyle = this.colorWithAlpha('#FFFFFF', 0.75);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(34, 0);
        ctx.lineTo(-22, -18);
        ctx.lineTo(-10, 0);
        ctx.lineTo(-22, 18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = this.colorWithAlpha('#FFFFFF', 0.86);
        ctx.beginPath();
        ctx.ellipse(3, 0, 13, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.colorWithAlpha('#FFB000', 0.8 + Math.sin(this.frame * 0.4) * 0.15);
        ctx.beginPath();
        ctx.moveTo(-24, -7);
        ctx.lineTo(-46 - Math.random() * 10, 0);
        ctx.lineTo(-24, 7);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        this.drawShieldPips();
    }

    drawShieldPips() {
        const ctx = this.ctx;
        ctx.save();
        for (let i = 0; i < this.ship.shield; i++) {
            ctx.fillStyle = this.colorWithAlpha(this.config.activeTheme.player, 0.75);
            ctx.shadowColor = this.config.activeTheme.player;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(38 + i * 18, window.innerHeight - 42, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawEnemies() {
        const ctx = this.ctx;
        this.enemies.forEach((enemy) => {
            ctx.save();
            ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
            ctx.rotate(Math.sin(enemy.pulse) * 0.18);
            ctx.shadowColor = this.config.activeTheme.obstacle;
            ctx.shadowBlur = 18;
            ctx.fillStyle = this.colorWithAlpha(this.config.activeTheme.obstacle, enemy.hp > 1 ? 0.84 : 0.68);
            ctx.strokeStyle = this.colorWithAlpha('#FFFFFF', 0.62);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-enemy.width / 2, 0);
            ctx.lineTo(-enemy.width / 5, -enemy.height / 2);
            ctx.lineTo(enemy.width / 2, -enemy.height / 4);
            ctx.lineTo(enemy.width / 4, 0);
            ctx.lineTo(enemy.width / 2, enemy.height / 4);
            ctx.lineTo(-enemy.width / 5, enemy.height / 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        });
    }

    drawBullets() {
        const ctx = this.ctx;
        this.bullets.forEach((bullet) => {
            ctx.save();
            ctx.shadowColor = this.config.activeTheme.player;
            ctx.shadowBlur = 16;
            ctx.fillStyle = this.config.activeTheme.player;
            this.roundedRect(bullet.x - 4, bullet.y - 3, 26, 6, 3);
            ctx.fill();
            ctx.restore();
        });
    }

    drawEnemyShots() {
        const ctx = this.ctx;
        this.enemyShots.forEach((shot) => {
            ctx.save();
            ctx.shadowColor = this.config.activeTheme.obstacle;
            ctx.shadowBlur = 14;
            ctx.fillStyle = this.config.activeTheme.obstacle;
            ctx.beginPath();
            ctx.arc(shot.x, shot.y, shot.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    drawParticles() {
        const ctx = this.ctx;
        this.particles.forEach((p) => {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life);
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

    onInput(code) {
        if (this.isGameOver && code === 'Space') {
            this.reset();
            return;
        }

        if (code === 'ArrowUp' || code === 'KeyW') {
            this.ship.targetY -= 56;
        } else if (code === 'ArrowDown' || code === 'KeyS') {
            this.ship.targetY += 56;
        } else if (code === 'Space' || code === 'ArrowRight' || code === 'KeyD') {
            this.shoot();
        }
    }

    colorWithAlpha(color, alpha) {
        if (!color) return `rgba(255, 255, 255, ${alpha})`;
        if (color.startsWith('rgba(')) return color.replace(/rgba\(([^)]+),\s*[\d.]+\)/, `rgba($1, ${alpha})`);
        if (color.startsWith('rgb(')) return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
            const n = parseInt(full, 16);
            const r = (n >> 16) & 255;
            const g = (n >> 8) & 255;
            const b = n & 255;
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return color;
    }
}
