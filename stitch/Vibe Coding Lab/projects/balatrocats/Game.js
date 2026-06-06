class Game {
    constructor(canvas, stageId = 1, deck = ['basic'], rpgData = null) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      
      // Set canvas to 75% of window height
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight * 0.75;
      this.width = this.canvas.width;
      this.height = this.canvas.height;
      
      // Stage and Deck configuration
      this.stageId = stageId;
      this.deck = deck;
      this.stageConfig = (typeof LevelData !== 'undefined') ? LevelData.getStageConfig(stageId) : null;
      
      // Load RPG data (from parameter or use defaults)
      const defaultRpgData = {
        unlockedUnits: { basic: true, tank: false, lizard: false },
        unitLevels: { basic: 1, tank: 1, lizard: 1 },
        baseLevel: 1,
        runUnlockedUnits: [],
        runUnitUpgrades: {
          basic: { hp: 0, atk: 0 },
          tank: { hp: 0, atk: 0 },
          lizard: { hp: 0, atk: 0 }
        }
      };
      const saveData = rpgData || defaultRpgData;
      this.unlockedUnits = saveData.unlockedUnits || defaultRpgData.unlockedUnits;
      this.unitLevels = saveData.unitLevels || defaultRpgData.unitLevels;
      this.baseLevel = saveData.baseLevel || 1;
      this.runUnitUpgrades = saveData.runUnitUpgrades || defaultRpgData.runUnitUpgrades;
      this.runBuffs = saveData.runBuffs || {
        catAttackSpeedBonus: 0,
        catDamageBonus: 0,
        catHpBonus: 0,              // 新增：全军生命加成
        baseMaxHpBonus: 0,
        baseAutoHeal: 0,            // 新增：基地自动回血（百分比/秒）
        lizardRangeBonus: 0,
        startingMoneyBonus: 0,
        moneyGenRateBonus: 0,
        conversionRate: 0.05,       // 提升：结算金币转换率（从1%提升至5%）
        unitLimitBonus: 0,          // 新增：人口上限加成
        spawnCdReduction: 0,        // 新增：召唤CD缩减（百分比）
        xpGainMultiplier: 0,        // 新增：经验获取加成（百分比）
        enemyStatMultiplier: 0,     // 新增：敌方属性削弱（百分比）
        enemySpeedMultiplier: 0     // 新增：敌方移速削弱（百分比）
      };
      
      // ========== 数值系统核心：Baseline 属性包 ==========
      // 所有单位的基础属性（未经 RPG 和 Buff 加成）
      this.unitBaseline = {
        // 玩家单位
        basic: { hp: 70, atk: 8, range: 50, cd: 15, speed: 0.6, size: 30, cost: 35 },
        tank:  { hp: 700, atk: 6,  range: 30, cd: 50, speed: 0.35, size: 50, cost: 80 },
        lizard:{ hp: 40,  atk: 25, range: 220, cd: 90, speed: 0.6, size: 35, cost: 200 },
        assassin: { hp: 55, atk: 85, range: 40, cd: 40, speed: 1.1, size: 28, cost: 120 },
        shaman:   { hp: 85, atk: 10, range: 150, cd: 60, speed: 0.5, size: 32, cost: 140 },
        berserker:{ hp: 210, atk: 28, range: 45, cd: 35, speed: 0.8, size: 38, cost: 160 },
        engineer: { hp: 70, atk: 4,  range: 60, cd: 120, speed: 0.4, size: 30, cost: 160 },
        titan:    { hp: 1750, atk: 85, range: 40, cd: 100, speed: 0.3, size: 70, cost: 400 },
        // 敌人单位 (提升 XP 产出，特别是前期单位)
        dog:      { hp: 100, atk: 10, range: 45, cd: 35, speed: 0.6, size: 30, xp: 15 },
        snake:    { hp: 40,  atk: 8,  range: 40, cd: 20, speed: 1.2, size: 25, xp: 20 },
        hippo:    { hp: 800, atk: 15, range: 60, cd: 60, speed: 0.35, size: 60, xp: 120 },
        elephant: { hp: 450, atk: 25, range: 220, cd: 80, speed: 0.25, size: 70, xp: 80 },
        // --- 新增机制型敌人 ---
        bee:      { hp: 40,  atk: 60, range: 40,  cd: 10, speed: 1.2, size: 25, xp: 30, isExplosive: true },
        crab:     { hp: 500, atk: 15, range: 45,  cd: 50, speed: 0.3, size: 45, xp: 60, hitShield: 8 },
        rabbit:   { hp: 150, atk: 5,  range: 300, cd: 90, speed: 0.5, size: 30, xp: 100, healPower: 50 }
      };
      
      // RPG 成长系数 (指数级增长: 1.15^(Level-1))
      this.RPG_GROWTH_RATE = 1.15;
      
      // 预计算玩家单位的战场属性 (应用 RPG 等级加成 + Run 内升级 + Run Buff)
      this.playerStats = {};
      const playerUnitTypes = ['basic', 'tank', 'lizard', 'assassin', 'shaman', 'berserker', 'engineer', 'titan'];
      for (let unitType of playerUnitTypes) {
        const base = this.unitBaseline[unitType];
        const level = this.unitLevels[unitType] || 1;
        const rpgMultiplier = Math.pow(this.RPG_GROWTH_RATE, level - 1);
        
        // 基础属性（RPG 加成）
        const rpgHp = Math.floor(base.hp * rpgMultiplier);
        const rpgAtk = Math.floor(base.atk * rpgMultiplier);
        
        // 应用 Run 内固定升级
        const runUpgrade = this.runUnitUpgrades[unitType] || { hp: 0, atk: 0 };
        
        // 应用 Run 内百分比升级（从商店购买的全属性升级卡）
        const percentBonus = runUpgrade.percentBonus || 0;
        const percentMultiplier = 1 + percentBonus;
        
        // 应用全局 Buff（现在全部改为百分比）
        const runAtkMultiplier = 1 + (this.runBuffs.catDamageBonus || 0);  // 改为百分比
        const runRangeMultiplier = (unitType === 'lizard' || unitType === 'shaman') ? (1 + (this.runBuffs.lizardRangeBonus || 0)) : 1;  // 蜥蜴和萨满享受射程加成
        const runCdMultiplier = 1 - (this.runBuffs.catAttackSpeedBonus || 0);
        
        // 应用关卡特性 (Stage Modifiers)
        let stageAtkMult = 1;
        let stageRangeMult = 1;
        let stageSpeedMult = 1;
        
        if (this.stageConfig && this.stageConfig.modifiers) {
          const mods = this.stageConfig.modifiers;
          if (mods.damageMultiplier) stageAtkMult *= mods.damageMultiplier;
          if (mods.rangeMultiplier) stageRangeMult *= mods.rangeMultiplier;
          if (mods.moveSpeedMultiplier) stageSpeedMult *= mods.moveSpeedMultiplier;
          if (mods.allStatsMultiplier) {
            stageAtkMult *= mods.allStatsMultiplier;
            stageRangeMult *= mods.allStatsMultiplier;
            stageSpeedMult *= mods.allStatsMultiplier;
          }
        }
        
        this.playerStats[unitType] = {
          hp: Math.max(1, Math.floor((rpgHp + runUpgrade.hp) * percentMultiplier)),
          atk: Math.max(1, Math.floor((rpgAtk + runUpgrade.atk) * percentMultiplier * runAtkMultiplier * stageAtkMult)),
          range: Math.max(10, Math.floor(base.range * percentMultiplier * runRangeMultiplier * stageRangeMult)),
          cd: Math.max(1, Math.floor(base.cd * percentMultiplier * runCdMultiplier)),
          speed: base.speed * stageSpeedMult,
          size: base.size,
          cost: base.cost
        };
      }
      
      // 基地 RPG 加成 + Run Buff
      this.baseRpgMultiplier = Math.pow(this.RPG_GROWTH_RATE, this.baseLevel - 1);
      this.runBaseHpBonus = this.runBuffs.baseMaxHpBonus || 0;
      
      // 临时buff（战斗升级，每关重置）
      this.battleBuffs = {
        catAttackSpeedBonus: 0,      // 攻速加成百分比
        cannonCooldownBonus: 0,      // 炮台冷却减少百分比
        lizardRangeBonus: 0,         // 蜥蜴猫射程百分比加成
        catDamageBonus: 0,           // 攻击力百分比加成
        catHpBonus: 0,               // 新增：生命值百分比加成
        moveSpeedBonus: 0,           // 新增：移速百分比加成
        baseMaxHpBonus: 0,           // 基地血量固定加成
        maxMoneyBonus: 0,            // 钱包上限固定加成
        killGoldBonus: 0,            // 击杀金币加成
        legionBonus: 0,              // 协同加成：每个猫咪增加的攻击力百分比
        glassCannonDamage: 0,        // 玻璃大炮：攻击力百分比加成
        glassCannonHpPenalty: 0,     // 玻璃大炮：生命值百分比惩罚
        counterMultiplierBonus: 0,   // 新增：克制伤害倍率加成
        reflectDamage: 0,            // 新增：荆棘反伤百分比
        towerRangeBonus: 0,          // 新增：防御塔反击范围加成
        towerAtkBonus: 0,            // 新增：防御塔反击伤害加成
        xpToNextLevelReduction: 0,   // 新增：升级经验需求减少（百分比）
        compoundInterestRate: 0,     // 新增：利滚利：金币余额影响增长率
        backToWallBonus: 0,          // 新增：背水一战：血量损失影响伤害
        vengeanceBonus: 0,           // 新增：复仇之火：阵亡影响攻速
        sentinelBonus: 0,            // 新增：守望者：距离基地影响防御
        spreadingFearBonus: 0,       // 新增：恐惧蔓延：击杀影响敌方速度
        greedyCurseActive: false,    // 新增：贪婪诅咒是否激活
        desperateGambleActive: false,// 新增：孤注一掷是否激活
        linkSummonChance: 0,         // 新增：连携召唤概率
        thornArmorActive: false,     // 新增：荆棘装甲是否激活
        itemRecycleChance: 0,        // 新增：使用道具时不消耗的概率
        skillDurationBonus: 0        // 新增：主动技能持续时间加成
      };
      
      // 动态追踪变量
      this.killCount = 0;            // 本局击杀总数
      this.unitsLost = 0;            // 本局阵亡总数
      
      this.catnipTimer = 0;        // 猫薄荷狂热计时器 (单位伤害翻倍)
      this.timeFreezeTimer = 0;    // 时空冻结计时器 (敌人停止行动)
      this.emergencyTimer = 0;     // 紧急动员计时器 (金币加速)
      
      // Battle XP system
      this.battleXP = 0;
      this.battleLevel = 1;
      this.xpToNextLevel = 100;
      this.levelUpPending = false;
      this.floatingTexts = [];
      
      // Screen shake effect
      this.screenShake = {
        active: false,
        intensity: 0,
        duration: 0,
        timer: 0,
        offsetX: 0,
        offsetY: 0
      };
      
      // Boss wave effects
      this.bossWave = {
        active: false,
        bossUnits: [],  // 追踪 Boss 单位
        entranceTimer: 0,
        darkenAlpha: 0
      };

      // Particle system for settlement
      this.settlementParticles = [];
      this.settlementParticleType = null; // 'snow' or 'confetti'

      // 风力关卡动态状态 (Stage 4)
      this.wind = {
        direction: 1, // 1: 从左向右, -1: 从右向左
        timer: 300,   // 5秒换一次方向
        force: 0      // 实时风力
      };
      
      // Initialize game state
      this.initializeLevel();
      
      // Game state
      this.isRunning = true;
      this.gameLoop();
      
      // Handle window resize
      window.addEventListener('resize', () => this.handleResize());
    }
  
    handleResize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight * 0.75;
      this.width = this.canvas.width;
      this.height = this.canvas.height;
      
      // Recalculate positions
      this.groundY = this.height - 40;
      
      // Reposition bases
      this.playerBase.x = this.width - 80;
      this.playerBase.y = this.groundY - 100;
      
      this.enemyBase.x = 20;
      this.enemyBase.y = this.groundY - 100;
    }
  
    initializeLevel() {
      // Ground level
      this.groundY = this.height - 40;
      
      // 刷新关卡配置
      this.levelConfig = (typeof LevelData !== 'undefined') ? LevelData.getStageConfig(this.stageId) : null;
      this.stageConfig = this.levelConfig;
      
      // LevelManager - uses LevelData config (需要先加载，因为经济系统依赖它)
      this.levelConfig = typeof LevelData !== 'undefined' 
        ? LevelData.getStageConfig(this.stageId) 
        : this.getDefaultLevelConfig();
      
      // 敌军强度系数 (从关卡配置读取，若无则使用默认阶梯)
      this.enemyMultiplier = this.levelConfig.enemyStatMultiplier || Math.pow(1.4, this.stageId - 1);
      
      // Initialize bases (应用 RPG 基地等级加成 + Run Buff)
      const baseHp = Math.floor(5000 * this.baseRpgMultiplier) + this.runBaseHpBonus;
      this.playerBase = new Base(
        this.width - 80,
        this.groundY - 100,
        60,
        60,
        '🏰',
        'player',
        baseHp
      );
      
      // 敌方基地血量随关卡难度提升
      const enemyBaseHp = Math.floor(5000 * this.enemyMultiplier);
      this.enemyBase = new Base(
        20,
        this.groundY - 100,
        60,
        60,
        '👹',
        'enemy',
        enemyBaseHp
      );
      
      // Units array
      this.units = [];
      this.projectiles = []; // 弹道数组
      
      // Economy system (使用关卡配置 + Run Buff 加成 + 基地等级加成)
      const baseMoney = this.levelConfig.startingMoney || 100;
      this.money = baseMoney + (this.runBuffs.startingMoneyBonus || 0) + (this.baseLevel - 1) * 40;
      this.maxMoney = 99999; // 移除上限限制，设为一个极大的值
      const baseGenRate = this.levelConfig.moneyGenRate || 15;
      this.moneyGenerationRate = Math.floor(baseGenRate * (1 + (this.runBuffs.moneyGenRateBonus || 0)));
      this.lastMoneyTime = Date.now();
      
      // Wallet upgrade system (已废弃)
      this.walletUpgradeCost = 0;
      this.walletLevel = 1;
      
      this.maxUnitsOnField = 20 + (this.runBuffs.unitLimitBonus || 0); // 玩家单位上限
      
      // ========== 品质系统配置 ==========
      this.RARITY_CONFIG = {
        common:    { name: '普通', color: '#ffffff', multiplier: 1.0, weight: 70, class: 'rarity-common' },
        rare:      { name: '稀有', color: '#4facfe', multiplier: 1.8, weight: 20, class: 'rarity-rare' },
        epic:      { name: '史诗', color: '#bc4ed8', multiplier: 2.8, weight: 8,  class: 'rarity-epic' },
        legendary: { name: '传说', color: '#f9d423', multiplier: 4.5, weight: 2,  class: 'rarity-legendary' }
      };
      
      // Cooldown system for player units (应用 spawnCdReduction buff)
      const cdReduction = 1 - (this.runBuffs.spawnCdReduction || 0);
      this.basicCatCooldown = 0;
      this.basicCatCooldownMax = Math.max(15, Math.floor(30 * cdReduction)); // 大幅缩短基础猫冷却
      
      this.tankCatCooldown = 0;
      this.tankCatCooldownMax = Math.max(45, Math.floor(90 * cdReduction));
      
      this.lizardCatCooldown = 0;
      this.lizardCatCooldownMax = Math.max(60, Math.floor(120 * cdReduction));

      this.assassinCatCooldown = 0;
      this.assassinCatCooldownMax = Math.max(60, Math.floor(120 * cdReduction));

      this.shamanCatCooldown = 0;
      this.shamanCatCooldownMax = Math.max(60, Math.floor(120 * cdReduction));

      this.berserkerCatCooldown = 0;
      this.berserkerCatCooldownMax = Math.max(75, Math.floor(150 * cdReduction));

      this.engineerCatCooldown = 0;
      this.engineerCatCooldownMax = Math.max(90, Math.floor(180 * cdReduction));

      this.titanCatCooldown = 0;
      this.titanCatCooldownMax = Math.max(180, Math.floor(360 * cdReduction));
      this.levelFrame = 0;  // Game time in frames (60fps)
      this.startTime = Date.now(); // 记录战斗开始时间
      this.goldDecayMultiplier = 1.0; // 金币生成衰减系数
      
      // ========== 波次系统 (Wave Manager) ==========
      this.waveManager = {
        currentWaveIndex: 0,
        waveStarted: false,
        waveCleared: false,
        enemyQueue: [],           // 待生成的敌人队列
        spawnTimer: 0,            // 生成计时器
        waveDelayTimer: 0,        // 波次间隔计时器（自动倒计时）
        totalWaves: this.levelConfig.waves ? this.levelConfig.waves.length : 0,
        waveAnnounceTimer: 0,     // 波次公告显示计时器
        waveAnnounceText: '',
        waveAnnounceSub: '',
        isFinalWave: false,
        waveClearBonusShown: false,
        totalWaveReward: 0,       // 累计波次奖励
        waitingForNextWave: false, // 【已废弃】不再使用，波次现在自动衔接
        enemiesRemaining: 0        // 当前波次剩余敌人总数
      };
      
      // 初始化第一波
      if (this.waveManager.totalWaves > 0) {
        this.prepareWave(0);
      }
      
      // Stage title display
      this.stageTitleDisplayTimer = 180;  // 3 seconds at 60fps
      
      // 紧急动员技能系统
      this.emergencySkill = {
        active: false,
        duration: 600,  // 10秒效果时间
        timer: 0,
        cooldown: 3600,  // 60秒冷却
        cooldownTimer: 0,
        moneyMultiplier: 3  // 金币生成速度x3
      };
      
      // Battle XP system reset (每关重置)
      this.battleXP = 0;
      this.battleLevel = 1;
      this.xpToNextLevel = 150; // 初始升级经验略微提升，但单怪 XP 也提升了
      this.levelUpPending = false;
      this.floatingTexts = [];
      
      // 重置战斗buff（临时buff每关清零）
      this.battleBuffs = {
        catAttackSpeedBonus: 0,
        lizardRangeBonus: 0,
        catDamageBonus: 0,
        baseMaxHpBonus: 0,
        maxMoneyBonus: 0,
        killGoldBonus: 0,
        catHpBonus: 0,
        moveSpeedBonus: 0,
        legionBonus: 0,
        glassCannonDamage: 0,
        glassCannonHpPenalty: 0,
        counterMultiplierBonus: 0,
        reflectDamage: 0,
        towerRangeBonus: 0,
        towerAtkBonus: 0,
        xpToNextLevelReduction: 0,
        compoundInterestRate: 0,
        backToWallBonus: 0,
        vengeanceBonus: 0,
        sentinelBonus: 0,
        spreadingFearBonus: 0,
        greedyCurseActive: false,
        desperateGambleActive: false,
        linkSummonChance: 0,
        thornArmorActive: false,
        itemRecycleChance: 0,
        skillDurationBonus: 0
      };
      
      this.catnipTimer = 0;
      
      // Game state
      this.gameOver = false;
      this.levelComplete = false;
      this.gameResult = '';
      this.gameSpeed = 1;
    }
  
    // ========== 玩家单位生成方法 (使用预计算属性包) ==========
    
    spawnBasicCat(free = false) {
      const stats = this.playerStats.basic;
      const playerUnitCount = this.units.filter(u => u.team === 'player').length;
      if (playerUnitCount >= this.maxUnitsOnField) return false;
      
      const canAfford = free || (this.money >= stats.cost && this.basicCatCooldown <= 0);
      
      if (canAfford && !this.gameOver && this.deck.includes('basic')) {
        // 应用局内 Buff (百分比加成)
        const battleDamageMultiplier = 1 + (this.battleBuffs.catDamageBonus || 0) + (this.battleBuffs.glassCannonDamage || 0);
        const battleHpMultiplier = 1 - (this.battleBuffs.glassCannonHpPenalty || 0);
        
        const finalAtk = Math.max(1, Math.floor(stats.atk * battleDamageMultiplier));
        const finalHp = Math.max(1, Math.floor(stats.hp * battleHpMultiplier));
        const finalCd = Math.max(1, Math.floor(stats.cd * (1 - (this.battleBuffs.catAttackSpeedBonus || 0))));
        
        const cat = new Unit(
          this.playerBase.x - 30,
          this.groundY - stats.size,
          stats.size,
          '', // 不再需要 emoji
          stats.speed,
          'player',
          finalHp,
          finalAtk,
          stats.range,
          finalCd,
          3,
          0 // XP value (player units don't give XP)
        );
        cat.unitType = 'basic';  // 设置单位类型用于克制判定
        this.units.push(cat);
        
        if (!free) {
          this.money -= stats.cost;
          this.basicCatCooldown = this.basicCatCooldownMax;
        }
        
        return true;
      }
      return false;
    }
  
    spawnTankCat() {
      const stats = this.playerStats.tank;
      const playerUnitCount = this.units.filter(u => u.team === 'player').length;
      if (playerUnitCount >= this.maxUnitsOnField) return false;
      if (this.money >= stats.cost && this.tankCatCooldown <= 0 && !this.gameOver && this.deck.includes('tank')) {
        // 应用局内 Buff (百分比加成)
        const battleDamageMultiplier = 1 + (this.battleBuffs.catDamageBonus || 0) + (this.battleBuffs.glassCannonDamage || 0);
        const battleHpMultiplier = 1 - (this.battleBuffs.glassCannonHpPenalty || 0);
        
        const finalAtk = Math.max(1, Math.floor(stats.atk * battleDamageMultiplier));
        const finalHp = Math.max(1, Math.floor(stats.hp * battleHpMultiplier));
        const finalCd = Math.max(1, Math.floor(stats.cd * (1 - (this.battleBuffs.catAttackSpeedBonus || 0))));
        
        const tank = new Unit(
          this.playerBase.x - 30,
          this.groundY - stats.size,
          stats.size,
          '',
          stats.speed,
          'player',
          finalHp,
          finalAtk,
          stats.range,
          finalCd,
          3,
          0 // XP value
        );
        tank.unitType = 'tank';  // 设置单位类型
        this.units.push(tank);
        
        this.money -= stats.cost;
        this.tankCatCooldown = this.tankCatCooldownMax;
        
        // 连携召唤 (Link Summon)：召唤坦克猫时有概率额外召唤基础猫
        if (this.battleBuffs.linkSummonChance > 0 && Math.random() < this.battleBuffs.linkSummonChance) {
          this.spawnBasicCat(true); // 免费召唤
          this.floatingTexts.push(new FloatingText('连携召唤！', this.playerBase.x - 50, this.groundY - 80, '#FFD700'));
        }
        
        return true;
      }
      return false;
    }

    spawnLizardCat() {
      const stats = this.playerStats.lizard;
      const playerUnitCount = this.units.filter(u => u.team === 'player').length;
      if (playerUnitCount >= this.maxUnitsOnField) return false;
      if (this.money >= stats.cost && this.lizardCatCooldown <= 0 && !this.gameOver && this.deck.includes('lizard')) {
        // 应用局内 Buff (百分比加成)
        const battleDamageMultiplier = 1 + (this.battleBuffs.catDamageBonus || 0) + (this.battleBuffs.glassCannonDamage || 0);
        const battleHpMultiplier = 1 - (this.battleBuffs.glassCannonHpPenalty || 0);
        
        const finalAtk = Math.max(1, Math.floor(stats.atk * battleDamageMultiplier));
        const finalHp = Math.max(1, Math.floor(stats.hp * battleHpMultiplier));
        const finalCd = Math.max(1, Math.floor(stats.cd * (1 - (this.battleBuffs.catAttackSpeedBonus || 0))));
        const finalRange = Math.max(10, Math.floor(stats.range * (1 + (this.battleBuffs.lizardRangeBonus || 0))));
        
        const lizard = new Unit(
          this.playerBase.x - 30,
          this.groundY - stats.size,
          stats.size,
          '',
          stats.speed,
          'player',
          finalHp,
          finalAtk,
          finalRange,
          finalCd,
          3,
          0 // XP value
        );
        lizard.unitType = 'lizard';  // 设置单位类型
        this.units.push(lizard);
        
        this.money -= stats.cost;
        this.lizardCatCooldown = this.lizardCatCooldownMax;
        
        return true;
      }
      return false;
    }

    spawnAssassinCat() {
      const stats = this.playerStats.assassin;
      const playerUnitCount = this.units.filter(u => u.team === 'player').length;
      if (playerUnitCount >= this.maxUnitsOnField) return false;
      if (this.money >= stats.cost && this.assassinCatCooldown <= 0 && !this.gameOver && this.deck.includes('assassin')) {
        const battleDamageMultiplier = 1 + (this.battleBuffs.catDamageBonus || 0) + (this.battleBuffs.glassCannonDamage || 0);
        const battleHpMultiplier = 1 - (this.battleBuffs.glassCannonHpPenalty || 0);
        const finalAtk = Math.max(1, Math.floor(stats.atk * battleDamageMultiplier));
        const finalHp = Math.max(1, Math.floor(stats.hp * battleHpMultiplier));
        const finalCd = Math.max(1, Math.floor(stats.cd * (1 - (this.battleBuffs.catAttackSpeedBonus || 0))));
        
        const assassin = new Unit(this.playerBase.x - 30, this.groundY - stats.size, stats.size, '', stats.speed, 'player', finalHp, finalAtk, stats.range, finalCd, 3, 0);
        assassin.unitType = 'assassin';
        this.units.push(assassin);
        this.money -= stats.cost;
        this.assassinCatCooldown = this.assassinCatCooldownMax;
        return true;
      }
      return false;
    }

    spawnShamanCat() {
      const stats = this.playerStats.shaman;
      const playerUnitCount = this.units.filter(u => u.team === 'player').length;
      if (playerUnitCount >= this.maxUnitsOnField) return false;
      if (this.money >= stats.cost && this.shamanCatCooldown <= 0 && !this.gameOver && this.deck.includes('shaman')) {
        const battleDamageMultiplier = 1 + (this.battleBuffs.catDamageBonus || 0) + (this.battleBuffs.glassCannonDamage || 0);
        const battleHpMultiplier = 1 - (this.battleBuffs.glassCannonHpPenalty || 0);
        const finalAtk = Math.max(1, Math.floor(stats.atk * battleDamageMultiplier));
        const finalHp = Math.max(1, Math.floor(stats.hp * battleHpMultiplier));
        const finalCd = Math.max(1, Math.floor(stats.cd * (1 - (this.battleBuffs.catAttackSpeedBonus || 0))));
        const finalRange = Math.max(10, Math.floor(stats.range * (1 + (this.battleBuffs.lizardRangeBonus || 0))));
        
        const shaman = new Unit(this.playerBase.x - 30, this.groundY - stats.size, stats.size, '', stats.speed, 'player', finalHp, finalAtk, finalRange, finalCd, 3, 0);
        shaman.unitType = 'shaman';
        this.units.push(shaman);
        this.money -= stats.cost;
        this.shamanCatCooldown = this.shamanCatCooldownMax;
        return true;
      }
      return false;
    }

    spawnBerserkerCat() {
      const stats = this.playerStats.berserker;
      const playerUnitCount = this.units.filter(u => u.team === 'player').length;
      if (playerUnitCount >= this.maxUnitsOnField) return false;
      if (this.money >= stats.cost && this.berserkerCatCooldown <= 0 && !this.gameOver && this.deck.includes('berserker')) {
        const battleDamageMultiplier = 1 + (this.battleBuffs.catDamageBonus || 0) + (this.battleBuffs.glassCannonDamage || 0);
        const battleHpMultiplier = 1 - (this.battleBuffs.glassCannonHpPenalty || 0);
        const finalAtk = Math.max(1, Math.floor(stats.atk * battleDamageMultiplier));
        const finalHp = Math.max(1, Math.floor(stats.hp * battleHpMultiplier));
        const finalCd = Math.max(1, Math.floor(stats.cd * (1 - (this.battleBuffs.catAttackSpeedBonus || 0))));
        
        const berserker = new Unit(this.playerBase.x - 30, this.groundY - stats.size, stats.size, '', stats.speed, 'player', finalHp, finalAtk, stats.range, finalCd, 3, 0);
        berserker.unitType = 'berserker';
        this.units.push(berserker);
        this.money -= stats.cost;
        this.berserkerCatCooldown = this.berserkerCatCooldownMax;
        return true;
      }
      return false;
    }

    spawnEngineerCat() {
      const stats = this.playerStats.engineer;
      const playerUnitCount = this.units.filter(u => u.team === 'player').length;
      if (playerUnitCount >= this.maxUnitsOnField) return false;
      if (this.money >= stats.cost && this.engineerCatCooldown <= 0 && !this.gameOver && this.deck.includes('engineer')) {
        const battleDamageMultiplier = 1 + (this.battleBuffs.catDamageBonus || 0) + (this.battleBuffs.glassCannonDamage || 0);
        const battleHpMultiplier = 1 - (this.battleBuffs.glassCannonHpPenalty || 0);
        const finalAtk = Math.max(1, Math.floor(stats.atk * battleDamageMultiplier));
        const finalHp = Math.max(1, Math.floor(stats.hp * battleHpMultiplier));
        const finalCd = Math.max(1, Math.floor(stats.cd * (1 - (this.battleBuffs.catAttackSpeedBonus || 0))));
        
        const engineer = new Unit(this.playerBase.x - 30, this.groundY - stats.size, stats.size, '', stats.speed, 'player', finalHp, finalAtk, stats.range, finalCd, 3, 0);
        engineer.unitType = 'engineer';
        this.units.push(engineer);
        this.money -= stats.cost;
        this.engineerCatCooldown = this.engineerCatCooldownMax;
        return true;
      }
      return false;
    }

    spawnTitanCat() {
      const stats = this.playerStats.titan;
      const playerUnitCount = this.units.filter(u => u.team === 'player').length;
      if (playerUnitCount >= this.maxUnitsOnField) return false;
      if (this.money >= stats.cost && this.titanCatCooldown <= 0 && !this.gameOver && this.deck.includes('titan')) {
        const battleDamageMultiplier = 1 + (this.battleBuffs.catDamageBonus || 0) + (this.battleBuffs.glassCannonDamage || 0);
        const battleHpMultiplier = 1 - (this.battleBuffs.glassCannonHpPenalty || 0);
        const finalAtk = Math.max(1, Math.floor(stats.atk * battleDamageMultiplier));
        const finalHp = Math.max(1, Math.floor(stats.hp * battleHpMultiplier));
        const finalCd = Math.max(1, Math.floor(stats.cd * (1 - (this.battleBuffs.catAttackSpeedBonus || 0))));
        
        const titan = new Unit(this.playerBase.x - 30, this.groundY - stats.size, stats.size, '', stats.speed, 'player', finalHp, finalAtk, stats.range, finalCd, 3, 0);
        titan.unitType = 'titan';
        this.units.push(titan);
        this.money -= stats.cost;
        this.titanCatCooldown = this.titanCatCooldownMax;
        return true;
      }
      return false;
    }
  
    upgradeWallet() {
      if (this.money >= this.walletUpgradeCost && !this.gameOver) {
        this.money -= this.walletUpgradeCost;
        
        this.maxMoney += 1000;
        this.moneyGenerationRate += 10;
        this.walletLevel++;
        
        this.walletUpgradeCost *= 2;
        
        return true;
      }
      return false;
    }
  
    // ========== 敌人单位生成方法 (使用 Baseline + 关卡难度系数) ==========
    
    spawnDog() {
      if (!this.gameOver) {
        const base = this.unitBaseline.dog;
        // 应用敌方削弱 buff
        const effectiveMultiplier = this.enemyMultiplier * (1 - (this.runBuffs.enemyStatMultiplier || 0));
        
        // 应用关卡特性 (Stage Modifiers)
        let stageAtkMult = 1;
        let stageRangeMult = 1;
        let stageSpeedMult = 1;
        if (this.stageConfig && this.stageConfig.modifiers) {
          const mods = this.stageConfig.modifiers;
          if (mods.damageMultiplier) stageAtkMult *= mods.damageMultiplier;
          if (mods.rangeMultiplier) stageRangeMult *= mods.rangeMultiplier;
          if (mods.moveSpeedMultiplier) stageSpeedMult *= mods.moveSpeedMultiplier;
          if (mods.allStatsMultiplier) {
            stageAtkMult *= mods.allStatsMultiplier;
            stageRangeMult *= mods.allStatsMultiplier;
            stageSpeedMult *= mods.allStatsMultiplier;
          }
        }

        const dog = new Unit(
          this.enemyBase.getRightEdge() + 5,
          this.groundY - base.size,
          base.size,
          '',
          base.speed * stageSpeedMult,
          'enemy',
          Math.max(1, Math.floor(base.hp * effectiveMultiplier)),
          Math.max(1, Math.floor(base.atk * effectiveMultiplier * stageAtkMult)),
          Math.max(10, Math.floor(base.range * effectiveMultiplier * stageRangeMult)),
          base.cd,
          3,
          base.xp
        );
        dog.unitType = 'dog';  // 设置单位类型
        this.units.push(dog);
      }
    }
  
    spawnHippoBoss() {
      if (!this.gameOver) {
        // 播放警报音效
        if (window.audioManager) window.audioManager.playAlarm();

        const base = this.unitBaseline.hippo;
        // 应用敌方削弱 buff
        const effectiveMultiplier = this.enemyMultiplier * (1 - (this.runBuffs.enemyStatMultiplier || 0));
        
        // 应用关卡特性 (Stage Modifiers)
        let stageAtkMult = 1;
        let stageRangeMult = 1;
        let stageSpeedMult = 1;
        if (this.stageConfig && this.stageConfig.modifiers) {
          const mods = this.stageConfig.modifiers;
          if (mods.damageMultiplier) stageAtkMult *= mods.damageMultiplier;
          if (mods.rangeMultiplier) stageRangeMult *= mods.rangeMultiplier;
          if (mods.moveSpeedMultiplier) stageSpeedMult *= mods.moveSpeedMultiplier;
          if (mods.allStatsMultiplier) {
            stageAtkMult *= mods.allStatsMultiplier;
            stageRangeMult *= mods.allStatsMultiplier;
            stageSpeedMult *= mods.allStatsMultiplier;
          }
        }

        const hippo = new Unit(
          this.enemyBase.getRightEdge() + 5,
          this.groundY - base.size,
          base.size,
          '',
          base.speed * stageSpeedMult,
          'enemy',
          Math.max(1, Math.floor(base.hp * effectiveMultiplier)),
          Math.max(1, Math.floor(base.atk * effectiveMultiplier * stageAtkMult)),
          Math.max(10, Math.floor(base.range * effectiveMultiplier * stageRangeMult)),
          base.cd,
          3,
          base.xp
        );
        hippo.unitType = 'hippo';  // 设置单位类型
        this.units.push(hippo);
        
        // 如果是 Boss 波次，标记为 Boss 单位
        if (this.bossWave.active) {
          this.bossWave.bossUnits.push(hippo);
        }
      }
    }
  
    spawnSnake() {
      if (!this.gameOver) {
        const base = this.unitBaseline.snake;
        // 应用敌方削弱 buff
        const effectiveMultiplier = this.enemyMultiplier * (1 - (this.runBuffs.enemyStatMultiplier || 0));
        
        // 应用关卡特性 (Stage Modifiers)
        let stageAtkMult = 1;
        let stageRangeMult = 1;
        let stageSpeedMult = 1;
        if (this.stageConfig && this.stageConfig.modifiers) {
          const mods = this.stageConfig.modifiers;
          if (mods.damageMultiplier) stageAtkMult *= mods.damageMultiplier;
          if (mods.rangeMultiplier) stageRangeMult *= mods.rangeMultiplier;
          if (mods.moveSpeedMultiplier) stageSpeedMult *= mods.moveSpeedMultiplier;
          if (mods.allStatsMultiplier) {
            stageAtkMult *= mods.allStatsMultiplier;
            stageRangeMult *= mods.allStatsMultiplier;
            stageSpeedMult *= mods.allStatsMultiplier;
          }
        }

        const snake = new Unit(
          this.enemyBase.getRightEdge() + 5,
          this.groundY - base.size,
          base.size,
          '',
          base.speed * stageSpeedMult,
          'enemy',
          Math.max(1, Math.floor(base.hp * effectiveMultiplier)),
          Math.max(1, Math.floor(base.atk * effectiveMultiplier * stageAtkMult)),
          Math.max(10, Math.floor(base.range * effectiveMultiplier * stageRangeMult)),
          base.cd,
          2,
          base.xp
        );
        snake.unitType = 'snake';  // 设置单位类型
        this.units.push(snake);
      }
    }
  
  
    getDefaultLevelConfig() {
      return {
        name: 'Default Stage',
        nameZh: '默认关卡',
        intel: '',
        question: '',
        startingMoney: 100,
        moneyGenRate: 15,
        waves: [
          {
            title: '第一波',
            titleEn: 'Wave 1',
            enemies: [{ type: 'dog', count: 5, interval: 180 }],
            waveReward: 50,
            autoStartDelay: 0
          }
        ]
      };
    }

    // ========== 波次管理方法 ==========
    
    // 准备指定波次
    prepareWave(waveIndex) {
      if (waveIndex >= this.waveManager.totalWaves) return;
      
      const wave = this.levelConfig.waves[waveIndex];
      this.waveManager.currentWaveIndex = waveIndex;
      this.waveManager.waveStarted = false;
      this.waveManager.waveCleared = false;
      this.waveManager.waveClearBonusShown = false;
      this.waveManager.isFinalWave = wave.isFinal || false;
      
      // 设置波次间隔
      this.waveManager.waveDelayTimer = wave.autoStartDelay || 0;
      
      // 构建敌人队列
      this.waveManager.enemyQueue = [];
      let totalEnemies = 0;
      for (const enemyGroup of wave.enemies) {
        const delay = enemyGroup.delay || 0;
        totalEnemies += enemyGroup.count;
        for (let i = 0; i < enemyGroup.count; i++) {
          this.waveManager.enemyQueue.push({
            type: enemyGroup.type,
            spawnAt: delay + i * (enemyGroup.interval || 120)  // 相对于波次开始的帧数
          });
        }
      }
      this.waveManager.enemiesRemaining = totalEnemies;
      
      // 按生成时间排序
      this.waveManager.enemyQueue.sort((a, b) => a.spawnAt - b.spawnAt);
      this.waveManager.spawnTimer = 0;
    }

    // 开始当前波次
    startWave() {
      const wave = this.levelConfig.waves[this.waveManager.currentWaveIndex];
      this.waveManager.waveStarted = true;
      this.waveManager.spawnTimer = 0;
      
      // 显示波次公告
      this.waveManager.waveAnnounceTimer = 120;  // 2秒
      this.waveManager.waveAnnounceText = wave.title || `Wave ${this.waveManager.currentWaveIndex + 1}`;
      this.waveManager.waveAnnounceSub = wave.titleEn || '';
      
      // Boss 波次特殊处理
      if (wave.type === 'boss') {
        this.bossWave.active = true;
        this.bossWave.entranceTimer = 180;  // 3秒入场特效
        this.bossWave.bossUnits = [];
        this.waveManager.waveAnnounceText = '💀 BOSS: ' + this.waveManager.waveAnnounceText + ' 💀';
        
        // Boss 入场屏幕抖动
        this.shakeScreen(15, 40);
      } else {
        this.bossWave.active = false;
      }
      
      // 最终波特殊提示
      if (this.waveManager.isFinalWave) {
        this.waveManager.waveAnnounceText = '⚠️ ' + this.waveManager.waveAnnounceText + ' ⚠️';
      }
    }

    // 更新波次系统
    updateWaveManager(effectiveGameSpeed) {
      if (this.waveManager.totalWaves === 0) return;
      
      // 波次公告计时
      if (this.waveManager.waveAnnounceTimer > 0) {
        this.waveManager.waveAnnounceTimer -= effectiveGameSpeed;
      }
      
      // 等待波次开始（自动倒计时）
      if (!this.waveManager.waveStarted) {
        if (this.waveManager.waveDelayTimer > 0) {
          this.waveManager.waveDelayTimer -= effectiveGameSpeed;
        } else {
          this.startWave();
        }
        return;
      }
      
      // 波次进行中 - 生成敌人
      if (this.waveManager.enemyQueue.length > 0) {
        this.waveManager.spawnTimer += effectiveGameSpeed;
        
        // 检查是否有敌人需要生成
        while (this.waveManager.enemyQueue.length > 0 && 
               this.waveManager.spawnTimer >= this.waveManager.enemyQueue[0].spawnAt) {
          const enemy = this.waveManager.enemyQueue.shift();
          this.spawnEnemyByType(enemy.type);
        }
      }
      
      // 检查波次是否清空
      if (this.waveManager.waveStarted && 
          this.waveManager.enemyQueue.length === 0 && 
          !this.waveManager.waveCleared) {
        // 实时更新剩余敌人数量（场上敌人 + 队列敌人）
        const enemiesOnField = this.units.filter(u => u.team === 'enemy').length;
        this.waveManager.enemiesRemaining = enemiesOnField;
        
        if (enemiesOnField === 0) {
          this.onWaveCleared();
        }
      } else if (this.waveManager.waveStarted && this.waveManager.enemyQueue.length > 0) {
        // 队列还有敌人时
        const enemiesOnField = this.units.filter(u => u.team === 'enemy').length;
        this.waveManager.enemiesRemaining = enemiesOnField + this.waveManager.enemyQueue.length;
      }
    }

    // 根据类型生成敌人
    spawnEnemyByType(type) {
      switch(type) {
        case 'dog':
          this.spawnDog();
          break;
        case 'snake':
          this.spawnSnake();
          break;
        case 'hippo':
          this.spawnHippoBoss();
          break;
        case 'elephant':
          this.spawnElephantUnit();
          break;
        case 'bee':
          this.spawnBee();
          break;
        case 'crab':
          this.spawnCrab();
          break;
        case 'rabbit':
          this.spawnRabbit();
          break;
        default:
          this.spawnDog();
      }
    }

    // --- 新敌人生成方法 ---
    spawnBee() {
      if (!this.gameOver) {
        const base = this.unitBaseline.bee;
        const effectiveMultiplier = this.enemyMultiplier * (1 - (this.runBuffs.enemyStatMultiplier || 0));
        const bee = new Unit(
          this.enemyBase.getRightEdge() + 5,
          this.groundY - base.size - 40, // 飞在空中
          base.size,
          '🐝',
          base.speed,
          'enemy',
          Math.max(1, Math.floor(base.hp * effectiveMultiplier)),
          Math.max(1, Math.floor(base.atk * effectiveMultiplier)),
          base.range,
          base.cd,
          1,
          base.xp
        );
        bee.unitType = 'bee';
        bee.isExplosive = true;
        this.units.push(bee);
      }
    }

    spawnCrab() {
      if (!this.gameOver) {
        const base = this.unitBaseline.crab;
        const effectiveMultiplier = this.enemyMultiplier * (1 - (this.runBuffs.enemyStatMultiplier || 0));
        const crab = new Unit(
          this.enemyBase.getRightEdge() + 5,
          this.groundY - base.size,
          base.size,
          '🦀',
          base.speed,
          'enemy',
          Math.max(1, Math.floor(base.hp * effectiveMultiplier)),
          Math.max(1, Math.floor(base.atk * effectiveMultiplier)),
          base.range,
          base.cd,
          5,
          base.xp
        );
        crab.unitType = 'crab';
        crab.hitShield = base.hitShield;
        this.units.push(crab);
      }
    }

    spawnRabbit() {
      if (!this.gameOver) {
        const base = this.unitBaseline.rabbit;
        const effectiveMultiplier = this.enemyMultiplier * (1 - (this.runBuffs.enemyStatMultiplier || 0));
        const rabbit = new Unit(
          this.enemyBase.getRightEdge() + 5,
          this.groundY - base.size,
          base.size,
          '🐰',
          base.speed,
          'enemy',
          Math.max(1, Math.floor(base.hp * effectiveMultiplier)),
          Math.max(1, Math.floor(base.atk * effectiveMultiplier)),
          base.range,
          base.cd,
          2,
          base.xp
        );
        rabbit.unitType = 'rabbit';
        rabbit.healPower = base.healPower;
        this.units.push(rabbit);
      }
    }

    spawnElephantUnit() {
      if (!this.gameOver) {
        const base = this.unitBaseline.elephant;
        // 应用敌方削弱 buff
        const effectiveMultiplier = this.enemyMultiplier * (1 - (this.runBuffs.enemyStatMultiplier || 0));
        
        // 应用关卡特性 (Stage Modifiers)
        let stageAtkMult = 1;
        let stageRangeMult = 1;
        let stageSpeedMult = 1;
        if (this.stageConfig && this.stageConfig.modifiers) {
          const mods = this.stageConfig.modifiers;
          if (mods.damageMultiplier) stageAtkMult *= mods.damageMultiplier;
          if (mods.rangeMultiplier) stageRangeMult *= mods.rangeMultiplier;
          if (mods.moveSpeedMultiplier) stageSpeedMult *= mods.moveSpeedMultiplier;
          if (mods.allStatsMultiplier) {
            stageAtkMult *= mods.allStatsMultiplier;
            stageRangeMult *= mods.allStatsMultiplier;
            stageSpeedMult *= mods.allStatsMultiplier;
          }
        }

        const elephant = new Unit(
          this.enemyBase.getRightEdge() + 5,
          this.groundY - base.size,
          base.size,
          '',
          base.speed * stageSpeedMult,
          'enemy',
          Math.max(1, Math.floor(base.hp * effectiveMultiplier)),
          Math.max(1, Math.floor(base.atk * effectiveMultiplier * stageAtkMult)),
          Math.max(10, Math.floor(base.range * effectiveMultiplier * stageRangeMult)),
          base.cd,
          5,
          base.xp
        );
        elephant.unitType = 'elephant';  // 设置单位类型
        this.units.push(elephant);
        
        // 如果是 Boss 波次，标记为 Boss 单位
        if (this.bossWave.active) {
          this.bossWave.bossUnits.push(elephant);
        }
      }
    }

    // 波次清空回调
    onWaveCleared() {
      this.waveManager.waveCleared = true;
      this.waveManager.enemiesRemaining = 0;
      const wave = this.levelConfig.waves[this.waveManager.currentWaveIndex];
      
      // 给予波次奖励
      if (wave.waveReward && !this.waveManager.waveClearBonusShown) {
        this.money += wave.waveReward;
        this.waveManager.totalWaveReward += wave.waveReward;
        this.waveManager.waveClearBonusShown = true;
        
        // 显示奖励浮动文字
        this.floatingTexts.push(new FloatingText(
          `+${wave.waveReward} 💰 Wave Clear!`, 
          this.width / 2, 
          this.height / 2, 
          '#00FF00'
        ));
      }
      
      // 准备下一波（自动衔接）
      const nextWaveIndex = this.waveManager.currentWaveIndex + 1;
      if (nextWaveIndex < this.waveManager.totalWaves) {
        this.prepareWave(nextWaveIndex);
        // prepareWave 会设置 waveDelayTimer，updateWaveManager 会自动倒计时并开始下一波
      } else {
        // 如果没有下一波，且当前是最终波，触发敌方基地“破防”机制
        if (this.waveManager.isFinalWave) {
          this.triggerEnemyBaseVulnerability();
        }
      }
    }

    // 触发敌方基地破防机制
    triggerEnemyBaseVulnerability() {
      if (this.enemyBase && this.enemyBase.hp > 0) {
        // 将敌方基地血量降至最大值的 10%（而不是固定 10 点），保留一点推塔感
        const vulnerabilityHP = Math.floor(this.enemyBase.maxHP * 0.1);
        this.enemyBase.hp = Math.min(this.enemyBase.hp, vulnerabilityHP);
        this.floatingTexts.push(new FloatingText(
          '⚠️ 敌方防线崩溃：基地已破防！', 
          this.width / 2, 
          this.height / 3, 
          '#FF4444',
          120 // 持续时间长一点
        ));
        // 触发一次屏幕大抖动
        this.shakeScreen(10, 60);
      }
    }

    // 玩家手动点击开始下一波
    // 【已废弃】手动开始下一波（现在波次自动衔接，此方法不再使用）
    // nextWave() {
    //   if (this.waveManager.waitingForNextWave) {
    //     this.waveManager.waitingForNextWave = false;
    //     this.waveManager.waveDelayTimer = 0; // 立即开始
    //     return true;
    //   }
    //   return false;
    // }
  
    update() {
      const gameSpeed = this.gameSpeed;
      
      // Update settlement particles (even if game is over)
      this.updateSettlementParticles(gameSpeed);

      // 更新风力逻辑 (Stage 4)
      if (this.stageId === 4 && this.isRunning && !this.gameOver && !this.levelComplete) {
        this.wind.timer -= gameSpeed;
        if (this.wind.timer <= 0) {
          this.wind.direction *= -1;
          this.wind.timer = 300 + Math.random() * 300; // 5-10秒换一次方向
          
          // 显示风向切换提示
          const dirText = this.wind.direction > 0 ? "▶ 顺风 (左→右)" : "◀ 逆风 (右→左)";
          this.floatingTexts.push(new FloatingText(`风向切换: ${dirText}`, this.width / 2, 100, '#87CEEB', 60));
        }
        // 基础风力来自配置，这里实时同步
        const baseForce = (this.stageConfig && this.stageConfig.modifiers) ? (this.stageConfig.modifiers.windForce || 0.05) : 0.05;
        this.wind.force = baseForce;
      }

      if (this.gameOver || this.levelComplete || this.levelUpPending) return;
      
      // Stage title display countdown
      if (this.stageTitleDisplayTimer > 0) {
        this.stageTitleDisplayTimer -= this.gameSpeed;
      }
      
      // Update screen shake
      this.updateScreenShake();
      
      // Update Boss wave effects
      if (this.bossWave.entranceTimer > 0) {
        this.bossWave.entranceTimer--;
        // 淡入暗化效果
        this.bossWave.darkenAlpha = Math.min(0.4, (180 - this.bossWave.entranceTimer) / 180 * 0.4);
      } else if (this.bossWave.active) {
        // Boss 波次期间保持轻微暗化
        this.bossWave.darkenAlpha = Math.max(0, this.bossWave.darkenAlpha - 0.01);
      }
      
      // 清理已死亡的 Boss 单位
      if (this.bossWave.active) {
        this.bossWave.bossUnits = this.bossWave.bossUnits.filter(boss => !boss.isDead());
      }
      
      // Update floating texts
      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        this.floatingTexts[i].update();
        if (this.floatingTexts[i].isDead()) {
          this.floatingTexts.splice(i, 1);
        }
      }
      
      const effectiveGameSpeed = this.gameSpeed;
      
      // 更新猫薄荷狂热计时器
      if (this.catnipTimer > 0) {
        this.catnipTimer -= effectiveGameSpeed;
      }
      
      // 更新时空冻结计时器
      if (this.timeFreezeTimer > 0) {
        this.timeFreezeTimer -= effectiveGameSpeed;
      }

      // 更新紧急动员计时器
      if (this.emergencyTimer > 0) {
        this.emergencyTimer -= effectiveGameSpeed;
      }
      
      // 金币生成（应用紧急动员效果 + 利滚利效果 + 时间衰减）
      const currentTime = Date.now();
      const battleDurationSeconds = (currentTime - this.startTime) / 1000;
      
      // 检查场上是否有敌人单位（防御塔除外）
      const hasEnemyUnits = this.units.some(u => u.team === 'enemy');
      
      // 计算衰减系数：仅在最后一波清空且场上无敌人时停止
      const isFinalWaveCleared = this.waveManager.isFinalWave && this.waveManager.waveCleared;
      
      if (isFinalWaveCleared && !hasEnemyUnits) {
        this.goldDecayMultiplier = 0;
      } else {
        this.goldDecayMultiplier = 1.0;
      }

      if (currentTime - this.lastMoneyTime >= 1000) {
        let moneyGain = this.moneyGenerationRate * this.goldDecayMultiplier;
        
        // 紧急动员加成 (现在由 emergencyTimer 控制)
        if (this.emergencyTimer > 0) {
          moneyGain *= 3; // 固定 3 倍加速
        }
        
        // 利滚利 (Compound Interest)：基于当前金币余额的额外增长
        if (this.battleBuffs.compoundInterestRate > 0) {
          const compoundBonus = this.money * this.battleBuffs.compoundInterestRate * this.goldDecayMultiplier;
          moneyGain += compoundBonus;
        }
        
        this.money += moneyGain;
        this.lastMoneyTime = currentTime;
      }
      
      if (this.basicCatCooldown > 0) {
        this.basicCatCooldown -= effectiveGameSpeed;
      }
      if (this.tankCatCooldown > 0) {
        this.tankCatCooldown -= effectiveGameSpeed;
      }
      if (this.lizardCatCooldown > 0) {
        this.lizardCatCooldown -= effectiveGameSpeed;
      }
      if (this.assassinCatCooldown > 0) {
        this.assassinCatCooldown -= effectiveGameSpeed;
      }
      if (this.shamanCatCooldown > 0) {
        this.shamanCatCooldown -= effectiveGameSpeed;
      }
      if (this.berserkerCatCooldown > 0) {
        this.berserkerCatCooldown -= effectiveGameSpeed;
      }
      if (this.engineerCatCooldown > 0) {
        this.engineerCatCooldown -= effectiveGameSpeed;
      }
      if (this.titanCatCooldown > 0) {
        this.titanCatCooldown -= effectiveGameSpeed;
      }
      
      // LevelManager: Increment frame counter
      this.levelFrame += effectiveGameSpeed;
      
      // 波次系统更新
      this.updateWaveManager(effectiveGameSpeed);
      
      // 更新基地逻辑（自动攻击 + 自动回血）
      this.playerBase.update(this.units, effectiveGameSpeed);
      this.enemyBase.update(this.units, effectiveGameSpeed);
      
      // 基地自动回血 (baseAutoHeal from runBuffs)
      if (this.runBuffs.baseAutoHeal > 0) {
        const healPerSecond = this.playerBase.maxHP * this.runBuffs.baseAutoHeal;
        const healPerFrame = (healPerSecond / 60) * effectiveGameSpeed;
        this.playerBase.hp = Math.min(this.playerBase.hp + healPerFrame, this.playerBase.maxHP);
      }
      
      // ========== 动态 Buff 计算 ==========
      let damageMultiplier = this.catnipTimer > 0 ? 2 : 1;
      let attackSpeedMultiplier = 1;
      let moveSpeedMultiplier = 1 + (this.battleBuffs.moveSpeedBonus || 0);
      
      // 1. 协同加成 (Cat Legion)：场上每多一个猫咪，所有单位攻击力增加
      if (this.battleBuffs.legionBonus > 0) {
        const playerUnitCount = this.units.filter(u => u.team === 'player').length;
        const legionMultiplier = 1 + (this.battleBuffs.legionBonus * playerUnitCount);
        damageMultiplier *= legionMultiplier;
      }
      
      // 2. 利滚利 (Compound Interest)：金币余额影响金币生成速度
      if (this.battleBuffs.compoundInterestRate > 0) {
        const bonusRate = this.money * this.battleBuffs.compoundInterestRate;
        // 在金币生成时应用（已在上面的金币生成逻辑中）
      }
      
      // 3. 背水一战 (Back to the Wall)：基地血量损失影响伤害
      if (this.battleBuffs.backToWallBonus > 0) {
        const hpLossPercent = (this.playerBase.maxHP - this.playerBase.hp) / this.playerBase.maxHP;
        const backToWallMultiplier = 1 + (hpLossPercent * this.battleBuffs.backToWallBonus);
        damageMultiplier *= backToWallMultiplier;
      }
      
      // 4. 复仇之火 (Vengeance Fire)：阵亡单位影响攻速
      if (this.battleBuffs.vengeanceBonus > 0) {
        const vengeanceMultiplier = 1 + (this.unitsLost * this.battleBuffs.vengeanceBonus);
        attackSpeedMultiplier *= vengeanceMultiplier;
      }
      
      // 5. 恐惧蔓延 (Spreading Fear)：击杀数影响敌方速度
      let enemySpeedDebuff = 0;
      if (this.battleBuffs.spreadingFearBonus > 0) {
        enemySpeedDebuff = this.killCount * this.battleBuffs.spreadingFearBonus;
      }
      
      // 6. 孤注一掷 (Desperate Gamble)：基地生命低于 20% 时大幅加伤
      if (this.battleBuffs.desperateGambleActive && this.playerBase.hp / this.playerBase.maxHP < 0.2) {
        damageMultiplier *= 3.0; // 固定 3 倍伤害
      }
      
      // 7. 贪婪诅咒 (Greedy Curse)：敌方攻速提升（在敌方单位 update 时应用）
      const enemyAtkSpeedBonus = this.battleBuffs.greedyCurseActive ? 0.3 : 0;
      
      for (let unit of this.units) {
        // 如果处于时空冻结状态，敌人停止 update
        if (this.timeFreezeTimer > 0 && unit.team === 'enemy') {
          continue;
        }
        
        // 准备传递给 unit.update 的动态参数
        let finalDamageMultiplier = 1;
        let finalAtkSpeedMultiplier = 1;
        let finalMoveSpeedMultiplier = 1;
        let finalDefenseMultiplier = 1;
        
        if (unit.team === 'player') {
          finalDamageMultiplier = damageMultiplier;
          finalAtkSpeedMultiplier = attackSpeedMultiplier;
          finalMoveSpeedMultiplier = moveSpeedMultiplier;
          
          // 守望者 (Sentinel)：距离基地越近，受到的伤害越低
          if (this.battleBuffs.sentinelBonus > 0) {
            const distanceToBase = Math.abs(unit.x - this.playerBase.x);
            const sentinelReduction = Math.max(0, (500 - distanceToBase) / 100) * this.battleBuffs.sentinelBonus;
            finalDefenseMultiplier = 1 - sentinelReduction;
          }
          
          // 弱点突破 (Weakness Breakthrough)：存储克制加成比率
          unit.currentCounterMultiplierBonus = this.battleBuffs.counterMultiplierBonus || 0;
        } else {
          // 敌方单位
          finalMoveSpeedMultiplier = Math.max(0.1, 1 - enemySpeedDebuff - (this.runBuffs.enemySpeedMultiplier || 0));
          finalAtkSpeedMultiplier = 1 + enemyAtkSpeedBonus;
        }
        
        // 将所有动态参数打包传递给 Unit
        const currentWind = (this.stageId === 4) ? (this.wind.force * this.wind.direction) : 0;
        unit.update(this.enemyBase, this.playerBase, this.units, effectiveGameSpeed, 
                    finalDamageMultiplier, 
                    (p) => this.projectiles.push(p),
                    finalAtkSpeedMultiplier,
                    finalMoveSpeedMultiplier,
                    finalDefenseMultiplier,
                    currentWind);
      }
      
      // 更新弹道
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        this.projectiles[i].update(effectiveGameSpeed);
        if (this.projectiles[i].isDead) {
          this.projectiles.splice(i, 1);
        }
      }
      
      // Check for dead units and grant XP / track stats before filtering
      for (let unit of this.units) {
        if (unit.isDead()) {
          if (unit.team === 'enemy' && unit.xpValue > 0) {
            // 敌方单位死亡：增加击杀计数
            this.killCount++;
            
            // 应用经验加成 (加法叠加防止倍率爆炸)
            let finalXp = unit.xpValue;
            let xpMultiplier = 1.0;
            
            if (this.battleBuffs.greedyCurseActive) {
              xpMultiplier += 1.0; // 贪婪诅咒：+100%
            }
            if (this.runBuffs.xpGainMultiplier > 0) {
              xpMultiplier += this.runBuffs.xpGainMultiplier; // Run 经验增益
            }
            
            finalXp = Math.floor(finalXp * xpMultiplier);
            
            this.gainXP(finalXp, unit.x, unit.y);
            unit.xpValue = 0;
            
            // 击杀金币奖励 (基础 3 + Buff 加成)
            const killGold = 3 + (this.battleBuffs.killGoldBonus || 0);
            this.money += killGold;
            this.floatingTexts.push(new FloatingText(`+$${killGold}`, unit.x, unit.y - 20, '#FFD700'));
            
            // 敌人死亡时触发轻微屏幕抖动
            this.shakeScreen(3, 10);
          } else if (unit.team === 'player') {
            // 己方单位阵亡：增加阵亡计数
            this.unitsLost++;
          }
        }
      }
      
      this.units = this.units.filter(unit => !unit.isDead());
      
      if (this.playerBase.hp <= 0 && !this.gameOver) {
        this.gameOver = true;
        this.gameResult = 'LOSE';
        this.playerBase.triggerDestruction();
        this.settlementParticleType = 'snow'; // 失败飘雪
        
        // 立即播放失败音乐
        if (window.audioManager) window.audioManager.playDefeat();

        // 敌方庆祝
        this.units.forEach(u => {
          if (u.team === 'enemy') u.celebrationTimer = 300; // 延长到5秒
        });

        // Settlement handled by GameApp.setupBattleUI when using index.html
        if (typeof SceneManager !== 'undefined') {
          setTimeout(() => {
            // 检查是否还在战斗场景，防止重复触发
            if (SceneManager.getCurrentScene() === 'battle') {
              if (window.GameApp) {
                window.GameApp.endBattle(false);
              } else {
                SceneManager.showScene('settlement', {
                  victory: false,
                  stageId: this.stageId,
                  goldEarned: 0
                });
              }
            }
          }, 3500); // 延长等待时间到3.5秒
        }
      } else if (this.enemyBase.hp <= 0 && !this.levelComplete) {
        this.levelComplete = true;
        this.gameResult = 'WIN';
        this.enemyBase.triggerDestruction();
        this.settlementParticleType = 'confetti'; // 胜利彩带

        // 立即播放胜利音乐
        if (window.audioManager) window.audioManager.playVictory();

        // 我方庆祝
        this.units.forEach(u => {
          if (u.team === 'player') u.celebrationTimer = 300; // 延长到5秒
        });

        const baseGold = this.calculateGoldReward();
        if (typeof SceneManager !== 'undefined') {
          setTimeout(() => {
            if (SceneManager.getCurrentScene() === 'battle') {
              if (window.GameApp) {
                window.GameApp.endBattle(true, this.money);
              } else {
                SceneManager.showScene('settlement', {
                  victory: true,
                  stageId: this.stageId,
                  goldEarned: baseGold
                });
              }
            }
          }, 3500); // 延长等待时间到3.5秒
        }
      }
    }
  
    draw() {
      this.ctx.clearRect(0, 0, this.width, this.height);
      
      // 绘制主题背景
      if (this.stageConfig && this.stageConfig.visualTheme) {
        const theme = this.stageConfig.visualTheme;
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.groundY);
        gradient.addColorStop(0, theme.sky[0]);
        gradient.addColorStop(1, theme.sky[1]);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
      }

      // 应用屏幕抖动效果
      this.ctx.save();
      if (this.screenShake.active) {
        this.ctx.translate(this.screenShake.offsetX, this.screenShake.offsetY);
      }
      
      // 绘制地面
      if (this.stageConfig && this.stageConfig.visualTheme) {
        this.ctx.fillStyle = this.stageConfig.visualTheme.ground;
        this.ctx.fillRect(0, this.groundY, this.width, this.height - this.groundY);
      }
      
      this.enemyBase.draw(this.ctx);
      this.playerBase.draw(this.ctx);
      
      // 绘制单位（根据 Y 轴纵深排序，确保近大远小遮挡正确）
      const sortedUnits = [...this.units].sort((a, b) => {
        const ay = a.y + (a.zOffset || 0);
        const by = b.y + (b.zOffset || 0);
        return ay - by;
      });

      for (let unit of sortedUnits) {
        unit.draw(this.ctx);
      }
      
      // 绘制弹道
      for (let projectile of this.projectiles) {
        projectile.draw(this.ctx);
      }
      
      // 绘制浮动文字
      for (let text of this.floatingTexts) {
        text.draw(this.ctx);
      }
      
      // 移除 Canvas 波次 HUD，已改用 HTML 顶部 HUD
      // this.drawWaveHUD();
      
      // 绘制猫薄荷狂热状态（右上角）
      if (this.catnipTimer > 0) {
        this.drawCatnipFeverHUD();
      }

      // 绘制时空冻结状态
      if (this.timeFreezeTimer > 0) {
        this.drawTimeFreezeHUD();
      }

      // 绘制紧急动员状态
      if (this.emergencyTimer > 0) {
        this.drawEmergencyHUD();
      }
      
      // 波次公告（屏幕中央）
      this.drawWaveAnnouncement();
      
      // Stage title overlay at battle start (最高优先级)
      if (this.stageTitleDisplayTimer > 0 && typeof LevelData !== 'undefined') {
        this.drawStageTitleOverlay();
      }
      
      if (this.levelUpPending) {
        this.drawLevelUpOverlay();
      }

      // 绘制波次间歇覆盖层（波次清空且下一波未开始时）
      if (this.waveManager.waveCleared && !this.waveManager.waveStarted && this.waveManager.waveDelayTimer > 0) {
        this.drawWaveBreakOverlay();
      }
      
      // Boss 波次暗化效果
      if (this.bossWave.darkenAlpha > 0) {
        this.ctx.save();
        this.ctx.fillStyle = `rgba(0, 0, 0, ${this.bossWave.darkenAlpha})`;
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.restore();
      }
      
      // Boss 血条
      if (this.bossWave.active && this.bossWave.bossUnits.length > 0) {
        this.drawBossHealthBars();
      }
      
      // 恢复上下文（结束屏幕抖动效果）
      this.ctx.restore();

      // Draw settlement particles (on top of everything)
      this.drawSettlementParticles();
    }

    updateSettlementParticles(gameSpeed) {
      // 1. 处理结算粒子 (优先级高)
      if (this.settlementParticleType === 'snow') {
        // Spawn snow
        if (Math.random() < 0.2 * gameSpeed) {
          this.settlementParticles.push({
            type: 'snow',
            x: Math.random() * this.width,
            y: -10,
            vx: (Math.random() - 0.5) * 2 - 2, // Wind from right
            vy: Math.random() * 1 + 1,
            size: Math.random() * 3 + 2,
            alpha: Math.random() * 0.5 + 0.5
          });
        }
      } else if (this.settlementParticleType === 'confetti') {
        // Spawn confetti
        if (Math.random() < 0.5 * gameSpeed) {
          const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffd700'];
          this.settlementParticles.push({
            type: 'confetti',
            x: Math.random() * this.width,
            y: -10,
            vx: (Math.random() - 0.5) * 6,
            vy: Math.random() * 3 + 3,
            size: Math.random() * 6 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * Math.PI * 2,
            vRotation: (Math.random() - 0.5) * 0.2
          });
        }
      } 
      // 2. 处理环境粒子 (仅在游戏运行且未结算时)
      else if (this.isRunning && this.stageConfig && this.stageConfig.visualTheme) {
        const pType = this.stageConfig.visualTheme.particles;
        if (pType === 'heatwave' && Math.random() < 0.1 * gameSpeed) {
          this.settlementParticles.push({
            type: 'heatwave',
            x: Math.random() * this.width,
            y: this.groundY,
            vx: (Math.random() - 0.5) * 1,
            vy: -Math.random() * 2 - 1,
            size: Math.random() * 20 + 10,
            alpha: 0.3,
            life: 1.0
          });
        } else if (pType === 'fire' && Math.random() < 0.15 * gameSpeed) {
          this.settlementParticles.push({
            type: 'fire',
            x: Math.random() * this.width,
            y: this.groundY,
            vx: (Math.random() - 0.5) * 2,
            vy: -Math.random() * 3 - 2,
            size: Math.random() * 4 + 2,
            color: Math.random() > 0.5 ? '#ff4500' : '#ff8c00',
            alpha: 1.0,
            life: 1.0
          });
        } else if (pType === 'wind' && Math.random() < 0.2 * gameSpeed) {
          const dir = this.wind.direction;
          this.settlementParticles.push({
            type: 'wind',
            x: dir > 0 ? this.width + 10 : -10,
            y: Math.random() * this.groundY,
            vx: dir > 0 ? (-Math.random() * 10 - 5) : (Math.random() * 10 + 5),
            vy: (Math.random() - 0.5) * 2,
            w: Math.random() * 40 + 20,
            h: 1,
            alpha: 0.2,
            life: 1.0
          });
        } else if (pType === 'holy' && Math.random() < 0.05 * gameSpeed) {
          this.settlementParticles.push({
            type: 'holy',
            x: Math.random() * this.width,
            y: Math.random() * this.groundY,
            vx: 0,
            vy: -Math.random() * 0.5 - 0.2,
            size: Math.random() * 5 + 5,
            alpha: 0,
            life: 1.0,
            maxAlpha: Math.random() * 0.5 + 0.3
          });
        }
      }

      // Update existing particles
      for (let i = this.settlementParticles.length - 1; i >= 0; i--) {
        const p = this.settlementParticles[i];
        p.x += p.vx * gameSpeed;
        p.y += p.vy * gameSpeed;
        if (p.rotation !== undefined) p.rotation += p.vRotation * gameSpeed;
        
        // 生命周期处理
        if (p.life !== undefined) {
          p.life -= 0.01 * gameSpeed;
          if (p.type === 'holy') {
            if (p.life > 0.5) p.alpha = Math.min(p.maxAlpha, p.alpha + 0.02 * gameSpeed);
            else p.alpha = Math.max(0, p.alpha - 0.02 * gameSpeed);
          } else {
            p.alpha = p.life;
          }
        }

        // Remove if out of bounds or dead
        if (p.y > this.height + 20 || p.y < -50 || p.x < -50 || p.x > this.width + 50 || (p.life !== undefined && p.life <= 0)) {
          this.settlementParticles.splice(i, 1);
        }
      }
    }

    drawSettlementParticles() {
      const ctx = this.ctx;
      for (let p of this.settlementParticles) {
        ctx.globalAlpha = p.alpha;
        
        if (p.type === 'snow') {
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'confetti') {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size / 2);
          ctx.restore();
        } else if (p.type === 'heatwave') {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'fire') {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'wind') {
          ctx.strokeStyle = `rgba(255, 255, 255, ${p.alpha})`;
          ctx.lineWidth = p.h;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          // 风线长度方向与速度方向一致
          ctx.lineTo(p.x + (p.vx > 0 ? -p.w : p.w), p.y);
          ctx.stroke();
        } else if (p.type === 'holy') {
          ctx.fillStyle = '#FFFACD';
          ctx.shadowColor = '#FFFACD';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
      ctx.globalAlpha = 1.0;
    }

    // 绘制猫薄荷狂热 HUD
    drawCatnipFeverHUD() {
      const seconds = Math.ceil(this.catnipTimer / 60);
      const text = `🌿 猫薄荷狂热: ${seconds}s`;
      
      this.ctx.save();
      this.ctx.font = 'bold 20px Arial';
      this.ctx.fillStyle = '#90EE90';
      this.ctx.textAlign = 'right';
      this.ctx.shadowColor = '#000';
      this.ctx.shadowBlur = 4;
      this.ctx.fillText(text, this.width - 20, 100);
      
      // 添加呼吸效果
      const pulse = (Math.sin(Date.now() / 200) + 1) / 2;
      this.ctx.globalAlpha = 0.3 + pulse * 0.7;
      this.ctx.strokeStyle = '#90EE90';
      this.ctx.lineWidth = 2;
      this.ctx.strokeText(text, this.width - 20, 100);
      this.ctx.restore();
    }

    // 绘制时空冻结 HUD
    drawTimeFreezeHUD() {
      const seconds = Math.ceil(this.timeFreezeTimer / 60);
      const text = `❄️ 时空冻结: ${seconds}s`;
      
      this.ctx.save();
      this.ctx.font = 'bold 20px Arial';
      this.ctx.fillStyle = '#4facfe';
      this.ctx.textAlign = 'right';
      this.ctx.shadowColor = '#000';
      this.ctx.shadowBlur = 4;
      this.ctx.fillText(text, this.width - 20, 130);
      
      // 蓝色发光效果
      const pulse = (Math.sin(Date.now() / 150) + 1) / 2;
      this.ctx.globalAlpha = 0.4 + pulse * 0.6;
      this.ctx.strokeStyle = '#00f2fe';
      this.ctx.lineWidth = 2;
      this.ctx.strokeText(text, this.width - 20, 130);
      this.ctx.restore();

      // 全屏淡蓝色滤镜
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(79, 172, 254, 0.1)';
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.restore();
    }

    // 绘制紧急动员 HUD
    drawEmergencyHUD() {
      const seconds = Math.ceil(this.emergencyTimer / 60);
      const text = `⚡ 紧急动员: ${seconds}s`;
      
      this.ctx.save();
      this.ctx.font = 'bold 20px Arial';
      this.ctx.fillStyle = '#FFD700';
      this.ctx.textAlign = 'right';
      this.ctx.shadowColor = '#000';
      this.ctx.shadowBlur = 4;
      this.ctx.fillText(text, this.width - 20, 160);
      
      // 金色发光效果
      const pulse = (Math.sin(Date.now() / 100) + 1) / 2;
      this.ctx.globalAlpha = 0.4 + pulse * 0.6;
      this.ctx.strokeStyle = '#FFA500';
      this.ctx.lineWidth = 2;
      this.ctx.strokeText(text, this.width - 20, 160);
      this.ctx.restore();
    }

    // 绘制 Boss 血条
    drawBossHealthBars() {
      const barWidth = 400;
      const barHeight = 30;
      const barX = (this.width - barWidth) / 2;
      let barY = 50;
      
      this.bossWave.bossUnits.forEach((boss, index) => {
        if (boss.isDead()) return;
        
        const currentY = barY + index * 45;
        
        // 背景
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.fillRect(barX - 5, currentY - 5, barWidth + 10, barHeight + 10);
        
        // 血条底色
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(barX, currentY, barWidth, barHeight);
        
        // 当前血量
        const healthPercent = boss.hp / boss.maxHP;
        const currentBarWidth = barWidth * healthPercent;
        
        // 血条渐变色
        const gradient = this.ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
        if (healthPercent > 0.5) {
          gradient.addColorStop(0, '#FF4444');
          gradient.addColorStop(1, '#FF6666');
        } else if (healthPercent > 0.25) {
          gradient.addColorStop(0, '#FF8800');
          gradient.addColorStop(1, '#FFAA00');
        } else {
          gradient.addColorStop(0, '#8B0000');
          gradient.addColorStop(1, '#FF0000');
        }
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(barX, currentY, currentBarWidth, barHeight);
        
        // 边框
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(barX, currentY, barWidth, barHeight);
        
      // 绘制血量文字
      this.ctx.font = 'bold 18px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillStyle = '#FFF';
      this.ctx.strokeStyle = '#000';
      this.ctx.lineWidth = 3;
      const text = `BOSS: ${boss.hp}/${boss.maxHP}`;
      this.ctx.strokeText(text, barX + barWidth / 2, currentY + barHeight / 2);
      this.ctx.fillText(text, barX + barWidth / 2, currentY + barHeight / 2);
    });
  }
    
    // 绘制波次间歇覆盖层（自动倒计时版本）
    drawWaveBreakOverlay() {
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      this.ctx.fillRect(0, 0, this.width, this.height);

      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      
      // WAVE CLEAR 提示
      this.ctx.font = 'bold 64px Arial';
      this.ctx.fillStyle = '#00FF00';
      this.ctx.strokeStyle = '#000';
      this.ctx.lineWidth = 4;
      this.ctx.strokeText('WAVE CLEAR!', this.width / 2, this.height / 2 - 80);
      this.ctx.fillText('WAVE CLEAR!', this.width / 2, this.height / 2 - 80);

      // 倒计时显示
      const secondsRemaining = Math.ceil(this.waveManager.waveDelayTimer / 60);
      this.ctx.font = 'bold 36px Arial';
      this.ctx.fillStyle = '#FFD700';
      const pulse = Math.sin(Date.now() / 300) * 0.15 + 0.85;
      this.ctx.globalAlpha = pulse;
      this.ctx.strokeText(`下一波即将到来: ${secondsRemaining}秒`, this.width / 2, this.height / 2 + 10);
      this.ctx.fillText(`下一波即将到来: ${secondsRemaining}秒`, this.width / 2, this.height / 2 + 10);
      
      // 提示信息
      this.ctx.font = 'bold 20px Arial';
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.globalAlpha = 0.7;
      this.ctx.fillText('继续准备你的防御！', this.width / 2, this.height / 2 + 60);
      
      this.ctx.restore();
    }
  
    drawStageTitleOverlay() {
      const alpha = Math.min(1, this.stageTitleDisplayTimer / 60);
      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      
      const title = LevelData.getFullStageTitle(this.stageId);
      this.ctx.font = 'bold 48px Arial';
      this.ctx.fillStyle = '#FFD700';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.strokeStyle = '#000';
      this.ctx.lineWidth = 4;
      this.ctx.strokeText(title, this.width / 2, this.height / 2 - 100);
      this.ctx.fillText(title, this.width / 2, this.height / 2 - 100);
      
      const config = this.stageConfig;
      if (!config) return;
      
      // 显示情报
      if (config.intel) {
        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillStyle = '#FF6B6B';
        this.ctx.strokeText(config.intel, this.width / 2, this.height / 2 - 40);
        this.ctx.fillText(config.intel, this.width / 2, this.height / 2 - 40);
      }

      // 显示关卡特性
      let traitText = '';
      if (config.modifiers.moveSpeedMultiplier) traitText = '✦ 环境：干燥地面 (双方移速+20%)';
      else if (config.modifiers.damageMultiplier) traitText = '✦ 环境：极端高温 (双方攻击+20%)';
      else if (config.modifiers.windForce) traitText = '✦ 环境：变幻狂风 (风向会随时间切换)';
      else if (this.stageId === 2) traitText = '✦ 机制：自爆威胁 (注意用基础猫排雷)';
      else if (this.stageId === 3) traitText = '✦ 机制：钢铁护盾 (狂战士是破盾专家)';
      else if (this.stageId === 4) traitText = '✦ 机制：治愈续航 (刺客猫负责绕后切后排)';
      else if (this.stageId === 5) traitText = '✦ 机制：全军出击 (综合机制大考)';
      else if (config.modifiers.allStatsMultiplier) traitText = '✦ 环境：神圣加持 (双方全属性+10%)';

      if (traitText) {
        this.ctx.font = 'italic bold 22px Arial';
        this.ctx.fillStyle = '#ffd700';
        this.ctx.strokeText(traitText, this.width / 2, this.height / 2 + 10);
        this.ctx.fillText(traitText, this.width / 2, this.height / 2 + 10);
      }
      
      // 显示波次数
      if (config.waves) {
        this.ctx.font = 'bold 18px Arial';
        this.ctx.fillStyle = '#AAAAAA';
        const waveText = `共 ${config.waves.length} 波挑战`;
        this.ctx.strokeText(waveText, this.width / 2, this.height / 2 + 50);
        this.ctx.fillText(waveText, this.width / 2, this.height / 2 + 50);
      }
      
      this.ctx.globalAlpha = 1;
      this.ctx.textAlign = 'left';
      this.ctx.textBaseline = 'alphabetic';
      this.ctx.restore();
    }

    // 绘制波次公告
    drawWaveAnnouncement() {
      if (this.waveManager.waveAnnounceTimer <= 0) return;
      
      // 如果正在显示关卡标题，则推迟波次公告的显示
      if (this.stageTitleDisplayTimer > 60) return;
      
      const alpha = Math.min(1, this.waveManager.waveAnnounceTimer / 30);
      const scale = 1 + (1 - alpha) * 0.3;  // 放大效果
      
      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      
      // 主标题
      const fontSize = Math.floor(42 * scale);
      this.ctx.font = `bold ${fontSize}px Arial`;
      
      // 最终波用红色
      if (this.waveManager.isFinalWave) {
        this.ctx.fillStyle = '#FF4444';
        this.ctx.shadowColor = '#FF0000';
      } else {
        this.ctx.fillStyle = '#FFD700';
        this.ctx.shadowColor = '#FFD700';
      }
      this.ctx.shadowBlur = 15;
      this.ctx.strokeStyle = '#000';
      this.ctx.lineWidth = 4;
      
      this.ctx.strokeText(this.waveManager.waveAnnounceText, this.width / 2, this.height / 2 - 10);
      this.ctx.fillText(this.waveManager.waveAnnounceText, this.width / 2, this.height / 2 - 10);
      
      // 副标题
      if (this.waveManager.waveAnnounceSub) {
        this.ctx.shadowBlur = 0;
        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.strokeText(this.waveManager.waveAnnounceSub, this.width / 2, this.height / 2 + 30);
        this.ctx.fillText(this.waveManager.waveAnnounceSub, this.width / 2, this.height / 2 + 30);
      }
      
      this.ctx.restore();
    }

    // 绘制波次进度 HUD
    drawWaveHUD() {
      if (this.waveManager.totalWaves === 0) return;
      
      this.ctx.save();
      
      // 位置：左上角
      const x = 20;
      const y = 20;
      
      // 背景 (使用兼容性更好的方式绘制圆角矩形)
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      this.ctx.beginPath();
      const r = 8;
      const w = 180;
      const h = 50;
      this.ctx.moveTo(x + r, y);
      this.ctx.lineTo(x + w - r, y);
      this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      this.ctx.lineTo(x + w, y + h - r);
      this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      this.ctx.lineTo(x + r, y + h);
      this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      this.ctx.lineTo(x, y + r);
      this.ctx.quadraticCurveTo(x, y, x + r, y);
      this.ctx.closePath();
      this.ctx.fill();
      
      // 波次文字
      this.ctx.font = 'bold 16px Arial';
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.textAlign = 'left';
      this.ctx.textBaseline = 'top';
      
      const currentWave = this.waveManager.currentWaveIndex + 1;
      const totalWaves = this.waveManager.totalWaves;
      this.ctx.fillText(`Wave ${currentWave} / ${totalWaves}`, x + 10, y + 8);
      
      // 剩余敌人数量
      if (this.waveManager.waveStarted && !this.waveManager.waveCleared) {
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#AAAAAA';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`剩余敌人: ${this.waveManager.enemiesRemaining}`, x + 170, y + 12);
        this.ctx.textAlign = 'left';
      }
      
      // 波次进度条
      const barX = x + 10;
      const barY = y + 30;
      const barWidth = 160;
      const barHeight = 12;
      
      // 背景条
      this.ctx.fillStyle = '#333';
      this.ctx.fillRect(barX, barY, barWidth, barHeight);
      
      // 进度条 - 每完成一波填充一段
      const segmentWidth = barWidth / totalWaves;
      for (let i = 0; i < currentWave; i++) {
        const isCurrentWave = (i === currentWave - 1);
        const isCleared = i < currentWave - 1 || this.waveManager.waveCleared;
        
        if (isCleared) {
          this.ctx.fillStyle = '#00FF00';  // 已清空 - 绿色
        } else if (isCurrentWave && this.waveManager.waveStarted) {
          this.ctx.fillStyle = '#FFD700';  // 进行中 - 金色
        } else {
          this.ctx.fillStyle = '#666';     // 未开始 - 灰色
        }
        
        this.ctx.fillRect(barX + i * segmentWidth + 1, barY + 1, segmentWidth - 2, barHeight - 2);
      }
      
      // 最终波标记
      if (this.waveManager.isFinalWave && this.waveManager.waveStarted) {
        this.ctx.font = 'bold 12px Arial';
        this.ctx.fillStyle = '#FF4444';
        this.ctx.textAlign = 'right';
        this.ctx.fillText('FINAL!', x + 175, y + 8);
      }
      
      this.ctx.restore();
    }
    drawLevelUpOverlay() {
      // Dark overlay
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      this.ctx.fillRect(0, 0, this.width, this.height);
      
      // Title
      this.ctx.font = 'bold 64px Arial';
      this.ctx.fillStyle = '#FFD700';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.shadowColor = '#FFD700';
      this.ctx.shadowBlur = 20;
      this.ctx.fillText('战斗升级!', this.width / 2, 80);
      this.ctx.shadowBlur = 0;
      
      // Subtitle
      this.ctx.font = 'bold 24px Arial';
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillText(`Lv.${this.battleLevel} → Lv.${this.battleLevel + 1}`, this.width / 2, 140);
      this.ctx.fillText('选择本局强化 (下一关重置)', this.width / 2, 180);
      
      this.ctx.textAlign = 'left';
      this.ctx.textBaseline = 'alphabetic';
    }
  
    getCooldownPercent(type) {
      switch(type) {
        case 'basic':
          return this.basicCatCooldown / this.basicCatCooldownMax;
        case 'tank':
          return this.tankCatCooldown / this.tankCatCooldownMax;
        case 'lizard':
          return this.lizardCatCooldown / this.lizardCatCooldownMax;
        case 'assassin':
          return this.assassinCatCooldown / this.assassinCatCooldownMax;
        case 'shaman':
          return this.shamanCatCooldown / this.shamanCatCooldownMax;
        case 'berserker':
          return this.berserkerCatCooldown / this.berserkerCatCooldownMax;
        case 'engineer':
          return this.engineerCatCooldown / this.engineerCatCooldownMax;
        case 'titan':
          return this.titanCatCooldown / this.titanCatCooldownMax;
        default:
          return 0;
      }
    }
  
    canSpawn(type) {
      if (this.gameOver || this.levelComplete) return false;
      
      const stats = this.playerStats[type];
      if (!stats) return false;
      
      const cooldowns = {
        basic: this.basicCatCooldown,
        tank: this.tankCatCooldown,
        lizard: this.lizardCatCooldown,
        assassin: this.assassinCatCooldown,
        shaman: this.shamanCatCooldown,
        berserker: this.berserkerCatCooldown,
        engineer: this.engineerCatCooldown,
        titan: this.titanCatCooldown
      };
      
      return this.money >= stats.cost && cooldowns[type] <= 0 && this.deck.includes(type);
    }
  
    canUpgradeWallet() {
      return false; // 已废弃
    }
  
    calculateGoldReward() {
      // Base gold based on stage
      const baseRewards = {
        1: 100,
        2: 150,
        3: 200,
        4: 300,
        5: 500
      };
      return baseRewards[this.stageId] || (100 + (this.stageId - 1) * 100);
    }
  
    gainXP(amount, x, y) {
      this.battleXP += amount;
      
      // Create floating text
      this.floatingTexts.push(new FloatingText(`+${amount} XP`, x, y, '#FFD700'));
      
      // Check for level up
      if (this.battleXP >= this.xpToNextLevel) {
        this.triggerLevelUp();
      }
    }
  
    triggerLevelUp() {
      this.levelUpPending = true;
      this.gameSpeed = 0; // Pause the game completely
    }
  
    generateBattleDraftCards() {
      const baseCards = [
        // === 动态增益卡（6 张，基于玩家行为动态变化）===
        {
          id: 'cat_legion',
          icon: '🐾',
          title: '猫咪军团',
          baseValue: 0.05,
          description: (v) => `场上每多一个猫咪，所有单位攻击力 +${Math.round(v * 100)}%`,
          condition: () => true
        },
        {
          id: 'compound_interest',
          icon: '💹',
          title: '利滚利',
          baseValue: 0.0015,
          description: (v) => `金币生成速度额外提升（当前金币余额 × ${(v * 100).toFixed(2)}%）`,
          condition: () => true
        },
        {
          id: 'back_to_wall',
          icon: '🩸',
          title: '背水一战',
          baseValue: 0.005,
          description: (v) => `基地每损失 1% 生命值，全军攻击力提升 ${(v * 100).toFixed(1)}%`,
          condition: () => true
        },
        {
          id: 'vengeance_fire',
          icon: '😡',
          title: '复仇之火',
          baseValue: 0.08,
          description: (v) => `己方每阵亡一个单位，全军攻速提升 ${Math.round(v * 100)}%`,
          condition: () => true
        },
        {
          id: 'sentinel',
          icon: '👁️',
          title: '守望者',
          baseValue: 0.008,
          description: (v) => `单位距离基地越近，受到的伤害降低（每靠近 100 像素减伤 ${(v * 100).toFixed(1)}%）`,
          condition: () => true
        },
        {
          id: 'spreading_fear',
          icon: '😱',
          title: '恐惧蔓延',
          baseValue: 0.02,
          description: (v) => `每击杀一个敌人，所有敌军移速 -${(v * 100).toFixed(1)}%（可叠加）`,
          condition: () => true
        },
        
        // === 风险/规则变更卡（4 张，高风险高回报）===
        {
          id: 'glass_cannon',
          icon: '💥',
          title: '玻璃大炮',
          baseValue: 0.5,
          description: (v) => `所有猫咪攻击力 +${Math.round(v * 100)}%，但生命值 -30%`,
          condition: () => true
        },
        {
          id: 'greedy_curse',
          icon: '🎲',
          title: '贪婪诅咒',
          baseValue: 1.0,
          description: (v) => `战斗经验获取翻倍，但敌方单位攻速 +30%`,
          condition: () => true
        },
        {
          id: 'desperate_gamble',
          icon: '💀',
          title: '孤注一掷',
          baseValue: 3.0,
          description: (v) => `当基地生命值低于 20% 时，全军攻击力 ×${v.toFixed(1)}`,
          condition: () => true
        },
        {
          id: 'fast_learning',
          icon: '🎓',
          title: '速成学习',
          baseValue: 0.4,
          description: (v) => `战斗升级所需经验 -${Math.round(v * 100)}%`,
          condition: () => true
        },
        
        // === 行动/属性强化卡（8 张，直接提升或特殊效果）===
        {
          id: 'weakness_breakthrough',
          icon: '🔍',
          title: '弱点突破',
          baseValue: 0.7,
          description: (v) => `克制伤害额外提升 ${Math.round(v * 100)}% (刺客对狗/蛇，蜥蜴对大象/河马，坦克对重型单位)`,
          condition: () => true
        },
        {
          id: 'link_summon',
          icon: '🔗',
          title: '连携召唤',
          baseValue: 0.4,
          description: (v) => `召唤坦克猫时，有 ${Math.round(v * 100)}% 概率额外免费召唤一个基础猫`,
          condition: () => this.unlockedUnits.tank
        },
        {
          id: 'emergency_boost',
          icon: '⚡',
          title: '紧急提速',
          baseValue: 0.3,
          description: (v) => `所有主动技能持续时间 +${Math.round(v * 100)}%，使用道具时有 ${Math.round(v * 100)}% 概率不消耗道具`,
          condition: () => true
        },
        {
          id: 'battle_spoils',
          icon: '🎖️',
          title: '战利品',
          baseValue: 12,
          description: (v) => `本场战斗中，每击杀一个敌人额外获得 ${v} 金币`,
          condition: () => true
        },
        {
          id: 'swift_pace',
          icon: '🏃',
          title: '疾行',
          baseValue: 0.35,
          description: (v) => `所有猫咪移动速度 +${Math.round(v * 100)}%`,
          condition: () => true
        },
        {
          id: 'tower_defense',
          icon: '🏯',
          title: '塔防强化',
          baseValue: 50,
          description: (v) => `防御塔反击范围 +${v}，反击伤害 +${v}`,
          condition: () => true
        },
        {
          id: 'thorn_armor',
          icon: '🌵',
          title: '荆棘装甲',
          baseValue: 0.3,
          description: (v) => `所有猫咪受到伤害时，反弹 ${Math.round(v * 100)}% 伤害给攻击者`,
          condition: () => true
        },
        {
          id: 'emergency_reinforcements',
          icon: '📣',
          title: '紧急增援',
          baseValue: 3,
          description: (v) => `立即在基地前召唤 ${v} 个基础猫`,
          condition: () => true
        }
      ];
      
      const availableBaseCards = baseCards.filter(card => card.condition());
      const selectedCards = [];
      
      // 随机抽取 3 种不同的基础卡牌
      const shuffledBase = availableBaseCards.sort(() => 0.5 - Math.random()).slice(0, 3);
      
      shuffledBase.forEach(base => {
        // 为每张卡牌随机决定品质
        const rarity = this.rollRarity();
        const config = this.RARITY_CONFIG[rarity];
        
        // 判断是否为百分比类卡牌（不四舍五入）
        const isPercentage = ['cat_legion', 'compound_interest', 'back_to_wall', 'vengeance_fire', 
                               'sentinel', 'spreading_fear', 'glass_cannon', 'greedy_curse', 
                               'desperate_gamble', 'fast_learning', 'weakness_breakthrough', 
                               'link_summon', 'emergency_boost', 'swift_pace', 'thorn_armor'].includes(base.id);
        
        const finalValue = isPercentage
          ? base.baseValue * config.multiplier
          : Math.round(base.baseValue * config.multiplier);

        selectedCards.push({
          id: base.id,
          icon: base.icon,
          title: base.title,
          rarity: rarity,
          rarityName: config.name,
          rarityColor: config.color,
          rarityClass: config.class,
          value: finalValue,
          description: base.description(finalValue)
        });
      });
      
      return selectedCards;
    }

    // 随机抽取品质
    rollRarity() {
      const totalWeight = Object.values(this.RARITY_CONFIG).reduce((sum, c) => sum + (c.weight || 0), 0);
      let random = Math.random() * totalWeight;
      
      for (const [key, config] of Object.entries(this.RARITY_CONFIG)) {
        random -= config.weight;
        if (random <= 0) return key;
      }
      return 'common';
    }
  
    applyBattleDraftCard(card) {
      const { id, value } = card;
      
      switch(id) {
        // === 动态增益卡 ===
        case 'cat_legion':
          this.battleBuffs.legionBonus = (this.battleBuffs.legionBonus || 0) + value;
          break;
        case 'compound_interest':
          this.battleBuffs.compoundInterestRate = (this.battleBuffs.compoundInterestRate || 0) + value;
          break;
        case 'back_to_wall':
          this.battleBuffs.backToWallBonus = (this.battleBuffs.backToWallBonus || 0) + value;
          break;
        case 'vengeance_fire':
          this.battleBuffs.vengeanceBonus = (this.battleBuffs.vengeanceBonus || 0) + value;
          break;
        case 'sentinel':
          this.battleBuffs.sentinelBonus = (this.battleBuffs.sentinelBonus || 0) + value;
          break;
        case 'spreading_fear':
          this.battleBuffs.spreadingFearBonus = (this.battleBuffs.spreadingFearBonus || 0) + value;
          break;
        
        // === 风险/规则变更卡 ===
        case 'glass_cannon':
          this.battleBuffs.glassCannonDamage = (this.battleBuffs.glassCannonDamage || 0) + value;
          this.battleBuffs.glassCannonHpPenalty = 0.3;
          break;
        case 'greedy_curse':
          this.battleBuffs.greedyCurseActive = true;
          break;
        case 'desperate_gamble':
          this.battleBuffs.desperateGambleActive = true;
          break;
        case 'fast_learning':
          this.battleBuffs.xpToNextLevelReduction = (this.battleBuffs.xpToNextLevelReduction || 0) + value;
          break;
        
        // === 行动/属性强化卡 ===
        case 'weakness_breakthrough':
          this.battleBuffs.counterMultiplierBonus = (this.battleBuffs.counterMultiplierBonus || 0) + value;
          break;
        case 'link_summon':
          this.battleBuffs.linkSummonChance = (this.battleBuffs.linkSummonChance || 0) + value;
          break;
        case 'emergency_boost':
          // 所有主动技能持续时间增加，使用道具时有概率不消耗
          this.battleBuffs.skillDurationBonus = (this.battleBuffs.skillDurationBonus || 0) + value;
          this.battleBuffs.itemRecycleChance = (this.battleBuffs.itemRecycleChance || 0) + value;
          break;
        case 'battle_spoils':
          this.battleBuffs.killGoldBonus += value;
          break;
        case 'swift_pace':
          this.battleBuffs.moveSpeedBonus = (this.battleBuffs.moveSpeedBonus || 0) + value;
          break;
        case 'tower_defense':
          this.battleBuffs.towerRangeBonus += value;
          this.battleBuffs.towerAtkBonus += value;
          break;
        case 'thorn_armor':
          this.battleBuffs.reflectDamage = (this.battleBuffs.reflectDamage || 0) + value;
          this.battleBuffs.thornArmorActive = true;
          break;
        case 'emergency_reinforcements':
          for (let i = 0; i < value; i++) {
            this.spawnBasicCat(true);
          }
          break;
      }
      
      // Complete level up
      this.battleLevel++;
      this.battleXP -= this.xpToNextLevel;
      
      // 计算下一级所需经验
      // 基础增长：前几级增长较慢，方便发育
      let nextXpRequirement;
      if (this.battleLevel <= 5) {
        nextXpRequirement = Math.floor(this.xpToNextLevel * 1.3);
      } else {
        nextXpRequirement = Math.floor(this.xpToNextLevel * 1.5);
      }
      
      // 应用“速成学习”减免 (上限 50%)
      if (this.battleBuffs.xpToNextLevelReduction > 0) {
        const reduction = Math.min(0.5, this.battleBuffs.xpToNextLevelReduction);
        nextXpRequirement = Math.floor(nextXpRequirement * (1 - reduction));
      }
      
      // 确保每级需求至少比上一级增加 15%
      const minIncrease = Math.floor(this.xpToNextLevel * 1.15);
      this.xpToNextLevel = Math.max(minIncrease, nextXpRequirement);
      
      this.levelUpPending = false;
      this.gameSpeed = 1;
    }
  
    // 触发屏幕抖动
    shakeScreen(intensity = 10, duration = 20) {
      this.screenShake.active = true;
      this.screenShake.intensity = intensity;
      this.screenShake.duration = duration;
      this.screenShake.timer = 0;
    }
  
    // 激活紧急动员技能
    activateEmergencySkill() {
      if (this.emergencySkill.cooldownTimer > 0 || this.gameOver) {
        return false;
      }
      
      this.emergencySkill.active = true;
      this.emergencySkill.timer = 0;
      this.emergencySkill.cooldownTimer = this.emergencySkill.cooldown;
      
      // 视觉反馈
      this.floatingTexts.push(new FloatingText(
        '⚡ 紧急动员！⚡', 
        this.width / 2, 
        this.height / 3, 
        '#FFD700'
      ));
      
      return true;
    }
  
    // 使用加农炮轰击道具（全屏伤害+击退）
    useCannonStrike() {
      // 对所有敌方单位造成大量伤害并击退
      this.units.forEach(unit => {
        if (unit.team === 'enemy' && unit.hp > 0) {
          const damage = 500; // 固定伤害
          unit.takeDamage(damage);
          
          // 强制触发击退
          if (unit.hp > 0 && !unit.isInvulnerable) {
            unit.triggerKnockback();
          }
        }
      });
      
      // 对敌方基地造成伤害
      if (this.enemyBase && this.enemyBase.hp > 0) {
        this.enemyBase.takeDamage(300);
      }
      
      // 屏幕抖动效果
      this.shakeScreen(20, 60);
      
    // 添加浮动文本提示
    this.floatingTexts.push(new FloatingText('加农炮轰击！', this.width / 2, this.height / 2, '#FF4444'));
  }

  // 使用时空冻结道具
  useTimeFreeze(duration) {
    this.timeFreezeTimer = duration;
    this.shakeScreen(5, 30);
    this.floatingTexts.push(new FloatingText('❄️ 时空冻结！', this.width / 2, this.height / 2, '#4facfe'));
  }

  // 使用紧急维修道具
  useInstantRepair(percent) {
    const repairAmount = Math.floor(this.playerBase.maxHP * percent);
    this.playerBase.hp = Math.min(this.playerBase.hp + repairAmount, this.playerBase.maxHP);
    this.floatingTexts.push(new FloatingText('🔧 紧急维修！', this.playerBase.x, this.playerBase.y - 50, '#90EE90'));
  }

  // 使用猫薄荷狂热道具（所有己方单位伤害翻倍）
  useCatnipFever(duration) {
    this.catnipTimer = duration;
    this.shakeScreen(5, 30);
    this.floatingTexts.push(new FloatingText('🌿 猫薄荷狂热！', this.width / 2, this.height / 2, '#7FFF00'));
  }

  // 使用点金术道具（当前金币余额的 50% 转化为商店金币）
  useMidasTouch() {
    const convertAmount = Math.floor(this.money * 0.5);
    // 这里需要通过回调传递给 GameApp，将金币转换为 runGold
    if (this.onMidasTouch) {
      this.onMidasTouch(convertAmount);
      this.floatingTexts.push(new FloatingText(`✨ 点金术！转化 ${convertAmount} 金币`, this.width / 2, this.height / 2, '#FFD700'));
    }
  }
    
  // 使用紧急动员道具
  useEmergencyMobilization(duration) {
    this.emergencyTimer = duration;
    this.shakeScreen(5, 30);
    this.floatingTexts.push(new FloatingText('⚡ 紧急动员！', this.width / 2, this.height / 2, '#FFD700'));
  }
    
    // 更新屏幕抖动状态
    updateScreenShake() {
      if (!this.screenShake.active) return;
      
      this.screenShake.timer++;
      
      if (this.screenShake.timer >= this.screenShake.duration) {
        this.screenShake.active = false;
        this.screenShake.offsetX = 0;
        this.screenShake.offsetY = 0;
      } else {
        // 随机偏移，强度随时间衰减
        const progress = this.screenShake.timer / this.screenShake.duration;
        const currentIntensity = this.screenShake.intensity * (1 - progress);
        this.screenShake.offsetX = (Math.random() - 0.5) * currentIntensity * 2;
        this.screenShake.offsetY = (Math.random() - 0.5) * currentIntensity * 2;
      }
    }
  
    gameLoop() {
      if (!this.isRunning) return;
      
      this.update();
      this.draw();
      
      requestAnimationFrame(() => this.gameLoop());
    }
  }
  
  // Floating text class for XP notifications
  class FloatingText {
    constructor(text, x, y, color) {
      this.text = text;
      this.x = x;
      this.y = y;
      this.color = color;
      this.alpha = 1;
      this.lifetime = 60; // 1 second at 60fps
      this.timer = 0;
    }
  
    update() {
      this.timer++;
      this.y -= 1; // Float upward
      this.alpha = 1 - (this.timer / this.lifetime);
    }
  
    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.font = 'bold 20px Arial';
      ctx.fillStyle = this.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText(this.text, this.x, this.y);
      ctx.fillText(this.text, this.x, this.y);
      ctx.restore();
    }
  
    isDead() {
      return this.timer >= this.lifetime;
    }
  }
  