// Small SVG illustration for a cable or tool button.
export function cableArt(c) {
  if (c.id === 'unplug')
    return `<svg viewBox="0 0 110 75"><path d="M8 40H38M72 40H102" stroke="#50a7ff" stroke-width="7" stroke-linecap="round"/><rect x="30" y="28" width="16" height="24" rx="3" fill="#b9c4d0"/><rect x="64" y="28" width="16" height="24" rx="3" fill="#b9c4d0"/><path d="M55 14V26M47 18l4 7M63 18l-4 7M55 66V54M47 62l4-7M63 62l-4-7" stroke="${c.color}" stroke-width="4" stroke-linecap="round"/></svg>`;
  if (c.id === 'tools')
    return `<svg viewBox="0 0 110 75"><rect x="17" y="25" width="78" height="42" rx="5" fill="#252d34" stroke="#647886"/><path d="M40 27V15H72V27" fill="none" stroke="#eb534a" stroke-width="7"/><path d="M34 36L33 57M56 34L57 60M77 36L75 58" stroke="#b9c4cc" stroke-width="4"/><path d="M31 50L31 61M54 50L54 63M76 49L76 62" stroke="#e95d50" stroke-width="7"/></svg>`;
  if (c.id === 'wifi')
    return `<svg viewBox="0 0 110 75"><path d="M18 27Q55 -4 92 27M31 40Q55 18 79 40M44 52Q55 42 66 52" fill="none" stroke="${c.color}" stroke-width="7" stroke-linecap="round"/><circle cx="55" cy="65" r="6" fill="${c.color}"/></svg>`;
  return `<svg viewBox="0 0 110 75"><defs><linearGradient id="coil-${c.id}" x2="0" y2="1"><stop stop-color="${c.color}"/><stop offset=".5" stop-color="${c.color}"/><stop offset="1" stop-color="#122737"/></linearGradient></defs><ellipse cx="54" cy="34" rx="37" ry="24" fill="#080d15" stroke="#07131c" stroke-width="8"/>${[0, 1, 2, 3].map(i => `<ellipse cx="54" cy="${32 + i * 2}" rx="${37 - i * 3}" ry="${23 - i * 3}" fill="none" stroke="url(#coil-${c.id})" stroke-width="3"/>`).join('')}<path d="M20 41Q14 53 24 62M86 40Q99 50 88 60" fill="none" stroke="${c.color}" stroke-width="5"/><path d="M20 58l6 9M86 58l-5 9" stroke="#b9c4d0" stroke-width="9"/><path d="M20 58l6 9M86 58l-5 9" stroke="#e7d7a1" stroke-width="3"/></svg>`;
}
