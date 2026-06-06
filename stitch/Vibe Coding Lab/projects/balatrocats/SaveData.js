class SaveData {
  static STORAGE_KEY = 'battlecats_td_save';
  
  static getDefaultData() {
    return {
      version: 1,
      totalGold: 2000,           // 持久化总金币（初始给2000方便测试）
      
      // 关卡进度
      unlockedStages: [1],       // 已解锁关卡
      clearedStages: [],         // 已通关关卡（首次通关奖励）
      
      // 角色系统
      unlockedUnits: {
        basic: true,             // 基础猫默认拥有
        tank: false,             // 需要招募
        lizard: false            // 需要招募
      },
      
      // RPG等级系统
      unitLevels: {
        basic: 1,
        tank: 1,
        lizard: 1
      },
      
      // 基地等级
      baseLevel: 1,
      
      // 卡组配置
      selectedDeck: ['basic', 'basic', 'basic']  // 最多5个
    };
  }
  
  // 加载存档
  static load() {
    try {
      const json = localStorage.getItem(this.STORAGE_KEY);
      if (!json) return this.getDefaultData();
      
      const data = JSON.parse(json);
      // 合并默认数据（防止版本更新后缺少字段）
      return { ...this.getDefaultData(), ...data };
    } catch (e) {
      console.error('存档加载失败:', e);
      return this.getDefaultData();
    }
  }
  
  // 保存存档
  static save(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('存档保存失败:', e);
      return false;
    }
  }
  
  // 添加金币
  static addGold(amount) {
    const data = this.load();
    data.totalGold += amount;
    this.save(data);
    return data.totalGold;
  }
  
  // 消费金币
  static spendGold(amount) {
    const data = this.load();
    if (data.totalGold < amount) return false;
    data.totalGold -= amount;
    this.save(data);
    return true;
  }
  
  // 获取金币数量
  static getGold() {
    return this.load().totalGold;
  }
  
  // 解锁关卡
  static unlockStage(stageId) {
    const data = this.load();
    if (!data.unlockedStages.includes(stageId)) {
      data.unlockedStages.push(stageId);
      this.save(data);
    }
  }
  
  // 标记关卡已通关（返回是否首次通关）
  static clearStage(stageId) {
    const data = this.load();
    if (!data.clearedStages.includes(stageId)) {
      data.clearedStages.push(stageId);
      this.save(data);
      return true; // 首次通关
    }
    return false;
  }
  
  // 检查关卡是否已通关
  static isStageClear(stageId) {
    const data = this.load();
    return data.clearedStages.includes(stageId);
  }
  
  // 检查关卡是否解锁
  static isStageUnlocked(stageId) {
    const data = this.load();
    return data.unlockedStages.includes(stageId);
  }
  
  // 解锁角色
  static unlockUnit(unitType) {
    const data = this.load();
    data.unlockedUnits[unitType] = true;
    this.save(data);
  }
  
  // 检查角色是否解锁
  static isUnitUnlocked(unitType) {
    const data = this.load();
    return data.unlockedUnits[unitType] === true;
  }
  
  // 升级角色
  static upgradeUnit(unitType) {
    const data = this.load();
    data.unitLevels[unitType] = (data.unitLevels[unitType] || 1) + 1;
    this.save(data);
  }
  
  // 升级基地
  static upgradeBase() {
    const data = this.load();
    data.baseLevel = (data.baseLevel || 1) + 1;
    this.save(data);
  }
  
  // 设置卡组
  static setDeck(deck) {
    const data = this.load();
    data.selectedDeck = deck;
    this.save(data);
  }
  
  // 获取卡组
  static getDeck() {
    return this.load().selectedDeck;
  }
  
  // 重置存档
  static reset() {
    this.save(this.getDefaultData());
  }
  
  // 初始化（确保存档存在）
  static init() {
    const data = this.load();
    this.save(data);
  }
}
