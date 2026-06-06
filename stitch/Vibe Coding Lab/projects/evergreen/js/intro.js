class IntroManager {
    constructor(sceneManager) {
      this.sm = sceneManager;
      this.active = false;
      this.timer = 0;
      this.timeScale = 1.0;
      this.finished = false;
      
      this.group = new THREE.Group();
      this.seed = null;
      this.dust = null;
      
      // Config
      this.phases = {
          VOID: 0,
          SEED_SPAWN: 2,
          GROWTH_START: 4,
          END: 8
      };
    }
  
    checkFirstLaunch() {
      if (window.gameState) {
          return window.gameState.isFirstLaunch();
      }
      return false;
    }
  
    start() {
      console.log("Starting Intro Sequence...");
      this.active = true;
      this.timer = 0;
      this.finished = false;
      this.sm.scene.add(this.group);
      
      // 1. Setup Environment (Void)
      // Hide Tree initially
      if (this.sm.tree && this.sm.tree.group) {
          this.sm.tree.group.visible = false;
          this.sm.tree.group.scale.set(0,0,0);
      }
      
      // Disable controls
      if (this.sm.controls) {
          this.sm.controls.enabled = false;
      }
  
      // Set Camera for "First Witness"
      // Looking at center from slightly above
      this.sm.camera.position.set(0, 4, 12);
      this.sm.camera.lookAt(0, 1, 0);
  
      // Create Seed
      this.initSeed();
    }
  
    initSeed() {
      const geo = new THREE.DodecahedronGeometry(0.15, 0);
      const mat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0xaaddff,
          emissiveIntensity: 2.0,
          roughness: 0.2
      });
      this.seed = new THREE.Mesh(geo, mat);
      this.seed.position.set(0, 10, 0); // Start high
      this.seed.visible = false;
      
      // Glow/Pulse effect handled in update
      this.group.add(this.seed);
    }
  
    spawnDust() {
        // Small particle burst at (0,0,0)
        const count = 100;
        const geo = new THREE.BufferGeometry();
        const pos = [];
        const vel = [];
        
        for(let i=0; i<count; i++) {
            pos.push(0, 0.5, 0);
            const theta = Math.random() * Math.PI * 2;
            const r = Math.random() * 0.5;
            const y = (Math.random() - 0.5) * 0.5;
            vel.push(
                Math.cos(theta) * 0.05,
                Math.random() * 0.05,
                Math.sin(theta) * 0.05
            );
        }
        
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        
        const mat = new THREE.PointsMaterial({
            color: 0xaaddff,
            size: 0.1,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        this.dust = new THREE.Points(geo, mat);
        this.dust.userData = { velocities: vel };
        this.group.add(this.dust);
    }
  
    update(delta) {
      if (!this.active) return;
      
      // Apply time scale (skip mechanism)
      const dt = delta * this.timeScale;
      this.timer += dt;
  
      // --- Phase 1: Void (0-2s) ---
      // Camera is static, wind noise (handled by weather system implicitly)
  
      // --- Phase 2: Seed Spawn (2s-4s) ---
      if (this.timer >= this.phases.SEED_SPAWN && this.timer < this.phases.GROWTH_START) {
          if (!this.seed.visible) this.seed.visible = true;
          
          // Sinks into void (From y=8 to y=0)
          // Map 2s-4s -> 0-1
          const t = (this.timer - this.phases.SEED_SPAWN) / 2.0;
          // EaseOutBounce-ish or just SmoothStep
          const y = 8 * (1 - t * t); 
          this.seed.position.y = y;
          this.seed.rotation.x += dt * 2;
          this.seed.rotation.z += dt * 2;
      }
  
      // --- Phase 3: Growth (4s-8s) ---
      if (this.timer >= this.phases.GROWTH_START && this.timer < this.phases.END) {
          if (this.seed.visible) {
              this.seed.visible = false; // Poof
              this.spawnDust(); // Trigger dust once
          }
          
          if (this.sm.tree && this.sm.tree.group) {
              this.sm.tree.group.visible = true;
              
              // Lerp 0 to 0.2 (Requirement)
              // t goes 0 to 1 over 4 seconds
              const t = (this.timer - this.phases.GROWTH_START) / 4.0;
              const scale = t * 0.2; 
              
              this.sm.tree.group.scale.setScalar(scale);
          }
          
          // Animate dust
          if (this.dust) {
              const positions = this.dust.geometry.attributes.position.array;
              const vels = this.dust.userData.velocities;
              for(let i=0; i<vels.length/3; i++) {
                  positions[i*3] += vels[i*3];
                  positions[i*3+1] += vels[i*3+1];
                  positions[i*3+2] += vels[i*3+2];
              }
              this.dust.geometry.attributes.position.needsUpdate = true;
              this.dust.material.opacity = 1.0 - t;
          }
      }
  
      // --- Phase 4: End (8s) ---
      if (this.timer >= this.phases.END && !this.finished) {
          this.end();
      }
    }
  
    end() {
      console.log("Intro Finished.");
      this.finished = true;
      this.active = false;
      
      // Save state
      if (window.gameState) window.gameState.setFirstLaunchDone();
  
      // Enable controls
      if (this.sm.controls) {
          this.sm.controls.enabled = true;
          this.sm.controls.autoRotate = true; // Ensure auto rotate starts
      }
  
      // Clean up
      this.sm.scene.remove(this.group);
      
      // Trigger Thought
      if (window.thoughtManager) {
          // Force show specific text
          window.thoughtManager.showSpecific("From the dust, I witnessed the first winter solstice.");
      }
    }
  
    // Called by main.js input
    setSkip(shouldSkip) {
        this.timeScale = shouldSkip ? 10.0 : 1.0;
    }
  }
  