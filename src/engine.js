export const cables = [
  {
    id: 'fiber',
    name: 'Fiber',
    color: '#f9c74f',
    description: 'Connect the ISP optical handoff to the modem.',
  },
  {
    id: 'ethernet',
    name: 'Ethernet',
    color: '#50a7ff',
    description:
      'Carry network traffic. The PoE switch also powers the access point, phone, and camera.',
  },
  {
    id: 'power',
    name: 'Power',
    color: '#ff7184',
    description: 'Supply the modem, router, switch, desktop, and printer from the UPS.',
  },
  {
    id: 'wifi',
    name: 'Wi-Fi',
    color: '#ac95ff',
    description: 'Join the laptop to the access point wirelessly.',
  },
  {
    id: 'hdmi',
    name: 'HDMI',
    color: '#aab8c9',
    description: 'Carries video to a display. No display connection is needed for this mission.',
  },
  {
    id: 'console',
    name: 'Console',
    color: '#b9c4d0',
    description:
      'A USB console cable configures network equipment. Configuration is automatic in Level 1.',
  },
  {
    id: 'phone',
    name: 'Phone',
    color: '#80d6f6',
    description: 'RJ11 is for analog phones. This office uses an Ethernet VoIP phone.',
  },
  {
    id: 'unplug',
    name: 'Unplug',
    color: '#ffb347',
    description: 'Remove a cable: select Unplug, then click both ends of the cable.',
  },
  {
    id: 'tools',
    name: 'Tools',
    color: '#ff725f',
    description: 'Inspect the next missing connection with the diagnostic hint tool.',
  },
];
// Scene positions (x, y) are percentages of the office artwork. `mains` devices need UPS power.
// `passive` devices (the patch panel) pass signal jack by jack and are never online themselves.
export const devices = [
  {
    id: 'isp',
    name: 'Internet provider',
    icon: '◎',
    x: 27,
    y: 28,
    ports: ['fiber'],
    info: 'The optical internet handoff. Start your uplink here.',
  },
  {
    id: 'modem',
    name: 'Modem / ONT',
    icon: '▤',
    x: 18,
    y: 48,
    mains: true,
    ports: ['fiber', 'eth', 'power'],
    info: 'Converts the optical handoff into Ethernet for the router.',
  },
  {
    id: 'router',
    name: 'Router',
    icon: '⌁',
    x: 29,
    y: 49,
    mains: true,
    ports: ['wan', 'lan', 'power'],
    info: 'WAN faces the modem. LAN faces the office switch.',
  },
  {
    id: 'ups',
    name: 'UPS',
    icon: 'ϟ',
    x: 44,
    y: 65,
    ports: ['power'],
    info: 'Backup power is available. Supply all five mains-powered devices.',
  },
  {
    id: 'switch',
    name: 'PoE switch',
    icon: '▦',
    x: 44,
    y: 26,
    mains: true,
    ports: ['eth', 'power'],
    info: 'Connect the router and wired endpoints here. PoE supplies power to the AP, phone, and camera.',
  },
  {
    id: 'ap',
    name: 'Access point',
    icon: '◉',
    x: 66,
    y: 31,
    ports: ['eth', 'wifi'],
    info: 'Ethernet to the PoE switch; Wi-Fi to the laptop.',
  },
  {
    id: 'pc',
    name: 'Desktop PC',
    icon: '▣',
    x: 63,
    y: 58,
    mains: true,
    ports: ['eth', 'power'],
    info: 'Needs Ethernet and UPS power to get online.',
  },
  {
    id: 'phone',
    name: 'VoIP phone',
    icon: '☎',
    x: 78,
    y: 62,
    ports: ['eth'],
    info: 'A PoE phone: one Ethernet link provides data and power.',
  },
  {
    id: 'camera',
    name: 'IP camera',
    icon: '◈',
    x: 86,
    y: 30,
    ports: ['eth'],
    info: 'A PoE camera: Ethernet provides data and power.',
  },
  {
    id: 'printer',
    name: 'Network printer',
    icon: '▧',
    x: 89,
    y: 65,
    mains: true,
    ports: ['eth', 'power'],
    info: 'Needs a wired network connection and UPS power.',
  },
  {
    id: 'laptop',
    name: 'Laptop',
    icon: '▱',
    x: 18,
    y: 77,
    ports: ['wifi'],
    info: 'Battery-powered. Join the office access point over Wi-Fi.',
  },
  {
    id: 'patch',
    name: 'Patch panel',
    icon: '▥',
    x: 44,
    y: 42,
    passive: true,
    ports: ['j1', 'j2', 'j3', 'j4', 'j5', 'j6'],
    info: 'Each jack is cabled through the walls to one desk. Labels: J1 IP camera, J2 desktop PC, J3 access point, J4 printer, J5 VoIP phone, J6 spare.',
  },
];
// Helpers shared by the engine, game rules and UI.
export const portLabel = p => (p === 'power' ? 'PWR' : p.toUpperCase());
export const deviceById = id => devices.find(d => d.id === id);
export const cableById = id => cables.find(c => c.id === id);
// Does link r run between ends a and b (either direction)?
export const joins = (r, a, b) =>
  (r.a === a.device && r.ap === a.port && r.b === b.device && r.bp === b.port) ||
  (r.b === a.device && r.bp === a.port && r.a === b.device && r.ap === b.port);
// Does link r plug into end e?
export const plugsInto = (r, e) =>
  (r.a === e.device && r.ap === e.port) || (r.b === e.device && r.bp === e.port);

const link = (a, ap, b, bp, cable, lesson, id = `${a}-${b}`) => ({
  id,
  a,
  ap,
  b,
  bp,
  cable,
  lesson,
});
// Which desk each patch panel jack is cabled to. J6 is a spare with nothing behind it.
export const jacks = { j1: 'camera', j2: 'pc', j3: 'ap', j4: 'printer', j5: 'phone', j6: null };
const wired = Object.entries(jacks).filter(([, id]) => id);
const POE = ['ap', 'phone', 'camera'];
// Every correct link in the office. Ids are `<from>-<to>`, e.g. 'switch-pc' or 'ups-router'.
export const required = [
  link('isp', 'fiber', 'modem', 'fiber', 'fiber', 'Optical service reaches the modem.'),
  link('modem', 'eth', 'router', 'wan', 'ethernet', 'The modem connects to the router WAN port.'),
  link('router', 'lan', 'switch', 'eth', 'ethernet', 'The router LAN feeds the office switch.'),
  ...['ap', 'pc', 'phone', 'camera', 'printer'].map(id =>
    link(
      'switch',
      'eth',
      id,
      'eth',
      'ethernet',
      POE.includes(id)
        ? 'PoE carries data and power over the same Ethernet cable.'
        : 'The endpoint joins the wired LAN.',
    ),
  ),
  link('ap', 'wifi', 'laptop', 'wifi', 'wifi', 'The laptop joins Wi-Fi through the access point.'),
  ...devices
    .filter(d => d.mains)
    .map(d => link('ups', 'power', d.id, 'power', 'power', 'The UPS provides backup power.')),
  // Structured cabling. New links go at the end so saved indices stay valid.
  // Horizontal runs ('patch-pc') go through the walls; patch cords ('switch-j2') go in the rack.
  ...wired.map(([jack, id]) =>
    link(
      'patch',
      jack,
      id,
      'eth',
      'ethernet',
      `The wall run from ${jack.toUpperCase()} reaches the desk.`,
    ),
  ),
  ...wired.map(([jack]) =>
    link(
      'switch',
      'eth',
      'patch',
      jack,
      'ethernet',
      `A patch cord connects ${jack.toUpperCase()} to the switch.`,
      `switch-${jack}`,
    ),
  ),
];

// Index of a link by its id. Saved games store indices, so the order of `required` must not change.
export function linkIndex(id) {
  const i = required.findIndex(r => r.id === id);
  if (i < 0) throw new Error(`Unknown link: ${id}`);
  return i;
}

export function match(a, b, cable) {
  return required.findIndex(r => r.cable === cable && joins(r, a, b));
}

// Devices reachable from the ISP over the connected links. Mains devices also need power.
// Each jack of a passive device is its own node, so signal never crosses between jacks.
export function online(connected) {
  const edges = required.filter((_, i) => connected.includes(i));
  const powered = id => edges.some(r => r.cable === 'power' && (r.a === id || r.b === id));
  const node = (device, port) => (deviceById(device).passive ? `${device}:${port}` : device);
  const reachable = new Set(['isp', 'ups']);
  let changed = true;
  while (changed) {
    changed = false;
    for (const r of edges) {
      if (r.cable === 'power') continue;
      for (const [a, b] of [
        [node(r.a, r.ap), node(r.b, r.bp)],
        [node(r.b, r.bp), node(r.a, r.ap)],
      ]) {
        const needsPower = deviceById(b.split(':')[0]).mains;
        if (reachable.has(a) && (!needsPower || powered(b)) && !reachable.has(b)) {
          reachable.add(b);
          changed = true;
        }
      }
    }
  }
  // A passive device shows as online when any of its jacks carries signal.
  return new Set([...reachable].map(n => n.split(':')[0]));
}

// Explain why a connection attempt does not match any required link.
export function diagnose(a, b, cable) {
  const c = cableById(cable);
  if (a.device === b.device)
    return 'Both ends are on the same device. Connect a port to a port on another device.';
  if (!required.some(r => r.cable === cable))
    return `${c.name} is not part of this network. ${c.description}`;
  if (required.some(r => joins(r, a, b)))
    return `Right ports, wrong cable. These two ports need a different cable than ${c.name}.`;
  const jack = [a, b].find(e => e.device === 'patch');
  if (jack && cable === 'ethernet') {
    const desk = jacks[jack.port];
    if (!desk) return `${portLabel(jack.port)} is a spare jack. No cable runs behind it.`;
    const other = a === jack ? b : a;
    if (other.device !== 'switch')
      return `${portLabel(jack.port)} is labeled for the ${deviceById(desk).name}. Check the panel labels.`;
  }
  const fits = e => required.some(r => r.cable === cable && plugsInto(r, e));
  const bad = [a, b].find(e => !fits(e));
  if (bad)
    return `The ${deviceById(bad.device).name} ${portLabel(bad.port)} port does not accept ${c.name}.`;
  return 'Both ports take that cable, but those two devices do not connect directly. Trace where each one sits in the network.';
}
