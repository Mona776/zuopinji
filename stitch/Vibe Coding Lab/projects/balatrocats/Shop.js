class Shop {
  static init() {
    this.updateGoldDisplay();
    this.renderShopItems();
    this.setupBackButton();
  }
  
  static updateGoldDisplay() {
    const goldDisplay = document.getElementById('shop-gold-display');
    if (goldDisplay) {
      goldDisplay.textContent = `金币: ${SaveData.getGold()}`;
    }
  }
  
  static renderShopItems() {
    this.renderUnitUpgrades();
    this.renderBaseUpgrade();
  }
  
  static renderUnitUpgrades() {
    const container = document.getElementById('unit-upgrades-container');
    if (!container) return;
    
    container.innerHTML = '<h3>单位升级</h3>';
    
    const saveData = SaveData.load();
    const unitInfo = {
      basic: { name: '基础猫', icon: '🐱' },
      tank: { name: '坦克猫', icon: '🛡️' },
      lizard: { name: '蜥蜴猫', icon: '🦎' }
    };
    
    for (let unitType in unitInfo) {
      const info = unitInfo[unitType];
      const currentLevel = saveData.unitLevels[unitType] || 1;
      const isUnlocked = saveData.unlockedUnits[unitType];
      const cost = this.calculateUpgradeCost(currentLevel);
      
      if (!isUnlocked) continue; // Don't show locked units
      
      const upgradeCard = document.createElement('div');
      upgradeCard.className = 'shop-item';
      
      upgradeCard.innerHTML = `
        <div class="shop-item-header">
          <span class="shop-item-icon">${info.icon}</span>
          <h4>${info.name}</h4>
        </div>
        <div class="shop-item-info">
          <p class="current-level">当前等级: Lv.${currentLevel}</p>
          <p class="upgrade-bonus">攻击力 & 生命值: +${Math.floor((currentLevel - 1) * 15)}%</p>
          <p class="next-level-bonus">下一级: +${Math.floor(currentLevel * 15)}%</p>
        </div>
        <button class="btn-upgrade" data-unit="${unitType}" data-cost="${cost}">
          升级 (${cost} 金币)
        </button>
      `;
      
      const btn = upgradeCard.querySelector('.btn-upgrade');
      btn.onclick = () => {
        this.upgradeUnit(unitType, cost);
      };
      
      if (SaveData.getGold() < cost) {
        btn.disabled = true;
        btn.classList.add('disabled');
      }
      
      container.appendChild(upgradeCard);
    }
  }
  
  static renderBaseUpgrade() {
    const container = document.getElementById('base-upgrade-container');
    if (!container) return;
    
    container.innerHTML = '<h3>基地升级</h3>';
    
    const saveData = SaveData.load();
    const currentLevel = saveData.baseLevel || 1;
    const cost = this.calculateUpgradeCost(currentLevel);
    
    const upgradeCard = document.createElement('div');
    upgradeCard.className = 'shop-item';
    
    upgradeCard.innerHTML = `
      <div class="shop-item-header">
        <span class="shop-item-icon">🏰</span>
        <h4>基地</h4>
      </div>
      <div class="shop-item-info">
        <p class="current-level">当前等级: Lv.${currentLevel}</p>
        <p class="upgrade-bonus">基地生命值: +${Math.floor((currentLevel - 1) * 10)}%</p>
        <p class="next-level-bonus">下一级: +${Math.floor(currentLevel * 10)}%</p>
      </div>
      <button class="btn-upgrade" data-cost="${cost}">
        升级 (${cost} 金币)
      </button>
    `;
    
    const btn = upgradeCard.querySelector('.btn-upgrade');
    btn.onclick = () => {
      this.upgradeBase(cost);
    };
    
    if (SaveData.getGold() < cost) {
      btn.disabled = true;
      btn.classList.add('disabled');
    }
    
    container.appendChild(upgradeCard);
  }
  
  static calculateUpgradeCost(currentLevel) {
    // Cost formula: 100 * level^1.5
    return Math.floor(100 * Math.pow(currentLevel, 1.5));
  }
  
  static upgradeUnit(unitType, cost) {
    if (SaveData.spendGold(cost)) {
      SaveData.upgradeUnit(unitType);
      this.updateGoldDisplay();
      this.renderShopItems();
      this.showUpgradeSuccess(`${unitType}升级成功！`);
    } else {
      alert('金币不足！');
    }
  }
  
  static upgradeBase(cost) {
    if (SaveData.spendGold(cost)) {
      SaveData.upgradeBase();
      this.updateGoldDisplay();
      this.renderShopItems();
      this.showUpgradeSuccess('基地升级成功！');
    } else {
      alert('金币不足！');
    }
  }
  
  static showUpgradeSuccess(message) {
    // Simple alert for now, can be enhanced with better UI later
    const notification = document.createElement('div');
    notification.className = 'upgrade-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 2000);
  }
  
  static setupBackButton() {
    const backBtn = document.getElementById('btn-back-from-shop');
    if (backBtn) {
      backBtn.onclick = () => {
        SceneManager.showScene('main-menu');
      };
    }
  }
}
