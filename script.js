// Game Elements & Variables
const gameZone = document.getElementById('game-zone');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const comboEl = document.getElementById('combo');
const startOverlay = document.getElementById('start-overlay');
const gameOverOverlay = document.getElementById('game-over-overlay');
const finalScoreEl = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const musicBtn = document.getElementById('music-btn');
const musicText = document.getElementById('music-text');

let score = 0;
let timeLeft = 30;
let combo = 0;
let gameInterval = null;
let timerInterval = null;
let isPlaying = false;

const candyTypes = ['🍭', '🍬', '🍩', '🧁', '⭐'];

// Web Audio API Synth (Chiptune Candy Pop Melody)
let audioCtx = null;
let isMusicPlaying = false;
let melodyInterval = null;

const candyPopMelody = [
  { note: 'E5', duration: 0.25 }, { note: 'G5', duration: 0.25 },
  { note: 'A5', duration: 0.25 }, { note: 'B5', duration: 0.5 },
  { note: 'A5', duration: 0.25 }, { note: 'G5', duration: 0.25 },
  { note: 'E5', duration: 0.5 },  { note: 'D5', duration: 0.25 },
  { note: 'E5', duration: 0.25 }, { note: 'G5', duration: 0.5 },
  { note: 'A5', duration: 0.5 },  { note: 'B5', duration: 0.5 }
];

const noteFreqs = {
  'D5': 587.33, 'E5': 659.25, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77
};

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playNote(freq, type = 'sine', duration = 0.2) {
  if (!audioCtx || audioCtx.state === 'suspended') return;
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  
  gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function playPopSFX() {
  if (!audioCtx) return;
  const pitch = 600 + (combo * 40);
  playNote(pitch, 'triangle', 0.12);
}

function startCandyPopMusic() {
  if (isMusicPlaying) return;
  isMusicPlaying = true;
  musicText.textContent = "Candy Pop Synth: ON 🎶";
  
  let noteIndex = 0;
  function playNext() {
    if (!isMusicPlaying) return;
    const current = candyPopMelody[noteIndex];
    playNote(noteFreqs[current.note], 'sine', current.duration);
    noteIndex = (noteIndex + 1) % candyPopMelody.length;
    melodyInterval = setTimeout(playNext, current.duration * 1000);
  }
  playNext();
}

function stopCandyPopMusic() {
  isMusicPlaying = false;
  clearTimeout(melodyInterval);
  musicText.textContent = "Candy Pop Synth: OFF 🎵";
}

musicBtn.addEventListener('click', () => {
  initAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  if (isMusicPlaying) {
    stopCandyPopMusic();
  } else {
    startCandyPopMusic();
  }
});

// Game Logic
function startGame() {
  initAudio();
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  
  score = 0;
  timeLeft = 30;
  combo = 0;
  isPlaying = true;
  
  scoreEl.textContent = score;
  timerEl.textContent = `${timeLeft}s`;
  comboEl.textContent = `x${combo}`;
  
  startOverlay.classList.remove('active');
  gameOverOverlay.classList.remove('active');
  
  // Clear any existing target candies
  document.querySelectorAll('.candy-target').forEach(c => c.remove());
  
  startCandyPopMusic();
  
  gameInterval = setInterval(spawnCandy, 650);
  timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
  timeLeft--;
  timerEl.textContent = `${timeLeft}s`;
  
  if (timeLeft <= 0) {
    endGame();
  }
}

function spawnCandy() {
  if (!isPlaying) return;
  
  const candy = document.createElement('div');
  candy.className = 'candy-target';
  
  const isSpecial = Math.random() < 0.2;
  candy.textContent = isSpecial ? '⭐' : candyTypes[Math.floor(Math.random() * (candyTypes.length - 1))];
  
  if (isSpecial) candy.classList.add('special');
  
  const x = Math.random() * 80 + 10;
  const y = Math.random() * 80 + 10;
  
  candy.style.left = `${x}%`;
  candy.style.top = `${y}%`;
  
  const handlePop = (e) => {
    e.stopPropagation();
    if (!isPlaying) return;
    
    playPopSFX();
    
    combo++;
    const addedScore = (isSpecial ? 30 : 10) + (combo * 2);
    score += addedScore;
    
    scoreEl.textContent = score;
    comboEl.textContent = `x${combo}`;
    
    showScoreFloat(addedScore, x, y);
    
    candy.remove();
  };
  
  candy.addEventListener('pointerdown', handlePop);
  
  gameZone.appendChild(candy);
  
  // Candy disappears after 1.2s if not clicked
  setTimeout(() => {
    if (candy.parentNode) {
      candy.remove();
      combo = 0;
      comboEl.textContent = `x${combo}`;
    }
  }, 1200);
}

function showScoreFloat(points, x, y) {
  const floatEl = document.createElement('div');
  floatEl.className = 'score-float';
  floatEl.textContent = `+${points}`;
  floatEl.style.left = `${x}%`;
  floatEl.style.top = `${y}%`;
  
  gameZone.appendChild(floatEl);
  setTimeout(() => floatEl.remove(), 800);
}

function endGame() {
  isPlaying = false;
  clearInterval(gameInterval);
  clearInterval(timerInterval);
  
  finalScoreEl.textContent = score;
  gameOverOverlay.classList.add('active');
}

// Event Listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
