document.addEventListener('DOMContentLoaded', () => {
    // Initialize Scene
    if (window.sceneManager) {
      window.sceneManager.init();
    }
  
    // --- Input Handling ---
    let keyBuffer = "";
    let skipTimeout = null;
  
    window.addEventListener('keydown', (e) => {
      // 1. Dev Toggle (~)
      if (e.code === 'Backquote') {
          const dev = document.getElementById('dev-controls');
          if (dev) {
              const currentDisplay = window.getComputedStyle(dev).display;
              dev.style.display = currentDisplay === 'none' ? 'flex' : 'none';
          }
          return;
      }
  
      // 2. Intro Skip Logic (Hold any key)
      if (window.sceneManager && window.sceneManager.intro && window.sceneManager.intro.active) {
          if (!skipTimeout) {
              // Wait 200ms before triggering skip speed to avoid accidental taps
              skipTimeout = setTimeout(() => {
                  window.sceneManager.intro.setSkip(true);
              }, 200);
          }
      }
  
      // 3. Audio
      if (window.audioController) {
        const freq = window.audioController.playNote(e.code);
        
        // Visuals for standard notes
        if (freq && window.sceneManager && window.sceneManager.weather) {
          const intensity = Math.min((freq - 200) / 500, 1);
          window.sceneManager.weather.triggerPulse(10 + (intensity * 10));
          
          if (window.sceneManager.mainLight) {
            const oldIntensity = window.sceneManager.mainLight.intensity;
            window.sceneManager.mainLight.intensity = 2.0;
            setTimeout(() => {
                window.sceneManager.mainLight.intensity = oldIntensity;
            }, 100);
          }
        }
      }
  
      // 4. Sequence Detectors
      if (e.key) {
          keyBuffer += e.key.toLowerCase();
          if (keyBuffer.length > 20) keyBuffer = keyBuffer.slice(-20); // Increased buffer size to accommodate longer words
          
          // "asdf" -> Gold Snow
          if (keyBuffer.endsWith("asdf")) {
               if (window.sceneManager && window.sceneManager.weather) {
                  // Trigger 30 seconds of gold snow
                  window.sceneManager.weather.triggerGoldSnow(30000);
              }
              keyBuffer = ""; // Clear buffer
          }
  
          // "fffg" -> Gingerbread Shower
          if (keyBuffer.endsWith("fffg")) {
              if (window.sceneManager && window.sceneManager.gingerbread) {
                  window.sceneManager.gingerbread.spawnShower();
                  
                  // Optional Sound
                  if (window.audioController) {
                      window.audioController.playNote('KeyC'); // Low C
                      setTimeout(() => window.audioController.playNote('KeyE'), 150);
                      setTimeout(() => window.audioController.playNote('KeyG'), 300);
                  }
              }
              keyBuffer = "";
          }
  
          // "sssd" -> Spawn Single Gift
          if (keyBuffer.endsWith("sssd")) {
              if (window.sceneManager && window.sceneManager.gifts) {
                  window.sceneManager.gifts.spawnGift();
                  
                  // Optional: Play a special sound?
                  if (window.audioController) {
                      window.audioController.playNote('KeyH'); // High C
                      setTimeout(() => window.audioController.playNote('KeyG'), 200);
                  }
              }
              keyBuffer = "";
          }
  
          // "fds" -> Gift Shower
          if (keyBuffer.endsWith("fds")) {
              if (window.sceneManager && window.sceneManager.gifts) {
                  // Burst of gifts
                  for(let i=0; i<10; i++) {
                      setTimeout(() => window.sceneManager.gifts.spawnGift(), i * 100);
                  }
                  
                  // Sound for shower
                  if (window.audioController) {
                       window.audioController.playNote('KeyH');
                       setTimeout(() => window.audioController.playNote('KeyJ'), 100);
                       setTimeout(() => window.audioController.playNote('KeyK'), 200);
                  }
              }
              keyBuffer = "";
          }
      }
    });
  
    window.addEventListener('keyup', (e) => {
        // Intro Skip Release
        if (skipTimeout) {
            clearTimeout(skipTimeout);
            skipTimeout = null;
        }
        if (window.sceneManager && window.sceneManager.intro) {
            window.sceneManager.intro.setSkip(false);
        }
    });
  
    // --- Click / Interaction Listener ---
    document.addEventListener('click', (e) => {
        // If click target is inside dev-controls, ignore.
        if (e.target.closest('#dev-controls')) return;
  
        if (window.sceneManager && window.sceneManager.checkTreeClick(e.clientX, e.clientY)) {
             if (window.thoughtManager) {
                 window.thoughtManager.showThought();
             }
             // Play chime sound
             if (window.audioController) {
                 window.audioController.playNote('KeyG'); 
             }
        }
    });
  
    // --- Developer Controls ---
    const devToggle = document.getElementById('dev-toggle');
    const devPanel = document.getElementById('dev-panel');
    
    let isDevOpen = false;
    devPanel.style.display = 'none';
    
    devToggle.addEventListener('click', () => {
      isDevOpen = !isDevOpen;
      devPanel.style.display = isDevOpen ? 'block' : 'none';
      devToggle.innerText = isDevOpen ? '▲' : '▼';
    });
  
    // --- Time Travel Controls ---
    // Create Date Input dynamically
    const timeGroup = document.createElement('div');
    timeGroup.className = 'control-group';
    timeGroup.innerHTML = `
        <label>Time Travel (Simulate Date)</label>
        <input type="datetime-local" id="time-travel-input" style="width: 100%; margin-bottom: 5px;">
        <button id="set-time-btn" class="preset-btn" style="width: 100%">Set Time</button>
        <button id="reset-time-btn" class="preset-btn" style="width: 100%; margin-top: 5px;">Reset to Real Time</button>
    `;
    devPanel.insertBefore(timeGroup, devPanel.firstChild);
  
    const timeInput = document.getElementById('time-travel-input');
    const setTimeBtn = document.getElementById('set-time-btn');
    const resetTimeBtn = document.getElementById('reset-time-btn');
  
    // Set default value to current Beijing time approx
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset() + 480); // Rough conversion for display default
    timeInput.value = now.toISOString().slice(0, 16);
  
    setTimeBtn.addEventListener('click', () => {
        if (window.gameState && timeInput.value) {
            window.gameState.debugSetTime(timeInput.value);
        }
    });
  
    resetTimeBtn.addEventListener('click', () => {
        if (window.gameState) {
            window.gameState.debugReset();
        }
    });
    
    // RESET FIRST LAUNCH (Debug)
    const resetLaunchBtn = document.createElement('button');
    resetLaunchBtn.innerText = "Reset Intro Animation";
    resetLaunchBtn.className = "preset-btn";
    resetLaunchBtn.style.width = "100%";
    resetLaunchBtn.style.marginTop = "4px";
    resetLaunchBtn.style.color = "#88ccff";
    resetLaunchBtn.addEventListener('click', () => {
        localStorage.removeItem('evergreen_v1_first_launch');
        location.reload(); 
    });
    
    const sysGroup = document.querySelector('.control-group:last-child');
    if(sysGroup) sysGroup.appendChild(resetLaunchBtn);
  
  
    // --- Weather Controls ---
    const snowSpeedSlider = document.getElementById('snow-speed');
    if (snowSpeedSlider) {
      snowSpeedSlider.addEventListener('input', (e) => {
        if (window.sceneManager && window.sceneManager.weather) {
          window.sceneManager.weather.fallSpeed = parseFloat(e.target.value);
        }
      });
    }
  
    const windStrengthSlider = document.getElementById('wind-strength');
    if (windStrengthSlider) {
      windStrengthSlider.addEventListener('input', (e) => {
        if (window.sceneManager && window.sceneManager.weather) {
          window.sceneManager.weather.windStrength = parseFloat(e.target.value);
        }
      });
    }
  
    const stormBtn = document.getElementById('storm-btn');
    if (stormBtn) {
      stormBtn.addEventListener('click', () => {
        if (window.sceneManager && window.sceneManager.weather) {
          window.sceneManager.weather.triggerPulse(50);
        }
      });
    }
  
    const goldSnowBtn = document.getElementById('gold-snow-btn');
    if (goldSnowBtn) {
      goldSnowBtn.addEventListener('click', () => {
        if (window.sceneManager && window.sceneManager.weather) {
          window.sceneManager.weather.triggerGoldSnow();
        }
      });
    }
    
    // Preset Buttons (Repurposed for useful dates)
    const presets = document.querySelectorAll('.preset-btn');
    
    const presetContainer = document.querySelector('.control-group:nth-child(3)'); // "Presets" group
    if (presetContainer) {
        presetContainer.innerHTML = '<label>Quick Jumps</label>';
        
        const jumps = [
            { label: "Dec 1 (Waiting)", date: "2023-12-01T00:00" },
            { label: "Dec 23 (Growth)", date: "2023-12-23T12:00" },
            { label: "Dec 25 (Zenith)", date: "2023-12-25T00:01" }
        ];
  
        jumps.forEach(j => {
            const btn = document.createElement('button');
            btn.className = 'preset-btn';
            btn.innerText = j.label;
            btn.style.width = "100%";
            btn.style.marginBottom = "4px";
            btn.addEventListener('click', () => {
                // Dynamically set year to current year
                const y = new Date().getFullYear();
                const d = j.date.replace("2023", y); 
                if (window.gameState) window.gameState.debugSetTime(d);
            });
            presetContainer.appendChild(btn);
        });
    }
  
    // Audio Test
    const audioBtn = document.getElementById('test-audio-btn');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        if (window.audioController) {
          window.audioController.init(); 
          window.audioController.playNote('TEST');
        }
      });
    }
    
    // Thoughts Test
    if (devPanel) {
        const thoughtBtn = document.createElement('button');
        thoughtBtn.innerText = "Trigger Thought";
        thoughtBtn.className = "preset-btn";
        thoughtBtn.style.marginTop = "4px";
        thoughtBtn.style.width = "100%";
        thoughtBtn.addEventListener('click', () => {
            if (window.thoughtManager) {
                window.thoughtManager.showThought();
            }
        });
        
        const div = document.createElement('div');
        div.className = "control-group";
        div.appendChild(document.createElement('label')).innerText = "Thoughts";
        div.appendChild(thoughtBtn);
        devPanel.appendChild(div);
    }
    
    // Gift Controls
    if (devPanel) {
        const giftDiv = document.createElement('div');
        giftDiv.className = "control-group";
        giftDiv.appendChild(document.createElement('label')).innerText = "Gifts";
  
        // Spawn Button
        const spawnBtn = document.createElement('button');
        spawnBtn.innerText = "Spawn Gift";
        spawnBtn.className = "preset-btn";
        spawnBtn.style.width = "48%";
        spawnBtn.style.marginRight = "2%";
        spawnBtn.style.color = "#ff6666";
        spawnBtn.addEventListener('click', () => {
            if (window.sceneManager && window.sceneManager.gifts) {
                window.sceneManager.gifts.spawnGift();
            }
        });
  
        // Burst Button
        const burstBtn = document.createElement('button');
        burstBtn.innerText = "Gift Shower";
        burstBtn.className = "preset-btn";
        burstBtn.style.width = "48%";
        burstBtn.style.color = "#ff99cc";
        burstBtn.addEventListener('click', () => {
            if (window.sceneManager && window.sceneManager.gifts) {
                for(let i=0; i<10; i++) {
                    setTimeout(() => window.sceneManager.gifts.spawnGift(), i * 100);
                }
            }
        });
  
        // Clear Button
        const clearBtn = document.createElement('button');
        clearBtn.innerText = "Clear Gifts";
        clearBtn.className = "preset-btn";
        clearBtn.style.width = "100%";
        clearBtn.style.marginTop = "4px";
        clearBtn.addEventListener('click', () => {
            if (window.sceneManager && window.sceneManager.gifts) {
                window.sceneManager.gifts.clearAll();
            }
        });
        
        // Add Gingerbread button just for fun testing
        const gbBtn = document.createElement('button');
        gbBtn.innerText = "Gingerbread Rain";
        gbBtn.className = "preset-btn";
        gbBtn.style.width = "100%";
        gbBtn.style.marginTop = "4px";
        gbBtn.style.color = "#cd853f";
        gbBtn.addEventListener('click', () => {
            if (window.sceneManager && window.sceneManager.gingerbread) {
                window.sceneManager.gingerbread.spawnShower();
            }
        });
  
        giftDiv.appendChild(spawnBtn);
        giftDiv.appendChild(burstBtn);
        giftDiv.appendChild(clearBtn);
        giftDiv.appendChild(gbBtn);
        devPanel.appendChild(giftDiv);
    }
  
    console.log("Evergreen: Beijing Time Edition initialized.");
  });
  