import test from 'node:test';
import assert from 'node:assert/strict';
import { required, match, online, diagnose, linkIndex } from '../src/engine.js';
test('every required link accepts either direction and rejects wrong cable', () => {
  required.forEach((r, i) => {
    const a = { device: r.a, port: r.ap },
      b = { device: r.b, port: r.bp };
    assert.equal(match(a, b, r.cable), i);
    assert.equal(match(b, a, r.cable), i);
    assert.equal(match(a, b, 'hdmi'), -1);
  });
});
test('unpowered network stays offline and complete topology brings all devices online', () => {
  assert.deepEqual([...online([])], ['isp', 'ups']);
  const withoutPower = required.flatMap((r, i) => (r.cable === 'power' ? [] : [i]));
  assert.deepEqual([...online(withoutPower)], ['isp', 'ups']);
  assert.equal(online(required.map((_, i) => i)).size, 12);
});
test('removing switch power disconnects downstream endpoints', () => {
  const links = required.flatMap((r, i) => (r.cable === 'power' && r.b === 'switch' ? [] : [i]));
  const live = online(links);
  assert.ok(live.has('router'));
  for (const id of ['switch', 'pc', 'ap', 'laptop', 'camera', 'phone', 'printer'])
    assert.ok(!live.has(id));
});
test('diagnose explains why a connection was rejected', () => {
  const e = (device, port) => ({ device, port });
  assert.match(diagnose(e('modem', 'fiber'), e('modem', 'eth'), 'ethernet'), /same device/);
  assert.match(diagnose(e('pc', 'eth'), e('switch', 'eth'), 'hdmi'), /not part of this network/);
  assert.match(
    diagnose(e('isp', 'fiber'), e('modem', 'fiber'), 'ethernet'),
    /Right ports, wrong cable/,
  );
  assert.match(
    diagnose(e('modem', 'fiber'), e('router', 'lan'), 'ethernet'),
    /Modem \/ ONT FIBER port does not accept Ethernet/,
  );
  assert.match(
    diagnose(e('router', 'wan'), e('switch', 'eth'), 'ethernet'),
    /do not connect directly/,
  );
});

test('patch panel jacks carry signal one jack at a time', () => {
  const closet = ['isp-modem', 'modem-router', 'router-switch', 'ups-modem', 'ups-router'];
  const links = ids => [...closet, 'ups-switch', 'ups-pc', ...ids].map(linkIndex);
  assert.ok(!online(links(['patch-pc', 'switch-j1'])).has('pc'));
  const live = online(links(['patch-pc', 'switch-j2']));
  assert.ok(live.has('pc') && live.has('patch'));
});

test('diagnose explains patch panel jack labels', () => {
  const e = (device, port) => ({ device, port });
  assert.match(
    diagnose(e('pc', 'eth'), e('patch', 'j1'), 'ethernet'),
    /J1 is labeled for the IP camera/,
  );
  assert.match(diagnose(e('switch', 'eth'), e('patch', 'j6'), 'ethernet'), /spare jack/);
});
