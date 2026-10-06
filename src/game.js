import {cables,devices,required,match,online,diagnose} from './engine.js';
import {missions} from './missions.js';
// Ports that represent several sockets, so one cable there never blocks another.
const shared=['switch:eth','ups:power'];
const same=(r,a,b)=>(r.a===a.device&&r.ap===a.port&&r.b===b.device&&r.bp===b.port)||(r.b===a.device&&r.bp===a.port&&r.a===b.device&&r.ap===b.port);
const uses=(r,e)=>(r.a===e.device&&r.ap===e.port)||(r.b===e.device&&r.bp===e.port);
const name=id=>devices.find(d=>d.id===id).name;
const label=p=>p==='power'?'PWR':p.toUpperCase();
export const cableName=id=>cables.find(c=>c.id===id).name;
export const goal=m=>[...new Set([...m.start,...m.add])];
// Devices the mission is about: everything a finished mission brings online, minus the always-on sources.
export const targets=m=>[...online(goal(m))].filter(id=>id!=='isp'&&id!=='ups');
export function newState(m){return {mission:m.id,connected:[...m.start],faults:m.faults.map((_,i)=>i),history:[],mistakes:0,hints:0};}
export const missionOf=s=>missions.find(m=>m.id===s.mission);
export const faultLinks=s=>s.faults.map(i=>missionOf(s).faults[i]);
export function tasks(s){const m=missionOf(s);return {total:m.add.length+m.faults.length,done:m.add.filter(i=>s.connected.includes(i)).length+m.faults.length-s.faults.length};}
export function complete(s){const m=missionOf(s);return !s.faults.length&&goal(m).every(i=>s.connected.includes(i));}
// Apply a connect or unplug attempt. Returns {ok, text, fresh} where fresh lists devices that just came online.
export function attempt(s,a,b,cable){
const m=missionOf(s);
if(cable==='unplug'){
const f=s.faults.find(i=>same(m.faults[i],a,b));
if(f!==undefined){s.faults=s.faults.filter(i=>i!==f);s.history.push({unplug:f});return {ok:true,text:`Faulty cable removed. ${m.faults[f].why}`,fresh:[]};}
const i=s.connected.find(i=>same(required[i],a,b));
if(i!==undefined){s.connected=s.connected.filter(x=>x!==i);s.history.push({removed:i});return {ok:true,text:'That cable was working. It is unplugged now, so plug it back in to finish the mission.',fresh:[]};}
return {ok:false,text:'No cable runs between those two ports.'};}
const i=match(a,b,cable);
if(i<0){s.mistakes++;return {ok:false,text:diagnose(a,b,cable)};}
if(s.connected.includes(i))return {ok:false,text:'That link is already connected.'};
const blocker=faultLinks(s).find(f=>[a,b].some(e=>!shared.includes(`${e.device}:${e.port}`)&&uses(f,e)));
if(blocker)return {ok:false,text:'A cable is already plugged into that port. Use Unplug on both of its ends first.'};
if(!goal(m).includes(i))return {ok:false,text:'That is a valid link, but it is not part of this mission.'};
const before=online(s.connected);s.connected.push(i);s.history.push({connected:i});
return {ok:true,text:required[i].lesson,fresh:[...online(s.connected)].filter(id=>!before.has(id))};}
export function undo(s){const h=s.history.pop();if(!h)return false;if('connected' in h)s.connected=s.connected.filter(i=>i!==h.connected);if('removed' in h)s.connected.push(h.removed);if('unplug' in h)s.faults.push(h.unplug);return true;}
// Next step toward completion: unplug faults first, then make missing links.
export function hint(s){const m=missionOf(s);
if(s.faults.length){const f=m.faults[s.faults[0]];return {cable:'unplug',a:{device:f.a,port:f.ap},b:{device:f.b,port:f.bp},text:`Hint: the ${cableName(f.cable)} cable from ${name(f.a)} (${label(f.ap)}) to ${name(f.b)} (${label(f.bp)}) is wrong. Select Unplug and click both ends.`};}
const i=goal(m).find(i=>!s.connected.includes(i));if(i===undefined)return null;const r=required[i];
return {cable:r.cable,a:{device:r.a,port:r.ap},b:{device:r.b,port:r.bp},text:`Hint: use ${cableName(r.cable)} from ${name(r.a)} (${label(r.ap)}) to ${name(r.b)} (${label(r.bp)}).`};}
export function restore(saved){const m=missions.find(m=>m.id===saved?.mission);if(!m)return null;const s=newState(m);
const ok=(list,max)=>Array.isArray(list)&&list.every(i=>Number.isInteger(i)&&i>=0&&i<max);
if(ok(saved.connected,required.length))s.connected=[...new Set(saved.connected)];if(ok(saved.faults,m.faults.length))s.faults=[...new Set(saved.faults)];
s.mistakes=Number(saved.mistakes)||0;s.hints=Number(saved.hints)||0;return s;}
