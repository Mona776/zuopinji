// 编辑器工具，用于创建和编辑游戏内容
import { GROUPS, TILES, ENTITIES, TILE_TYPES } from './tiles.js';
import { Animator } from './animator.js';

export class Editor {
  constructor(game) {
    this.game = game;
    this.selectedId = 'tool_cursor';
    this.selectedType = 'tool';
    
    this.isMouseDown = false;
    this.isVisible = false; 
    this.isShiftDown = false;
    
    this.mouseX = 0;
    this.mouseY = 0;

    this.isDragging = false;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;

    this.placementOffset = { x: 0, y: 0 };
    
    this.previewAnimator = null;
    this.lastDrawTime = 0;

    this.container = null;
    
    this.hiddenItems = new Set();
    this.loadHiddenItems();
    
    // Show names toggle
    this.showNames = false;

    this.createUI();
    this.attachEvents();
  }

  loadHiddenItems() {
    try {
        const stored = localStorage.getItem('pixel_farm_hidden_palette');
        if (stored) {
            const ids = JSON.parse(stored);
            if (Array.isArray(ids)) {
                this.hiddenItems = new Set(ids);
            }
        }
    } catch (e) {
        console.error('Failed to load hidden palette items', e);
    }
  }

  saveHiddenItems() {
    localStorage.setItem('pixel_farm_hidden_palette', JSON.stringify([...this.hiddenItems]));
  }

  hidePaletteItem(id) {
    this.hiddenItems.add(id);
    this.saveHiddenItems();
    
    if (this.selectedId === id) {
        this.selectItem('tool_cursor', 'tool', null);
    }
  }

  restorePalette() {
    if (confirm('Restore all hidden palette items?')) {
        this.hiddenItems.clear();
        this.saveHiddenItems();
        
        const rect = this.container.getBoundingClientRect();
        const prevTop = this.container.style.top;
        const prevLeft = this.container.style.left;

        document.body.removeChild(this.container);
        this.createUI();
        
        if (this.isVisible) {
            this.container.style.display = 'flex';
            if (prevTop && prevLeft) {
                this.container.style.top = prevTop;
                this.container.style.left = prevLeft;
                this.container.style.right = 'auto';
            }
        } else {
            this.container.style.display = 'none';
        }
        
        this.selectItem('tool_cursor', 'tool', document.getElementById('btn-cursor'));
    }
  }

  createUI() {
    this.container = document.createElement('div');
    this.container.id = 'editor-ui';
    this.container.style.display = 'none'; 

    const header = document.createElement('div');
    header.className = 'editor-header';
    const title = document.createElement('h3');
    title.innerText = 'Dev Mode';
    header.appendChild(title);
    this.container.appendChild(header);

    const content = document.createElement('div');
    content.className = 'editor-content';

    const toolsDiv = document.createElement('div');
    toolsDiv.className = 'editor-group';
    const toolsLabel = document.createElement('h4');
    toolsLabel.innerText = 'Tools';
    toolsDiv.appendChild(toolsLabel);
    
    const toolsGrid = document.createElement('div');
    toolsGrid.className = 'editor-grid';

    const cursorBtn = document.createElement('div');
    cursorBtn.id = 'btn-cursor';
    cursorBtn.className = 'tile-btn active';
    cursorBtn.innerHTML = '<div class="tile-color" style="background:#444; color:white; display:flex; justify-content:center; align-items:center;">⬉</div><span>Cursor (Select)</span>';
    cursorBtn.onclick = () => this.selectItem('tool_cursor', 'tool', cursorBtn);
    toolsGrid.appendChild(cursorBtn);
    
    toolsDiv.appendChild(toolsGrid);
    content.appendChild(toolsDiv);

    const allItems = [...Object.values(TILES), ...Object.values(ENTITIES)];

    Object.values(GROUPS).forEach(group => {
      const groupDiv = document.createElement('div');
      groupDiv.className = 'editor-group';
      
      const label = document.createElement('h4');
      label.innerText = group.label;
      
      const grid = document.createElement('div');
      grid.className = 'editor-grid';

      let hasItems = false;

      allItems.forEach(item => {
        const groupKey = Object.keys(GROUPS).find(key => GROUPS[key] === group);
        
        if (item.group === groupKey) {
          if (this.hiddenItems.has(item.id)) return;

          hasItems = true;
          const btn = document.createElement('div');
          btn.className = 'tile-btn';
          
          if (item.src) {
             const img = document.createElement('img');
             img.className = 'tile-img';
             img.src = item.src;
             if (item.frameCount) {
                 img.style.objectFit = 'none';
                 img.style.objectPosition = '0 0';
                 img.style.width = 'auto';
                 img.style.height = 'auto';
                 img.style.maxWidth = 'none';
                 img.style.maxHeight = '100%';
             }
             btn.appendChild(img);
          } else if (item.frames && item.frames.length > 0) {
             const img = document.createElement('img');
             img.className = 'tile-img';
             img.src = item.frames[0];
             btn.appendChild(img);
          } else {
             const colorBox = document.createElement('div');
             colorBox.className = 'tile-color';
             colorBox.style.backgroundColor = item.color || '#fff';
             if (group.label === 'Plants') {
                 colorBox.style.borderRadius = '50%';
             }
             if (item.id === 999) {
                 colorBox.innerText = '!';
                 colorBox.style.display = 'flex';
                 colorBox.style.alignItems = 'center';
                 colorBox.style.justifyContent = 'center';
                 colorBox.style.color = 'black';
                 colorBox.style.fontWeight = 'bold';
                 colorBox.style.backgroundColor = 'yellow';
             }
             btn.appendChild(colorBox);
          }
          
          const nameSpan = document.createElement('span');
          nameSpan.innerText = item.name;
          btn.appendChild(nameSpan);

          btn.addEventListener('click', () => {
            this.selectItem(item.id, group.type, btn);
          });

          btn.addEventListener('contextmenu', (e) => {
              e.preventDefault();
              if (confirm(`Remove "${item.name}" from palette?`)) {
                  this.hidePaletteItem(item.id);
                  btn.remove();
              }
          });

          grid.appendChild(btn);
        }
      });

      if (hasItems) {
        groupDiv.appendChild(label);
        groupDiv.appendChild(grid);
        content.appendChild(groupDiv);
      }
    });

    const hint = document.createElement('p');
    hint.className = 'editor-hint';
    hint.innerText = 'L-Click: Place (if tool selected)\nDouble-Click: Edit Interaction\nR-Click: Delete Map Item\nP: Save Map | Arrows: Offset';
    content.appendChild(hint);

    const actionDiv = document.createElement('div');
    actionDiv.className = 'editor-actions';
    actionDiv.style.marginTop = '15px';
    actionDiv.style.borderTop = '1px solid #555';
    actionDiv.style.paddingTop = '10px';

    const exportBtn = document.createElement('button');
    exportBtn.className = 'dev-btn';
    exportBtn.innerText = '📥 Export as Default Map';
    exportBtn.title = 'Save current layout as the default initial map';
    exportBtn.onclick = () => this.exportAsDefaultMap();
    actionDiv.appendChild(exportBtn);

    const loadBtn = document.createElement('button');
    loadBtn.className = 'dev-btn';
    loadBtn.innerText = '📤 Load Default Map';
    loadBtn.title = 'Load the saved default map into current scene';
    loadBtn.onclick = () => this.loadDefaultMap();
    actionDiv.appendChild(loadBtn);

    const clearBtn = document.createElement('button');
    clearBtn.className = 'dev-btn dev-btn-danger';
    clearBtn.innerText = '🗑️ Clear Default Map';
    clearBtn.title = 'Remove default map configuration';
    clearBtn.onclick = () => this.clearDefaultMap();
    actionDiv.appendChild(clearBtn);

    content.appendChild(actionDiv);

    // Show Names Toggle Button
    const showNamesBtn = document.createElement('button');
    showNamesBtn.className = 'dev-btn';
    showNamesBtn.id = 'show-names-btn';
    showNamesBtn.innerText = '🏷️ Show Names: OFF';
    showNamesBtn.style.marginTop = '10px';
    showNamesBtn.onclick = () => {
      this.showNames = !this.showNames;
      showNamesBtn.innerText = `🏷️ Show Names: ${this.showNames ? 'ON' : 'OFF'}`;
      showNamesBtn.classList.toggle('active', this.showNames);
    };
    content.appendChild(showNamesBtn);

    const resetBtn = document.createElement('button');
    resetBtn.className = 'dev-btn';
    resetBtn.innerText = 'Restore Hidden Items';
    resetBtn.style.marginTop = '5px';
    resetBtn.onclick = () => this.restorePalette();
    content.appendChild(resetBtn);

    this.container.appendChild(content);
    document.body.appendChild(this.container);

    header.addEventListener('mousedown', (e) => this.startDrag(e));
  }

  exportAsDefaultMap() {
    const sceneType = this.game.map.sceneType;
    if (!sceneType) {
      alert('No scene loaded. Cannot export.');
      return;
    }

    const mapData = {
      version: 1,
      sceneType: sceneType,
      timestamp: Date.now(),
      cols: this.game.map.cols,
      rows: this.game.map.rows,
      layers: this.game.map.layers,
      entities: this.game.map.entities.map(e => {
        const def = ENTITIES[e.id];
        let saveId = e.id;
        if (def && def.group === 'pond_group') {
          saveId = 150;
        }
        const data = {
          id: saveId,
          x: e.x,
          y: e.y,
          offsetX: e.offsetX || 0,
          offsetY: e.offsetY || 0,
          data: e.data || {}
        };
        if (e.width) data.w = e.width;
        if (e.height) data.h = e.height;
        return data;
      }),
      portals: this.game.map.portals
    };

    const key = `pixel_farm_default_map_${sceneType}`;
    localStorage.setItem(key, JSON.stringify(mapData));
    
    console.log(`✅ Default map exported for scene: ${sceneType}`);
    alert(`Default map saved!\nScene: ${sceneType}\nEntities: ${mapData.entities.length}\n\nThis will be used as the initial map when no saved game exists.`);
  }

  loadDefaultMap() {
    const sceneType = this.game.map.sceneType;
    if (!sceneType) {
      alert('No scene loaded.');
      return;
    }

    const key = `pixel_farm_default_map_${sceneType}`;
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      alert(`No default map found for scene: ${sceneType}`);
      return;
    }

    if (!confirm('Load default map? This will replace the current layout.')) {
      return;
    }

    try {
      const mapData = JSON.parse(stored);
      
      if (mapData.cols !== this.game.map.cols || mapData.rows !== this.game.map.rows) {
        alert(`Map size mismatch!\nSaved: ${mapData.cols}x${mapData.rows}\nCurrent: ${this.game.map.cols}x${this.game.map.rows}`);
        return;
      }

      this.game.map.layers = mapData.layers;
      this.game.map.entities = [];
      
      mapData.entities.forEach(e => {
        const ent = this.game.map.addEntity(e.id, e.x, e.y, e.offsetX, e.offsetY, e.data);
        if (ent && (e.w || e.h)) {
          ent.width = e.w || null;
          ent.height = e.h || null;
        }
      });

      if (mapData.portals) {
        this.game.map.portals = mapData.portals;
      }

      console.log(`✅ Default map loaded for scene: ${sceneType}`);
      alert('Default map loaded successfully!');
    } catch (e) {
      console.error('Failed to load default map:', e);
      alert('Error loading default map. Data may be corrupted.');
    }
  }

  clearDefaultMap() {
    const sceneType = this.game.map.sceneType;
    if (!sceneType) {
      alert('No scene loaded.');
      return;
    }

    const key = `pixel_farm_default_map_${sceneType}`;
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      alert(`No default map exists for scene: ${sceneType}`);
      return;
    }

    if (!confirm(`Delete default map for ${sceneType}?\n\nThis cannot be undone.`)) {
      return;
    }

    localStorage.removeItem(key);
    console.log(`🗑️ Default map cleared for scene: ${sceneType}`);
    alert('Default map deleted.');
  }

  toggle() {
      // Only toggle if dev mode is unlocked
      if (!this.game.devModeUnlocked) return;
      
      this.isVisible = !this.isVisible;
      this.container.style.display = this.isVisible ? 'flex' : 'none';
      this.checkCursor();
  }

  startDrag(e) {
      this.isDragging = true;
      const rect = this.container.getBoundingClientRect();
      this.dragOffsetX = e.clientX - rect.left;
      this.dragOffsetY = e.clientY - rect.top;
      e.preventDefault();
  }

  stopDrag() {
      this.isDragging = false;
  }

  onDrag(e) {
      if (!this.isDragging) return;
      let newLeft = e.clientX - this.dragOffsetX;
      let newTop = e.clientY - this.dragOffsetY;
      this.container.style.left = `${newLeft}px`;
      this.container.style.top = `${newTop}px`;
      this.container.style.right = 'auto'; 
  }

  selectItem(id, type, btnElement) {
    this.selectedId = id;
    this.selectedType = type;
    this.placementOffset = { x: 0, y: 0 };
    this.previewAnimator = null;
    
    document.querySelectorAll('.tile-btn').forEach(b => b.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');

    if (type === 'entity') {
        const def = ENTITIES[id];
        if (def) {
            if (def.frames) {
                const imgs = this.game.map.entityImages[id];
                if (imgs && Array.isArray(imgs)) {
                    const frames = imgs.map(img => ({
                        x: 0, y: 0, w: 0, h: 0, image: img, useFullSource: true
                    }));
                    this.previewAnimator = new Animator({
                        'preview': { frames: frames, speed: def.animSpeed, loop: true }
                    });
                    this.previewAnimator.play('preview');
                }
            } else if (def.frameCount) {
                 const frames = [];
                 const img = this.game.map.entityImages[id];
                 const fw = def.frameWidth || def.width;
                 const fh = def.frameHeight || def.height;
                 
                 for(let i=0; i<def.frameCount; i++) {
                     frames.push({ x: i*fw, y: 0, w: fw, h: fh, image: img });
                 }
                 
                 this.previewAnimator = new Animator({
                     'preview': { frames: frames, speed: def.animSpeed, loop: true }
                 });
                 this.previewAnimator.play('preview');
            }
        }
    }
  }

  checkCursor() {
      if (!this.isVisible) {
          if (this.game.farming) {
              this.game.farming.updateCursor();
          } else {
              this.game.canvas.style.cursor = 'default';
          }
          return;
      }
      
      if (this.selectedId === 'tool_cursor') {
          this.game.canvas.style.cursor = 'pointer';
      } else if (this.isShiftDown) {
          this.game.canvas.style.cursor = 'help';
      } else if (this.selectedId !== null) {
          this.game.canvas.style.cursor = 'crosshair';
      } else {
          this.game.canvas.style.cursor = 'default';
      }
  }

  attachEvents() {
    window.addEventListener('mousemove', (e) => {
        this.onDrag(e);
        if (this.isVisible) {
             const changed = this.isShiftDown !== e.shiftKey;
             this.isShiftDown = e.shiftKey;
             if (changed) this.checkCursor();
        }
        if (this.isVisible) this.checkCursor();
    });
    
    window.addEventListener('mouseup', () => this.stopDrag());

    window.addEventListener('keydown', (e) => {
        // Skip editor hotkeys when diary is being edited
        if (this.game.diary && this.game.diary.isBlockingInput()) {
            return;
        }
        
        if (e.key === 'Shift') {
            this.isShiftDown = true;
            this.checkCursor();
        }

        // Tab key toggle disabled - use secret code 'lovewefun' to unlock
        if (e.key === 'Tab' && this.game.devModeUnlocked) {
            e.preventDefault();
            this.toggle();
        }

        if (this.isVisible && this.selectedType === 'entity') {
            const step = 1;
            if (e.key === 'ArrowUp') { this.placementOffset.y -= step; e.preventDefault(); }
            if (e.key === 'ArrowDown') { this.placementOffset.y += step; e.preventDefault(); }
            if (e.key === 'ArrowLeft') { this.placementOffset.x -= step; e.preventDefault(); }
            if (e.key === 'ArrowRight') { this.placementOffset.x += step; e.preventDefault(); }
        }

        if (this.isVisible && e.key.toLowerCase() === 'p') {
            this.save();
        }
    });
    
    window.addEventListener('keyup', (e) => {
        if (e.key === 'Shift') {
            this.isShiftDown = false;
            this.checkCursor();
        }
    });

    this.game.canvas.addEventListener('mousemove', (e) => {
      if (!this.isVisible) return;
      const rect = this.game.canvas.getBoundingClientRect();
      const scaleX = this.game.canvas.width / rect.width;
      const scaleY = this.game.canvas.height / rect.height;
      this.mouseX = (e.clientX - rect.left) * scaleX;
      this.mouseY = (e.clientY - rect.top) * scaleY;

      if (this.isMouseDown) {
        if (!e.shiftKey) {
            this.paint();
        }
      }
    });

    this.game.canvas.addEventListener('mousedown', (e) => {
      if (!this.isVisible) return;

      const rect = this.game.canvas.getBoundingClientRect();
      const scaleX = this.game.canvas.width / rect.width;
      const scaleY = this.game.canvas.height / rect.height;
      this.mouseX = (e.clientX - rect.left) * scaleX;
      this.mouseY = (e.clientY - rect.top) * scaleY;
      
      if (e.button === 0) {
        if (e.shiftKey) {
            e.preventDefault();
            this.editProperties(false);
        } else {
            this.isMouseDown = true;
            this.paint();
        }
      } else if (e.button === 2) {
        e.preventDefault();
        this.erase();
      }
    });

    this.game.canvas.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });
    
    this.game.canvas.addEventListener('contextmenu', e => e.preventDefault());

    this.game.canvas.addEventListener('dblclick', (e) => {
        if (!this.isVisible) return;
        e.preventDefault();
        this.editProperties(true);
    });
  }

  getWorldPos() {
    const cam = this.game.camera;
    const worldX = this.mouseX + Math.floor(cam.x);
    const worldY = this.mouseY + Math.floor(cam.y);

    const tileX = Math.floor(worldX / this.game.tileSize);
    const tileY = Math.floor(worldY / this.game.tileSize);
    
    return { x: tileX, y: tileY, pixelX: tileX * this.game.tileSize, pixelY: tileY * this.game.tileSize, rawX: worldX, rawY: worldY };
  }

  paint() {
    if (this.selectedId === 'tool_cursor' || this.selectedType === 'tool') return;
    if (this.selectedId === null) return;
    
    const { x, y, pixelX, pixelY } = this.getWorldPos();

    if (this.selectedType === 'tile') {
        this.game.map.setTile(x, y, this.selectedId);
    } else if (this.selectedType === 'entity') {
        const existing = this.game.map.entities.find(e => e.x === pixelX && e.y === pixelY);
        if (!existing) {
             this.game.map.addEntity(this.selectedId, pixelX, pixelY, this.placementOffset.x, this.placementOffset.y);
        }
    }
  }

  erase() {
    const { x, y, pixelX, pixelY, rawX, rawY } = this.getWorldPos();
    
    if (this.game.map.removeEntityAt(rawX, rawY)) {
        return;
    }

    this.game.map.removeDeco(x, y);
  }

  editProperties(autoCreate = false) {
      const { rawX, rawY } = this.getWorldPos();
      let entity = this.game.map.getEntityAt(rawX, rawY);
      
      if (!entity) {
          const range = 16; 
          for (const ent of this.game.map.entities) {
              const def = ENTITIES[ent.id];
              const w = ent.width || def.width;
              const h = ent.height || def.height;
              const cx = ent.x + (ent.offsetX||0) + w/2;
              const cy = ent.y + (ent.offsetY||0) + h/2;
              const dist = Math.sqrt(Math.pow(rawX - cx, 2) + Math.pow(rawY - cy, 2));
              if (dist < range + Math.max(w, h)/2) {
                   if (dist < 48) { 
                       entity = ent;
                       break;
                   }
              }
          }
      }
      
      if (!entity && autoCreate) {
          this.createTriggerAt(rawX, rawY, true);
          return;
      }

      console.log('Edit attempt at:', rawX, rawY, 'Found:', entity);

      if (entity) {
          this.editEntity(entity);
      } else {
           if (confirm("No entity here. Create a hidden trigger zone?")) {
               this.createTriggerAt(rawX, rawY, false);
          }
      }
  }

  editEntity(entity) {
      const def = ENTITIES[entity.id];
      const currentMsg = (entity.data && entity.data.message) ? entity.data.message : '';
      
      const msg = prompt(`Edit interaction for ${def.name}:\n(Leave empty to remove)`, currentMsg);
      
      if (msg !== null) {
          if (!entity.data) entity.data = {};
          entity.data.message = msg;
          
          if (msg === "") {
              delete entity.data.message;
          } else {
              if (!entity.data.portrait) entity.data.portrait = 'default';
          }
          
          if (entity.id === 999) {
              const currentW = entity.width || def.width;
              const currentH = entity.height || def.height;
              const sizeStr = prompt(`Set Trigger Area Size (WxH):`, `${currentW}x${currentH}`);
              if (sizeStr) {
                  const parts = sizeStr.toLowerCase().split('x');
                  if (parts.length === 2) {
                      const w = parseInt(parts[0]);
                      const h = parseInt(parts[1]);
                      if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
                          entity.width = w;
                          entity.height = h;
                      }
                  }
              }
          }
      }
  }

  createTriggerAt(rawX, rawY, skipConfirm) {
      const tileSize = this.game.tileSize;
      const x = Math.floor(rawX / tileSize) * tileSize;
      const y = Math.floor(rawY / tileSize) * tileSize;
      
      const entity = this.game.map.addEntity(999, x, y);
      
      if (entity) {
          entity.data = { message: "Interaction Text Here", portrait: "default" };
          if (skipConfirm) {
              this.editEntity(entity);
          } else {
               this.editEntity(entity);
          }
      }
  }

  save() {
    this.game.map.saveToStorage();
    alert('Map Saved!');
  }

  drawTileNames(ctx) {
    const cam = this.game.camera;
    const tileSize = this.game.tileSize;
    const map = this.game.map;
    
    // Calculate visible tile range
    const startX = Math.floor(cam.x / tileSize);
    const startY = Math.floor(cam.y / tileSize);
    const endX = Math.ceil((cam.x + cam.width) / tileSize);
    const endY = Math.ceil((cam.y + cam.height) / tileSize);
    
    ctx.font = 'bold 8px monospace';
    
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        if (x < 0 || y < 0 || x >= map.cols || y >= map.rows) continue;
        
        const drawX = x * tileSize;
        const drawY = y * tileSize;
        
        // Get base tile
        const baseTileId = map.layers.base[y]?.[x];
        const baseTile = TILES[baseTileId];
        
        // Get deco tile
        const decoTileId = map.layers.deco[y]?.[x];
        const decoTile = TILES[decoTileId];
        
        // Draw base tile name
        if (baseTile && baseTileId !== 0) { // Skip grass (0) to reduce clutter
          const name = baseTile.name;
          const textWidth = ctx.measureText(name).width;
          
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.fillRect(drawX + 1, drawY + 1, textWidth + 4, 10);
          
          ctx.fillStyle = '#ffff00';
          ctx.fillText(name, drawX + 3, drawY + 9);
        }
        
        // Draw deco tile name (offset to avoid overlap)
        if (decoTile) {
          const name = decoTile.name;
          const textWidth = ctx.measureText(name).width;
          
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.fillRect(drawX + 1, drawY + 12, textWidth + 4, 10);
          
          ctx.fillStyle = '#00ffff';
          ctx.fillText(name, drawX + 3, drawY + 20);
        }
      }
    }
  }

  draw(ctx) {
    if (this.isVisible) {
        ctx.save();
        const entities = this.game.map.entities;
        for (const ent of entities) {
            const def = ENTITIES[ent.id];
            const w = ent.width || def.width;
            const h = ent.height || def.height;
            const rX = ent.x + (ent.offsetX||0);
            const rY = ent.y + (ent.offsetY||0);

            if (ent.id === 999) {
                ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
                ctx.fillRect(rX, rY, w, h);
                ctx.strokeStyle = 'yellow';
                ctx.lineWidth = 2;
                ctx.strokeRect(rX, rY, w, h);
                
                ctx.fillStyle = 'white';
                ctx.font = '10px monospace';
                ctx.fillText('TRIG', rX + 2, rY + 12);
            }

            if (ent.data && ent.data.message) {
                const cx = rX + w/2;
                const cy = rY;
                
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(cx, cy - 10, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
            
            // Show entity names when enabled
            if (this.showNames && def) {
                const nameX = rX + w / 2;
                const nameY = rY + h + 12;
                
                // Draw name label with background
                ctx.font = 'bold 9px monospace';
                const textWidth = ctx.measureText(def.name).width;
                
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(nameX - textWidth / 2 - 3, nameY - 9, textWidth + 6, 12);
                
                ctx.fillStyle = '#00ff00';
                ctx.textAlign = 'center';
                ctx.fillText(def.name, nameX, nameY);
                ctx.textAlign = 'left';
            }
        }
        
        // Show tile names when enabled
        if (this.showNames) {
            this.drawTileNames(ctx);
        }
        
        ctx.restore();
    }

    if (!this.isVisible || this.selectedId === null || this.selectedId === 'tool_cursor') return;

    const { pixelX, pixelY } = this.getWorldPos();
    
    ctx.save();
    ctx.globalAlpha = 0.6; 

    if (this.selectedType === 'tile') {
        this.game.map.drawTile(ctx, this.selectedId, pixelX, pixelY);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(pixelX, pixelY, this.game.tileSize, this.game.tileSize);
    } else {
        const def = ENTITIES[this.selectedId];
        if (def) {
            const drawX = pixelX + this.placementOffset.x;
            const drawY = pixelY + this.placementOffset.y;

            let drewFrame = false;

            if (def.group === 'pond_group') {
                 const map = this.game.map;
                 const currentFrameId = map.pondAnim.sequence[map.pondAnim.frameIndex];
                 const img = map.entityImages[currentFrameId];
                 if (img && img.complete) {
                     ctx.drawImage(img, Math.floor(drawX), Math.floor(drawY), def.width, def.height);
                     drewFrame = true;
                 }
            }

            if (!drewFrame && this.previewAnimator) {
                const now = performance.now();
                const dt = (now - this.lastDrawTime) / 1000;
                this.lastDrawTime = now;
                if (dt < 0.2) {
                    this.previewAnimator.update(dt);
                }
                
                const frame = this.previewAnimator.getCurrentFrame();
                if (frame && frame.image && frame.image.complete) {
                    if (frame.useFullSource) {
                        ctx.drawImage(frame.image, drawX, drawY, def.width, def.height);
                    } else {
                        ctx.drawImage(frame.image, frame.x, frame.y, frame.w, frame.h, drawX, drawY, def.width, def.height);
                    }
                    drewFrame = true;
                }
            }
            
            if (!drewFrame) {
                if (def.frames) {
                   const imgs = this.game.map.entityImages[def.id];
                   if (Array.isArray(imgs) && imgs[0]) {
                       ctx.drawImage(imgs[0], drawX, drawY, def.width, def.height);
                   }
                } else if (this.game.map.entityImages[def.id]) {
                    ctx.drawImage(this.game.map.entityImages[def.id], drawX, drawY, def.width, def.height);
                } else {
                    if (def.id === 999) {
                        ctx.fillStyle = 'yellow';
                        ctx.fillRect(drawX, drawY, def.width, def.height);
                        ctx.strokeStyle = 'black';
                        ctx.strokeRect(drawX, drawY, def.width, def.height);
                    } else {
                        ctx.fillStyle = 'blue';
                        ctx.fillRect(drawX, drawY, def.width, def.height);
                    }
                }
            }

            if (def.hitbox) {
                ctx.strokeStyle = '#ff0000'; 
                ctx.lineWidth = 2;
                ctx.strokeRect(drawX + def.hitbox.x, drawY + def.hitbox.y, def.hitbox.w, def.hitbox.h);
                
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.fillRect(drawX + def.hitbox.x, drawY + def.hitbox.y, def.hitbox.w, def.hitbox.h);
            }
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.strokeRect(pixelX, pixelY, this.game.tileSize, this.game.tileSize);

            ctx.strokeStyle = 'white';
            ctx.strokeRect(drawX, drawY, def.width, def.height);
            
            if (this.placementOffset.x !== 0 || this.placementOffset.y !== 0) {
                ctx.fillStyle = 'white';
                ctx.font = '10px monospace';
                ctx.fillText(`off: ${this.placementOffset.x},${this.placementOffset.y}`, drawX, drawY - 4);
            }
        }
    }

    ctx.restore();
  }
}

