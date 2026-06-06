class Base {
    constructor(x, y, width, height, emoji, type, hp = 1000) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.emoji = emoji;
      this.type = type; // 'player' or 'enemy'
      
      // Combat stats
      this.maxHP = hp;
      this.hp = hp;
      this.damage = 20; // 防御塔基础伤害
      this.range = 80;  // 防御塔攻击距离（较短）
      this.attackCooldown = 60; // 1秒攻击一次
      this.currentCooldown = 0;
      
      // Visual feedback
      this.damageFlashTimer = 0;

      // Destruction animation state
      this.isDestroyed = false;
      this.destructionTimer = 0;
      this.fragments = [];
    }
  
    update(allUnits, gameSpeed = 1) {
      if (this.isDestroyed) {
        this.destructionTimer += gameSpeed;
        this.updateFragments(gameSpeed);
        return;
      }
      // 冷却逻辑
      if (this.currentCooldown > 0) {
        this.currentCooldown -= gameSpeed;
      } else {
        // 寻找目标并攻击
        this.findAndAttackTarget(allUnits);
      }
    }

    updateFragments(gameSpeed) {
      for (let frag of this.fragments) {
        frag.x += frag.vx * gameSpeed;
        frag.y += frag.vy * gameSpeed;
        frag.vy += 0.5 * gameSpeed; // Gravity
        frag.rotation += frag.vRotation * gameSpeed;
        frag.life -= 0.02 * gameSpeed;
      }
    }

    triggerDestruction() {
      if (this.isDestroyed) return;
      this.isDestroyed = true;
      this.destructionTimer = 0;
      
      // Create fragments
      const rows = 4;
      const cols = 4;
      const fragW = this.width / cols;
      const fragH = this.height / rows;
      
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          this.fragments.push({
            x: this.x + c * fragW + fragW / 2,
            y: this.y + r * fragH + fragH / 2,
            w: fragW,
            h: fragH,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 1.0) * 15,
            rotation: Math.random() * Math.PI * 2,
            vRotation: (Math.random() - 0.5) * 0.2,
            life: 1.0,
            color: this.type === 'player' ? '#4682B4' : '#4B0082'
          });
        }
      }

      if (window.audioManager) {
        window.audioManager.playBaseBreak();
      }
    }

    findAndAttackTarget(allUnits) {
      let closestAttacker = null;
      let closestDistance = Infinity;

      for (let unit of allUnits) {
        // 检查单位是否正在攻击此防御塔
        // 1. 阵营敌对
        // 2. 目标是此防御塔
        // 3. 状态是正在攻击
        const isAttackingMe = unit.target === this && unit.state === 'ATTACKING';
        
        if (isAttackingMe && unit.hp > 0) {
          const distance = this.getDistanceToUnit(unit);
          // 仅反击在攻击范围内（非常短）的敌人
          if (distance <= this.range && distance < closestDistance) {
            closestDistance = distance;
            closestAttacker = unit;
          }
        }
      }

      if (closestAttacker) {
        closestAttacker.takeDamage(this.damage);
        this.currentCooldown = this.attackCooldown;
      }
    }

    getDistanceToUnit(unit) {
      if (this.type === 'enemy') {
        // 敌方基地在左，攻击右侧玩家
        return unit.x - (this.x + this.width);
      } else {
        // 玩家基地在右，攻击左侧敌人
        return this.x - (unit.x + unit.size);
      }
    }

    takeDamage(damage) {
      this.hp -= damage;
      this.damageFlashTimer = 5;
      
      if (this.hp < 0) {
        this.hp = 0;
      }
    }
  
    draw(ctx) {
      if (this.isDestroyed) {
        this.drawFragments(ctx);
        return;
      }
      // Update damage flash timer
      if (this.damageFlashTimer > 0) {
        this.damageFlashTimer--;
      }
      
      ctx.save();
      
      // 受击闪烁效果
      if (this.damageFlashTimer > 0) {
        ctx.shadowColor = 'red';
        ctx.shadowBlur = 20;
      }

      // 将坐标系移至基地中心
      ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

      if (this.type === 'player') {
        this.drawPlayerBase(ctx);
      } else {
        this.drawEnemyBase(ctx);
      }
      
      ctx.restore();
      
      // 绘制血条
      this.drawHealthBar(ctx);
    }

    drawFragments(ctx) {
      for (let frag of this.fragments) {
        if (frag.life <= 0) continue;
        ctx.save();
        ctx.globalAlpha = frag.life;
        ctx.translate(frag.x, frag.y);
        ctx.rotate(frag.rotation);
        ctx.fillStyle = frag.color;
        ctx.fillRect(-frag.w / 2, -frag.h / 2, frag.w, frag.h);
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(-frag.w / 2, -frag.h / 2, frag.w, frag.h);
        ctx.restore();
      }
    }

    // 绘制玩家基地 🏰
    drawPlayerBase(ctx) {
      const w = this.width;
      const h = this.height;

      // 主塔
      ctx.fillStyle = '#4682B4'; // 钢蓝色
      ctx.fillRect(-w * 0.4, -h * 0.4, w * 0.8, h * 0.8);
      ctx.strokeStyle = '#2F4F4F';
      ctx.lineWidth = 3;
      ctx.strokeRect(-w * 0.4, -h * 0.4, w * 0.8, h * 0.8);

      // 猫耳装饰
      ctx.fillStyle = '#4682B4';
      ctx.beginPath();
      ctx.moveTo(-w * 0.4, -h * 0.4);
      ctx.lineTo(-w * 0.5, -h * 0.6);
      ctx.lineTo(-w * 0.2, -h * 0.4);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(w * 0.4, -h * 0.4);
      ctx.lineTo(w * 0.5, -h * 0.6);
      ctx.lineTo(w * 0.2, -h * 0.4);
      ctx.fill();
      ctx.stroke();

      // 窗户
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(-w * 0.1, -h * 0.1, w * 0.2, h * 0.2);
      
      // 旗帜
      ctx.strokeStyle = '#FFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -h * 0.4);
      ctx.lineTo(0, -h * 0.7);
      ctx.stroke();
      ctx.fillStyle = '#FF4444';
      ctx.beginPath();
      ctx.moveTo(0, -h * 0.7);
      ctx.lineTo(w * 0.3, -h * 0.6);
      ctx.lineTo(0, -h * 0.5);
      ctx.fill();
    }

    // 绘制敌人基地 👹
    drawEnemyBase(ctx) {
      const w = this.width;
      const h = this.height;

      // 邪恶的底座
      ctx.fillStyle = '#4B0082'; // 靛青色
      ctx.beginPath();
      ctx.moveTo(-w * 0.5, h * 0.4);
      ctx.lineTo(w * 0.5, h * 0.4);
      ctx.lineTo(w * 0.3, -h * 0.4);
      ctx.lineTo(-w * 0.3, -h * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 3;
      ctx.stroke();

      // 发光的红眼睛
      ctx.fillStyle = '#FF0000';
      ctx.shadowColor = '#FF0000';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(-w * 0.15, -h * 0.1, 5, 0, Math.PI * 2);
      ctx.arc(w * 0.15, -h * 0.1, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // 尖角
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.moveTo(-w * 0.3, -h * 0.4);
      ctx.lineTo(-w * 0.4, -h * 0.7);
      ctx.lineTo(-w * 0.1, -h * 0.4);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(w * 0.3, -h * 0.4);
      ctx.lineTo(w * 0.4, -h * 0.7);
      ctx.lineTo(w * 0.1, -h * 0.4);
      ctx.fill();
    }

    drawHealthBar(ctx) {
      const barWidth = this.width;
      const barHeight = 8;
      const barX = this.x;
      const barY = this.y - 15;
      
      // Background (red)
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      
      // Health (green)
      const healthWidth = (this.hp / this.maxHP) * barWidth;
      ctx.fillStyle = '#00FF00';
      ctx.fillRect(barX, barY, healthWidth, barHeight);
      
      // Border
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
  
    getLeftEdge() {
      return this.x;
    }
  
    getRightEdge() {
      return this.x + this.width;
    }
  }
  