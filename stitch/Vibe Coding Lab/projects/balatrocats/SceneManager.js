class SceneManager {
  static currentScene = null;
  static gameInstance = null;  // 保存Game实例
  static scenes = {};
  
  static init() {
    // 初始化所有场景DOM引用
    this.scenes = {
      'main-menu': document.getElementById('main-menu-scene'),
      'stage-select': document.getElementById('stage-select-scene'),
      'deck-edit': document.getElementById('deck-edit-scene'),
      'battle': document.getElementById('battle-scene'),
      'settlement': document.getElementById('settlement-scene'),
      'shop': document.getElementById('shop-scene'),
      'recruit': document.getElementById('recruit-scene')
    };
  }
  
  static showScene(sceneName, data = null) {
    // 清理旧的游戏实例
    if (this.currentScene === 'battle' && sceneName !== 'battle') {
      if (this.gameInstance) {
        this.gameInstance.isRunning = false;
        this.gameInstance = null;
      }
    }
    
    // 隐藏所有场景
    for (let name in this.scenes) {
      if (this.scenes[name]) {
        this.scenes[name].classList.remove('active');
      }
    }
    
    // 显示目标场景
    if (this.scenes[sceneName]) {
      this.scenes[sceneName].classList.add('active');
      this.currentScene = sceneName;
      
      // 初始化场景逻辑
      this.initScene(sceneName, data);
    } else {
      console.error(`场景 ${sceneName} 不存在`);
    }
  }
  
  static initScene(sceneName, data) {
    switch(sceneName) {
      case 'main-menu':
        if (window.MainMenu) MainMenu.init();
        break;
      case 'stage-select':
        if (window.StageSelect) StageSelect.init();
        break;
      case 'deck-edit':
        if (window.DeckEdit) DeckEdit.init(data);
        break;
      case 'battle':
        this.startBattle(data);
        break;
      case 'settlement':
        if (window.Settlement) Settlement.init(data);
        break;
      case 'shop':
        if (window.Shop) Shop.init();
        break;
      case 'recruit':
        if (window.Recruit) Recruit.init();
        break;
    }
  }
  
  static startBattle(config) {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
      console.error('Canvas not found!');
      return;
    }
    
    // 创建新的游戏实例
    this.gameInstance = new Game(canvas, config.stage, config.deck);
  }
  
  static getCurrentScene() {
    return this.currentScene;
  }
  
  static getGameInstance() {
    return this.gameInstance;
  }
}
