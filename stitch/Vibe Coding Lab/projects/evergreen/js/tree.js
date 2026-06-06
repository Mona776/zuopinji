class Tree {
    constructor(parent) {
      this.parent = parent;
      this.group = new THREE.Group();
      this.ornaments = [];
      this.fairyLights = [];
      this.star = null;
      this.foliage = [];
      this.snowLayers = [];
      
      // State
      this.starState = 'HIDDEN'; // HIDDEN, DESCENDING, LANDED
      this.starVelocity = 0;
      
      // Materials
      this.leafMat = new THREE.MeshStandardMaterial({ 
          color: 0x245524, 
          roughness: 0.9, 
          flatShading: true 
      });
      
      // Snow material (Dynamic)
      this.snowMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.5, // Starts icy
          flatShading: true
      });
  
      this.init();
      this.parent.add(this.group);
    }
  
    init() {
      // 1. Trunk
      const trunkGeo = new THREE.CylinderGeometry(0.4, 0.7, 2.5, 6);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 1.0, flatShading: true });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 1.25;
      this.group.add(trunk);
  
      // 2. Foliage Layers
      const layerCount = 6;
      let currentY = 2.0;
      const baseRadius = 3.5;
      
      for (let i = 0; i < layerCount; i++) {
          const t = i / (layerCount - 1); 
          const radius = baseRadius * (1 - t * 0.85); 
          const height = 1.5 - (t * 0.5);
          
          // Foliage Cone
          const coneGeo = new THREE.CylinderGeometry(radius * 0.05, radius, height, 7, 1);
          const cone = new THREE.Mesh(coneGeo, this.leafMat);
          cone.position.y = currentY + height/2;
          cone.rotation.y = Math.random() * Math.PI;
          
          this.group.add(cone);
          this.foliage.push(cone);
          
          // Snow Cap
          if (i < layerCount - 1) { 
               const snowGeo = new THREE.CylinderGeometry(radius * 0.02, radius * 0.9, height * 0.2, 7, 1);
               const snow = new THREE.Mesh(snowGeo, this.snowMat);
               snow.position.y = currentY + height * 0.55; 
               snow.rotation.y = cone.rotation.y; 
               snow.scale.set(1.02, 1, 1.02);
               // Save original scale for "melting" effect
               snow.userData = { originalScale: new THREE.Vector3(1.02, 1, 1.02) };
               this.group.add(snow);
               this.snowLayers.push(snow);
          }
  
          // Fairy Lights
          const lightCount = 4 + Math.floor(radius * 3);
          for(let j=0; j<lightCount; j++) {
              const angle = (j / lightCount) * Math.PI * 2 + (i * 0.5);
              const yOffset = (Math.random() - 0.5) * height * 0.8; 
              const localY = yOffset; 
              const relY = (localY + height/2) / height;
              const localR = radius * (1 - relY) * 1.05; 
              
              const lx = Math.cos(angle) * localR;
              const lz = Math.sin(angle) * localR;
              
              const lGeo = new THREE.SphereGeometry(0.06, 4, 4); 
              const lMat = new THREE.MeshStandardMaterial({
                  color: 0xffaa00,
                  emissive: 0xffaa00,
                  emissiveIntensity: 0, 
                  roughness: 0.1
              });
              const lMesh = new THREE.Mesh(lGeo, lMat);
              lMesh.position.set(lx, localY, lz);
              cone.add(lMesh);
              
              this.fairyLights.push({
                  mesh: lMesh,
                  offset: Math.random() * 100,
                  speed: 0.5 + Math.random() * 1.5
              });
          }
          currentY += height * 0.65; 
      }
  
      // 3. Star
      const starGeo = new THREE.IcosahedronGeometry(0.6, 0);
      const starMat = new THREE.MeshStandardMaterial({ 
        color: 0xffd700, 
        emissive: 0xffd700, 
        emissiveIntensity: 1.0,
        flatShading: true
      });
      this.star = new THREE.Mesh(starGeo, starMat);
      // Final position Y is around currentY + 0.1
      this.starTargetY = currentY + 0.1; 
      
      // Start high up for "Starfall"
      this.star.position.y = 50; 
      this.star.visible = false;
      this.group.add(this.star);
    }
  
    update(progress, phase) {
      // Game State Inputs
      const hoursRemaining = window.gameState.getHoursRemaining();
      const cheerLevel = window.gameState.getCheerLevel(); // 0.0 (12h left) to 1.0 (0h left)
      const isEternal = (phase === 'ETERNAL');
  
      // 1. Scale & Growth
      let targetScale = 1.0;
      if (phase === 'WAITING') {
          targetScale = 0.8;
      } else if (phase === 'GROWTH') {
          targetScale = 0.8 + (0.2 * progress);
      }
      // Zenith/Eternal = 1.0
      
      // Smooth Transition (Lerp)
      // Avoid setting scale directly to prevent snapping after Intro animation
      const currentScale = this.group.scale.x;
      const lerpedScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.01);
      this.group.scale.setScalar(lerpedScale);
  
      // 2. Frost-to-Fir Transition (Cheer Bloom)
      if (phase === 'ZENITH' || phase === 'ETERNAL') {
          // Interpolate roughness: 0.5 (Ice) -> 0.9 (Soft Snow)
          const targetRoughness = 0.5 + (cheerLevel * 0.4);
          this.snowMat.roughness = targetRoughness;
          
          // Sublimate/Shrink Snow Layers
          // Shrink Y scale to 0.5 of original
          this.snowLayers.forEach(s => {
              const targetY = s.userData.originalScale.y * (1.0 - (cheerLevel * 0.5));
              // Slight lerp for smoothness if needed, but cheerLevel is continuous
              s.scale.set(
                  s.userData.originalScale.x,
                  targetY,
                  s.userData.originalScale.z
              );
          });
      }
  
      // 3. Star Logic (Starfall)
      // Trigger if less than 12 hours remaining, OR if eternal
      const shouldStarBeDown = (hoursRemaining <= 12 && hoursRemaining > -24*365) || isEternal;
  
      if (shouldStarBeDown) {
          if (this.starState === 'HIDDEN') {
              this.star.visible = true;
              if (hoursRemaining < 11.5) {
                  // If user arrives late, snap to landed
                  this.starState = 'LANDED';
                  this.star.position.y = this.starTargetY;
              } else {
                  // Trigger Descent
                  this.starState = 'DESCENDING';
                  this.star.position.y = 30; // Start drop height
                  this.starVelocity = 0;
              }
          } else if (this.starState === 'DESCENDING') {
              // Physics-ish drop
              this.starVelocity -= 0.002; // Gravity
              this.star.position.y += this.starVelocity;
              
              // Terminal check
              if (this.star.position.y <= this.starTargetY) {
                  this.star.position.y = this.starTargetY;
                  this.starState = 'LANDED';
                  
                  // Impact "Thud" / Shake tree?
                  // Optional: Trigger a pulse in weather system?
                  if (window.sceneManager && window.sceneManager.weather) {
                      window.sceneManager.weather.triggerPulse(20);
                  }
              }
          } else if (this.starState === 'LANDED') {
              // Idle bobbing
              const time = Date.now() * 0.002;
              this.star.rotation.y += 0.01;
              this.star.position.y = this.starTargetY + Math.sin(time) * 0.05;
              this.star.material.emissiveIntensity = 1.5 + Math.sin(time * 2) * 0.5;
          }
      } else {
          this.star.visible = false;
          this.starState = 'HIDDEN';
      }
  
      // 4. Fairy Lights
      const time = Date.now() * 0.002;
      // Show lights if late growth, zenith, or eternal
      const showLights = (phase === 'ZENITH' || phase === 'ETERNAL' || (phase === 'GROWTH' && progress > 0.6));
      const synced = (this.starState === 'LANDED');
  
      this.fairyLights.forEach(l => {
          if (showLights) {
              l.mesh.visible = true;
              
              if (synced) {
                  // "Heartbeat" of golden light
                  // All synced to same sine wave
                  // Heartbeat shape: pow(sin(t), k)
                  const beat = Math.pow(Math.sin(time * 2), 2); // 0 to 1 sharp curves
                  l.mesh.material.emissiveIntensity = 0.5 + (beat * 2.0);
              } else {
                  // Random Flicker
                  const sineVal = Math.sin(time * l.speed + l.offset);
                  let flicker = (sineVal + 1.2) * 0.5; 
                  if (Math.random() > 0.96) flicker *= 0.1;
                  l.mesh.material.emissiveIntensity = flicker * 2.0;
              }
              
          } else {
              l.mesh.visible = false;
          }
      });
    }
  }
  