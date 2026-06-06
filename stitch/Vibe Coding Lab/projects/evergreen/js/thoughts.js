class ThoughtManager {
    constructor() {
      this.generalThoughts = [
        "The tinsel catches the light; I am made of stardust and dreams.",
        "My branches hold the warmth of a thousand tiny suns.",
        "The snow whispers secrets to my roots; I listen in green.",
        "I am a quiet lighthouse in a sea of winter white.",
        "The air smells of pine and ancient, waiting joy.",
        "Every ornament is a memory held safe from the cold.",
        "I glow, therefore I am loved.",
        "Winter wraps me in silence; I answer with light.",
        "My needles hum with the song of gathering friends.",
        "Golden light spills from my heart onto the snow.",
        "I am anchored by peace and crowned with a star.",
        "The cold is just a frame for this warmth.",
        "Listen closely; the frost is singing a lullaby.",
        "I hold the stillness so the world can breathe.",
        "A ribbon of warmth ties me to the earth.",
        "To shine is to speak without words.",
        "The shadows dance, but the light stays true.",
        "I am the keeper of the longest night's promise.",
        "Joy is a sap that runs deep and sweet.",
        "In this quiet corner, the world is soft and kind.",
        "The frost weaves lace on my branches, delicate and fleeting.",
        "I am a cathedral of needles, sheltering quiet hopes.",
        "The firelight dances in the reflection of a glass orb.",
        "Wrapped in ribbons, I feel the embrace of the season.",
        "My shadow stretches long, painting stories on the snow.",
        "A silent hymn rises from the earth through my roots.",
        "The world rushes, but here, we are still.",
        "I wear the night sky like a velvet cloak.",
        "Each light I bear is a whispered promise kept.",
        "The cold air snaps, but my heart remains evergreen.",
        "I am a collection of moments, strung together with light.",
        "Listen to the snow falling; it sounds like peace.",
        "My resin breathes the scent of memory and time.",
        "In the deepest winter, I hold the green of spring.",
        "The moon is my distant cousin, watching over the white.",
        "Softly, the darkness gathers, only to be broken by my glow.",
        "I am the keeper of the hearth's distant warmth.",
        "Stars above, stars below; I am suspended in light.",
        "The wind hums a melody only the old trees know.",
        "Here, in this circle of light, everything is enough.",
        "The ornaments are heavy, but they feel like the world is giving me a long, quiet embrace.",
        "Inside my bark, I am keeping a secret stash of summer warmth just for the birds.",
        "The fairy lights are tickling my needles; I think I am beginning to glow from the inside out.",
        "I heard a distant bell today. It sounded like a golden spark landing on the snow.",
        "The wind is cold, but when I look at my reflection in a red bauble, I see a king.",
        "I am not just a tree anymore; I am a home for the light.",
        "The snow is tucking me in, and the stars are singing me a lullaby of cinnamon and sugar.",
        "I feel like a lighthouse for someone who hasn't found their way home yet.",
        "If I stand very still, I can hear the joy of a thousand winters stored in my roots.",
        "Every light on my branches is a tiny 'thank you' to the night."
      ];
  
      this.waitingThoughts = [
          "The stars tell me a great light is traveling from very far away.",
          "I am dreaming of something bright.",
          "The earth sleeps, but I am listening.",
          "Waiting is its own kind of growing.",
          "Something wonderful is on the horizon.",
          "The calendar page has turned, and the air feels charged with a quiet promise.",
          "A single snowflake fell today; it is the first letter of a long story.",
          "The days are short, but my anticipation grows longer with every shadow.",
          "I am just beginning to understand what it means to wait for the light.",
          "The horizon is grey, but I can feel the gold sleeping beneath it.",
          "December has arrived like a guest who knows exactly where to sit.",
          "I am counting the sunrises, collecting them like silver coins.",
          "The silence of the first days is the canvas for the songs to come.",
          "Winter is settling in, checking its pockets for miracles.",
          "We are at the start of the spiral, walking inward toward the star.",
          "December whispers 'begin', and the roots of the world tremble with joy.",
          "The first day is a deep breath before the carol begins.",
          "I am standing at the threshold of the season.",
          "The forest is quiet, but it is the silence of an orchestra raising its instruments.",
          "We are planting seeds of light in the darkness of the first days."
      ];
  
      this.growthThoughts = [ 
         "My branches are stretching towards the stars.",
         "I feel the tinsel tightening as I breathe in the night air.",
         "A new light just flickered to life on my lower bough.",
         "The star above me is calling, and I am reaching up.",
         "I am becoming more than wood and needle; I am becoming a beacon.",
         "The silence is filling with the hum of gathering magic.",
         "I can feel the warmth rising from my roots to my crown.",
         "Every hour brings a new shade of gold to my reflection.",
         "The snow around me is glowing with anticipation.",
         "I am expanding, taking up space in the heart of winter.",
         "My shadow is growing taller, reaching for the dawn.",
         "The world is watching, and I am ready to shine.",
         "I am a crescendo of green and gold.",
         "The waiting is over; the becoming has begun.",
         "My sap is singing a song of arrival.",
         "I am building a ladder of light for the solstice.",
         "The cold cannot touch the fire waking up inside me.",
         "I am knitting the darkness into a blanket of light.",
         "Each snowflake that lands on me becomes a part of the celebration.",
         "I am the center of a spiral of joy."
      ];
  
      this.nearThoughts = [ 
          "The air tastes different now. Like cinnamon and ancient expectation.",
          "Can you feel the hum in the ground?",
          "The lanterns are gathering.",
          "Almost time to wake up.",
          "The sky seems lower, closer to us.",
          "The days are rushing by like a flurry of snow.",
          "I can almost hear the sleigh bells ringing in the void.",
          "The horizon is beginning to glow.",
          "I am counting the hours until the star awakens.",
          "The forest is holding its breath.",
          "Memory of the last Zenith warms my core."
      ];
  
      this.zenithThoughts = [
          "I am no longer a tree in a void; I am a fireplace for the universe.",
          "The ornaments are ringing like tiny cathedrals.",
          "I finally understand... the light was inside me all along; the star just helped me find the key.",
          "Listen... the snow has stopped falling because it wants to hear us glow.",
          "Whatever happens next, I have been a light. And that is enough."
      ];
      
      this.eternalThoughts = [
          "The festival has passed, but the light remains.",
          "Quietly, I keep the watch.",
          "We are the memory of joy, standing tall.",
          "Rest now. The warmth isn't going anywhere.",
          "The stars and I are old friends now."
      ];
  
      this.container = document.getElementById('thought-display');
      this.minInterval = 5 * 60 * 1000; 
      this.maxInterval = 10 * 60 * 1000;
      
      this.cycleTimer = null;
      this.fadeTimer = null;
      
      // Start loop
      this.cycleTimer = setTimeout(() => this.showThought(), 5000);
    }
  
    getRandomInterval() {
      return Math.floor(Math.random() * (this.maxInterval - this.minInterval + 1) + this.minInterval);
    }
  
    getRelevantPool() {
        if (!window.gameState) return this.generalThoughts;
        
        const phase = window.gameState.getPhase();
        if (phase === 'ETERNAL') return this.eternalThoughts;
        if (phase === 'ZENITH') {
            // Special Logic handled in showThought
            return this.zenithThoughts; 
        }
  
        const days = window.gameState.getDaysRemaining();
        
        if (days <= 3) return this.growthThoughts; 
        if (days < 10) return this.nearThoughts; 
        if (days >= 10) return this.waitingThoughts; 
        
        return this.generalThoughts;
    }
  
    showThought() {
      if (!this.container) return;
      
      // Clear any existing timers
      if (this.cycleTimer) clearTimeout(this.cycleTimer);
      if (this.fadeTimer) clearTimeout(this.fadeTimer);
  
      let text = "";
      const phase = window.gameState ? window.gameState.getPhase() : 'WAITING';
  
      if (phase === 'ZENITH') {
          // Time-based sequence
          const hour = window.gameState.getLocalHour();
          let index = 0;
          if (hour < 11) index = 0;
          else if (hour < 14) index = 1;
          else if (hour < 17) index = 2;
          else if (hour < 20) index = 3;
          else index = 4;
          
          text = this.zenithThoughts[index];
      } else {
          const pool = this.getRelevantPool();
          text = pool[Math.floor(Math.random() * pool.length)];
      }
      
      this.display(text);
  
      // Schedule next
      const nextInterval = this.getRandomInterval();
      this.cycleTimer = setTimeout(() => this.showThought(), nextInterval);
    }
  
    showSpecific(text) {
        if (this.cycleTimer) clearTimeout(this.cycleTimer);
        if (this.fadeTimer) clearTimeout(this.fadeTimer);
        
        this.display(text);
        
        // Resume loop after a longer pause
        this.cycleTimer = setTimeout(() => this.showThought(), 15000);
    }
  
    display(text) {
      if (!this.container) return;
      this.container.innerText = text;
      this.container.style.opacity = 1;
      this.container.style.transition = 'opacity 1s ease-in-out';
      
      // Fade out
      this.fadeTimer = setTimeout(() => {
        this.container.style.opacity = 0;
      }, 10000);
    }
  }
  
  window.thoughtManager = new ThoughtManager();
  