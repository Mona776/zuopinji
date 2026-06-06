import { PIXEL_ICONS } from './assets.js';

// Inventory and Economy System
export class InventorySystem {
  constructor(game) {
    this.game = game;
    
    // Currency
    this.crystals = 100;
    
    // Eaten counter (for furniture unlock)
    this.totalEaten = 0;
    this.eatenByCrop = {
      crop_sunflower: 0,
      crop_mushroom: 0,
      crop_tulip: 0
    };
    
    // Eating dialogue lines
    this.eatDialogues = {
      crop_sunflower: [
        "Sweet petals dance upon my tongue! ☀️",
        "I feel the warmth of sunshine within~",
        "Golden seeds, crispy and divine!",
        "What heavenly flavor is this?",
        "Like wandering through fields of gold...",
        "Energy restored! I feel brand new!",
        "Such fragrance lifts my spirits high~"
      ],
      crop_mushroom: [
        "Umami bursts forth like forest rain! 🍄",
        "This shroom holds secrets untold...",
        "Hmm? My mind feels sharp and clear!",
        "Whispers of the woodland embrace me~",
        "So tender! So smooth! Delight!",
        "A mushroom lover's dream come true!",
        "I feel like I'm floating away~",
        "What wondrous taste is this?!"
      ],
      crop_tulip: [
        "Petals melt like morning dew... 🌷",
        "Elegant sweetness blooms on my tongue~",
        "I feel more graceful somehow~",
        "Is this what spring tastes like?",
        "Eating flowers... how poetic!",
        "The aftertaste lingers like a dream~",
        "Like strolling through Dutch gardens..."
      ],
      default: [
        "Delicious!",
        "So tasty~",
        "That hit the spot!",
        "Feeling refreshed!"
      ]
    };
    
    // Item definitions
    this.itemDefs = {
      // Tools
      hoe: { 
        name: 'Hoe', 
        type: 'tool', 
        icon: PIXEL_ICONS.hoe, 
        stackable: true, 
        maxStack: 99 
      },
      seed_sunflower: { 
        name: 'Sunflower Seed', 
        type: 'seed', 
        icon: PIXEL_ICONS.seed_sunflower, 
        stackable: true, 
        maxStack: 99, 
        cropType: 'sunflower' 
      },
      seed_mushroom: { 
        name: 'Mushroom Spore', 
        type: 'seed', 
        icon: PIXEL_ICONS.seed_mushroom, 
        stackable: true, 
        maxStack: 99, 
        cropType: 'mushroom' 
      },
      seed_tulip: { 
        name: 'Tulip Bulb', 
        type: 'seed', 
        icon: PIXEL_ICONS.seed_tulip, 
        stackable: true, 
        maxStack: 99, 
        cropType: 'tulip' 
      },
      
      // Crops (Harvested)
      crop_sunflower: { 
        name: 'Sunflower', 
        type: 'crop', 
        icon: PIXEL_ICONS.sunflower, 
        stackable: true, 
        maxStack: 99, 
        sellPrice: 15, 
        eatEffect: 5 
      },
      crop_mushroom: { 
        name: 'Mushroom', 
        type: 'crop', 
        icon: PIXEL_ICONS.mushroom, 
        stackable: true, 
        maxStack: 99, 
        sellPrice: 20, 
        eatEffect: 10 
      },
      crop_tulip: { 
        name: 'Tulip', 
        type: 'crop', 
        icon: PIXEL_ICONS.tulip, 
        stackable: true, 
        maxStack: 99, 
        sellPrice: 25, 
        eatEffect: 3 
      },
      
      // Furniture
      rug_red: {
        name: 'Red Rug',
        type: 'furniture',
        icon: 'https://static.wefun.ai/assets/64344fbf-a143-4ae7-b052-104188a9ee33.png',
        tileId: 12,
        stackable: true,
        maxStack: 10,
        sellPrice: 25
      },
      rug_blue: {
        name: 'Blue Rug',
        type: 'furniture',
        icon: 'https://static.wefun.ai/assets/c47c47af-3f22-46d4-a1bf-28fd10cdb28e.png',
        tileId: 13,
        stackable: true,
        maxStack: 10,
        sellPrice: 40
      },
      rug_green: {
        name: 'Green Rug',
        type: 'furniture',
        icon: 'https://static.wefun.ai/assets/8ca498ea-473d-4386-9551-af3cd320825c.png',
        tileId: 14,
        stackable: true,
        maxStack: 10,
        sellPrice: 60
      },
      floor_cherry: {
        name: 'Cherry Floor',
        type: 'furniture',
        icon: null,
        iconColor: '#8b4c39',
        tileId: 16,
        stackable: true,
        maxStack: 99,
        sellPrice: 30
      },
      floor_cream: {
        name: 'Cream Floor',
        type: 'furniture',
        icon: null,
        iconColor: '#f5e6d3',
        tileId: 17,
        stackable: true,
        maxStack: 99,
        sellPrice: 40
      }
    };
    
    // Inventory (max 20 slots)
    this.maxSlots = 20;
    this.items = [];
    
    // UI related
    this.isOpen = false;
    this.contextMenu = null;
    this.selectedSlot = null;
    
    this.createUI();
    this.bindEvents();
    
    // Load saved data or initialize with starting items
    if (!this.loadData()) {
      // Starting items (only if no saved data)
      this.addItem('hoe', 10);
      this.addItem('seed_sunflower', 20);
      this.addItem('seed_mushroom', 10);
      this.addItem('seed_tulip', 10);
    }
  }
  
  // Save inventory data to localStorage
  saveData() {
    try {
      const data = {
        crystals: this.crystals,
        items: this.items,
        totalEaten: this.totalEaten,
        eatenByCrop: this.eatenByCrop
      };
      localStorage.setItem('pixel_farm_inventory', JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Failed to save inventory:', e);
      return false;
    }
  }
  
  // Load inventory data from localStorage
  loadData() {
    try {
      const stored = localStorage.getItem('pixel_farm_inventory');
      if (stored) {
        const data = JSON.parse(stored);
        this.crystals = data.crystals ?? 100;
        this.items = data.items ?? [];
        this.totalEaten = data.totalEaten ?? 0;
        this.eatenByCrop = data.eatenByCrop ?? {
          crop_sunflower: 0,
          crop_mushroom: 0,
          crop_tulip: 0
        };
        this.updateUI();
        console.log('💾 Inventory loaded from save');
        return true;
      }
    } catch (e) {
      console.error('Failed to load inventory:', e);
    }
    return false;
  }
  
  // 添加物品到背包
  addItem(itemId, quantity = 1) {
    const def = this.itemDefs[itemId];
    if (!def) return false;
    
    // 尝试堆叠到现有槽位
    if (def.stackable) {
      const existingSlot = this.items.find(s => s.itemId === itemId && s.quantity < def.maxStack);
      if (existingSlot) {
        const canAdd = Math.min(quantity, def.maxStack - existingSlot.quantity);
        existingSlot.quantity += canAdd;
        quantity -= canAdd;
        
        if (quantity <= 0) {
          this.updateUI();
          return true;
        }
      }
    }
    
    // 创建新槽位
    while (quantity > 0 && this.items.length < this.maxSlots) {
      const addAmount = def.stackable ? Math.min(quantity, def.maxStack) : 1;
      this.items.push({ itemId, quantity: addAmount });
      quantity -= addAmount;
    }
    
    this.updateUI();
    return quantity === 0;
  }
  
  // 移除物品
  removeItem(itemId, quantity = 1) {
    let remaining = quantity;
    
    for (let i = this.items.length - 1; i >= 0 && remaining > 0; i--) {
      if (this.items[i].itemId === itemId) {
        const remove = Math.min(remaining, this.items[i].quantity);
        this.items[i].quantity -= remove;
        remaining -= remove;
        
        if (this.items[i].quantity <= 0) {
          this.items.splice(i, 1);
        }
      }
    }
    
    this.updateUI();
    return remaining === 0;
  }
  
  // 检查是否有足够的物品
  hasItem(itemId, quantity = 1) {
    const total = this.items
      .filter(s => s.itemId === itemId)
      .reduce((sum, s) => sum + s.quantity, 0);
    return total >= quantity;
  }
  
  // 获取物品数量
  getItemCount(itemId) {
    return this.items
      .filter(s => s.itemId === itemId)
      .reduce((sum, s) => sum + s.quantity, 0);
  }
  
  // Sell item
  sellItem(slotIndex) {
    const slot = this.items[slotIndex];
    if (!slot) return;
    
    const def = this.itemDefs[slot.itemId];
    if (!def || !def.sellPrice) return;
    
    // Sell one
    this.crystals += def.sellPrice;
    slot.quantity--;
    
    if (slot.quantity <= 0) {
      this.items.splice(slotIndex, 1);
    }
    
    // Show notification
    this.game.showCenterNotification(`💎 +${def.sellPrice} crystals!`);
    
    this.game.audio.playSFX('coins');
    this.updateUI();
    this.hideContextMenu();
  }
  
  // 吃掉物品
  eatItem(slotIndex) {
    const slot = this.items[slotIndex];
    if (!slot) return;
    
    const def = this.itemDefs[slot.itemId];
    if (!def || def.eatEffect === undefined) return;
    
    const itemId = slot.itemId;
    
    // 吃掉一个
    slot.quantity--;
    
    if (slot.quantity <= 0) {
      this.items.splice(slotIndex, 1);
    }
    
    // 增加吃掉计数
    this.totalEaten++;
    if (this.eatenByCrop[itemId] !== undefined) {
      this.eatenByCrop[itemId]++;
    }
    
    // 检查是否解锁家具
    this.checkFurnitureUnlock(itemId);
    
    // 从台词库中随机选择一句
    const dialogues = this.eatDialogues[itemId] || this.eatDialogues.default;
    const randomDialogue = dialogues[Math.floor(Math.random() * dialogues.length)];
    
    this.game.dialogue.show(randomDialogue, 'player_happy', 'Flora');
    this.game.audio.playSFX('interact');
    this.updateUI();
    this.hideContextMenu();
  }
  
  // 检查家具解锁
  checkFurnitureUnlock(itemId) {
    if (this.game.shop) {
      this.game.shop.checkUnlocks(this.eatenByCrop, itemId);
    }
  }
  
  // 添加水晶
  addCrystals(amount) {
    this.crystals += amount;
    this.updateUI();
  }
  
  // 消费水晶
  spendCrystals(amount) {
    if (this.crystals >= amount) {
      this.crystals -= amount;
      this.updateUI();
      return true;
    }
    return false;
  }
  
  // Create UI
  createUI() {
    // Inventory panel
    this.panel = document.createElement('div');
    this.panel.id = 'inventory-panel';
    this.panel.style.display = 'none';
    this.panel.innerHTML = `
      <div class="inventory-header">
        <h3>🎒 Inventory</h3>
        <span id="crystal-display"><img src="${PIXEL_ICONS.crystal}" width="20" height="20" style="vertical-align: text-bottom;"> ${this.crystals}</span>
        <button id="inventory-close">✕</button>
      </div>
      <div id="inventory-slots"></div>
    `;
    document.getElementById('game-container').appendChild(this.panel);
    
    // Context menu
    this.contextMenu = document.createElement('div');
    this.contextMenu.id = 'inventory-context-menu';
    this.contextMenu.style.display = 'none';
    this.contextMenu.innerHTML = `
      <button id="ctx-eat">🍽️ Eat</button>
      <button id="ctx-sell">💰 Sell</button>
    `;
    document.getElementById('game-container').appendChild(this.contextMenu);
    
    // Inventory button
    this.toggleBtn = document.createElement('button');
    this.toggleBtn.id = 'inventory-toggle';
    this.toggleBtn.className = 'side-menu-btn';
    this.toggleBtn.innerHTML = `<img src="${PIXEL_ICONS.backpack}" width="32" height="32" alt="Bag">`;
    this.toggleBtn.title = 'Inventory (I)';
    document.getElementById('game-container').appendChild(this.toggleBtn);
    
    this.updateUI();
  }
  
  // 绑定事件
  bindEvents() {
    // 打开/关闭背包
    this.toggleBtn.addEventListener('click', () => this.toggle());
    
    document.getElementById('inventory-close').addEventListener('click', () => this.close());
    
    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'i') {
        this.toggle();
      }
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
    
    // 右键菜单事件
    document.getElementById('ctx-eat').addEventListener('click', () => {
      if (this.selectedSlot !== null) {
        this.eatItem(this.selectedSlot);
      }
    });
    
    document.getElementById('ctx-sell').addEventListener('click', () => {
      if (this.selectedSlot !== null) {
        this.sellItem(this.selectedSlot);
      }
    });
    
    // 点击其他地方关闭右键菜单
    document.addEventListener('mousedown', (e) => {
      // 不处理右键点击
      if (e.button === 2) return;
      if (this.contextMenu.style.display !== 'none' && !this.contextMenu.contains(e.target)) {
        this.hideContextMenu();
      }
    });
  }
  
  // Update UI
  updateUI() {
    const slotsContainer = document.getElementById('inventory-slots');
    if (!slotsContainer) return;
    
    slotsContainer.innerHTML = '';
    
    for (let i = 0; i < this.maxSlots; i++) {
      const slot = document.createElement('div');
      slot.className = 'inventory-slot';
      slot.dataset.index = i;
      
      if (this.items[i]) {
        const item = this.items[i];
        const def = this.itemDefs[item.itemId];
        
        // Skip unknown items (corrupted/outdated save data)
        if (!def) {
          slot.innerHTML = `<span class="item-icon">❓</span><span class="item-count">${item.quantity}</span>`;
          slot.title = `Unknown: ${item.itemId}`;
          continue;
        }
        
        // Generate icon HTML based on type
        let iconHtml;
        const isUrl = def.icon && (def.icon.startsWith('http') || def.icon.startsWith('data:'));
        
        if (isUrl) {
          iconHtml = `<img src="${def.icon}" class="item-icon-img" alt="${def.name}">`;
        } else if (def.iconColor) {
          // Color block for floor tiles
          iconHtml = `<div class="item-icon-color" style="background-color: ${def.iconColor};"></div>`;
        } else if (def.icon) {
          iconHtml = `<span class="item-icon">${def.icon}</span>`;
        } else {
          iconHtml = `<span class="item-icon">📦</span>`;
        }
        
        // Add furniture badge if it's furniture
        const furnitureBadge = def.type === 'furniture' ? '<span class="furniture-badge">🏠</span>' : '';
          
        slot.innerHTML = `
          ${iconHtml}
          ${furnitureBadge}
          <span class="item-count">${item.quantity}</span>
        `;
        slot.title = `${def.name} x${item.quantity}`;
        
        // Mark as furniture for decoration mode
        if (def.type === 'furniture') {
          slot.classList.add('furniture-item');
          slot.dataset.itemId = item.itemId;
        }
        
        // Left click for decoration mode
        slot.addEventListener('click', (e) => {
          if (def.type === 'furniture' && this.game.decoration && this.game.decoration.isActive) {
            e.preventDefault();
            this.game.decoration.selectFurniture(item.itemId, i);
          }
        });
        
        // Context menu
        slot.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          this.showContextMenu(e.clientX, e.clientY, i);
        });
      }
      
      slotsContainer.appendChild(slot);
    }
    
    // Update crystal display
    const crystalDisplay = document.getElementById('crystal-display');
    if (crystalDisplay) {
      crystalDisplay.innerHTML = `<img src="${PIXEL_ICONS.crystal}" width="20" height="20" style="vertical-align: text-bottom;"> ${this.crystals}`;
    }
  }
  
  // 显示右键菜单
  showContextMenu(x, y, slotIndex) {
    const slot = this.items[slotIndex];
    if (!slot) return;
    
    const def = this.itemDefs[slot.itemId];
    
    // 只有作物类可以吃/卖
    if (def.type !== 'crop') {
      return;
    }
    
    this.selectedSlot = slotIndex;
    this.contextMenu.style.display = 'block';
    
    // 确保菜单不会超出视窗
    const menuWidth = 140;
    const menuHeight = 80;
    const adjustedX = Math.min(x, window.innerWidth - menuWidth - 10);
    const adjustedY = Math.min(y, window.innerHeight - menuHeight - 10);
    
    this.contextMenu.style.left = adjustedX + 'px';
    this.contextMenu.style.top = adjustedY + 'px';
    
    // 更新菜单显示
    const sellBtn = document.getElementById('ctx-sell');
    if (sellBtn && def.sellPrice) {
      sellBtn.textContent = `💰 Sell (+${def.sellPrice}💎)`;
    }
  }
  
  // 隐藏右键菜单
  hideContextMenu() {
    this.contextMenu.style.display = 'none';
    this.selectedSlot = null;
  }
  
  // 切换背包
  toggle() {
    this.isOpen ? this.close() : this.open();
  }
  
  open() {
    this.isOpen = true;
    this.panel.style.display = 'block';
    this.toggleBtn.classList.add('active');
    this.game.audio.playSFX('ui_click');
  }
  
  close() {
    this.isOpen = false;
    this.panel.style.display = 'none';
    this.toggleBtn.classList.remove('active');
    this.hideContextMenu();
  }
  
  // 根据作物类型获取种子ID
  getSeedIdForCrop(cropType) {
    return `seed_${cropType}`;
  }
  
  // 根据作物类型获取收获物ID
  getCropIdForType(cropType) {
    return `crop_${cropType}`;
  }
}
