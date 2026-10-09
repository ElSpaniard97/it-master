export const $ = selector => document.querySelector(selector);

export function svg(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

// Status bar under the scene. Errors are styled red.
export function message(text, error = false) {
  $('#feedback').textContent = text;
  $('#feedback').classList.toggle('error', error);
}

// "Selected Item" panel in the tool dock.
export function inspect(name, info) {
  $('#inspect-name').textContent = name;
  $('#inspect-info').textContent = info;
}
