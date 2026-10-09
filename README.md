# IT Master — Network Lab

A playable browser IT training game inspired by the supplied office-network reference image. Built with native JavaScript, CSS, and SVG; no runtime dependencies or build step.

## Play locally

Requires Node.js 22 or later.

```sh
npm start
```

Open http://localhost:5173. Pick a mission from **Missions ☰**, select a cable, then click a source port and a destination port. Device names open the inspector. Use hints, undo mistakes, or restart a mission. Progress and best scores persist in local storage. Run `npm test` for the network and mission logic tests.

## Missions

There are 30 missions in four tracks, all in the same office:

- **Installs (1–10):** bring up one piece at a time, from the fiber handoff to PoE phones, cameras, and Wi-Fi.
- **Builds (11–15):** larger jobs such as building the comms closet, putting everything on the UPS, or wiring the whole office from scratch.
- **Outages (16–21):** the office is mostly wired, but something was unplugged. Read the online/offline status to find it.
- **Troubleshooting (22–30):** wrong cables are already in place (modem on the router LAN, a PoE camera on the router, an RJ11 cord in an Ethernet port). Select **Unplug** and click both ends of a bad cable, then wire it correctly.

A ★ in the mission list means the mission was finished with no mistakes or hints.

This is a simplified simulation: the ISP handoff and UPS start operational; the switch provides PoE; the laptop has battery power. DHCP, VLANs, switch port allocation, power budgets, and wireless authentication are not simulated. Shared ETH and PWR buttons on the switch and UPS represent multiple available ports/outlets. HDMI, console USB, and analog RJ11 are learning distractors. The Tools item gives a diagnostic hint. The patch panel is visible rack infrastructure; port allocation comes in a later level.

## Structure

Game rules are plain modules with no DOM access, so they run under `node --test`. The UI layer under `src/ui/` only renders state and reports clicks back to `src/app.js`.

- `src/engine.js`: cables, devices (with scene positions), the office's correct links, and online reachability
- `src/missions.js`: the 30 missions, written with link ids such as `'switch-pc'` or `'ups-router'`
- `src/game.js`: mission state: connect, unplug, undo, hints, completion, best scores
- `src/app.js`: entry point that holds state and wires DOM events to the game rules
- `src/ui/scene.js`: device cards, port buttons and SVG cables over the office artwork
- `src/ui/hud.js`: mission panel, progress and the cable tray
- `src/ui/dialogs.js`: mission complete and mission list dialogs
- `src/ui/storage.js`: saved progress in local storage
- `src/ui/art.js`: cable and tool illustrations
- `style.css`: office scene, floating HUD, and cable tray
- `public/office.png`: generated office artwork
- `docs/artwork.md`: artwork generation prompt and provenance
- `tests/`: unit tests for connection rules, mission data, and a hint-driven solve of every mission
- `e2e/`: Playwright tests that play missions in a real browser

## Development

```sh
npm install        # dev tools only: Prettier and Playwright
npm test           # unit tests, no install needed
npm run test:e2e   # browser tests (run `npx playwright install chromium` once)
npm run format     # format with Prettier
```

## Next levels

1. Patch panels and physical port allocation
2. DHCP and static addressing
3. VLAN segmentation and trunk links
4. Troubleshoot bad cables, DNS, and gateway settings

## GitHub

Repository: https://github.com/ElSpaniard97/it-master

GitHub Actions runs the network logic tests on pushes and pull requests.

The office uses a fixed scene coordinate system. Narrow screens can scroll horizontally to reach all equipment. Use **Ports: on** to switch to hover/focus port labels for a cleaner view.
