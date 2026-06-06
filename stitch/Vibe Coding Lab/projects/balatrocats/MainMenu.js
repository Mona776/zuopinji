class MainMenu {
  static init() {
    this.updateGoldDisplay();
    this.setupEventListeners();
  }
  
  static updateGoldDisplay() {
    const goldDisplay = document.getElementById('menu-gold-display');
    if (goldDisplay) {
      const totalGold = SaveData.getGold();
      goldDisplay.textContent = `总金币: ${totalGold}`;
    }
  }
  
  static setupEventListeners() {
    // 开始战斗按钮
    const battleBtn = document.getElementById('btn-start-battle');
    if (battleBtn) {
      battleBtn.onclick = () => {
        SceneManager.showScene('stage-select');
      };
    }
    
    // 升级商店按钮
    const shopBtn = document.getElementById('btn-upgrade-shop');
    if (shopBtn) {
      shopBtn.onclick = () => {
        SceneManager.showScene('shop');
      };
    }
    
    // 招募按钮
    const recruitBtn = document.getElementById('btn-recruit');
    if (recruitBtn) {
      recruitBtn.onclick = () => {
        SceneManager.showScene('recruit');
      };
    }
    
    // 重置存档按钮（调试用）
    const resetBtn = document.getElementById('btn-reset-save');
    if (resetBtn) {
      resetBtn.onclick = () => {
        if (confirm('确定要重置所有存档吗？')) {
          SaveData.reset();
          this.updateGoldDisplay();
          alert('存档已重置！');
        }
      };
    }
  }
}
