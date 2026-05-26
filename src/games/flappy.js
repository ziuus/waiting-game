export default class FlappyGame {
    constructor(canvas, ctx, config) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.config = config;
        this.reset();
    }

    reset() {
        this.score = 0;
        this.isGameOver = false;
        this.pipes = [];
        this.bird = {
            x: 150,
            y: window.innerHeight / 2,
            width: 46,
            height: 34,
            dy: 0,
            jump: -this.config.difficulty.jumpForce / 2, // Map jumpForce to bird jump
            gravity: this.config.difficulty.gravity / 2, // Map gravity
            color: this.config.activeTheme.player,
            rotation: 0,
            wingPhase: 0
        };
        this.frame = 0;
        this.obstacleGap = this.config.difficulty.obstacleGap;
    }

    update() {
        if (this.isGameOver) return;

        this.bird.dy += this.bird.gravity;
        this.bird.y += this.bird.dy;
        this.bird.rotation = Math.max(-0.45, Math.min(0.7, this.bird.dy / 14));
        this.bird.wingPhase += 0.28;

        // Collision with floor/ceiling
        if (this.bird.y + this.bird.height > window.innerHeight || this.bird.y < 0) {
            this.isGameOver = true;
        }

        // Pipes
        if (this.frame % 90 === 0) {
            const gap = this.obstacleGap;
            const minHeight = 60;
            const height = Math.random() * (window.innerHeight - gap - 2 * minHeight) + minHeight;
            this.pipes.push({
                x: window.innerWidth,
                top: height,
                bottom: window.innerHeight - height - gap,
                width: 42,
                passed: false
            });
        }

        this.pipes.forEach((pipe, index) => {
            pipe.x -= this.config.difficulty.initialSpeed || 4;

            // Collision
            if (this.bird.x < pipe.x + pipe.width &&
                this.bird.x + this.bird.width > pipe.x &&
                (this.bird.y < pipe.top || this.bird.y + this.bird.height > window.innerHeight - pipe.bottom)) {
                this.isGameOver = true;
            }

            if (!pipe.passed && pipe.x < this.bird.x) {
                pipe.passed = true;
                this.score++;
            }

            if (pipe.x + pipe.width < 0) {
                this.pipes.splice(index, 1);
            }
        });

        this.frame++;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Pipes — slimmer neon rounded gates instead of giant flat bars
        this.pipes.forEach(pipe => {
            this.drawPipe(pipe.x, 0, pipe.width, pipe.top, true);
            this.drawPipe(pipe.x, window.innerHeight - pipe.bottom, pipe.width, pipe.bottom, false);
        });

        this.drawBird();
        
        this.ctx.shadowBlur = 0;
    }

    roundedRect(x, y, width, height, radius) {
        const r = Math.min(radius, width / 2, height / 2);
        this.ctx.beginPath();
        this.ctx.moveTo(x + r, y);
        this.ctx.lineTo(x + width - r, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + r);
        this.ctx.lineTo(x + width, y + height - r);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
        this.ctx.lineTo(x + r, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - r);
        this.ctx.lineTo(x, y + r);
        this.ctx.quadraticCurveTo(x, y, x + r, y);
        this.ctx.closePath();
    }

    drawPipe(x, y, width, height, isTop) {
        if (height <= 0) return;

        const color = this.config.activeTheme.obstacle;
        const capHeight = 18;
        const bodyInset = 8;

        this.ctx.save();
        this.ctx.shadowBlur = 18;
        this.ctx.shadowColor = color;
        this.ctx.fillStyle = 'rgba(76, 175, 80, 0.72)';
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
        this.ctx.lineWidth = 1;

        this.roundedRect(x + bodyInset, y, width - bodyInset * 2, height, 10);
        this.ctx.fill();
        this.ctx.stroke();

        const capY = isTop ? y + height - capHeight : y;
        this.ctx.fillStyle = 'rgba(104, 186, 127, 0.86)';
        this.roundedRect(x - 4, capY, width + 8, capHeight, 8);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.restore();
    }

    drawBird() {
        const x = this.bird.x;
        const y = this.bird.y;
        const w = this.bird.width;
        const h = this.bird.height;
        const wing = Math.sin(this.bird.wingPhase) * 7;

        this.ctx.save();
        this.ctx.translate(x + w / 2, y + h / 2);
        this.ctx.rotate(this.bird.rotation);
        this.ctx.translate(-w / 2, -h / 2);

        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = this.bird.color;

        // Tail feathers
        this.ctx.fillStyle = '#ff9800';
        this.ctx.beginPath();
        this.ctx.moveTo(4, h / 2);
        this.ctx.lineTo(-12, h / 2 - 9);
        this.ctx.lineTo(-9, h / 2 + 7);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        // Body with Gradient
        const gradient = this.ctx.createRadialGradient(w * 0.4, h * 0.4, 2, w * 0.5, h * 0.5, w * 0.6);
        gradient.addColorStop(0, '#FFF59D'); // Highlight
        gradient.addColorStop(0.4, this.bird.color);
        gradient.addColorStop(1, '#F57F17'); // Shadow
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.ellipse(w / 2, h / 2, w / 2, h / 2.15, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();

        // Wing
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.ellipse(w * 0.38, h * 0.58 + wing * 0.25, 13, 7 + Math.abs(wing * 0.25), -0.35, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.restore();

        // Beak (more detailed)
        this.ctx.fillStyle = '#ff7043';
        this.ctx.beginPath();
        this.ctx.moveTo(w - 2, h * 0.4);
        this.ctx.quadraticCurveTo(w + 16, h * 0.45, w + 14, h * 0.5); // Top curve
        this.ctx.quadraticCurveTo(w + 16, h * 0.55, w - 2, h * 0.6); // Bottom curve
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        this.ctx.stroke();

        // Eye (Detailed)
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(w * 0.72, h * 0.34, 6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 0.5;
        this.ctx.stroke();

        // Pupil + Sparkle
        this.ctx.fillStyle = '#111';
        this.ctx.beginPath();
        this.ctx.arc(w * 0.75, h * 0.34, 2.8, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(w * 0.78, h * 0.3, 1.2, 0, Math.PI * 2); // Eye sparkle
        this.ctx.fill();

        this.ctx.restore();
    }

    onInput(code) {
        if (code === 'Space') {
            if (this.isGameOver) {
                this.reset();
            } else {
                this.bird.dy = this.bird.jump;
            }
        }
    }
}
