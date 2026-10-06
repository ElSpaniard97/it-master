# IT Master — Network Lab

A playable browser IT training game inspired by the supplied office-network reference image. Built with native JavaScript, CSS, and SVG; no runtime dependencies or build step.

## Play locally

Requires Node.js 22 or later.

```sh
npm start
```

Open http://localhost:5173. Select a connection type, click a source port, then a destination port. Device names open the inspector. Use hints to learn the topology, undo mistakes, or restart. Progress persists in local storage. Run `npm test` for network logic tests.

## Level 01

Connect ISP fiber → modem/ONT → router WAN; router LAN → PoE switch; switch → desktop, access point, VoIP phone, IP camera, and printer. Connect the laptop to the AP using Wi-Fi. Supply the modem, router, switch, desktop, and printer from the UPS. Complete all 14 links to win.

This is a simplified simulation: the ISP handoff and UPS start operational; the switch provides PoE; the laptop has battery power. DHCP, VLANs, switch port allocation, power budgets, and wireless authentication are not simulated. Shared ETH and PWR buttons represent multiple available ports/outlets. HDMI is an intentional distractor.

## Structure

- `src/engine.js`: devices, connection rules, and online reachability
- `src/app.js`: game interactions, saved progress, and SVG cables
- `style.css`: responsive lab interface
- `tests/engine.test.js`: connection and power dependency tests

## Next levels

1. Patch panels and physical port allocation
2. DHCP and static addressing
3. VLAN segmentation and trunk links
4. Troubleshoot bad cables, DNS, and gateway settings

## GitHub

Repository: https://github.com/ElSpaniard97/it-master

GitHub Actions runs the network logic tests on pushes and pull requests.
