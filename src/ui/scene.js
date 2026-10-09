import { cables, devices, portLabel, plugsInto } from '../engine.js';
import { $, svg } from './dom.js';

const calm = matchMedia('(prefers-reduced-motion: reduce)');
const isStart = (start, device, port) => start?.device === device && start?.port === port;

// Device cards with their status and port buttons, placed over the office artwork.
export function renderDevices({ live, fresh, links, start }) {
  $('#devices').innerHTML = devices
    .map(d => {
      const ports = d.ports
        .map(p => {
          const classes = [
            'port',
            isStart(start, d.id, p) && 'selected',
            links.some(r => plugsInto(r, { device: d.id, port: p })) && 'connected',
          ];
          return `<button class="${classes.filter(Boolean).join(' ')}" data-device="${d.id}" data-port="${p}" data-key="${d.id}:${p}" aria-label="${d.name} ${p} port" aria-pressed="${isStart(start, d.id, p)}">${portLabel(p)}</button>`;
        })
        .join('');
      const classes = ['device', live.has(d.id) && 'online', fresh.includes(d.id) && 'just-online'];
      return [
        `<article class="${classes.filter(Boolean).join(' ')}" style="left:${d.x}%;top:${d.y}%">`,
        `<div class="device-top"><span class="device-icon">${d.icon}</span>`,
        `<span class="status">${live.has(d.id) ? '● ONLINE' : '○ OFFLINE'}</span></div>`,
        `<button class="device-name" data-inspect="${d.id}">${d.name}</button>`,
        `<div class="ports">${ports}</div></article>`,
      ].join('');
    })
    .join('');
}

// A dot that travels along a new cable toward the device that just came online.
function packet(layer, path, color) {
  const dot = svg('circle', { r: 5, fill: color, class: 'packet' });
  const move = svg('animateMotion', { dur: '.9s', begin: 'indefinite', path });
  move.addEventListener('endEvent', () => dot.remove());
  dot.append(move);
  layer.append(dot);
  move.beginElement();
}

// Curved cables between port buttons. Call after the device cards are in the DOM.
export function drawWires(links, fresh = []) {
  const layer = $('#wires'),
    scene = $('#scene').getBoundingClientRect();
  const centre = key => {
    const r = $(`[data-key="${key}"]`).getBoundingClientRect();
    return [r.x + r.width / 2 - scene.x, r.y + r.height / 2 - scene.y];
  };
  layer.replaceChildren();
  for (const r of links) {
    const [x, y] = centre(`${r.a}:${r.ap}`),
      [xx, yy] = centre(`${r.b}:${r.bp}`),
      sag = (y + yy) / 2 + 25;
    const d = `M${x},${y} C${x},${sag} ${xx},${sag} ${xx},${yy}`;
    const color = cables.find(c => c.id === r.cable).color;
    const path = svg('path', { d, stroke: color, 'stroke-width': 3, fill: 'none', opacity: 0.75 });
    if (r.cable === 'wifi') path.setAttribute('stroke-dasharray', '5 7');
    layer.append(path);
    if (r.cable !== 'power' && fresh.includes(r.b) && !calm.matches) packet(layer, d, color);
  }
}
