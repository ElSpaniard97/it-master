// Entry point: holds the current game state and wires DOM events to the game rules.
import { required, online, cableById, deviceById } from './engine.js';
import { missions } from './missions.js';
import {
  newState,
  attempt,
  undo,
  hint,
  complete,
  tasks,
  faultLinks,
  missionOf,
  recordBest,
} from './game.js';
import { $, message, inspect } from './ui/dom.js';
import { loadProgress, saveProgress } from './ui/storage.js';
import { renderDevices, drawWires } from './ui/scene.js';
import { renderMission, renderCables, showSelected } from './ui/hud.js';
import { showComplete, showMissionList } from './ui/dialogs.js';

const saved = loadProgress();
let state = saved.state || newState(missions[0]),
  best = saved.best,
  selected = 'ethernet', // cable or tool in hand
  start = null; // first port clicked, waiting for the second

const save = () => saveProgress(state, best);
const links = () => [...state.connected.map(i => required[i]), ...faultLinks(state)];
const intro = () => message(`${missionOf(state).title}: ${missionOf(state).brief}`);

// Re-render everything. `fresh` lists devices that just came online, for the animation.
function render(fresh = []) {
  const focus = document.activeElement?.closest?.('[data-key],[data-inspect],[data-cable]');
  const refocus =
    focus &&
    Object.entries(focus.dataset)
      .filter(([k]) => ['key', 'inspect', 'cable'].includes(k))
      .map(([k, v]) => `[data-${k}="${v}"]`)[0];
  const live = online(state.connected);
  renderMission(state, live);
  renderDevices({ live, fresh, links: links(), start });
  renderCables(selected);
  if (refocus) $(refocus)?.focus();
  save();
  requestAnimationFrame(() => drawWires(links(), fresh));
}

function load(m) {
  state = newState(m);
  start = null;
  intro();
  render();
}

function finish() {
  recordBest(best, state);
  save();
  showComplete(missionOf(state), state);
}

function clickPort(end) {
  if (!start) {
    start = end;
    message(
      selected === 'unplug'
        ? 'First end selected. Click the other end of the cable to unplug it.'
        : 'Source selected. Click a destination port, or click the source again to cancel.',
    );
    render();
  } else if (start.device === end.device && start.port === end.port) {
    start = null;
    message('Selection cleared. Choose a source port.');
    render();
  } else {
    const from = start;
    start = null;
    const r = attempt(state, from, end, selected);
    message(r.text, !r.ok);
    render(r.fresh || []);
    if (r.ok && complete(state)) finish();
  }
}

function selectCable(id) {
  if (id === 'tools') {
    $('#hint').click();
    inspect('Network tools', 'Use the hint tool to inspect the next missing connection.');
    return;
  }
  selected = id;
  start = null;
  const c = cableById(id);
  showSelected(c);
  inspect(c.name, c.description);
  message(
    id === 'unplug'
      ? 'Unplug selected. Click both ends of the cable to remove.'
      : `${c.name} selected. Choose two matching ports.`,
  );
  render();
}

$('#devices').addEventListener('click', e => {
  const name = e.target.closest('[data-inspect]');
  if (name) {
    const d = deviceById(name.dataset.inspect);
    inspect(d.name, d.info);
    return;
  }
  const port = e.target.closest('[data-port]');
  if (port) clickPort({ device: port.dataset.device, port: port.dataset.port });
});
$('#cables').addEventListener('click', e => {
  const b = e.target.closest('[data-cable]');
  if (b) selectCable(b.dataset.cable);
});
$('#hint').onclick = () => {
  const h = hint(state);
  if (!h) {
    message('Everything is connected. Mission complete!');
    return;
  }
  state.hints++;
  message(h.text);
  save();
};
$('#undo').onclick = () => {
  if (!undo(state)) return;
  start = null;
  message('Last action undone.');
  render();
};
$('#reset').onclick = () => {
  if (
    tasks(state).done &&
    !confirm('Restart this mission? This clears your connections, mistakes and hints.')
  )
    return;
  load(missionOf(state));
  message('New attempt started. Select a cable and connect two ports.');
};
$('#ports').onclick = () => {
  const hide = $('#scene').classList.toggle('hide-ports');
  $('#ports').textContent = hide ? 'Ports: hover' : 'Ports: on';
  $('#ports').setAttribute('aria-pressed', String(!hide));
};
$('#missions').onclick = () => showMissionList(state.mission, best);
$('#all-missions').onclick = () => {
  $('#complete').close();
  showMissionList(state.mission, best);
};
$('#mission-groups').addEventListener('click', e => {
  const b = e.target.closest('[data-mission]');
  if (!b) return;
  $('#mission-list').close();
  if (b.dataset.mission !== state.mission) load(missions.find(m => m.id === b.dataset.mission));
});
$('#close-missions').onclick = () => $('#mission-list').close();
$('#next').onclick = () => {
  $('#complete').close();
  load(missions[missions.indexOf(missionOf(state)) + 1]);
};
$('#continue').onclick = () => $('#complete').close();
window.addEventListener('resize', () => drawWires(links()));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && start) {
    start = null;
    message('Selection cleared. Choose a source port.');
    render();
  }
});

showSelected(cableById(selected));
intro();
render();
