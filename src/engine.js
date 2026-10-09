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
export const devices = [
  {
    id: 'isp',
    name: 'Internet provider',
    icon: '◎',
    x: 4,
    y: 9,
    ports: ['fiber'],
    info: 'The optical internet handoff. Start your uplink here.',
  },
  {
    id: 'modem',
    name: 'Modem / ONT',
    icon: '▤',
    x: 4,
    y: 38,
    ports: ['fiber', 'eth', 'power'],
    info: 'Converts the optical handoff into Ethernet for the router.',
  },
  {
    id: 'router',
    name: 'Router',
    icon: '⌁',
    x: 25,
    y: 38,
    ports: ['wan', 'lan', 'power'],
    info: 'WAN faces the modem. LAN faces the office switch.',
  },
  {
    id: 'ups',
    name: 'UPS',
    icon: 'ϟ',
    x: 4,
    y: 73,
    ports: ['power'],
    info: 'Backup power is available. Supply all five mains-powered devices.',
  },
  {
    id: 'switch',
    name: 'PoE switch',
    icon: '▦',
    x: 47,
    y: 38,
    ports: ['eth', 'power'],
    info: 'Connect the router and wired endpoints here. PoE supplies power to the AP, phone, and camera.',
  },
  {
    id: 'ap',
    name: 'Access point',
    icon: '◉',
    x: 47,
    y: 9,
    ports: ['eth', 'wifi'],
    info: 'Ethernet to the PoE switch; Wi-Fi to the laptop.',
  },
  {
    id: 'pc',
    name: 'Desktop PC',
    icon: '▣',
    x: 71,
    y: 9,
    ports: ['eth', 'power'],
    info: 'Needs Ethernet and UPS power to get online.',
  },
  {
    id: 'phone',
    name: 'VoIP phone',
    icon: '☎',
    x: 71,
    y: 38,
    ports: ['eth'],
    info: 'A PoE phone: one Ethernet link provides data and power.',
  },
  {
    id: 'camera',
    name: 'IP camera',
    icon: '◈',
    x: 71,
    y: 73,
    ports: ['eth'],
    info: 'A PoE camera: Ethernet provides data and power.',
  },
  {
    id: 'printer',
    name: 'Network printer',
    icon: '▧',
    x: 47,
    y: 73,
    ports: ['eth', 'power'],
    info: 'Needs a wired network connection and UPS power.',
  },
  {
    id: 'laptop',
    name: 'Laptop',
    icon: '▱',
    x: 25,
    y: 9,
    ports: ['wifi'],
    info: 'Battery-powered. Join the office access point over Wi-Fi.',
  },
];
const link = (a, ap, b, bp, cable, lesson) => ({ a, ap, b, bp, cable, lesson });
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
      id === 'ap' || id === 'phone' || id === 'camera'
        ? 'PoE carries data and power over the same Ethernet cable.'
        : 'The endpoint joins the wired LAN.',
    ),
  ),
  link('ap', 'wifi', 'laptop', 'wifi', 'wifi', 'The laptop joins Wi-Fi through the access point.'),
  ...['modem', 'router', 'switch', 'pc', 'printer'].map(id =>
    link('ups', 'power', id, 'power', 'power', 'The UPS provides backup power.'),
  ),
];
export function match(a, b, cable) {
  return required.findIndex(
    r =>
      r.cable === cable &&
      ((r.a === a.device && r.ap === a.port && r.b === b.device && r.bp === b.port) ||
        (r.b === a.device && r.bp === a.port && r.a === b.device && r.ap === b.port)),
  );
}
export function online(connected) {
  const edges = required.filter((_, i) => connected.includes(i));
  const powered = id => edges.some(r => r.cable === 'power' && (r.a === id || r.b === id));
  const reachable = new Set(['isp', 'ups']);
  let changed = true;
  while (changed) {
    changed = false;
    for (const r of edges) {
      if (r.cable === 'power') continue;
      for (const [a, b] of [
        [r.a, r.b],
        [r.b, r.a],
      ]) {
        const needsPower = ['modem', 'router', 'switch', 'pc', 'printer'].includes(b);
        if (reachable.has(a) && (!needsPower || powered(b)) && !reachable.has(b)) {
          reachable.add(b);
          changed = true;
        }
      }
    }
  }
  return reachable;
}
export function diagnose(a, b, cable) {
  const c = cables.find(c => c.id === cable);
  if (a.device === b.device)
    return 'Both ends are on the same device. Connect a port to a port on another device.';
  if (!required.some(r => r.cable === cable))
    return `${c.name} is not part of this network. ${c.description}`;
  const pair = r =>
    (r.a === a.device && r.ap === a.port && r.b === b.device && r.bp === b.port) ||
    (r.b === a.device && r.bp === a.port && r.a === b.device && r.ap === b.port);
  const right = required.find(pair);
  if (right)
    return `Right ports, wrong cable. These two ports need a different cable than ${c.name}.`;
  const fits = e =>
    required.some(
      r =>
        r.cable === cable &&
        ((r.a === e.device && r.ap === e.port) || (r.b === e.device && r.bp === e.port)),
    );
  const bad = [a, b].find(e => !fits(e));
  if (bad) {
    const d = devices.find(d => d.id === bad.device);
    return `The ${d.name} ${bad.port === 'power' ? 'PWR' : bad.port.toUpperCase()} port does not accept ${c.name}.`;
  }
  return 'Both ports take that cable, but those two devices do not connect directly. Trace where each one sits in the network.';
}
