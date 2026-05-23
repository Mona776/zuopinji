// butterfly-jsyg.vercel.app — inline module (excerpt)

import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

const handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
        modelAssetPath: "…/hand_landmarker.task",
        delegate: "GPU",
    },
    runningMode: "VIDEO",
    numHands: 2,
});

function drawHand(results) {
    results.landmarks?.forEach((landmarks) => {
        const indexTip = landmarks[8];
        const tx = (1 - indexTip.x) * canvas.width;
        const ty = indexTip.y * canvas.height;
        const velocity = Math.hypot(tx - lastPos.x, ty - lastPos.y);

        audioSystem.play(tx, ty, velocity);
        trajectoryParticles.push(new TrajectoryParticle(ctx, tx, ty, PURE_WHITE));

        if (Math.random() > 0.94) {
            butterflies.push(new Butterfly(ctx, tx, ty, { color: PURE_CYAN }));
        }
    });
}
