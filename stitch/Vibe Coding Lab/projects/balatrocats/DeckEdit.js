class DeckEdit {
  static currentStageId = null;
  static selectedUnits = [];
  static maxDeckSize = 5;
  
  static unitInfo = {
    basic: { name: '基础猫', cost: 100, desc: '平衡型单位' },
    tank: { name: '坦克猫', cost: 200, desc: '高血量防御单位' },
    lizard: { name: '蜥蜴猫', cost: 150, desc: '远程攻击单位' }
  };
  
  static init(data) {
    this.currentStageId = data?.stageId || 1;
    
    // 加载保存的卡组
    const savedDeck = SaveData.getDeck();
    this.selectedUnits = [...savedDeck];
    
    this.renderUnitPool();
    this.renderDeckPreview();
    this.setupButtons();
  }
  
  static renderUnitPool() {
    const container = document.getElementById('unit-pool-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (let unitType in this.unitInfo) {
      const info = this.unitInfo[unitType];
      const isUnlocked = SaveData.isUnitUnlocked(unitType);
      const unitLevel = SaveData.load().unitLevels[unitType] || 1;
      
      const unitCard = document.createElement('div');
      unitCard.className = `unit-pool-card ${isUnlocked ? '' : 'locked'}`;
      
      unitCard.innerHTML = `
        <div class="unit-icon">${this.getUnitEmoji(unitType)}</div>
        <h4>${info.name}</h4>
        <p class="unit-level">Lv.${unitLevel}</p>
        <p class="unit-desc">${info.desc}</p>
        <p class="unit-cost">消耗: ${info.cost}</p>
        <button class="btn-add-unit ${isUnlocked ? '' : 'disabled'}" 
                ${isUnlocked ? '' : 'disabled'}>
          ${isUnlocked ? '添加到卡组' : '🔒 未解锁'}
        </button>
      `;
      
      if (isUnlocked) {
        const btn = unitCard.querySelector('.btn-add-unit');
        btn.onclick = () => {
          this.addUnitToDeck(unitType);
        };
      }
      
      container.appendChild(unitCard);
    }
  }
  
  static renderDeckPreview() {
    const container = document.getElementById('deck-preview-container');
    if (!container) return;
    
    container.innerHTML = `<h3>当前卡组 (${this.selectedUnits.length}/${this.maxDeckSize})</h3>`;
    
    if (this.selectedUnits.length === 0) {
      container.innerHTML += '<p class="empty-deck">请添加单位到卡组</p>';
      return;
    }
    
    this.selectedUnits.forEach((unitType, index) => {
      const info = this.unitInfo[unitType];
      const slotDiv = document.createElement('div');
      slotDiv.className = 'deck-slot';
      
      slotDiv.innerHTML = `
        <span class="deck-unit-icon">${this.getUnitEmoji(unitType)}</span>
        <span class="deck-unit-name">${info.name}</span>
        <button class="btn-remove-unit" data-index="${index}">移除</button>
      `;
      
      slotDiv.querySelector('.btn-remove-unit').onclick = () => {
        this.removeUnitFromDeck(index);
      };
      
      container.appendChild(slotDiv);
    });
  }
  
  static addUnitToDeck(unitType) {
    if (this.selectedUnits.length >= this.maxDeckSize) {
      alert(`卡组已满！最多只能携带${this.maxDeckSize}个单位。`);
      return;
    }
    
    this.selectedUnits.push(unitType);
    this.renderDeckPreview();
  }
  
  static removeUnitFromDeck(index) {
    this.selectedUnits.splice(index, 1);
    this.renderDeckPreview();
  }
  
  static setupButtons() {
    // 确认出战按钮
    const confirmBtn = document.getElementById('btn-confirm-deck');
    if (confirmBtn) {
      confirmBtn.onclick = () => {
        if (this.selectedUnits.length === 0) {
          alert('请至少添加一个单位到卡组！');
          return;
        }
        
        // 保存卡组配置
        SaveData.setDeck(this.selectedUnits);
        
        // 进入战斗
        SceneManager.showScene('battle', {
          stage: this.currentStageId,
          deck: this.selectedUnits
        });
      };
    }
    
    // 返回按钮
    const backBtn = document.getElementById('btn-back-from-deck-edit');
    if (backBtn) {
      backBtn.onclick = () => {
        SceneManager.showScene('stage-select');
      };
    }
  }
  
  static getUnitEmoji(unitType) {
    const emojis = {
      basic: '🐱',
      tank: '🛡️',
      lizard: '🦎'
    };
    return emojis[unitType] || '❓';
  }
}
