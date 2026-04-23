export default class DinoGame {
    constructor(canvas, ctx, config) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.config = config;
        this.GROUND_OFFSET = 20;
        this.reset();
    }

    reset() {
        this.score = 0;
        this.gameSpeed = this.config.difficulty.initialSpeed;
        this.isGameOver = false;
        this.obstacles = [];
        this.dino = {
            targetX: this.canvas.width * 0.25,
            x: -50,
            y: this.canvas.height - this.GROUND_OFFSET - 60,
            width: 30,
            height: 60,
            dy: 0,
            jumpForce: this.config.difficulty.jumpForce,
            gravity: this.config.difficulty.gravity,
            grounded: false,
            color: this.config.theme.dinoColor,
            isIntro: true
        };
    }

    update() {
        if (this.isGameOver) return;

        // Intro animation
        if (this.dino.isIntro) {
            if (this.dino.x < this.dino.targetX) {
                this.dino.x += 5;
            } else {
                this.dino.x = this.dino.targetX;
                this.dino.isIntro = false;
            }
        }

        // Physics
        if (!this.dino.grounded) {
            this.dino.dy += this.dino.gravity;
            this.dino.y += this.dino.dy;
        }

        if (this.dino.y + this.dino.height > this.canvas.height - this.GROUND_OFFSET) {
            this.dino.y = this.canvas.height - this.dino.height - this.GROUND_OFFSET;
            this.dino.dy = 0;
            this.dino.grounded = true;
        }

        // Obstacles
        if (!this.dino.isIntro) {
            this.obstacles.forEach((obs, index) => {
                obs.x -= this.gameSpeed;
                
                // Collision
                if (this.dino.x < obs.x + obs.width &&
                    this.dino.x + this.dino.width > obs.x &&
                    this.dino.y < obs.y + obs.height &&
                    this.dino.y + this.dino.height > obs.y) {
                    this.isGameOver = true;
                }

                if (obs.x + obs.width < 0) {
                    this.obstacles.splice(index, 1);
                    this.score++;
                    if (this.score % 5 === 0) this.gameSpeed += 0.5;
                }
            });

            if (Math.random() < 0.015) {
                if (this.obstacles.length === 0 || this.obstacles[this.obstacles.length - 1].x < this.canvas.width - 400) {
                    this.createObstacle();
                }
            }
        }
    }

    createObstacle() {
        const height = Math.random() * 50 + 30;
        this.obstacles.push({
            x: this.canvas.width,
            y: this.canvas.height - height - this.GROUND_OFFSET,
            width: 30,
            height: height,
            color: this.config.theme.obstacleColor
        });
    }

    draw() {
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = this.dino.color;
        this.drawDino(this.dino.x, this.dino.y);

        this.ctx.shadowBlur = 15;
        this.obstacles.forEach(obs => {
            this.ctx.shadowColor = obs.color;
            this.drawCactus(obs.x, obs.y, obs.width, obs.height);
        });
        this.ctx.shadowBlur = 0;
    }

    drawDino(x, y) {
        this.ctx.fillStyle = this.dino.color;
        this.ctx.fillRect(x, y + 15, 30, 30);
        this.ctx.fillRect(x + 15, y, 20, 18);
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(x + 28, y + 5, 4, 4);
        this.ctx.fillStyle = this.dino.color;
        const legOffset = Math.sin(Date.now() / 50) * 8;
        this.ctx.fillRect(x + 4, y + 45, 8, 15 + (this.dino.grounded ? legOffset : 0));
        this.ctx.fillRect(x + 20, y + 45, 8, 15 - (this.dino.grounded ? legOffset : 0));
    }

    drawCactus(x, y, w, h) {
        this.ctx.fillStyle = this.config.theme.obstacleColor;
        this.ctx.fillRect(x + w/4, y, w/2, h);
        this.ctx.fillRect(x, y + h/3, w, h/6);
        this.ctx.fillRect(x, y + h/6, w/6, h/6);
        this.ctx.fillRect(x + w - w/6, y + h/6, w/6, h/6);
    }

    onInput(code) {
        if (code === 'Space') {
            if (this.isGameOver) {
                this.reset();
            } else if (this.dino.grounded) {
                this.dino.dy = -this.dino.jumpForce;
                this.dino.grounded = false;
            }
        }
    }
}
