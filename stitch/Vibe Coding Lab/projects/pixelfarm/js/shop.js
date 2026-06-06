import { PIXEL_ICONS } from './assets.js';

// Shop System
export class ShopSystem {
  constructor(game) {
    this.game = game;
    
    // Shop items
    this.shopItems = [
      { 
        id: 'hoe', 
        name: 'Hoe', 
        icon: PIXEL_ICONS.hoe, 
        price: 10, 
        description: 'Essential tool for tilling soil' 
      },
      { 
        id: 'seed_sunflower', 
        name: 'Sunflower Seed', 
        icon: PIXEL_ICONS.seed_sunflower, 
        price: 5, 
        description: 'Radiant as the summer sun' 
      },
      { 
        id: 'seed_mushroom', 
        name: 'Mushroom Spore', 
        icon: PIXEL_ICONS.seed_mushroom, 
        price: 8, 
        description: 'Mysterious forest fungi' 
      },
      { 
        id: 'seed_tulip', 
        name: 'Tulip Bulb', 
        icon: PIXEL_ICONS.seed_tulip, 
        price: 12, 
        description: 'Elegant spring blooms' 
      }
    ];
    
    // Unlockable furniture (unlock by eating specific crops)
    this.unlockableFurniture = [
      { 
        id: 'rug_red', 
        tileId: 12,
        name: 'Red Rug', 
        icon: 'https://static.wefun.ai/assets/64344fbf-a143-4ae7-b052-104188a9ee33.png', 
        price: 50, 
        description: 'A warm crimson woven rug',
        unlockCrop: 'crop_sunflower',
        unlockCondition: 10,
        unlocked: false
      },
      { 
        id: 'rug_blue', 
        tileId: 13,
        name: 'Blue Rug', 
        icon: 'https://static.wefun.ai/assets/c47c47af-3f22-46d4-a1bf-28fd10cdb28e.png', 
        price: 80, 
        description: 'A mystic azure woven rug',
        unlockCrop: 'crop_mushroom',
        unlockCondition: 20,
        unlocked: false
      },
      { 
        id: 'rug_green', 
        tileId: 14,
        name: 'Green Rug', 
        icon: 'https://static.wefun.ai/assets/8ca498ea-473d-4386-9551-af3cd320825c.png', 
        price: 120, 
        description: 'A fresh verdant woven rug',
        unlockCrop: 'crop_tulip',
        unlockCondition: 30,
        unlocked: false
      },
      // New floor tiles unlocked by interactions
      { 
        id: 'floor_cherry', 
        tileId: 16,
        name: 'Cherry Floor', 
        icon: null,
        iconColor: '#8b4c39',
        price: 60, 
        description: 'Warm cherry wood flooring',
        unlockType: 'dog_interaction',
        unlockCondition: 10,
        unlocked: false
      },
      { 
        id: 'floor_cream', 
        tileId: 17,
        name: 'Cream Floor', 
        icon: null,
        iconColor: '#f5e6d3',
        price: 80, 
        description: 'Elegant cream tile flooring',
        unlockType: 'player_interaction',
        unlockCondition: 5,
        unlocked: false
      }
    ];
    
    // Interaction counters
    this.dogInteractions = 0;
    this.playerInteractions = 0;
    
    // UI state
    this.isOpen = false;
    
    this.createUI();
    this.bindEvents();
    
    // Load saved data
    this.loadData();
  }
  
  // Save shop data to localStorage
  saveData() {
    try {
      const data = {
        dogInteractions: this.dogInteractions,
        playerInteractions: this.playerInteractions,
        unlockedFurniture: this.unlockableFurniture.map(f => ({
          id: f.id,
          unlocked: f.unlocked
        }))
      };
      localStorage.setItem('pixel_farm_shop', JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Failed to save shop data:', e);
      return false;
    }
  }
  
  // Load shop data from localStorage
  loadData() {
    try {
      const stored = localStorage.getItem('pixel_farm_shop');
      if (stored) {
        const data = JSON.parse(stored);
        this.dogInteractions = data.dogInteractions ?? 0;
        this.playerInteractions = data.playerInteractions ?? 0;
        
        // Restore unlock status
        if (data.unlockedFurniture) {
          data.unlockedFurniture.forEach(saved => {
            const item = this.unlockableFurniture.find(f => f.id === saved.id);
            if (item) {
              item.unlocked = saved.unlocked;
            }
          });
        }
        
        console.log('💾 Shop data loaded from save');
        return true;
      }
    } catch (e) {
      console.error('Failed to load shop data:', e);
    }
    return false;
  }
  
  // Create UI
  createUI() {
    // Shop button
    this.toggleBtn = document.createElement('button');
    this.toggleBtn.id = 'shop-toggle';
    this.toggleBtn.className = 'side-menu-btn';
    this.toggleBtn.innerHTML = `<img src="${PIXEL_ICONS.shop}" width="32" height="32" alt="Shop">`;
    this.toggleBtn.title = 'Shop (P)';
    document.getElementById('game-container').appendChild(this.toggleBtn);
    
    // Shop panel
    this.panel = document.createElement('div');
    this.panel.id = 'shop-panel';
    this.panel.style.display = 'none';
    this.panel.innerHTML = `
      <div class="shop-header">
        <h3>🏪 Shop</h3>
        <span id="shop-crystal-display"><img src="${PIXEL_ICONS.crystal}" width="20" height="20" style="vertical-align: text-bottom;"> 0</span>
        <button id="shop-close">✕</button>
      </div>
      <div class="shop-tabs">
        <button class="shop-tab active" data-tab="supplies">Supplies</button>
        <button class="shop-tab" data-tab="furniture">Furniture</button>
      </div>
      <div id="shop-content">
        <div id="shop-supplies" class="shop-section active"></div>
        <div id="shop-furniture" class="shop-section"></div>
      </div>
      <div id="shop-message"></div>
    `;
    document.getElementById('game-container').appendChild(this.panel);
    
    this.updateUI();
  }
  
  // Bind events
  bindEvents() {
    this.toggleBtn.addEventListener('click', () => this.toggle());
    
    document.getElementById('shop-close').addEventListener('click', () => this.close());
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'p') {
        this.toggle();
      }
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
    
    // Tab switching
    this.panel.querySelectorAll('.shop-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.panel.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        this.panel.querySelectorAll('.shop-section').forEach(s => s.classList.remove('active'));
        document.getElementById(`shop-${tab.dataset.tab}`).classList.add('active');
      });
    });
  }
  
  // 更新 UI
  updateUI() {
    // 更新水晶显示
    const crystalDisplay = document.getElementById('shop-crystal-display');
    if (crystalDisplay && this.game.inventory) {
      crystalDisplay.innerHTML = `<img src="${PIXEL_ICONS.crystal}" width="20" height="20" style="vertical-align: text-bottom;"> ${this.game.inventory.crystals}`;
    }
    
    // 更新补给品列表
    const suppliesContainer = document.getElementById('shop-supplies');
    if (suppliesContainer) {
      suppliesContainer.innerHTML = '';
      this.shopItems.forEach(item => {
        const owned = this.game.inventory ? this.game.inventory.getItemCount(item.id) : 0;
        const canAfford = this.game.inventory && this.game.inventory.crystals >= item.price;
        
        const isUrl = item.icon && (item.icon.startsWith('http') || item.icon.startsWith('data:'));
        const iconHtml = isUrl 
          ? `<img src="${item.icon}" class="shop-item-icon-img" alt="${item.name}">`
          : `<span class="shop-item-icon">${item.icon}</span>`;
        
        const itemEl = document.createElement('div');
        itemEl.className = `shop-item ${canAfford ? '' : 'disabled'}`;
        itemEl.innerHTML = `
          ${iconHtml}
          <div class="shop-item-info">
            <div class="shop-item-name">${item.name}</div>
            <div class="shop-item-desc">${item.description}</div>
            <div class="shop-item-owned">Owned: ${owned}</div>
          </div>
          <button class="shop-buy-btn" ${canAfford ? '' : 'disabled'}>
            <img src="${PIXEL_ICONS.crystal}" width="12" height="12"> ${item.price}
          </button>
        `;
        
        itemEl.querySelector('.shop-buy-btn').addEventListener('click', () => {
          this.buyItem(item);
        });
        
        suppliesContainer.appendChild(itemEl);
      });
    }
    
    // Update furniture list
    const furnitureContainer = document.getElementById('shop-furniture');
    if (furnitureContainer) {
      furnitureContainer.innerHTML = '';
      
      this.unlockableFurniture.forEach(item => {
        const canAfford = this.game.inventory && this.game.inventory.crystals >= item.price;
        const eatenByCrop = this.game.inventory ? this.game.inventory.eatenByCrop : {};
        
        // Determine unlock progress based on type
        let currentProgress = 0;
        let unlockDesc = '';
        
        if (item.unlockType === 'dog_interaction') {
          currentProgress = this.dogInteractions;
          unlockDesc = `Pet the dog ${item.unlockCondition} times`;
        } else if (item.unlockType === 'player_interaction') {
          currentProgress = this.playerInteractions;
          unlockDesc = `Click yourself ${item.unlockCondition} times`;
        } else if (item.unlockCrop) {
          currentProgress = eatenByCrop[item.unlockCrop] || 0;
          const cropNames = {
            'crop_sunflower': 'Sunflowers',
            'crop_mushroom': 'Mushrooms',
            'crop_tulip': 'Tulips'
          };
          const cropName = cropNames[item.unlockCrop] || 'crops';
          unlockDesc = `Eat ${item.unlockCondition} ${cropName}`;
        }
        
        const itemEl = document.createElement('div');
        itemEl.className = `shop-item ${item.unlocked ? (canAfford ? '' : 'disabled') : 'locked'}`;
        
        // Handle different icon types
        let iconHtml;
        if (item.icon && (item.icon.startsWith('http') || item.icon.startsWith('data:'))) {
          iconHtml = `<img src="${item.icon}" class="shop-item-icon-img" alt="${item.name}">`;
        } else if (item.iconColor) {
          iconHtml = `<div class="shop-item-icon-color" style="background-color: ${item.iconColor}; width: 32px; height: 32px; border: 2px solid #5d4037;"></div>`;
        } else {
          iconHtml = `<span class="shop-item-icon">${item.icon || '📦'}</span>`;
        }

        if (item.unlocked) {
          itemEl.innerHTML = `
            ${iconHtml}
            <div class="shop-item-info">
              <div class="shop-item-name">${item.name}</div>
              <div class="shop-item-desc">${item.description}</div>
              <div class="shop-item-unlock-hint">🎉 ${unlockDesc}</div>
            </div>
          <button class="shop-buy-btn" ${canAfford ? '' : 'disabled'}>
            <img src="${PIXEL_ICONS.crystal}" width="12" height="12"> ${item.price}
          </button>
          `;
          
          itemEl.querySelector('.shop-buy-btn').addEventListener('click', () => {
            this.buyFurniture(item);
          });
        } else {
          // Calculate progress percentage
          const progressPercent = Math.min(100, Math.floor((currentProgress / item.unlockCondition) * 100));
          
          itemEl.innerHTML = `
            <span class="shop-item-icon">🔒</span>
            <div class="shop-item-info">
              <div class="shop-item-name">???</div>
              <div class="shop-item-desc">Keep exploring to unlock...</div>
              <div class="shop-item-progress-bar">
                <div class="progress-fill" style="width: ${progressPercent}%"></div>
              </div>
              <div class="shop-item-progress">${progressPercent}% (${currentProgress}/${item.unlockCondition})</div>
            </div>
            <button class="shop-buy-btn" disabled>Locked</button>
          `;
        }
        
        furnitureContainer.appendChild(itemEl);
      });
    }
  }
  
  // Buy item
  buyItem(item) {
    if (!this.game.inventory) return;
    
    if (this.game.inventory.spendCrystals(item.price)) {
      this.game.inventory.addItem(item.id, 1);
      this.game.audio.playSFX('buy');
      this.showMessage(`Purchased ${item.name}!`);
      this.updateUI();
    } else {
      this.showMessage('Not enough crystals!');
    }
  }
  
  // Buy furniture
  buyFurniture(item) {
    if (!this.game.inventory) return;
    
    if (this.game.inventory.spendCrystals(item.price)) {
      // Add furniture to inventory
      if (!this.game.inventory.itemDefs[item.id]) {
        this.game.inventory.itemDefs[item.id] = {
          name: item.name,
          type: 'furniture',
          icon: item.icon,
          tileId: item.tileId,
          stackable: true,
          maxStack: 10
        };
      }
      this.game.inventory.addItem(item.id, 1);
      this.game.audio.playSFX('buy');
      this.showMessage(`Purchased ${item.name}! Added to inventory.`);
      this.updateUI();
    } else {
      this.showMessage('Not enough crystals!');
    }
  }
  
  // Check unlocks (for crop eating)
  checkUnlocks(eatenByCrop, justEatenCrop) {
    let newUnlock = false;
    
    this.unlockableFurniture.forEach(item => {
      if (!item.unlocked && item.unlockCrop === justEatenCrop) {
        const cropEaten = eatenByCrop[item.unlockCrop] || 0;
        if (cropEaten >= item.unlockCondition) {
          item.unlocked = true;
          newUnlock = true;
          this.game.showCenterNotification(`🎉 New item unlocked: ${item.name}!`);
          this.game.audio.playSFX('unlock');
        }
      }
    });
    
    if (newUnlock) {
      this.updateUI();
    }
  }
  
  // Track dog interaction
  onDogInteraction() {
    this.dogInteractions++;
    this.checkInteractionUnlocks('dog_interaction', this.dogInteractions);
  }
  
  // Track player interaction
  onPlayerInteraction() {
    this.playerInteractions++;
    this.checkInteractionUnlocks('player_interaction', this.playerInteractions);
  }
  
  // Check interaction-based unlocks
  checkInteractionUnlocks(unlockType, count) {
    let newUnlock = false;
    
    this.unlockableFurniture.forEach(item => {
      if (!item.unlocked && item.unlockType === unlockType) {
        if (count >= item.unlockCondition) {
          item.unlocked = true;
          newUnlock = true;
          this.game.showCenterNotification(`🎉 New floor unlocked: ${item.name}!`);
          this.game.audio.playSFX('unlock');
        }
      }
    });
    
    if (newUnlock) {
      this.updateUI();
    }
  }
  
  // Show message
  showMessage(text) {
    const msgEl = document.getElementById('shop-message');
    if (msgEl) {
      msgEl.textContent = text;
      msgEl.classList.add('show');
      setTimeout(() => {
        msgEl.classList.remove('show');
      }, 2000);
    }
  }
  
  // 切换商店
  toggle() {
    this.isOpen ? this.close() : this.open();
  }
  
  open() {
    this.isOpen = true;
    this.panel.style.display = 'block';
    this.toggleBtn.classList.add('active');
    this.updateUI();
    this.game.audio.playSFX('ui_click');
  }
  
  close() {
    this.isOpen = false;
    this.panel.style.display = 'none';
    this.toggleBtn.classList.remove('active');
  }
}
