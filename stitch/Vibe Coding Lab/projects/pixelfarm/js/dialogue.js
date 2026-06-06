// 对话系统，显示和管理NPC对话内容
export class DialogueSystem {
  constructor(game) {
    this.game = game;
    this.container = document.getElementById('dialogue-overlay');
    this.textEl = document.getElementById('dialogue-text');
    this.portraitEl = document.getElementById('dialogue-portrait');
    this.nameEl = document.getElementById('dialogue-name');
    
    this.isActive = false;
    this.fullText = '';
    this.displayedText = '';
    this.charIndex = 0;
    this.typeTimer = 0;
    this.typeSpeed = 0.03; // Seconds per char
    
    this.isTyping = false;
    this.onComplete = null;
    
    // Timer to prevent instant closing if holding space
    this.interactionDelay = 0; 
    
    this.portraitMap = {
        'default': 'https://static.wefun.ai/assets/2eb88725-4f20-4bb2-ae1a-b1d7536497d8.png', // Idle Down 1
        'player_happy': 'https://static.wefun.ai/assets/2eb88725-4f20-4bb2-ae1a-b1d7536497d8.png' 
    };
  }

  show(text, portraitKey = 'default', name = 'Flora') {
    this.isActive = true;
    this.container.style.display = 'flex';
    this.fullText = text;
    this.displayedText = '';
    this.charIndex = 0;
    this.isTyping = true;
    this.interactionDelay = 0.5; // 0.5s delay before ANY input is accepted (skipping)
    
    // 播放对话框打开音效
    if (this.game.audio) {
      this.game.audio.playSFX('ui_click');
    }
    
    // Set Portrait
    const src = this.portraitMap[portraitKey] || this.portraitMap['default'];
    this.portraitEl.src = src;
    
    // Set Name
    this.nameEl.innerText = name;
    
    // Reset Timer
    this.typeTimer = 0;
  }

  hide() {
    this.isActive = false;
    this.container.style.display = 'none';
    if (this.onComplete) {
        this.onComplete();
        this.onComplete = null;
    }
  }

  update(dt, input) {
    if (!this.isActive) return;

    if (this.interactionDelay > 0) {
        this.interactionDelay -= dt;
        // Continue typing though
    }

    // Handle Typing
    if (this.isTyping) {
        this.typeTimer += dt;
        if (this.typeTimer >= this.typeSpeed) {
            this.typeTimer = 0;
            this.charIndex++;
            this.displayedText = this.fullText.substring(0, this.charIndex);
            this.textEl.innerText = this.displayedText;
            
            if (this.charIndex >= this.fullText.length) {
                this.isTyping = false;
                this.interactionDelay = 0.2; // Small delay before closing allowed
            }
        }
        
        // Skip typing on interaction (after initial delay)
        if (this.interactionDelay <= 0 && input.isDown(' ')) { 
             this.displayedText = this.fullText;
             this.textEl.innerText = this.displayedText;
             this.isTyping = false;
             this.charIndex = this.fullText.length;
             this.interactionDelay = 0.2; // Add delay before closing
             return; 
        }
    } else {
        // Wait for close
        if (this.interactionDelay <= 0 && (input.isDown(' ') || input.isDown('e'))) {
            this.hide();
        }
    }
  }
}

