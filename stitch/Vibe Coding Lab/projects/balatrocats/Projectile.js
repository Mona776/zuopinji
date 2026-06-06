class Projectile {
    constructor(startX, startY, target, damage, team, type = 'normal') {
        this.x = startX;
        this.y = startY;
        this.target = target;
        this.damage = damage;
        this.team = team;
        this.type = type; // 'normal', 'crystal', 'rock', 'magic'
        
        this.speed = 8;
        this.size = 6;
        this.isDead = false;
        
        // 弧线运动参数
        this.angle = 0;
        this.arcHeight = (type === 'rock' || type === 'magic') ? 100 : 30; // 大象投石机和萨满魔法弧度更高
        this.progress = 0;
        this.startX = startX;
        this.startY = startY;
        
        // 记录目标位置（防止目标死亡后弹道消失）
        this.targetX = target.x + (target.size || 30) / 2;
        this.targetY = target.y + (target.size || 30) / 2;
    }

    update(gameSpeed = 1) {
        if (this.isDead) return;

        // 实时追踪目标位置（如果目标还活着）
        if (this.target && this.target.hp > 0) {
            this.targetX = this.target.x + (this.target.size || 30) / 2;
            this.targetY = this.target.y + (this.target.size || 30) / 2;
        }

        // 计算进度
        const dx = this.targetX - this.startX;
        const dy = this.targetY - this.startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        this.progress += (this.speed * gameSpeed) / distance;

        if (this.progress >= 1) {
            this.progress = 1;
            this.hit();
        }

        // 线性插值计算当前位置
        this.x = this.startX + dx * this.progress;
        const baseY = this.startY + dy * this.progress;
        
        // 加上抛物线高度
        const arc = Math.sin(this.progress * Math.PI) * this.arcHeight;
        this.y = baseY - arc;
    }

    hit() {
        this.isDead = true;
        if (this.target && this.target.hp > 0) {
            this.target.takeDamage(this.damage);
        }
    }

    draw(ctx) {
        ctx.save();
        
        switch(this.type) {
            case 'crystal': // 蜥蜴猫紫色晶体
                ctx.fillStyle = '#9370DB';
                ctx.shadowColor = '#E6E6FA';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y - 8);
                ctx.lineTo(this.x + 6, this.y);
                ctx.lineTo(this.x, this.y + 8);
                ctx.lineTo(this.x - 6, this.y);
                ctx.closePath();
                ctx.fill();
                break;
            case 'rock': // 大象投石机巨石
                ctx.fillStyle = '#5C4033';
                ctx.beginPath();
                ctx.arc(this.x, this.y, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 2;
                ctx.stroke();
                break;
            case 'magic': // 萨满猫魔法球
                const pulse = Math.sin(Date.now() * 0.01) * 3;
                ctx.fillStyle = '#00FFFF';
                ctx.shadowColor = '#00FFFF';
                ctx.shadowBlur = 15 + pulse;
                ctx.beginPath();
                ctx.arc(this.x, this.y, 6 + pulse/2, 0, Math.PI * 2);
                ctx.fill();
                // 魔法拖尾
                ctx.globalAlpha = 0.5;
                ctx.beginPath();
                ctx.arc(this.x - 5, this.y, 4, 0, Math.PI * 2);
                ctx.fill();
                break;
            default: // 普通弹道
                ctx.fillStyle = this.team === 'player' ? '#FFF' : '#FF4444';
                ctx.beginPath();
                ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
                ctx.fill();
        }
        
        ctx.restore();
    }
}