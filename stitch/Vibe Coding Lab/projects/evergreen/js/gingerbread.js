class GingerbreadManager {
    constructor(parent) {
      this.parent = parent;
      this.men = [];
      this.geometry = null;
      this.material = null;
      this.isInitialized = false;
      
      // Config
      this.islandRadius = 5.0; // Matches Island top cylinder roughly
      this.groundLevel = -1.0; // Matches Island top surface
    }
  
    init() {
      if (this.isInitialized) return;
      
      // Create a merged geometry or reusable mesh setup for the Gingerbread Man
      // We will build a simple hierarchy for cloning
      
      // Materials
      this.material = new THREE.MeshStandardMaterial({
        color: 0xe08d3c, // Enhanced Vibrancy (Rich Golden/Orange Brown)
        roughness: 0.8,
        flatShading: true
      });
      
      this.icingMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.5
      });
  
      this.isInitialized = true;
    }
  
    createGingerbreadMesh() {
      if (!this.isInitialized) this.init();
  
      const group = new THREE.Group();
      
      // Thicker Geometry (Z axis increased)
      const thickness = 0.2; 
      const limbThickness = 0.15;
  
      // Body (Box for stability/style)
      const bodyGeo = new THREE.BoxGeometry(0.3, 0.4, thickness);
      const body = new THREE.Mesh(bodyGeo, this.material);
      body.position.y = 0.2;
      group.add(body);
      
      // Head (Box)
      const headGeo = new THREE.BoxGeometry(0.25, 0.25, thickness);
      const head = new THREE.Mesh(headGeo, this.material);
      head.position.y = 0.55;
      group.add(head);
      
      // Arms
      const armGeo = new THREE.BoxGeometry(0.1, 0.3, limbThickness);
      const leftArm = new THREE.Mesh(armGeo, this.material);
      leftArm.position.set(-0.25, 0.3, 0);
      leftArm.rotation.z = 0.5;
      group.add(leftArm);
      
      const rightArm = new THREE.Mesh(armGeo, this.material);
      rightArm.position.set(0.25, 0.3, 0);
      rightArm.rotation.z = -0.5;
      group.add(rightArm);
      
      // Legs
      const legGeo = new THREE.BoxGeometry(0.1, 0.3, limbThickness);
      const leftLeg = new THREE.Mesh(legGeo, this.material);
      leftLeg.position.set(-0.1, -0.15, 0);
      group.add(leftLeg);
      
      const rightLeg = new THREE.Mesh(legGeo, this.material);
      rightLeg.position.set(0.1, -0.15, 0);
      group.add(rightLeg);
      
      // Buttons (Icing)
      const btnGeo = new THREE.BoxGeometry(0.05, 0.05, 0.05);
      const btn1 = new THREE.Mesh(btnGeo, this.icingMaterial);
      btn1.position.set(0, 0.3, thickness/2 + 0.02);
      group.add(btn1);
      
      const btn2 = new THREE.Mesh(btnGeo, this.icingMaterial);
      btn2.position.set(0, 0.15, thickness/2 + 0.02);
      group.add(btn2);
  
      // Cast Shadows
      group.traverse(o => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });
  
      // Randomize initial rotation speed for tumbling
      group.userData = {
        velocity: new THREE.Vector3(0, 0, 0),
        rotVelocity: new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).multiplyScalar(0.05), // Slower rotation for floaty feel
        state: 'FALLING', // FALLING, LANDED, FADING
        life: 0,
        scale: 1
      };
  
      return group;
    }
  
    spawnShower() {
      console.log("Spawning Gingerbread Shower!");
      
      // Exact count: 100
      for (let i = 0; i < 100; i++) {
          const man = this.createGingerbreadMesh();
          
          // Random Position above
          const r = Math.random() * 15; // Spread out
          const theta = Math.random() * Math.PI * 2;
          
          man.position.set(
              Math.cos(theta) * r,
              20 + Math.random() * 30, // 20 to 50 height
              Math.sin(theta) * r
          );
          
          // Significantly reduced falling speed (Floaty)
          // Previous: -0.05 - random * 0.1
          // New: Very slight initial push
          man.userData.velocity.y = -0.01 - Math.random() * 0.02; 
          
          this.parent.add(man);
          this.men.push(man);
      }
    }
  
    update() {
      if (this.men.length === 0) return;
  
      // Significantly reduced gravity for ~5s longer fall time
      // Previous: 0.005
      const gravity = 0.001; 
      
      for (let i = this.men.length - 1; i >= 0; i--) {
        const man = this.men[i];
        const data = man.userData;
  
        if (data.state === 'FALLING') {
          // Apply Gravity
          data.velocity.y -= gravity;
          
          // Terminal velocity check (slower cap)
          if (data.velocity.y < -0.1) data.velocity.y = -0.1;
  
          man.position.add(data.velocity);
          
          // Rotate
          man.rotation.x += data.rotVelocity.x;
          man.rotation.y += data.rotVelocity.y;
          man.rotation.z += data.rotVelocity.z;
  
          // Check Collision
          if (man.position.y < this.groundLevel) {
             // Distance from center
             const dist = Math.sqrt(man.position.x * man.position.x + man.position.z * man.position.z);
             
             if (dist < this.islandRadius) {
                 // Landed
                 man.position.y = this.groundLevel;
                 data.state = 'LANDED';
                 data.life = 150 + Math.random() * 150; // Lifetime on ground
                 data.velocity.set(0,0,0);
             } else if (man.position.y < -50) {
                 // Fell into void
                 this.removeMan(i);
             }
          }
        } else if (data.state === 'LANDED') {
            data.life--;
            if (data.life <= 0) {
                data.state = 'FADING';
            }
        } else if (data.state === 'FADING') {
            man.scale.multiplyScalar(0.95);
            if (man.scale.x < 0.01) {
                this.removeMan(i);
            }
        }
      }
    }
  
    removeMan(index) {
        const man = this.men[index];
        this.parent.remove(man);
        
        // Cleanup geometries if needed
        man.traverse(o => {
            if (o.isMesh) {
                if (o.geometry) o.geometry.dispose();
            }
        });
        
        this.men.splice(index, 1);
    }
  }
  