class Settlement {
  static init(data) {
    const { victory, stageId, goldEarned } = data;
    
    this.victory = victory;
    this.stageId = stageId;
    this.baseGold = goldEarned;
    
    console.log("[DEBUG] Settlement init: victory =", victory);
    if (this.victory && window.audioManager) {
      console.log("[DEBUG] Calling playVictory");
      window.audioManager.playVictory();
    }
    
    this.displayResults();
    this.setupButtons();
  }
  
  static displayResults() {
    const container = document.getElementById('settlement-results');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (this.victory) {
      // Victory UI
      const isFirstClear = !SaveData.isStageClear(this.stageId);
      const firstClearBonus = isFirstClear ? Math.floor(this.baseGold * 0.5) : 0;
      const totalGold = this.baseGold + firstClearBonus;
      
      // Mark stage as cleared and add gold
      if (isFirstClear) {
        SaveData.clearStage(this.stageId);
        // Unlock next stage
        SaveData.unlockStage(this.stageId + 1);
      }
      SaveData.addGold(totalGold);
      
      container.innerHTML = `
        <div class="settlement-victory">
          <h1 class="victory-title">🎉 关卡完成！</h1>
          <div class="settlement-stats">
            <div class="stat-row">
              <span class="stat-label">关卡:</span>
              <span class="stat-value">第${this.stageId}关</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">基础奖励:</span>
              <span class="stat-value gold-text">${this.baseGold} 金币</span>
            </div>
            ${isFirstClear ? `
            <div class="stat-row first-clear">
              <span class="stat-label">⭐ 首次通关奖励:</span>
              <span class="stat-value gold-text">+${firstClearBonus} 金币</span>
            </div>
            ` : ''}
            <div class="stat-row total">
              <span class="stat-label">总计获得:</span>
              <span class="stat-value gold-text-large">${totalGold} 金币</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">当前总金币:</span>
              <span class="stat-value gold-text-large">${SaveData.getGold()} 金币</span>
            </div>
          </div>
        </div>
      `;
    } else {
      // Defeat UI
      container.innerHTML = `
        <div class="settlement-defeat">
          <h1 class="defeat-title">💀 战斗失败</h1>
          <div class="settlement-stats">
            <div class="stat-row">
              <span class="stat-label">关卡:</span>
              <span class="stat-value">第${this.stageId}关</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">获得金币:</span>
              <span class="stat-value">0 金币</span>
            </div>
            <p class="defeat-message">再试一次吧！也许可以先升级你的单位？</p>
          </div>
        </div>
      `;
    }
  }
  
  static setupButtons() {
    const menuBtn = document.getElementById('btn-return-to-menu');
    if (menuBtn) {
      menuBtn.onclick = () => {
        SceneManager.showScene('main-menu');
      };
    }
    
    const retryBtn = document.getElementById('btn-retry-stage');
    if (retryBtn) {
      retryBtn.onclick = () => {
        // Go back to deck edit with same stage
        SceneManager.showScene('deck-edit', { stageId: this.stageId });
      };
    }
  }
}
