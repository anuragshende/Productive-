"use strict";
const $ = s => document.querySelector(s);
const prefix = 'productivity-v2:';
function read(key, fallback) { try { return JSON.parse(localStorage.getItem(prefix+key)) ?? fallback; } catch { return fallback; } }
function save(key, value) { try { localStorage.setItem(prefix+key, JSON.stringify(value)); } catch { $('#storage').textContent = 'Storage unavailable or full. Changes may not survive refresh.'; } }
function dateKey() { const d=new Date(); return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'); }
let day=dateKey();
function listData(key) { const data=read(key,[]); return Array.isArray(data) ? data.filter(x=>x && typeof x.text==='string' && typeof x.id==='string') : []; }
let state={tasks:listData('tasks'),goals:listData('goals:'+day)};
function key(type) { return type==='tasks' ? type : type+':'+day; }
function render(type) {
 const list=$('#'+type); list.replaceChildren();
 state[type].forEach(item=>{
  const li=document.createElement('li');li.dataset.id=item.id;li.classList.toggle('done',!!item.done);li.classList.toggle('important',!!item.important);
  const check=document.createElement('input');check.type='checkbox';check.checked=!!item.done;check.dataset.action='done';check.setAttribute('aria-label','Complete '+item.text);
  const text=document.createElement('span');text.textContent=item.text;li.append(check,text);
  if(type==='tasks'){const star=document.createElement('button');star.textContent=item.important?'★':'☆';star.dataset.action='important';star.setAttribute('aria-label','Mark important');star.setAttribute('aria-pressed',String(!!item.important));li.append(star);}
  const remove=document.createElement('button');remove.textContent='Delete';remove.dataset.action='delete';li.append(remove);list.append(li);
 });
 $('#progress').textContent=`${state.goals.filter(g=>g.done).length} of ${state.goals.length} goals completed`;
}
function refreshDay(){const now=dateKey();if(now===day)return false;day=now;state.goals=listData('goals:'+day);render('goals');renderPlanner();return true;}
['tasks','goals'].forEach(type=>{
 $('#'+type+'-form').addEventListener('submit',e=>{e.preventDefault();refreshDay();const input=e.currentTarget.querySelector('input');const text=input.value.trim();if(!text)return;state[type].push({id:Date.now().toString(36)+Math.random().toString(36).slice(2),text,done:false,important:false});save(key(type),state[type]);render(type);input.value='';input.focus();});
 $('#'+type).addEventListener('click',e=>{if(refreshDay())return;const button=e.target.closest('[data-action]');if(!button)return;const item=state[type].find(x=>x.id===button.closest('li').dataset.id);if(!item)return;const action=button.dataset.action;if(action==='delete')state[type]=state[type].filter(x=>x.id!==item.id);else if(action==='done')item.done=button.checked;else item.important=!item.important;save(key(type),state[type]);render(type);});render(type);
});
let plan={};
function renderPlanner(){const data=read('planner:'+day,{});plan=data&&typeof data==='object'&&!Array.isArray(data)?data:{};$('#date').textContent=new Date().toLocaleDateString(undefined,{dateStyle:'full'});$('#planner').replaceChildren();for(let h=6;h<=22;h++){const label=document.createElement('label');label.className='slot';const time=document.createElement('span');time.textContent=String(h).padStart(2,'0')+':00';const input=document.createElement('textarea');input.rows=1;input.dataset.hour=h;input.value=typeof plan[h]==='string'?plan[h]:'';input.placeholder='Plan this hour';label.append(time,input);$('#planner').append(label);}}
$('#planner').addEventListener('input',e=>{if(refreshDay())return;plan[e.target.dataset.hour]=e.target.value;save('planner:'+day,plan);});renderPlanner();
let dark=read('theme','light')==='dark';function theme(){document.body.classList.toggle('dark',dark);$('#theme').textContent=dark?'Light mode':'Dark mode';}theme();$('#theme').addEventListener('click',()=>{dark=!dark;theme();save('theme',dark?'dark':'light');});
function clock(){const now=new Date();$('#clock').textContent=now.toLocaleString();refreshDay();}clock();setInterval(clock,1000);
let work=true,remaining=1500,interval=null,deadline=0;
function show(){ $('#timer').textContent=String(Math.floor(remaining/60)).padStart(2,'0')+':'+String(remaining%60).padStart(2,'0');$('#session').textContent=work?'Work session · 25 minutes':'Break session · 5 minutes';$('#start').disabled=interval!==null;$('#pause').disabled=interval===null; }
function stop(){clearInterval(interval);interval=null;}
function tick(){remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000));if(remaining===0){stop();$('#notice').textContent=work?'Work complete. Take a break!':'Break complete. Ready to focus?';}show();}
$('#start').addEventListener('click',()=>{if(interval!==null||remaining===0)return;deadline=Date.now()+remaining*1000;$('#notice').textContent='';interval=setInterval(tick,250);show();});
$('#pause').addEventListener('click',()=>{if(interval!==null)tick();stop();show();});
function reset(){stop();remaining=work?1500:300;$('#notice').textContent='';show();}
$('#reset').addEventListener('click',reset);$('#mode').addEventListener('click',()=>{work=!work;reset();});document.addEventListener('visibilitychange',()=>{if(!document.hidden&&interval!==null)tick();});show();
const prompts=['Start small. Focus on the next useful step.','A little progress today is still progress.','Make space for focused work and meaningful rest.','Choose one priority and give it your attention.'];let previous=-1;function quote(){let next;do{next=Math.floor(Math.random()*prompts.length);}while(next===previous);previous=next;$('#quote').textContent=prompts[next];}$('#new-quote').addEventListener('click',quote);quote();
