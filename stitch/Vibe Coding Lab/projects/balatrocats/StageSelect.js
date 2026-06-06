class StageSelect {
  static stages = [
    { id: 1, name: '第1关', difficulty: '简单', goldReward: 100 },
    { id: 2, name: '第2关', difficulty: '普通', goldReward: 150 },
    { id: 3, name: '第3关', difficulty: '困难', goldReward: 200 },
    { id: 4, name: '第4关', difficulty: '精英', goldReward: 300 },
    { id: 5, name: '第5关 - Boss', difficulty: '挑战', goldReward: 500 }
  ];
  
  static init() {
    this.renderStages();
    this.setupBackButton();
  }
  
  static renderStages() {
    const container = document.getElementById('stage-list-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    this.stages.forEach(stage => {
      const isUnlocked = SaveData.isStageUnlocked(stage.id);
      const isCleared = SaveData.isStageClear(stage.id);
      
      const stageCard = document.createElement('div');
      stageCard.className = `stage-card ${isUnlocked ? '' : 'locked'}`;
      
      stageCard.innerHTML = `
        <div class="stage-header">
          <h3>${stage.name}</h3>
          ${isCleared ? '<span class="clear-badge">★ 已通关</span>' : ''}
        </div>
        <div class="stage-info">
          <p>难度: <span class="difficulty">${stage.difficulty}</span></p>
          <p>奖励: <span class="gold-reward">${stage.goldReward} 金币</span></p>
          ${isCleared ? '<p class="first-clear-bonus">(首次通关已领取)</p>' : '<p class="first-clear-bonus">首次通关: +50% 金币</p>'}
        </div>
        <button class="btn-select-stage ${isUnlocked ? '' : 'disabled'}" 
                ${isUnlocked ? '' : 'disabled'}>
          ${isUnlocked ? '开始战斗' : '🔒 未解锁'}
        </button>
      `;
      
      if (isUnlocked) {
        const btn = stageCard.querySelector('.btn-select-stage');
        btn.onclick = () => {
          this.selectStage(stage.id);
        };
      }
      
      container.appendChild(stageCard);
    });
  }
  
  static selectStage(stageId) {
    // 前往卡组编辑界面，传递关卡信息
    SceneManager.showScene('deck-edit', { stageId });
  }
  
  static setupBackButton() {
    const backBtn = document.getElementById('btn-back-from-stage-select');
    if (backBtn) {
      backBtn.onclick = () => {
        SceneManager.showScene('main-menu');
      };
    }
  }
}
