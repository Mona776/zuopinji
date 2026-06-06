class GiftManager {
    constructor(scene) {
      this.scene = scene;
      this.gifts = [];
      this.maxGifts = 50;
      
      // 5 Themes: Box Color + Ribbon Color
      this.themes = [
        { box: 0xcc2222, ribbon: 0xffd700 }, // Red + Gold
        { box: 0x228822, ribbon: 0xcc2222 }, // Green + Red
        { box: 0x224488, ribbon: 0xc0c0c0 }, // Blue + Silver
        { box: 0xffffff, ribbon: 0xd4af37 }, // White + Gold
        { box: 0x6a0dad, ribbon: 0xff69b4 }  // Purple + Pink
      ];
    }
  
    spawnGift() {
      // 0. Limit Check
      if (this.gifts.length >= this.maxGifts) {
          const oldGift = this.gifts.shift(); // Remove oldest
          this.disposeGift(oldGift);
      }
  
      // 1. Random Parameters
      const theme = this.themes[Math.floor(Math.random() * this.themes.length)];
      const size = 0.4 + Math.random() * 0.4; // 0.4 to 0.8
      
      // 2. Base Box
      const geometry = new THREE.BoxGeometry(size, size, size);
      const material = new THREE.MeshStandardMaterial({ 
        color: theme.box, 
        roughness: 0.7,
        flatShading: true
      });
      const gift = new THREE.Mesh(geometry, material);
      
      // 3. Ribbon (Cross Wrap)
      const ribbonMat = new THREE.MeshStandardMaterial({ 
        color: theme.ribbon, 
        roughness: 0.4, 
        metalness: 0.1 
      });
      
      // Band 1 (Wrap around X)
      const band1 = new THREE.Mesh(
        new THREE.BoxGeometry(size * 1.02, size * 1.02, size * 0.15), 
        ribbonMat
      );
      // Band 2 (Wrap around Z)
      const band2 = new THREE.Mesh(
        new THREE.BoxGeometry(size * 0.15, size * 1.02, size * 1.02), 
        ribbonMat
      );
      
      gift.add(band1);
      gift.add(band2);
  
      // 4. Bow (Knot on top)
      const bowGeo = new THREE.DodecahedronGeometry(size * 0.15);
      const bow = new THREE.Mesh(bowGeo, ribbonMat);
      bow.position.y = size * 0.5 + size * 0.05;
      gift.add(bow);
  
      // 5. Initial Position & Physics State
      // Drop radius: 2.0 to 5.0
      const angle = Math.random() * Math.PI * 2;
      const radius = 2.0 + Math.random() * 3.0;
      
      gift.position.set(
        Math.cos(angle) * radius,
        25, // Start high up
        Math.sin(angle) * radius
      );
      
      // Random Tumble
      gift.rotation.set(
        Math.random() * Math.PI, 
        Math.random() * Math.PI, 
        Math.random() * Math.PI
      );
  
      gift.castShadow = true;
      gift.receiveShadow = true;
  
      this.scene.add(gift);
      
      this.gifts.push({
        mesh: gift,
        size: size,
        velocity: { 
          y: 0, 
          rotX: (Math.random() - 0.5) * 0.2, 
          rotZ: (Math.random() - 0.5) * 0.2 
        },
        active: true,
        onGround: false
      });
    }
  
    disposeGift(giftObj) {
        if (!giftObj || !giftObj.mesh) return;
        
        this.scene.remove(giftObj.mesh);
        
        giftObj.mesh.traverse((node) => {
            if (node.isMesh) {
                if (node.geometry) node.geometry.dispose();
                if (node.material) {
                    if (Array.isArray(node.material)) {
                        node.material.forEach(m => m.dispose());
                    } else {
                        node.material.dispose();
                    }
                }
            }
        });
        
        giftObj.active = false;
    }
  
    clearAll() {
        while(this.gifts.length > 0) {
            const g = this.gifts.pop();
            this.disposeGift(g);
        }
    }
  
    update() {
      const gravity = 0.015;
      const groundLevel = 0.0; // Snow surface approx
      const bounceFactor = 0.4;
  
      for (let i = 0; i < this.gifts.length; i++) {
        const g = this.gifts[i];
        if (!g.active || g.onGround) continue;
  
        // Apply Gravity
        g.velocity.y -= gravity;
        g.mesh.position.y += g.velocity.y;
  
        // Apply Rotation
        g.mesh.rotation.x += g.velocity.rotX;
        g.mesh.rotation.z += g.velocity.rotZ;
  
        // Collision Detection
        const halfSize = g.size / 2;
        
        if (g.mesh.position.y < groundLevel + halfSize) {
          // Impact
          g.mesh.position.y = groundLevel + halfSize;
          
          if (Math.abs(g.velocity.y) > 0.1) {
            // Bounce
            g.velocity.y *= -bounceFactor;
            g.velocity.rotX *= 0.6; // Dampen rotation
            g.velocity.rotZ *= 0.6;
          } else {
            // Come to rest
            g.onGround = true;
            // Flatten slightly for stability visual
            g.mesh.rotation.x = 0;
            g.mesh.rotation.z = 0;
          }
        }
      }
    }
  }
  