// Built-in Pixel Assets (SVG Data URIs)
// Vector graphics for guaranteed display in any environment

// Helper to create base64 SVG
const svg = (content) => `data:image/svg+xml;base64,${btoa(content)}`;

export const PIXEL_ICONS = {
  // UI Icons
  // Backpack: Brown leather bag
  backpack: svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="4" y="8" width="24" height="20" rx="4" fill="#8d6e63"/><path d="M10 8 V4 H22 V8" fill="none" stroke="#5d4037" stroke-width="3"/><rect x="12" y="14" width="8" height="8" fill="#5d4037"/></svg>`),
  
  // Shop: Wood sign with 'SHOP' text
  shop: svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="2" y="6" width="28" height="14" fill="#d7ccc8" stroke="#5d4037" stroke-width="2"/><text x="16" y="17" font-family="monospace" font-size="10" text-anchor="middle" fill="#5d4037" font-weight="bold">SHOP</text><rect x="14" y="20" width="4" height="12" fill="#5d4037"/></svg>`),
  
  // Crystal: Blue diamond
  crystal: svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M16 4 L26 14 L16 28 L6 14 Z" fill="#00bfff" stroke="#0091ea" stroke-width="1"/><path d="M6 14 L26 14" stroke="#0091ea" stroke-width="1" opacity="0.5"/></svg>`),
  
  // Crops
  // Sunflower: Yellow petals, brown center
  sunflower: svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="12" r="6" fill="#6d4c41"/><path d="M16 2 L19 9 L26 6 L22 12 L28 16 L22 20 L26 26 L19 23 L16 30 L13 23 L6 26 L10 20 L4 16 L10 12 L6 6 L13 9 Z" fill="#ffeb3b"/><rect x="15" y="22" width="2" height="10" fill="#4caf50"/></svg>`),
  
  // Mushroom: Red cap with dots
  mushroom: svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M6 16 Q16 2 26 16 Z" fill="#f44336"/><circle cx="12" cy="12" r="2" fill="white"/><circle cx="20" cy="10" r="1.5" fill="white"/><path d="M12 16 Q12 28 16 28 Q20 28 20 16 Z" fill="#fff3e0"/></svg>`),
  
  // Tulip: Pink flower
  tulip: svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M10 8 Q10 18 16 18 Q22 18 22 8 Q16 14 10 8 Z" fill="#e91e63"/><rect x="15" y="18" width="2" height="14" fill="#4caf50"/><path d="M15 26 Q10 22 10 20" fill="none" stroke="#4caf50" stroke-width="2"/></svg>`),

  // Seeds: Brown dots
  seed_sunflower: svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="12" cy="16" r="3" fill="#ffeb3b" stroke="#fbc02d"/><circle cx="20" cy="14" r="3" fill="#ffeb3b" stroke="#fbc02d"/><circle cx="16" cy="22" r="3" fill="#ffeb3b" stroke="#fbc02d"/></svg>`),
  seed_mushroom: svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="12" cy="16" r="3" fill="#f44336" stroke="#d32f2f"/><circle cx="20" cy="14" r="3" fill="#f44336" stroke="#d32f2f"/><circle cx="16" cy="22" r="3" fill="#f44336" stroke="#d32f2f"/></svg>`),
  seed_tulip: svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="12" cy="16" r="3" fill="#e91e63" stroke="#c2185b"/><circle cx="20" cy="14" r="3" fill="#e91e63" stroke="#c2185b"/><circle cx="16" cy="22" r="3" fill="#e91e63" stroke="#c2185b"/></svg>`),

  // Tool
  hoe: svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M24 6 L24 14 L18 14" fill="none" stroke="#9e9e9e" stroke-width="4"/><line x1="18" y1="12" x2="6" y2="28" stroke="#795548" stroke-width="3"/></svg>`),

  // Background pattern - Pixel stone/brick texture
  backgroundTile: svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <defs>
      <pattern id="noise" patternUnits="userSpaceOnUse" width="4" height="4">
        <rect x="0" y="0" width="2" height="2" fill="#3a3a3a"/>
        <rect x="2" y="2" width="2" height="2" fill="#3a3a3a"/>
      </pattern>
    </defs>
    <rect width="32" height="32" fill="#2d2d2d"/>
    <rect x="1" y="1" width="14" height="6" fill="#3d3d3d" rx="1"/>
    <rect x="17" y="1" width="14" height="6" fill="#353535" rx="1"/>
    <rect x="1" y="9" width="7" height="6" fill="#383838" rx="1"/>
    <rect x="10" y="9" width="12" height="6" fill="#3a3a3a" rx="1"/>
    <rect x="24" y="9" width="7" height="6" fill="#333333" rx="1"/>
    <rect x="1" y="17" width="14" height="6" fill="#363636" rx="1"/>
    <rect x="17" y="17" width="14" height="6" fill="#3b3b3b" rx="1"/>
    <rect x="1" y="25" width="9" height="6" fill="#343434" rx="1"/>
    <rect x="12" y="25" width="10" height="6" fill="#393939" rx="1"/>
    <rect x="24" y="25" width="7" height="6" fill="#373737" rx="1"/>
  </svg>`)
};