// mortytarot.vercel.app — script.js (excerpt)

import { tarotDeck } from './cards.js';

function handleCardSelect(selectedCardEl) {
    if (selectedCardEl.classList.contains('selected-glow')) return;

    soundManager.initAudio();
    soundManager.playSelect();
    deckSpreadEl.classList.add('locked');

    const randomIndex = Math.floor(Math.random() * tarotDeck.length);
    const resultCard = tarotDeck[randomIndex];

    localStorage.setItem(STORAGE_DATE_KEY, getTodayString());
    localStorage.setItem(STORAGE_CARD_KEY, resultCard.id);

    selectedCardEl.classList.add('selected-glow');
    // fade other cards → flip main card → show Morty's advice
    setTimeout(() => {
        updateCardUI(resultCard.id);
        cardElement.classList.add('is-flipped');
    }, 1500);
}
