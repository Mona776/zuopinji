class Unit {
    constructor(x, y, size, emoji, speed, team, hp, damage, range, attackCooldown, kbCount, xpValue = 0) {
      this.x = x;
      this.y = y;
      this.size = size;
      this.emoji = emoji;
      this.speed = speed;
      this.team = team; // 'player' or 'enemy'
      
      // Combat stats
      this.maxHP = hp;
      this.hp = hp;
      this.damage = damage;
      this.range = range;
      this.attackCooldown = attackCooldown;
      this.currentCooldown = 0;
      
      // XP system
      this.xpValue = xpValue; // XP granted when killed
      
      // Knockback system
      this.kbCount = kbCount;
      this.kbThresholds = [0.66, 0.33]; // 66% and 33% HP thresholds
      this.kbTriggered = [false, false]; // Track which thresholds have been triggered
      this.isInvulnerable = false;
      this.knockbackDistance = 50;
      this.knockbackSpeed = 5;
      this.knockbackRemaining = 0;
      
      // State machine
      this.state = 'MOVING'; // 'MOVING', 'ATTACKING', or 'KNOCKBACK'
      this.target = null;
      
      // Visual feedback
      this.damageFlashTimer = 0;
      
      // Unit type for counter system
      this.unitType = null;  // Will be set by spawn methods

      // Celebration state
      this.celebrationTimer = 0;
      this.jumpOffset = 0;

      // --- 机制型属性 ---
      this.hitShield = 0;      // 次数护盾 (蟹)
      this.isExplosive = false; // 是否自爆 (蜂)
      this.healPower = 0;      // 治疗量 (兔)
      this.healTimer = 0;      // 治疗计时器

      // --- 视觉纵深属性 ---
      // 随机分配一个极小的 Y 轴偏移 [-6, 6]，仅用于渲染，避免“飞”的感觉
      this.zOffset = (Math.random() - 0.5) * 12;
    }
  
  // 计算克制伤害加成（包含弱点突破 buff）
  getCounterDamageMultiplier(target) {
    if (!this.unitType || !target.unitType) return 1.0;
    
    let baseCounter = 1.0;
    
    // --- 玩家单位克制逻辑 ---
    if (this.team === 'player') {
      // 1. 刺客猫 -> 脆皮/高速单位 (狗、蛇)
      if (this.unitType === 'assassin' && (target.unitType === 'dog' || target.unitType === 'snake')) {
        baseCounter = 1.4;
      }
      // 2. 蜥蜴猫 -> 远程/重型单位 (大象、河马)
      else if (this.unitType === 'lizard' && (target.unitType === 'elephant' || target.unitType === 'hippo')) {
        baseCounter = 1.3;
      }
      // 3. 坦克猫 -> 重型单位 (河马、大象)
      else if (this.unitType === 'tank' && (target.unitType === 'hippo' || target.unitType === 'elephant')) {
        baseCounter = 1.2;
      }
      // 4. 巨人猫 -> 中小型单位 (狗、蛇、河马)
      else if (this.unitType === 'titan' && target.unitType !== 'elephant') {
        baseCounter = 1.2;
      }
      // 5. 基础猫 -> 基础敌人 (狗、蛇)
      else if (this.unitType === 'basic' && (target.unitType === 'dog' || target.unitType === 'snake')) {
        baseCounter = 1.2;
      }
    }
    
    // --- 敌人单位反制逻辑 ---
    else {
      // 大象对近战单位有压制
      if (this.unitType === 'elephant' && (target.unitType === 'basic' || target.unitType === 'tank' || target.unitType === 'assassin')) {
        baseCounter = 1.2;
      }
    }
    
    // 应用弱点突破 buff（如果存在）
    const weaknessBonus = this.currentCounterMultiplierBonus || 0;
    const finalCounter = baseCounter + (baseCounter - 1) * weaknessBonus;
    
    return Math.max(1.0, finalCounter);
  }
  
  update(enemyBase, playerBase, allUnits, gameSpeed = 1, damageMultiplier = 1, spawnProjectile = null, 
         atkSpeedMultiplier = 1, moveSpeedMultiplier = 1, defenseMultiplier = 1, windForce = 0) {
    // Store dynamic multipliers for use in attack/move/takeDamage
    this.currentDamageMultiplier = damageMultiplier;
    this.currentAtkSpeedMultiplier = atkSpeedMultiplier;
    this.currentMoveSpeedMultiplier = moveSpeedMultiplier;
    this.currentDefenseMultiplier = defenseMultiplier;
    this.currentWindForce = windForce;
    this.allUnitsRef = allUnits; // 存储引用用于 AOE 等机制
    
    // Update celebration
    if (this.celebrationTimer > 0) {
      this.celebrationTimer -= gameSpeed;
      this.jumpOffset = Math.abs(Math.sin(this.celebrationTimer * 0.2)) * 15;
    } else {
      this.jumpOffset = 0;
    }
    
    // Update damage flash timer
    if (this.damageFlashTimer > 0) {
      this.damageFlashTimer -= gameSpeed;
    }

    // 眩晕/静止计时器
    if (this.stunTimer > 0) {
      this.stunTimer -= gameSpeed;
      return; // 眩晕中不执行任何动作
    }
    
    // 工程师光环机制：每 2 秒 (120帧) 修理附近友军或缩短召唤 CD
    if (this.unitType === 'engineer') {
      this.engineerTimer = (this.engineerTimer || 0) + gameSpeed;
      if (this.engineerTimer >= 120) {
        this.engineerTimer = 0;
        // 寻找附近受伤友军
        allUnits.forEach(u => {
          if (u.team === this.team && u.hp < u.maxHP && Math.abs(u.x - this.x) < 100) {
            u.hp = Math.min(u.maxHP, u.hp + 20);
          }
        });
      }
    }

    // --- 医疗兔治疗机制 ---
    if (this.healPower > 0 && !this.isDead()) {
      this.healTimer = (this.healTimer || 0) + gameSpeed;
      if (this.healTimer >= 90) { // 每 1.5 秒治疗一次
        this.healTimer = 0;
        // 寻找范围内受伤最重的友军进行精准治疗（AI 优化）
        let targets = allUnits.filter(u => 
          u.team === this.team && u !== this && u.hp < u.maxHP && Math.abs(u.x - this.x) < 300
        );
        
        if (targets.length > 0) {
          // 优先治疗血量百分比最低的单位，或者是高价值单位（大象、河马）
          targets.sort((a, b) => {
            const aPriority = (a.unitType === 'elephant' || a.unitType === 'hippo') ? 0.5 : 1;
            const bPriority = (b.unitType === 'elephant' || b.unitType === 'hippo') ? 0.5 : 1;
            return (a.hp / a.maxHP * aPriority) - (b.hp / b.maxHP * bPriority);
          });
          
          // 治疗前 3 个受伤单位
          targets.slice(0, 3).forEach(u => {
            u.hp = Math.min(u.maxHP, u.hp + this.healPower);
          });
        }
      }
    }

    // --- 自爆蜂检测机制 ---
    if (this.isExplosive && !this.isDead()) {
      // 寻找目标
      this.findTarget(enemyBase, playerBase, allUnits);
      if (this.target) {
        let dist = this.getDistanceToUnit(this.target);
        // 增加自爆预警：距离接近时开始闪烁
        if (dist <= this.range + 40) {
          this.isWarning = true;
          this.warningTimer = (this.warningTimer || 0) + gameSpeed;
          
          // 0.5 秒 (30帧) 预警后爆炸
          if (this.warningTimer >= 30) {
            this.explode(allUnits);
            return;
          }
        } else {
          this.isWarning = false;
          this.warningTimer = 0;
        }
      }
    }
    
    // Handle state
    if (this.state === 'KNOCKBACK') {
      this.handleKnockback(playerBase, enemyBase, gameSpeed);
    } else if (this.state === 'MOVING') {
      this.findTarget(enemyBase, playerBase, allUnits);
      this.move(gameSpeed);
    } else if (this.state === 'ATTACKING') {
      // 实时检查是否有更高优先级的目标（例如攻击基地时出现了敌方单位）
      this.checkForBetterTarget(enemyBase, playerBase, allUnits);
      this.attack(gameSpeed, damageMultiplier, spawnProjectile);
    }
  }

    checkForBetterTarget(enemyBase, playerBase, allUnits) {
      // 如果当前目标已经是单位（且不是基地），则不需要在攻击中途频繁切换，除非是坦克猫逻辑
      // 但为了满足“当有敌方单位在时，优先攻击敌方单位而不是防御塔”，我们需要在目标是基地时进行检查
      if (this.target && this.target.type) { // target.type 存在说明是 Base
        let closestUnit = null;
        let closestDistance = Infinity;
        
        for (let unit of allUnits) {
          if (unit.team !== this.team && unit.hp > 0) {
            const distance = this.getDistanceToUnit(unit);
            if (distance <= this.range && distance < closestDistance) {
              closestDistance = distance;
              closestUnit = unit;
            }
          }
        }
        
        if (closestUnit) {
          this.target = closestUnit;
          // 切换目标时不重置冷却，保持节奏，但确保目标改变
        }
      }
    }
  
    findTarget(enemyBase, playerBase, allUnits) {
      let closestUnit = null;
      let closestDistance = Infinity;
      let closestTank = null;
      let closestTankDistance = Infinity;
      
      // 1. 寻找射程内的敌方单位
      for (let unit of allUnits) {
        if (unit.team !== this.team && unit.hp > 0) {
          const distance = this.getDistanceToUnit(unit);
          
          if (distance <= this.range) {
            // 如果是敌人攻击玩家，优先找坦克猫
            if (this.team === 'enemy' && unit.unitType === 'tank') {
              if (distance < closestTankDistance) {
                closestTankDistance = distance;
                closestTank = unit;
              }
            }
            
            // 记录最近的任意单位
            if (distance < closestDistance) {
              closestDistance = distance;
              closestUnit = unit;
            }
          }
        }
      }
      
      // 2. 确定最终目标
      // 优先级：坦克猫 (仅对敌人有效) > 最近的单位 > 基地
      let finalTarget = null;
      
      if (this.team === 'enemy' && closestTank) {
        finalTarget = closestTank;
      } else if (closestUnit) {
        finalTarget = closestUnit;
      } else {
        // 如果射程内没有单位，检查基地
        const targetBase = this.team === 'player' ? enemyBase : playerBase;
        const distanceToBase = this.getDistanceToBase(targetBase);
        if (distanceToBase <= this.range) {
          finalTarget = targetBase;
        }
      }
      
      // 3. 设置目标和状态
      if (finalTarget) {
        this.target = finalTarget;
        this.state = 'ATTACKING';
        this.currentCooldown = 0;
      }
    }
  
  move(gameSpeed = 1) {
    let effectiveSpeed = this.speed * (this.currentMoveSpeedMultiplier || 1);
    
    // 应用风力 (windForce)
    // 玩家向左走 (x 减少)，风向右吹 (windForce > 0)，则减速
    // 敌人向右走 (x 增加)，风向右吹 (windForce > 0)，则加速
    if (this.team === 'player') {
      effectiveSpeed -= (this.currentWindForce || 0);
      // 确保最低速度阈值，防止卡死
      effectiveSpeed = Math.max(0.05, effectiveSpeed);
      this.x -= effectiveSpeed * gameSpeed;
    } else {
      effectiveSpeed += (this.currentWindForce || 0);
      // 确保最低速度阈值，防止卡死
      effectiveSpeed = Math.max(0.05, effectiveSpeed);
      this.x += effectiveSpeed * gameSpeed;
    }
  }
  
    attack(gameSpeed = 1, damageMultiplier = 1, spawnProjectile = null) {
      // Check if target is still valid
      if (!this.target || (this.target.hp !== undefined && this.target.hp <= 0)) {
        this.target = null;
        this.state = 'MOVING';
        return;
      }
      
      // Check if target is still in range
      let distance;
      if (this.target.type) {
        // Target is a base
        distance = this.getDistanceToBase(this.target);
      } else {
        // Target is a unit
        distance = this.getDistanceToUnit(this.target);
      }
      
      if (distance > this.range) {
        this.target = null;
        this.state = 'MOVING';
        return;
      }
      
      // Cooldown logic（应用攻速加成）
      const effectiveAtkSpeed = gameSpeed * (this.currentAtkSpeedMultiplier || 1);
      if (this.currentCooldown > 0) {
        this.currentCooldown -= effectiveAtkSpeed;
      } else {
        // Deal damage with counter bonus
        const counterMultiplier = this.getCounterDamageMultiplier(this.target);
        // 只有玩家单位受猫薄荷加成
        const finalDamageMultiplier = (this.team === 'player') ? damageMultiplier : 1;
        
        // --- 核心逻辑：特殊职业机制 ---
        let finalDamage = Math.floor(this.damage * counterMultiplier * finalDamageMultiplier);
        
        // 1. 刺客斩杀机制：对生命值低于 30% 的非基地目标造成双倍伤害
        if (this.unitType === 'assassin' && !this.target.type && this.target.hp / this.target.maxHP < 0.3) {
          finalDamage *= 2;
        }

        // 2. 狂战士吸血机制：攻击时回复 10% 造成的伤害
        if (this.unitType === 'berserker') {
          const healAmount = Math.floor(finalDamage * 0.1);
          this.hp = Math.min(this.maxHP, this.hp + healAmount);
        }

        // 3. 萨满控制机制：攻击有 20% 概率使敌人“静止” 1 秒 (60帧)
        if (this.unitType === 'shaman' && !this.target.type && Math.random() < 0.2) {
          this.target.stunTimer = 60;
        }

        // 4. 工程师辅助机制：攻击时（修理）如果目标是友军或基地，则进行修复（暂不实现，目前攻击系统只针对敌军）
        // 工程师目前设定为低伤害占位，后续可在 update 中添加范围光环

        // 核心逻辑：判断是否是远程单位，如果是则生成弹道
        const isRemote = this.unitType === 'lizard' || this.unitType === 'elephant' || this.unitType === 'shaman';
        
        if (isRemote && spawnProjectile) {
          const type = this.unitType === 'lizard' ? 'crystal' : (this.unitType === 'shaman' ? 'magic' : 'rock');
          const projectile = new Projectile(
            this.x + this.size / 2,
            this.y + this.size / 2,
            this.target,
            finalDamage,
            this.team,
            type
          );
          spawnProjectile(projectile);
        } else {
          // 近战单位直接造成伤害
          this.target.takeDamage(finalDamage, this);

          // 狂战士 AOE 机制：对目标周围的小范围敌人也造成 50% 伤害
          if (this.unitType === 'berserker' && this.allUnitsRef) {
            this.allUnitsRef.forEach(u => {
              if (u !== this.target && u.team !== this.team && Math.abs(u.x - this.target.x) < 50) {
                u.takeDamage(Math.floor(finalDamage * 0.5), this);
              }
            });
          }
        }
        
        this.currentCooldown = this.attackCooldown;
      }
    }
  
    handleKnockback(playerBase, enemyBase, gameSpeed = 1) {
      if (this.knockbackRemaining > 0) {
        // Apply knockback movement
        const moveAmount = Math.min(this.knockbackSpeed * gameSpeed, this.knockbackRemaining);
        
        if (this.team === 'player') {
          // Push right (away from enemy)
          this.x += moveAmount;
          // Clamp to not go behind own base
          if (this.x > playerBase.x - 40) {
            this.x = playerBase.x - 40;
          }
        } else {
          // Push left (away from player)
          this.x -= moveAmount;
          // Clamp to not go behind own base
          if (this.x < enemyBase.getRightEdge() + 10) {
            this.x = enemyBase.getRightEdge() + 10;
          }
        }
        
        this.knockbackRemaining -= moveAmount;
      } else {
        // Knockback finished
        this.isInvulnerable = false;
        this.state = 'MOVING';
        this.target = null;
      }
    }
  
    getDistanceToUnit(unit) {
      if (this.team === 'player') {
        // Player units attack from the right, so measure from left edge to enemy's right edge
        return this.x - (unit.x + unit.size);
      } else {
        // Enemy units attack from the left, so measure from right edge to player's left edge
        return unit.x - (this.x + this.size);
      }
    }
  
    getDistanceToBase(base) {
      if (this.team === 'player') {
        // Player units moving left towards enemy base
        return this.x - base.getRightEdge();
      } else {
        // Enemy units moving right towards player base
        return base.getLeftEdge() - (this.x + this.size);
      }
    }
  
  takeDamage(damage, attacker = null) {
    // Check invulnerability
    if (this.isInvulnerable) {
      return;
    }

    // --- 次数护盾机制 ---
    if (this.hitShield > 0) {
      this.hitShield--;
      this.damageFlashTimer = 5;
      if (window.audioManager) window.audioManager.playAttack('normal'); // 护盾打击音效
      return; // 护盾抵消本次伤害
    }
    
    // 应用防御倍率（来自守望者等 buff）
    const effectiveDamage = Math.max(1, Math.floor(damage * (this.currentDefenseMultiplier || 1)));
    
    const oldHP = this.hp;
    this.hp -= effectiveDamage;
    this.damageFlashTimer = 5; // Flash for 5 frames
    
    // 播放打击音效
    if (window.audioManager) {
      if (effectiveDamage > 50) window.audioManager.playAttack('heavy');
      else window.audioManager.playAttack('normal');
    }
    
    // 荆棘反伤（如果有攻击者）
    if (attacker && attacker.hp !== undefined && this.team === 'player') {
      // 巨兽猫自带 30% 反伤，荆棘装甲 Buff 提供额外反伤
      let totalReflect = 0;
      if (this.unitType === 'titan') totalReflect += 0.3;
      // 这里的 reflectDamage 需要通过某种方式获取，或者在 Unit 初始化时存入
      // 暂时只实现巨兽猫自带的反伤
      if (totalReflect > 0) {
        attacker.takeDamage(Math.floor(effectiveDamage * totalReflect));
      }
    }
    
    if (this.hp < 0) {
      this.hp = 0;
    }
    
    // Check knockback thresholds
    for (let i = 0; i < this.kbThresholds.length; i++) {
      const threshold = this.kbThresholds[i] * this.maxHP;
      
      // If we crossed this threshold and haven't triggered it yet
      if (oldHP > threshold && this.hp <= threshold && !this.kbTriggered[i]) {
        this.triggerKnockback();
        this.kbTriggered[i] = true;
        break; // Only trigger one knockback at a time
      }
    }
  }
  
    triggerKnockback() {
      this.state = 'KNOCKBACK';
      this.isInvulnerable = true;
      this.knockbackRemaining = this.knockbackDistance;
      this.target = null;
      
      // 播放击退音效
      if (window.audioManager) window.audioManager.playKnockback();
    }

    // --- 自爆方法 ---
    explode(allUnits) {
      if (this.hp <= 0) return;
      
      const explosionRange = 120;
      const explosionDamage = this.damage * 3.0; // 自爆伤害倍率从 2.5 提升至 3.0，以适配新的 ATK 基准
      
      allUnits.forEach(u => {
        if (u.team !== this.team && u.hp > 0) {
          const dist = Math.abs(u.x - this.x);
          if (dist < explosionRange) {
            u.takeDamage(explosionDamage, this);
          }
        }
      });
      
      this.hp = 0; // 自身死亡
      if (window.audioManager) window.audioManager.playAttack('heavy');
    }
  
    // 静态预览绘制方法，用于商店 UI
    static drawPreview(ctx, unitType, x, y, size, team = 'player') {
      const dummyUnit = {
        unitType: unitType,
        size: size,
        x: x,
        y: y,
        team: team,
        state: 'IDLE',
        allUnitsRef: [],
        hp: 100,
        maxHP: 100,
        damageFlashTimer: 0,
        isInvulnerable: false,
        // 模拟 Unit 的方法
        roundRect: function(ctx, x, y, width, height, radius) {
          if (typeof radius === 'number') {
            radius = {tl: radius, tr: radius, br: radius, bl: radius};
          } else {
            var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
            for (var key in defaultRadius) {
              radius[key] = radius[key] || defaultRadius[key];
            }
          }
          ctx.beginPath();
          ctx.moveTo(x + radius.tl, y);
          ctx.lineTo(x + width - radius.tr, y);
          ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
          ctx.lineTo(x + width, y + height - radius.br);
          ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
          ctx.lineTo(x + radius.bl, y + height);
          ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
          ctx.lineTo(x, y + radius.bl);
          ctx.quadraticCurveTo(x, y, x + radius.tl, y);
          ctx.closePath();
        }
      };

      ctx.save();
      ctx.translate(x + size / 2, y + size / 2);
      
      // 默认面向左
      if (team === 'enemy') {
        ctx.scale(-1, 1);
      }

      // 调用 Unit 原型上的绘制方法
      const unitProto = Unit.prototype;
      switch(unitType) {
        case 'basic': unitProto.drawBasicCat.call(dummyUnit, ctx); break;
        case 'tank': unitProto.drawTankCat.call(dummyUnit, ctx); break;
        case 'lizard': unitProto.drawLizardCat.call(dummyUnit, ctx); break;
        case 'assassin': unitProto.drawAssassin.call(dummyUnit, ctx); break;
        case 'shaman': unitProto.drawShaman.call(dummyUnit, ctx); break;
        case 'berserker': unitProto.drawBerserker.call(dummyUnit, ctx); break;
        case 'engineer': unitProto.drawEngineer.call(dummyUnit, ctx); break;
        case 'titan': unitProto.drawTitan.call(dummyUnit, ctx); break;
        case 'dog': unitProto.drawDog.call(dummyUnit, ctx); break;
        case 'snake': unitProto.drawSnake.call(dummyUnit, ctx); break;
        case 'hippo': unitProto.drawHippo.call(dummyUnit, ctx); break;
        case 'elephant': unitProto.drawElephant.call(dummyUnit, ctx); break;
      }
      
      ctx.restore();
    }

    draw(ctx) {
      ctx.save();
      
      // 设置阴影效果（发光）
      if (this.isInvulnerable) {
        ctx.shadowColor = 'yellow';
        ctx.shadowBlur = 15;
      } else if (this.damageFlashTimer > 0) {
        ctx.shadowColor = 'red';
        ctx.shadowBlur = 15;
      } else if (this.isWarning) {
        // 自爆预警闪烁
        const flash = Math.sin(Date.now() * 0.05) > 0;
        ctx.shadowColor = flash ? 'red' : 'orange';
        ctx.shadowBlur = 20;
        if (flash) ctx.filter = 'brightness(1.5)';
      }

      // 计算行走动画偏移
      let walkOffset = 0;
      let legRotation = 0;
      if (this.state === 'MOVING') {
        const speed = 0.01; // 动画速度
        walkOffset = Math.sin(Date.now() * speed) * 3; // 上下轻微晃动
        legRotation = Math.sin(Date.now() * speed) * 0.2; // 腿部旋转/摆动
      }

      // 将坐标系移至单位中心，并加上行走晃动与纵深偏移
      ctx.translate(this.x + this.size / 2, this.y + this.size / 2 + walkOffset - this.jumpOffset + this.zOffset);
      
      // 应用微弱的透视缩放 (zOffset 越小/越负，离镜头越远，尺寸越小)
      // 范围从 0.98 (远) 到 1.02 (近)，收窄缩放以保持一致性
      const perspectiveScale = 0.98 + ((this.zOffset + 6) / 12) * 0.04;
      ctx.scale(perspectiveScale, perspectiveScale);

      // --- 绘制脚底阴影 ---
      // 阴影固定在脚底，不受跳跃偏移影响
      ctx.save();
      ctx.translate(0, this.size / 2 - walkOffset); // 抵消 walkOffset，让阴影贴地
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(0, 0, this.size * 0.4, this.size * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 核心修改：确保朝向对方防御塔
      // 玩家单位（team === 'player'）从右向左走，默认朝左
      // 敌人单位（team === 'enemy'）从左向右走，默认朝右
      // 在我们的 draw 函数中，默认绘图逻辑是“面向左”的（例如 basicCat 的木剑在左侧，lizardCat 的头在左侧）
      // 所以：
      // 1. 玩家单位：保持 scale(1, 1)，即面向左（对方防御塔）
      // 2. 敌人单位：使用 scale(-1, 1)，将其翻转，使其面向右（对方防御塔）
      if (this.team === 'enemy') {
        ctx.scale(-1, 1); 
      }

      // --- 绘制机制特效 ---
      // 护盾特效 (蟹)
      if (this.hitShield > 0) {
        ctx.save();
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        // 护盾层数文字
        ctx.scale(this.team === 'enemy' ? -1 : 1, 1); // 文字不翻转
        ctx.fillStyle = '#00FFFF';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.hitShield, 0, -this.size * 0.8);
        ctx.restore();
      }

      // 治疗光环 (兔)
      if (this.healPower > 0) {
        ctx.save();
        const pulse = Math.sin(Date.now() * 0.005) * 0.2 + 0.8;
        ctx.fillStyle = `rgba(0, 255, 0, ${0.1 * pulse})`;
        ctx.beginPath();
        ctx.arc(0, 0, 150, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 将腿部摆动参数存入 ctx 属性中，方便在具体的 draw 方法中使用（虽然 Canvas API 不支持直接存，但我们可以传参或利用 state）
      // 为了简单起见，我们直接在具体的 draw 方法中通过 this.state 判断并计算
      
      // 根据单位类型进行过程化绘制
      switch(this.unitType) {
        case 'basic':
          this.drawBasicCat(ctx);
          break;
        case 'tank':
          this.drawTankCat(ctx);
          break;
        case 'lizard':
          this.drawLizardCat(ctx);
          break;
        case 'dog':
          this.drawDog(ctx);
          break;
        case 'snake':
          this.drawSnake(ctx);
          break;
        case 'hippo':
          this.drawHippo(ctx);
          break;
        case 'elephant':
          this.drawElephant(ctx);
          break;
        case 'assassin':
          this.drawAssassin(ctx);
          break;
        case 'shaman':
          this.drawShaman(ctx);
          break;
        case 'berserker':
          this.drawBerserker(ctx);
          break;
        case 'engineer':
          this.drawEngineer(ctx);
          break;
        case 'titan':
          this.drawTitan(ctx);
          break;
        case 'bee':
          this.drawBee(ctx);
          break;
        case 'crab':
          this.drawCrab(ctx);
          break;
        case 'rabbit':
          this.drawRabbit(ctx);
          break;
        default:
          // 兜底绘制：一个简单的圆圈
          ctx.fillStyle = this.team === 'player' ? '#FFF' : '#FF4444';
          ctx.beginPath();
          ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
          ctx.fill();
      }
      
      ctx.restore();
      
      // 绘制血条
      this.drawHealthBar(ctx);
    }

    // --- 过程化绘制方法 ---

    // 1. 基础猫战士 🐱
    drawBasicCat(ctx) {
      const s = this.size;
      const walkCycle = this.state === 'MOVING' ? Math.sin(Date.now() * 0.01) : 0;
      
      // 身体（椭圆）
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.ellipse(0, s * 0.15, s * 0.35, s * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 四肢（简单的线条腿）
      ctx.strokeStyle = '#DDD';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      
      // 前腿 - 增加动画
      const frontLegOffset = walkCycle * s * 0.1;
      ctx.beginPath();
      ctx.moveTo(-s * 0.15 + frontLegOffset, s * 0.4);
      ctx.lineTo(-s * 0.15 + frontLegOffset, s * 0.7);
      ctx.stroke();
      
      // 后腿 - 增加动画（反向）
      const backLegOffset = -walkCycle * s * 0.1;
      ctx.beginPath();
      ctx.moveTo(s * 0.15 + backLegOffset, s * 0.4);
      ctx.lineTo(s * 0.15 + backLegOffset, s * 0.7);
      ctx.stroke();

      // 头部（圆形，缩小）
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.arc(0, -s * 0.15, s * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // ... 脸部细节保持不变 ...
      // 耳朵
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.moveTo(-s * 0.25, -s * 0.25);
      ctx.lineTo(-s * 0.35, -s * 0.5);
      ctx.lineTo(-s * 0.1, -s * 0.35);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(s * 0.25, -s * 0.25);
      ctx.lineTo(s * 0.35, -s * 0.5);
      ctx.lineTo(s * 0.1, -s * 0.35);
      ctx.fill();

      // 眼睛
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(-s * 0.1, -s * 0.15, s * 0.04, 0, Math.PI * 2);
      ctx.arc(s * 0.1, -s * 0.15, s * 0.04, 0, Math.PI * 2);
      ctx.fill();

      // 鼻子和嘴巴
      ctx.fillStyle = '#FFC0CB';
      ctx.beginPath();
      ctx.arc(0, -s * 0.08, s * 0.02, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-s * 0.05, -s * 0.02);
      ctx.quadraticCurveTo(0, s * 0.02, s * 0.05, -s * 0.02);
      ctx.stroke();

      // 手臂（手持木剑）
      const armSwing = this.state === 'MOVING' ? walkCycle * 0.2 : 0;
      ctx.strokeStyle = '#DDD';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-s * 0.3, s * 0.05);
      ctx.lineTo(-s * 0.5 - armSwing * s, s * 0.25 + armSwing * s);
      ctx.stroke();

      // 武器：小木剑
      ctx.save();
      ctx.translate(-s * 0.5, s * 0.25);
      if (this.state === 'ATTACKING') {
        const attackSwing = Math.sin(Date.now() * 0.02) * 0.5;
        ctx.rotate(attackSwing);
      } else if (this.state === 'MOVING') {
        ctx.rotate(walkCycle * 0.2);
      }
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-s * 0.25, -s * 0.2);
      ctx.stroke();
      ctx.restore();
    }

    // 2. 坦克猫 🛡️
    drawTankCat(ctx) {
      const s = this.size;
      
      // 巨大的身体（圆角矩形）
      ctx.fillStyle = '#EEE';
      this.roundRect(ctx, -s * 0.4, -s * 0.5, s * 0.8, s * 1.0, s * 0.1);
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 盾牌
      ctx.fillStyle = '#708090';
      ctx.fillRect(-s * 0.6, -s * 0.4, s * 0.3, s * 0.8);
      ctx.strokeStyle = '#2F4F4F';
      ctx.lineWidth = 2;
      ctx.strokeRect(-s * 0.6, -s * 0.4, s * 0.3, s * 0.8);
      
      // 盾牌上的铆钉
      ctx.fillStyle = '#2F4F4F';
      ctx.beginPath();
      ctx.arc(-s * 0.45, -s * 0.3, 2, 0, Math.PI * 2);
      ctx.arc(-s * 0.45, s * 0.3, 2, 0, Math.PI * 2);
      ctx.fill();

      // 眯眯眼
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-s * 0.1, -s * 0.1); ctx.lineTo(s * 0.1, -s * 0.1);
      ctx.stroke();

      // 简单的嘴巴
      ctx.beginPath();
      ctx.moveTo(-s * 0.05, s * 0.05);
      ctx.lineTo(s * 0.05, s * 0.05);
      ctx.stroke();
    }

    // 3. 蜥蜴猫 🦎
    drawLizardCat(ctx) {
      const s = this.size;
      const walkCycle = this.state === 'MOVING' ? Math.sin(Date.now() * 0.01) : 0;
      
      // 身体（水平椭圆）
      ctx.fillStyle = '#E6E6FA';
      ctx.beginPath();
      ctx.ellipse(0, s * 0.05, s * 0.5, s * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#9370DB';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 四条爬行腿（短小） - 增加动画
      ctx.strokeStyle = '#E6E6FA';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      
      const legMove = walkCycle * s * 0.1;
      
      // 前左腿
      ctx.beginPath();
      ctx.moveTo(-s * 0.35 + legMove, s * 0.15);
      ctx.lineTo(-s * 0.4 + legMove, s * 0.35);
      ctx.stroke();
      // 前右腿
      ctx.beginPath();
      ctx.moveTo(-s * 0.15 - legMove, s * 0.15);
      ctx.lineTo(-s * 0.2 - legMove, s * 0.35);
      ctx.stroke();
      // 后左腿
      ctx.beginPath();
      ctx.moveTo(s * 0.15 + legMove, s * 0.15);
      ctx.lineTo(s * 0.2 + legMove, s * 0.35);
      ctx.stroke();
      // 后右腿
      ctx.beginPath();
      ctx.moveTo(s * 0.35 - legMove, s * 0.15);
      ctx.lineTo(s * 0.4 - legMove, s * 0.35);
      ctx.stroke();

      // 头部（小椭圆）
      ctx.fillStyle = '#E6E6FA';
      ctx.beginPath();
      ctx.ellipse(-s * 0.5, 0, s * 0.2, s * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#9370DB';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 脸部细节
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(-s * 0.55, -s * 0.05, s * 0.03, 0, Math.PI * 2); // 眼睛
      ctx.fill();
      
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-s * 0.65, s * 0.05);
      ctx.lineTo(-s * 0.58, s * 0.05); // 嘴巴
      ctx.stroke();

      // 背部的紫色晶体
      ctx.fillStyle = '#9370DB';
      for (let i = 0; i < 3; i++) {
        const crystalBounce = this.state === 'MOVING' ? Math.sin(Date.now() * 0.01 + i) * 2 : 0;
        ctx.beginPath();
        ctx.moveTo(-s * 0.2 + i * s * 0.25, -s * 0.1 + crystalBounce);
        ctx.lineTo(-s * 0.1 + i * s * 0.25, -s * 0.4 + crystalBounce);
        ctx.lineTo(i * s * 0.25, -s * 0.1 + crystalBounce);
        ctx.fill();
      }

      // 尾巴 - 增加摆动动画
      const tailSwing = this.state === 'MOVING' ? Math.sin(Date.now() * 0.005) * 0.2 : 0;
      ctx.strokeStyle = '#E6E6FA';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(s * 0.5, s * 0.05);
      ctx.quadraticCurveTo(s * 0.8, -s * 0.1 + tailSwing * s, s * 1.0, s * 0.15 + tailSwing * s);
      ctx.stroke();

      // 蓄力特效（如果正在攻击）
      if (this.state === 'ATTACKING') {
        ctx.fillStyle = 'rgba(147, 112, 219, 0.6)';
        ctx.beginPath();
        const pulse = Math.sin(Date.now() / 100) * 5;
        ctx.arc(-s * 0.7, 0, 8 + pulse, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 4. 小狗敌人 🐶
    drawDog(ctx) {
      const s = this.size;
      const walkCycle = this.state === 'MOVING' ? Math.sin(Date.now() * 0.01) : 0;
      ctx.fillStyle = '#FFD700';
      
      // 身体
      ctx.beginPath();
      ctx.ellipse(0, s * 0.05, s * 0.45, s * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 四条腿（短粗） - 增加动画
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      
      const legMove = walkCycle * s * 0.12;
      
      // 前腿
      ctx.beginPath();
      ctx.moveTo(-s * 0.25 + legMove, s * 0.25);
      ctx.lineTo(-s * 0.25 + legMove, s * 0.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-s * 0.05 - legMove, s * 0.25);
      ctx.lineTo(-s * 0.05 - legMove, s * 0.5);
      ctx.stroke();
      // 后腿
      ctx.beginPath();
      ctx.moveTo(s * 0.15 + legMove, s * 0.25);
      ctx.lineTo(s * 0.15 + legMove, s * 0.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(s * 0.35 - legMove, s * 0.25);
      ctx.lineTo(s * 0.35 - legMove, s * 0.5);
      ctx.stroke();

      // 头部 (改为面向左侧)
      ctx.save();
      const headBounce = this.state === 'MOVING' ? Math.abs(walkCycle) * s * 0.05 : 0;
      ctx.translate(-s * 0.25, -s * 0.15 - headBounce);
      
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 脸部细节
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(-s * 0.1, -s * 0.05, s * 0.04, 0, Math.PI * 2); // 眼睛
      ctx.fill();
      
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(-s * 0.25, 0, s * 0.03, 0, Math.PI * 2); // 鼻子
      ctx.fill();
      
      // 耳朵（摆动动画）
      const earSwing = this.state === 'MOVING' ? walkCycle * 0.2 : 0;
      ctx.fillStyle = '#DAA520';
      ctx.beginPath();
      ctx.ellipse(s * 0.2, -s * 0.1, s * 0.1, s * 0.18, -0.5 - earSwing, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 尖刺项圈
      ctx.strokeStyle = '#FF4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(-s * 0.15, 0, s * 0.22, Math.PI/2, -Math.PI/2);
      ctx.stroke();
    }

    // 5. 蛇 🐍
    drawSnake(ctx) {
      const s = this.size;
      ctx.strokeStyle = '#32CD32';
      ctx.lineWidth = s * 0.3;
      ctx.lineCap = 'round';
      
      // S型身体
      ctx.beginPath();
      const offset = Math.sin(Date.now() / 50) * 10;
      ctx.moveTo(s * 0.5, offset);
      ctx.bezierCurveTo(s * 0.2, -s + offset, -s * 0.2, s + offset, -s * 0.5, offset);
      ctx.stroke();
      
      // 眼睛
      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.arc(-s * 0.4, offset - 2, 2, 0, Math.PI * 2);
      ctx.fill();

      // 舌头 (信子)
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-s * 0.6, offset);
      ctx.lineTo(-s * 0.75, offset - 2);
      ctx.moveTo(-s * 0.6, offset);
      ctx.lineTo(-s * 0.75, offset + 2);
      ctx.stroke();
    }

    // 6. 河马 🦛
    drawHippo(ctx) {
      const s = this.size;
      const walkCycle = this.state === 'MOVING' ? Math.sin(Date.now() * 0.008) : 0;
      
      // 巨大的灰色身体
      ctx.fillStyle = '#808080';
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.1, s * 0.65, s * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 四条粗壮的柱状腿 - 增加动画
      ctx.fillStyle = '#808080';
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1.5;
      
      const legMove = walkCycle * s * 0.08;
      
      // 前腿
      ctx.fillRect(-s * 0.45 + legMove, s * 0.25, s * 0.15, s * 0.35);
      ctx.strokeRect(-s * 0.45 + legMove, s * 0.25, s * 0.15, s * 0.35);
      ctx.fillRect(-s * 0.15 - legMove, s * 0.25, s * 0.15, s * 0.35);
      ctx.strokeRect(-s * 0.15 - legMove, s * 0.25, s * 0.15, s * 0.35);
      // 后腿
      ctx.fillRect(s * 0.15 + legMove, s * 0.25, s * 0.15, s * 0.35);
      ctx.strokeRect(s * 0.15 + legMove, s * 0.25, s * 0.15, s * 0.35);
      ctx.fillRect(s * 0.45 - legMove, s * 0.25, s * 0.15, s * 0.35);
      ctx.strokeRect(s * 0.45 - legMove, s * 0.25, s * 0.15, s * 0.35);

      // 头部区域 (改为面向左侧)
      ctx.save();
      const headNod = this.state === 'MOVING' ? walkCycle * 0.05 : 0;
      ctx.translate(-s * 0.4, -s * 0.15);
      ctx.rotate(-headNod);
      
      ctx.fillStyle = '#808080';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 脸部细节
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(-s * 0.1, -s * 0.1, s * 0.05, 0, Math.PI * 2); // 眼睛
      ctx.fill();
      
      // 大嘴巴
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-s * 0.1, s * 0.15);
      ctx.lineTo(-s * 0.35, s * 0.15);
      ctx.stroke();
      ctx.restore();
      
      // 铠甲
      ctx.fillStyle = '#444';
      ctx.fillRect(-s * 0.5, -s * 0.6, s * 1.0, s * 0.2);
    }

    // 7. 大象 🐘
    drawElephant(ctx) {
      const s = this.size;
      const walkCycle = this.state === 'MOVING' ? Math.sin(Date.now() * 0.006) : 0;
      ctx.fillStyle = '#A9A9A9';
      
      // 身体（大椭圆）
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.05, s * 0.65, s * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 四条巨大的柱状腿 - 增加动画
      ctx.fillStyle = '#A9A9A9';
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1.5;
      
      const legMove = walkCycle * s * 0.06;
      
      // 前腿
      ctx.fillRect(-s * 0.45 + legMove, s * 0.4, s * 0.18, s * 0.4);
      ctx.strokeRect(-s * 0.45 + legMove, s * 0.4, s * 0.18, s * 0.4);
      ctx.fillRect(-s * 0.15 - legMove, s * 0.4, s * 0.18, s * 0.4);
      ctx.strokeRect(-s * 0.15 - legMove, s * 0.4, s * 0.18, s * 0.4);
      // 后腿
      ctx.fillRect(s * 0.15 + legMove, s * 0.4, s * 0.18, s * 0.4);
      ctx.strokeRect(s * 0.15 + legMove, s * 0.4, s * 0.18, s * 0.4);
      ctx.fillRect(s * 0.45 - legMove, s * 0.4, s * 0.18, s * 0.4);
      ctx.strokeRect(s * 0.45 - legMove, s * 0.4, s * 0.18, s * 0.4);

      // 头部区域 (改为面向左侧)
      ctx.save();
      const headSwing = this.state === 'MOVING' ? walkCycle * 0.03 : 0;
      ctx.translate(-s * 0.45, -s * 0.25);
      ctx.rotate(-headSwing);
      
      ctx.fillStyle = '#A9A9A9';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 脸部细节
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(-s * 0.05, -s * 0.05, s * 0.05, 0, Math.PI * 2); // 眼睛
      ctx.fill();

      // 象牙
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.moveTo(-s * 0.1, s * 0.25);
      ctx.quadraticCurveTo(-s * 0.3, s * 0.3, -s * 0.4, s * 0.2);
      ctx.lineTo(-s * 0.35, s * 0.3);
      ctx.fill();
      
      // 象鼻 - 增加摆动动画
      const trunkSwing = Math.sin(Date.now() * 0.005) * 0.2;
      ctx.lineWidth = s * 0.18;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#A9A9A9';
      ctx.beginPath();
      ctx.moveTo(-s * 0.2, s * 0.2);
      ctx.quadraticCurveTo(-s * 0.65 - trunkSwing * s, s * 0.25, -s * 0.65 - trunkSwing * s, s * 0.7);
      ctx.stroke();
      
      // 耳朵 - 增加扇动动画
      const earFlap = Math.abs(Math.sin(Date.now() * 0.003)) * 0.1;
      ctx.fillStyle = '#888';
      ctx.beginPath();
      ctx.ellipse(s * 0.35, 0, s * 0.35 * (1 + earFlap), s * 0.45, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 背上的投石机
      ctx.fillStyle = '#5C4033';
      ctx.fillRect(-s * 0.3, -s * 0.75, s * 0.55, s * 0.28);
    }

    // 8. 刺客猫 🗡️ (快速切入与斩杀)
    drawAssassin(ctx) {
      const s = this.size;
      const walkCycle = this.state === 'MOVING' ? Math.sin(Date.now() * 0.02) : 0; // 刺客走得快，动画也快
      
      // 身体（修长的黑色椭圆）
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.ellipse(0, s * 0.1, s * 0.25, s * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 披风
      ctx.fillStyle = '#800000';
      ctx.beginPath();
      const cloakWave = Math.sin(Date.now() * 0.01) * 5;
      ctx.moveTo(s * 0.2, -s * 0.1);
      ctx.quadraticCurveTo(s * 0.6, s * 0.1 + cloakWave, s * 0.5, s * 0.6 + cloakWave);
      ctx.lineTo(-s * 0.1, s * 0.4);
      ctx.fill();

      // 头部
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(0, -s * 0.2, s * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 红色围巾/面罩
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(-s * 0.25, -s * 0.1, s * 0.5, s * 0.15);

      // 眼睛（冷酷的红光）
      ctx.fillStyle = '#FF4444';
      ctx.beginPath();
      ctx.arc(-s * 0.1, -s * 0.22, s * 0.04, 0, Math.PI * 2);
      ctx.arc(s * 0.1, -s * 0.22, s * 0.04, 0, Math.PI * 2);
      ctx.fill();

      // 武器：双匕首
      ctx.strokeStyle = '#C0C0C0';
      ctx.lineWidth = 3;
      // 左手匕首
      ctx.save();
      ctx.translate(-s * 0.3, s * 0.1);
      if (this.state === 'ATTACKING') ctx.rotate(Math.sin(Date.now() * 0.03) * 0.8);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-s * 0.3, s * 0.2); ctx.stroke();
      ctx.restore();
      // 右手匕首
      ctx.save();
      ctx.translate(s * 0.2, s * 0.2);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-s * 0.2, s * 0.3); ctx.stroke();
      ctx.restore();
    }

    // 9. 萨满猫 🧙 (控场与减益)
    drawShaman(ctx) {
      const s = this.size;
      
      // 法袍（梯形）
      ctx.fillStyle = '#4B0082'; // 深紫色
      ctx.beginPath();
      ctx.moveTo(-s * 0.3, s * 0.5);
      ctx.lineTo(s * 0.3, s * 0.5);
      ctx.lineTo(s * 0.15, -s * 0.2);
      ctx.lineTo(-s * 0.15, -s * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#9370DB';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 头部
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.arc(0, -s * 0.3, s * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 巫师帽
      ctx.fillStyle = '#4B0082';
      ctx.beginPath();
      ctx.moveTo(-s * 0.4, -s * 0.4);
      ctx.lineTo(s * 0.4, -s * 0.4);
      ctx.lineTo(0, -s * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 法杖
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-s * 0.3, s * 0.4);
      ctx.lineTo(-s * 0.4, -s * 0.5);
      ctx.stroke();
      
      // 法杖顶端的宝珠
      const pulse = Math.sin(Date.now() * 0.005) * 3;
      ctx.fillStyle = '#00FFFF';
      ctx.shadowBlur = 10 + pulse;
      ctx.shadowColor = '#00FFFF';
      ctx.beginPath();
      ctx.arc(-s * 0.4, -s * 0.5, 6 + pulse/2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // 10. 狂战士猫 🪓 (范围伤害与吸血)
    drawBerserker(ctx) {
      const s = this.size;
      
      // 强壮的身体
      ctx.fillStyle = '#CD853F';
      ctx.beginPath();
      ctx.ellipse(0, s * 0.1, s * 0.4, s * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 纹身/战纹
      ctx.strokeStyle = '#FF4500';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-s * 0.2, -s * 0.1); ctx.lineTo(s * 0.2, s * 0.3);
      ctx.moveTo(s * 0.2, -s * 0.1); ctx.lineTo(-s * 0.2, s * 0.3);
      ctx.stroke();

      // 头部
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.arc(0, -s * 0.25, s * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 愤怒的眼睛
      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.moveTo(-s * 0.15, -s * 0.3); ctx.lineTo(-s * 0.05, -s * 0.25);
      ctx.moveTo(s * 0.15, -s * 0.3); ctx.lineTo(s * 0.05, -s * 0.25);
      ctx.stroke();

      // 巨大的斧头
      ctx.save();
      ctx.translate(-s * 0.4, 0);
      if (this.state === 'ATTACKING') ctx.rotate(Math.sin(Date.now() * 0.02) * 1.2);
      ctx.strokeStyle = '#708090';
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(0, s * 0.4); ctx.lineTo(0, -s * 0.4); ctx.stroke(); // 柄
      ctx.fillStyle = '#C0C0C0';
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.2);
      ctx.quadraticCurveTo(-s * 0.4, -s * 0.4, -s * 0.4, 0);
      ctx.quadraticCurveTo(-s * 0.4, s * 0.4, 0, s * 0.2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 11. 工程师猫 🛠️ (生产与辅助)
    drawEngineer(ctx) {
      const s = this.size;
      
      // 身体
      ctx.fillStyle = '#F5F5DC';
      ctx.beginPath();
      ctx.ellipse(0, s * 0.15, s * 0.35, s * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 工作背带裤
      ctx.fillStyle = '#4682B4';
      ctx.beginPath();
      ctx.moveTo(-s * 0.3, s * 0.2);
      ctx.lineTo(s * 0.3, s * 0.2);
      ctx.lineTo(s * 0.35, s * 0.6);
      ctx.lineTo(-s * 0.35, s * 0.6);
      ctx.closePath();
      ctx.fill();

      // 头部
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.arc(0, -s * 0.15, s * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 护目镜
      ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
      ctx.fillRect(-s * 0.25, -s * 0.25, s * 0.5, s * 0.15);
      ctx.strokeStyle = '#333';
      ctx.strokeRect(-s * 0.25, -s * 0.25, s * 0.5, s * 0.15);

      // 安全帽
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(0, -s * 0.25, s * 0.32, Math.PI, 0);
      ctx.fill();
      ctx.stroke();

      // 扳手
      ctx.strokeStyle = '#708090';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-s * 0.4, s * 0.1);
      ctx.lineTo(-s * 0.6, s * 0.4);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-s * 0.65, s * 0.45, 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 12. 巨兽猫 🐘 (终极前排与反伤)
    drawTitan(ctx) {
      const s = this.size;
      
      // 极其巨大的身体
      ctx.fillStyle = '#A9A9A9';
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.45, s * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 4;
      ctx.stroke();

      // 石头质感的铠甲
      ctx.fillStyle = '#696969';
      for(let i = 0; i < 5; i++) {
        ctx.fillRect(-s * 0.4 + i * s * 0.15, -s * 0.3, s * 0.1, s * 0.6);
      }

      // 头部（半埋在肩膀里）
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.arc(0, -s * 0.35, s * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 巨大的角
      ctx.fillStyle = '#F0E68C';
      ctx.beginPath();
      ctx.moveTo(-s * 0.2, -s * 0.5); ctx.lineTo(-s * 0.4, -s * 0.8); ctx.lineTo(-s * 0.05, -s * 0.55); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(s * 0.2, -s * 0.5); ctx.lineTo(s * 0.4, -s * 0.8); ctx.lineTo(s * 0.05, -s * 0.55); ctx.fill();

      // 眼睛（发光）
      const glow = Math.sin(Date.now() * 0.003) * 5;
      ctx.fillStyle = '#FFD700';
      ctx.shadowBlur = 10 + glow;
      ctx.shadowColor = '#FFD700';
      ctx.beginPath();
      ctx.arc(-s * 0.1, -s * 0.35, s * 0.05, 0, Math.PI * 2);
      ctx.arc(s * 0.1, -s * 0.35, s * 0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // --- 新敌人绘制方法 ---
    drawBee(ctx) {
      const s = this.size;
      // 身体 (黄色条纹)
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.5, s * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      // 条纹
      ctx.fillStyle = '#000';
      ctx.fillRect(-s * 0.2, -s * 0.35, s * 0.1, s * 0.7);
      ctx.fillRect(s * 0.1, -s * 0.35, s * 0.1, s * 0.7);
      // 翅膀
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      const wingSwing = Math.sin(Date.now() * 0.05) * 0.2;
      ctx.beginPath();
      ctx.ellipse(-s * 0.1, -s * 0.4, s * 0.3, s * 0.5, wingSwing, 0, Math.PI * 2);
      ctx.fill();
      // 刺
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.moveTo(-s * 0.5, 0); ctx.lineTo(-s * 0.7, 0); ctx.lineTo(-s * 0.5, s * 0.1); ctx.fill();
    }

    drawCrab(ctx) {
      const s = this.size;
      // 身体
      ctx.fillStyle = '#FF4500';
      ctx.beginPath();
      ctx.ellipse(0, s * 0.1, s * 0.5, s * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      // 眼睛
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.arc(-s * 0.2, -s * 0.2, s * 0.1, 0, Math.PI * 2);
      ctx.arc(s * 0.2, -s * 0.2, s * 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(-s * 0.2, -s * 0.2, s * 0.05, 0, Math.PI * 2);
      ctx.arc(s * 0.2, -s * 0.2, s * 0.05, 0, Math.PI * 2);
      ctx.fill();
      // 钳子
      ctx.fillStyle = '#FF4500';
      const pincerSwing = Math.sin(Date.now() * 0.01) * 0.2;
      ctx.save();
      ctx.translate(-s * 0.4, -s * 0.1); ctx.rotate(pincerSwing);
      ctx.beginPath(); ctx.ellipse(0, 0, s * 0.3, s * 0.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    drawRabbit(ctx) {
      const s = this.size;
      // 身体
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.ellipse(0, s * 0.1, s * 0.4, s * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      // 耳朵
      ctx.fillStyle = '#FFC0CB';
      ctx.beginPath();
      ctx.ellipse(-s * 0.2, -s * 0.4, s * 0.1, s * 0.3, -0.2, 0, Math.PI * 2);
      ctx.ellipse(s * 0.2, -s * 0.4, s * 0.1, s * 0.3, 0.2, 0, Math.PI * 2);
      ctx.fill();
      // 眼睛
      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.arc(-s * 0.15, -s * 0.1, s * 0.05, 0, Math.PI * 2);
      ctx.arc(s * 0.15, -s * 0.1, s * 0.05, 0, Math.PI * 2);
      ctx.fill();
    }

    // 辅助方法：绘制圆角矩形
    roundRect(ctx, x, y, width, height, radius) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }

    drawHealthBar(ctx) {
      const barWidth = this.size * 0.8;  // 血条宽度略小于单位宽度
      const barHeight = 4;
      // 血条居中在单位上方
      const barX = this.x + (this.size - barWidth) / 2;
      const barY = this.y - 10;  // 在单位上方 10 像素
      
      // Background (red)
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      
      // Health (green) - 添加保护，确保 maxHP > 0
      const healthRatio = (this.maxHP > 0) ? Math.max(0, Math.min(1, this.hp / this.maxHP)) : 1;
      const healthWidth = healthRatio * barWidth;
      ctx.fillStyle = '#00FF00';
      ctx.fillRect(barX, barY, healthWidth, barHeight);
      
      // Border
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
  
    isDead() {
      return this.hp <= 0;
    }
  }
  