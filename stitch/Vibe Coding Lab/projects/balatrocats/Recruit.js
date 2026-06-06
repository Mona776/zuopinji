class Recruit {
  static init() {
    this.updateGoldDisplay();
    this.renderRecruitOptions();
    this.setupBackButton();
  }
  
  static updateGoldDisplay() {
    const goldDisplay = document.getElementById('recruit-gold-display');
    if (goldDisplay) {
      goldDisplay.textContent = `金币: ${SaveData.getGold()}`;
    }
  }
  
  static renderRecruitOptions() {
    const container = document.getElementById('recruit-options-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    const saveData = SaveData.load();
    const recruitInfo = [
      {
        type: 'tank',
        name: '坦克猫',
        icon: '🛡️',
        cost: 500,
        description: '高血量防御单位，适合作为前排吸收伤害'
      },
      {
        type: 'lizard',
        name: '蜥蜴猫',
        icon: '🦎',
        cost: 800,
        description: '远程攻击单位，可以从后方输出高伤害'
      }
    ];
    
    recruitInfo.forEach(info => {
      const isUnlocked = saveData.unlockedUnits[info.type];
      
      const recruitCard = document.createElement('div');
      recruitCard.className = `recruit-card ${isUnlocked ? 'unlocked' : ''}`;
      
      recruitCard.innerHTML = `
        <div class="recruit-card-header">
          <span class="recruit-icon">${info.icon}</span>
          <h3>${info.name}</h3>
        </div>
        <p class="recruit-description">${info.description}</p>
        <div class="recruit-stats">
          <p class="stat-hint">招募后可以在战斗中使用</p>
          <p class="stat-hint">可以在商店中升级属性</p>
        </div>
        ${isUnlocked ? `
          <div class="already-unlocked">
            <span class="unlock-badge">✓ 已招募</span>
          </div>
        ` : `
          <button class="btn-recruit" data-type="${info.type}" data-cost="${info.cost}">
            招募 (${info.cost} 金币)
          </button>
        `}
      `;
      
      if (!isUnlocked) {
        const btn = recruitCard.querySelector('.btn-recruit');
        btn.onclick = () => {
          this.recruitUnit(info.type, info.cost, info.name);
        };
        
        if (SaveData.getGold() < info.cost) {
          btn.disabled = true;
          btn.classList.add('disabled');
        }
      }
      
      container.appendChild(recruitCard);
    });
  }
  
  static recruitUnit(unitType, cost, name) {
    if (SaveData.spendGold(cost)) {
      SaveData.unlockUnit(unitType);
      this.updateGoldDisplay();
      this.renderRecruitOptions();
      this.showRecruitSuccess(`${name}招募成功！现在可以在战斗中使用了。`);
    } else {
      alert('金币不足！');
    }
  }
  
  static showRecruitSuccess(message) {
    // Create a success notification
    const notification = document.createElement('div');
    notification.className = 'recruit-notification success';
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">🎉</span>
        <p>${message}</p>
      </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        notification.remove();
      }, 500);
    }, 3000);
  }
  
  static setupBackButton() {
    const backBtn = document.getElementById('btn-back-from-recruit');
    if (backBtn) {
      backBtn.onclick = () => {
        SceneManager.showScene('main-menu');
      };
    }
  }
}
