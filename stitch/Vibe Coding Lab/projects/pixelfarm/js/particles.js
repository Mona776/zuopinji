// Particle System for visual effects
export class ParticleSystem {
  constructor(game) {
    this.game = game;
    this.particles = [];
    this.emitters = new Map(); // Persistent emitters (TV glow, lamp light)
  }
  
  update(dt) {
    // Update all particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
      
      // Apply gravity if set
      if (p.gravity) {
        p.vy += p.gravity * dt;
      }
    }
    
    // Update emitters
    for (const [id, emitter] of this.emitters) {
      if (emitter.active) {
        emitter.timer += dt;
        if (emitter.timer >= emitter.interval) {
          emitter.timer = 0;
          this.spawnFromEmitter(emitter);
        }
      }
    }
  }
  
  draw(ctx) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha * (p.baseAlpha || 1);
      
      if (p.type === 'glow') {
        // Glow effect for TV
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
      } else if (p.type === 'light') {
        // Light particles for lamp
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'spark') {
        // Spark particles
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
      }
      
      ctx.restore();
    }
  }
  
  // Create a TV glow emitter
  createTVGlow(entityId, x, y, width, height) {
    const emitterId = `tv_${entityId}`;
    
    this.emitters.set(emitterId, {
      type: 'tv_glow',
      active: true,
      x: x,
      y: y,
      width: width,
      height: height,
      timer: 0,
      interval: 0.1,
      entityId: entityId
    });
    
    // Initial burst
    for (let i = 0; i < 5; i++) {
      this.spawnTVParticle(x, y, width, height);
    }
    
    return emitterId;
  }
  
  // Create a lamp light emitter
  createLampLight(entityId, x, y) {
    const emitterId = `lamp_${entityId}`;
    
    this.emitters.set(emitterId, {
      type: 'lamp_light',
      active: true,
      x: x,
      y: y,
      timer: 0,
      interval: 0.15,
      entityId: entityId
    });
    
    // Initial particles
    for (let i = 0; i < 8; i++) {
      this.spawnLampParticle(x, y);
    }
    
    return emitterId;
  }
  
  // Stop an emitter
  stopEmitter(emitterId) {
    if (this.emitters.has(emitterId)) {
      this.emitters.delete(emitterId);
    }
  }
  
  // Check if emitter exists and is active
  isEmitterActive(emitterId) {
    return this.emitters.has(emitterId) && this.emitters.get(emitterId).active;
  }
  
  spawnFromEmitter(emitter) {
    if (emitter.type === 'tv_glow') {
      this.spawnTVParticle(emitter.x, emitter.y, emitter.width, emitter.height);
    } else if (emitter.type === 'lamp_light') {
      this.spawnLampParticle(emitter.x, emitter.y);
    }
  }
  
  spawnTVParticle(x, y, width, height) {
    const colors = ['#88ccff', '#aaddff', '#ffffff', '#66bbff'];
    
    this.particles.push({
      type: 'glow',
      x: x + Math.random() * width,
      y: y + Math.random() * height,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10 - 5,
      size: 4 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 0.5 + Math.random() * 0.5,
      maxLife: 1,
      alpha: 1,
      baseAlpha: 0.6
    });
  }
  
  spawnLampParticle(x, y) {
    const colors = ['#ffee88', '#ffdd66', '#ffffff', '#ffcc44'];
    const angle = Math.random() * Math.PI * 2;
    const speed = 5 + Math.random() * 15;
    
    this.particles.push({
      type: 'light',
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 10,
      size: 2 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 0.8 + Math.random() * 0.4,
      maxLife: 1.2,
      alpha: 1,
      baseAlpha: 0.7,
      gravity: 20
    });
  }
  
  // Burst effect when turning on
  burstEffect(x, y, type) {
    const count = type === 'tv' ? 15 : 20;
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 20 + Math.random() * 30;
      
      this.particles.push({
        type: type === 'tv' ? 'glow' : 'light',
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color: type === 'tv' ? '#88ccff' : '#ffee88',
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.8,
        alpha: 1,
        baseAlpha: 0.8
      });
    }
  }
}
