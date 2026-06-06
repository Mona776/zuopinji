import { CONFIG, COLORS } from './config.js';
import { soundManager } from './sound.js';

export class Player {
  constructor(x, y, color = '#e91e63', id = 1) {
    this.x = x;
    this.y = y;
    this.radius = CONFIG.PLAYER_RADIUS;
    this.id = id;
    
    this.vx = 0;
    this.vy = 0;
    
    this.facingAngle = Math.PI / 2;
    this.walkTimer = 0;
    this.scaleY = 1;
    this.targetScaleY = 1;

    this.heldItem = null;
    
    this.color = color;
    this.skinColor = '#ffe0bd';
    this.onScore = null;
    this.onDelivery = null;
    this.orderManager = null;
    this.foodSprites = null;
    
    // 切菜动画状态
    this.isChopping = false;
    this.choppingTimer = 0;
    
    // 包饺子动画状态
    this.isFolding = false;
    this.foldingTimer = 0;
    
    // 洗碗动画状态
    this.isWashing = false;
    this.washingTimer = 0;
  }

  setFoodSprites(sprites) {
    this.foodSprites = sprites;
  }

  update(input, dt, map) {
    const inputX = input.x;
    const inputY = input.y;
    const hasInput = inputX !== 0 || inputY !== 0;

    if (hasInput) {
      const targetAngle = Math.atan2(inputY, inputX);
      let angleDiff = targetAngle - this.facingAngle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      
      const rotationStep = CONFIG.ROTATION_SPEED * dt;
      if (Math.abs(angleDiff) < rotationStep) {
        this.facingAngle = targetAngle;
      } else {
        this.facingAngle += Math.sign(angleDiff) * rotationStep;
      }
      this.walkTimer += dt * 14;
      // 脚步声 - 配合行走动画节奏
      soundManager.playFootstep();
    } else {
      this.walkTimer = 0;
    }

    if (hasInput) {
      const ax = Math.cos(this.facingAngle) * CONFIG.ACCEL;
      const ay = Math.sin(this.facingAngle) * CONFIG.ACCEL;
      this.vx += ax * dt;
      this.vy += ay * dt;
    } else {
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed > 0) {
        const frictionVal = CONFIG.FRICTION * dt;
        if (speed < frictionVal) {
          this.vx = 0; this.vy = 0;
        } else {
          this.vx -= (this.vx / speed) * frictionVal;
          this.vy -= (this.vy / speed) * frictionVal;
        }
      }
    }

    const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (currentSpeed > CONFIG.MAX_SPEED) {
      const ratio = CONFIG.MAX_SPEED / currentSpeed;
      this.vx *= ratio;
      this.vy *= ratio;
    }

    const nextX = this.x + this.vx * dt;
    if (!map.checkCircleCollision(nextX, this.y, this.radius)) {
      this.x = nextX;
    } else {
      this.vx *= -0.2;
      this.triggerSquash();
    }

    const nextY = this.y + this.vy * dt;
    if (!map.checkCircleCollision(this.x, nextY, this.radius)) {
      this.y = nextY;
    } else {
      this.vy *= -0.2;
      this.triggerSquash();
    }

    this.scaleY += (this.targetScaleY - this.scaleY) * 0.2;
    if (Math.abs(this.scaleY - this.targetScaleY) < 0.01) {
      this.targetScaleY = 1;
    }

    this.handleProcessing(input, dt, map);

    if (input.pickup) {
      this.interact(map);
    }
  }

  handleProcessing(input, dt, map) {
    const station = this.getFacingStation(map);
    
    // Batch washing at sink
    if (station && station.type === 'sink' && input.work && !this.heldItem) {
      if (station.dirtyPlates && station.dirtyPlates.length > 0) {
        station.washProgress = (station.washProgress || 0) + dt;
        
        // 更新洗碗动画状态
        if (!this.isWashing) {
          soundManager.startWash(); // 开始洗碗循环音效
        }
        this.isWashing = true;
        this.washingTimer += dt * 15;
        
        if (station.washProgress >= CONFIG.BATCH_WASH_TIME) {
          // Wash ALL plates at once!
          const plateCount = station.dirtyPlates.length;
          station.dirtyPlates = [];
          station.washProgress = 0;
          this.isWashing = false;
          soundManager.stopWash(); // 停止洗碗循环音效
          soundManager.playSparkle(); // 洗碗完成闪光音效
          
          // Give player a stack of clean plates
          this.heldItem = { type: 'plate_stack', progress: 0, count: plateCount };
        }
        return;
      }
    }
    
    if (station && station.type === 'sink' && (!input.work || this.heldItem)) {
      station.washProgress = 0;
      if (this.isWashing) {
        soundManager.stopWash(); // 停止洗碗循环音效
      }
      this.isWashing = false;
    }
    
    // Mixer auto-processing (produces dough ball)
    if (station && station.type === 'mixer' && station.item) {
      station.mixProgress = (station.mixProgress || 0) + dt;
      if (station.mixProgress >= CONFIG.MIXER_TIME) {
        station.item.type = 'dough';
        station.mixProgress = CONFIG.MIXER_TIME; // Keep at max to show complete
      }
      return;
    }
    
    // Manual processing (chopping only now)
    if (station && station.item && input.work && !this.heldItem) {
      const item = station.item;
      const canProcess = this.canProcessItem(item, station);
      
      if (canProcess) {
        item.progress = (item.progress || 0) + dt;
        const isOpenDumpling = item.type.startsWith('open_');
        const targetTime = isOpenDumpling ? CONFIG.FOLD_TIME : CONFIG.PROCESS_TIME;
        
        // 更新切菜状态（只有在切肉或切菜时）
        if (station.name === 'Chop' && (item.type === 'pork' || item.type === 'cabbage')) {
          this.isChopping = true;
          this.choppingTimer += dt * 25; // 加快动画速度
        }
        
        // 更新包饺子状态
        if (isOpenDumpling) {
          // 每隔一段时间播放揉面音效
          const prevPhase = Math.floor(this.foldingTimer / 3);
          this.isFolding = true;
          this.foldingTimer += dt * 12;
          const newPhase = Math.floor(this.foldingTimer / 3);
          if (newPhase > prevPhase) {
            soundManager.playSquish(); // 包饺子揉捏音效
          }
        }
        
        if (item.progress >= targetTime) {
          this.transformItem(item);
          this.isChopping = false;
          this.isFolding = false;
        }
        return;
      }
    }
    
    // 停止动作时重置状态
    this.isChopping = false;
    this.isFolding = false;
    
    if (station && station.item && (!input.work || this.heldItem)) {
      if (station.type !== 'stove' && station.type !== 'mixer') {
        station.item.progress = 0;
      }
    }
  }

  getFacingStation(map) {
    const interactDist = 25;
    const tx = this.x + Math.cos(this.facingAngle) * interactDist;
    const ty = this.y + Math.sin(this.facingAngle) * interactDist;
    const col = Math.floor(tx / CONFIG.TILE_SIZE);
    const row = Math.floor(ty / CONFIG.TILE_SIZE);
    return map.getStationAt(row, col);
  }

  canProcessItem(item, station) {
    if (item.type === 'pork' || item.type === 'cabbage') {
      return station.name === 'Chop';
    }
    // 三种未包的饺子都可以在 counter 或 Assembly 台上包
    if (item.type === 'open_pork_dumpling' || item.type === 'open_veggie_dumpling' || item.type === 'open_combo_dumpling') {
      return station.type === 'counter' || station.name === 'Assembly';
    }
    return false;
  }

  transformItem(item) {
    item.progress = 0;
    if (item.type === 'pork') item.type = 'minced_pork';
    else if (item.type === 'cabbage') item.type = 'chopped_cabbage';
    // 包饺子：open_xxx_dumpling -> raw_xxx_dumpling
    else if (item.type === 'open_pork_dumpling') item.type = 'raw_pork_dumpling';
    else if (item.type === 'open_veggie_dumpling') item.type = 'raw_veggie_dumpling';
    else if (item.type === 'open_combo_dumpling') item.type = 'raw_combo_dumpling';
  }

  interact(map) {
    const station = this.getFacingStation(map);
    if (!station) return;

    if (!this.heldItem) {
      if (['flour', 'meat', 'veggie'].includes(station.type)) {
        let type = station.type;
        if (type === 'flour') type = 'flour_raw';
        if (type === 'meat') type = 'pork';
        if (type === 'veggie') type = 'cabbage';
        this.heldItem = { type, progress: 0 };
        soundManager.playPop(true); // 拿取音效 ↑
      } else if (station.type === 'plate') {
        if (station.cleanPlates > 0) {
          station.cleanPlates--;
          this.heldItem = { type: 'plate', progress: 0 };
          soundManager.playPop(true); // 拿取音效 ↑
        }
      } else if (station.type === 'dirty_return' && station.item && station.item.type === 'dirty_plate') {
        // Pick up ENTIRE stack
        this.heldItem = { type: 'dirty_plate_stack', progress: 0, count: station.item.stackCount };
        station.item = null;
        soundManager.playPop(true); // 拿取音效 ↑
      } else if (station.type === 'mixer' && station.item) {
        // Pick up from mixer
        if (station.item.type === 'dough') {
          this.heldItem = station.item;
          station.item = null;
          station.mixProgress = 0;
          soundManager.playPop(true); // 拿取音效 ↑
        }
      } else if (station.item) {
        // Special Stove Pickup logic
        if (station.type === 'stove') {
           if (station.item.state === 'burnt') {
             // Bare hands can pick up burnt food
             this.heldItem = { type: 'burnt_trash', progress: 0 };
             station.item = null;
             soundManager.playPop(true); // 拿取音效 ↑
           }
           // Cooked food cannot be picked up with bare hands (needs plate)
        } else {
          this.heldItem = station.item;
          station.item = null;
          soundManager.playPop(true); // 拿取音效 ↑
        }
      }
    } else {
      // Drop logic
      if (station.type === 'trash') {
        this.heldItem = null;
        soundManager.playPop(false); // 放下音效 ↓
      } else if (station.type === 'serving' && this.heldItem.type.startsWith('plated_')) {
        // 接受所有装盘饺子类型：plated_pork_dumpling, plated_veggie_dumpling, plated_combo_dumpling
        if (this.orderManager) {
          const result = this.orderManager.tryDeliverItem(this.heldItem.type, this.heldItem.recipeType);
          if (result.success) {
            this.heldItem = null;
            if (this.onScore) this.onScore(result.score);
            if (this.onDelivery) this.onDelivery();
          }
        } else {
          this.heldItem = null;
          if (this.onScore) this.onScore(CONFIG.SCORE_PER_ORDER);
        }
      } else if (station.type === 'mixer' && this.heldItem.type === 'flour_raw') {
        // Put flour into mixer
        if (!station.item) {
          station.item = { type: 'flour_raw', progress: 0 };
          station.mixProgress = 0;
          this.heldItem = null;
          soundManager.playPop(false); // 放下音效 ↓
        }
      } else if (station.type === 'sink' && this.heldItem.type === 'dirty_plate_stack') {
        // Drop entire stack into sink
        if (!station.dirtyPlates) station.dirtyPlates = [];
        for (let i = 0; i < this.heldItem.count; i++) {
          station.dirtyPlates.push({ type: 'dirty_plate' });
        }
        this.heldItem = null;
        soundManager.playPop(false); // 放下音效 ↓
      } else if (station.type === 'counter' && this.heldItem.type === 'plate_stack') {
        // Deposit clean plates one by one on counter
        if (!station.item) {
          station.item = { type: 'plate', progress: 0 };
          this.heldItem.count--;
          if (this.heldItem.count <= 0) {
            this.heldItem = null;
          }
        }
      } else if (station.type === 'plate' && this.heldItem.type === 'plate_stack') {
        // Return clean plates to rack
        station.cleanPlates = Math.min(station.cleanPlates + this.heldItem.count, CONFIG.MAX_CLEAN_PLATES);
        this.heldItem = null;
        soundManager.playSparkle(); // 盘子放回架子的清脆声
      } else if (station.type === 'stove') {
        // Handle stove interaction - accept all 3 types of raw dumplings
        const rawTypes = ['raw_pork_dumpling', 'raw_veggie_dumpling', 'raw_combo_dumpling'];
        if (!station.item && rawTypes.includes(this.heldItem.type)) {
          station.item = { 
            type: 'cooking_dumpling', 
            progress: 0, 
            state: 'boiling',
            recipeType: this.heldItem.type.replace('raw_', '')
          };
          this.heldItem = null;
          soundManager.playPop(false); // 放下生饺子音效 ↓
        } else if (station.item && station.item.state === 'cooked' && this.heldItem.type === 'plate') {
          // Plating - use specific plated type based on recipe
          const recipeType = station.item.recipeType;
          let platedType = 'plated_pork_dumpling'; // 默认
          if (recipeType === 'veggie_dumpling') {
            platedType = 'plated_veggie_dumpling';
          } else if (recipeType === 'combo_dumpling') {
            platedType = 'plated_combo_dumpling';
          }
          this.heldItem = { 
            type: platedType, 
            progress: 0,
            recipeType: recipeType
          };
          station.item = null;
          soundManager.playPlating(); // 装盘音效 啪叽
        }
      } else if (station.item) {
        this.tryMerge(station);
      } else if (station.type === 'counter' || station.type === 'serving' || station.type === 'dirty_return') {
        // Special: Dough ball placed on counter becomes wrapper
        if (this.heldItem.type === 'dough' && (station.type === 'counter' || station.name === 'Assembly')) {
          station.item = { type: 'wrapper', progress: 0 };
          this.heldItem = null;
          soundManager.playPop(false); // 放下音效 ↓
        } else {
          station.item = this.heldItem;
          this.heldItem = null;
          soundManager.playPop(false); // 放下音效 ↓
        }
      }
    }
  }

  tryMerge(station) {
    const held = this.heldItem.type;
    const target = station.item.type;

    // Recipe A: Wrapper + Pork = Open Pork Dumpling（未包的饺子）
    if (target === 'wrapper' && held === 'minced_pork') {
      station.item = { type: 'open_pork_dumpling', progress: 0, filling: 'minced_pork' };
      this.heldItem = null;
      soundManager.playSquish(); // 放馅料音效
      return;
    }

    // Recipe B: Wrapper + Cabbage = Open Veggie Dumpling
    if (target === 'wrapper' && held === 'chopped_cabbage') {
      station.item = { type: 'open_veggie_dumpling', progress: 0, filling: 'chopped_cabbage' };
      this.heldItem = null;
      soundManager.playSquish(); // 放馅料音效
      return;
    }

    // Recipe C Part 1: Open Pork Dumpling + Cabbage = Open Combo Dumpling
    if (target === 'open_pork_dumpling' && held === 'chopped_cabbage') {
      station.item = { type: 'open_combo_dumpling', progress: 0, filling: 'combo' };
      this.heldItem = null;
      soundManager.playSquish(); // 添加馅料音效
      return;
    }

    // Recipe C Part 2: Open Veggie Dumpling + Pork = Open Combo Dumpling
    if (target === 'open_veggie_dumpling' && held === 'minced_pork') {
      station.item = { type: 'open_combo_dumpling', progress: 0, filling: 'combo' };
      this.heldItem = null;
      soundManager.playSquish(); // 添加馅料音效
      return;
    }
  }

  triggerSquash() {
    if (this.targetScaleY === 1) this.targetScaleY = 0.85;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    let angle = this.facingAngle;
    while (angle < 0) angle += Math.PI * 2;
    while (angle >= Math.PI * 2) angle -= Math.PI * 2;

    let dir = 'down';
    if (angle >= Math.PI * 0.25 && angle < Math.PI * 0.75) dir = 'down';
    else if (angle >= Math.PI * 0.75 && angle < Math.PI * 1.25) dir = 'left';
    else if (angle >= Math.PI * 1.25 && angle < Math.PI * 1.75) dir = 'up';
    else dir = 'right';

    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    const isMoving = speed > 10;
    let bob = isMoving ? Math.sin(this.walkTimer) * 4 : 0;
    const swing = isMoving ? Math.sin(this.walkTimer) * 8 : 0;
    
    // 工作时的身体动画
    let workBob = 0;
    let workRotation = 0;
    if (this.isChopping) {
      workBob = Math.sin(this.choppingTimer) * 3; // 身体随切菜上下晃动
      workRotation = Math.sin(this.choppingTimer) * 0.08; // 身体轻微左右摆动
      bob = workBob;
    } else if (this.isFolding) {
      // 包饺子时身体轻微前倾晃动
      workBob = Math.sin(this.foldingTimer) * 2;
      workRotation = Math.sin(this.foldingTimer * 0.5) * 0.05;
      bob = workBob;
    } else if (this.isWashing) {
      // 洗碗时身体左右摇摆
      workBob = Math.sin(this.washingTimer * 2) * 2;
      workRotation = Math.sin(this.washingTimer) * 0.1;
      bob = workBob;
    }
    const chopRotation = workRotation;

    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(0, this.radius - 2, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(0, bob);
    ctx.rotate(chopRotation); // 切菜时身体摆动
    ctx.scale(1 / this.scaleY, this.scaleY);

    if (dir === 'up') this.drawHands(ctx, swing);

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-this.radius, 0); ctx.lineTo(this.radius, 0); ctx.stroke();

    this.drawFace(ctx, dir);
    this.drawHat(ctx, dir);

    if (dir !== 'up') this.drawHands(ctx, swing);

    // 只有不在切菜时才显示手持物品
    if (!this.isChopping && this.heldItem) {
      this.drawItem(ctx, this.heldItem.type, 0, -35);
    }

    ctx.restore();
  }

  drawFace(ctx, dir) {
    const headRadius = this.radius * 0.8;
    ctx.fillStyle = this.skinColor;
    ctx.beginPath(); ctx.arc(0, -5, headRadius, 0, Math.PI * 2); ctx.fill();

    if (dir !== 'up') {
      ctx.fillStyle = '#333';
      let eyeY = -5;
      const eyeSpacing = 6;
      if (dir === 'down') {
        eyeY = -2;
        ctx.fillRect(-eyeSpacing - 1, eyeY, 3, 3);
        ctx.fillRect(eyeSpacing - 2, eyeY, 3, 3);
      } else if (dir === 'left') {
        ctx.fillRect(-headRadius + 2, eyeY, 3, 3);
        ctx.fillRect(-headRadius + 8, eyeY, 3, 3);
      } else if (dir === 'right') {
        ctx.fillRect(headRadius - 5, eyeY, 3, 3);
        ctx.fillRect(headRadius - 11, eyeY, 3, 3);
      }
    }
  }

  drawHat(ctx, dir) {
    ctx.fillStyle = '#ffffff';
    const hatBaseY = -18;
    ctx.fillRect(-10, hatBaseY, 20, 10);
    ctx.beginPath(); ctx.arc(0, hatBaseY - 2, 12, 0, Math.PI * 2); ctx.fill();
  }

  drawHands(ctx, swing) {
    ctx.fillStyle = this.skinColor;
    const handRadius = 5;
    const handY = this.heldItem ? -15 : 5;
    const handX = 14;

    if (this.isChopping) {
      // 切菜时：左手拿刀挥动，右手扶着食材
      // chopPhase: 0 = 刀举起（水平），1 = 刀砍下（垂直）
      const chopPhase = (Math.sin(this.choppingTimer) + 1) / 2; // 0-1
      const chopY = chopPhase * 15; // 手的上下位置
      // 刀的角度：从水平(0)到垂直(-π/2)之间变化
      const knifeAngle = -chopPhase * (Math.PI / 2.2);
      
      // 左手拿刀
      const knifeHandX = -handX + 2;
      const knifeHandY = -5 + chopY;
      
      ctx.save();
      ctx.translate(knifeHandX, knifeHandY);
      
      // 绘制握刀的手
      ctx.fillStyle = this.skinColor;
      ctx.beginPath();
      ctx.arc(0, 0, handRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // 刀朝向台面（右边），旋转使其在垂直和水平间变化
      ctx.rotate(knifeAngle);
      
      // 绘制刀柄
      ctx.fillStyle = '#5D4037';
      ctx.fillRect(2, -3, 8, 6);
      
      // 绘制刀刃（朝向右边/台面方向）
      ctx.fillStyle = '#CFD8DC';
      ctx.beginPath();
      ctx.moveTo(10, -4);
      ctx.lineTo(10, 4);
      ctx.lineTo(28, 3);
      ctx.lineTo(28, -3);
      ctx.closePath();
      ctx.fill();
      
      // 刀刃高光
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillRect(12, -1, 14, 2);
      
      // 刀刃底部边缘（锋利的边）
      ctx.fillStyle = '#90A4AE';
      ctx.fillRect(10, 3, 18, 1);
      
      ctx.restore();
      
      // 右手扶食材（轻微跟随节奏）
      const supportY = 10 + Math.sin(this.choppingTimer + 0.5) * 3;
      ctx.fillStyle = this.skinColor;
      ctx.beginPath();
      ctx.arc(handX - 2, supportY, handRadius, 0, Math.PI * 2);
      ctx.fill();
      
    } else if (this.isFolding) {
      // 包饺子动画：双手在身前做揉捏动作
      const foldPhase = Math.sin(this.foldingTimer);
      const handSpread = 8 + foldPhase * 4; // 手的间距变化
      const handYPos = 5 + Math.abs(foldPhase) * 3;
      
      // 左手
      ctx.fillStyle = this.skinColor;
      ctx.beginPath();
      ctx.arc(-handSpread, handYPos, handRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // 右手
      ctx.beginPath();
      ctx.arc(handSpread, handYPos, handRadius, 0, Math.PI * 2);
      ctx.fill();
      
    } else if (this.isWashing) {
      // 洗碗动画：双手在水槽里搓洗
      const washPhase = Math.sin(this.washingTimer);
      const scrubX = washPhase * 6; // 左右搓动
      const scrubY = Math.abs(Math.sin(this.washingTimer * 2)) * 3;
      
      // 双手一起搓动
      ctx.fillStyle = this.skinColor;
      ctx.beginPath();
      ctx.arc(-6 + scrubX, 10 + scrubY, handRadius, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(6 + scrubX, 10 + scrubY, handRadius, 0, Math.PI * 2);
      ctx.fill();
      
    } else if (this.heldItem) {
      ctx.beginPath(); ctx.arc(-10, handY, handRadius, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(10, handY, handRadius, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(-handX, handY + swing, handRadius, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(handX, handY - swing, handRadius, 0, Math.PI * 2); ctx.fill();
    }
  }

  drawItem(ctx, type, x, y) {
    ctx.save();
    ctx.translate(x, y);
    
    // 根据类型确定尺寸
    const getItemSize = (itemType) => {
      // 装盘的饺子 - 最大
      if (itemType.startsWith('plated_')) return 40;
      // 烹饪中的饺子（锅）
      if (itemType === 'cooking_dumpling') return 38;
      // 生饺子 - 大幅度变小
      if (itemType.startsWith('raw_')) return 24;
      // 原材料（生肉、蔬菜）- 保持较大
      if (itemType === 'pork' || itemType === 'cabbage') return 32;
      // 面团 - 变小
      if (itemType === 'dough') return 28;
      // 饺子皮
      if (itemType === 'wrapper') return 38;
      // 切碎的肉、切碎的蔬菜 - 小于饺子皮
      if (itemType === 'minced_pork' || itemType === 'chopped_cabbage') return 22;
      // 盘子
      if (itemType === 'plate' || itemType === 'dirty_plate') return 30;
      // 默认
      return 28;
    };
    
    const size = getItemSize(type);
    
    // 检查是否有对应的素材
    const sprite = this.foodSprites && this.foodSprites[type];
    const hasSprite = sprite && sprite.complete && sprite.naturalWidth > 0;
    
    // 绘制阴影 - 根据尺寸调整，位置贴近底部
    const shadowSize = size * 0.4;
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); 
    ctx.ellipse(0, size/2 - 4, shadowSize, shadowSize * 0.4, 0, 0, Math.PI * 2); 
    ctx.fill();
    
    // 特殊处理：open_xxx_dumpling 需要分层绘制（皮+馅）
    if (type === 'open_pork_dumpling' || type === 'open_veggie_dumpling' || type === 'open_combo_dumpling') {
      this.drawOpenDumpling(ctx, type);
    } 
    // 特殊处理：plate_stack 和 dirty_plate_stack 使用基础素材多次绘制
    else if (type === 'plate_stack' || type === 'dirty_plate_stack') {
      const baseType = (type === 'plate_stack') ? 'plate' : 'dirty_plate';
      const baseSprite = this.foodSprites && this.foodSprites[baseType];
      const hasBaseSprite = baseSprite && baseSprite.complete && baseSprite.naturalWidth > 0;
      
      // 获取实际的盘子数量
      const actualCount = (this.heldItem && this.heldItem.count) ? Math.min(this.heldItem.count, 6) : 3;
      
      if (hasBaseSprite) {
        const stackSize = 30;
        // 根据实际数量绘制堆叠效果
        for (let i = actualCount - 1; i >= 0; i--) {
          ctx.drawImage(baseSprite, -stackSize/2, -stackSize/2 + 2 - i * 4, stackSize, stackSize);
        }
      } else {
        this.drawItemFallback(ctx, type);
      }
    }
    else if (hasSprite) {
      // 使用素材绘制 - 位置贴近底部消除浮空感
      ctx.drawImage(sprite, -size/2, -size/2 + 6, size, size);
    } else {
      // 后备：程序绘制
      this.drawItemFallback(ctx, type);
    }
    
    ctx.restore();
  }

  // 绘制未包的饺子（皮+馅分层）
  drawOpenDumpling(ctx, type) {
    const wrapperSprite = this.foodSprites && this.foodSprites['wrapper'];
    const hasWrapperSprite = wrapperSprite && wrapperSprite.complete && wrapperSprite.naturalWidth > 0;
    
    // 确定馅料类型
    let fillingType = 'minced_pork';
    if (type === 'open_veggie_dumpling') {
      fillingType = 'chopped_cabbage';
    } else if (type === 'open_combo_dumpling') {
      fillingType = 'minced_pork';
    }
    
    const fillingSprite = this.foodSprites && this.foodSprites[fillingType];
    const hasFillingSprite = fillingSprite && fillingSprite.complete && fillingSprite.naturalWidth > 0;
    
    // 第一层：饺子皮（大幅增大）
    const wrapperSize = 40;
    if (hasWrapperSprite) {
      ctx.drawImage(wrapperSprite, -wrapperSize/2, -wrapperSize/2 + 6, wrapperSize, wrapperSize);
    } else {
      ctx.fillStyle = '#FAFAFA';
      ctx.beginPath();
      ctx.arc(0, 6, 18, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 第二层：馅料（明显小于饺子皮）
    const fillingSize = 16;
    if (type === 'open_combo_dumpling') {
      const meatSprite = this.foodSprites && this.foodSprites['minced_pork'];
      const veggieSprite = this.foodSprites && this.foodSprites['chopped_cabbage'];
      const hasMeat = meatSprite && meatSprite.complete;
      const hasVeggie = veggieSprite && veggieSprite.complete;
      
      if (hasMeat && hasVeggie) {
        ctx.drawImage(meatSprite, -fillingSize/2 - 2, -fillingSize/2 + 4, fillingSize * 0.6, fillingSize * 0.6);
        ctx.drawImage(veggieSprite, 1, -fillingSize/2 + 4, fillingSize * 0.6, fillingSize * 0.6);
      } else {
        ctx.fillStyle = COLORS.MEAT_PROCESSED;
        ctx.beginPath();
        ctx.arc(-3, 4, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLORS.VEGGIE_PROCESSED;
        ctx.beginPath();
        ctx.arc(3, 4, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (hasFillingSprite) {
      ctx.drawImage(fillingSprite, -fillingSize/2, -fillingSize/2 + 4, fillingSize, fillingSize);
    } else {
      const fillingColor = (type === 'open_pork_dumpling') ? COLORS.MEAT_PROCESSED : COLORS.VEGGIE_PROCESSED;
      ctx.fillStyle = fillingColor;
      ctx.beginPath();
      ctx.arc(0, 4, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 程序绘制后备方法（用于没有素材的类型）
  drawItemFallback(ctx, type) {
    let color = '#ccc';
    let label = '';

    switch(type) {
      case 'pork': color = COLORS.MEAT; label = 'Pork'; break;
      case 'minced_pork': color = COLORS.MEAT_PROCESSED; label = 'Minced'; break;
      case 'cabbage': color = COLORS.VEGGIE; label = 'Cabbage'; break;
      case 'chopped_cabbage': color = COLORS.VEGGIE_PROCESSED; label = 'Chopped'; break;
      case 'flour_raw': color = '#ffffff'; label = 'Flour'; break;
      case 'dough': color = COLORS.DOUGH; label = 'Dough'; break;
      case 'wrapper': color = COLORS.WRAPPER; label = 'Wrapper'; break;
      case 'raw_pork_dumpling': color = COLORS.DUMPLING_RAW; label = 'Pork'; break;
      case 'raw_veggie_dumpling': color = '#c8e6c9'; label = 'Veggie'; break;
      case 'raw_combo_dumpling': color = '#ffecb3'; label = 'Combo'; break;
      case 'plate': color = '#eee'; label = 'Plate'; break;
      case 'plate_stack': color = '#eee'; label = 'Clean'; break;
      case 'dirty_plate': color = COLORS.DIRTY; label = 'Dirty'; break;
      case 'dirty_plate_stack': color = COLORS.DIRTY; label = 'Dirty'; break;
      case 'cooking_dumpling': color = COLORS.DUMPLING_RAW; label = 'Pot'; break;
      case 'plated_dumpling': color = '#eee'; label = 'Plated'; break;
      case 'burnt_trash': color = COLORS.BURNT; label = 'Burnt'; break;
    }

    ctx.fillStyle = color;
    if (type === 'plate' || type === 'plated_dumpling' || type === 'dirty_plate' || type === 'plate_stack' || type === 'dirty_plate_stack') {
      let stackCount = 1;
      if (type === 'plate_stack' || type === 'dirty_plate_stack') {
        stackCount = (this.heldItem && this.heldItem.count) ? Math.min(this.heldItem.count, 6) : 3;
      }
      for (let i = 0; i < stackCount; i++) {
        ctx.beginPath(); 
        ctx.arc(0, -i * 3, 12, 0, Math.PI * 2); 
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.stroke();
      }
      
      if (type === 'plated_dumpling') {
        ctx.fillStyle = COLORS.DUMPLING_COOKED;
        ctx.beginPath(); ctx.arc(0, -2, 8, Math.PI, 0); ctx.fill();
      } else if (type === 'dirty_plate' || type === 'dirty_plate_stack') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath(); ctx.arc(-4, -2, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(3, 1, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(1, -4, 2, 0, Math.PI * 2); ctx.fill();
      }
    } else if (type === 'raw_pork_dumpling' || type === 'raw_veggie_dumpling' || type === 'raw_combo_dumpling' || type === 'cooking_dumpling') {
      ctx.beginPath(); ctx.arc(0, 0, 10, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.stroke();
    } else if (type === 'burnt_trash') {
       ctx.beginPath(); ctx.roundRect(-8, -5, 16, 10, 2); ctx.fill();
    } else {
      ctx.beginPath(); ctx.roundRect(-10, -10, 20, 15, 4); ctx.fill();
      if (type.includes('minced') || type.includes('chopped')) {
         ctx.fillStyle = 'rgba(0,0,0,0.1)';
         for(let i=0; i<3; i++) ctx.fillRect(-6 + i*5, -4, 2, 2);
      }
    }

    if (label) {
      ctx.fillStyle = 'black';
      ctx.font = 'bold 8px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(label, 0, 2);
    }
  }
}
