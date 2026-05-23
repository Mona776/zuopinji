// duck-rho-henna.vercel.app — inline module (excerpt)

// MediaPipe Hands → crosshair follows index tip
function onResults(results) {
    const indexTip = landmarks[8];
    aimX = (1 - indexTip.x) * width;
    aimY = indexTip.y * height;
    // thumb bent → fire(); muzzle to sky → reload();
}

// Retro duck hunt loop: spawn ducks, 60s timer, score on hit
