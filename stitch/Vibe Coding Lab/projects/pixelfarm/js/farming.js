import { TILES, ENTITIES } from './tiles.js';

export class FarmingSystem {
  constructor(game) {
    this.game = game;
    this.selectedTool = 'none'; // 'none', 'hoe', 'seed', 'water'
    this.selectedSeed = 'sunflower'; // 'mushroom', 'tulip'
    
    this.tools = ['hoe', 'seed', 'water'];
    this.seeds = ['sunflower', 'mushroom', 'tulip'];

    // Growth Time (ms)
    // Requirement: 2 hours. For prototype/demo, using 10 seconds.
    this.GROWTH_TIME = 10000; 

    this.cropConfig = {
        'sunflower': { seed: 301, growing: 302, mature: 303 },
        'mushroom': { seed: 311, growing: 312, mature: 313 },
        'tulip': { seed: 321, growing: 322, mature: 323 }
    };
    
    this.uiElements = {
        hoe: null,
        seed: null,
        water: null,
        seedLabel: null
    };

    // Asset Map for Tools and Seeds
    this.toolIcons = {
        'hoe': 'https://static.wefun.ai/assets/0089249a-7670-4791-8174-9e0b5f5423ae.png',
        'water': 'https://static.wefun.ai/assets/52b46ea8-61b8-45ba-a7cb-d5659c0a1b93.png',
        'seed_sunflower': 'https://static.wefun.ai/assets/fa48b990-bdd0-40f1-9892-0f721f803bd3.png',
        'seed_mushroom': 'https://static.wefun.ai/assets/6c1bcf9a-8723-441b-854d-2cf10925ff66.png',
        'seed_tulip': 'https://static.wefun.ai/assets/2c449ccd-b4b2-4a83-8aa0-44b84c55cd56.png'
    };

    this.bindUI();
  }

  bindUI() {
      // These will be created in index.html
      this.uiElements.hoe = document.getElementById('tool-hoe');
      this.uiElements.seed = document.getElementById('tool-seed');
      this.uiElements.water = document.getElementById('tool-water');
      this.uiElements.seedLabel = document.getElementById('seed-type-label');

      if (this.uiElements.hoe) {
          this.uiElements.hoe.onclick = () => this.selectTool('hoe');
          this.uiElements.seed.onclick = () => {
              if (this.selectedTool === 'seed') {
                  this.cycleSeed();
              } else {
                  this.selectTool('seed');
              }
          };
          this.uiElements.water.onclick = () => this.selectTool('water');
      }
      
      this.updateUI();
  }

  selectTool(tool) {
      if (this.selectedTool === tool) {
          // Deselect if clicking same tool (optional, but good for UX)
          // this.selectedTool = 'none';
      } else {
          this.selectedTool = tool;
      }
      this.updateUI();
      this.updateCursor();
  }

  cycleSeed() {
      const idx = this.seeds.indexOf(this.selectedSeed);
      const next = (idx + 1) % this.seeds.length;
      this.selectedSeed = this.seeds[next];
      this.updateUI();
      // Ensure cursor updates immediately if holding seed tool
      if (this.selectedTool === 'seed') {
          this.updateCursor();
      }
  }

  updateUI() {
      // Reset classes
      ['hoe', 'seed', 'water'].forEach(t => {
          if (this.uiElements[t]) this.uiElements[t].classList.remove('active');
      });

      if (this.selectedTool !== 'none' && this.uiElements[this.selectedTool]) {
          this.uiElements[this.selectedTool].classList.add('active');
      }

      // Update Seed Icon
      if (this.uiElements.seed) {
          const iconDiv = this.uiElements.seed.querySelector('.icon-img');
          if (iconDiv) {
              const iconUrl = this.toolIcons[`seed_${this.selectedSeed}`];
              iconDiv.style.backgroundImage = `url('${iconUrl}')`;
          }
      }

      if (this.uiElements.seedLabel) {
          this.uiElements.seedLabel.innerText = this.selectedSeed.charAt(0).toUpperCase() + this.selectedSeed.slice(1);
      }
  }

  updateCursor() {
      const canvas = this.game.canvas;
      if (!canvas) return;

      let cursorUrl = '';

      if (this.selectedTool === 'hoe') {
          cursorUrl = this.toolIcons['hoe'];
      } else if (this.selectedTool === 'water') {
          cursorUrl = this.toolIcons['water'];
      } else if (this.selectedTool === 'seed') {
          cursorUrl = this.toolIcons[`seed_${this.selectedSeed}`];
      }

      if (cursorUrl) {
          // Set custom cursor with hotspot at center (16, 16) assuming 32x32 visual weight or similar
          canvas.style.cursor = `url('${cursorUrl}') 16 16, auto`;
      } else {
          canvas.style.cursor = 'default';
      }
  }

  handleInput(input) {
      // Keyboard Shortcuts
      if (input.isPressed('1')) this.selectTool('hoe');
      if (input.isPressed('2')) this.selectTool('seed');
      if (input.isPressed('3')) this.selectTool('water');
      if (input.isPressed('q')) this.cycleSeed(); // Shortcut for cycling seeds
  }

  handleClick(worldX, worldY) {
      // Snap to grid
      const tileSize = this.game.tileSize;
      const tileX = Math.floor(worldX / tileSize);
      const tileY = Math.floor(worldY / tileSize);
      
      const pixelX = tileX * tileSize;
      const pixelY = tileY * tileSize;

      // Check bounds
      if (tileX < 0 || tileX >= this.game.map.cols || tileY < 0 || tileY >= this.game.map.rows) return;

      const baseTile = this.game.map.layers.base[tileY][tileX];
      const entity = this.game.map.getEntityAt(pixelX, pixelY); // Helper needs to handle point check

      // 1. HOE: Grass -> Dirt (消耗锄头)
      if (this.selectedTool === 'hoe') {
          if (baseTile === 0) { // Grass
              // 检查是否有锄头
              if (!this.game.inventory.hasItem('hoe', 1)) {
                  this.game.dialogue.show('Out of hoes!', 'default', 'Flora');
                  return;
              }
              // 消耗锄头
              this.game.inventory.removeItem('hoe', 1);
              this.game.map.setTile(tileX, tileY, 50); // Dirt
              this.game.audio.playSFX('hoe'); // 锄地音效
          }
          return;
      }

      // 2. SEED: Dirt -> Seed Entity (消耗种子)
      if (this.selectedTool === 'seed') {
          if (baseTile === 50 && !entity) { // Dirt and Empty
              const seedItemId = `seed_${this.selectedSeed}`;
              // 检查是否有种子
              if (!this.game.inventory.hasItem(seedItemId, 1)) {
                  this.game.dialogue.show(`Out of ${this.selectedSeed} seeds!`, 'default', 'Flora');
                  return;
              }
              // 消耗种子
              this.game.inventory.removeItem(seedItemId, 1);
              
              const seedId = this.cropConfig[this.selectedSeed].seed;
              const newEnt = this.game.map.addEntity(seedId, pixelX, pixelY);
              if (newEnt) {
                  newEnt.data = {
                      type: 'crop',
                      cropType: this.selectedSeed,
                      stage: 'seed',
                      plantedAt: Date.now()
                  };
                  this.game.audio.playSFX('plant'); // 种植音效
              }
          }
          return;
      }

      // 3. WATER: Seed -> Growing
      if (this.selectedTool === 'water') {
          if (entity && entity.data && entity.data.type === 'crop' && entity.data.stage === 'seed') {
              const cfg = this.cropConfig[entity.data.cropType];
              // Change Visual
              entity.id = cfg.growing;
              entity.data.stage = 'growing';
              entity.data.wateredAt = Date.now();
              this.game.audio.playSFX('water'); // 浇水音效
          }
          return;
      }

      // 4. No tool selected - Allow picking mature crops via click (fallback)
      if (entity && entity.data && entity.data.type === 'crop' && entity.data.stage === 'mature') {
          this.pickCrop(entity);
      }
  }

  pickCrop(entity) {
      // Find the tile position
      const tileX = Math.floor(entity.x / this.game.tileSize);
      const tileY = Math.floor(entity.y / this.game.tileSize);
      
      // Remove entity
      const idx = this.game.map.entities.indexOf(entity);
      if (idx > -1) {
          this.game.map.entities.splice(idx, 1);
          
          // 添加作物到背包
          const cropItemId = `crop_${entity.data.cropType}`;
          const added = this.game.inventory.addItem(cropItemId, 1);
          
          // 播放收获音效
          this.game.audio.playSFX('harvest');
          
          // Visual Feedback
          const cropName = this.game.inventory.itemDefs[cropItemId]?.name || entity.data.cropType;
          if (added) {
              this.game.dialogue.show(`Harvested ${cropName}! Added to inventory.`, 'player_happy', 'Flora');
          } else {
              this.game.dialogue.show(`Inventory full! ${cropName} was dropped.`, 'default', 'Flora');
          }
          
          // Transform tile back to grass (dirt disappears after harvest)
          this.game.map.setTile(tileX, tileY, 0); // Grass
      }
  }

  update(dt) {
      // Check Growth
      const now = Date.now();
      
      this.game.map.entities.forEach(ent => {
          if (ent.data && ent.data.type === 'crop' && ent.data.stage === 'growing') {
              if (ent.data.wateredAt && (now - ent.data.wateredAt > this.GROWTH_TIME)) {
                  // Grow to Mature
                  const cfg = this.cropConfig[ent.data.cropType];
                  ent.id = cfg.mature;
                  ent.data.stage = 'mature';
                  
                  // Update dimensions if needed
                  const def = ENTITIES[cfg.mature];
                  if (def) {
                      ent.width = def.width;
                      ent.height = def.height;
                  }
              }
          }
      });
  }
}
// 农场系统，处理种植、收获等农场相关功能
