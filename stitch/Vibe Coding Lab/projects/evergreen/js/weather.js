class WeatherSystem {
    constructor(scene) {
      this.scene = scene;
      
      this.activeType = 'WHITE'; // 'WHITE', 'TRANSITION_TO_GOLD', 'GOLD'
      this.revertTimer = null; 
      
      // Regular Snow
      this.particleCount = 1500;
      this.particles = null;
      this.geometry = null;
      this.material = null;
      this.velocities = [];
      
      // Gold Snow (Interaction Event)
      this.goldParticleCount = 1500; 
      this.goldParticles = null;
      this.goldGeometry = null;
      this.goldMaterial = null;
      this.goldVelocities = [];
      
      // Cheer Dust (Bokeh - Final 12h)
      this.cheerParticleCount = 200;
      this.cheerParticles = null;
      this.cheerGeometry = null;
      this.cheerMaterial = null;
  
      // Wind/turbulence
      this.windStrength = 0.01;
      this.turbulence = 0;
      
      // Controls
      this.fallSpeed = 1.0;
      
      this.init();
      this.initGold();
      this.initCheer();
    }
  
    init() {
      this.geometry = new THREE.BufferGeometry();
      const positions = [];
      
      for (let i = 0; i < this.particleCount; i++) {
        const x = (Math.random() - 0.5) * 40;
        const y = (Math.random() - 0.5) * 40;
        const z = (Math.random() - 0.5) * 40;
        positions.push(x, y, z);
        
        this.velocities.push({
          y: -0.02 - Math.random() * 0.05,
          x: (Math.random() - 0.5) * 0.01,
          z: (Math.random() - 0.5) * 0.01
        });
      }
  
      this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 32, 32);
      const texture = new THREE.CanvasTexture(canvas);
  
      this.material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.3,
        map: texture,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
  
      this.particles = new THREE.Points(this.geometry, this.material);
      this.particles.frustumCulled = false; 
      this.scene.add(this.particles);
    }
  
    initGold() {
      this.goldGeometry = new THREE.BufferGeometry();
      const positions = [];
      
      for (let i = 0; i < this.goldParticleCount; i++) {
        positions.push(0, -100, 0); // Start hidden
        
        this.goldVelocities.push({
          y: -0.05 - Math.random() * 0.05, 
          x: (Math.random() - 0.5) * 0.02,
          z: (Math.random() - 0.5) * 0.02
        });
      }
  
      this.goldGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 32, 32);
      const texture = new THREE.CanvasTexture(canvas);
  
      this.goldMaterial = new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(0xffaa00) }, 
          pointTexture: { value: texture }
        },
        vertexShader: `
          void main() {
            vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
            gl_PointSize = 200.0 / -mvPosition.z; 
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform vec3 color;
          uniform sampler2D pointTexture;
          void main() {
            vec4 tColor = texture2D( pointTexture, gl_PointCoord );
            if (tColor.a < 0.01) discard;
            gl_FragColor = vec4( color * 4.0, 1.0 ) * tColor;
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
  
      this.goldParticles = new THREE.Points(this.goldGeometry, this.goldMaterial);
      this.goldParticles.frustumCulled = false;
      this.scene.add(this.goldParticles);
    }
  
    initCheer() {
      // "Gold Dust" / Bokeh effect for the final 12 hours
      this.cheerGeometry = new THREE.BufferGeometry();
      const positions = [];
      
      for (let i = 0; i < this.cheerParticleCount; i++) {
        const x = (Math.random() - 0.5) * 50;
        const y = (Math.random() - 0.5) * 30 + 10;
        const z = (Math.random() - 0.5) * 50;
        positions.push(x, y, z);
      }
      
      this.cheerGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      
      // Create a softer, larger texture for bokeh
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      
      // Draw a circle
      ctx.beginPath();
      ctx.arc(32, 32, 30, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 220, 100, 0.5)"; // Soft Gold
      ctx.fill();
      
      const texture = new THREE.CanvasTexture(canvas);
      
      this.cheerMaterial = new THREE.PointsMaterial({
          color: 0xffd700,
          size: 0.8,
          map: texture,
          transparent: true,
          opacity: 0.0, // Start invisible
          depthWrite: false,
          blending: THREE.AdditiveBlending
      });
      
      this.cheerParticles = new THREE.Points(this.cheerGeometry, this.cheerMaterial);
      this.scene.add(this.cheerParticles);
    }
  
    triggerGoldSnow(duration = 30000) {
      if (this.activeType === 'GOLD' || this.activeType === 'TRANSITION_TO_GOLD') {
          if (this.revertTimer) clearTimeout(this.revertTimer);
          this.revertTimer = setTimeout(() => this.endSpecialSnow(), duration);
          return;
      }
      
      this.activeType = 'TRANSITION_TO_GOLD';
      
      setTimeout(() => {
          if (this.activeType === 'TRANSITION_TO_GOLD') {
              this.activeType = 'GOLD';
              if (this.revertTimer) clearTimeout(this.revertTimer);
              this.revertTimer = setTimeout(() => this.endSpecialSnow(), duration);
          }
      }, 3500);
    }
  
    endSpecialSnow() {
        this.activeType = 'WHITE';
        this.revertTimer = null;
    }
  
    spawnGold(count) {
      const positions = this.goldGeometry.attributes.position.array;
      let spawned = 0;
      
      for (let i = 0; i < this.goldParticleCount; i++) {
        if (positions[i * 3 + 1] < -50) {
          positions[i * 3] = (Math.random() - 0.5) * 40; 
          positions[i * 3 + 1] = 20 + Math.random() * 5; 
          positions[i * 3 + 2] = (Math.random() - 0.5) * 40; 
          spawned++;
          if (spawned >= count) break;
        }
      }
      
      if (spawned > 0) {
          this.goldGeometry.attributes.position.needsUpdate = true;
      }
    }
  
    updateCheer(cheerLevel) {
        if (!this.cheerParticles) return;
        
        // Opacity based on cheerLevel (0 to 1)
        this.cheerMaterial.opacity = cheerLevel * 0.6;
        
        // Floating motion
        const positions = this.cheerGeometry.attributes.position.array;
        const time = Date.now() * 0.0005;
        
        for(let i=0; i < this.cheerParticleCount; i++) {
            // Slow rise
            positions[i*3 + 1] += 0.01;
            // Loop
            if (positions[i*3+1] > 25) positions[i*3+1] = -5;
            
            // Gentle sway
            positions[i*3] += Math.sin(time + i) * 0.005;
        }
        this.cheerGeometry.attributes.position.needsUpdate = true;
    }
  
    update() {
      const whitePositions = this.geometry.attributes.position.array;
      const goldPositions = this.goldGeometry.attributes.position.array;
      
      const time = Date.now() * 0.001;
  
      // --- 1. Update White Snow ---
      for (let i = 0; i < this.particleCount; i++) {
        whitePositions[i * 3 + 1] += this.velocities[i].y * this.fallSpeed;
        
        const windX = (Math.sin(time + i) * this.windStrength);
        const windZ = (Math.cos(time * 0.5 + i) * this.windStrength);
        const turb = (Math.random() - 0.5) * this.turbulence;
  
        whitePositions[i * 3] += (this.velocities[i].x * this.fallSpeed) + windX + turb;
        whitePositions[i * 3 + 2] += (this.velocities[i].z * this.fallSpeed) + windZ + turb;
        
        if (whitePositions[i * 3 + 1] < -15) {
            if (this.activeType === 'WHITE') {
               whitePositions[i * 3 + 1] = 20;
               if (Math.random() > 0.5) {
                   whitePositions[i * 3] = (Math.random() - 0.5) * 40;
                   whitePositions[i * 3 + 2] = (Math.random() - 0.5) * 40;
               }
            } else {
               whitePositions[i * 3 + 1] = -100;
            }
        }
        
        if (whitePositions[i * 3 + 1] > -15) {
          if (Math.abs(whitePositions[i * 3]) > 20) whitePositions[i * 3] *= -0.9;
          if (Math.abs(whitePositions[i * 3 + 2]) > 20) whitePositions[i * 3 + 2] *= -0.9;
        }
      }
      this.geometry.attributes.position.needsUpdate = true;
  
      // --- 2. Update Gold Snow ---
      for (let i = 0; i < this.goldParticleCount; i++) {
        const y = goldPositions[i * 3 + 1];
        
        if (y > -50 || (this.activeType === 'GOLD' && y < -50)) {
            if (y > -50) {
                goldPositions[i * 3 + 1] += this.goldVelocities[i].y * this.fallSpeed;
                const windX = (Math.sin(time + i) * this.windStrength * 0.8);
                goldPositions[i * 3] += (this.goldVelocities[i].x * this.fallSpeed) + windX;
                goldPositions[i * 3 + 2] += this.goldVelocities[i].z * this.fallSpeed;
                
                if (goldPositions[i * 3 + 1] < -15) {
                    goldPositions[i * 3 + 1] = -100;
                    if (this.activeType === 'GOLD') {
                        goldPositions[i * 3] = (Math.random() - 0.5) * 40;
                        goldPositions[i * 3 + 1] = 20 + Math.random() * 5;
                        goldPositions[i * 3 + 2] = (Math.random() - 0.5) * 40;
                    }
                }
            }
            if (this.activeType === 'GOLD' && goldPositions[i * 3 + 1] < -50) {
                 if (Math.random() < 0.05) { 
                     goldPositions[i * 3] = (Math.random() - 0.5) * 40;
                     goldPositions[i * 3 + 1] = 20 + Math.random() * 5;
                     goldPositions[i * 3 + 2] = (Math.random() - 0.5) * 40;
                 }
            }
        }
      }
      this.goldGeometry.attributes.position.needsUpdate = true;
      
      this.turbulence *= 0.95;
    }
  
    triggerPulse(intensity) {
      this.turbulence += intensity * 0.1;
    }
  }
  