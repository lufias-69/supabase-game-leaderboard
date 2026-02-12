const SUPABASE_URL = 'https://vljhqfhfhcdfwyxcllge.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Eu2ugJjtiwsbV8yiyU9qQg_C3KR9djo';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const authSection = document.getElementById('auth-section');
const gameSection = document.getElementById('game-section');
const emailInput = document.getElementById('email');
const passInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('start-btn');
const leaderboardDiv = document.getElementById('leaderboard');
const highScoreSpan = document.getElementById('high-score');

let user = null;
let highScore = 0;
let gameState = 'menu';
let score = 0;

// Auth Logic
loginBtn.onclick = async () => {
    const email = emailInput.value;
    const password = passInput.value;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
        const { data: upData, error: upError } = await supabase.auth.signUp({ email, password });
        if (upError) return alert(upError.message);
        user = upData.user;
    } else {
        user = data.user;
    }
    showGame();
};

async function showGame() {
    authSection.classList.add('hidden');
    gameSection.classList.remove('hidden');
    fetchHighScore();
    fetchLeaderboard();
}

async function fetchHighScore() {
    const { data } = await supabase.from('scores').select('high_score').eq('user_id', user.id).single();
    if (data) {
        highScore = data.high_score;
        highScoreSpan.innerText = highScore;
    }
}

async function fetchLeaderboard() {
    const { data } = await supabase.from('scores').select('email, high_score').order('high_score', { ascending: false }).limit(10);
    leaderboardDiv.innerHTML = data.map(s => `
        <div class="flex justify-between p-2 bg-slate-700 rounded">
            <span>${s.email}</span>
            <span class="font-bold text-yellow-500">${s.high_score}</span>
        </div>
    `).join('');
}

// Simple Game Logic (Flappy Clone)
let bird = { x: 50, y: 150, w: 20, h: 20, gravity: 0.6, velocity: 0 };
let pipes = [];
let frame = 0;

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Bird
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;
    ctx.fillStyle = '#facc15';
    ctx.fillRect(bird.x, bird.y, bird.w, bird.h);

    // Pipes
    if (frame % 100 === 0) {
        let gap = 120;
        let pos = Math.random() * (canvas.height - gap - 100) + 50;
        pipes.push({ x: canvas.width, top: pos, bottom: pos + gap });
    }

    ctx.fillStyle = '#22c55e';
    pipes.forEach((p, i) => {
        p.x -= 2;
        ctx.fillRect(p.x, 0, 40, p.top);
        ctx.fillRect(p.x, p.bottom, 40, canvas.height);

        // Collision
        if (bird.x < p.x + 40 && bird.x + bird.w > p.x && (bird.y < p.top || bird.y + bird.h > p.bottom)) {
            gameOver();
        }
        if (p.x === bird.x) score++;
        if (p.x < -40) pipes.splice(i, 1);
    });

    if (bird.y + bird.h > canvas.height || bird.y < 0) gameOver();

    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 25);

    if (gameState === 'playing') {
        frame++;
        requestAnimationFrame(draw);
    }
}

async function gameOver() {
    gameState = 'menu';
    if (score > highScore) {
        await supabase.from('scores').upsert({ user_id: user.id, email: user.email, high_score: score });
        fetchHighScore();
        fetchLeaderboard();
    }
    alert(`Game Over! Score: ${score}`);
    resetGame();
}

function resetGame() {
    bird = { x: 50, y: 150, w: 20, h: 20, gravity: 0.6, velocity: 0 };
    pipes = [];
    score = 0;
    frame = 0;
}

startBtn.onclick = () => {
    if (gameState === 'menu') {
        gameState = 'playing';
        draw();
    }
};

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') bird.velocity = -8;
});
