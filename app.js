const SUPABASE_URL = 'https://vljhqfhfhcdfwyxcllge.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Eu2ugJjtiwsbV8yiyU9qQg_C3KR9djo';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const authSection = document.getElementById('auth-section');
const gameSection = document.getElementById('game-section');
const emailInput = document.getElementById('email');
const passInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.createElement('button');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const leaderboardDiv = document.getElementById('leaderboard');
const highScoreSpan = document.getElementById('high-score');

// UI Enhancements for Signup
signupBtn.innerText = 'Sign Up';
signupBtn.className = 'w-full bg-slate-600 hover:bg-slate-700 p-2 mt-2 rounded font-bold';
loginBtn.parentNode.appendChild(signupBtn);

let user = null;
let highScore = 0;
let gameState = 'menu';
let score = 0;

// Auth Logic
loginBtn.onclick = async () => {
    const email = emailInput.value;
    const password = passInput.value;
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) return alert(error.message);
    user = data.user;
    showGame();
};

signupBtn.onclick = async () => {
    const email = emailInput.value;
    const password = passInput.value;
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if (error) return alert(error.message);
    alert('Signup successful!');
    user = data.user;
    if (user) showGame();
};

async function showGame() {
    authSection.classList.add('hidden');
    gameSection.classList.remove('hidden');
    fetchHighScore();
    fetchLeaderboard();
}

async function fetchHighScore() {
    if (!user) return;
    const { data, error } = await supabaseClient
        .from('scores')
        .select('high_score')
        .eq('user_id', user.id)
        .maybeSingle();
    
    if (data) {
        highScore = data.high_score;
        highScoreSpan.innerText = highScore;
    }
}

async function fetchLeaderboard() {
    const { data, error } = await supabaseClient
        .from('scores')
        .select('email, high_score')
        .order('high_score', { ascending: false })
        .limit(10);
    
    if (data) {
        leaderboardDiv.innerHTML = data.map(s => `
            <div class="flex justify-between p-2 bg-slate-700 rounded">
                <span class="truncate mr-2">${s.email}</span>
                <span class="font-bold text-yellow-500">${s.high_score}</span>
            </div>
        `).join('');
    }
}

// Game Constants (Easy Mode)
let bird = { x: 50, y: 150, w: 25, h: 25, gravity: 0.4, velocity: 0 };
let pipes = [];
let frame = 0;
const PIPE_GAP = 160; 

function jump() {
    if (gameState === 'playing') {
        bird.velocity = -6.5;
    } else if (gameState === 'menu') {
        gameState = 'playing';
        draw();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (gameState === 'menu') {
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Click, Tap or Space', canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillStyle = '#22c55e';
        ctx.fillText('START GAME', canvas.width / 2, canvas.height / 2 + 20);
        return;
    }

    // Bird
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;
    ctx.fillStyle = '#facc15';
    ctx.fillRect(bird.x, bird.y, bird.w, bird.h);

    // Pipes
    if (frame % 120 === 0) {
        let pos = Math.random() * (canvas.height - PIPE_GAP - 100) + 50;
        pipes.push({ x: canvas.width, top: pos, bottom: pos + PIPE_GAP, passed: false });
    }

    ctx.fillStyle = '#22c55e';
    pipes.forEach((p, i) => {
        p.x -= 1.8;
        ctx.fillRect(p.x, 0, 40, p.top);
        ctx.fillRect(p.x, p.bottom, 40, canvas.height);

        // Collision
        if (bird.x < p.x + 40 && bird.x + bird.w > p.x && (bird.y < p.top || bird.y + bird.h > p.bottom)) {
            gameOver();
        }
        if (p.x < bird.x && !p.passed) {
            score++;
            p.passed = true;
        }
        if (p.x < -40) pipes.splice(i, 1);
    });

    if (bird.y + bird.h > canvas.height || bird.y < 0) gameOver();

    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 25);

    if (gameState === 'playing') {
        frame++;
        requestAnimationFrame(draw);
    }
}

async function gameOver() {
    gameState = 'menu';
    console.log(`Game Over. Score: ${score}, Current High Score: ${highScore}`);
    
    if (score > highScore) {
        console.log("New High Score! Updating database...");
        const { error } = await supabaseClient
            .from('scores')
            .upsert({ 
                user_id: user.id, 
                email: user.email, 
                high_score: score,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
            
        if (error) {
            console.error("Error updating score:", error.message);
        } else {
            console.log("Score updated successfully.");
            await fetchHighScore();
            await fetchLeaderboard();
        }
    }
    
    alert(`Game Over! Score: ${score}`);
    resetGame();
    draw(); 
}

function resetGame() {
    bird = { x: 50, y: 150, w: 25, h: 25, gravity: 0.4, velocity: 0 };
    pipes = [];
    score = 0;
    frame = 0;
}

draw();

// Universal Input
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        jump();
    }
});
canvas.addEventListener('mousedown', (e) => {
    e.preventDefault();
    jump();
});
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    jump();
});
