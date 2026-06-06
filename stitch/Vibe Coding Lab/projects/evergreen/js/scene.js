class SceneManager {
    constructor() {
      this.container = document.getElementById('canvas-container');
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.controls = null;
      this.clock = new THREE.Clock();
      this.composer = null;
      
      // Raycasting
      this.raycaster = null;
      this.mouse = null;
      
      // Game Objects
      this.worldAnchor = null; 
      this.tree = null;
      this.island = null;
      this.weather = null;
      this.lanterns = null; 
      this.skyMesh = null;
      this.stars = null;
      this.gifts = null;
      this.gingerbread = null;
      this.visitor = null; 
      
      this.intro = null; // Intro Manager
      
      // Lights
      this.mainLight = null;
      this.ambientLight = null;
      this.backLight = null;
  
      // Sky Keyframes (Hour 0-24)
      this.skyKeyframes = [
        { hour: 0,  name: 'Midnight',  top: 0x020215, bottom: 0x111125, fog: 0.025, light: 0.30, stars: 1.0 },
        { hour: 4,  name: 'Dawn Pre',  top: 0x0a0a25, bottom: 0x221138, fog: 0.02,  light: 0.35, stars: 0.8 },
        { hour: 6,  name: 'Sunrise',   top: 0x203050, bottom: 0xff9955, fog: 0.018, light: 0.45, stars: 0.2 }, 
        { hour: 8,  name: 'Morning',   top: 0x3a70a0, bottom: 0xd0c0b0, fog: 0.012, light: 0.5, stars: 0.0 }, 
        { hour: 12, name: 'Noon',      top: 0x1050a0, bottom: 0xb0c0d0, fog: 0.008, light: 0.65, stars: 0.0 }, 
        { hour: 16, name: 'Afternoon', top: 0x1a4580, bottom: 0xd0c090, fog: 0.012, light: 0.55, stars: 0.0 }, 
        { hour: 18, name: 'Sunset',    top: 0x203060, bottom: 0xff8844, fog: 0.018, light: 0.5, stars: 0.1 },
        { hour: 20, name: 'Dusk',      top: 0x101035, bottom: 0x442240, fog: 0.022, light: 0.40, stars: 0.6 }, 
        { hour: 22, name: 'Evening',   top: 0x050520, bottom: 0x151535, fog: 0.025, light: 0.35, stars: 0.9 }, 
        { hour: 24, name: 'Midnight',  top: 0x020215, bottom: 0x111125, fog: 0.025, light: 0.30, stars: 1.0 }  
      ];
  
      this.skyKeyframes.forEach(k => {
        k.topColor = new THREE.Color(k.top);
        k.bottomColor = new THREE.Color(k.bottom);
      });
      
      this.currentSky = {
          top: new THREE.Color(0x000000),
          bottom: new THREE.Color(0x050510)
      };
    }
  
    init() {
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x050510);
      this.scene.fog = new THREE.FogExp2(0x050510, 0.02);
  
      this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
      this.camera.position.set(0, 7, 22);
  
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.toneMapping = THREE.ReinhardToneMapping;
      this.renderer.toneMappingExposure = 1.0;
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.container.appendChild(this.renderer.domElement);
      
      this.raycaster = new THREE.Raycaster();
      this.mouse = new THREE.Vector2();
  
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.03;
      this.controls.autoRotate = true;
      this.controls.autoRotateSpeed = 0.3;
      this.controls.maxPolarAngle = Math.PI / 2 - 0.1; 
      this.controls.minDistance = 5;
      this.controls.maxDistance = 40;
      this.controls.target.set(0, 2, 0);
  
      this.ambientLight = new THREE.AmbientLight(0xffccaa, 0.2); 
      this.scene.add(this.ambientLight);
  
      this.mainLight = new THREE.DirectionalLight(0xffaa55, 1);
      this.mainLight.position.set(10, 20, 10);
      this.mainLight.castShadow = true;
      this.mainLight.shadow.mapSize.width = 2048;
      this.mainLight.shadow.mapSize.height = 2048;
      this.mainLight.shadow.camera.near = 0.5;
      this.mainLight.shadow.camera.far = 50;
      this.mainLight.shadow.camera.left = -15;
      this.mainLight.shadow.camera.right = 15;
      this.mainLight.shadow.camera.top = 15;
      this.mainLight.shadow.camera.bottom = -15;
      this.scene.add(this.mainLight);
      
      this.backLight = new THREE.DirectionalLight(0xaaccff, 0.3);
      this.backLight.position.set(-5, 5, -10);
      this.scene.add(this.backLight);
  
      this.initSky();
      this.initStars();
      this.initPostProcessing();
  
      this.worldAnchor = new THREE.Group();
      this.scene.add(this.worldAnchor);
  
      this.island = new Island(this.worldAnchor);
      this.tree = new Tree(this.worldAnchor);
      this.lanterns = new Lanterns(this.worldAnchor); 
      this.gifts = new GiftManager(this.worldAnchor);
      this.gingerbread = new GingerbreadManager(this.worldAnchor); 
      this.visitor = new VisitorManager(this.worldAnchor); 
      this.weather = new WeatherSystem(this.scene);
      
      // Intro Logic
      this.intro = new IntroManager(this);
      if (this.intro.checkFirstLaunch()) {
          this.intro.start();
      }
  
      window.addEventListener('resize', this.onWindowResize.bind(this));
      
      this.animate();
    }
  
    initSky() {
      const vertexShader = `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
      `;
  
      const fragmentShader = `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize( vWorldPosition + vec3(0, offset, 0) ).y;
          gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );
        }
      `;
  
      const uniforms = {
        topColor: { value: new THREE.Color(0x000000) },
        bottomColor: { value: new THREE.Color(0x050510) },
        offset: { value: 10 },
        exponent: { value: 0.6 }
      };
  
      const skyGeo = new THREE.SphereGeometry(80, 32, 15);
      const skyMat = new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: uniforms,
        side: THREE.BackSide
      });
  
      this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
      this.scene.add(this.skyMesh);
    }
  
    initStars() {
      const starGeo = new THREE.BufferGeometry();
      const starCount = 2000;
      const positions = [];
      
      for(let i=0; i<starCount; i++) {
        const r = 60;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);
        
        positions.push(x, y, z);
      }
      
      starGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      
      const starMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.3,
        transparent: true,
        opacity: 0.0,
        sizeAttenuation: true,
        fog: false 
      });
      
      this.stars = new THREE.Points(starGeo, starMat);
      this.scene.add(this.stars);
    }
  
    initPostProcessing() {
      this.composer = new THREE.EffectComposer(this.renderer);
      
      const renderPass = new THREE.RenderPass(this.scene, this.camera);
      this.composer.addPass(renderPass);
  
      const bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.5,  
        0.4,  
        0.85  
      );
      this.composer.addPass(bloomPass);
    }
  
    checkTreeClick(clientX, clientY) {
      if (!this.tree || !this.tree.group) return false;
      this.mouse.x = (clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.tree.group.children, true);
      return intersects.length > 0;
    }
  
    updateSkyAndLights(hourOfDay) {
      let k1 = this.skyKeyframes[0];
      let k2 = this.skyKeyframes[0];
      
      for (let i = 0; i < this.skyKeyframes.length - 1; i++) {
          if (hourOfDay >= this.skyKeyframes[i].hour && hourOfDay < this.skyKeyframes[i+1].hour) {
              k1 = this.skyKeyframes[i];
              k2 = this.skyKeyframes[i+1];
              break;
          }
      }
      
      const range = k2.hour - k1.hour;
      const alpha = (hourOfDay - k1.hour) / range;
      
      // Interpolate Sky Base
      this.currentSky.top.lerpColors(k1.topColor, k2.topColor, alpha);
      this.currentSky.bottom.lerpColors(k1.bottomColor, k2.bottomColor, alpha);
      
      const fogDensity = THREE.MathUtils.lerp(k1.fog, k2.fog, alpha);
      const lightInt = THREE.MathUtils.lerp(k1.light, k2.light, alpha);
      const starOpacity = THREE.MathUtils.lerp(k1.stars, k2.stars, alpha);
  
      // --- Cheer Bloom (Final 12 Hours) ---
      // If we are in the final 12 hours (Cheer Level > 0), blend everything towards Gold/Amber
      let cheer = 0;
      if (window.gameState) {
          cheer = window.gameState.getCheerLevel(); // 0.0 to 1.0
          const isZenith = (window.gameState.getPhase() === 'ZENITH' || window.gameState.getPhase() === 'ETERNAL');
          if (isZenith) cheer = 1.0;
          
          if (cheer > 0) {
              // Target Colors
              const goldAmb = new THREE.Color(0xffaa00);
              const warmShadow = new THREE.Color(0x332211);
              
              // Sky Tint
              this.currentSky.bottom.lerp(goldAmb, cheer * 0.4);
              
              // Ambient Light Shift
              // Base ambient: 0xffccaa -> Target: 0xffaa00
              const currentAmb = this.ambientLight.color.clone();
              this.ambientLight.color.lerpColors(currentAmb, goldAmb, cheer * 0.5);
          }
      }
  
      if (this.skyMesh) {
        this.skyMesh.material.uniforms.topColor.value.copy(this.currentSky.top);
        this.skyMesh.material.uniforms.bottomColor.value.copy(this.currentSky.bottom);
      }
  
      this.scene.fog.color.copy(this.currentSky.bottom);
      this.scene.fog.density = fogDensity;
      
      // Light Intensity
      this.ambientLight.intensity = lightInt * 0.4 + (cheer * 0.2); // Brighter during cheer
  
      if (this.mainLight) {
          if (hourOfDay >= 5 && hourOfDay <= 19) {
              // Day
              this.mainLight.intensity = lightInt * 1.2;
              const dayAlpha = (hourOfDay - 6) / 12; 
              const angle = dayAlpha * Math.PI; 
              this.mainLight.position.set(Math.cos(angle) * 20, Math.sin(angle) * 15, 5);
              this.mainLight.color.setHSL(0.1, 0.8, 0.5 + Math.sin(angle) * 0.3); 
          } else {
              // Night
              this.mainLight.position.set(10, 20, 10);
              
              // Night Light Logic: Arctic Blue vs Candlelight Gold
              const coldLight = new THREE.Color(0xaaccff);
              const warmLight = new THREE.Color(0xffd700);
              
              // Standard progress based warming
              const p = window.gameState ? window.gameState.getProgress() : 0;
              // But cheer overrides for the finale
              const blend = Math.max(p * 0.8, cheer);
              
              this.mainLight.color.lerpColors(coldLight, warmLight, blend); 
              this.mainLight.intensity = lightInt * 1.5; 
          }
      }
  
      if (this.stars) {
          this.stars.material.opacity = starOpacity;
          this.stars.visible = starOpacity > 0.01;
          this.stars.rotation.y = Date.now() * 0.00005;
      }
    }
  
    onWindowResize() {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      if (this.composer) this.composer.setSize(window.innerWidth, window.innerHeight);
    }
  
    animate() {
      requestAnimationFrame(this.animate.bind(this));
  
      const delta = this.clock.getDelta();
      
      // Update Game State
      const progress = window.gameState.getProgress();
      const daysRemaining = window.gameState.getDaysRemaining();
      const cheerLevel = window.gameState.getCheerLevel();
      const phase = window.gameState.getPhase();
      const hourOfDay = window.gameState.getLocalHour(); 
  
      // Update Intro (if active)
      if (this.intro && this.intro.active) {
          this.intro.update(delta);
          
          // While intro is active, we skip standard Tree updates and Control updates
          // BUT we still want weather/ambience/audio to run
          this.updateSkyAndLights(hourOfDay);
          if (this.weather) this.weather.update(); // Keep snow falling
          
          // Render and return early
          if (this.composer) this.composer.render();
          else this.renderer.render(this.scene, this.camera);
          
          return; 
      }
  
      // Standard Game Loop Logic (Post-Intro)
  
      // Audio Sync Logic
      if (window.audioController && window.audioController.isInitialized) {
          const shouldPlayMusic = (phase === 'ZENITH' || phase === 'ETERNAL');
          if (shouldPlayMusic && !window.audioController.isPlayingMusic) {
               window.audioController.startMusic();
          } else if (!shouldPlayMusic && window.audioController.isPlayingMusic) {
               window.audioController.stopMusic();
          }
  
          const dist = this.camera.position.length(); 
          window.audioController.updateFireplaceVolume(dist);
      }
  
      // Update Environment
      this.updateSkyAndLights(hourOfDay);
  
      // Update UI
      const uiText = document.getElementById('cycle-info');
      if (uiText) {
         const displayHour = Math.floor(hourOfDay);
         const ampm = displayHour >= 12 ? 'PM' : 'AM';
         const hour12 = displayHour % 12 || 12;
         
         let statusText = "";
         if (phase === 'WAITING') {
             statusText = `Waiting for Solstice • ${Math.ceil(daysRemaining)} Days`;
         } else if (phase === 'GROWTH') {
             statusText = `Growth Cycle • ${(progress * 100).toFixed(1)}%`;
         } else if (phase === 'ZENITH') {
             statusText = `Zenith Reached`;
         } else if (phase === 'ETERNAL') {
             statusText = `Eternal Glow`;
         }
         
         uiText.innerText = `${statusText} • ${hour12} ${ampm}`;
      }
  
      // Update Countdown
      const countdownEl = document.getElementById('countdown');
      if (countdownEl) {
          if (phase === 'ETERNAL') {
               countdownEl.innerText = "JOY TO THE WORLD";
          } else {
              const target = window.gameState.getTargetTimestamp();
              const now = window.gameState.getNow();
              const diff = target - now;
  
              if (diff <= 0) {
                  countdownEl.innerText = "MERRY CHRISTMAS";
              } else {
                  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                  
                  const d = days < 10 ? "0"+days : days;
                  const h = hours < 10 ? "0"+hours : hours;
                  const m = minutes < 10 ? "0"+minutes : minutes;
                  const s = seconds < 10 ? "0"+seconds : seconds;
                  
                  countdownEl.innerText = `${d} : ${h} : ${m} : ${s}`;
              }
          }
      }
  
      // Update Objects
      this.controls.update();
      
      if (this.tree) this.tree.update(progress, phase);
      if (this.lanterns) this.lanterns.update(daysRemaining);
      if (this.gifts) this.gifts.update(); 
      if (this.gingerbread) this.gingerbread.update(); 
      if (this.visitor) this.visitor.update(phase); 
      
      if (this.weather) {
          if (phase === 'WAITING') {
               this.weather.fallSpeed = 0.5;
               this.weather.windStrength = 0.01;
          } else {
               this.weather.fallSpeed = 1.0 + (progress * 0.5);
               this.weather.windStrength = 0.02 + (progress * 0.05);
          }
          this.weather.update();
          this.weather.updateCheer(cheerLevel); // Update Gold Dust
      }
      
      if (this.worldAnchor) {
          const time = Date.now() * 0.001;
          this.worldAnchor.position.y = Math.sin(time * 0.5) * 0.3; 
      }
  
      if (this.composer) {
          this.composer.render();
      } else {
          this.renderer.render(this.scene, this.camera);
      }
    }
  }
  
  window.sceneManager = new SceneManager();
  