class VisitorManager {
    constructor(parent) {
      this.parent = parent;
      this.group = new THREE.Group();
      this.visitors = [];
      this.isInitialized = false;
      
      this.parent.add(this.group);
    }
  
    init() {
      if (this.isInitialized) return;
      
      // 1. The Deer (Original)
      const deer = this.createDeer();
      deer.position.set(2.5, 0, 1.5); 
      deer.rotation.y = -Math.PI / 4; 
      this.group.add(deer);
      this.visitors.push(deer);
  
      // 2. The Fox
      const fox = this.createFox();
      fox.position.set(-2.0, 0, 2.0);
      fox.rotation.y = Math.PI / 3;
      this.group.add(fox);
      this.visitors.push(fox);
  
      // 3. The Rabbits (Cluster)
      const r1 = this.createRabbit();
      r1.position.set(0, 0, 3.5);
      r1.rotation.y = Math.PI;
      this.group.add(r1);
      this.visitors.push(r1);
  
      const r2 = this.createRabbit();
      r2.scale.setScalar(0.8); // Baby rabbit
      r2.position.set(0.6, 0, 3.2);
      r2.rotation.y = Math.PI * 1.1;
      this.group.add(r2);
      this.visitors.push(r2);
  
      this.isInitialized = true;
    }
  
    createDeer() {
      const deerGroup = new THREE.Group();
      
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.8, flatShading: true });
      const glowMat = new THREE.MeshStandardMaterial({ color: 0xffeebb, emissive: 0xffaa55, emissiveIntensity: 0.5 });
  
      // Body
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.9), bodyMat);
      body.position.y = 0.6;
      deerGroup.add(body);
      
      // Head & Neck
      const neck = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 0.2), bodyMat);
      neck.position.set(0, 0.9, 0.35);
      neck.rotation.x = -0.3;
      deerGroup.add(neck);
      
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.4), bodyMat);
      head.position.set(0, 1.15, 0.5);
      deerGroup.add(head);
  
      // Legs (Sitting)
      const legGeo = new THREE.BoxGeometry(0.12, 0.4, 0.12);
      const fLeg = new THREE.Mesh(legGeo, bodyMat); fLeg.position.set(0.2, 0.2, 0.35); fLeg.rotation.x = -1.5; deerGroup.add(fLeg);
      const fLeg2 = new THREE.Mesh(legGeo, bodyMat); fLeg2.position.set(-0.2, 0.2, 0.35); fLeg2.rotation.x = -1.5; deerGroup.add(fLeg2);
      const bLeg = new THREE.Mesh(legGeo, bodyMat); bLeg.position.set(0.2, 0.2, -0.35); bLeg.rotation.x = 1.5; deerGroup.add(bLeg);
      const bLeg2 = new THREE.Mesh(legGeo, bodyMat); bLeg2.position.set(-0.2, 0.2, -0.35); bLeg2.rotation.x = 1.5; deerGroup.add(bLeg2);
  
      // Antlers
      const leftAntler = new THREE.Group(); leftAntler.position.set(-0.1, 1.25, 0.45); leftAntler.rotation.z = 0.3; leftAntler.rotation.x = -0.2;
      const rightAntler = new THREE.Group(); rightAntler.position.set(0.1, 1.25, 0.45); rightAntler.rotation.z = -0.3; rightAntler.rotation.x = -0.2;
      
      const mainStem = new THREE.BoxGeometry(0.04, 0.4, 0.04);
      const branchStem = new THREE.BoxGeometry(0.03, 0.2, 0.03);
      
      const l1 = new THREE.Mesh(mainStem, glowMat); l1.position.y = 0.2; leftAntler.add(l1);
      const l2 = new THREE.Mesh(branchStem, glowMat); l2.position.set(0, 0.2, 0.05); l2.rotation.x = 0.8; leftAntler.add(l2);
      const r1 = new THREE.Mesh(mainStem, glowMat); r1.position.y = 0.2; rightAntler.add(r1);
      const r2 = new THREE.Mesh(branchStem, glowMat); r2.position.set(0, 0.2, 0.05); r2.rotation.x = 0.8; rightAntler.add(r2);
  
      deerGroup.add(leftAntler); deerGroup.add(rightAntler);
  
      deerGroup.traverse(o => { if(o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      return deerGroup;
    }
  
    createFox() {
        const group = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color: 0xd94e1e, roughness: 0.8, flatShading: true });
        const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
  
        // Body (Sitting)
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 0.5), mat);
        body.position.y = 0.2;
        body.rotation.x = -0.2; // Leaning back slightly
        group.add(body);
  
        // Head
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.3), mat);
        head.position.set(0, 0.45, 0.2);
        group.add(head);
  
        // Ears
        const earGeo = new THREE.ConeGeometry(0.06, 0.15, 4);
        const lEar = new THREE.Mesh(earGeo, mat); lEar.position.set(-0.08, 0.6, 0.2); lEar.rotation.z = 0.2; group.add(lEar);
        const rEar = new THREE.Mesh(earGeo, mat); rEar.position.set(0.08, 0.6, 0.2); rEar.rotation.z = -0.2; group.add(rEar);
  
        // Tail (Bushy)
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.6), mat);
        tail.position.set(0, 0.1, -0.4);
        tail.rotation.x = -0.5; // Curled up
        group.add(tail);
        
        const tailTip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.2), whiteMat);
        tailTip.position.set(0, 0, 0.4); // End of tail
        tail.add(tailTip);
  
        group.traverse(o => { if(o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
        return group;
    }
  
    createRabbit() {
        const group = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 1.0 });
  
        // Body (Round)
        const body = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2, 0), mat);
        body.position.y = 0.15;
        body.scale.set(1, 0.8, 1.2);
        group.add(body);
  
        // Head
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.2), mat);
        head.position.set(0, 0.3, 0.15);
        group.add(head);
  
        // Ears (Long)
        const earGeo = new THREE.BoxGeometry(0.04, 0.25, 0.05);
        const lEar = new THREE.Mesh(earGeo, mat); lEar.position.set(-0.05, 0.45, 0.1); lEar.rotation.x = -0.2; group.add(lEar);
        const rEar = new THREE.Mesh(earGeo, mat); rEar.position.set(0.05, 0.45, 0.1); rEar.rotation.x = -0.2; group.add(rEar);
  
        group.traverse(o => { if(o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
        return group;
    }
  
    update(phase) {
        if (!this.isInitialized) this.init();
  
        let showVisitors = false;
        
        if (phase === 'ETERNAL') {
            showVisitors = true;
        } else if (window.gameState) {
            const hours = window.gameState.getHoursRemaining();
            // Show in final 6 hours (hours between 6 and 0) or during Zenith (hours <= 0)
            if (hours <= 6) showVisitors = true;
        }
  
        this.group.visible = showVisitors;
  
        if (showVisitors) {
            const time = Date.now() * 0.001;
            
            // Subtle idle animations
            this.visitors.forEach((v, i) => {
                v.position.y = Math.sin(time + i) * 0.005; // Breathe
                
                // Random head turn occasional
                if (v.children.length > 1) { // Assuming head/neck is a child
                   // Very slight rotation
                   v.rotation.y += Math.sin(time * 0.5 + i) * 0.0005;
                }
            });
        }
    }
  }
  