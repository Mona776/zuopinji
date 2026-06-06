import { InputHandler } from './input.js';
import { Player } from './player.js';
import { Camera } from './camera.js';
import { Map } from './map.js';
import { Editor } from './editor.js';
import { DialogueSystem } from './dialogue.js';
import { InteractionSystem } from './interaction.js';
import { FarmingSystem } from './farming.js';
import { GermanShepherd } from './shepherd.js';
import { PlayerDialogueSystem } from './player-dialogue.js';
import { AudioManager } from './audio.js';
import { InventorySystem } from './inventory.js';
import { ShopSystem } from './shop.js';
import { DecorationSystem } from './decoration.js';
import { DiarySystem } from './diary.js';
import { ParticleSystem } from './particles.js';
import { PIXEL_ICONS } from './assets.js';

export class Game {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    // Set tiled background pattern
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      gameContainer.style.backgroundImage = `url("${PIXEL_ICONS.backgroundTile}")`;
      gameContainer.style.backgroundRepeat = 'repeat';
      gameContainer.style.backgroundSize = '32px 32px';
      gameContainer.style.imageRendering = 'pixelated';
    }
    
    this.tileSize = 32;

    this.input = new InputHandler();
    this.map = new Map(this.tileSize);
    
    this.loadScene('outdoor', 5 * 32, 5 * 32);

    this.camera = new Camera(0, 0, this.map.width, this.map.height);
    
    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);
    this.resize();

    this.editor = new Editor(this);
    this.dialogue = new DialogueSystem(this);
    this.interaction = new InteractionSystem(this);
    this.farming = new FarmingSystem(this);
    this.playerDialogue = new PlayerDialogueSystem(this);
    this.audio = new AudioManager();
    
    // Set initial scene for BGM BEFORE setting up interaction listeners
    this.audio.currentScene = this.map.sceneType;
    console.log('🎵 Initial scene set to:', this.map.sceneType);
    
    // Now set up user interaction listeners (after currentScene is set)
    this.audio.init();
    
    // Try auto-play (works in some browsers)
    setTimeout(() => {
      this.audio.tryAutoPlay();
    }, 100);
    
    this.inventory = new InventorySystem(this);
    this.shop = new ShopSystem(this);
    this.decoration = new DecorationSystem(this);
    this.diary = new DiarySystem(this);
    this.particles = new ParticleSystem(this);
    
    // Window management - only one window open at a time
    this.setupWindowManagement();
    
    // Load saved game and start auto-save
    this.loadGame();
    this.startAutoSave();

    this.isPlayerSleeping = false;
    this.sleepingBed = null;

    this.lastTime = 0;
    
    // Secret code for Dev Mode
    this.secretCode = 'lovewefun';
    this.secretBuffer = '';
    this.devModeUnlocked = false;
    this.setupSecretCodeListener();
    
    this.uiSceneName = document.getElementById('scene-name');

    // Create side menu tabs container
    this.createSideMenuTabs();

    // Audio control button
    this.audioToggleBtn = document.getElementById('audio-toggle');
    if (this.audioToggleBtn) {
      this.audioToggleBtn.addEventListener('click', () => {
        const muted = this.audio.toggleMute();
        this.audioToggleBtn.textContent = muted ? '🔇' : '🔊';
        this.audioToggleBtn.classList.toggle('muted', muted);
      });
    }

    this.canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            
            const mouseX = (e.clientX - rect.left) * scaleX;
            const mouseY = (e.clientY - rect.top) * scaleY;
            
            const worldX = mouseX + Math.floor(this.camera.x);
            const worldY = mouseY + Math.floor(this.camera.y);

            if (this.editor.isVisible) return;

            if (this.shepherd && this.shepherd.checkClick(worldX, worldY, this)) return;

            if (this.interaction.checkClick(worldX, worldY)) return;

            this.farming.handleClick(worldX, worldY);
        }
    });
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.ctx.imageSmoothingEnabled = false;

    if (this.camera) {
      this.camera.width = this.canvas.width;
      this.camera.height = this.canvas.height;
    }
  }

  loadScene(sceneType, spawnX, spawnY) {
    this.map.generate(sceneType);
    
    if (this.player) {
      this.player.x = spawnX;
      this.player.y = spawnY;
    } else {
      this.player = new Player(spawnX, spawnY, this.tileSize);
    }
    
    if (this.camera) {
      this.camera.mapWidth = this.map.width;
      this.camera.mapHeight = this.map.height;
    }

    if (sceneType === 'outdoor') {
      const shepherdX = spawnX + 96;
      const shepherdY = spawnY + 64;
      this.shepherd = new GermanShepherd(shepherdX, shepherdY, this.map);
    } else {
      this.shepherd = null;
    }
    
    // Deactivate decoration mode when leaving indoor
    if (this.decoration && this.decoration.isActive && sceneType !== 'indoor') {
      this.decoration.deactivate();
    }
    
    // Give player default floor tiles when entering indoor scene
    if (sceneType === 'indoor' && this.decoration) {
      // Delay to ensure map is fully loaded
      setTimeout(() => {
        this.decoration.giveDefaultFloorTiles();
      }, 100);
    }

    if(this.uiSceneName) {
        this.uiSceneName.innerText = `Scene: ${sceneType === 'outdoor' ? 'Outdoor Farm' : 'Player House'}`;
    }

    // 播放对应场景的背景音乐
    if (this.audio) {
      this.audio.playBGM(sceneType);
    }
  }
  
  // Manage sidebar windows - only one open at a time
  setupWindowManagement() {
    // Store references to all manageable windows
    this.sidebarWindows = {
      inventory: this.inventory,
      shop: this.shop,
      decoration: this.decoration,
      diary: this.diary
    };
    
    // Override toggle methods to close other windows first
    const originalInventoryToggle = this.inventory.toggle.bind(this.inventory);
    this.inventory.toggle = () => {
      this.closeOtherWindows('inventory');
      originalInventoryToggle();
    };
    
    const originalShopToggle = this.shop.toggle.bind(this.shop);
    this.shop.toggle = () => {
      this.closeOtherWindows('shop');
      originalShopToggle();
    };
    
    const originalDecorationToggle = this.decoration.toggle.bind(this.decoration);
    this.decoration.toggle = () => {
      this.closeOtherWindows('decoration');
      originalDecorationToggle();
    };
    
    const originalDiaryToggle = this.diary.toggle.bind(this.diary);
    this.diary.toggle = () => {
      this.closeOtherWindows('diary');
      originalDiaryToggle();
    };
  }
  
  // Close all sidebar windows except the one being opened
  closeOtherWindows(exceptWindow) {
    if (exceptWindow !== 'inventory' && this.inventory.isOpen) {
      this.inventory.close();
    }
    if (exceptWindow !== 'shop' && this.shop.isOpen) {
      this.shop.close();
    }
    if (exceptWindow !== 'decoration' && this.decoration.isActive) {
      this.decoration.deactivate();
    }
    if (exceptWindow !== 'diary' && this.diary.isOpen) {
      this.diary.close();
    }
  }
  
  setupSecretCodeListener() {
    // Hide Dev Mode editor UI initially
    if (this.editor && this.editor.container) {
      this.editor.container.style.display = 'none';
    }
    
    document.addEventListener('keydown', (e) => {
      // Only listen for letters
      if (e.key.length === 1 && /[a-z]/i.test(e.key)) {
        this.secretBuffer += e.key.toLowerCase();
        
        // Keep buffer size limited
        if (this.secretBuffer.length > this.secretCode.length) {
          this.secretBuffer = this.secretBuffer.slice(-this.secretCode.length);
        }
        
        // Check if secret code is entered
        if (this.secretBuffer === this.secretCode && !this.devModeUnlocked) {
          this.unlockDevMode();
        }
      }
    });
  }
  
  unlockDevMode() {
    this.devModeUnlocked = true;
    this.showCenterNotification('🔓 Dev Mode Unlocked!');
    this.audio.playSFX('unlock');
    
    // Toggle editor visibility
    if (this.editor) {
      this.editor.toggle();
    }
  }

  start() {
    requestAnimationFrame((ts) => {
      this.lastTime = ts;
      this.loop(ts);
    });
  }

  loop(timestamp) {
    const deltaTime = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    const safeDt = Math.min(deltaTime, 0.1);

    this.update(safeDt);
    this.draw();

    this.input.update();

    requestAnimationFrame((ts) => this.loop(ts));
  }

  update(dt) {
    // 更新音频系统
    this.audio.update(dt);
    
    // Block all game input when diary is being edited
    if (this.diary && this.diary.isBlockingInput()) {
        this.map.update(dt);
        if (this.shepherd) this.shepherd.update(dt);
        this.playerDialogue.update(dt);
        return;
    }
    
    if (this.dialogue.isActive) {
        this.dialogue.update(dt, this.input);
        
        this.map.update(dt);
        if (this.shepherd) this.shepherd.update(dt);
        this.playerDialogue.update(dt);
        return; 
    }

    if (this.isPlayerSleeping) {
        if (this.input.isDown('w') || this.input.isDown('a') || 
            this.input.isDown('s') || this.input.isDown('d') || 
            this.input.isDown('arrowup') || this.input.isDown('arrowleft') ||
            this.input.isDown('arrowdown') || this.input.isDown('arrowright')) {
            
            this.wakeUp();
        }
    } else {
        // 记录玩家位置用于检测移动
        const prevX = this.player.x;
        const prevY = this.player.y;
        
        this.player.update(this.input, dt, this.map);
        
        // 检测玩家是否在移动，播放走路音效
        const isMoving = (this.player.x !== prevX || this.player.y !== prevY);
        if (isMoving) {
            this.audio.playWalkSound();
        }
        
        this.farming.handleInput(this.input);
    }

    this.camera.follow(this.player);

    this.map.update(dt);
    if (this.shepherd) this.shepherd.update(dt);
    
    this.farming.update(dt);
    this.playerDialogue.update(dt);
    this.particles.update(dt);
    
    if (!this.isPlayerSleeping) {
        this.interaction.update(dt);
    }
    
    if (!this.isPlayerSleeping) {
        const trigger = this.map.checkTriggers(this.player);
        if (trigger) {
            this.dialogue.show(trigger.message, trigger.portrait);
            this.player.setState(this.player.currentState.replace('walk', 'idle'), this.player.facingDirection);
        }

        const portal = this.map.checkPortal(this.player);
        if (portal) {
          this.audio.playSFX('portal');
          const sx = portal.spawnX * this.tileSize;
          const sy = portal.spawnY * this.tileSize;
          this.loadScene(portal.targetScene, sx, sy);
        }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.translate(-Math.floor(this.camera.x), -Math.floor(this.camera.y));

    this.map.draw(this.ctx, this.camera, this.player, this.shepherd);

    if (!this.isPlayerSleeping) {
        this.interaction.draw(this.ctx);
    }

    this.playerDialogue.draw(this.ctx);

    this.particles.draw(this.ctx);

    this.decoration.draw(this.ctx);

    this.editor.draw(this.ctx);

    this.ctx.restore();
  }

  startSleep(bedEntity) {
      if (this.isPlayerSleeping) return;

      this.isPlayerSleeping = true;
      this.sleepingBed = bedEntity;
      
      bedEntity.id = 203;

      this.player.visible = false;

      this.interaction.isVisible = false;
      this.interaction.activeEntity = null;

      this.dialogue.show("Zzz... (Press WASD to wake up)", "default", "Flora");
  }

  wakeUp() {
      if (!this.isPlayerSleeping || !this.sleepingBed) return;

      this.isPlayerSleeping = false;
      
      this.sleepingBed.id = 200;

      this.player.visible = true;

      // Wake up at the BOTTOM-LEFT corner of the bed
      this.player.x = this.sleepingBed.x - 48; // 1 tile more to the left
      this.player.y = this.sleepingBed.y + 80; // 1 tile more below

      this.sleepingBed = null;

      // Award crystals for sleeping
      const sleepReward = 5;
      if (this.inventory) {
        this.inventory.addCrystals(sleepReward);
        this.showCenterNotification(`💎 +${sleepReward} crystals for a good rest!`);
        this.audio.playSFX('coins');
      }

      this.dialogue.show("Good morning! Feeling refreshed~", "default", "Flora");
  }

  // Show center screen notification
  showCenterNotification(message) {
    // Create or get notification container
    let notifContainer = document.getElementById('center-notification');
    if (!notifContainer) {
      notifContainer = document.createElement('div');
      notifContainer.id = 'center-notification';
      document.getElementById('game-container').appendChild(notifContainer);
    }
    
    // Create notification element
    const notif = document.createElement('div');
    notif.className = 'center-notif-item';
    notif.textContent = message;
    notifContainer.appendChild(notif);
    
    // Animate in
    requestAnimationFrame(() => {
      notif.classList.add('show');
    });
    
    // Remove after delay
    setTimeout(() => {
      notif.classList.add('fade-out');
      setTimeout(() => {
        notif.remove();
      }, 500);
    }, 3000);
  }
  
  // ========== SAVE/LOAD SYSTEM ==========
  
  // Save all game data
  saveGame() {
    try {
      // Save game state
      const gameData = {
        version: 1,
        timestamp: Date.now(),
        player: {
          x: this.player.x,
          y: this.player.y,
          currentState: this.player.currentState,
          facingDirection: this.player.facingDirection
        },
        currentScene: this.map.sceneType,
        
        // Interaction states
        activeTVs: [...(this.interaction?.activeTVs || [])],
        activeLamps: [...(this.interaction?.activeLamps || [])]
      };
      
      localStorage.setItem('pixel_farm_game', JSON.stringify(gameData));
      
      // Save subsystem data
      if (this.inventory) this.inventory.saveData();
      if (this.shop) this.shop.saveData();
      
      // Save current map state
      this.map.saveToStorage();
      
      console.log('💾 Game saved successfully');
      return true;
    } catch (e) {
      console.error('Failed to save game:', e);
      return false;
    }
  }
  
  // Load game data
  loadGame() {
    try {
      const stored = localStorage.getItem('pixel_farm_game');
      if (stored) {
        const data = JSON.parse(stored);
        
        // Restore interaction states
        if (data.activeTVs && this.interaction) {
          this.interaction.activeTVs = new Set(data.activeTVs);
        }
        if (data.activeLamps && this.interaction) {
          this.interaction.activeLamps = new Set(data.activeLamps);
        }
        
        // Load scene if different (and restore player position)
        if (data.currentScene && data.currentScene !== this.map.sceneType) {
          this.loadScene(data.currentScene, data.player?.x, data.player?.y);
        } else if (data.player) {
          this.player.x = data.player.x;
          this.player.y = data.player.y;
          if (data.player.currentState) {
            this.player.setState(data.player.currentState, data.player.facingDirection || 'down');
          }
        }
        
        console.log('💾 Game loaded from save');
        return true;
      }
    } catch (e) {
      console.error('Failed to load game:', e);
    }
    return false;
  }
  
  // Auto-save every 30 seconds
  startAutoSave() {
    this.autoSaveInterval = setInterval(() => {
      this.saveGame();
    }, 30000); // 30 seconds
    
    // Also save when page is about to close
    window.addEventListener('beforeunload', () => {
      this.saveGame();
    });
    
    // Save when visibility changes (tab switch)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.saveGame();
      }
    });
  }
  
  // Manual save with notification
  manualSave() {
    if (this.saveGame()) {
      this.showCenterNotification('💾 Game saved!');
      this.audio.playSFX('ui_click');
    } else {
      this.showCenterNotification('⚠️ Save failed!');
    }
  }
  
  // Clear all save data
  clearSaveData() {
    const keys = [
      'pixel_farm_game',
      'pixel_farm_inventory',
      'pixel_farm_shop',
      'pixel_farm_diary',
      'pixel_farm_diary_unread',
      'pixel_farm_diary_pending',
      'pixel_farm_map_outdoor',
      'pixel_farm_map_indoor'
    ];
    
    keys.forEach(key => localStorage.removeItem(key));
    console.log('🗑️ All save data cleared');
  }

  createSideMenuTabs() {
    // Create container for side menu tabs
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'side-menu-tabs';
    
    // Move existing buttons into the container
    const audioBtn = document.getElementById('audio-toggle');
    const inventoryBtn = document.getElementById('inventory-toggle');
    const shopBtn = document.getElementById('shop-toggle');
    const decorationBtn = document.getElementById('decoration-toggle');
    const diaryBtn = document.getElementById('diary-toggle');
    
    if (audioBtn) tabsContainer.appendChild(audioBtn);
    if (inventoryBtn) tabsContainer.appendChild(inventoryBtn);
    if (shopBtn) tabsContainer.appendChild(shopBtn);
    if (decorationBtn) tabsContainer.appendChild(decorationBtn);
    if (diaryBtn) tabsContainer.appendChild(diaryBtn);
    
    document.getElementById('game-container').appendChild(tabsContainer);
  }
}
// 游戏核心逻辑，管理游戏状态和主循环
