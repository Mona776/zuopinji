class Lanterns {
    constructor(parent) {
      this.parent = parent;
      this.group = new THREE.Group();
      this.lanterns = [];
      
      // Config
      this.radius = 12;
      this.orbitSpeed = 0.05;
      
      this.init();
      this.parent.add(this.group);
    }
  
    init() {
      // Bubble Geometry
      const geo = new THREE.SphereGeometry(0.4, 32, 32);
      
      // Bubble Shader Material Logic
      // Simulates thin-film interference (rainbows) based on view angle
      const vertShader = `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `;
  
      const fragShader = `
        uniform float time;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
  
        // HSB to RGB conversion for spectrum generation
        vec3 hsb2rgb(vec3 c) {
            vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
            vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
            return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }
  
        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);
          
          // Fresnel term (0 at center, 1 at edge)
          float fresnel = 1.0 - dot(normal, viewDir);
          fresnel = clamp(fresnel, 0.0, 1.0);
  
          // Spectrum color based on view angle + time
          // We iterate the hue based on fresnel for the rainbow ring effect
          float hue = fresnel * 2.5 + time * 0.1;
          vec3 spectrum = hsb2rgb(vec3(hue, 0.5, 0.95));
          
          // Make center more transparent, edges more opaque
          // pow(fresnel, 3.0) focuses opacity on the very rim
          float alpha = pow(fresnel, 1.5) * 0.5 + 0.1;
          
          gl_FragColor = vec4(spectrum, alpha);
        }
      `;
  
      // Create a pool of lanterns (max 30 days support)
      for (let i = 0; i < 30; i++) {
        const lanternGroup = new THREE.Group();
        
        const uniforms = {
            time: { value: 0 }
        };
  
        const mat = new THREE.ShaderMaterial({
          vertexShader: vertShader,
          fragmentShader: fragShader,
          uniforms: uniforms,
          transparent: true,
          depthWrite: false, // Important for transparency sorting
          side: THREE.FrontSide,
          blending: THREE.NormalBlending 
        });
  
        // Mesh
        const mesh = new THREE.Mesh(geo, mat);
        lanternGroup.add(mesh);
        
        // Point Light (Softer, cooler light for bubbles)
        const light = new THREE.PointLight(0xaaccff, 0.4, 4);
        lanternGroup.add(light);
        
        // Store reference
        this.lanterns.push({
          group: lanternGroup,
          mesh: mesh,
          material: mat,
          light: light,
          active: false,
          angle: 0,
          yOffset: 0
        });
        
        this.group.add(lanternGroup);
      }
    }
  
    update(daysRemaining) {
      // 1. Determine how many to show
      const count = Math.max(0, Math.floor(daysRemaining));
      
      const time = Date.now() * 0.0005;
  
      // 2. Position them in a ring
      this.lanterns.forEach((l, index) => {
        // Update shader time uniform
        if (l.material && l.material.uniforms) {
            l.material.uniforms.time.value = time + (index * 0.5); 
        }
  
        if (index < count) {
          if (!l.active) {
              l.active = true;
              l.group.visible = true;
              l.angle = (index / count) * Math.PI * 2;
              l.yOffset = Math.random() * 5;
          }
  
          const targetAngle = (index / count) * Math.PI * 2 + (time * this.orbitSpeed);
          
          const r = this.radius + Math.sin(time + index) * 0.5;
          const y = 5 + Math.sin(time * 2 + index) * 1.0;
          
          l.group.position.set(
              Math.cos(targetAngle) * r,
              y,
              Math.sin(targetAngle) * r
          );
          
          // Gentle rotation
          l.mesh.rotation.y = time + index;
          l.mesh.rotation.z = Math.sin(time * 3 + index) * 0.1;
  
        } else {
          l.active = false;
          l.group.visible = false;
        }
      });
      
      // Slow rotation of the entire group
      this.group.rotation.y = time * 0.02;
    }
  }
  