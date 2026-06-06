import { PIXEL_ICONS } from './assets.js';
import { TILES, ENTITIES } from './tiles.js';

// Decoration System - Place and remove furniture in indoor scenes
export class DecorationSystem {
  constructor(game) {
    this.game = game;
    
    this.isActive = false;
    this.selectedFurniture = null; // { itemId, slotIndex }
    this.previewX = 0;
    this.previewY = 0;
    
    // Placed furniture tracking (for removal)
    this.placedFurniture = []; // { x, y, itemId, tileId }
    
    // Track if we've already given default items for this scene
    this.sceneItemsGiven = {};
    
    this.createUI();
    this.bindEvents();
  }
  
  // Give player default floor tiles from current indoor scene
  giveDefaultFloorTiles() {
    const sceneType = this.game.map.sceneType;
    if (sceneType !== 'indoor') return;
    
    // Only give once per session
    if (this.sceneItemsGiven[sceneType]) return;
    this.sceneItemsGiven[sceneType] = true;
    
    // Count floor tiles in the current scene
    const floorCounts = {};
    const map = this.game.map;
    
    for (let y = 0; y < map.rows; y++) {
      for (let x = 0; x < map.cols; x++) {
        const tileId = map.layers.base[y]?.[x];
        const tileDef = TILES[tileId];
        
        // Check if it's a floor tile (floor_group)
        if (tileDef && tileDef.group === 'floor_group' && tileId !== 6) { // Exclude door
          floorCounts[tileId] = (floorCounts[tileId] || 0) + 1;
        }
      }
    }
    
    // Add floor tiles to inventory
    for (const [tileId, count] of Object.entries(floorCounts)) {
      const tileDef = TILES[tileId];
      if (!tileDef) continue;
      
      // Create inventory item if doesn't exist
      const itemId = `floor_tile_${tileId}`;
      if (!this.game.inventory.itemDefs[itemId]) {
        this.game.inventory.itemDefs[itemId] = {
          name: tileDef.name,
          type: 'furniture',
          icon: tileDef.src || null,
          iconColor: tileDef.color,
          tileId: parseInt(tileId),
          stackable: true,
          maxStack: 999,
          sellPrice: 5
        };
      }
      
      // Add to inventory (give 10 extra of each type found)
      this.game.inventory.addItem(itemId, Math.min(count, 20));
    }
  }
  
  createUI() {
    // Decoration toggle button
    this.toggleBtn = document.createElement('button');
    this.toggleBtn.id = 'decoration-toggle';
    this.toggleBtn.className = 'side-menu-btn';
    this.toggleBtn.innerHTML = '🪑';
    this.toggleBtn.title = 'Decoration Mode (Indoor Only)';
    document.getElementById('game-container').appendChild(this.toggleBtn);
    
    // Status indicator
    this.statusEl = document.createElement('div');
    this.statusEl.id = 'decoration-status';
    this.statusEl.style.display = 'none';
    this.statusEl.innerHTML = `
      <div class="decoration-status-content">
        <span class="decoration-mode-text">🪑 Decoration Mode</span>
        <span class="decoration-hint">L-Click: Place furniture | R-Click: Remove item</span>
        <span class="decoration-selected"></span>
      </div>
    `;
    document.getElementById('game-container').appendChild(this.statusEl);
  }
  
  bindEvents() {
    this.toggleBtn.addEventListener('click', () => this.toggle());
    
    // Only ESC to exit, no D shortcut
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isActive) {
        this.deactivate();
      }
    });
    
    // Canvas click for placement
    this.game.canvas.addEventListener('click', (e) => {
      if (!this.isActive || !this.selectedFurniture) return;
      if (this.game.editor.isVisible) return;
      
      // Check if we're in indoor scene
      if (this.game.map.sceneType !== 'indoor') {
        this.game.showCenterNotification('⚠️ Can only place furniture indoors!');
        return;
      }
      
      const rect = this.game.canvas.getBoundingClientRect();
      const scaleX = this.game.canvas.width / rect.width;
      const scaleY = this.game.canvas.height / rect.height;
      
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;
      
      const worldX = mouseX + Math.floor(this.game.camera.x);
      const worldY = mouseY + Math.floor(this.game.camera.y);
      
      this.placeFurniture(worldX, worldY);
    });
    
    // Right-click for removal
    this.game.canvas.addEventListener('contextmenu', (e) => {
      if (!this.isActive) return;
      if (this.game.editor.isVisible) return;
      
      e.preventDefault();
      
      const rect = this.game.canvas.getBoundingClientRect();
      const scaleX = this.game.canvas.width / rect.width;
      const scaleY = this.game.canvas.height / rect.height;
      
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;
      
      const worldX = mouseX + Math.floor(this.game.camera.x);
      const worldY = mouseY + Math.floor(this.game.camera.y);
      
      this.removeFurniture(worldX, worldY);
    });
    
    // Track mouse for preview
    this.game.canvas.addEventListener('mousemove', (e) => {
      if (!this.isActive) return;
      
      const rect = this.game.canvas.getBoundingClientRect();
      const scaleX = this.game.canvas.width / rect.width;
      const scaleY = this.game.canvas.height / rect.height;
      
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;
      
      this.previewX = mouseX + Math.floor(this.game.camera.x);
      this.previewY = mouseY + Math.floor(this.game.camera.y);
    });
  }
  
  toggle() {
    // Only allow in indoor scenes
    if (!this.isActive && this.game.map.sceneType !== 'indoor') {
      this.game.showCenterNotification('⚠️ Decoration mode only available indoors!');
      return;
    }
    this.isActive ? this.deactivate() : this.activate();
  }
  
  activate() {
    // Double-check indoor scene
    if (this.game.map.sceneType !== 'indoor') {
      this.game.showCenterNotification('⚠️ Decoration mode only available indoors!');
      return;
    }
    
    this.isActive = true;
    this.toggleBtn.classList.add('active');
    this.statusEl.style.display = 'block';
    this.selectedFurniture = null;
    this.updateStatus();
    
    // Open inventory if not open
    if (!this.game.inventory.isOpen) {
      this.game.inventory.open();
    }
    
    this.game.showCenterNotification('🪑 Decoration Mode ON');
    this.game.audio.playSFX('ui_click');
  }
  
  deactivate() {
    this.isActive = false;
    this.toggleBtn.classList.remove('active');
    this.statusEl.style.display = 'none';
    this.selectedFurniture = null;
    
    // Remove selection from inventory
    document.querySelectorAll('.inventory-slot.selected').forEach(el => {
      el.classList.remove('selected');
    });
  }
  
  selectFurniture(itemId, slotIndex) {
    const def = this.game.inventory.itemDefs[itemId];
    if (!def || def.type !== 'furniture') return;
    
    this.selectedFurniture = { itemId, slotIndex };
    
    // Update UI selection
    document.querySelectorAll('.inventory-slot.selected').forEach(el => {
      el.classList.remove('selected');
    });
    
    const slot = document.querySelector(`.inventory-slot[data-index="${slotIndex}"]`);
    if (slot) {
      slot.classList.add('selected');
    }
    
    this.updateStatus();
  }
  
  updateStatus() {
    const selectedEl = this.statusEl.querySelector('.decoration-selected');
    if (this.selectedFurniture) {
      const def = this.game.inventory.itemDefs[this.selectedFurniture.itemId];
      selectedEl.textContent = `Selected: ${def.name}`;
    } else {
      selectedEl.textContent = 'Select furniture from inventory';
    }
  }
  
  placeFurniture(worldX, worldY) {
    if (!this.selectedFurniture) return;
    
    const { itemId, slotIndex } = this.selectedFurniture;
    const def = this.game.inventory.itemDefs[itemId];
    
    if (!def) {
      this.game.showCenterNotification('⚠️ Invalid furniture!');
      return;
    }
    
    // Check if player has the item
    if (!this.game.inventory.hasItem(itemId, 1)) {
      this.game.showCenterNotification('⚠️ No more of this furniture!');
      this.selectedFurniture = null;
      this.updateStatus();
      return;
    }
    
    // Snap to tile grid
    const tileX = Math.floor(worldX / this.game.tileSize);
    const tileY = Math.floor(worldY / this.game.tileSize);
    const pixelX = tileX * this.game.tileSize;
    const pixelY = tileY * this.game.tileSize;
    
    // Check if tile is valid (within bounds)
    if (tileX < 0 || tileY < 0 || tileX >= this.game.map.cols || tileY >= this.game.map.rows) {
      this.game.showCenterNotification('⚠️ Cannot place here!');
      return;
    }
    
    // Check for entity placement
    if (def.entityId) {
      // Place as entity
      this.game.map.addEntity(def.entityId, pixelX, pixelY, 0, 0);
      
      // Track placed furniture
      this.placedFurniture.push({
        x: pixelX,
        y: pixelY,
        itemId: itemId,
        entityId: def.entityId
      });
    } else if (def.tileId) {
      if (this.game.map.isSolid(tileX, tileY)) {
        this.game.showCenterNotification('⚠️ Cannot place on solid tiles!');
        return;
      }
      
      // Place the tile on deco layer
      this.game.map.setDeco(tileX, tileY, def.tileId);
      
      // Track placed furniture
      this.placedFurniture.push({
        x: tileX,
        y: tileY,
        itemId: itemId,
        tileId: def.tileId
      });
    } else {
      this.game.showCenterNotification('⚠️ Cannot place this item!');
      return;
    }
    
    // Remove from inventory
    this.game.inventory.removeItem(itemId, 1);
    
    // Play sound
    this.game.audio.playSFX('place');
    
    // Update selection if we're out of this item
    if (!this.game.inventory.hasItem(itemId, 1)) {
      this.selectedFurniture = null;
      this.updateStatus();
      document.querySelectorAll('.inventory-slot.selected').forEach(el => {
        el.classList.remove('selected');
      });
    }
  }
  
  removeFurniture(worldX, worldY) {
    const tileX = Math.floor(worldX / this.game.tileSize);
    const tileY = Math.floor(worldY / this.game.tileSize);
    
    // First, check for entities at this position
    const entity = this.game.map.getEntityAt(worldX, worldY);
    if (entity) {
      return this.removeEntity(entity, worldX, worldY);
    }
    
    // Check deco layer for furniture
    const decoId = this.game.map.layers.deco[tileY]?.[tileX];
    if (!decoId) {
      return;
    }
    
    // Find if this is a placed furniture we're tracking
    const placedIndex = this.placedFurniture.findIndex(f => f.x === tileX && f.y === tileY);
    
    let itemId = null;
    
    if (placedIndex !== -1) {
      // We know exactly what item this was
      itemId = this.placedFurniture[placedIndex].itemId;
      this.placedFurniture.splice(placedIndex, 1);
    } else {
      // Try to find item by tileId
      for (const [id, def] of Object.entries(this.game.inventory.itemDefs)) {
        if (def.tileId === decoId) {
          itemId = id;
          break;
        }
      }
    }
    
    if (!itemId) {
      // Can't return to inventory - just remove
      this.game.map.removeDeco(tileX, tileY);
      this.game.audio.playSFX('pickup');
      return;
    }
    
    // Remove from map
    this.game.map.removeDeco(tileX, tileY);
    
    // Add back to inventory
    const added = this.game.inventory.addItem(itemId, 1);
    
    if (added) {
      const def = this.game.inventory.itemDefs[itemId];
      this.game.showCenterNotification(`📦 Picked up ${def.name}`);
    } else {
      this.game.showCenterNotification('⚠️ Inventory full! Item lost.');
    }
    
    this.game.audio.playSFX('pickup');
  }
  
  removeEntity(entity, worldX, worldY) {
    const entityDef = ENTITIES[entity.id];
    if (!entityDef) return;
    
    // Create inventory item definition if it doesn't exist
    const itemId = `entity_${entity.id}`;
    if (!this.game.inventory.itemDefs[itemId]) {
      this.game.inventory.itemDefs[itemId] = {
        name: entityDef.name,
        type: 'furniture',
        icon: entityDef.src || entityDef.frames?.[0] || null,
        entityId: entity.id,
        stackable: true,
        maxStack: 10,
        sellPrice: Math.floor((entityDef.width * entityDef.height) / 32) // Price based on size
      };
    }
    
    // Remove from map
    const removed = this.game.map.removeEntityAt(worldX, worldY);
    if (!removed) return;
    
    // Add to inventory
    const added = this.game.inventory.addItem(itemId, 1);
    
    if (added) {
      this.game.showCenterNotification(`📦 Picked up ${entityDef.name}`);
    } else {
      this.game.showCenterNotification('⚠️ Inventory full! Item lost.');
    }
    
    this.game.audio.playSFX('pickup');
  }
  
  draw(ctx) {
    if (!this.isActive || !this.selectedFurniture) return;
    
    const def = this.game.inventory.itemDefs[this.selectedFurniture.itemId];
    if (!def || !def.tileId) return;
    
    const tileX = Math.floor(this.previewX / this.game.tileSize);
    const tileY = Math.floor(this.previewY / this.game.tileSize);
    
    const drawX = tileX * this.game.tileSize;
    const drawY = tileY * this.game.tileSize;
    
    ctx.save();
    ctx.globalAlpha = 0.5;
    
    // Draw preview tile
    const tileDef = TILES[def.tileId];
    if (tileDef) {
      if (tileDef.src && this.game.map.tileImages[def.tileId]) {
        ctx.drawImage(this.game.map.tileImages[def.tileId], drawX, drawY, this.game.tileSize, this.game.tileSize);
      } else if (tileDef.color) {
        ctx.fillStyle = tileDef.color;
        ctx.fillRect(drawX, drawY, this.game.tileSize, this.game.tileSize);
      }
    } else if (def.iconColor) {
      ctx.fillStyle = def.iconColor;
      ctx.fillRect(drawX, drawY, this.game.tileSize, this.game.tileSize);
    }
    
    // Draw outline
    ctx.strokeStyle = this.game.map.isSolid(tileX, tileY) ? '#ff0000' : '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(drawX, drawY, this.game.tileSize, this.game.tileSize);
    
    ctx.restore();
  }
}
