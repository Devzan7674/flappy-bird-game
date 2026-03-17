class FlappyBird {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game states
        this.states = {
            START: 'start',
            PLAYING: 'playing',
            GAME_OVER: 'gameOver'
        };
        this.gameState = this.states.START;
        
        // Bird properties
        this.bird = {
            x: 60,
            y: this.canvas.height / 2,
            width: 34,
            height: 24,
            velocity: 0,
            gravity: 0.6,
            jumpStrength: -12,
            maxVelocity: 10
        };
        
        // Pipe properties
        this.pipes = [];
        this.pipeGap = 120;
        this.pipeWidth = 52;
        this.pipeSpacing = 200;
        this.nextPipeX = this.canvas.width + 100;
        
        // Game properties
        this.score = 0;
        this.bestScore = this.loadBestScore();
        this.gameSpeed = 5;
        this.frameCount = 0;
        
        // Visual properties
        this.birdColor = '#FFD700';
        this.pipeColor = '#2ECC71';
        this.bgColor = '#87CEEB';
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Start game loop
        this.gameLoop();
    }
    
    setupEventListeners() {
        // Space key
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleJump();
            }
        });
        
        // Mouse/Touch click
        document.addEventListener('click', () => this.handleJump());
        document.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleJump();
        });
    }
    
    handleJump() {
        if (this.gameState === this.states.START) {
            this.startGame();
        } else if (this.gameState === this.states.PLAYING) {
            this.bird.velocity = this.bird.jumpStrength;
        } else if (this.gameState === this.states.GAME_OVER) {
            this.resetGame();
        }
    }
    
    startGame() {
        this.gameState = this.states.PLAYING;
        document.getElementById('startScreen').classList.remove('active');
    }
    
    resetGame() {
        this.bird.y = this.canvas.height / 2;
        this.bird.velocity = 0;
        this.pipes = [];
        this.score = 0;
        this.frameCount = 0;
        this.nextPipeX = this.canvas.width + 100;
        this.gameState = this.states.PLAYING;
        document.getElementById('gameOverScreen').classList.remove('active');
    }
    
    gameOver() {
        this.gameState = this.states.GAME_OVER;
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.saveBestScore();
        }
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('bestScore').textContent = this.bestScore;
        document.getElementById('gameOverScreen').classList.add('active');
    }
    
    update() {
        if (this.gameState !== this.states.PLAYING) return;
        
        // Update bird physics
        this.bird.velocity += this.bird.gravity;
        this.bird.velocity = Math.min(this.bird.velocity, this.bird.maxVelocity);
        this.bird.y += this.bird.velocity;
        
        // Check collision with ground/ceiling
        if (this.bird.y + this.bird.height >= this.canvas.height || this.bird.y <= 0) {
            this.gameOver();
            return;
        }
        
        // Generate pipes
        if (this.nextPipeX < this.canvas.width) {
            this.generatePipe();
            this.nextPipeX += this.pipeSpacing;
        }
        
        // Update pipes
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            this.pipes[i].x -= this.gameSpeed;
            
            // Remove off-screen pipes
            if (this.pipes[i].x + this.pipeWidth < 0) {
                this.pipes.splice(i, 1);
            }
            // Check if bird passed pipe
            else if (
                this.pipes[i].x + this.pipeWidth === this.bird.x &&
                this.pipes[i].scored === false
            ) {
                this.pipes[i].scored = true;
                this.score++;
                this.updateScoreDisplay();
            }
            // Check collision with pipe
            else if (this.checkCollision(this.pipes[i])) {
                this.gameOver();
                return;
            }
        }
        
        this.frameCount++;
    }
    
    generatePipe() {
        const minHeight = 50;
        const maxHeight = this.canvas.height - this.pipeGap - minHeight;
        const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);
        
        this.pipes.push({
            x: this.canvas.width,
            topHeight: topHeight,
            bottomY: topHeight + this.pipeGap,
            scored: false
        });
    }
    
    checkCollision(pipe) {
        // Bird bounds
        const birdLeft = this.bird.x;
        const birdRight = this.bird.x + this.bird.width;
        const birdTop = this.bird.y;
        const birdBottom = this.bird.y + this.bird.height;
        
        // Pipe bounds
        const pipeLeft = pipe.x;
        const pipeRight = pipe.x + this.pipeWidth;
        const topPipeBottom = pipe.topHeight;
        const bottomPipeTop = pipe.bottomY;
        
        // Check if bird is within pipe's x range
        if (birdRight > pipeLeft && birdLeft < pipeRight) {
            // Check collision with top or bottom pipe
            if (birdTop < topPipeBottom || birdBottom > bottomPipeTop) {
                return true;
            }
        }
        
        return false;
    }
    
    draw() {
        // Clear canvas with gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#E0F6FF');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw ground
        this.ctx.fillStyle = '#8B7355';
        this.ctx.fillRect(0, this.canvas.height - 40, this.canvas.width, 40);
        
        // Draw grass
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(0, this.canvas.height - 38, this.canvas.width, 4);
        
        // Draw bird
        this.drawBird();
        
        // Draw pipes
        this.drawPipes();
    }
    
    drawBird() {
        const x = this.bird.x;
        const y = this.bird.y;
        const width = this.bird.width;
        const height = this.bird.height;
        
        // Body (yellow)
        this.ctx.fillStyle = this.birdColor;
        this.ctx.beginPath();
        this.ctx.arc(x + width / 2, y + height / 2, width / 2.2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Wing
        this.ctx.fillStyle = '#FFA500';
        this.ctx.beginPath();
        this.ctx.ellipse(x + width - 8, y + height / 2, 6, 10, Math.PI / 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Eye white
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(x + width - 8, y + height / 2 - 4, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Eye pupil
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(x + width - 6, y + height / 2 - 4, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Beak
        this.ctx.fillStyle = '#FF6347';
        this.ctx.beginPath();
        this.ctx.moveTo(x + width - 2, y + height / 2);
        this.ctx.lineTo(x + width + 4, y + height / 2 - 2);
        this.ctx.lineTo(x + width + 4, y + height / 2 + 2);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawPipes() {
        this.ctx.fillStyle = this.pipeColor;
        
        for (let pipe of this.pipes) {
            // Top pipe
            this.ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.topHeight);
            
            // Top pipe cap
            this.ctx.fillStyle = '#27AE60';
            this.ctx.fillRect(pipe.x - 2, pipe.topHeight - 8, this.pipeWidth + 4, 8);
            
            // Bottom pipe cap
            this.ctx.fillRect(pipe.x - 2, pipe.bottomY, this.pipeWidth + 4, 8);
            
            // Bottom pipe
            this.ctx.fillStyle = this.pipeColor;
            this.ctx.fillRect(pipe.x, pipe.bottomY, this.pipeWidth, this.canvas.height - pipe.bottomY);
        }
    }
    
    updateScoreDisplay() {
        document.getElementById('score').textContent = this.score;
    }
    
    saveBestScore() {
        localStorage.setItem('flappyBirdBestScore', this.bestScore.toString());
    }
    
    loadBestScore() {
        const saved = localStorage.getItem('flappyBirdBestScore');
        return saved ? parseInt(saved) : 0;
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new FlappyBird();
};