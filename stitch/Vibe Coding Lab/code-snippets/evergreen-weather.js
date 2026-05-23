// mona-exe-evergreen.vercel.app — js/weather.js (excerpt)

class WeatherSystem {
    constructor(scene) {
        this.scene = scene;
        this.activeType = 'WHITE'; // 'WHITE', 'TRANSITION_TO_GOLD', 'GOLD'

        this.particleCount = 1500;
        this.particles = null;
        this.goldParticleCount = 1500;
        this.windStrength = 0.01;
        this.fallSpeed = 1.0;

        this.init();
    }

    triggerGoldSnow() {
        if (this.revertTimer) clearTimeout(this.revertTimer);
        this.activeType = 'TRANSITION_TO_GOLD';
        // particle color / velocity transition…
    }
}
