import { Animator } from './animator.js';

export class GermanShepherd {
  constructor(x, y, map) {
    this.x = x;
    this.y = y;
    this.map = map;
    
    // STANDARDIZED DIMENSIONS - 1x2 tile footprint (32x64)
    this.canvasWidth = 32;
    this.canvasHeight = 64;
    
    // Logical collision size (actual dog body)
    this.width = 32;
    this.height = 48;
    
    this.speed = 60;
    
    this.facingDirection = 'down';
    this.currentState = 'idle';
    
    this.wanderTimer = 0;
    this.wanderDuration = 0;
    this.targetDirection = null;
    this.idleDuration = 0;
    
    // Ground anchor shifted UP by 32 pixels (from Y=60 to Y=28)
    this.groundAnchorY = 28;
    this.renderOffsetX = 0;
    this.renderOffsetY = this.canvasHeight - this.height - 4;
    
    // Interaction System
    this.bubbleVisible = false;
    this.bubbleText = '';
    this.bubbleTimer = 0;
    this.bubbleDuration = 3.0;
    this.bubbleAnimTimer = 0;
    this.bubbleScale = 0;
    
    this.dialoguePool = [
      "ヾ(◍ °∇ °◍ )ﾉﾞ",
      "૮₍ ˊᯅˋ₎ა",
      "૮(=°o°)ა"
    ];
    
    // Typewriter effect
    this.isTyping = false;
    this.displayedText = '';
    this.charIndex = 0;
    this.typeSpeed = 0.08;
    this.typeTimer = 0;
    
    // Forced idle state
    this.forcedIdleTimer = 0;
    this.forcedIdleDuration = 0;
    
    this.sources = {
      // Walk Down - NEW ASSETS
      walk_down_1: 'https://static.wefun.ai/assets/2db2ce44-8156-4509-a9bd-57bfe9bc2f71.png',
      walk_down_2: 'https://static.wefun.ai/assets/e7f00868-45a0-4724-856b-b169aab76b01.png',
      walk_down_3: 'https://static.wefun.ai/assets/c30eb3ba-7e75-4bd6-815c-eaf1780d71a2.png',
      walk_down_4: 'https://static.wefun.ai/assets/39365deb-ef51-49a2-b38e-cc7d656fc2d0.png',
      
      // Walk Right - NEW ASSETS
      walk_right_1: 'https://static.wefun.ai/assets/86c359ea-1c59-469d-9f01-9fa6210d56c6.png',
      walk_right_2: 'https://static.wefun.ai/assets/880668df-cc95-4f1e-ba20-1182f2c90dbb.png',
      walk_right_3: 'https://static.wefun.ai/assets/9349a60e-086d-49a6-951c-083f8f374626.png',
      walk_right_4: 'https://static.wefun.ai/assets/0e25170a-b7d8-4ef7-bae5-181e8c17e790.png',
      
      // Walk Up
      walk_up_1: 'https://static.wefun.ai/assets/87531b66-0fe1-4046-b93a-48f970b22d2f.png',
      walk_up_2: 'https://static.wefun.ai/assets/e2bd2646-307c-4efa-9c26-d85e4d9727c9.png',
      walk_up_3: 'https://static.wefun.ai/assets/284f0ac4-6018-4332-8618-726408c02692.png',
      walk_up_4: 'https://static.wefun.ai/assets/c915e6a1-1af4-46d7-8ebf-c3aaa599c157.png',
      
      // Walk Left
      walk_left_1: 'https://static.wefun.ai/assets/6e1d09e7-efc0-4939-8ea0-aaf5d505d4b9.png',
      walk_left_2: 'https://static.wefun.ai/assets/0a4d7f71-eaf6-4704-9d05-d7babbaea65e.png',
      walk_left_3: 'https://static.wefun.ai/assets/0db3c168-b9dc-4179-b784-b55467da7bcf.png',
      walk_left_4: 'https://static.wefun.ai/assets/0cbb3c8b-7b9a-4225-8f81-8a15977ad963.png',
      
      // Idle Assets
      idle_down: 'https://static.wefun.ai/assets/f08a7fbd-d2c4-42a5-aec9-dc0be64aa571.png',
      idle_right: 'https://static.wefun.ai/assets/4c68ab6d-5dd5-469d-9adb-b53c7dbcce5a.png',
      idle_up: 'https://static.wefun.ai/assets/4aad5021-d5b6-4627-be1b-8273d7ead174.png',
      idle_left: 'https://static.wefun.ai/assets/414239e8-78d7-4771-b539-c1766f2e8314.png'
    };
    
    this.images = {};
    this.standardizedCanvases = {};
    this.isLoaded = false;
    this.animator = new Animator({});
    
    this.loadImages();
  }
  
  loadImages() {
    const keys = Object.keys(this.sources);
    let loadedCount = 0;
    
    keys.forEach(key => {
      const img = new Image();
      img.src = this.sources[key];
      img.onload = () => {
        this.images[key] = img;
        this.standardizedCanvases[key] = this.standardizeFrame(img, key);
        
        loadedCount++;
        if (loadedCount === keys.length) {
          this.onLoaded();
        }
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === keys.length) this.onLoaded();
      };
    });
  }
  
  standardizeFrame(sourceImage, frameKey) {
    const canvas = document.createElement('canvas');
    canvas.width = this.canvasWidth;
    canvas.height = this.canvasHeight;
    const ctx = canvas.getContext('2d');
    
    ctx.imageSmoothingEnabled = false;
    
    const isSideView = frameKey.includes('left') || frameKey.includes('right') || frameKey.includes('idle');
    
    const sourceRatio = sourceImage.width / sourceImage.height;
    let targetWidth, targetHeight;
    
    if (sourceRatio > (32 / 48)) {
      targetWidth = 32;
      targetHeight = Math.round(32 / sourceRatio);
    } else {
      targetHeight = 48;
      targetWidth = Math.round(48 * sourceRatio);
    }
    
    if (isSideView) {
      targetWidth = Math.round(targetWidth * 1.30);
      targetHeight = Math.round(targetHeight * 1.30);
      
      if (targetWidth > this.canvasWidth) {
        const scale = this.canvasWidth / targetWidth;
        targetWidth = this.canvasWidth;
        targetHeight = Math.round(targetHeight * scale);
      }
      if (targetHeight > 60) {
        const scale = 60 / targetHeight;
        targetHeight = 60;
        targetWidth = Math.round(targetWidth * scale);
      }
    }
    
    const headAlignmentY = this.canvasHeight - targetHeight - (this.canvasHeight - this.groundAnchorY);
    const drawX = Math.floor((this.canvasWidth - targetWidth) / 2);
    const drawY = headAlignmentY;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.01)';
    ctx.fillRect(0, 0, 1, 1);
    ctx.fillRect(this.canvasWidth - 1, 0, 1, 1);
    ctx.fillRect(0, this.canvasHeight - 1, 1, 1);
    ctx.fillRect(this.canvasWidth - 1, this.canvasHeight - 1, 1, 1);
    
    ctx.drawImage(sourceImage, drawX, drawY, targetWidth, targetHeight);
    
    return canvas;
  }
  
  onLoaded() {
    this.isLoaded = true;
    const animConfig = this.createAnimConfig();
    this.animator = new Animator(animConfig);
    this.setState('idle', 'down');
  }
  
  createAnimConfig() {
    const animConfig = {};
    
    const createWalkFrames = (prefix) => {
      const frames = [];
      for (let i = 1; i <= 4; i++) {
        const canvas = this.standardizedCanvases[`${prefix}_${i}`];
        if (canvas) {
          frames.push({ 
            x: 0, 
            y: 0, 
            w: this.canvasWidth, 
            h: this.canvasHeight, 
            image: canvas,
            useFullSource: true 
          });
        }
      }
      return frames;
    };
    
    const createIdleFrames = (direction) => {
      const canvas = this.standardizedCanvases[`idle_${direction}`];
      if (canvas) {
        const frames = [];
        for (let i = 0; i < 4; i++) {
          frames.push({ 
            x: 0, 
            y: 0, 
            w: this.canvasWidth, 
            h: this.canvasHeight, 
            image: canvas,
            useFullSource: true 
          });
        }
        return frames;
      }
      return [];
    };
    
    animConfig['walk_right'] = { frames: createWalkFrames('walk_right'), speed: 0.12, loop: true };
    animConfig['walk_left'] = { frames: createWalkFrames('walk_left'), speed: 0.12, loop: true };
    animConfig['walk_up'] = { frames: createWalkFrames('walk_up'), speed: 0.12, loop: true };
    animConfig['walk_down'] = { frames: createWalkFrames('walk_down'), speed: 0.12, loop: true };
    
    animConfig['idle_right'] = { frames: createIdleFrames('right'), speed: 0.3, loop: true };
    animConfig['idle_left'] = { frames: createIdleFrames('left'), speed: 0.3, loop: true };
    animConfig['idle_up'] = { frames: createIdleFrames('up'), speed: 0.3, loop: true };
    animConfig['idle_down'] = { frames: createIdleFrames('down'), speed: 0.3, loop: true };
    
    return animConfig;
  }
  
  setState(state, direction) {
    if (direction) {
      this.facingDirection = direction;
    }
    const animName = `${state}_${this.facingDirection}`;
    this.currentState = state;
    this.animator.play(animName);
  }
  
  checkClick(worldX, worldY, game) {
    const drawX = this.x - this.renderOffsetX;
    const drawY = this.y - this.renderOffsetY;
    
    const clickMargin = 16;
    
    const inBounds = worldX >= drawX - clickMargin && 
                     worldX <= drawX + this.canvasWidth + clickMargin &&
                     worldY >= drawY - clickMargin && 
                     worldY <= drawY + this.canvasHeight + clickMargin;
    
    if (inBounds) {
      this.onClicked(game);
      return true;
    }
    return false;
  }
  
  onClicked(game) {
    const randomIndex = Math.floor(Math.random() * this.dialoguePool.length);
    this.bubbleText = this.dialoguePool[randomIndex];
    
    this.showBubble();
    
    this.forcedIdleDuration = this.bubbleDuration + 0.5;
    this.forcedIdleTimer = 0;
    
    this.setState('idle', this.facingDirection);
    
    // Play dog bark sound
    if (game && game.audio) {
      game.audio.playSFX('dog_bark');
    }
    
    // Track dog interaction for shop unlock
    if (game && game.shop) {
      game.shop.onDogInteraction();
      console.log('🐕 Dog clicked! Total interactions:', game.shop.dogInteractions);
    }
  }
  
  showBubble() {
    this.bubbleVisible = true;
    this.bubbleTimer = 0;
    this.bubbleAnimTimer = 0;
    this.bubbleScale = 0;
    
    this.isTyping = true;
    this.displayedText = '';
    this.charIndex = 0;
    this.typeTimer = 0;
  }
  
  hideBubble() {
    this.bubbleVisible = false;
    this.bubbleText = '';
    this.displayedText = '';
    this.isTyping = false;
  }
  
  update(dt) {
    if (!this.isLoaded) return;
    
    this.animator.update(dt);
    
    if (this.bubbleVisible) {
      this.bubbleTimer += dt;
      
      if (this.isTyping) {
        this.typeTimer += dt;
        if (this.typeTimer >= this.typeSpeed) {
          this.typeTimer -= this.typeSpeed;
          
          if (this.charIndex < this.bubbleText.length) {
            this.charIndex++;
            this.displayedText = this.bubbleText.substring(0, this.charIndex);
          } else {
            this.isTyping = false;
          }
        }
      }
      
      if (!this.isTyping && this.bubbleTimer >= this.bubbleDuration) {
        this.hideBubble();
      }
      
      this.bubbleAnimTimer += dt * 8;
      if (this.bubbleScale < 1.0) {
        this.bubbleScale = Math.min(1.0, this.bubbleScale + dt * 5);
      }
    }
    
    if (this.forcedIdleTimer < this.forcedIdleDuration) {
      this.forcedIdleTimer += dt;
      return;
    }
    
    if (this.currentState === 'idle') {
      this.wanderTimer += dt;
      if (this.wanderTimer >= this.idleDuration) {
        this.startWandering();
      }
    } else if (this.currentState === 'walk') {
      this.wanderTimer += dt;
      
      const moveAmount = this.speed * dt;
      let dx = 0;
      let dy = 0;
      
      switch (this.targetDirection) {
        case 'up': dy = -moveAmount; break;
        case 'down': dy = moveAmount; break;
        case 'left': dx = -moveAmount; break;
        case 'right': dx = moveAmount; break;
      }
      
      const nextX = this.x + dx;
      const nextY = this.y + dy;
      
      if (this.canMoveTo(nextX, nextY)) {
        this.x = nextX;
        this.y = nextY;
      } else {
        this.startIdling();
        return;
      }
      
      if (this.wanderTimer >= this.wanderDuration) {
        this.startIdling();
      }
    }
  }
  
  startWandering() {
    const directions = ['up', 'down', 'left', 'right'];
    const validDirections = directions.filter(dir => {
      const testDist = 20;
      let testX = this.x;
      let testY = this.y;
      
      switch (dir) {
        case 'up': testY -= testDist; break;
        case 'down': testY += testDist; break;
        case 'left': testX -= testDist; break;
        case 'right': testX += testDist; break;
      }
      
      return this.canMoveTo(testX, testY);
    });
    
    if (validDirections.length === 0) {
      this.startIdling();
      return;
    }
    
    this.targetDirection = validDirections[Math.floor(Math.random() * validDirections.length)];
    this.wanderDuration = 1.5 + Math.random() * 2.5;
    this.wanderTimer = 0;
    this.setState('walk', this.targetDirection);
  }
  
  startIdling() {
    this.currentState = 'idle';
    this.idleDuration = 1 + Math.random() * 2;
    this.wanderTimer = 0;
    this.setState('idle', this.facingDirection);
  }
  
  canMoveTo(x, y) {
    const tileSize = 32;
    const pad = 5;
    
    if (x < 0 || y < 0 || x + this.width > this.map.width || y + this.height > this.map.height) {
      return false;
    }
    
    const corners = [
      { x: x + pad, y: y + pad + 8 },
      { x: x + this.width - pad, y: y + pad + 8 },
      { x: x + pad, y: y + this.height - pad },
      { x: x + this.width - pad, y: y + this.height - pad }
    ];
    
    for (const corner of corners) {
      const tileX = Math.floor(corner.x / tileSize);
      const tileY = Math.floor(corner.y / tileSize);
      if (this.map.isSolid(tileX, tileY)) return false;
    }
    
    const rect = { x, y, width: this.width, height: this.height };
    if (this.map.checkCollision(rect)) return false;
    
    return true;
  }
  
  draw(ctx) {
    if (!this.isLoaded) return;
    
    const frame = this.animator.getCurrentFrame();
    if (frame && frame.image) {
      const isSideView = this.facingDirection === 'left' || this.facingDirection === 'right';
      
      const shadowCenterX = Math.floor(this.x + this.width / 2);
      const shadowCenterY = Math.floor(this.y + this.height - 34);
      
      let shadowRadiusX, shadowRadiusY;
      if (isSideView) {
        shadowRadiusX = 10;
        shadowRadiusY = 3;
      } else {
        shadowRadiusX = 6;
        shadowRadiusY = 6;
      }
      
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(
        shadowCenterX,
        shadowCenterY,
        shadowRadiusX, 
        shadowRadiusY, 
        0, 0, Math.PI * 2
      );
      ctx.fill();
      
      const drawX = Math.floor(this.x - this.renderOffsetX);
      const drawY = Math.floor(this.y - this.renderOffsetY);
      
      ctx.drawImage(
        frame.image,
        drawX, 
        drawY, 
        this.canvasWidth, 
        this.canvasHeight
      );
    }
    
    if (this.bubbleVisible) {
      this.drawSpeechBubble(ctx);
    }
  }
  
  drawSpeechBubble(ctx) {
    const bubbleWidth = 100;
    const bubbleHeight = 40;
    
    const centerX = this.x + this.width / 2;
    const topY = this.y - this.renderOffsetY;
    
    const bubbleX = centerX - bubbleWidth / 2;
    const bubbleY = topY - bubbleHeight - 12;
    
    ctx.save();
    
    const scale = this.bubbleScale;
    
    const fadeStart = this.bubbleDuration - 0.5;
    if (!this.isTyping && this.bubbleTimer > fadeStart) {
      const fadeProgress = (this.bubbleTimer - fadeStart) / 0.5;
      ctx.globalAlpha = 1.0 - fadeProgress;
    }
    
    ctx.translate(bubbleX + bubbleWidth / 2, bubbleY + bubbleHeight / 2);
    ctx.scale(scale, scale);
    ctx.translate(-(bubbleX + bubbleWidth / 2), -(bubbleY + bubbleHeight / 2));
    
    const bobOffset = Math.floor(Math.sin(this.bubbleAnimTimer) * 2);
    const finalY = bubbleY + bobOffset;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    this.roundRect(ctx, bubbleX + 2, finalY + 2, bubbleWidth, bubbleHeight, 6);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    this.roundRect(ctx, bubbleX, finalY, bubbleWidth, bubbleHeight, 6);
    ctx.fill();
    
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    const pointerSize = 6;
    const pointerX = centerX;
    const pointerY = finalY + bubbleHeight;
    
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
    ctx.font = '16px "Arial", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.fillText(this.displayedText, centerX, finalY + bubbleHeight / 2);
    
    if (this.isTyping && Math.floor(this.bubbleAnimTimer * 2) % 2 === 0) {
      const textWidth = ctx.measureText(this.displayedText).width;
      const cursorX = centerX + textWidth / 2 + 2;
      const cursorY = finalY + bubbleHeight / 2;
      
      ctx.fillStyle = '#333333';
      ctx.fillRect(cursorX, cursorY - 8, 2, 16);
    }
    
    ctx.restore();
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
}
// 牧羊人系统，管理NPC牧羊人的行为和AI
