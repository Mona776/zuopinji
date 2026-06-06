class Island {
    constructor(parent) {
      this.parent = parent;
      this.group = new THREE.Group();
      this.init();
      this.parent.add(this.group);
    }
  
    init() {
      // 1. Top Snow Layer (The ground)
      // Flattened cylinder - Reduced radius from 7 to 5
      const topGeo = new THREE.CylinderGeometry(5, 4, 2, 9, 1);
      const topMat = new THREE.MeshStandardMaterial({ 
        color: 0xffffff, // White snow
        roughness: 0.9,
        metalness: 0.1,
        flatShading: true 
      });
      const topMesh = new THREE.Mesh(topGeo, topMat);
      topMesh.position.y = -1.0; // Surface at y ~ 0 (2/2 = 1, so -1 puts top at 0)
      topMesh.receiveShadow = true;
      this.group.add(topMesh);
  
      // 2. Bottom Rock Layer (The base)
      // Inverted cone for the "floating" look - Reduced radius from 6 to 4
      const bottomGeo = new THREE.ConeGeometry(4, 5, 9);
      const bottomMat = new THREE.MeshStandardMaterial({ 
        color: 0x4d4d55, // Greyish rock
        roughness: 1.0, 
        flatShading: true 
      });
      const bottomMesh = new THREE.Mesh(bottomGeo, bottomMat);
      bottomMesh.position.y = -4.5; // Connects to the cylinder
      bottomMesh.rotation.z = Math.PI; // Flip upside down
      this.group.add(bottomMesh);
  
      // 3. Floating Pebbles/Rocks around the base
      const pebbleGeo = new THREE.DodecahedronGeometry(0.4, 0);
      for (let i = 0; i < 12; i++) {
        const pebble = new THREE.Mesh(pebbleGeo, bottomMat);
        // Random position in a ring/cloud under the island
        const angle = Math.random() * Math.PI * 2;
        // Adjusted radius to match new island size
        const radius = 2 + Math.random() * 3;
        const y = -3 - Math.random() * 4;
        
        pebble.position.set(
          Math.cos(angle) * radius,
          y,
          Math.sin(angle) * radius
        );
        
        pebble.scale.setScalar(0.5 + Math.random());
        pebble.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, 0);
        
        this.group.add(pebble);
      }
  
      // 4. Surface Details (Snow mounds or Rocks)
      for (let i = 0; i < 5; i++) {
          const rockGeo = new THREE.DodecahedronGeometry(Math.random() * 0.5 + 0.3, 0);
          const rock = new THREE.Mesh(rockGeo, bottomMat);
          const r = 1 + Math.random() * 2.5;
          const theta = Math.random() * Math.PI * 2;
          
          rock.position.set(
              Math.cos(theta) * r,
              0.0, // Just sitting on surface
              Math.sin(theta) * r
          );
          rock.rotation.y = Math.random() * Math.PI;
          this.group.add(rock);
      }
    }
  }
  