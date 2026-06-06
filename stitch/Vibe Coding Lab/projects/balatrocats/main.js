// ============================================
// 游戏初始化
// ============================================

let battleUILoop = null;

// 等待DOM加载完成
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM加载完成，开始初始化游戏...');
  
  // 初始化存档系统
  SaveData.init();
  console.log('SaveData 初始化完成');

  // 初始化场景管理器
  SceneManager.init();
  console.log('SceneManager 初始化完成');
  
  // 扩展SceneManager.showScene以支持战斗UI
  const originalShowScene = SceneManager.showScene.bind(SceneManager);
  SceneManager.showScene = function(sceneName, data) {
    console.log('切换场景:', sceneName);
    
    // 停止之前的战斗UI循环
    if (battleUILoop) {
      cancelAnimationFrame(battleUILoop);
      battleUILoop = null;
    }
    
    // 调用原始方法
    originalShowScene(sceneName, data);
    
    // 如果进入战斗场景，启动UI循环
    if (sceneName === 'battle') {
      setTimeout(() => {
        setupBattleUI();
      }, 100);
    }
  };

  // 显示主菜单
  SceneManager.showScene('main-menu');
  console.log('主菜单已显示');
});

function setupBattleUI() {
  const game = SceneManager.getGameInstance();
  if (!game) return;
  
  // 获取DOM元素
  const spawnBasicCatButton = document.getElementById('spawnBasicCat');
  const spawnTankCatButton = document.getElementById('spawnTankCat');
  const spawnLizardCatButton = document.getElementById('spawnLizardCat');
  const upgradeWalletButton = document.getElementById('upgradeWallet');
  const fireCannonButton = document.getElementById('fireCannon');
  
  const basicCooldown = document.getElementById('basicCooldown');
  const tankCooldown = document.getElementById('tankCooldown');
  const lizardCooldown = document.getElementById('lizardCooldown');
  
  const moneyAmount = document.getElementById('moneyAmount');
  const maxMoney = document.getElementById('maxMoney');
  const cannonChargeText = document.getElementById('cannonChargeText');
  
  const battleLevelText = document.getElementById('battleLevelText');
  const xpText = document.getElementById('xpText');
  const xpBarFill = document.getElementById('xpBarFill');
  
  const battleDraftScreen = document.getElementById('battleDraftScreen');
  const battleDraftCards = document.getElementById('battleDraftCards');
  
  // 绑定事件监听器
  spawnBasicCatButton.onclick = () => game.spawnBasicCat();
  spawnTankCatButton.onclick = () => game.spawnTankCat();
  spawnLizardCatButton.onclick = () => game.spawnLizardCat();
  upgradeWalletButton.onclick = () => game.upgradeWallet();
  fireCannonButton.onclick = () => game.startQTE();
  
  // QTE键盘事件
  const qteHandler = (event) => {
    if (game.qteActive) {
      game.handleQTEInput(event.key);
    }
  };
  document.addEventListener('keydown', qteHandler);
  
  // UI更新循环
  function updateBattleUI() {
    if (SceneManager.getCurrentScene() !== 'battle') return;
    
    moneyAmount.textContent = game.money;
    maxMoney.textContent = game.maxMoney;
    
    // Update XP bar
    battleLevelText.textContent = `战斗Lv ${game.battleLevel}`;
    xpText.textContent = `${game.battleXP} / ${game.xpToNextLevel}`;
    const xpPercent = (game.battleXP / game.xpToNextLevel) * 100;
    xpBarFill.style.width = `${Math.min(xpPercent, 100)}%`;
    
    // Update unit buttons
    updateUnitButton(spawnBasicCatButton, basicCooldown, 'basic', game);
    updateUnitButton(spawnTankCatButton, tankCooldown, 'tank', game);
    updateUnitButton(spawnLizardCatButton, lizardCooldown, 'lizard', game);
    
    // Update wallet button
    if (game.canUpgradeWallet()) {
      upgradeWalletButton.classList.remove('disabled');
    } else {
      upgradeWalletButton.classList.add('disabled');
    }
    
    // Update cannon
    const chargePercent = Math.floor(game.getCannonChargePercent() * 100);
    cannonChargeText.textContent = chargePercent + '%';
    
    if (game.canFireCannon()) {
      fireCannonButton.classList.remove('disabled');
      fireCannonButton.classList.add('ready');
    } else {
      fireCannonButton.classList.add('disabled');
      fireCannonButton.classList.remove('ready');
    }
    
    // Check for level up
    if (game.levelUpPending && !battleDraftScreen.classList.contains('active')) {
      showBattleDraftScreen(game);
    }
    
    battleUILoop = requestAnimationFrame(updateBattleUI);
  }
  
  updateBattleUI();
}

function updateUnitButton(button, cooldownOverlay, unitType, game) {
  if (game.canSpawn(unitType)) {
    button.classList.remove('disabled');
    button.classList.remove('locked');
  } else if (!game.deck.includes(unitType)) {
    button.classList.add('locked');
  } else {
    button.classList.add('disabled');
  }
  cooldownOverlay.style.height = (game.getCooldownPercent(unitType) * 100) + '%';
}

function showBattleDraftScreen(game) {
  const battleDraftCards = document.getElementById('battleDraftCards');
  const battleDraftScreen = document.getElementById('battleDraftScreen');
  
  const cards = game.generateBattleDraftCards();
  battleDraftCards.innerHTML = '';
  
  cards.forEach(card => {
    const cardElement = document.createElement('div');
    cardElement.className = 'battle-draft-card';
    
    const icon = document.createElement('div');
    icon.className = 'battle-draft-card-icon';
    icon.textContent = card.icon;
    
    const title = document.createElement('div');
    title.className = 'battle-draft-card-title';
    title.textContent = card.title;
    
    const description = document.createElement('div');
    description.className = 'battle-draft-card-description';
    description.textContent = card.description;
    
    cardElement.appendChild(icon);
    cardElement.appendChild(title);
    cardElement.appendChild(description);
    
    cardElement.addEventListener('click', () => {
      game.applyBattleDraftCard(card.id);
      battleDraftScreen.classList.remove('active');
    });
    
    battleDraftCards.appendChild(cardElement);
  });
  
  battleDraftScreen.classList.add('active');
}
