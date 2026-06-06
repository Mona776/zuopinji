import { ENTITIES, TILES } from './tiles.js';

export class InteractionSystem {
  constructor(game) {
    this.game = game;
    this.activeEntity = null;
    this.activeTile = null;
    this.isVisible = false;
    
    this.bobTimer = 0;
    this.interactionRange = 80;

    this.bubbleBounds = { x: 0, y: 0, w: 0, h: 0 };
    
    // Track active states for toggleable objects
    this.activeTVs = new Set(); // Entity IDs of TVs that are ON
    this.activeLamps = new Set(); // Entity IDs of Lamps that are ON
    
    // Interactable entity IDs
    this.interactableIds = new Set([
      200,  // Bed
      204,  // Television
      205,  // Shelf (drink)
      206,  // Armchair
      207,  // Television 2
      208,  // Mushroom Shelf (read)
      209,  // Mushroom Sofa
      210   // Mushroom Lamp
    ]);
  }

  update(dt) {
    this.bobTimer += dt * 5;

    this.findActiveInteractable();

    if (this.isVisible && (this.activeEntity || this.activeTile)) {
        if (this.game.input.isPressed(' ') || this.game.input.isPressed('e')) {
            this.trigger();
        }
    }
  }

  findActiveInteractable() {
    const player = this.game.player;
    if (!player) return;

    let closest = null;
    let closestTile = null;
    let minDist = this.interactionRange;

    const pCx = player.x + player.width / 2;
    const pCy = player.y + player.height / 2;

    for (const ent of this.game.map.entities) {
      const def = ENTITIES[ent.id];
      if (!def) continue;
      
      const isMatureCrop = ent.data && ent.data.type === 'crop' && ent.data.stage === 'mature';
      const isPond = def.group === 'pond_group';
      const isInteractable = this.interactableIds.has(ent.id);
      
      if (isMatureCrop || isPond || isInteractable) { 
        // Calculate entity bounds with offset
        const entX = ent.x + (ent.offsetX || 0);
        const entY = ent.y + (ent.offsetY || 0);
        const entW = ent.width || def.width;
        const entH = ent.height || def.height;
        
        // Find closest point on entity's bounding box to player center
        const closestX = Math.max(entX, Math.min(pCx, entX + entW));
        const closestY = Math.max(entY, Math.min(pCy, entY + entH));
        
        // Calculate distance from player center to closest point on entity
        const dist = Math.sqrt(Math.pow(pCx - closestX, 2) + Math.pow(pCy - closestY, 2));
        
        if (dist < minDist) {
          minDist = dist;
          closest = ent;
        }
      }
    }

    const tileSize = this.game.tileSize;
    const tileX = Math.floor(pCx / tileSize);
    const tileY = Math.floor(pCy / tileSize);

    // Check surrounding tiles for painting (ID 40)
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const checkX = tileX + dx;
        const checkY = tileY + dy;
        
        if (checkX >= 0 && checkX < this.game.map.cols && 
            checkY >= 0 && checkY < this.game.map.rows) {
          
          const decoId = this.game.map.layers.deco[checkY][checkX];
          
          if (decoId === 40) {
            // For painting tile, calculate closest point on tile bounds
            const tileCx = checkX * tileSize;
            const tileCy = checkY * tileSize;
            
            const closestX = Math.max(tileCx, Math.min(pCx, tileCx + tileSize));
            const closestY = Math.max(tileCy, Math.min(pCy, tileCy + tileSize));
            
            const dist = Math.sqrt(Math.pow(pCx - closestX, 2) + Math.pow(pCy - closestY, 2));
            
            if (dist < minDist) {
              minDist = dist;
              closest = null;
              closestTile = { x: checkX, y: checkY, id: decoId };
            }
          }
        }
      }
    }

    this.activeEntity = closest;
    this.activeTile = closestTile;
    this.isVisible = !!(closest || closestTile);
  }

  trigger() {
    // 播放交互音效
    this.game.audio.playSFX('interact');
    
    if (this.activeEntity) {
      const ent = this.activeEntity;
      const entKey = `${ent.x}_${ent.y}_${ent.id}`;
      
      if (ent.id === 200) {
        // Bed - Sleep
        this.game.startSleep(ent);
      } else if (ent.data && ent.data.type === 'crop' && ent.data.stage === 'mature') {
        // Mature Crop - Pick
        this.game.farming.pickCrop(ent);
      } else if (ENTITIES[ent.id] && ENTITIES[ent.id].group === 'pond_group') {
        // Pond - Check
        this.game.dialogue.show("The water is crystal clear. You can see fish swimming below.", "default", "Flora");
      } else if (ent.id === 205) {
        // Shelf - Drink
        this.game.dialogue.show("You take a sip from the bottle. Refreshing!", "default", "Flora");
      } else if (ent.id === 204 || ent.id === 207) {
        // Television - Toggle on/off
        this.toggleTV(ent, entKey);
      } else if (ent.id === 208) {
        // Mushroom Shelf - Read
        const readingQuotes = [
          "Some stories stay with you longer than others.",
          "The pages smell of old memories.",
          "A tale of distant lands and forgotten dreams.",
          "Words can be seeds... or storms.",
          "This book has been waiting for someone.",
          "Between the lines, something whispers."
        ];
        const quote = readingQuotes[Math.floor(Math.random() * readingQuotes.length)];
        this.game.dialogue.show(quote, "default", "Flora");
      } else if (ent.id === 206 || ent.id === 209) {
        // Armchair or Sofa - Sit
        this.game.dialogue.show("I don't like sitting down, not because the animation is troublesome.", "default", "Flora");
      } else if (ent.id === 210) {
        // Mushroom Lamp - Toggle on/off
        this.toggleLamp(ent, entKey);
      }
    } else if (this.activeTile) {
      if (this.activeTile.id === 40) {
        this.game.dialogue.show("A beautiful painting. The colors seem to shimmer in the light.", "default", "Flora");
      }
    }
    
    this.isVisible = false; 
    this.activeEntity = null;
    this.activeTile = null;
  }
  
  toggleTV(ent, entKey) {
    const def = ENTITIES[ent.id];
    const centerX = ent.x + (def.width || 32) / 2;
    const centerY = ent.y + (def.height || 32) / 2;
    
    if (this.activeTVs.has(entKey)) {
      // Turn OFF
      this.activeTVs.delete(entKey);
      if (this.game.particles) {
        this.game.particles.stopEmitter(`tv_${entKey}`);
      }
      this.game.dialogue.show("The screen fades to black. Silence returns.", "default", "Flora");
    } else {
      // Turn ON
      this.activeTVs.add(entKey);
      if (this.game.particles) {
        this.game.particles.burstEffect(centerX, centerY, 'tv');
        this.game.particles.createTVGlow(entKey, ent.x, ent.y, def.width || 32, def.height || 32);
      }
      this.game.dialogue.show("The TV flickers to life. Colors dance across the screen.", "default", "Flora");
    }
  }
  
  toggleLamp(ent, entKey) {
    const def = ENTITIES[ent.id];
    const centerX = ent.x + (def.width || 32) / 2;
    const topY = ent.y + 8;
    
    if (this.activeLamps.has(entKey)) {
      // Turn OFF
      this.activeLamps.delete(entKey);
      if (this.game.particles) {
        this.game.particles.stopEmitter(`lamp_${entKey}`);
      }
      this.game.dialogue.show("Darkness settles gently.", "default", "Flora");
    } else {
      // Turn ON
      this.activeLamps.add(entKey);
      if (this.game.particles) {
        this.game.particles.burstEffect(centerX, topY, 'lamp');
        this.game.particles.createLampLight(entKey, centerX, topY);
      }
      this.game.dialogue.show("A warm glow fills the room.", "default", "Flora");
    }
  }

  checkClick(worldX, worldY) {
    if (!this.isVisible || (!this.activeEntity && !this.activeTile)) return false;

    if (worldX >= this.bubbleBounds.x && 
        worldX <= this.bubbleBounds.x + this.bubbleBounds.w &&
        worldY >= this.bubbleBounds.y && 
        worldY <= this.bubbleBounds.y + this.bubbleBounds.h) {
        
        this.trigger();
        return true;
    }
    return false;
  }

  getInteractionLabel() {
    if (this.activeEntity) {
      const ent = this.activeEntity;
      const entKey = `${ent.x}_${ent.y}_${ent.id}`;
      
      if (ent.id === 200) {
        return 'Sleep';
      } else if (ent.data && ent.data.type === 'crop' && ent.data.stage === 'mature') {
        return 'Pick';
      } else if (ENTITIES[ent.id] && ENTITIES[ent.id].group === 'pond_group') {
        return 'Check';
      } else if (ent.id === 205) {
        return 'Drink';
      } else if (ent.id === 204 || ent.id === 207) {
        return this.activeTVs.has(entKey) ? 'Turn Off' : 'Turn On';
      } else if (ent.id === 208) {
        return 'Read';
      } else if (ent.id === 206 || ent.id === 209) {
        return 'Sit';
      } else if (ent.id === 210) {
        return this.activeLamps.has(entKey) ? 'Turn Off' : 'Turn On';
      }
    } else if (this.activeTile && this.activeTile.id === 40) {
      return 'Check';
    }
    return 'Interact';
  }
  
  draw(ctx) {
    if (!this.isVisible || (!this.activeEntity && !this.activeTile)) return;

    const bobOffset = Math.floor(Math.sin(this.bobTimer) * 3);
    
    // Get the label first to calculate width
    const label = this.getInteractionLabel();
    
    // Measure text width
    ctx.font = 'bold 10px "Courier New", monospace';
    const textWidth = ctx.measureText(label).width;
    
    // Calculate bubble dimensions based on text
    const padding = 12;
    const bW = Math.max(40, textWidth + padding * 2);
    const bH = 22;
    
    let centerX, topY;

    if (this.activeEntity) {
      const ent = this.activeEntity;
      const def = ENTITIES[ent.id];

      const entW = ent.width || def.width;
      const entH = ent.height || def.height;

      centerX = ent.x + (ent.offsetX || 0) + entW / 2;
      topY = ent.y + (ent.offsetY || 0);
    } else if (this.activeTile) {
      const tileSize = this.game.tileSize;
      centerX = this.activeTile.x * tileSize + tileSize / 2;
      topY = this.activeTile.y * tileSize;
    } else {
      return;
    }

    const bx = Math.floor(centerX - bW / 2);
    const by = Math.floor(topY - bH - 12 + bobOffset);

    this.bubbleBounds = { x: bx, y: by, w: bW, h: bH };

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(bx + 2, by + 2, bW, bH);

    // Background
    ctx.fillStyle = '#fff';
    ctx.fillRect(bx, by, bW, bH);

    // Border
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';
    ctx.strokeRect(bx, by, bW, bH);

    // Text
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, bx + bW / 2, by + bH / 2 + 1);

    // Arrow pointer
    ctx.beginPath();
    ctx.moveTo(bx + bW / 2 - 4, by + bH + 1);
    ctx.lineTo(bx + bW / 2 + 4, by + bH + 1);
    ctx.lineTo(bx + bW / 2, by + bH + 5);
    ctx.fillStyle = '#fff';
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(bx + bW / 2 - 4, by + bH + 1);
    ctx.lineTo(bx + bW / 2 + 5, by + bH + 5);
    ctx.lineTo(bx + bW / 2 + 4, by + bH + 1);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1; 
    ctx.stroke();
  }
}
// 交互系统，处理玩家与游戏对象的交互逻辑
