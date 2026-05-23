// balatro-cats-r717.vercel.app — game loop (excerpt)

let gold = 100;
let wave = 1;
const deck = [];

function startRun() {
    showScreen('level-select');
    resetDeck();
    gold = 100;
}

function nextTurn() {
    spawnEnemies(wave);
    resolveCombat();
    if (allEnemiesCleared()) {
        wave += 1;
        showUpgradePicker();
    }
}

function purchaseUnit(unitId) {
    if (gold < UNIT_COST[unitId]) return;
    gold -= UNIT_COST[unitId];
    deck.push(createUnit(unitId));
    renderShop();
}
