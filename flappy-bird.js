// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameState = 'start'; // 'start', 'playing', 'gameOver'
let score = 0;
let highScore = localStorage.getItem('flappyBirdHighScore') || 0;
let frames = 0;

// Update high score display
document.getElementById('high-score').textContent = highScore;

// Bird object
const bird = {
    x: 80,
    y: 250,
    width: 34,
    height: 24,
    velocity: 0,
    gravity: 0.5,
    jump: -9,
    rotation: 0,

    update() {
        if (gameState === 'playing') {
            this.velocity += this.gravity;
            this.y += this.velocity;

            // Rotation based on velocity
            if (this.velocity < 0) {
                this.rotation = -25 * Math.PI / 180;
            } else {
                this.rotation = Math.min(90, this.velocity * 3) * Math.PI / 180;
            }

            // Check boundaries
            if (this.y + this.height >= canvas.height - 100) {
                this.y = canvas.height - 100 - this.height;
                gameOver();
            }

            if (this.y <= 0) {
                this.y = 0;
                this.velocity = 0;
            }
        }
    },

    flap() {
        if (gameState === 'playing') {
            this.velocity = this.jump;
        }
    },

    draw() {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);

        // Draw bird body
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw wing
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.ellipse(-5, 5, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw eye
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(8, -5, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(10, -5, 3, 0, Math.PI * 2);
        ctx.fill();

        // Draw beak
        ctx.fillStyle = '#FF6347';
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(20, -2);
        ctx.lineTo(20, 2);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    },

    reset() {
        this.y = 250;
        this.velocity = 0;
        this.rotation = 0;
    }
};

// Pipes array
const pipes = [];
const pipeGap = 150;
const pipeWidth = 60;
const pipeSpeed = 2;

class Pipe {
    constructor() {
        this.x = canvas.width;
        this.width = pipeWidth;
        this.topHeight = Math.random() * (canvas.height - pipeGap - 200) + 50;
        this.bottomY = this.topHeight + pipeGap;
        this.scored = false;
    }

    update() {
        if (gameState === 'playing') {
            this.x -= pipeSpeed;
        }
    }

    draw() {
        // Top pipe
        ctx.fillStyle = '#228B22';
        ctx.fillRect(this.x, 0, this.width, this.topHeight);
        ctx.fillStyle = '#2E8B57';
        ctx.fillRect(this.x - 5, this.topHeight - 30, this.width + 10, 30);

        // Bottom pipe
        ctx.fillStyle = '#228B22';
        ctx.fillRect(this.x, this.bottomY, this.width, canvas.height - this.bottomY);
        ctx.fillStyle = '#2E8B57';
        ctx.fillRect(this.x - 5, this.bottomY, this.width + 10, 30);

        // Pipe details
        ctx.strokeStyle = '#1a5c1a';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, 0, this.width, this.topHeight);
        ctx.strokeRect(this.x, this.bottomY, this.width, canvas.height - this.bottomY);
    }

    collidesWith(bird) {
        if (bird.x + bird.width > this.x &&
            bird.x < this.x + this.width) {
            if (bird.y < this.topHeight ||
                bird.y + bird.height > this.bottomY) {
                return true;
            }
        }
        return false;
    }
}

// Background
function drawBackground() {
    // Sky
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.7);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(1, '#B0E0E6');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.7);

    // Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    drawCloud(80, 80, 40);
    drawCloud(220, 120, 35);
    drawCloud(320, 70, 45);

    // Ground
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(0, canvas.height - 100, canvas.width, 100);

    // Grass pattern
    ctx.fillStyle = '#90EE90';
    for (let i = 0; i < canvas.width; i += 20) {
        ctx.fillRect(i, canvas.height - 100, 15, 10);
    }

    // Ground detail
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 100);
    ctx.lineTo(canvas.width, canvas.height - 100);
    ctx.stroke();
}

function drawCloud(x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.arc(x + size * 0.8, y - size * 0.3, size * 0.8, 0, Math.PI * 2);
    ctx.arc(x + size * 1.5, y, size * 0.9, 0, Math.PI * 2);
    ctx.fill();
}

// Score display
function drawScore() {
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.strokeText(score, canvas.width / 2, 60);
    ctx.fillText(score, canvas.width / 2, 60);
}

// Game functions
function updatePipes() {
    // Add new pipe
    if (frames % 90 === 0) {
        pipes.push(new Pipe());
    }

    // Update and remove off-screen pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].update();

        // Check collision
        if (pipes[i].collidesWith(bird)) {
            gameOver();
        }

        // Score
        if (!pipes[i].scored && pipes[i].x + pipes[i].width < bird.x) {
            pipes[i].scored = true;
            score++;
            document.getElementById('score').textContent = score;
        }

        // Remove off-screen pipes
        if (pipes[i].x + pipes[i].width < 0) {
            pipes.splice(i, 1);
        }
    }
}

function drawPipes() {
    pipes.forEach(pipe => pipe.draw());
}

function startGame() {
    gameState = 'playing';
    score = 0;
    frames = 0;
    pipes.length = 0;
    bird.reset();
    document.getElementById('score').textContent = score;
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
}

function gameOver() {
    if (gameState === 'gameOver') return;

    gameState = 'gameOver';

    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('flappyBirdHighScore', highScore);
        document.getElementById('high-score').textContent = highScore;
    }

    // Show game over screen
    document.getElementById('final-score').textContent = score;
    document.getElementById('final-high-score').textContent = highScore;
    document.getElementById('game-over-screen').classList.remove('hidden');
}

// Game loop
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    drawBackground();

    // Update and draw
    if (gameState === 'playing') {
        frames++;
        updatePipes();
    }

    drawPipes();
    bird.update();
    bird.draw();

    if (gameState === 'playing') {
        drawScore();
    }

    requestAnimationFrame(gameLoop);
}

// Event listeners
canvas.addEventListener('click', () => {
    if (gameState === 'start') {
        startGame();
    }
    bird.flap();
});

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'start') {
            startGame();
        }
        bird.flap();
    }
});

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);

// Start game loop
gameLoop();
