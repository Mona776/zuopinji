export class PlayerDialogueSystem {
    constructor(game) {
      this.game = game;
      this.isVisible = false;
      this.currentText = '';
      this.displayedText = '';
      this.displayTimer = 0;
      this.displayDuration = 3.0;
      
      this.clickHistory = [];
      this.clickWindow = 3.0;
      this.rapidClickThreshold = 3;
      
      this.animTimer = 0;
      this.animScale = 0;
      
      // Sound effect cooldown (5 seconds)
      this.lastSoundTime = 0;
      this.soundCooldown = 5000; // 5 seconds in milliseconds
      
      // Typewriter Effect (SLOWED DOWN)
      this.isTyping = false;
      this.charIndex = 0;
      this.typeSpeed = 0.08;
      this.typeTimer = 0;
      
      this.dialoguePools = {
        normal: [
          "I look fine, don't I? Today, too.",
          "I don't need your approval.",
          "The wind bends around me.",
          "Don't worry about me.",
          "Time here is well-behaved.",
          "The scent of memory.",
          "Tomorrow will come, like yesterday.",
          "Routine is rather... safe.",
          "I wasn't left behind.",
          "I just haven't left yet.",
          "Wind has no aim, yet always arrives on time.",
          "Can't? I didn't catch that.",
          "Rules look... exhausting.",
          "I never asked if it was right.",
          "Think too much, miss the weather.",
          "Curiosity isn't a crime, is it?",
          "Yesterday? Or just now?",
          "Time moves slowly here.",
          "I'm not sure what day it is.",
          "The past never left."
        ],
        cold: [
          "...",
          "Oh."
        ],
        rapid: [
          "Are you bored?",
          "Stop poking me.",
          "What are you checking for?",
          "You seem... familiar."
        ],
        hidden: [
          "This isn't real, but not a dream.",
          "Here... same as always.",
          "I feel I've been here many times.",
          "Will you ever leave this place?"
        ]
      };
      
      // UPDATED PROBABILITIES: 60% cold, 39% normal, 1% hidden
      this.hiddenChance = 0.01;
      this.normalChance = 0.39;
      this.coldChance = 0.60;
      
      this.bubbleOffset = { x: 0, y: -42 };
      this.bubbleWidth = 140;
      this.bubbleHeight = 48;
      this.bubblePadding = 8;
      
      this.setupClickHandler();
    }
    
    setupClickHandler() {
      this.game.canvas.addEventListener('click', (e) => {
        if (this.game.editor && this.game.editor.isVisible) return;
        if (this.game.dialogue && this.game.dialogue.isActive) return;
        if (this.game.interaction && this.game.interaction.isVisible) return;
        
        const rect = this.game.canvas.getBoundingClientRect();
        const scaleX = this.game.canvas.width / rect.width;
        const scaleY = this.game.canvas.height / rect.height;
        
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;
        
        const worldX = mouseX + Math.floor(this.game.camera.x);
        const worldY = mouseY + Math.floor(this.game.camera.y);
        
        console.log('Click detected at world coords:', worldX, worldY);
        
        this.checkPlayerClick(worldX, worldY);
      });
    }
    
    checkPlayerClick(worldX, worldY) {
      const player = this.game.player;
      if (!player || !player.visible) {
        console.log('Player not available or not visible');
        return;
      }
      
      const frame = player.animator.getCurrentFrame();
      if (!frame) {
        console.log('No frame available');
        return;
      }
      
      const drawX = player.x + (player.width - frame.w) / 2;
      const drawY = player.y + (player.height - frame.h);
      
      const clickMargin = 24;
      
      const inBounds = worldX >= drawX - clickMargin && 
                       worldX <= drawX + frame.w + clickMargin &&
                       worldY >= drawY - clickMargin && 
                       worldY <= drawY + frame.h + clickMargin;
      
      console.log('Player bounds check:', {
        playerX: drawX,
        playerY: drawY,
        playerW: frame.w,
        playerH: frame.h,
        clickX: worldX,
        clickY: worldY,
        inBounds: inBounds
      });
      
      if (inBounds) {
        console.log('Player clicked!');
        this.onPlayerClicked();
      }
    }
    
    onPlayerClicked() {
      const now = Date.now();
      
      this.clickHistory.push(now);
      
      this.clickHistory = this.clickHistory.filter(
        time => now - time < this.clickWindow * 1000
      );
      
      console.log('Click count:', this.clickHistory.length);
      
      let pool;
      
      if (this.clickHistory.length > this.rapidClickThreshold) {
        pool = this.dialoguePools.rapid;
        console.log('Using rapid pool');
      } else {
        const rand = Math.random();
        
        if (rand < this.hiddenChance) {
          pool = this.dialoguePools.hidden;
          console.log('Using hidden pool');
        } else if (rand < this.hiddenChance + this.normalChance) {
          pool = this.dialoguePools.normal;
          console.log('Using normal pool');
        } else {
          pool = this.dialoguePools.cold;
          console.log('Using cold pool');
        }
      }
      
      const randomIndex = Math.floor(Math.random() * pool.length);
      this.currentText = pool[randomIndex];
      
      console.log('Selected text:', this.currentText);
      
      // Track player interaction for shop unlock
      if (this.game && this.game.shop) {
        this.game.shop.onPlayerInteraction();
        console.log('👤 Player clicked! Total interactions:', this.game.shop.playerInteractions);
      }
      
      // Play sound effect with 5 second cooldown
      if (this.game && this.game.audio) {
        if (now - this.lastSoundTime >= this.soundCooldown) {
          this.game.audio.playSFX('player_hum');
          this.lastSoundTime = now;
        }
      }
      
      this.show();
    }
    
    show() {
      this.isVisible = true;
      this.displayTimer = 0;
      this.animTimer = 0;
      this.animScale = 0;
      
      this.isTyping = true;
      this.displayedText = '';
      this.charIndex = 0;
      this.typeTimer = 0;
      
      console.log('Showing bubble with text:', this.currentText);
    }
    
    hide() {
      this.isVisible = false;
      this.currentText = '';
      this.displayedText = '';
      this.isTyping = false;
      console.log('Hiding bubble');
    }
    
    update(dt) {
      if (!this.isVisible) return;
      
      this.displayTimer += dt;
      
      if (this.isTyping) {
        this.typeTimer += dt;
        if (this.typeTimer >= this.typeSpeed) {
          this.typeTimer -= this.typeSpeed;
          
          if (this.charIndex < this.currentText.length) {
            this.charIndex++;
            this.displayedText = this.currentText.substring(0, this.charIndex);
          } else {
            this.isTyping = false;
          }
        }
      }
      
      if (!this.isTyping && this.displayTimer >= this.displayDuration) {
        this.hide();
        return;
      }
      
      this.animTimer += dt * 8;
      if (this.animScale < 1.0) {
        this.animScale = Math.min(1.0, this.animScale + dt * 5);
      }
    }
    
    draw(ctx) {
      if (!this.isVisible) return;
      
      const player = this.game.player;
      if (!player || !player.visible) return;
      
      const bubbleX = player.x + player.width / 2 + this.bubbleOffset.x;
      const bubbleY = player.y + this.bubbleOffset.y;
      
      ctx.save();
      
      const scale = this.animScale;
      
      const fadeStart = this.displayDuration - 0.5;
      if (!this.isTyping && this.displayTimer > fadeStart) {
        const fadeProgress = (this.displayTimer - fadeStart) / 0.5;
        ctx.globalAlpha = 1.0 - fadeProgress;
      }
      
      ctx.translate(bubbleX, bubbleY - this.bubbleHeight / 2);
      ctx.scale(scale, scale);
      ctx.translate(-bubbleX, -(bubbleY - this.bubbleHeight / 2));
      
      this.drawSpeechBubble(ctx, bubbleX, bubbleY);
      
      ctx.restore();
    }
    
    drawSpeechBubble(ctx, centerX, centerY) {
      const w = this.bubbleWidth;
      const h = this.bubbleHeight;
      const x = centerX - w / 2;
      const y = centerY - h;
      const cornerRadius = 6;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      this.roundRect(ctx, x + 2, y + 2, w, h, cornerRadius);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      this.roundRect(ctx, x, y, w, h, cornerRadius);
      ctx.fill();
      
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      const pointerSize = 6;
      const pointerX = centerX;
      const pointerY = y + h;
      
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(pointerX, pointerY + pointerSize);
      ctx.lineTo(pointerX - pointerSize, pointerY);
      ctx.lineTo(pointerX + pointerSize, pointerY);
      ctx.closePath();
      ctx.fill();
      
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pointerX - pointerSize, pointerY);
      ctx.lineTo(pointerX, pointerY + pointerSize);
      ctx.lineTo(pointerX + pointerSize, pointerY);
      ctx.stroke();
      
      ctx.fillStyle = '#333333';
      ctx.font = '12px "Microsoft YaHei", "SimHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const lines = this.wrapText(ctx, this.displayedText, w - this.bubblePadding * 2);
      const lineHeight = 15;
      const totalHeight = lines.length * lineHeight;
      const startY = y + h / 2 - totalHeight / 2 + lineHeight / 2;
      
      lines.forEach((line, index) => {
        ctx.fillText(line, centerX, startY + index * lineHeight);
      });
      
      if (this.isTyping && Math.floor(this.animTimer * 2) % 2 === 0) {
        const lastLine = lines[lines.length - 1] || '';
        const cursorX = centerX + ctx.measureText(lastLine).width / 2 + 2;
        const cursorY = startY + (lines.length - 1) * lineHeight;
        
        ctx.fillStyle = '#333333';
        ctx.fillRect(cursorX, cursorY - 5, 2, 10);
      }
    }
    
    roundRect(ctx, x, y, width, height, radius) {
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }
    
    wrapText(ctx, text, maxWidth) {
      const words = text.split('');
      const lines = [];
      let currentLine = '';
      
      for (let i = 0; i < words.length; i++) {
        const testLine = currentLine + words[i];
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && currentLine !== '') {
          lines.push(currentLine);
          currentLine = words[i];
        } else {
          currentLine = testLine;
        }
      }
      
      if (currentLine !== '') {
        lines.push(currentLine);
      }
      
      return lines;
    }
  }
  // 玩家对话选项系统，处理玩家选择的对话分支
