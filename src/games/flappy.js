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
            width: 30,
            height: 45,
            dy: 0,
            jump: -7,
            gravity: 0.35,
            color: this.config.theme.dinoColor
        };
        this.frame = 0;
    }

    update() {
        if (this.isGameOver) return;

        this.bird.dy += this.bird.gravity;
        this.bird.y += this.bird.dy;

        // Collision with floor/ceiling
        if (this.bird.y + this.bird.height > window.innerHeight || this.bird.y < 0) {
            this.isGameOver = true;
        }

        // Pipes
        if (this.frame % 90 === 0) {
            const gap = 160;
            const minHeight = 60;
            const height = Math.random() * (window.innerHeight - gap - 2 * minHeight) + minHeight;
            this.pipes.push({
                x: window.innerWidth,
                top: height,
                bottom: window.innerHeight - height - gap,
                width: 60,
                passed: false
            });
        }

        this.pipes.forEach((pipe, index) => {
            pipe.x -= 5;

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
        this.ctx.shadowBlur = 0;
        // Draw Flying Dino
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = this.bird.color;
        this.drawFlyingDino(this.bird.x, this.bird.y);

        // Draw Pipes (Neon Cacti)
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = this.config.theme.obstacleColor;
        this.ctx.fillStyle = this.config.theme.obstacleColor;
        this.pipes.forEach(pipe => {
            // Top Pipe
            this.ctx.fillRect(pipe.x, 0, pipe.width, pipe.top);
            // Bottom Pipe
            this.ctx.fillRect(pipe.x, window.innerHeight - pipe.bottom, pipe.width, pipe.bottom);
        });
        this.ctx.shadowBlur = 0;
    }

    drawFlyingDino(x, y) {
        this.ctx.fillStyle = this.bird.color;
        // Body
        this.ctx.fillRect(x, y + 10, 30, 25);
        // Head
        this.ctx.fillRect(x + 15, y, 18, 15);
        // Eye
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(x + 26, y + 4, 3, 3);
        
        // Wing Animation
        this.ctx.fillStyle = this.bird.color;
        const wingPos = Math.sin(Date.now() / 100) * 10;
        this.ctx.fillRect(x - 5, y + 15 + wingPos, 15, 8);
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
