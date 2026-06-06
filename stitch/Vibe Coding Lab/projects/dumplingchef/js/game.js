import { CONFIG, COLORS } from './config.js';
import { Input } from './input.js';
import { Map } from './map.js';
import { Player } from './player.js';
import { OrderManager } from './order.js';
import { soundManager } from './sound.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.input = new Input();
    this.map = new Map();

    this.isTwoPlayer = false;
    this.players = [];
    this.initPlayers();

    this.score = 0;
    this.gameTime = CONFIG.GAME_TIME_LIMIT;
    this.dirtyPlateTimers = [];
    this.orderManager = new OrderManager();
    this.players.forEach(p => p.orderManager = this.orderManager);
    this.camera = {
      x: CONFIG.MAP_WIDTH / 2,
      y: CONFIG.MAP_HEIGHT / 2,
      zoom: 1
    };

    this.gameOver = false;
    this.dishesServed = 0;
    this.tipsEarned = 0;

    // 游戏状态机
    this.STATE_MENU = 'menu';
    this.STATE_RECIPE = 'recipe';
    this.STATE_COUNTDOWN = 'countdown';
    this.STATE_PLAYING = 'playing';
    this.STATE_GAMEOVER = 'gameover';
    this.gameState = this.STATE_MENU;

    // 状态相关变量
    this.menuTimer = 0;
    this.menuShakeTimer = 0;
    this.menuFloatingItems = [];
    this.menuSteamParticles = [];
    this.initMenuDecorations();

    this.recipeTimer = 0;
    this.recipePageState = 'cover'; // 'cover', 'flipping', 'content'
    this.recipeFlipProgress = 0;

    this.countdownTimer = 3;
    this.countdownPulse = 0;

    // 结算画面变量
    this.gameOverTimer = 0;
    this.gameOverPhase = 'timesup'; // 'timesup', 'ledger', 'tally', 'stamp', 'restart'
    this.displayScore = 0;
    this.tallySpeed = 0;
    this.stampScale = 2.0;
    this.stampDropped = false;
    this.gameOverParticles = [];
    this.abacusTickTimer = 0;

    // 切菜粒子系统
    this.choppingParticles = [];
    this.particleSpawnTimer = 0;

    // 洗碗水花粒子系统
    this.washingParticles = [];
    this.washParticleTimer = 0;

    // 加载工作站装饰物素材
    this.stationSprites = {};
    this.loadStationSprites();

    // 加载食物素材
    this.foodSprites = {};
    this.loadFoodSprites();

    // 加载书本素材
    this.bookSprites = {};
    this.loadBookSprites();

    // 加载菜单背景图
    this.menuBgImg = new Image();
    this.menuBgImg.src = 'https://raw.githubusercontent.com/Mona776/dumplingschef_assets/main/assets/menu_bg.png';

    // 模式选择
    this.menuMode = 'single'; // 'single' or 'two'
    
    // 菜单交互
    this.menuDumplingClicked = false;
    this.canvas.addEventListener('click', (e) => {
      if (this.gameState !== this.STATE_MENU) return;
      const rect = this.canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);
      
      // 检查模式选择点击
      const btnW = 200;
      const btnH = 50;
      const btnY = this.canvas.height * 0.75;
      
      // Single Player 按钮
      if (mx >= this.canvas.width/2 - btnW - 20 && mx <= this.canvas.width/2 - 20 &&
          my >= btnY && my <= btnY + btnH) {
        this.menuMode = 'single';
        soundManager.playPop(true);
        return;
      }
      
      // Two Players 按钮
      if (mx >= this.canvas.width/2 + 20 && mx <= this.canvas.width/2 + btnW + 20 &&
          my >= btnY && my <= btnY + btnH) {
        this.menuMode = 'two';
        soundManager.playPop(true);
        return;
      }

      // 饺子中心位置
      const dumpX = this.canvas.width / 2;
      const dumpY = this.canvas.height * 0.65;
      const dumpR = 110;
      const dx = mx - dumpX, dy = my - dumpY;
      if (dx * dx + dy * dy <= dumpR * dumpR) {
        this.menuDumplingClicked = true;
      }
    });

    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.lastTime = 0;
    this.bubbleTimer = 0;
    requestAnimationFrame((t) => this.loop(t));
  }

  initPlayers() {
    this.players = [];
    const spawnX = 6.5 * CONFIG.TILE_SIZE;
    const spawnY = 7.5 * CONFIG.TILE_SIZE;
    
    // Player 1 (Pink)
    const p1 = new Player(spawnX, spawnY, '#e91e63', 1);
    p1.onScore = (pts) => this.addScore(pts);
    p1.onDelivery = () => this.scheduleDirtyPlate();
    this.players.push(p1);
    this.player = p1; // Keep reference for single player compatibility

    // Player 2 (Blue) - only if mode selected
    if (this.isTwoPlayer) {
      const p2 = new Player(spawnX + 40, spawnY, '#2196f3', 2);
      p2.onScore = (pts) => this.addScore(pts);
      p2.onDelivery = () => this.scheduleDirtyPlate();
      this.players.push(p2);
      this.player2 = p2;
    } else {
      this.player2 = null;
    }
    
    if (this.foodSprites) {
      this.players.forEach(p => p.setFoodSprites(this.foodSprites));
    }
    if (this.orderManager) {
      this.players.forEach(p => p.orderManager = this.orderManager);
    }
  }

  initMenuDecorations() {
    // 初始化漂浮物品（饺子和菜刀）
    for (let i = 0; i < 8; i++) {
      this.menuFloatingItems.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        type: Math.random() > 0.5 ? 'dumpling' : 'knife',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.5,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        size: 30 + Math.random() * 20,
        opacity: 0.15 + Math.random() * 0.15
      });
    }

    // 初始化蒸汽粒子
    for (let i = 0; i < 20; i++) {
      this.menuSteamParticles.push({
        x: Math.random() * this.canvas.width,
        y: this.canvas.height + Math.random() * 100,
        vx: (Math.random() - 0.5) * 10,
        vy: -30 - Math.random() * 30,
        size: 10 + Math.random() * 15,
        opacity: 0.3 + Math.random() * 0.3,
        life: 1
      });
    }
  }

  loadStationSprites() {
    const spriteNames = {
      'chopping_board': 'https://raw.githubusercontent.com/Mona776/dumplingschef_assets/main/assets/chopping_board.png',  // 切菜板
      'flour_bag': 'https://raw.githubusercontent.com/Mona776/dumplingschef_assets/main/assets/flour_bag.png',            // 面粉袋
      'meat_box': 'https://raw.githubusercontent.com/Mona776/dumplingschef_assets/main/assets/meat_box.png',              // 肉箱
      'veggie_box': 'https://raw.githubusercontent.com/Mona776/dumplingschef_assets/main/assets/veggie_box.png',          // 蔬菜箱
      'mixer': 'https://raw.githubusercontent.com/Mona776/dumplingschef_assets/main/assets/mixer.png'                     // 搅拌机
    };

    for (const [name, path] of Object.entries(spriteNames)) {
      const img = new Image();
      img.src = path;
      this.stationSprites[name] = img;
    }
  }

  loadBookSprites() {
    const bookNames = {
      'cover': 'https://raw.githubusercontent.com/Mona776/dumplingschef_assets/main/assets/book_cover.png',   // 书本封面
      'page': 'https://raw.githubusercontent.com/Mona776/dumplingschef_assets/main/assets/book_page.png'      // 书本内页
    };

    for (const [name, path] of Object.entries(bookNames)) {
      const img = new Image();
      img.src = path;
      this.bookSprites[name] = img;
    }
  }

  loadFoodSprites() {
    const foodNames = {
      'pork': 'https://raw.githubusercontent.com/Mona776/dumplingschef_assets/main/assets/pork.png',
      'minced_pork': 'https://raw.githubusercontent.com/Mona776/dumplingschef_assets/main/assets/minced_pork.png',
      'cabbage': 'https://raw.githubusercontent.com/Mona776/dumplingschef_assets/main/assets/cabbage.png',
      'chopped_cabbage': 'https://raw.githubusercontent.com/Mona776/dumplingschef_assets/main/assets/chopped_cabbage.png',
      'flour_raw': 'https://raw.githubusercontent.com/Mona776/dumplingschef_assets/main/assets/flour_raw.png',
      'dough': 'https://raw.githubusercontent.com/Mona776/dumplingschef_assets/main/assets/dough.png',
      'wrapper': 'https://raw.githubusercontent.com/Mona776/dumplingschef_assets/main/assets/wrapper.png',
      'raw_pork_dumpling': 'https://raw.githubusercontent.com/Mona776/dumplingschef_assets/main/assets/raw_pork_dumpling.png',
      'raw_veggie_dumpling': 'https://raw.githubusercontent.com/Mona776/dumplingschef_assets/main/assets/raw_veggie_dumpling.png',
      'raw_combo_dumpling': 'https://raw.githubusercontent.com/Mona776/dumplingschef_assets/main/assets/raw_combo_dumpling.png',
      'cooking_dumpling': 'https://raw.githubusercontent.com/Mona776/dumplingschef_assets/main/assets/cooking_dumpling.png',
      'plated_pork_dumpling': 'https://raw.githubusercontent.com/Mona776/dumplingschef_assets/main/assets/plated_pork_dumpling.png',
      'plated_veggie_dumpling': 'https://raw.githubusercontent.com/Mona776/dumplingschef_assets/main/assets/plated_veggie_dumpling.png',
      'plated_combo_dumpling': 'https://raw.githubusercontent.com/Mona776/dumplingschef_assets/main/assets/plated_combo_dumpling.png',
      'plate': 'https://raw.githubusercontent.com/Mona776/dumplingschef_assets/main/assets/plate.png',
      'dirty_plate': 'https://raw.githubusercontent.com/Mona776/dumplingschef_assets/main/assets/dirty_plate.png',
      'burnt_trash': 'https://raw.githubusercontent.com/Mona776/dumplingschef_assets/main/assets/burnt_trash.png'
    };

    for (const [name, path] of Object.entries(foodNames)) {
      const img = new Image();
      img.src = path;
      this.foodSprites[name] = img;
    }

    // 传递给 Player
    this.players.forEach(p => p.setFoodSprites(this.foodSprites));
  }

  // ========== 状态更新方法 ==========
  updateMenu(dt) {
    this.menuTimer += dt;

    // 更新漂浮物品
    this.menuFloatingItems.forEach(item => {
      item.x += item.vx * dt;
      item.y += item.vy * dt;
      item.rotation += item.rotationSpeed * dt;

      // 边界反弹
      if (item.x < -50) item.x = this.canvas.width + 50;
      if (item.x > this.canvas.width + 50) item.x = -50;
      if (item.y < -50) item.y = this.canvas.height + 50;
      if (item.y > this.canvas.height + 50) item.y = -50;
    });

    // 更新蒸汽粒子
    this.menuSteamParticles.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt * 0.3;
      p.opacity = p.life * 0.5;

      // 重生
      if (p.life <= 0) {
        p.x = Math.random() * this.canvas.width;
        p.y = this.canvas.height + 20;
        p.vx = (Math.random() - 0.5) * 10;
        p.vy = -30 - Math.random() * 30;
        p.life = 1;
        p.opacity = 0.3 + Math.random() * 0.3;
      }
    });

    // 检测空格键或点击饺子
    if (this.input.keys['Space'] || this.menuDumplingClicked) {
      this.menuDumplingClicked = false;
      this.isTwoPlayer = (this.menuMode === 'two');
      this.input.isSinglePlayerMode = !this.isTwoPlayer; // 同步输入模式

      // 根据人数设置游戏时长：单人 5 分钟 (300s)，双人 3 分钟 (180s)
      this.gameTime = this.isTwoPlayer ? CONFIG.GAME_TIME_LIMIT : 300.0;

      this.initPlayers(); // 根据模式重新初始化玩家
      this.gameState = this.STATE_RECIPE;
      soundManager.playGong(); // 锣声
      this.menuShakeTimer = 0.3; // 震动持续0.3秒
      this.input.keys['Space'] = false;
    }
  }

  updateRecipe(dt) {
    this.recipeTimer += dt;

    // 自动翻书动画
    if (this.recipePageState === 'cover') {
      if (this.recipeTimer > 0.8) {
        this.recipePageState = 'flipping';
        soundManager.playPageFlip();
      }
    } else if (this.recipePageState === 'flipping') {
      // 翻页速度：使用缓动效果让动画更流畅
      const rawProgress = this.recipeFlipProgress + dt * 2; // 约 0.5 秒完成

      // 使用 easeInOutCubic 缓动函数
      if (rawProgress < 1) {
        this.recipeFlipProgress = rawProgress;
      } else {
        this.recipeFlipProgress = 1;
        this.recipePageState = 'content';
      }
    }

    // 检测空格键
    if (this.recipePageState === 'content' && this.input.keys['Space']) {
      soundManager.playThump(); // 书本合上
      this.gameState = this.STATE_COUNTDOWN;
      this.countdownTimer = 3;
      this.input.keys['Space'] = false;
    }
  }

  updateCountdown(dt) {
    this.countdownTimer -= dt;
    this.countdownPulse = (this.countdownTimer % 1);

    // 每秒播放滴声
    const currentSecond = Math.ceil(this.countdownTimer);
    const prevSecond = Math.ceil(this.countdownTimer + dt);
    if (currentSecond < prevSecond && currentSecond > 0) {
      soundManager.playTick();
    }

    if (this.countdownTimer <= 0) {
      this.gameState = this.STATE_PLAYING;
      soundManager.playWhistle(); // 开赛大锣
      // 切换BGM: 氛围 → 战斗
      soundManager.stopAmbientBGM();
      soundManager.startActionBGM();
    }
  }

  updateGameOver(dt) {
    this.gameOverTimer += dt;

    if (this.gameOverPhase === 'timesup') {
      // "打烊" 文字显示 1.5 秒
      if (this.gameOverTimer > 1.5) {
        this.gameOverPhase = 'ledger';
        this.gameOverTimer = 0;
      }
    } else if (this.gameOverPhase === 'ledger') {
      // 账本展开动画 0.5 秒
      if (this.gameOverTimer > 0.5) {
        this.gameOverPhase = 'tally';
        this.gameOverTimer = 0;
        this.displayScore = 0;
        this.tallySpeed = Math.max(this.score * 0.8, 50); // 每秒增加的数值
      }
    } else if (this.gameOverPhase === 'tally') {
      // 数字滚动
      if (this.displayScore < this.score) {
        this.displayScore += this.tallySpeed * dt;

        // 算盘拨动声
        this.abacusTickTimer += dt;
        if (this.abacusTickTimer > 0.06) {
          soundManager.playAbacusTick();
          this.abacusTickTimer = 0;
        }

        // 加速
        this.tallySpeed *= 1 + dt * 2;

        if (this.displayScore >= this.score) {
          this.displayScore = this.score;
          this.gameOverPhase = 'stamp_wait';
          this.gameOverTimer = 0;
        }
      }
    } else if (this.gameOverPhase === 'stamp_wait') {
      // 等待 0.5 秒后盖章
      if (this.gameOverTimer > 0.5) {
        this.gameOverPhase = 'stamp';
        this.gameOverTimer = 0;
        this.stampScale = 2.5;
        soundManager.playStamp();

        // 三星额外效果
        if (this.score >= 350) {
          setTimeout(() => {
            soundManager.playCelebration();
          }, 200);
        }
      }
    } else if (this.gameOverPhase === 'stamp') {
      // 盖章缩小动画
      if (this.stampScale > 1) {
        this.stampScale -= dt * 12;
        if (this.stampScale <= 1) {
          this.stampScale = 1;
          this.stampDropped = true;
        }
      }

      // 盖章完成后等一下进入重开阶段
      if (this.stampDropped && this.gameOverTimer > 0.8) {
        this.gameOverPhase = 'restart';
        this.gameOverTimer = 0;

        // 三星金色粒子
        if (this.score >= 350) {
          for (let i = 0; i < 30; i++) {
            this.gameOverParticles.push({
              x: this.canvas.width / 2 + (Math.random() - 0.5) * 300,
              y: this.canvas.height / 2 + (Math.random() - 0.5) * 200,
              vx: (Math.random() - 0.5) * 200,
              vy: -100 - Math.random() * 150,
              size: 4 + Math.random() * 6,
              life: 1,
              color: Math.random() > 0.5 ? '#FFD700' : '#FFA000'
            });
          }
        }
      }
    } else if (this.gameOverPhase === 'restart') {
      // 更新粒子
      this.gameOverParticles.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 200 * dt; // 重力
        p.life -= dt * 0.5;
      });
      this.gameOverParticles = this.gameOverParticles.filter(p => p.life > 0);

      // 监听空格键或 E 键重开
      if (this.input.keys['Space'] || this.input.keys['KeyE'] || this.input.wasShortPress('Space') || this.input.wasShortPress('KeyE')) {
        this.restartGame();
        this.input.keys['Space'] = false;
        this.input.keys['KeyE'] = false;
        if (this.input.justPressed) this.input.justPressed['Space'] = false;
        if (this.input.justPressed) this.input.justPressed['KeyE'] = false;
      }
    }
  }

  restartGame() {
    // 重置游戏变量
    this.score = 0;
    this.gameTime = this.isTwoPlayer ? CONFIG.GAME_TIME_LIMIT : 300.0;
    this.gameOver = false;
    this.dishesServed = 0;
    this.tipsEarned = 0;

    // 重置玩家
    this.initPlayers();

    // 重置地图上的物品
    for (let r = 0; r < this.map.rows; r++) {
      for (let c = 0; c < this.map.cols; c++) {
        const station = this.map.grid[r][c];
        if (station) {
          if (station.type === 'stove' || station.type === 'counter' ||
            station.type === 'mixer' || station.type === 'dirty_return') {
            station.item = null;
          }
          if (station.type === 'sink') {
            station.dirtyPlates = [];
            station.washProgress = 0;
          }
          if (station.type === 'mixer') {
            station.mixProgress = 0;
          }
          if (station.type === 'plate') {
            station.cleanPlates = CONFIG.MAX_CLEAN_PLATES;
            station.item = null;
          }
        }
      }
    }

    // 重置订单
    this.orderManager = new OrderManager();
    this.players.forEach(p => p.orderManager = this.orderManager);

    // 重置粒子和计时器
    this.choppingParticles = [];
    this.washingParticles = [];
    this.dirtyPlateTimers = [];
    this.scoreEffects = [];

    // 重置结算变量
    this.gameOverTimer = 0;
    this.gameOverPhase = 'timesup';
    this.displayScore = 0;
    this.gameOverParticles = [];

    // 跳过菜谱，直接进入倒计时
    this.gameState = this.STATE_COUNTDOWN;
    this.countdownTimer = 3;
  }

  addScore(pts) {
    this.score += pts;
    this.dishesServed++;
    // 上菜得分时播放硬币音效
    if (pts > 0) {
      soundManager.playCoin();
    }
    const bonus = pts - CONFIG.SCORE_PER_ORDER;
    if (bonus > 0) {
      this.tipsEarned += bonus;
    }
  }

  scheduleDirtyPlate() {
    this.dirtyPlateTimers.push(CONFIG.DIRTY_PLATE_DELAY);
  }

  spawnDirtyPlate() {
    for (let r = 0; r < this.map.rows; r++) {
      for (let c = 0; c < this.map.cols; c++) {
        const s = this.map.grid[r][c];
        if (s && s.type === 'dirty_return') {
          if (!s.item) {
            s.item = { type: 'dirty_plate', progress: 0, stackCount: 1 };
            return;
          } else if (s.item.type === 'dirty_plate') {
            // Stack up to 5 plates
            if (s.item.stackCount < 5) {
              s.item.stackCount++;
            }
            return;
          }
        }
      }
    }
    // Fallback: spawn on counter
    for (let r = 0; r < this.map.rows; r++) {
      for (let c = 0; c < this.map.cols; c++) {
        const s = this.map.grid[r][c];
        if (s && s.type === 'counter' && !s.item && c >= 7) {
          s.item = { type: 'dirty_plate', progress: 0, stackCount: 1 };
          return;
        }
      }
    }
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    const gameAreaWidth = this.canvas.width - (CONFIG.SIDEBAR_WIDTH * 2);
    const zoomX = gameAreaWidth / CONFIG.MAP_WIDTH;
    const zoomY = this.canvas.height / CONFIG.MAP_HEIGHT;
    this.camera.zoom = Math.min(zoomX, zoomY) * 0.95;
  }

  update(dt) {
    if (dt > 0.1) dt = 0.1;

    // 初始化音频系统（需要用户交互后）
    if (!soundManager.initialized && (this.input.anyKeyPressed || this.input.actionPressed)) {
      soundManager.init();
      // 初始化后立刻启动氛围BGM（菜单/菜谱/结算）
      if (this.gameState !== this.STATE_PLAYING) {
        soundManager.startAmbientBGM();
      }
    }

    // 根据游戏状态调用不同的更新逻辑
    if (this.gameState === this.STATE_MENU) {
      this.updateMenu(dt);
      return;
    } else if (this.gameState === this.STATE_RECIPE) {
      this.updateRecipe(dt);
      return;
    } else if (this.gameState === this.STATE_COUNTDOWN) {
      this.updateCountdown(dt);
      return;
    } else if (this.gameState === this.STATE_GAMEOVER) {
      this.updateGameOver(dt);
      return;
    }

    // STATE_PLAYING - 正常游戏逻辑
    this.gameTime -= dt;
    if (this.gameTime <= 0) {
      this.gameTime = 0;
      // 切换到结算状态
      this.gameState = this.STATE_GAMEOVER;
      this.gameOverTimer = 0;
      this.gameOverPhase = 'timesup';
      this.displayScore = 0;
      this.stampScale = 2.0;
      this.stampDropped = false;
      this.gameOverParticles = [];
      // 停止所有持续音效并播放结束锣声
      soundManager.stopSizzle();
      soundManager.stopWarning();
      soundManager.stopWash();
      soundManager.stopMixer();
      soundManager.stopActionBGM();
      soundManager.playGameOverGong();
      // 延迟启动氛围BGM（等锣声过后）
      setTimeout(() => {
        if (this.gameState === this.STATE_GAMEOVER) {
          soundManager.startAmbientBGM();
        }
      }, 2000);
      return;
    }

    // 更新所有玩家
    this.players.forEach(p => {
      const pInput = p.id === 1 ? this.input.getP1Input() : this.input.getP2Input();
      p.update(pInput, dt, this.map);
    });
    this.updateStoves(dt);
    this.updateDirtyPlateTimers(dt);
    this.updateMixers(dt);
    this.updateChoppingParticles(dt);
    this.updateWashingParticles(dt);
    const penalty = this.orderManager.update(dt);
    if (penalty < 0) this.addScore(penalty);
    this.bubbleTimer += dt * 10;
  }

  updateDirtyPlateTimers(dt) {
    for (let i = this.dirtyPlateTimers.length - 1; i >= 0; i--) {
      this.dirtyPlateTimers[i] -= dt;
      if (this.dirtyPlateTimers[i] <= 0) {
        this.spawnDirtyPlate();
        this.dirtyPlateTimers.splice(i, 1);
      }
    }
  }

  updateMixers(dt) {
    let hasMixing = false;

    for (let r = 0; r < this.map.rows; r++) {
      for (let c = 0; c < this.map.cols; c++) {
        const s = this.map.grid[r][c];
        if (s && s.type === 'mixer' && s.item && s.item.type === 'flour_raw') {
          s.mixProgress = (s.mixProgress || 0) + dt;
          if (s.mixProgress >= CONFIG.MIXER_TIME) {
            s.item.type = 'dough';
            s.mixProgress = CONFIG.MIXER_TIME;
          } else {
            // 搅拌机正在工作
            hasMixing = true;
          }
        }
      }
    }

    // 控制搅拌机音效
    if (hasMixing && !soundManager.mixerNodes) {
      soundManager.startMixer();
    } else if (!hasMixing && soundManager.mixerNodes) {
      soundManager.stopMixer();
    }
  }

  updateStoves(dt) {
    let hasBoiling = false;
    let hasWarning = false;

    for (let r = 0; r < this.map.rows; r++) {
      for (let c = 0; c < this.map.cols; c++) {
        const s = this.map.grid[r][c];
        if (s && s.type === 'stove' && s.item) {
          const item = s.item;
          item.progress += dt;

          if (item.progress < CONFIG.COOK_TIME) {
            item.state = 'boiling';
            hasBoiling = true;
          } else if (item.progress < CONFIG.BURN_TIME) {
            if (item.state !== 'cooked') {
              item.state = 'cooked';
              // 食物做好了，播放完成音效
              soundManager.playDing();
            }
            // 检测是否接近烧焦（超过烧焦时间的80%）
            const burnProgress = (item.progress - CONFIG.COOK_TIME) / (CONFIG.BURN_TIME - CONFIG.COOK_TIME);
            if (burnProgress > 0.6 && item.state !== 'burnt') {
              hasWarning = true;
            }
            hasBoiling = true;
          } else {
            if (item.state !== 'burnt') {
              item.state = 'burnt';
              item.type = 'burnt_trash';
            }
          }
        }
      }
    }

    // 控制滋滋声
    if (hasBoiling && !soundManager.sizzleNode) {
      soundManager.startSizzle();
    } else if (!hasBoiling && soundManager.sizzleNode) {
      soundManager.stopSizzle();
    }

    // 控制烧焦预警
    if (hasWarning && !soundManager.warningInterval) {
      soundManager.startWarning();
    } else if (!hasWarning && soundManager.warningInterval) {
      soundManager.stopWarning();
    }
  }

  updateChoppingParticles(dt) {
    // 检测是否正在切菜，生成粒子
    this.particleSpawnTimer += dt;

    // 遍历所有玩家
    this.players.forEach(player => {
      // 通过玩家位置和朝向计算面前的站点坐标
      const interactDist = 25;
      const tx = player.x + Math.cos(player.facingAngle) * interactDist;
      const ty = player.y + Math.sin(player.facingAngle) * interactDist;
      const col = Math.floor(tx / CONFIG.TILE_SIZE);
      const row = Math.floor(ty / CONFIG.TILE_SIZE);
      const station = this.map.getStationAt(row, col);

      if (station && station.name === 'Chop' && station.item && station.item.progress > 0) {
        const itemType = station.item.type;
        // 只有在切肉或切菜时生成粒子
        if (itemType === 'pork' || itemType === 'cabbage') {
          // 每隔约 0.1 秒生成一批粒子（更自然的频率）
          if (this.particleSpawnTimer >= 0.1) {
            // 只有第一个玩家触发计时器重置，或者每个玩家独立计时（这里简单处理，共享计时器但每个玩家都检查）
            // 为了让两个玩家同时切菜都有粒子，我们需要每个玩家有自己的计时器，
            // 或者在这里只生成粒子，在函数末尾统一重置计时器。
            
            // 播放切菜音效
            soundManager.playChop();

            // 计算砧板中心位置
            const ts = CONFIG.TILE_SIZE;
            const stationX = col * ts + ts / 2;
            const stationY = row * ts + ts / 2 - 8;

            // 生成 2-3 个粒子（自然一点）
            const count = 2 + Math.floor(Math.random() * 2);
            const color = itemType === 'cabbage' ? '#76FF03' : '#FF8A80';

            for (let i = 0; i < count; i++) {
              // 随机大小 3-5px
              const size = 3 + Math.random() * 2;
              this.choppingParticles.push({
                x: stationX + (Math.random() - 0.5) * 12,
                y: stationY + (Math.random() - 0.5) * 12,
                vx: (Math.random() - 0.5) * 200, // 水平速度
                vy: -60 - Math.random() * 100, // 向上弹射
                color: color,
                size: size,
                opacity: 1,
                life: 0.6 + Math.random() * 0.3 // 生命周期 0.6-0.9 秒
              });
            }
          }
        }
      }
    });

    if (this.particleSpawnTimer >= 0.1) {
      this.particleSpawnTimer = 0;
    }

    // 更新所有粒子
    for (let i = this.choppingParticles.length - 1; i >= 0; i--) {
      const p = this.choppingParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 400 * dt; // 更强的重力，形成抛物线
      p.life -= dt;
      p.opacity = Math.max(0, p.life / 0.6); // 基于剩余生命淡出

      if (p.life <= 0) {
        this.choppingParticles.splice(i, 1);
      }
    }
  }

  drawChoppingParticles() {
    const ctx = this.ctx;
    for (const p of this.choppingParticles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;
      const half = p.size / 2;
      ctx.fillRect(p.x - half, p.y - half, p.size, p.size);
      ctx.restore();
    }
  }

  updateWashingParticles(dt) {
    // 检测是否正在洗碗，生成水花粒子
    this.washParticleTimer += dt;

    this.players.forEach(player => {
      if (player.isWashing) {
        // 每隔约 0.08 秒生成一批水花
        if (this.washParticleTimer >= 0.08) {
          // 通过玩家位置和朝向计算水槽位置
          const interactDist = 25;
          const tx = player.x + Math.cos(player.facingAngle) * interactDist;
          const ty = player.y + Math.sin(player.facingAngle) * interactDist;
          const col = Math.floor(tx / CONFIG.TILE_SIZE);
          const row = Math.floor(ty / CONFIG.TILE_SIZE);
          const ts = CONFIG.TILE_SIZE;
          const sinkX = col * ts + ts / 2;
          const sinkY = row * ts + ts / 2 - 5;

          // 生成 2-4 个水花粒子
          const count = 2 + Math.floor(Math.random() * 3);
          for (let i = 0; i < count; i++) {
            this.washingParticles.push({
              x: sinkX + (Math.random() - 0.5) * 20,
              y: sinkY + (Math.random() - 0.5) * 10,
              vx: (Math.random() - 0.5) * 60,
              vy: -40 - Math.random() * 60, // 向上溅起
              size: 2 + Math.random() * 2,
              life: 0.4 + Math.random() * 0.3,
              opacity: 0.8
            });
          }
        }
      }
    });

    if (this.washParticleTimer >= 0.08) {
      this.washParticleTimer = 0;
    }

    // 更新所有水花粒子
    for (let i = this.washingParticles.length - 1; i >= 0; i--) {
      const p = this.washingParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 200 * dt; // 重力
      p.life -= dt;
      p.opacity = Math.max(0, (p.life / 0.5) * 0.8);

      if (p.life <= 0) {
        this.washingParticles.splice(i, 1);
      }
    }
  }

  drawWashingParticles() {
    const ctx = this.ctx;
    for (const p of this.washingParticles) {
      ctx.save();
      ctx.globalAlpha = p.opacity;
      // 水花是浅蓝色的小圆点
      ctx.fillStyle = '#81D4FA';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  loop(timestamp) {
    const dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    this.update(dt);
    this.draw();
    requestAnimationFrame((t) => this.loop(t));
  }

  draw() {
    this.ctx.save();

    // 根据游戏状态渲染不同的画面
    if (this.gameState === this.STATE_MENU) {
      this.drawMenu();
      this.ctx.restore();
      return;
    } else if (this.gameState === this.STATE_RECIPE) {
      this.drawRecipe();
      this.ctx.restore();
      return;
    } else if (this.gameState === this.STATE_COUNTDOWN) {
      // 倒计时状态：先渲染游戏场景，再在上面画倒计时
      this.drawGameScene();
      this.drawCountdownOverlay();
      this.ctx.restore();
      return;
    } else if (this.gameState === this.STATE_GAMEOVER) {
      // 结算状态：先渲染冻结的游戏场景，再叠加结算UI
      this.drawGameScene();
      this.ctx.restore();
      this.drawUI();
      this.drawGameOverOverlay();
      return;
    }

    // STATE_PLAYING - 正常游戏渲染
    this.drawGameScene();
    this.ctx.restore();
    this.drawUI();
  }

  drawGameScene() {
    // 外围深红色背景（填充整个画布）
    this.ctx.fillStyle = '#6B0000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 游戏区域边框（内侧红色）
    const gameAreaX = CONFIG.SIDEBAR_WIDTH;
    const gameAreaWidth = this.canvas.width - (CONFIG.SIDEBAR_WIDTH * 2);
    const borderWidth = 8;

    // 红色内边框
    this.ctx.fillStyle = '#B71C1C';
    this.ctx.fillRect(gameAreaX, 0, gameAreaWidth, this.canvas.height);

    // 游戏区域内部深色背景
    this.ctx.fillStyle = '#2D2D2D';
    this.ctx.fillRect(gameAreaX + borderWidth, borderWidth, gameAreaWidth - borderWidth * 2, this.canvas.height - borderWidth * 2);

    const gameStartX = CONFIG.SIDEBAR_WIDTH + gameAreaWidth / 2;
    this.ctx.translate(gameStartX, this.canvas.height / 2);
    this.ctx.scale(this.camera.zoom, this.camera.zoom);
    this.ctx.translate(-this.camera.x, -this.camera.y);

    this.map.drawFloor(this.ctx);

    for (let r = 0; r < this.map.rows; r++) {
      this.drawMapRow(r);

      // 绘制在该行的所有玩家
      this.players.forEach(p => {
        const playerTileY = Math.floor(p.y / CONFIG.TILE_SIZE);
        if (playerTileY === r) {
          p.draw(this.ctx);
        }
      });
    }

    this.map.drawWalls(this.ctx);

    // 绘制粒子效果
    this.drawChoppingParticles();
    this.drawWashingParticles();
    if (this.gameState === this.STATE_GAMEOVER) {
      this.drawGameOverParticles();
    }

    this.ctx.restore();
    this.ctx.restore();

    this.drawUI();

    // 绘制结算面板
    if (this.gameState === this.STATE_GAMEOVER) {
      this.drawGameOverOverlay();
    }
  }

  drawGameOverParticles() {
    const ctx = this.ctx;
    for (const p of this.gameOverParticles) {
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
      ctx.restore();
    }
  }

  drawEnhancedStation(s, x, y, ts, h, hasLeft, hasRight, hasUp, hasDown) {
    const ctx = this.ctx;
    const colors = this.map.getColorsForType(s.type);
    const radius = 6;  // 圆角半径

    // 需要使用 counter 样式桌子的工作站类型
    const counterStyleTypes = ['counter', 'meat', 'veggie', 'flour', 'mixer'];
    const isCounterStyle = counterStyleTypes.includes(s.type);

    // 中国新年主题调色板
    const festiveColors = {
      counterTop: '#C62828',       // 喜庆红台面
      counterFront: '#8E0000',     // 深红柜体
      goldTrim: '#FFC107',         // 金色装饰
      goldDark: '#FFA000',         // 深金色
      counterHighlight: 'rgba(255, 200, 100, 0.3)',
      handleColor: '#FFC107',      // 金色把手
      sinkBase: '#CFD8DC',         // 银色水槽底
      sinkWater: '#1565C0',        // 深蓝色水
      stoveBase: '#37474F',        // 深灰炉灶
      stoveBurner: '#263238',      // 更深的燃烧器
      stoveActive: '#FF7043',      // 活跃火焰颜色
      servingBase: '#FFEB3B',      // 金黄服务台
      woodBlock: '#EDD6B0',        // 砧板木色
    };

    // trash 类型不绘制背景，只绘制垃圾桶本身
    const skipBackground = s.type === 'trash';

    // 绘制3D柜台前面板效果（只有最前面的才画侧面）
    if (!hasDown && !skipBackground) {
      ctx.fillStyle = isCounterStyle ? festiveColors.counterFront : colors.front;
      const frontY = y + ts - h;
      ctx.fillRect(x, frontY, ts, h);

      // 金色装饰条（counter 样式桌子）
      if (isCounterStyle) {
        // 金色竖条装饰
        ctx.fillStyle = festiveColors.goldDark;
        ctx.fillRect(x + ts / 2 - 6, frontY + 2, 12, h - 4);

        // 金色把手
        ctx.fillStyle = festiveColors.goldTrim;
        const handleW = 16;
        const handleH = 4;
        const handleX = x + ts / 2 - handleW / 2;
        const handleY = y + ts - h / 2 - handleH / 2;
        ctx.beginPath();
        ctx.roundRect(handleX, handleY, handleW, handleH, 2);
        ctx.fill();
      }
    }

    // 绘制台面顶部
    const topHeight = hasDown ? ts : ts - h;
    if (!skipBackground) {
      ctx.fillStyle = isCounterStyle ? festiveColors.counterTop : colors.top;
      ctx.fillRect(x, y, ts, topHeight);
    }

    // 喜庆台面纹理（counter 样式）- 金色条纹
    if (isCounterStyle) {
      // 金色中央条纹（桌布跑道）
      ctx.fillStyle = festiveColors.goldTrim;
      ctx.fillRect(x + ts / 2 - 10, y, 20, topHeight);

      // 金色边缘细线
      ctx.fillStyle = festiveColors.goldDark;
      ctx.fillRect(x + ts / 2 - 12, y, 2, topHeight);
      ctx.fillRect(x + ts / 2 + 10, y, 2, topHeight);

      // 顶部高亮条
      if (!hasUp) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(x + 3, y + 2, ts - 6, 2);
      }

      // 红色部分的光泽
      ctx.fillStyle = 'rgba(255, 200, 150, 0.15)';
      ctx.beginPath();
      ctx.moveTo(x + ts * 0.6, y);
      ctx.lineTo(x + ts * 0.75, y);
      ctx.lineTo(x + ts * 0.5, y + topHeight * 0.5);
      ctx.lineTo(x + ts * 0.35, y + topHeight * 0.5);
      ctx.closePath();
      ctx.fill();

      // 细小的光点
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      const seed = (x + y) % 100;
      ctx.beginPath();
      ctx.arc(x + 15 + (seed % 20), y + 12, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + ts - 18 + (seed % 10), y + topHeight * 0.4, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 切菜板（使用素材）- 大幅增大
    if (s.name === 'Chop') {
      const sprite = this.stationSprites['chopping_board'];
      if (sprite && sprite.complete) {
        const spriteW = (ts - h) * 1.1;  // 大幅增大
        const spriteH = (ts - h) * 1.1;
        const spriteX = x + (ts - spriteW) / 2;
        const spriteY = y + ((ts - h) - spriteH) / 2;  // 垂直居中

        // 绘制接触阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.ellipse(x + ts / 2, spriteY + spriteH - 2, spriteW * 0.4, spriteH * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();

        // 绘制道具
        ctx.drawImage(sprite, spriteX, spriteY, spriteW, spriteH);

        // 呼吸高光（径向渐变，边缘淡出）
        const ba = (Math.sin(Date.now() * 0.003 + 3.0) + 1) / 2 * 0.4;
        const gcx = spriteX + spriteW / 2, gcy = spriteY + spriteH / 2;
        const gr = Math.max(spriteW, spriteH) * 0.45;
        const grad = ctx.createRadialGradient(gcx, gcy, 0, gcx, gcy, gr);
        grad.addColorStop(0, `rgba(255,255,255,${ba})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(spriteX, spriteY, spriteW, spriteH);
      }
    }

    // 水槽 - 银色底座 + 红色装饰边 + 深蓝色水
    if (s.type === 'sink') {
      const basinX = x + 6;
      const basinY = y + 6;
      const basinW = ts - 12;
      const basinH = ts - h - 12;
      const time = Date.now() / 1000;

      // 红色装饰边框
      ctx.fillStyle = '#C62828';
      ctx.fillRect(basinX - 6, basinY - 6, basinW + 12, basinH + 12);

      // 金色边线
      ctx.strokeStyle = '#FFC107';
      ctx.lineWidth = 2;
      ctx.strokeRect(basinX - 4, basinY - 4, basinW + 8, basinH + 8);

      // 不锈钢外框
      ctx.fillStyle = '#CFD8DC';
      ctx.fillRect(basinX - 2, basinY - 2, basinW + 4, basinH + 4);

      // 水槽内部
      ctx.fillStyle = '#455A64';
      ctx.fillRect(basinX, basinY, basinW, basinH);

      // 深蓝色水面
      const waterGradient = ctx.createLinearGradient(basinX, basinY, basinX, basinY + basinH);
      waterGradient.addColorStop(0, '#1976D2');
      waterGradient.addColorStop(0.5, '#1565C0');
      waterGradient.addColorStop(1, '#0D47A1');
      ctx.fillStyle = waterGradient;
      ctx.fillRect(basinX + 2, basinY + 2, basinW - 4, basinH - 4);

      // 波光动画
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      for (let i = 0; i < 3; i++) {
        const waveOffset = (time * 0.8 + i * 1.2) % 3;
        const waveY = basinY + 4 + waveOffset * (basinH - 8) / 3;
        const waveWidth = basinW * (0.3 + Math.sin(time * 2 + i) * 0.1);
        const waveX = basinX + (basinW - waveWidth) / 2 + Math.sin(time * 1.5 + i * 2) * 6;
        ctx.beginPath();
        ctx.ellipse(waveX + waveWidth / 2, waveY, waveWidth / 2, 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // 水面边缘反光
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(basinX + 4, basinY + 4);
      ctx.lineTo(basinX + basinW * 0.4, basinY + 4);
      ctx.stroke();

      // 水龙头（弧形管道）
      ctx.fillStyle = '#607D8B';
      ctx.strokeStyle = '#546E7A';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(x + ts / 2, y + 2, 10, Math.PI, 0);
      ctx.stroke();

      // 龙头出水口
      ctx.fillStyle = '#78909C';
      ctx.beginPath();
      ctx.roundRect(x + ts / 2 + 7, y + 2, 6, 8, 2);
      ctx.fill();

      // 龙头高亮
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(x + ts / 2 - 8, y + 4, 3, 1);
    }

    // 灶台 - 大锅覆盖，下面有火，带福字装饰
    if (s.type === 'stove') {
      const time = Date.now() / 1000;
      const potCenterX = x + ts / 2;
      const potCenterY = y + (ts - h) / 2 - 3;  // 锅稍微上移，轻微悬空感
      const potW = ts - 24;  // 锅宽度，留出边距看火苗
      const potH = (ts - h) - 20;  // 锅高度
      const potDepth = 16;  // 锅的深度

      // 灶台底座（深灰）
      ctx.fillStyle = '#37474F';
      ctx.fillRect(x + 2, y + 2, ts - 4, ts - h - 4);

      // 灶台表面
      ctx.fillStyle = '#455A64';
      ctx.fillRect(x + 4, y + 4, ts - 8, ts - h - 8);

      // "福"字贴纸装饰（红色菱形 + 金色中心）
      const fuX = x + 8;
      const fuY = y + 8;
      const fuSize = 10;
      // 红色菱形背景
      ctx.fillStyle = '#C62828';
      ctx.beginPath();
      ctx.moveTo(fuX + fuSize, fuY);
      ctx.lineTo(fuX + fuSize * 2, fuY + fuSize);
      ctx.lineTo(fuX + fuSize, fuY + fuSize * 2);
      ctx.lineTo(fuX, fuY + fuSize);
      ctx.closePath();
      ctx.fill();
      // 金色边框
      ctx.strokeStyle = '#FFC107';
      ctx.lineWidth = 1;
      ctx.stroke();
      // 金色中心点（代表"福"字）
      ctx.fillStyle = '#FFC107';
      ctx.beginPath();
      ctx.arc(fuX + fuSize, fuY + fuSize, 3, 0, Math.PI * 2);
      ctx.fill();

      // 火焰（在锅底下方，围绕锅边缘清晰可见）
      const drawFlame = (fx, fy, size, flicker) => {
        ctx.fillStyle = `rgba(255, 100, 0, ${0.9 * flicker})`;
        ctx.beginPath();
        ctx.moveTo(fx, fy - size);
        ctx.quadraticCurveTo(fx + size * 0.5, fy - size * 0.2, fx + size * 0.3, fy + size * 0.4);
        ctx.quadraticCurveTo(fx, fy + size * 0.5, fx - size * 0.3, fy + size * 0.4);
        ctx.quadraticCurveTo(fx - size * 0.5, fy - size * 0.2, fx, fy - size);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 200, 50, ${0.85 * flicker})`;
        ctx.beginPath();
        ctx.moveTo(fx, fy - size * 0.5);
        ctx.quadraticCurveTo(fx + size * 0.25, fy, fx + size * 0.15, fy + size * 0.25);
        ctx.quadraticCurveTo(fx, fy + size * 0.3, fx - size * 0.15, fy + size * 0.25);
        ctx.quadraticCurveTo(fx - size * 0.25, fy, fx, fy - size * 0.5);
        ctx.fill();
      };

      // 火焰位置（在锅下方，数量减少）
      const flameY = potCenterY + potH / 2 + 8;  // 火焰在锅底下方
      const flameCount = 5;
      for (let i = 0; i < flameCount; i++) {
        const spread = (i - (flameCount - 1) / 2) * 10;  // 水平分布
        const flameX = potCenterX + spread;
        const flicker = Math.sin(time * 8 + i * 1.5) * 0.15 + 0.85;
        const sizeVar = 5 + Math.sin(time * 6 + i * 1.2) * 1.5;
        drawFlame(flameX, flameY, sizeVar, flicker);
      }

      // 锅身外壁（深灰色，有深度感）
      ctx.fillStyle = '#546E7A';
      ctx.beginPath();
      ctx.ellipse(potCenterX, potCenterY + potDepth / 2, potW / 2, potH / 2, 0, 0, Math.PI);
      ctx.lineTo(potCenterX - potW / 2, potCenterY - potDepth / 2 + 4);
      ctx.ellipse(potCenterX, potCenterY - potDepth / 2 + 4, potW / 2, potH / 2, 0, Math.PI, 0, true);
      ctx.closePath();
      ctx.fill();

      // 锅身高亮（左侧）
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.beginPath();
      ctx.moveTo(potCenterX - potW / 2 + 3, potCenterY - potDepth / 2 + 8);
      ctx.lineTo(potCenterX - potW / 2 + 8, potCenterY - potDepth / 2 + 6);
      ctx.lineTo(potCenterX - potW / 2 + 6, potCenterY + potDepth / 2 - 6);
      ctx.lineTo(potCenterX - potW / 2 + 2, potCenterY + potDepth / 2 - 4);
      ctx.closePath();
      ctx.fill();

      // 锅口边缘（银灰色环）
      ctx.fillStyle = '#78909C';
      ctx.beginPath();
      ctx.ellipse(potCenterX, potCenterY - potDepth / 2 + 4, potW / 2, potH / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // 锅内壁（深色）
      ctx.fillStyle = '#37474F';
      ctx.beginPath();
      ctx.ellipse(potCenterX, potCenterY - potDepth / 2 + 6, potW / 2 - 4, potH / 2 - 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // 水面（浅蓝色渐变）
      const waterGradient = ctx.createRadialGradient(
        potCenterX - 8, potCenterY - potDepth / 2 + 4, 0,
        potCenterX, potCenterY - potDepth / 2 + 6, potW / 2 - 6
      );
      waterGradient.addColorStop(0, '#B3E5FC');
      waterGradient.addColorStop(0.5, '#81D4FA');
      waterGradient.addColorStop(1, '#4FC3F7');
      ctx.fillStyle = waterGradient;
      ctx.beginPath();
      ctx.ellipse(potCenterX, potCenterY - potDepth / 2 + 8, potW / 2 - 6, potH / 2 - 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // 水面波纹/气泡动画
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 5; i++) {
        const bubbleTime = (time * 1.5 + i * 0.7) % 2;
        const bubbleX = potCenterX - 15 + (i * 8) + Math.sin(time + i) * 3;
        const bubbleY = potCenterY - potDepth / 2 + 6 + Math.sin(bubbleTime * Math.PI) * 2;
        const bubbleSize = 2 + Math.sin(time * 3 + i) * 0.8;
        ctx.beginPath();
        ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // 水面反光
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      ctx.ellipse(potCenterX - 10, potCenterY - potDepth / 2 + 5, 12, 4, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // 锅把手（左右两侧）
      ctx.fillStyle = '#455A64';
      // 左把手
      ctx.beginPath();
      ctx.roundRect(x - 2, potCenterY - 4, 10, 8, 2);
      ctx.fill();
      // 右把手
      ctx.beginPath();
      ctx.roundRect(x + ts - 8, potCenterY - 4, 10, 8, 2);
      ctx.fill();

      // 把手高亮
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(x, potCenterY - 2, 6, 2);
      ctx.fillRect(x + ts - 6, potCenterY - 2, 6, 2);
    }

    // 面粉袋（使用素材 - 缩放并添加阴影效果）
    if (s.type === 'flour') {
      const sprite = this.stationSprites['flour_bag'];
      if (sprite && sprite.complete) {
        // 缩小到约80%，让物体看起来放在桌面上
        const spriteW = (ts - h) * 0.8;
        const spriteH = (ts - h) * 0.8;
        const spriteX = x + (ts - spriteW) / 2;  // 水平居中
        const spriteY = y + ((ts - h) - spriteH) / 2 - 3;  // 在台面区域垂直居中，向上移动3像素

        // 绘制接触阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(x + ts / 2, spriteY + spriteH - 2, spriteW * 0.4, spriteH * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();

        // 绘制道具
        ctx.drawImage(sprite, spriteX, spriteY, spriteW, spriteH);

        // 呼吸高光（径向渐变，边缘淡出）
        const ba = (Math.sin(Date.now() * 0.003 + 4.5) + 1) / 2 * 0.4;
        const gcx = spriteX + spriteW / 2, gcy = spriteY + spriteH / 2;
        const gr = Math.max(spriteW, spriteH) * 0.45;
        const grad = ctx.createRadialGradient(gcx, gcy, 0, gcx, gcy, gr);
        grad.addColorStop(0, `rgba(255,255,255,${ba})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(spriteX, spriteY, spriteW, spriteH);
      }
    }

    // 肉箱（使用素材 - 缩放并添加阴影效果）
    if (s.type === 'meat') {
      const sprite = this.stationSprites['meat_box'];
      if (sprite && sprite.complete) {
        // 缩小到约80%，让物体看起来放在桌面上
        const spriteW = (ts - h) * 0.8;
        const spriteH = (ts - h) * 0.8;
        const spriteX = x + (ts - spriteW) / 2;  // 水平居中
        const spriteY = y + ((ts - h) - spriteH) / 2 - 3;  // 在台面区域垂直居中，向上移动3像素

        // 绘制接触阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(x + ts / 2, spriteY + spriteH - 2, spriteW * 0.4, spriteH * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();

        // 绘制道具
        ctx.drawImage(sprite, spriteX, spriteY, spriteW, spriteH);

        // 呼吸高光（径向渐变，边缘淡出）
        const ba = (Math.sin(Date.now() * 0.003) + 1) / 2 * 0.4;
        const gcx = spriteX + spriteW / 2, gcy = spriteY + spriteH / 2;
        const gr = Math.max(spriteW, spriteH) * 0.45;
        const grad = ctx.createRadialGradient(gcx, gcy, 0, gcx, gcy, gr);
        grad.addColorStop(0, `rgba(255,255,255,${ba})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(spriteX, spriteY, spriteW, spriteH);
      }
    }

    // 蔬菜箱（使用素材 - 缩放并添加阴影效果）
    if (s.type === 'veggie') {
      const sprite = this.stationSprites['veggie_box'];
      if (sprite && sprite.complete) {
        // 缩小到约80%，让物体看起来放在桌面上
        const spriteW = (ts - h) * 0.8;
        const spriteH = (ts - h) * 0.8;
        const spriteX = x + (ts - spriteW) / 2;  // 水平居中
        const spriteY = y + ((ts - h) - spriteH) / 2 - 3;  // 在台面区域垂直居中，向上移动3像素

        // 绘制接触阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(x + ts / 2, spriteY + spriteH - 2, spriteW * 0.4, spriteH * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();

        // 绘制道具
        ctx.drawImage(sprite, spriteX, spriteY, spriteW, spriteH);

        // 呼吸高光（径向渐变，边缘淡出）
        const ba = (Math.sin(Date.now() * 0.003 + 1.5) + 1) / 2 * 0.4;
        const gcx = spriteX + spriteW / 2, gcy = spriteY + spriteH / 2;
        const gr = Math.max(spriteW, spriteH) * 0.45;
        const grad = ctx.createRadialGradient(gcx, gcy, 0, gcx, gcy, gr);
        grad.addColorStop(0, `rgba(255,255,255,${ba})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(spriteX, spriteY, spriteW, spriteH);
      }
    }

    // 搅拌机（使用素材 - 缩放并添加阴影效果）
    if (s.type === 'mixer') {
      const sprite = this.stationSprites['mixer'];
      if (sprite && sprite.complete) {
        // 缩小到约80%，让物体看起来放在桌面上
        const spriteW = (ts - h) * 0.8;
        const spriteH = (ts - h) * 0.8;
        const spriteX = x + (ts - spriteW) / 2;  // 水平居中
        const spriteY = y + ((ts - h) - spriteH) / 2 - 3;  // 在台面区域垂直居中，向上移动3像素

        // 绘制接触阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(x + ts / 2, spriteY + spriteH - 2, spriteW * 0.4, spriteH * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();

        // 绘制道具
        ctx.drawImage(sprite, spriteX, spriteY, spriteW, spriteH);

        // 呼吸高光（径向渐变，边缘淡出）
        const ba = (Math.sin(Date.now() * 0.003 + 6.0) + 1) / 2 * 0.4;
        const gcx = spriteX + spriteW / 2, gcy = spriteY + spriteH / 2;
        const gr = Math.max(spriteW, spriteH) * 0.45;
        const grad = ctx.createRadialGradient(gcx, gcy, 0, gcx, gcy, gr);
        grad.addColorStop(0, `rgba(255,255,255,${ba})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(spriteX, spriteY, spriteW, spriteH);
      }
    }

    // 服务窗口 - 金黄传送带风格
    if (s.type === 'serving') {
      const surfaceY = y + 2;
      const surfaceH = ts - h - 4;

      // 金色底座
      ctx.fillStyle = '#FFC107';
      ctx.fillRect(x, surfaceY, ts, surfaceH);

      // 红色上边框
      ctx.fillStyle = '#C62828';
      ctx.fillRect(x, surfaceY, ts, 3);

      // 深金色下边缘（3D 厚度）
      ctx.fillStyle = '#FFA000';
      ctx.fillRect(x, surfaceY + surfaceH - 4, ts, 4);

      // 金色中央条纹装饰
      ctx.fillStyle = '#FFD54F';
      ctx.fillRect(x, surfaceY + surfaceH / 2 - 2, ts, 4);

      // 顶部高亮
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(x, surfaceY + 3, ts, 2);

      // 传送带三角 (台面上，单列居中，向上滚动)
      const triW = 14;   // 三角形底边宽
      const triH = 11;   // 三角形高度（尖朝上）
      const triGap = 6;  // 三角纵向间距
      const triStep = triH + triGap;

      // 动画偏移 (bubbleTimer 驱动向上滚动)
      const speed = 1.5;
      const offset = (this.bubbleTimer * speed) % triStep;

      // 裁剪到台面区域
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, surfaceY, ts, surfaceH);
      ctx.clip();

      const cx = x + ts / 2;
      const startTY = surfaceY + surfaceH + triStep - offset;
      for (let ty = startTY; ty > surfaceY - triStep; ty -= triStep) {
        ctx.fillStyle = '#C62828';
        ctx.beginPath();
        ctx.moveTo(cx - triW / 2, ty);
        ctx.lineTo(cx + triW / 2, ty);
        ctx.lineTo(cx, ty - triH);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }

    // 脏盘回收台 - 红木框架风格
    if (s.type === 'dirty_return') {
      // 红木框架
      ctx.fillStyle = '#8E0000';
      ctx.fillRect(x + 4, y + 4, ts - 8, ts - h - 8);

      // 金色边框
      ctx.strokeStyle = '#FFC107';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 6, y + 6, ts - 12, ts - h - 12);

      // 内部深色区域
      ctx.fillStyle = '#3E2723';
      ctx.fillRect(x + 10, y + 10, ts - 20, ts - h - 20);

      // 回收标识（金色向下箭头）
      ctx.fillStyle = '#FFC107';
      const arrowX = x + ts / 2;
      const arrowY = y + (ts - h) / 2;
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY + 8);
      ctx.lineTo(arrowX - 8, arrowY - 2);
      ctx.lineTo(arrowX - 3, arrowY - 2);
      ctx.lineTo(arrowX - 3, arrowY - 8);
      ctx.lineTo(arrowX + 3, arrowY - 8);
      ctx.lineTo(arrowX + 3, arrowY - 2);
      ctx.lineTo(arrowX + 8, arrowY - 2);
      ctx.closePath();
      ctx.fill();
    }

    // 垃圾桶 - trash 类型（斜俯视角度）
    if (s.type === 'trash') {
      const binCenterX = x + ts / 2;
      const binCenterY = y + (ts - h) / 2;
      const binW = 36;
      const binH = 20;  // 俯视椭圆的高度
      const binDepth = 28;  // 桶身深度

      // 垃圾桶阴影（地面）
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.beginPath();
      ctx.ellipse(binCenterX + 3, binCenterY + binDepth / 2 + 6, binW / 2 + 4, binH / 2 + 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // 桶身侧面（可见部分 - 斜俯视角度看到的前半部分）
      ctx.fillStyle = '#607D8B';
      ctx.beginPath();
      // 从顶部椭圆的底部连接到底部椭圆
      ctx.ellipse(binCenterX, binCenterY + binDepth / 2, binW / 2 - 2, binH / 2 - 2, 0, 0, Math.PI);
      ctx.lineTo(binCenterX - binW / 2 + 2, binCenterY - binDepth / 2 + 4);
      ctx.ellipse(binCenterX, binCenterY - binDepth / 2 + 4, binW / 2 - 2, binH / 2 - 2, 0, Math.PI, 0, true);
      ctx.closePath();
      ctx.fill();

      // 桶身高亮（左侧）
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.moveTo(binCenterX - binW / 2 + 4, binCenterY - binDepth / 2 + 6);
      ctx.lineTo(binCenterX - binW / 2 + 8, binCenterY - binDepth / 2 + 6);
      ctx.lineTo(binCenterX - binW / 2 + 6, binCenterY + binDepth / 2 - 4);
      ctx.lineTo(binCenterX - binW / 2 + 2, binCenterY + binDepth / 2 - 4);
      ctx.closePath();
      ctx.fill();

      // 桶口边缘（椭圆环）
      ctx.fillStyle = '#78909C';
      ctx.beginPath();
      ctx.ellipse(binCenterX, binCenterY - binDepth / 2 + 4, binW / 2, binH / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // 桶内部（深色椭圆）
      ctx.fillStyle = '#37474F';
      ctx.beginPath();
      ctx.ellipse(binCenterX, binCenterY - binDepth / 2 + 5, binW / 2 - 4, binH / 2 - 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // 桶口高亮
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.ellipse(binCenterX - 6, binCenterY - binDepth / 2 + 3, 10, 4, -0.2, Math.PI, 0, true);
      ctx.fill();
    }

    // 边框（更柔和的阴影线）- 仅在边缘绘制
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 1;
    const borderBottom = hasDown ? y + ts : y + ts - h;
    if (!hasLeft) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, y + (hasUp ? 0 : radius));
      ctx.lineTo(x + 0.5, borderBottom - (hasDown ? 0 : radius));
      ctx.stroke();
    }
    if (!hasRight) {
      ctx.beginPath();
      ctx.moveTo(x + ts - 0.5, y + (hasUp ? 0 : radius));
      ctx.lineTo(x + ts - 0.5, borderBottom - (hasDown ? 0 : radius));
      ctx.stroke();
    }
    if (!hasUp) {
      ctx.beginPath();
      ctx.moveTo(x + (hasLeft ? 0 : radius), y + 0.5);
      ctx.lineTo(x + ts - (hasRight ? 0 : radius), y + 0.5);
      ctx.stroke();
    }
  }

  drawMapRow(r) {
    const ts = CONFIG.TILE_SIZE;
    const h = CONFIG.STATION_HEIGHT;

    for (let c = 0; c < this.map.cols; c++) {
      const s = this.map.grid[r][c];
      if (!s) continue;

      const x = c * ts;
      const y = r * ts;

      const hasLeft = this.map.isConnectable(r, c - 1, s.type);
      const hasRight = this.map.isConnectable(r, c + 1, s.type);
      const hasUp = this.map.isConnectable(r - 1, c, s.type);
      const hasDown = this.map.isConnectable(r + 1, c, s.type);

      // Draw enhanced station graphics
      this.drawEnhancedStation(s, x, y, ts, h, hasLeft, hasRight, hasUp, hasDown);

      if (s.type === 'plate' && s.cleanPlates !== undefined) {
        const itemX = x + ts / 2;
        const itemY = y + (ts - h) / 2;

        // Draw wooden rack
        this.ctx.fillStyle = '#8b6914';
        this.ctx.fillRect(itemX - 20, itemY - 5, 40, 3);
        this.ctx.fillRect(itemX - 20, itemY + 15, 40, 3);
        this.ctx.fillRect(itemX - 22, itemY - 5, 3, 23);
        this.ctx.fillRect(itemX + 19, itemY - 5, 3, 23);

        // Draw stacked plates
        this.ctx.fillStyle = 'white';
        this.ctx.strokeStyle = '#d0d0d0';
        this.ctx.lineWidth = 1.5;
        for (let i = 0; i < Math.min(s.cleanPlates, 3); i++) {
          this.ctx.beginPath();
          this.ctx.ellipse(itemX, itemY + 5 - i * 4, 16, 9, 0, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.stroke();
        }

        // Draw count badge
        this.ctx.fillStyle = '#4caf50';
        this.ctx.beginPath();
        this.ctx.arc(itemX + 20, itemY - 10, 10, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(s.cleanPlates, itemX + 20, itemY - 6);

        // 呼吸高光（径向渐变，边缘淡出）
        const ba = (Math.sin(Date.now() * 0.003 + 7.5) + 1) / 2 * 0.4;
        const gr = 16;
        const grad = this.ctx.createRadialGradient(itemX, itemY + 3, 0, itemX, itemY + 3, gr);
        grad.addColorStop(0, `rgba(255,255,255,${ba})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(itemX - 22, itemY - 10, 44, 30);
      } else if (s.type === 'sink') {
        const itemX = x + ts / 2;
        const itemY = y + (ts - h) / 2;
        if (s.dirtyPlates && s.dirtyPlates.length > 0) {
          for (let i = 0; i < Math.min(s.dirtyPlates.length, 3); i++) {
            this.ctx.fillStyle = '#e0e0e0';
            this.ctx.beginPath();
            this.ctx.ellipse(itemX, itemY - i * 3, 14, 7, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(itemX - 4, itemY - i * 3 - 2, 2, 0, Math.PI * 2);
            this.ctx.arc(itemX + 3, itemY - i * 3, 2, 0, Math.PI * 2);
            this.ctx.fill();
          }
          this.ctx.fillStyle = 'white';
          this.ctx.font = 'bold 12px Arial';
          this.ctx.textAlign = 'center';
          this.ctx.strokeStyle = '#333';
          this.ctx.lineWidth = 2;
          this.ctx.strokeText(`${s.dirtyPlates.length}`, itemX + 18, itemY - 10);
          this.ctx.fillText(`${s.dirtyPlates.length}`, itemX + 18, itemY - 10);
        }
        if (s.washProgress > 0) {
          this.drawWashProgress(this.ctx, itemX, itemY + 20, s.washProgress / CONFIG.BATCH_WASH_TIME);
        }
      } else if (s.type === 'mixer') {
        // 搅拌机的装饰物已在 drawEnhancedStation 中绘制
        // 这里只处理 item 绘制和进度条
        if (s.item) {
          const itemX = x + ts / 2;
          const itemY = y + (ts - h) / 2 - 4;  // 调整位置居中
          this.player.drawItem(this.ctx, s.item.type, itemX, itemY);

          if (s.mixProgress > 0) {
            const pct = s.mixProgress / CONFIG.MIXER_TIME;
            this.drawProgressBar(this.ctx, itemX, itemY - 25, pct);

            // Spinning animation
            if (pct < 1) {
              const rotation = (this.gameTime * 10) % (Math.PI * 2);
              this.ctx.save();
              this.ctx.translate(itemX, itemY - 8);
              this.ctx.rotate(rotation);
              this.ctx.strokeStyle = '#9e9e9e';
              this.ctx.lineWidth = 2;
              this.ctx.beginPath();
              this.ctx.moveTo(-6, 0);
              this.ctx.lineTo(6, 0);
              this.ctx.stroke();
              this.ctx.restore();
            }
          }
        }
      } else if (s.item) {
        const itemX = x + ts / 2;
        const itemY = y + (ts - h) / 2 - 6;  // 上移让食物居中

        if (s.type === 'stove') {
          this.drawStoveItem(this.ctx, s.item, itemX, itemY + 6);
        } else {
          this.player.drawItem(this.ctx, s.item.type, itemX, itemY);
          if (s.item.progress > 0) {
            const isOpenDumpling = s.item.type.startsWith('open_');
            const target = isOpenDumpling ? CONFIG.FOLD_TIME : CONFIG.PROCESS_TIME;
            this.drawProgressBar(this.ctx, itemX, itemY - 25, s.item.progress / target);
          }

          // Draw stack count for dirty plates
          if (s.item.type === 'dirty_plate' && s.item.stackCount > 1) {
            this.ctx.fillStyle = 'white';
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 3;
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.strokeText(`x${s.item.stackCount}`, itemX + 18, itemY - 8);
            this.ctx.fillText(`x${s.item.stackCount}`, itemX + 18, itemY - 8);
          }
        }
      }

      // Labels removed for cleaner look - visual elements speak for themselves
    }
  }

  drawStoveItem(ctx, item, x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Pot Body
    ctx.fillStyle = '#78909c';
    ctx.beginPath(); ctx.roundRect(-15, -8, 30, 16, 2); ctx.fill();
    ctx.fillStyle = '#546e7a';
    ctx.fillRect(-15, -8, 30, 4);

    // Content/Bubbles
    if (item.state !== 'burnt') {
      ctx.fillStyle = COLORS.SINK;
      ctx.beginPath(); ctx.ellipse(0, -6, 12, 4, 0, 0, Math.PI * 2); ctx.fill();

      // Bubbles
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      for (let i = 0; i < 3; i++) {
        const bx = Math.sin(this.bubbleTimer + i) * 8;
        const by = -6 + Math.cos(this.bubbleTimer * 0.5 + i) * 2;
        ctx.beginPath(); ctx.arc(bx, by, 2, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      ctx.fillStyle = COLORS.BURNT;
      ctx.beginPath(); ctx.ellipse(0, -6, 12, 4, 0, 0, Math.PI * 2); ctx.fill();

      // Smoke
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      for (let i = 0; i < 2; i++) {
        const sx = Math.sin(this.bubbleTimer * 0.5 + i) * 5;
        const sy = -10 - (this.bubbleTimer % 10) * 2;
        ctx.beginPath(); ctx.arc(sx, sy, 4, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Circular Progress
    let pct = 0;
    let color = '#4caf50';
    let showExclamation = false;

    if (item.state === 'boiling') {
      pct = item.progress / CONFIG.COOK_TIME;
      color = '#4caf50';
    } else if (item.state === 'cooked') {
      pct = (item.progress - CONFIG.COOK_TIME) / (CONFIG.BURN_TIME - CONFIG.COOK_TIME);
      color = '#ffca28';
      showExclamation = true;
    } else {
      pct = 1;
      color = '#f44336';
    }

    this.drawCircularProgress(ctx, 0, -25, 12, pct, color);

    if (showExclamation && Math.floor(this.bubbleTimer * 2) % 2 === 0) {
      ctx.fillStyle = '#ffca28';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('!', 0, -42);
    } else if (item.state === 'burnt') {
      ctx.fillStyle = '#f44336';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🔥', 0, -42);
    }

    ctx.restore();
  }

  drawCircularProgress(ctx, x, y, radius, pct, color) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * pct));
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  drawProgressBar(ctx, x, y, pct) {
    const w = 30;
    const h = 6;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x - w / 2, y - h / 2, w, h);
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(x - w / 2 + 1, y - h / 2 + 1, (w - 2) * Math.min(1, pct), h - 2);
  }

  drawWashProgress(ctx, x, y, pct) {
    const w = 35;
    const h = 8;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x - w / 2, y - h / 2, w, h);
    ctx.fillStyle = '#2196f3';
    ctx.fillRect(x - w / 2 + 1, y - h / 2 + 1, (w - 2) * Math.min(1, pct), h - 2);
    ctx.fillStyle = '#e1f5fe';
    ctx.beginPath();
    ctx.arc(x - w / 2 - 8, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#81d4fa';
    ctx.fillRect(x - w / 2 - 10, y - 1, 6, 3);
  }

  // ========== 状态绘制方法 ==========
  drawMenu() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 应用震动效果
    if (this.menuShakeTimer > 0) {
      const shakeX = (Math.random() - 0.5) * 20;
      const shakeY = (Math.random() - 0.5) * 20;
      ctx.translate(shakeX, shakeY);
      this.menuShakeTimer -= 0.016;
    }

    // 背景图（保持比例铺满，居中裁剪）
    ctx.fillStyle = '#2A1A0E';
    ctx.fillRect(0, 0, w, h);

    if (this.menuBgImg && this.menuBgImg.complete && this.menuBgImg.naturalWidth) {
      const imgW = this.menuBgImg.naturalWidth;
      const imgH = this.menuBgImg.naturalHeight;
      const scale = Math.max(w / imgW, h / imgH);
      const drawW = imgW * scale;
      const drawH = imgH * scale;
      const drawX = (w - drawW) / 2;
      const drawY = (h - drawH) / 2;
      ctx.drawImage(this.menuBgImg, drawX, drawY, drawW, drawH);
    }

    // 顶部渐变遮罩（让标题更清晰）
    const topGrad = ctx.createLinearGradient(0, 0, 0, h * 0.45);
    topGrad.addColorStop(0, 'rgba(30, 15, 5, 0.7)');
    topGrad.addColorStop(1, 'rgba(30, 15, 5, 0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, w, h * 0.45);

    // 底部渐变遮罩（让提示文字更清晰）
    const botGrad = ctx.createLinearGradient(0, h * 0.7, 0, h);
    botGrad.addColorStop(0, 'rgba(30, 15, 5, 0)');
    botGrad.addColorStop(1, 'rgba(30, 15, 5, 0.75)');
    ctx.fillStyle = botGrad;
    ctx.fillRect(0, h * 0.7, w, h * 0.3);

    // === 标题 "Legendary Dumplings" - 黄金金属渐变风格 ===
    const pulse = 1 + Math.sin(this.menuTimer * 2) * 0.02;
    const glowPulse = 0.3 + Math.sin(this.menuTimer * 2) * 0.25;
    ctx.save();
    ctx.translate(w / 2, h * 0.35);
    ctx.scale(pulse, pulse);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';

    const titleSize = Math.min(w * 0.14, 140);
    ctx.font = `900 ${titleSize}px Georgia, serif`;

    const line1Y = -titleSize * 0.55;
    const line2Y = titleSize * 0.55;

    // 1. 外发光（金色光晕）
    ctx.shadowColor = `rgba(255, 215, 0, ${glowPulse})`;
    ctx.shadowBlur = 25;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // 2. 深褐色底部厚阴影（立体感）
    ctx.fillStyle = '#4A2800';
    ctx.fillText('Legendary', 0, line1Y + 5);
    ctx.fillText('Dumplings!', 0, line2Y + 5);
    ctx.shadowBlur = 0;

    // 3. 深褐色粗描边（轮廓）
    ctx.strokeStyle = '#5C3310';
    ctx.lineWidth = 14;
    ctx.strokeText('Legendary', 0, line1Y);
    ctx.strokeText('Dumplings!', 0, line2Y);

    // 4. 金属渐变填充（从顶部高光到底部深褐）
    const goldGrad = ctx.createLinearGradient(0, line1Y - titleSize * 0.5, 0, line2Y + titleSize * 0.5);
    goldGrad.addColorStop(0, '#FFF7CC');    // 顶部高光
    goldGrad.addColorStop(0.25, '#FFD700'); // 黄金
    goldGrad.addColorStop(0.5, '#DAA520');  // 中段暗金
    goldGrad.addColorStop(0.75, '#B8860B'); // 深金
    goldGrad.addColorStop(1, '#8B4513');    // 底部深褐
    ctx.fillStyle = goldGrad;
    ctx.fillText('Legendary', 0, line1Y);
    ctx.fillText('Dumplings!', 0, line2Y);

    // 5. 顶部高光细描边（金属光泽）
    ctx.strokeStyle = 'rgba(255, 247, 204, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeText('Legendary', 0, line1Y - 2);
    ctx.strokeText('Dumplings!', 0, line2Y - 2);

    ctx.restore();

    // === 悬浮旋转饺子 ===
    const dumpX = w / 2;
    const floatY = Math.sin(this.menuTimer * 1.5) * 15;
    const dumpY = h * 0.65 + floatY;
    const dumpSize = 220;
    const dumpRotation = this.menuTimer * 0.4;

    ctx.save();
    ctx.translate(dumpX, dumpY);
    ctx.rotate(dumpRotation);

    // 光晕
    const glow = 0.3 + Math.sin(this.menuTimer * 2.5) * 0.15;
    const glowGrad = ctx.createRadialGradient(0, 0, dumpSize * 0.25, 0, 0, dumpSize * 0.8);
    glowGrad.addColorStop(0, `rgba(255, 215, 0, ${glow})`);
    glowGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(-dumpSize, -dumpSize, dumpSize * 2, dumpSize * 2);

    // 饺子精灵图（生饺子）
    const dumpSprite = this.foodSprites['raw_pork_dumpling'];
    if (dumpSprite && dumpSprite.complete && dumpSprite.naturalWidth) {
      const aspect = dumpSprite.naturalWidth / dumpSprite.naturalHeight;
      let dw, dh;
      if (aspect > 1) {
        dw = dumpSize;
        dh = dumpSize / aspect;
      } else {
        dh = dumpSize;
        dw = dumpSize * aspect;
      }
      ctx.drawImage(dumpSprite, -dw / 2, -dh / 2, dw, dh);
    } else {
      // 备用：程序化饺子
      ctx.fillStyle = '#FFF8DC';
      ctx.beginPath();
      ctx.ellipse(0, 0, dumpSize * 0.45, dumpSize * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#DAA520';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    ctx.restore();

    // === 底部模式选择按钮 ===
    this.drawModeSelection(ctx);

    // === 底部提示文字 ===
    const blink = Math.sin(this.menuTimer * 3) > -0.3;
    if (blink) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.font = 'bold 24px Georgia, serif';
      ctx.fillText('Tap the dumpling to start!', w / 2 + 2, h * 0.92 + 2);

      ctx.fillStyle = '#FFE4B5';
      ctx.fillText('Tap the dumpling to start!', w / 2, h * 0.92);
    }
  }

  drawModeSelection(ctx) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const btnW = 200;
    const btnH = 50;
    const btnY = h * 0.75;

    // Single Player 按钮
    this.drawButton(ctx, w/2 - btnW - 20, btnY, btnW, btnH, 'Single Player', this.menuMode === 'single');
    
    // Two Players 按钮
    this.drawButton(ctx, w/2 + 20, btnY, btnW, btnH, 'Two Players', this.menuMode === 'two');
  }

  drawButton(ctx, x, y, w, h, text, isActive) {
    ctx.save();
    
    // 阴影
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.roundRect(x + 4, y + 4, w, h, 10);
    ctx.fill();

    // 按钮主体
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    if (isActive) {
      grad.addColorStop(0, '#FFD700');
      grad.addColorStop(1, '#B8860B');
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
    } else {
      grad.addColorStop(0, '#8B4513');
      grad.addColorStop(1, '#5D4037');
      ctx.strokeStyle = '#DAA520';
      ctx.lineWidth = 1;
    }
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10);
    ctx.fill();
    ctx.stroke();

    // 文字
    ctx.fillStyle = isActive ? '#3E2723' : '#FFE4B5';
    ctx.font = 'bold 20px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + w/2, y + h/2);

    ctx.restore();
  }

  drawLantern(ctx, x, y, w, h) {
    // 绳子
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - h / 2 - 20);
    ctx.lineTo(x, y - h / 2);
    ctx.stroke();

    // 灯笼主体
    ctx.fillStyle = '#D32F2F';
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
    ctx.fill();

    // 金色装饰
    ctx.strokeStyle = '#FFC107';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 流苏
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + h + 15);
    ctx.stroke();
  }

  drawRecipe() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 深色背景
    ctx.fillStyle = '#3E2723';
    ctx.fillRect(0, 0, w, h);

    // 书本尺寸：占据屏幕 85% 的宽度和高度
    const maxBookW = w * 0.85;
    const maxBookH = h * 0.85;

    // 根据图片实际比例调整（假设横向书本）
    let bookW, bookH;
    const aspectRatio = 1.5; // 宽高比，可根据实际图片调整

    if (maxBookW / maxBookH > aspectRatio) {
      // 高度限制
      bookH = maxBookH;
      bookW = bookH * aspectRatio;
    } else {
      // 宽度限制
      bookW = maxBookW;
      bookH = bookW / aspectRatio;
    }

    const bookX = w / 2;
    const bookY = h / 2;

    if (this.recipePageState === 'cover') {
      // 绘制封面，带轻微呼吸效果
      const breathe = 1 + Math.sin(this.recipeTimer * 2) * 0.02;
      this.drawBookCover(ctx, bookX, bookY, bookW * breathe, bookH * breathe);
    } else if (this.recipePageState === 'flipping') {
      // 翻页动画 - 增强版
      let progress = this.recipeFlipProgress;

      // 应用 easeInOutCubic 缓动
      const easedProgress = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      // 添加轻微的上下浮动（抛物线轨迹）
      const floatY = Math.sin(easedProgress * Math.PI) * 15;

      if (progress < 0.5) {
        // 封面翻页：水平缩小到 0，带缓动
        const phaseProgress = progress * 2;
        const scale = 1 - phaseProgress;
        const currentW = bookW * scale;

        // 添加 3D 透视效果
        ctx.save();
        ctx.translate(bookX, bookY + floatY);

        // 透视缩放（封面缩小时整体也略微缩小）
        const perspectiveScale = 1 - phaseProgress * 0.08;
        ctx.scale(perspectiveScale, perspectiveScale);

        // 添加轻微旋转（模拟翻页角度）
        const rotateAngle = phaseProgress * 0.05;
        ctx.rotate(rotateAngle);

        // 透明度变化
        ctx.globalAlpha = 1 - phaseProgress * 0.3;

        this.drawBookCover(ctx, 0, 0, currentW, bookH);
        ctx.restore();

      } else {
        // 内页展开：从 0 展开到完整宽度
        const phaseProgress = (progress - 0.5) * 2;
        const scale = phaseProgress;
        const currentW = bookW * scale;

        // 添加 3D 透视效果
        ctx.save();
        ctx.translate(bookX, bookY + floatY);

        // 透视缩放（内页展开时从小到正常）
        const perspectiveScale = 0.92 + phaseProgress * 0.08;
        ctx.scale(perspectiveScale, perspectiveScale);

        // 添加轻微旋转（反向）
        const rotateAngle = (1 - phaseProgress) * -0.05;
        ctx.rotate(rotateAngle);

        // 透明度变化
        ctx.globalAlpha = 0.7 + phaseProgress * 0.3;

        this.drawBookContent(ctx, 0, 0, currentW, bookH);
        ctx.restore();
      }
    } else {
      // 显示完整内容
      this.drawBookContent(ctx, bookX, bookY, bookW, bookH);
    }
  }

  drawBookCover(ctx, x, y, w, h) {
    const coverImg = this.bookSprites['cover'];

    if (coverImg && coverImg.complete) {
      // 使用图片，保持原始比例，不拉伸
      const imgAspect = coverImg.width / coverImg.height;
      const targetAspect = w / h;

      let drawW, drawH, drawX, drawY;

      if (imgAspect > targetAspect) {
        // 图片更宽，以宽度为准
        drawW = w;
        drawH = w / imgAspect;
        drawX = x - drawW / 2;
        drawY = y - drawH / 2;
      } else {
        // 图片更高，以高度为准
        drawH = h;
        drawW = h * imgAspect;
        drawX = x - drawW / 2;
        drawY = y - drawH / 2;
      }

      // 绘制阴影效果
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;

      ctx.drawImage(coverImg, drawX, drawY, drawW, drawH);

      // 重置阴影
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    } else {
      // 图片未加载时的占位符
      ctx.fillStyle = '#8B0000';
      ctx.fillRect(x - w / 2, y - h / 2, w, h);

      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 50px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Loading...', x, y);
    }
  }

  drawBookContent(ctx, x, y, w, h) {
    const pageImg = this.bookSprites['page'];

    if (pageImg && pageImg.complete) {
      // 使用图片，保持原始比例，不拉伸
      const imgAspect = pageImg.width / pageImg.height;
      const targetAspect = w / h;

      let drawW, drawH, drawX, drawY;

      if (imgAspect > targetAspect) {
        drawW = w;
        drawH = w / imgAspect;
        drawX = x - drawW / 2;
        drawY = y - drawH / 2;
      } else {
        drawH = h;
        drawW = h * imgAspect;
        drawX = x - drawW / 2;
        drawY = y - drawH / 2;
      }

      // 绘制阴影效果
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;

      ctx.drawImage(pageImg, drawX, drawY, drawW, drawH);

      // 重置阴影
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // 在书页上绘制毛笔风格箭头
      this.drawRecipeArrows(ctx, drawX, drawY, drawW, drawH);

      // 在图片下方叠加提示文字
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      const btnW = 280;
      const btnH = 44;
      const btnX = x - btnW / 2;
      const btnY = drawY + drawH + 12;
      ctx.beginPath();
      ctx.roundRect(btnX, btnY, btnW, btnH, 8);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Press SPACE to Ready', x, btnY + btnH / 2);
    } else {
      ctx.fillStyle = '#4E342E';
      ctx.fillRect(x - w / 2, y - h / 2, w / 2, h);
      ctx.fillStyle = '#FFF8DC';
      ctx.fillRect(x, y - h / 2, w / 2, h);
      ctx.fillStyle = '#3E2723';
      ctx.font = 'bold 30px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Loading...', x, y);
    }
  }

  // 绘制菜谱箭头（毛笔风格）
  drawRecipeArrows(ctx, imgX, imgY, imgW, imgH) {
    // 箭头定义：每条箭头由起点、控制点、终点组成（相对于图片的百分比坐标）
    // 根据参考图中的绿色箭头位置
    const arrows = [
      // 1. 面粉袋 → 搅拌机 (↓ 左页上→中)
      { from: [0.16, 0.30], ctrl: [0.12, 0.36], to: [0.14, 0.42] },
      // 2. 蔬菜 → 切菜板 (→ 跨越书脊)
      { from: [0.37, 0.20], ctrl: [0.52, 0.15], to: [0.58, 0.26] },
      // 3. 搅拌机 → 包饺子皮 (↓ 左页中→下)
      { from: [0.14, 0.56], ctrl: [0.13, 0.64], to: [0.18, 0.70] },
      // 4. 肉 → 切菜板 (↗ 中间到右上)
      { from: [0.40, 0.45], ctrl: [0.52, 0.35], to: [0.58, 0.32] },
      // 5. 切菜板 → 蒸锅 (↓ 右页上→中)
      { from: [0.68, 0.42], ctrl: [0.66, 0.50], to: [0.62, 0.56] },
      // 6. 包饺子皮 → 捏饺子 (→ 底部从左到中)
      { from: [0.30, 0.78], ctrl: [0.38, 0.74], to: [0.44, 0.72] },
      // 7. 捏饺子 → 蒸锅 (→↗ 底部到右)
      { from: [0.58, 0.75], ctrl: [0.65, 0.72], to: [0.68, 0.65] },
      // 8. 蒸锅 → 装盘 (→ 右侧)
      { from: [0.78, 0.68], ctrl: [0.82, 0.73], to: [0.84, 0.80] },
    ];

    arrows.forEach(arrow => {
      const fromX = imgX + arrow.from[0] * imgW;
      const fromY = imgY + arrow.from[1] * imgH;
      const ctrlX = imgX + arrow.ctrl[0] * imgW;
      const ctrlY = imgY + arrow.ctrl[1] * imgH;
      const toX = imgX + arrow.to[0] * imgW;
      const toY = imgY + arrow.to[1] * imgH;

      this.drawBrushArrow(ctx, fromX, fromY, ctrlX, ctrlY, toX, toY, imgW);
    });
  }

  // 绘制单条毛笔风格箭头
  drawBrushArrow(ctx, x0, y0, cx, cy, x1, y1, refW) {
    ctx.save();

    // 根据图片宽度缩放线条粗细
    const baseWidth = refW * 0.006;
    const maxWidth = baseWidth * 2.8;
    const minWidth = baseWidth * 0.6;

    // 采样贝塞尔曲线上的点
    const segments = 30;
    const points = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const px = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1;
      const py = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1;
      points.push({ x: px, y: py });
    }

    // 毛笔笔触：起笔细，中间粗，收笔细
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < points.length - 1; i++) {
      const t = i / (points.length - 1);

      // 毛笔压力曲线：起笔压力小→渐增→中间最大→渐减→收笔压力小
      let pressure;
      if (t < 0.15) {
        // 起笔：快速加压
        pressure = 0.3 + (t / 0.15) * 0.7;
      } else if (t < 0.6) {
        // 中段：饱满
        pressure = 1.0;
      } else {
        // 收笔：缓慢减压
        pressure = 1.0 - ((t - 0.6) / 0.4) * 0.6;
      }

      const width = minWidth + (maxWidth - minWidth) * pressure;

      // 颜色：墨色，中间浓，两端稍淡
      const alpha = 0.5 + pressure * 0.35;
      ctx.strokeStyle = `rgba(40, 30, 20, ${alpha})`;
      ctx.lineWidth = width;

      ctx.beginPath();
      ctx.moveTo(points[i].x, points[i].y);
      ctx.lineTo(points[i + 1].x, points[i + 1].y);
      ctx.stroke();
    }

    // 绘制毛笔风格箭头
    const lastP = points[points.length - 1];
    const prevP = points[points.length - 4] || points[points.length - 2];

    const angle = Math.atan2(lastP.y - prevP.y, lastP.x - prevP.x);
    const headLen = refW * 0.025;
    const headAngle = 0.45;

    // 箭头两翼（每翼用多段模拟毛笔笔触）
    for (let side = -1; side <= 1; side += 2) {
      const wingAngle = angle + Math.PI + side * headAngle;
      const tipX = lastP.x;
      const tipY = lastP.y;
      const endX = tipX + Math.cos(wingAngle) * headLen;
      const endY = tipY + Math.sin(wingAngle) * headLen;

      const wingSegments = 8;
      for (let i = 0; i < wingSegments; i++) {
        const t = i / wingSegments;
        const t2 = (i + 1) / wingSegments;

        // 箭头翼的压力：尖端粗→末端细
        const wingPressure = 1.0 - t * 0.7;
        const wingWidth = maxWidth * wingPressure * 0.8;
        const wingAlpha = 0.7 + wingPressure * 0.2;

        ctx.strokeStyle = `rgba(40, 30, 20, ${wingAlpha})`;
        ctx.lineWidth = wingWidth;

        const sx = tipX + (endX - tipX) * t;
        const sy = tipY + (endY - tipY) * t;
        const ex = tipX + (endX - tipX) * t2;
        const ey = tipY + (endY - tipY) * t2;

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  drawCountdownOverlay() {
    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const w = this.canvas.width;
    const h = this.canvas.height;

    // 半透明遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, w, h);

    if (this.countdownTimer > 0) {
      const num = Math.ceil(this.countdownTimer);
      const pulse = 1 + (1 - this.countdownPulse) * 0.5; // 从大到小
      const alpha = this.countdownPulse; // 淡出

      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(pulse, pulse);
      ctx.globalAlpha = alpha;

      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 8;
      ctx.font = 'bold 200px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeText(num.toString(), 0, 0);
      ctx.fillText(num.toString(), 0, 0);

      ctx.restore();
    } else {
      // 显示 "COOK!"
      ctx.fillStyle = '#FFD700';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 6;
      ctx.font = 'bold 120px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeText('COOK!', w / 2, h / 2);
      ctx.fillText('COOK!', w / 2, h / 2);
    }

    ctx.restore();
  }

  drawUI() {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.drawLeftSidebar();
    this.drawRightSidebar();
    this.drawScoreEffects();

    // gameOver 现在由 STATE_GAMEOVER 处理

    this.ctx.restore();
  }

  drawLeftSidebar() {
    const ctx = this.ctx;
    const w = CONFIG.SIDEBAR_WIDTH;
    const h = this.canvas.height;

    // 深红色背景
    ctx.fillStyle = '#8B0000';
    ctx.fillRect(0, 0, w, h);

    // 金色边框（右边）
    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(w - 2, 0);
    ctx.lineTo(w - 2, h);
    ctx.stroke();

    // 内部金色装饰线
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w - 8, 10);
    ctx.lineTo(w - 8, h - 10);
    ctx.stroke();

    this.drawOrders();
  }

  drawRightSidebar() {
    const ctx = this.ctx;
    const rightX = this.canvas.width - CONFIG.SIDEBAR_WIDTH;
    const w = CONFIG.SIDEBAR_WIDTH;
    const h = this.canvas.height;

    // 深红色背景
    ctx.fillStyle = '#8B0000';
    ctx.fillRect(rightX, 0, w, h);

    // 金色边框（左边）
    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(rightX + 2, 0);
    ctx.lineTo(rightX + 2, h);
    ctx.stroke();

    // 内部金色装饰线
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rightX + 8, 10);
    ctx.lineTo(rightX + 8, h - 10);
    ctx.stroke();

    const centerX = rightX + w / 2;
    let currentY = 55;

    ctx.shadowColor = 'black';
    ctx.shadowBlur = 3;
    ctx.textAlign = 'center';

    // === OPEN HOURS (营业时间) ===
    ctx.fillStyle = '#DAA520';
    ctx.font = 'bold 18px Georgia, serif';
    ctx.fillText('OPEN HOURS', centerX, currentY);

    currentY += 35;
    const minutes = Math.floor(this.gameTime / 60);
    const seconds = Math.floor(this.gameTime % 60);
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    let timeColor = '#FFFFFF';
    if (this.gameTime < 60) timeColor = '#FFD700';
    if (this.gameTime < 30) timeColor = '#FF6347';

    ctx.fillStyle = timeColor;
    ctx.font = 'bold 44px Georgia, serif';
    ctx.fillText(timeStr, centerX, currentY);

    // === 分割装饰线 ===
    currentY += 25;
    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rightX + 20, currentY);
    ctx.lineTo(rightX + w - 20, currentY);
    ctx.stroke();

    // === REVENUE (营业收入) ===
    currentY += 30;
    ctx.fillStyle = '#DAA520';
    ctx.font = 'bold 18px Georgia, serif';
    ctx.fillText('REVENUE', centerX, currentY);

    currentY += 38;
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 48px Georgia, serif';
    ctx.fillText(`$${this.score}`, centerX, currentY);

    // === 分割装饰线 ===
    currentY += 22;
    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rightX + 20, currentY);
    ctx.lineTo(rightX + w - 20, currentY);
    ctx.stroke();

    // === SERVED (完成订单) ===
    currentY += 30;
    ctx.fillStyle = '#DAA520';
    ctx.font = 'bold 18px Georgia, serif';
    ctx.fillText('SERVED', centerX, currentY);

    currentY += 35;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 40px Georgia, serif';
    ctx.fillText(`${this.dishesServed}`, centerX, currentY);

    // === 分割装饰线 ===
    currentY += 22;
    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rightX + 20, currentY);
    ctx.lineTo(rightX + w - 20, currentY);
    ctx.stroke();

    // === CONTROLS ===
    currentY += 28;
    ctx.fillStyle = '#DAA520';
    ctx.font = 'bold 16px Georgia, serif';
    ctx.fillText('CONTROLS', centerX, currentY);

    currentY += 26;
    ctx.fillStyle = '#FFE4B5';
    ctx.font = 'bold 14px Georgia, serif';
    ctx.fillText('WASD', centerX, currentY);
    currentY += 18;
    ctx.font = '12px Georgia, serif';
    ctx.fillStyle = '#DEB887';
    ctx.fillText('Move', centerX, currentY);

    currentY += 26;
    ctx.fillStyle = '#FFE4B5';
    ctx.font = 'bold 14px Georgia, serif';
    ctx.fillText('E / SPACE', centerX, currentY);
    currentY += 18;
    ctx.font = '11px Georgia, serif';
    ctx.fillStyle = '#DEB887';
    ctx.fillText('Tap: Pick/Drop', centerX, currentY);
    currentY += 16;
    ctx.fillText('Hold: Chop/Cook', centerX, currentY);

    ctx.shadowBlur = 0;

    // 底部金色装饰星星
    this.drawDecorativeStar(ctx, centerX, h - 60, 30);
  }

  drawDecorativeStar(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x, y);

    // 金色星星
    ctx.fillStyle = '#DAA520';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 10;

    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const px = Math.cos(angle) * size;
      const py = Math.sin(angle) * size;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // 内部小星星
    ctx.fillStyle = '#FFD700';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const px = Math.cos(angle) * size * 0.4;
      const py = Math.sin(angle) * size * 0.4;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  drawOrders() {
    const orders = this.orderManager.orders;
    const ticketWidth = 210;
    const ticketHeight = 255;
    const ticketSpacing = 26;
    const startX = (CONFIG.SIDEBAR_WIDTH - ticketWidth) / 2;
    const startY = 58;

    // 标题样式 - 金色中国风
    this.ctx.fillStyle = '#DAA520';
    this.ctx.font = 'bold 24px Georgia, serif';
    this.ctx.textAlign = 'center';
    this.ctx.shadowColor = 'black';
    this.ctx.shadowBlur = 3;
    this.ctx.fillText('ORDERS', CONFIG.SIDEBAR_WIDTH / 2, 32);
    this.ctx.shadowBlur = 0;

    for (let i = 0; i < orders.length; i++) {
      const x = startX;
      const y = startY + i * (ticketHeight + ticketSpacing);
      this.drawOrderTicket(orders[i], x, y, ticketWidth, ticketHeight);
    }
  }

  drawOrderTicket(order, x, y, w, h) {
    const ctx = this.ctx;
    const isBlinking = order.isBlinking();
    const blinkVisible = !isBlinking || Math.floor(this.gameTime * 3) % 2 === 0;
    const pct = order.getTimePercent();
    const margin = 10;  // 上下左右边距

    // === 0. 悬挂时间条（卡片上方）+ 表情 ===
    const hangBarH = 12;
    const hangBarY = y - hangBarH - 8;

    // 表情（时间条左侧）
    const emojiX = x + 14;
    const emojiY = hangBarY + hangBarH / 2;
    this.drawCustomerEmoji(ctx, emojiX, emojiY, pct, 11);

    // 时间条
    const hangBarX = x + 32;
    const hangBarW = w - 42;

    ctx.fillStyle = '#3E2723';
    ctx.beginPath();
    ctx.roundRect(hangBarX, hangBarY, hangBarW, hangBarH, 5);
    ctx.fill();

    // 时间条进度
    let barColor;
    if (pct > 0.66) barColor = '#66BB6A';
    else if (pct > 0.33) barColor = '#FFCA28';
    else barColor = '#EF5350';

    if (pct > 0) {
      ctx.fillStyle = barColor;
      ctx.beginPath();
      ctx.roundRect(hangBarX + 1, hangBarY + 1, (hangBarW - 2) * pct, hangBarH - 2, 4);
      ctx.fill();
    }

    // 悬挂绳子
    ctx.strokeStyle = '#8D6E63';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 40, hangBarY + hangBarH);
    ctx.lineTo(x + 40, y + 4);
    ctx.moveTo(x + w - 40, hangBarY + hangBarH);
    ctx.lineTo(x + w - 40, y + 4);
    ctx.stroke();

    if (!blinkVisible) {
      ctx.globalAlpha = 0.3;
    }

    // 卡片外框（金色边框）
    ctx.fillStyle = '#DAA520';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill();

    // 内部暖色区域
    ctx.fillStyle = '#FFF8DC';
    ctx.beginPath();
    ctx.roundRect(x + 3, y + 3, w - 6, h - 6, 6);
    ctx.fill();

    ctx.globalAlpha = 1;

    // 获取原材料信息
    const recipe = this.getOrderRecipe(order.recipeName);
    const preparedItems = this.getPreparedIngredients();
    const ingredientPairs = this.getIngredientPairs(order.recipeName);

    // 检查所有加工材料是否都准备好
    let allPrepared = true;
    for (const proc of recipe.processedIngredients) {
      if (!preparedItems.includes(proc)) {
        allPrepared = false;
        break;
      }
    }

    // 检查是否已有生饺子
    const rawDumplingType = 'raw_' + order.recipeName;
    const hasRawDumpling = preparedItems.includes(rawDumplingType);

    // 检查是否有open饺子
    const hasOpenDumpling = preparedItems.some(item =>
      item.startsWith('open_') && item.endsWith('_dumpling')
    );

    // === 1. 成品展示区域（顶部，视觉重心） ===
    const productY = y + margin;
    const productH = 75;
    ctx.fillStyle = '#5D4037';
    ctx.beginPath();
    ctx.roundRect(x + margin, productY + 10, w - margin * 2, productH, 6);  // 背景下移10px
    ctx.fill();

    // 成品图片（大而突出，位置不变）
    const platedType = 'plated_' + order.recipeName;
    this.drawOrderItem(platedType, x + w / 2, productY + productH / 2, 2.3);

    // === 2. 食材区域布局（固定间隙，居中） ===
    const pairCount = ingredientPairs.length;
    const boxSize = 50;
    const boxGap = 20;  // 食物间间隙固定20px
    const contentWidth = w - margin * 2;  // 190px

    // 图标组总宽度，居中显示
    const totalBoxWidth = pairCount * boxSize + (pairCount - 1) * boxGap;
    const startOffset = (contentWidth - totalBoxWidth) / 2;

    const rawY = productY + productH + 40;  // 成品区到食材间距40px
    const arrowH = 10;
    const procY = rawY + boxSize + arrowH;

    for (let i = 0; i < pairCount; i++) {
      const pair = ingredientPairs[i];
      // 居中分布：左边距 + 偏移 + i*(boxSize+gap)
      const boxX = x + margin + startOffset + i * (boxSize + boxGap);
      const centerX = boxX + boxSize / 2;

      // === 原材料圆角方形背景 ===
      ctx.fillStyle = '#D4A574';
      ctx.beginPath();
      ctx.roundRect(boxX, rawY, boxSize, boxSize, 6);
      ctx.fill();
      ctx.strokeStyle = '#DAA520';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 原材料图标（上移10px）
      const iconScale = 1.3;
      this.drawOrderItem(pair.raw, centerX, rawY + boxSize / 2 - 10, iconScale);

      // 箭头
      const arrowY = rawY + boxSize + 2;
      ctx.fillStyle = '#DAA520';
      ctx.beginPath();
      ctx.moveTo(centerX - 6, arrowY);
      ctx.lineTo(centerX + 6, arrowY);
      ctx.lineTo(centerX, arrowY + 7);
      ctx.closePath();
      ctx.fill();
    }

    // === 3. 加工材料区域 或 状态提示 ===
    if (hasRawDumpling) {
      // 显示煮饺子提示
      ctx.fillStyle = '#1565C0';
      ctx.font = 'bold 14px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Cook the dumpling!', x + w / 2, procY + boxSize / 2);
    } else if (hasOpenDumpling || allPrepared) {
      // 显示包饺子提示
      ctx.fillStyle = '#2E7D32';
      ctx.font = 'bold 14px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Wrap into dumpling!', x + w / 2, procY + boxSize / 2);
    } else {
      // 正常显示加工材料图标（居中分布）
      for (let i = 0; i < pairCount; i++) {
        const pair = ingredientPairs[i];
        const boxX = x + margin + startOffset + i * (boxSize + boxGap);
        const centerX = boxX + boxSize / 2;
        const isPrepared = preparedItems.includes(pair.processed);
        const iconScale = 1.3;

        // 加工材料圆角方形背景
        ctx.fillStyle = isPrepared ? '#A5D6A7' : '#B0BEC5';
        ctx.beginPath();
        ctx.roundRect(boxX, procY, boxSize, boxSize, 6);
        ctx.fill();
        ctx.strokeStyle = isPrepared ? '#4CAF50' : '#90A4AE';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 加工材料图标（上移10px）
        ctx.globalAlpha = isPrepared ? 1.0 : 0.5;
        this.drawOrderItem(pair.processed, centerX, procY + boxSize / 2 - 10, iconScale);
        ctx.globalAlpha = 1.0;

        // 已准备好的打勾标记（跟随图标上移10px）
        if (isPrepared) {
          ctx.strokeStyle = '#1B5E20';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(centerX - 8, procY + boxSize / 2 - 10 + 2);
          ctx.lineTo(centerX - 2, procY + boxSize / 2 - 10 + 8);
          ctx.lineTo(centerX + 10, procY + boxSize / 2 - 10 - 6);
          ctx.stroke();
        }
      }
    }

    // 闪烁边框
    if (isBlinking) {
      ctx.strokeStyle = '#FF5722';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 8);
      ctx.stroke();
    }
  }

  getIngredientPairs(recipeName) {
    const pairs = {
      'pork_dumpling': [
        { raw: 'flour_raw', processed: 'wrapper' },
        { raw: 'pork', processed: 'minced_pork' }
      ],
      'veggie_dumpling': [
        { raw: 'flour_raw', processed: 'wrapper' },
        { raw: 'cabbage', processed: 'chopped_cabbage' }
      ],
      'combo_dumpling': [
        { raw: 'flour_raw', processed: 'wrapper' },
        { raw: 'pork', processed: 'minced_pork' },
        { raw: 'cabbage', processed: 'chopped_cabbage' }
      ]
    };
    return pairs[recipeName] || pairs['pork_dumpling'];
  }

  getOrderRecipe(recipeName) {
    // 返回原材料和加工后材料
    if (recipeName === 'pork_dumpling') {
      return {
        rawIngredients: ['flour_raw', 'pork'],
        processedIngredients: ['wrapper', 'minced_pork']
      };
    } else if (recipeName === 'veggie_dumpling') {
      return {
        rawIngredients: ['flour_raw', 'cabbage'],
        processedIngredients: ['wrapper', 'chopped_cabbage']
      };
    } else {
      // combo_dumpling
      return {
        rawIngredients: ['flour_raw', 'pork', 'cabbage'],
        processedIngredients: ['wrapper', 'minced_pork', 'chopped_cabbage']
      };
    }
  }

  drawCustomerEmoji(ctx, x, y, timePercent, customSize) {
    ctx.save();
    ctx.translate(x, y);

    const size = customSize || 14;
    const scale = size / 14;
    ctx.scale(scale, scale);

    // 脸的底色
    ctx.fillStyle = '#FFEB3B';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FBC02D';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 根据时间百分比选择表情
    if (timePercent > 0.66) {
      // 开心 😊
      ctx.strokeStyle = '#5D4037';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-5, -3, 3, Math.PI * 0.2, Math.PI * 0.8);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(5, -3, 3, Math.PI * 0.2, Math.PI * 0.8);
      ctx.stroke();
      ctx.fillStyle = '#5D4037';
      ctx.beginPath();
      ctx.arc(0, 4, 6, 0, Math.PI);
      ctx.fill();
    } else if (timePercent > 0.33) {
      // 正常 😐
      ctx.fillStyle = '#5D4037';
      ctx.beginPath();
      ctx.arc(-5, -2, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(5, -2, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#5D4037';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-5, 5);
      ctx.lineTo(5, 5);
      ctx.stroke();
    } else if (timePercent > 0) {
      // 不耐烦 😠
      ctx.strokeStyle = '#5D4037';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-8, -6);
      ctx.lineTo(-3, -4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(8, -6);
      ctx.lineTo(3, -4);
      ctx.stroke();
      ctx.fillStyle = '#5D4037';
      ctx.beginPath();
      ctx.arc(-5, -1, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(5, -1, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#5D4037';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 10, 5, Math.PI * 1.2, Math.PI * 1.8);
      ctx.stroke();
    } else {
      // 愤怒 😡
      ctx.fillStyle = '#FF5722';
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#E64A19';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.strokeStyle = '#5D4037';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-9, -5);
      ctx.lineTo(-2, -2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(9, -5);
      ctx.lineTo(2, -2);
      ctx.stroke();
      ctx.fillStyle = '#5D4037';
      ctx.beginPath();
      ctx.arc(-5, 0, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(5, 0, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#5D4037';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 12, 6, Math.PI * 1.2, Math.PI * 1.8);
      ctx.stroke();
    }

    ctx.restore();
  }

  getPreparedIngredients() {
    // 检查地图上和玩家手上已准备好的原材料
    const prepared = [];

    // 检查玩家手上的物品
    if (this.player.heldItem) {
      prepared.push(this.player.heldItem.type);
    }

    // 检查地图上所有工作站的物品
    for (let r = 0; r < this.map.rows; r++) {
      for (let c = 0; c < this.map.cols; c++) {
        const station = this.map.grid[r][c];
        if (station && station.item) {
          prepared.push(station.item.type);
        }
      }
    }

    return prepared;
  }


  drawOrderItem(type, x, y, scale) {
    const oldTransform = this.ctx.getTransform();
    this.ctx.translate(x, y);
    this.ctx.scale(scale, scale);
    this.player.drawItem(this.ctx, type, 0, 0);
    this.ctx.setTransform(oldTransform);
  }

  drawScoreEffects() {
    const effect = this.orderManager.successEffect;
    if (!effect) return;

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2 - 100;
    const fadeProgress = effect.timer / 1.0;

    this.ctx.globalAlpha = fadeProgress;

    // Display base score
    this.ctx.fillStyle = '#4caf50';
    this.ctx.strokeStyle = 'white';
    this.ctx.lineWidth = 4;
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';

    if (effect.bonus > 0) {
      this.ctx.strokeText(`+${effect.baseScore} (+${effect.bonus} Bonus!)`, centerX, centerY);
      this.ctx.fillText(`+${effect.baseScore} (+${effect.bonus} Bonus!)`, centerX, centerY);
    } else {
      this.ctx.strokeText(`+${effect.baseScore}`, centerX, centerY);
      this.ctx.fillText(`+${effect.baseScore}`, centerX, centerY);
    }

    this.ctx.globalAlpha = 1;
  }

  drawGameOverOverlay() {
    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    // 半透明遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, w, h);

    // === "打烊" 阶段 ===
    if (this.gameOverPhase === 'timesup') {
      const alpha = Math.min(1, this.gameOverTimer * 3);
      const scale = 1 + Math.max(0, (0.3 - this.gameOverTimer)) * 3;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;

      // 阴影
      ctx.fillStyle = '#000';
      ctx.font = 'bold 100px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText("TIME'S UP", 4, 4);

      // 白色主体
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText("TIME'S UP", 0, 0);

      ctx.restore();
      ctx.restore();
      return;
    }

    // === 账本相关阶段 ===
    // 账本尺寸和位置
    const ledgerW = 420;
    const ledgerH = 500;
    const ledgerX = cx - ledgerW / 2;
    const ledgerY = cy - ledgerH / 2;

    // 账本展开动画
    let ledgerScale = 1;
    if (this.gameOverPhase === 'ledger') {
      ledgerScale = Math.min(1, this.gameOverTimer * 2);
    }

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(ledgerScale, ledgerScale);
    ctx.translate(-cx, -cy);

    // 账本背景 - 深褐色复古风
    ctx.fillStyle = '#3E2723';
    ctx.beginPath();
    ctx.roundRect(ledgerX, ledgerY, ledgerW, ledgerH, 12);
    ctx.fill();

    // 金色外边框
    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(ledgerX, ledgerY, ledgerW, ledgerH, 12);
    ctx.stroke();

    // 内边框
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(ledgerX + 12, ledgerY + 12, ledgerW - 24, ledgerH - 24, 8);
    ctx.stroke();

    // 内部米黄色纸张区域
    ctx.fillStyle = '#FFF8DC';
    ctx.beginPath();
    ctx.roundRect(ledgerX + 16, ledgerY + 16, ledgerW - 32, ledgerH - 32, 6);
    ctx.fill();

    // === 标题 ===
    const contentX = cx;
    let rowY = ledgerY + 60;

    ctx.fillStyle = '#3E2723';
    ctx.font = 'bold 36px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Daily Revenue', contentX, rowY);

    // 标题下划线装饰
    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ledgerX + 60, rowY + 25);
    ctx.lineTo(ledgerX + ledgerW - 60, rowY + 25);
    ctx.stroke();

    rowY += 65;

    // === 数据行 ===
    ctx.textAlign = 'left';
    ctx.font = '24px Georgia, serif';
    ctx.fillStyle = '#5D4037';

    // 完成订单
    ctx.fillText('Orders Done', ledgerX + 40, rowY);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#3E2723';
    ctx.font = 'bold 28px Georgia, serif';
    ctx.fillText(`${this.dishesServed}`, ledgerX + ledgerW - 40, rowY);

    rowY += 55;

    // 连击奖励
    ctx.textAlign = 'left';
    ctx.font = '24px Georgia, serif';
    ctx.fillStyle = '#5D4037';
    ctx.fillText('Combo Bonus', ledgerX + 40, rowY);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#3E2723';
    ctx.font = 'bold 28px Georgia, serif';
    ctx.fillText(`${this.tipsEarned}`, ledgerX + ledgerW - 40, rowY);

    rowY += 45;

    // 虚线分割
    ctx.strokeStyle = '#8D6E63';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(ledgerX + 35, rowY);
    ctx.lineTo(ledgerX + ledgerW - 35, rowY);
    ctx.stroke();
    ctx.setLineDash([]);

    rowY += 45;

    // === 总营收 ===
    ctx.textAlign = 'center';
    ctx.font = 'bold 28px Georgia, serif';
    ctx.fillStyle = '#5D4037';
    ctx.fillText('Total', contentX, rowY);

    rowY += 55;

    // 动态滚动数字
    const showScore = Math.floor(this.displayScore);
    ctx.font = 'bold 60px Georgia, serif';
    ctx.fillStyle = '#DAA520';
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 2;
    ctx.strokeText(`${showScore}`, contentX, rowY);
    ctx.fillText(`${showScore}`, contentX, rowY);

    // === 盖章区域 ===
    if (this.gameOverPhase === 'stamp' || this.gameOverPhase === 'restart') {
      // 计算评级
      let rating, ratingText;
      if (this.score >= 350) {
        rating = 3;
        ratingText = 'PROSPER';
      } else if (this.score >= 200) {
        rating = 2;
        ratingText = 'BOOMING';
      } else {
        rating = 1;
        ratingText = 'HUMBLE';
      }

      // 星星显示
      const starY = rowY + 50;
      ctx.font = '30px Arial';
      ctx.textAlign = 'center';
      let stars = '';
      for (let i = 0; i < 3; i++) {
        stars += i < rating ? '★' : '☆';
      }
      ctx.fillStyle = '#DAA520';
      ctx.fillText(stars, contentX, starY);

      // 印章
      const stampX = ledgerX + ledgerW - 80;
      const stampY = ledgerY + ledgerH - 100;
      const stampSize = 60;

      ctx.save();
      ctx.translate(stampX, stampY);
      ctx.scale(this.stampScale, this.stampScale);
      ctx.rotate(-0.2); // 微微倾斜

      // 红色方形印章
      ctx.strokeStyle = '#C62828';
      ctx.lineWidth = 4;
      ctx.fillStyle = 'rgba(198, 40, 40, 0.15)';
      ctx.beginPath();
      ctx.roundRect(-stampSize / 2, -stampSize / 2, stampSize, stampSize, 4);
      ctx.fill();
      ctx.stroke();

      // 印章文字
      ctx.fillStyle = '#C62828';
      ctx.font = 'bold 16px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ratingText, 0, 0);

      ctx.restore();
    }

    ctx.restore(); // 还原 ledgerScale 变换

    // === 重开提示 + 粒子 ===
    if (this.gameOverPhase === 'restart') {
      // 金色粒子
      this.gameOverParticles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      });
      ctx.globalAlpha = 1;

      // 闪烁重开文字
      const blink = Math.sin(this.gameOverTimer * 4) > 0;
      if (blink) {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 24px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Press SPACE to Reopen', cx, cy + ledgerH / 2 + 40);
      }
    }

    ctx.restore();
  }
}

window.addEventListener('load', () => {
  new Game();
});
