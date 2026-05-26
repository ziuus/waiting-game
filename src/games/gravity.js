export default class GravityRunner {
    constructor(canvas, ctx, config) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.config = config;
        this.GROUND_OFFSET = 100; // Buffer from screen edges
        this.reset();
    }

    reset() {
        this.score = 0;
        this.gameSpeed = this.config.difficulty.initialSpeed;
        this.isGameOver = false;
        this.obstacles = [];
        this.particles = [];
        this.gravityDirection = 1; // 1 = Down, -1 = Up
        
        this.player = {
            x: window.innerWidth * 0.2,
            y: window.innerHeight / 2,
            width: 40,
            height: 40,
            dy: 0,
            gravity: this.config.difficulty.gravity,
            color: this.config.activeTheme.player,
            trail: []
        };
        
        this.boundaries = {
            top: this.GROUND_OFFSET,
            bottom: window.innerHeight - this.GROUND_OFFSET
        };
    }

    colorWithAlpha(color, alpha) {
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            const fullHex = hex.length === 3
                ? hex.split('').map((char) => char + char).join('')
                : hex;
            const value = Number.parseInt(fullHex, 16);
            const r = (value >> 16) & 255;
            const g = (value >> 8) & 255;
            const b = value & 255;
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }

        if (color.startsWith('rgb(')) {
            return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
        }

        if (color.startsWith('rgba(')) {
            return color.replace(/rgba\(([^)]+),\s*[^,)]+\)/, `rgba($1, ${alpha})`);
        }

        return color;
    }

    update() {
        if (this.isGameOver) return;

        // Gravity Physics
        this.player.dy += this.player.gravity * this.gravityDirection;
        this.player.y += this.player.dy;

        // Bound checking
        if (this.player.y < this.boundaries.top) {
            this.player.y = this.boundaries.top;
            this.player.dy = 0;
        } else if (this.player.y + this.player.height > this.boundaries.bottom) {
            this.player.y = this.boundaries.bottom - this.player.height;
            this.player.dy = 0;
        }

        // Trail
        this.player.trail.push({ x: this.player.x, y: this.player.y });
        if (this.player.trail.length > 10) this.player.trail.shift();

        // Obstacles
        this.obstacles.forEach((obs, index) => {
            obs.x -= this.gameSpeed;

            // Collision detection
            if (this.player.x < obs.x + obs.width &&
                this.player.x + this.player.width > obs.x &&
                this.player.y < obs.y + obs.height &&
                this.player.y + this.player.height > obs.y) {
                this.isGameOver = true;
                this.createExplosion(this.player.x, this.player.y);
            }

            if (obs.x + obs.width < 0) {
                this.obstacles.splice(index, 1);
                this.score++;
                if (this.score % 10 === 0) this.gameSpeed += 0.5;
            }
        });

        if (Math.random() < 0.02) {
            if (this.obstacles.length === 0 || this.obstacles[this.obstacles.length - 1].x < window.innerWidth - this.config.difficulty.obstacleGap) {
                this.createObstacle();
            }
        }

        // Particles
        this.particles.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            if (p.life <= 0) this.particles.splice(i, 1);
        });
    }

    createObstacle() {
        const side = Math.random() > 0.5 ? 'top' : 'bottom';
        const height = Math.random() * 80 + 40;
        const width = 40;
        
        this.obstacles.push({
            x: window.innerWidth,
            y: side === 'top' ? this.boundaries.top : this.boundaries.bottom - height,
            width: width,
            height: height,
            side: side,
            color: this.config.activeTheme.obstacle
        });
    }

    createExplosion(x, y) {
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: x + 20,
                y: y + 20,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1,
                color: this.player.color
            });
        }
    }

    draw() {
        // Draw grid boundaries for "Cyber" feel
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        const gridSize = 40;
        const scrollOffset = (Date.now() / 20) % gridSize;
        
        for (let x = -scrollOffset; x < window.innerWidth; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.boundaries.top);
            this.ctx.lineTo(x, this.boundaries.bottom);
            this.ctx.stroke();
        }

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.boundaries.top);
        this.ctx.lineTo(window.innerWidth, this.boundaries.top);
        this.ctx.moveTo(0, this.boundaries.bottom);
        this.ctx.lineTo(window.innerWidth, this.boundaries.bottom);
        this.ctx.stroke();
        this.ctx.restore();

        // Draw trail - fading aerodynamic shards
        this.player.trail.forEach((pos, i) => {
            const alpha = (i / this.player.trail.length) * 0.4;
            const sizeMod = (i / this.player.trail.length);
            this.ctx.fillStyle = this.colorWithAlpha(this.player.color, alpha);
            
            const tw = this.player.width * sizeMod;
            const th = this.player.height * sizeMod;
            const tx = pos.x + (this.player.width - tw) / 2;
            const ty = pos.y + (this.player.height - th) / 2;
            
            this.ctx.beginPath();
            this.ctx.moveTo(tx, ty + th/2);
            this.ctx.lineTo(tx + tw, ty);
            this.ctx.lineTo(tx + tw * 0.8, ty + th/2);
            this.ctx.lineTo(tx + tw, ty + th);
            this.ctx.closePath();
            this.ctx.fill();
        });

        // Draw player - Cyber Arrow
        this.ctx.save();
        this.ctx.shadowBlur = 25;
        this.ctx.shadowColor = this.player.color;
        this.ctx.fillStyle = this.player.color;
        
        const px = this.player.x;
        const py = this.player.y;
        const pw = this.player.width;
        const ph = this.player.height;

        this.ctx.beginPath();
        this.ctx.moveTo(px, py + ph/2);
        this.ctx.lineTo(px + pw, py);
        this.ctx.lineTo(px + pw * 0.7, py + ph/2);
        this.ctx.lineTo(px + pw, py + ph);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Inner Core Glow
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = "#fff";
        this.ctx.fillStyle = "#fff";
        this.ctx.beginPath();
        this.ctx.moveTo(px + pw * 0.2, py + ph/2);
        this.ctx.lineTo(px + pw * 0.5, py + ph/3);
        this.ctx.lineTo(px + pw * 0.4, py + ph/2);
        this.ctx.lineTo(px + pw * 0.5, py + ph * 2/3);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();

        // Draw obstacles - Neon Spikes
        this.obstacles.forEach(obs => {
            this.ctx.save();
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = obs.color;
            this.ctx.fillStyle = this.colorWithAlpha(obs.color, 0.8);
            this.ctx.strokeStyle = "#fff";
            this.ctx.lineWidth = 1;
            
            this.ctx.beginPath();
            if (obs.side === 'top') {
                this.ctx.moveTo(obs.x, obs.y);
                this.ctx.lineTo(obs.x + obs.width, obs.y);
                this.ctx.lineTo(obs.x + obs.width * 0.8, obs.y + obs.height * 0.8);
                this.ctx.lineTo(obs.x + obs.width / 2, obs.y + obs.height);
                this.ctx.lineTo(obs.x + obs.width * 0.2, obs.y + obs.height * 0.8);
            } else {
                this.ctx.moveTo(obs.x, obs.y + obs.height);
                this.ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
                this.ctx.lineTo(obs.x + obs.width * 0.8, obs.y + obs.height * 0.2);
                this.ctx.lineTo(obs.x + obs.width / 2, obs.y);
                this.ctx.lineTo(obs.x + obs.width * 0.2, obs.y + obs.height * 0.2);
            }
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
            this.ctx.restore();
        });

        // Draw particles
        this.particles.forEach(p => {
            this.ctx.fillStyle = this.colorWithAlpha(p.color, p.life);
            this.ctx.fillRect(p.x, p.y, 4, 4);
        });

        this.ctx.shadowBlur = 0;
    }

    onInput(code) {
        if (code === 'Space') {
            if (this.isGameOver) {
                this.reset();
            } else {
                this.gravityDirection *= -1;
                // Add tiny jump boost when flipping for responsiveness
                this.player.dy = this.gravityDirection * 5;
            }
        }
    }
}
