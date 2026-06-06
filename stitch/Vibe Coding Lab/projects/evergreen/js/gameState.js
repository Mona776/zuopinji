class GameState {
    constructor() {
      this.debugOffset = 0; // ms offset for time travel
      this.storageKey = 'evergreen_v1_save';
      this.firstLaunchKey = 'evergreen_v1_first_launch';
    }
  
    // Returns true if this is the first time the user has played (or storage cleared)
    isFirstLaunch() {
        // Logic: Check if key exists. If NOT exists, it is first launch.
        // We return true, and the IntroManager will eventually call setFirstLaunchDone()
        return localStorage.getItem(this.firstLaunchKey) !== 'false';
    }
  
    setFirstLaunchDone() {
        localStorage.setItem(this.firstLaunchKey, 'false');
    }
  
    // Returns the current simulated time (User's Local Time + Debug Offset)
    getNow() {
      return Date.now() + this.debugOffset;
    }
  
    // Target: Dec 25th 00:00:00 (Local Time) of the current year
    getTargetTimestamp() {
      const now = new Date(this.getNow());
      const currentYear = now.getFullYear(); 
      
      // Construct Dec 25 00:00:00 Local Time
      // Month is 0-indexed (11 = Dec)
      let target = new Date(currentYear, 11, 25, 0, 0, 0).getTime();
  
      // If we are significantly past Dec 25th (e.g., it is Jan 2nd), target next year.
      // However, for the "Eternal" phase (Dec 26 - Dec 31), we keep the target as THIS year's Christmas
      // so calculations remain consistent relative to the event that just passed.
      
      // Logic: If Now is > Jan 5th of next year, switch target. 
      // This allows "Eternal" mode to last through New Year's.
      if (now.getMonth() === 0 && now.getDate() < 10) {
          // It is early Jan. Target was last year's Dec 25.
          target = new Date(currentYear - 1, 11, 25, 0, 0, 0).getTime();
      } else if (this.getNow() > target + (365 * 24 * 60 * 60 * 1000)) { 
          // Safety fallback
          target = new Date(currentYear + 1, 11, 25, 0, 0, 0).getTime();
      }
      
      return target;
    }
  
    // Returns phase: 'WAITING', 'GROWTH', 'ZENITH', 'ETERNAL'
    getPhase() {
      const target = this.getTargetTimestamp();
      const now = this.getNow();
      const msPerDay = 24 * 60 * 60 * 1000;
      
      const diff = target - now;
      
      // Growth starts 3 days (72 hours) before target
      const startGrowth = 3 * msPerDay;
  
      // Post-Christmas (Eternal): Dec 26 onwards (Diff < -24h)
      if (diff < -msPerDay) {
          // Reset Logic check: If it's literally months later (e.g. November), return WAITING.
          // But our target logic handles "Next Year" shift only in Jan.
          // So if it's Nov, target is next Dec 25, so diff is huge positive -> WAITING.
          
          // If target is THIS Dec 25 and we are past it:
          return 'ETERNAL';
      }
  
      if (diff > startGrowth) {
        return 'WAITING';
      } else if (diff > 0) {
        return 'GROWTH';
      } else {
        // It is Dec 25th (diff <= 0 AND diff > -24h)
        return 'ZENITH';
      }
    }
  
    // Returns hours until (positive) or since (negative) Target (Dec 25 00:00)
    getHoursRemaining() {
        const target = this.getTargetTimestamp();
        const now = this.getNow();
        return (target - now) / (1000 * 60 * 60);
    }
  
    getDaysRemaining() {
      return Math.max(0, this.getHoursRemaining() / 24);
    }
  
    // Returns 0.0 to 1.0 based on the 72-hour window (Dec 22 - Dec 25)
    // Used for Tree Growth
    getProgress() {
      const phase = this.getPhase();
      if (phase === 'WAITING') return 0.0;
      if (phase === 'ZENITH' || phase === 'ETERNAL') return 1.0;
      
      const target = this.getTargetTimestamp();
      const now = this.getNow();
      const duration = 3 * 24 * 60 * 60 * 1000; // 72 hours
      const elapsed = duration - (target - now);
      
      return Math.max(0, Math.min(1, elapsed / duration));
    }
  
    // "Cheer Bloom" Variable: 0.0 at 12 hours remaining -> 1.0 at 0 hours
    getCheerLevel() {
        const h = this.getHoursRemaining();
        if (h > 12) return 0.0;
        if (h <= 0) return 1.0; // Max cheer during Zenith/Eternal
        
        // h is between 12 and 0
        return 1.0 - (h / 12);
    }
  
    // Returns the hour of day (0-24) in Local Time
    getLocalHour() {
      const now = new Date(this.getNow());
      return now.getHours() + (now.getMinutes() / 60);
    }
  
    // Debug: Set current simulated date
    // input: "2023-12-24T12:00:00" (ISO string works with new Date())
    debugSetTime(isoString) {
      const target = new Date(isoString).getTime();
      const realNow = Date.now();
      this.debugOffset = target - realNow;
      console.log("Time Travel Active. Simulated Time:", new Date(this.getNow()).toString());
    }
  
    debugReset() {
      this.debugOffset = 0;
    }
  }
  
  window.gameState = new GameState();
  