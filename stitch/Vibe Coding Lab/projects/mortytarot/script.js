import { tarotDeck } from './cards.js';

// DOM Elements
const cardElement = document.getElementById('tarot-card');
const deckSpreadEl = document.getElementById('deck-spread');
const mainSceneEl = document.getElementById('main-scene');
const instructionTextEl = document.getElementById('instruction-text');
const statusMsg = document.getElementById('status-msg');
const restartBtn = document.getElementById('restart-btn');
const downloadBtn = document.getElementById('download-btn');
const soundToggleBtn = document.getElementById('sound-toggle-btn');
const startScreenEl = document.getElementById('start-screen');
const startActionBtn = document.getElementById('start-btn');

// Card Content Elements
const cardNameEl = document.getElementById('card-name');
const cardNumberEl = document.getElementById('card-number');
const cardImgEl = document.getElementById('card-img');
const cardAdviceEl = document.getElementById('card-advice');

// State Elements
const loadingStateEl = document.getElementById('loading-state');
const contentStateEl = document.getElementById('content-state');

// Constants
const STORAGE_DATE_KEY = 'mortyTarotLastDraw_v10';
const STORAGE_CARD_KEY = 'mortyTarotCardId_v10';
const SPREAD_COUNT = 12; // Circular spread count

// State
let currentCard = null;

// Sound Manager Class
class SoundManager {
  constructor() {
    this.muted = false;
    this.bgmStarted = false;
    
    // Audio Assets - Rick and Morty Style (Sci-Fi / Cosmic / Glitchy)
    
    // BGM: Rick and Morty Style Mystery (Sci-Fi Suspense)
    this.bgm = new Audio('https://assets.mixkit.co/music/preview/mixkit-sci-fi-suspense-286.mp3'); 
    this.bgm.loop = true;
    this.bgm.volume = 0.4; // Adjusted volume for the new track

    // SFX: Hover (Fast Digital/Geiger Blip)
    this.sfxHover = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-calculator-loop-interface-sound-3221.mp3');
    this.sfxHover.volume = 0.15;

    // SFX: Select (Portal Gun / Warp Sound)
    this.sfxSelect = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-sci-fi-plasma-gun-power-up-1679.mp3');
    this.sfxSelect.volume = 0.4;

    // SFX: Reveal (Mind-Blowing / Dramatic Hit)
    this.sfxReveal = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-ethereal-fairy-win-sound-2019.mp3');
    this.sfxReveal.volume = 0.5;

    // SFX: Shuffle/Glitch (Used on Restart)
    this.sfxShuffle = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-glitch-and-noise-transition-2556.mp3');
    this.sfxShuffle.volume = 0.3;

    this.lastHoverTime = 0;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.bgm.pause();
      return true; // Muted
    } else {
      if (this.bgmStarted) this.bgm.play().catch(e => console.log(e));
      return false; // Unmuted
    }
  }

  // Attempt to start BGM on first interaction
  initAudio() {
    if (!this.bgmStarted && !this.muted) {
      this.bgm.play().then(() => {
        this.bgmStarted = true;
      }).catch(e => {
        // Browser policy might block this until user interacts
        console.log("Audio waiting for interaction");
      });
    }
  }

  playHover() {
    if (this.muted) return;
    const now = Date.now();
    // Debounce hover sound (60ms) to prevent machine-gun effect
    if (now - this.lastHoverTime > 60) {
      this.sfxHover.currentTime = 0;
      this.sfxHover.play().catch(() => {});
      this.lastHoverTime = now;
    }
  }

  playSelect() {
    if (this.muted) return;
    this.sfxSelect.currentTime = 0;
    this.sfxSelect.play().catch(() => {});
  }

  playReveal() {
    if (this.muted) return;
    this.sfxReveal.currentTime = 0;
    this.sfxReveal.play().catch(() => {});
  }

  playShuffle() {
    if (this.muted) return;
    this.sfxShuffle.currentTime = 0;
    this.sfxShuffle.play().catch(() => {});
  }
}

const soundManager = new SoundManager();

// Helper: Get Today's Date String
function getTodayString() {
  const date = new Date();
  return date.toDateString(); 
}

// Helper: Format Card Number/Suit Label
function getCardLabel(card) {
  if (card.suit === 'Major') {
    return `Major Arcana • ${toRoman(card.id)}`;
  }
  return `${card.suit} • ${card.id % 14 || 14}`;
}

// Helper: Roman Numerals
function toRoman(num) {
  const romals = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"];
  return romals[num] || num;
}

// Helper: Generate AI Image URL
function getImageUrl(card) {
  const subject = "Morty Smith from Rick and Morty";
  const context = "depicted as a character on a vintage tarot card";
  const style = "intricate rococo art style, ornate golden frame, pastel color palette, highly detailed, soft cinematic lighting, masterpiece, jean-honore fragonard style";
  const visualDescription = card.visual;
  
  const fullPrompt = `${subject}, ${visualDescription}, ${context}, ${style}`;
  const encodedPrompt = encodeURIComponent(fullPrompt);
  
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=320&height=480&nologo=true&seed=${card.id + 100}`; 
}

// Function: Update Card UI Content
function updateCardUI(cardId) {
  const card = tarotDeck.find(c => c.id === cardId);
  if (!card) return;

  currentCard = card;

  // 1. Reset State: Show Loading, Hide Content
  loadingStateEl.style.display = 'flex';
  contentStateEl.style.display = 'none';

  // 2. Prepare Content (hidden)
  cardNameEl.textContent = card.name;
  cardNumberEl.textContent = getCardLabel(card);
  cardAdviceEl.textContent = card.advice;

  // 3. Load Image
  const newImgSrc = getImageUrl(card);
  
  // Set CORS to allow canvas export later
  cardImgEl.crossOrigin = "anonymous";
  
  cardImgEl.onload = () => {
    // Reveal Content only when image is ready
    loadingStateEl.style.display = 'none';
    contentStateEl.style.display = 'flex';
  };

  cardImgEl.onerror = () => {
    console.error("Image load failed");
    loadingStateEl.style.display = 'none';
    contentStateEl.style.display = 'flex';
  };

  cardImgEl.src = newImgSrc;
}

// Function: Render the Deck Spread (Circular)
function renderDeckSpread() {
  deckSpreadEl.innerHTML = '';
  // Circle Logic
  const step = 360 / SPREAD_COUNT;

  for (let i = 0; i < SPREAD_COUNT; i++) {
    const cardEl = document.createElement('div');
    cardEl.className = 'mini-card';
    
    // Calculate rotation
    // We want cards to face outward (radial)
    const angle = i * step;
    
    // Use translateY percentage to push out from center. 
    // -120% pushes it upwards (relative to card height) by 1.2x height.
    cardEl.style.transform = `rotate(${angle}deg) translateY(-120%)`;
    
    // Add Click Handler
    cardEl.addEventListener('click', () => handleCardSelect(cardEl));
    
    // Add Hover Handler for Sound
    cardEl.addEventListener('mouseenter', () => {
      // Only play if not selected yet
      if (!deckSpreadEl.classList.contains('locked')) {
        soundManager.playHover();
      }
    });

    deckSpreadEl.appendChild(cardEl);
  }
}

// Function: Handle Card Selection
function handleCardSelect(selectedCardEl) {
  if (selectedCardEl.classList.contains('selected-glow')) return; // Prevent double click
  
  // Try to init audio context if it wasn't already (user gesture)
  soundManager.initAudio();
  soundManager.playSelect();

  // Lock the deck (pauses rotation via CSS)
  deckSpreadEl.classList.add('locked');

  // 1. Pick a random card logic
  const randomIndex = Math.floor(Math.random() * tarotDeck.length);
  const resultCard = tarotDeck[randomIndex];

  // 2. Save to Storage
  localStorage.setItem(STORAGE_DATE_KEY, getTodayString());
  localStorage.setItem(STORAGE_CARD_KEY, resultCard.id);

  // 3. Visual Transition
  selectedCardEl.classList.add('selected-glow');

  // Fade out other cards slowly
  const allCards = document.querySelectorAll('.mini-card');
  allCards.forEach(c => {
    if (c !== selectedCardEl) {
      c.style.transition = 'opacity 1s ease, transform 1s ease';
      c.style.opacity = '0';
      c.style.transform = c.style.transform + ' scale(0.8)'; // Shrink others slightly
      c.style.pointerEvents = 'none';
    }
  });
  
  instructionTextEl.style.opacity = '0';

  // Wait for the glow effect (1.5s)
  setTimeout(() => {
    deckSpreadEl.style.display = 'none';
    instructionTextEl.style.display = 'none';
    
    // Show Main Scene
    mainSceneEl.style.display = 'block';
    
    // Update Content (starts loading)
    updateCardUI(resultCard.id);

    // Flip the main card
    setTimeout(() => {
      cardElement.classList.add('is-flipped');
      soundManager.playReveal(); // Play magical sound on flip
      statusMsg.textContent = "If the figures in the tarot appear odd, that's perfectly normal—anything can happen in the multiverse.";
      restartBtn.style.display = 'inline-block';
      downloadBtn.style.display = 'inline-block';
    }, 100);
    
  }, 1500); 
}

// Function: Reveal Card directly (for returning users)
function revealCardDirectly(cardId) {
  deckSpreadEl.style.display = 'none';
  instructionTextEl.style.display = 'none';
  mainSceneEl.style.display = 'block';
  
  updateCardUI(cardId);
  cardElement.classList.add('is-flipped'); // Already flipped
  
  statusMsg.textContent = "If the figures in the tarot appear odd, that's perfectly normal—anything can happen in the multiverse.";
  restartBtn.style.display = 'inline-block';
  downloadBtn.style.display = 'inline-block';
}

// Function: Restart / Draw Again
function handleRestart() {
  // Play shuffle noise
  soundManager.playShuffle();
  
  // Reset UI State
  cardElement.classList.remove('is-flipped');
  statusMsg.textContent = "";
  restartBtn.style.display = 'none';
  downloadBtn.style.display = 'none';
  currentCard = null;

  // Hide Main Scene
  mainSceneEl.style.display = 'none';
  
  // Show Spread Area
  deckSpreadEl.style.display = 'flex';
  deckSpreadEl.classList.remove('locked'); // Unlock hover sounds/animation
  instructionTextEl.style.display = 'block';
  instructionTextEl.style.opacity = '1';
  
  // Re-render spread to reset opacities and positions
  renderDeckSpread();

  // Clear Storage
  localStorage.removeItem(STORAGE_DATE_KEY);
  localStorage.removeItem(STORAGE_CARD_KEY);
}

// Function: Create Sparkling Stars
function createStars() {
  const starsContainer = document.getElementById('stars-container');
  if (!starsContainer) return;

  const starCount = 100; // Number of stars
  
  for (let i = 0; i < starCount; i++) {
    const star = document.createElement('div');
    star.classList.add('star');
    
    // Random position
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    
    // Random size (tiny to small)
    const size = Math.random() * 2 + 1; // 1px to 3px
    
    // Random duration and delay for twinkling
    const duration = Math.random() * 3 + 2; // 2s to 5s
    const delay = Math.random() * 5; 
    
    star.style.left = `${x}%`;
    star.style.top = `${y}%`;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.setProperty('--duration', `${duration}s`);
    star.style.setProperty('--delay', `${delay}s`);
    
    starsContainer.appendChild(star);
  }
}

// Function: Draw Text with Wrapping on Canvas
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';

  for(let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    }
    else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

// Function: Download Card as Image
async function handleDownload() {
  if (!currentCard || !cardImgEl.complete) {
    statusMsg.textContent = "Wait for the image to load!";
    return;
  }
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Set dimensions (High Resolution)
  const width = 600;
  const height = 900;
  canvas.width = width;
  canvas.height = height;
  
  // 1. Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  
  // 2. Double Border (Gold)
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 15;
  ctx.strokeRect(20, 20, width - 40, height - 40);
  ctx.lineWidth = 5;
  ctx.strokeRect(40, 40, width - 80, height - 80);
  
  // 3. Header Text
  ctx.fillStyle = '#2c3e50';
  ctx.textAlign = 'center';
  
  // Card Number
  ctx.font = '24px sans-serif';
  const label = getCardLabel(currentCard);
  ctx.fillText(label.toUpperCase(), width / 2, 90);
  
  // Card Name
  ctx.font = '50px "GetSchwifty", sans-serif'; // Fallback if font not loaded
  ctx.fillText(currentCard.name, width / 2, 150);
  
  // 4. Image
  // Draw the image in center
  try {
    const imgWidth = 450;
    const imgHeight = 450;
    const imgX = (width - imgWidth) / 2;
    const imgY = 180;
    
    ctx.drawImage(cardImgEl, imgX, imgY, imgWidth, imgHeight);
    
    // Border around image
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    ctx.strokeRect(imgX, imgY, imgWidth, imgHeight);
    
  } catch (e) {
    console.error("Canvas draw failed", e);
    // If CORS fails (shouldn't if crossOrigin is set), we might just get a blank space.
  }
  
  // 5. Advice Text
  ctx.fillStyle = '#2c3e50';
  ctx.font = '30px sans-serif';
  ctx.textAlign = 'center';
  
  const adviceY = 680;
  ctx.font = '20px sans-serif';
  ctx.fillStyle = '#999';
  ctx.fillText("DAILY MAXIM", width / 2, adviceY);
  
  ctx.font = '28px "GetSchwifty", sans-serif';
  ctx.fillStyle = '#2c3e50';
  wrapText(ctx, currentCard.advice, width / 2, adviceY + 50, width - 100, 40);
  
  // 6. Footer / Watermark
  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#b2d832'; // Portal Green
  ctx.fillText("Think: What Would Morty Do?", width / 2, height - 30);

  // 7. Save
  try {
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `Morty_Tarot_${currentCard.name.replace(/\s+/g, '_')}.png`;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error("Security Error on export", err);
    statusMsg.textContent = "Error saving image (CORS blocked).";
  }
}

// Sound Toggle Handler
soundToggleBtn.addEventListener('click', () => {
  const isMuted = soundManager.toggleMute();
  soundToggleBtn.textContent = isMuted ? '🔇' : '🔊';
  // Try to start BGM if unmuting and not started
  if (!isMuted) soundManager.initAudio();
});

// Start Screen Handler
startActionBtn.addEventListener('click', () => {
  soundManager.initAudio();
  soundManager.playSelect();
  
  // Speed up portal animation slightly for exit effect
  const portalImg = document.querySelector('.portal-img');
  if(portalImg) portalImg.style.animationDuration = '2s';

  // Fade out start screen
  startScreenEl.style.opacity = '0';
  startScreenEl.style.visibility = 'hidden';
  
  // After transition, remove display to prevent clicks (handled by visibility but just in case)
  setTimeout(() => {
    startScreenEl.style.display = 'none';
  }, 800);
});

// Event Listeners
restartBtn.addEventListener('click', handleRestart);
downloadBtn.addEventListener('click', handleDownload);

// Init Game
function init() {
  createStars(); // Generate the starry background
  
  const lastDrawDate = localStorage.getItem(STORAGE_DATE_KEY);
  const lastCardId = localStorage.getItem(STORAGE_CARD_KEY);
  const today = getTodayString();

  if (lastDrawDate === today && lastCardId !== null) {
    // User already drew today
    revealCardDirectly(parseInt(lastCardId)); 
  } else {
    // New game state
    renderDeckSpread();
  }
}

// Start
init();
