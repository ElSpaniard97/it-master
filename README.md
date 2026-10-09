# IT Master — Network Lab

A playable browser IT training game inspired by the supplied office-network reference image. Built with native JavaScript, CSS, and SVG; no runtime dependencies or build step.

## Play locally

Requires Node.js 22 or later.

```sh
npm start
```

Open http://localhost:5173. Pick a mission from **Missions ☰**, select a cable, then click a source port and a destination port. Device names open the inspector. Use hints, undo mistakes, or restart a mission. Progress, best scores and the sound setting persist in local storage. Run `npm test` for the network and mission logic tests.

On a phone, the mission and controls stack above and below the office, which scrolls sideways on its own.

## Chapters and missions

There are 37 missions in five chapters, all in the same office. Chapter 1 is open from the start; each later chapter unlocks once every mission in the chapter before it is finished.

1. **Installs (1–10):** bring up one piece at a time, from the fiber handoff to PoE phones, cameras, and Wi-Fi.
2. **Builds (11–15):** larger jobs such as building the comms closet, putting everything on the UPS, or wiring the whole office from scratch.
3. **Outages (16–21):** the office is mostly wired, but something was unplugged. Read the online/offline status to find it.
4. **Troubleshooting (22–30):** wrong cables are already in place (modem on the router LAN, a PoE camera on the router, an RJ11 cord in an Ethernet port). Select **Unplug** and click both ends of a bad cable, then wire it correctly.
5. **Patch panel (31–37):** structured cabling. Each desk is cabled through the walls to a labeled jack on the patch panel (J1 camera, J2 desktop, J3 access point, J4 printer, J5 phone, J6 spare), and desks reach the switch only through a patch cord on the right jack. Missions cover patching jacks, a cord on the dead spare jack, an RJ11 cord in the rack, terminating a new drop, and cabling the office from scratch.

Each finished mission earns stars: ★★★ with no mistakes or hints, ★★ with two slips at most, ★ otherwise. The mission list keeps your best per mission and totals per chapter.

This is a simplified simulation: the ISP handoff and UPS start operational; the switch provides PoE; the laptop has battery power. DHCP, VLANs, switch port allocation, power budgets, and wireless authentication are not simulated. Shared ETH and PWR buttons on the switch and UPS represent multiple available ports/outlets. HDMI, console USB, and analog RJ11 are learning distractors. The Tools item gives a diagnostic hint. The patch panel is passive: it never shows as online, and each jack carries signal only between its own wall run and patch cord.

## Structure

Game rules are plain modules with no DOM access, so they run under `node --test`. The UI layer under `src/ui/` only renders state and reports clicks back to `src/app.js`.

- `src/engine.js`: cables, devices (with scene positions), the office's correct links, and online reachability
- `src/missions.js`: the 37 missions, written with link ids such as `'switch-pc'` or `'switch-j2'`
- `src/progress.js`: chapters, star ratings, unlocks and which mission comes next
- `src/game.js`: mission state: connect, unplug, undo, hints, completion, best scores
- `src/app.js`: entry point that holds state and wires DOM events to the game rules
- `src/ui/scene.js`: device cards, port buttons and SVG cables over the office artwork
- `src/ui/hud.js`: mission panel, progress and the cable tray
- `src/ui/dialogs.js`: mission complete and mission list dialogs
- `src/ui/storage.js`: saved progress in local storage
- `src/ui/art.js`: cable and tool illustrations
- `src/ui/sound.js`: synthesized sound effects and the sound setting
- `style.css`: office scene, floating HUD, and cable tray
- `public/office.png`: generated office artwork
- `docs/artwork.md`: artwork generation prompt and provenance
- `tests/`: unit tests for connection rules, patch panel jacks, mission data, chapters and stars, and a hint-driven solve of every mission
- `e2e/`: Playwright tests that play missions in a real browser, including chapter unlocks, the patch panel and a phone-sized screen

## Development

```sh
npm install        # dev tools only: Prettier and Playwright
npm test           # unit tests, no install needed
npm run test:e2e   # browser tests (run `npx playwright install chromium` once)
npm run format     # format with Prettier
```

## Next levels

1. DHCP and static addressing
2. VLAN segmentation and trunk links
3. Troubleshoot DNS and gateway settings

## GitHub

Repository: https://github.com/ElSpaniard97/it-master

GitHub Actions runs the network logic tests on pushes and pull requests.

Use **Ports: on** to switch to hover/focus port labels for a cleaner view, and **Sound: on** to mute the sound effects.
