const COLORS = [
  '#c1443c',
  '#3f5a7d',
  '#2f7d5a',
  '#a8752f',
  '#7a4f9e',
  '#c47a2b',
  '#39758a',
  '#8a4a6a',
  '#9b5c4d',
  '#526b82',
  '#7b8240',
  '#56866f',
  '#6b5a82',
  '#b96545',
  '#7d5365',
  '#8c6a4f',
  '#596d5b',
  '#6a6280',
  '#a65f54',
  '#44627a',
  '#9a7048',
  '#75506e',
];
const EMOJIS = [
  // 😄 Faces
  '😀','😎','🤓','🥳','😺','😸','😻','😹','😽','🙈',
  '🤭','😊','😆','😋','🥰','😍','🤩','😴','🤗','😜',

  // 🐶 Animals
  '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯',
  '🦁','🐮','🐷','🐸','🐵','🐧','🐦','🐤','🦆','🦉',
  '🐺','🐗','🐙','🦀','🐢','🐳','🐬','🦋','🐝','🐞',

  // 🌸 Cute / Nature
  '🌸','🌷','🌻','🌹','🌺','🌼','🍀','🌿','🌱','🌵',
  '🍄','🌈','☀️','🌙','⭐','✨','🌟','💫','🌙','☁️',

  // 🍓 Food
  '🍎','🍊','🍋','🍉','🍇','🍓','🍒','🍑','🥝','🍍',
  '🥑','🍕','🍔','🍟','🍩','🍪','🍰','🧁','🍭','🍬',

  // 🎨 Things / Hobbies
  '🎨','🎸','🎮','🎧','📚','✏️','🖌️','🎵','🎶','📷',
  '⚽','🏀','🎾','🏆','🎯','🧩','🎲','🧸','🎁','💡',

  // 👨‍🚀 Characters
  '🧑‍🚀','🧑‍🎤','🧑‍🍳','🧑‍🎨','🥷','🧙','🧑‍💻','🕵️',
  '🤠','🥸','🧚','🧜','🧝','🧞','🦸','🦹',

  // 💖 Cute objects
  '❤️','🧡','💛','💚','💙','💜','🩷','🤍','🖤',
  '💖','💗','💓','💞','💕','💝','💘','💌','🎀','🫶'
];

function colorFor(name, members){
  const idx = members.indexOf(name);
  return COLORS[(idx>=0?idx:0) % COLORS.length];
}
function pickEmoji(){
  const used = Object.values(state.memberEmoji||{});
  const avail = EMOJIS.filter(e=>!used.includes(e));
  const pool = avail.length ? avail : EMOJIS;
  return pool[Math.floor(Math.random()*pool.length)];
}
function getEmoji(name){
  if(!state.memberEmoji) state.memberEmoji = {};
  if(!state.memberEmoji[name]) state.memberEmoji[name] = pickEmoji();
  return state.memberEmoji[name];
}
function fmt(n){
  n = Math.round(n*100)/100;
  return n.toLocaleString('th-TH', {maximumFractionDigits:2});
}
function esc(s){
  return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

let state = {
  tripName: 'ทริปเที่ยวของเรา',
  members: ['ฉัน','แฟน'],
  expenses: [],
  currentParticipants: null,
  memberEmoji: {}
};

/* ---------- localStorage ---------- */
const KEY_CURRENT = 'hantao:v1:current';
const KEY_HISTORY = 'hantao:v1:history';
const MAX_HISTORY = 20;

function loadJSON(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  }catch(e){ return fallback; }
}
function saveJSON(key, value){
  try{ localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch(e){ console.warn('save failed', key, e); return false; }
}

// โหลดรอบปัจจุบัน
(function loadCurrent(){
  const saved = loadJSON(KEY_CURRENT, null);
  if(saved && Array.isArray(saved.members) && Array.isArray(saved.expenses)){
    state = {
      tripName: typeof saved.tripName==='string' ? saved.tripName : state.tripName,
      members: saved.members,
      expenses: saved.expenses,
      currentParticipants: Array.isArray(saved.currentParticipants) ? saved.currentParticipants : null,
      memberEmoji: saved.memberEmoji || {}
    };
  }
})();

// โหลดประวัติ
let tripHistory = loadJSON(KEY_HISTORY, []);
if(!Array.isArray(tripHistory)) tripHistory = [];

// บันทึกรอบปัจจุบันแบบหน่วงเวลาเล็กน้อย จะได้ไม่เขียนทุกครั้งที่พิมพ์
let saveTimer = null;
function scheduleSave(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveCurrentNow, 250);
}
function saveCurrentNow(){
  clearTimeout(saveTimer);
  saveJSON(KEY_CURRENT, state);
}
function saveHistory(){ saveJSON(KEY_HISTORY, tripHistory); }
window.addEventListener('pagehide', saveCurrentNow);
document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='hidden') saveCurrentNow(); });

let persistAsked = false;
function askPersist(){
  if(persistAsked) return;
  persistAsked = true;
  try{ if(navigator.storage && navigator.storage.persist) navigator.storage.persist(); }catch(e){}
}

function ensureParticipantsDefault(){
  if(!state.currentParticipants){
    state.currentParticipants = [...state.members];
  }
}
ensureParticipantsDefault();

function el(id){ return document.getElementById(id); }

function renderMembers(){
  const wrap = el('memberChips');
  wrap.innerHTML = '';
  state.members.forEach(name=>{
    const chip = document.createElement('span');
    chip.className='chip';
    chip.innerHTML = `<b style="border-color:${colorFor(name,state.members)}">${getEmoji(name)}</b>${esc(name)}<span class="x">×</span>`;
    chip.querySelector('.x').addEventListener('click', ()=> removeMember(name));
    wrap.appendChild(chip);
  });
}

function removeMember(name){
  const used = state.expenses.some(e => e.paidBy===name || e.participants.includes(name));
  if(used){
    el('memberMsg').textContent = `ลบ "${name}" ไม่ได้ เพราะมีอยู่ในรายจ่ายแล้ว ลบรายจ่ายที่เกี่ยวข้องก่อนนะ`;
    return;
  }
  state.members = state.members.filter(m=>m!==name);
  if(state.currentParticipants) state.currentParticipants = state.currentParticipants.filter(m=>m!==name);
  if(state.memberEmoji) delete state.memberEmoji[name];
  el('memberMsg').textContent = '';
  renderAll();
}

function addMember(){
  const input = el('memberInput');
  const name = input.value.trim();
  el('memberMsg').textContent='';
  if(!name){ el('memberMsg').textContent='พิมพ์ชื่อเพื่อนก่อนนะ'; return; }
  if(state.members.includes(name)){ el('memberMsg').textContent='มีชื่อนี้อยู่แล้ว'; return; }
  state.members.push(name);
  if(state.currentParticipants) state.currentParticipants.push(name);
  input.value='';
  renderAll();
}

function renderPaidByPicker(){
  const wrap = el('paidByPicker');
  wrap.innerHTML='';
  if(state.members.length===0){
    wrap.innerHTML = '<div class="hint">เพิ่มเพื่อนร่วมทริปก่อนนะ</div>';
    return;
  }
  if(!wrap.dataset.selected || !state.members.includes(wrap.dataset.selected)){
    wrap.dataset.selected = state.members[0];
  }
  state.members.forEach(name=>{
    const active = wrap.dataset.selected===name;
    const b = document.createElement('div');
    b.className = 'avatar-pick paidby' + (active ? ' active':'');
    b.innerHTML = `${active ? '<span class="mark">👉</span>':''}<span class="dot" style="border-color:${colorFor(name,state.members)}">${getEmoji(name)}</span>${esc(name)}`;
    b.addEventListener('click', ()=>{
      wrap.dataset.selected = name;
      renderPaidByPicker();
    });
    wrap.appendChild(b);
  });
}

function renderParticipantsPicker(){
  const wrap = el('participantsPicker');
  wrap.innerHTML='';
  ensureParticipantsDefault();
  state.currentParticipants = state.currentParticipants.filter(m=>state.members.includes(m));
  state.members.forEach(name=>{
    const active = state.currentParticipants.includes(name);
    const b = document.createElement('div');
    b.className = 'avatar-pick participant' + (active?' active':'');
    b.innerHTML = `${active ? '<span class="mark">✓</span>':''}<span class="dot" style="border-color:${colorFor(name,state.members)}">${getEmoji(name)}</span>${esc(name)}`;
    b.addEventListener('click', ()=>{
      if(active){
        state.currentParticipants = state.currentParticipants.filter(m=>m!==name);
      } else {
        state.currentParticipants.push(name);
      }
      renderParticipantsPicker();
    });
    wrap.appendChild(b);
  });
}

function addExpense(){
  el('expenseMsg').textContent='';
  const desc = el('expDesc').value.trim();
  const amount = parseFloat(el('expAmount').value);
  const paidBy = el('paidByPicker').dataset.selected;
  const participants = [...(state.currentParticipants||[])];

  if(state.members.length < 2){ el('expenseMsg').textContent='ต้องมีเพื่อนร่วมทริปอย่างน้อย 2 คนก่อนนะ'; return; }
  if(!desc){ el('expenseMsg').textContent='ใส่ชื่อรายการก่อนนะ'; return; }
  if(!amount || amount<=0){ el('expenseMsg').textContent='ใส่จำนวนเงินให้ถูกต้องนะ'; return; }
  if(!paidBy){ el('expenseMsg').textContent='เลือกคนที่ออกเงินก่อนนะ'; return; }
  if(participants.length===0){ el('expenseMsg').textContent='เลือกคนที่ร่วมหารบิลนี้อย่างน้อย 1 คนนะ'; return; }

  state.expenses.push({
    id: Date.now()+Math.random(),
    desc, amount, paidBy, participants
  });

  el('expDesc').value='';
  el('expAmount').value='';
  renderAll();
}

function deleteExpense(id){
  state.expenses = state.expenses.filter(e=>e.id!==id);
  renderAll();
}

function renderExpenseList(){
  const wrap = el('expenseList');
  wrap.innerHTML='';
  if(state.expenses.length===0){
    wrap.innerHTML = '<div class="empty">ยังไม่มีรายจ่าย ลองเพิ่มรายการแรกดูสิ ✏️</div>';
    return;
  }
  [...state.expenses].reverse().forEach(exp=>{
    const share = exp.amount / exp.participants.length;
    const card = document.createElement('div');
    card.className='receipt';
    card.innerHTML = `
      <div class="tape"></div>
      <span class="del">✕</span>
      <div class="top-row">
        <div class="desc">${esc(exp.desc)}</div>
        <div class="amt">฿${fmt(exp.amount)}</div>
      </div>
      <div class="meta">
        ${esc(exp.paidBy)} ออกเงินไปก่อน &middot; หารกัน ${exp.participants.length} คน (คนละ ฿${fmt(share)})<br>
        ร่วมหาร: ${exp.participants.map(esc).join(', ')}
      </div>
    `;
    card.querySelector('.del').addEventListener('click', ()=> deleteExpense(exp.id));
    wrap.appendChild(card);
  });
}

function computeBalances(){
  const paid = {}, owed = {};
  state.members.forEach(m=>{ paid[m]=0; owed[m]=0; });
  state.expenses.forEach(exp=>{
    if(paid[exp.paidBy]===undefined) return;
    paid[exp.paidBy]+=exp.amount;
    const share = exp.amount/exp.participants.length;
    exp.participants.forEach(p=>{
      if(owed[p]!==undefined) owed[p]+=share;
    });
  });
  const balances = {};
  state.members.forEach(m=>{
    balances[m] = Math.round((paid[m]-owed[m])*100)/100;
  });
  return {paid, owed, balances};
}

function renderLedger(){
  const wrap = el('ledger');
  wrap.innerHTML='';
  if(state.members.length===0 || state.expenses.length===0){
    wrap.innerHTML = '<div class="empty">ยังไม่มีอะไรให้สรุป เพิ่มรายจ่ายก่อนนะ</div>';
    return;
  }
  const {balances} = computeBalances();
  state.members.forEach(name=>{
    const bal = balances[name];
    const posneg = bal>0.005 ? 'pos' : (bal<-0.005 ? 'neg' : '');
    const tagText = bal>0.005 ? 'ได้คืน' : (bal<-0.005 ? 'ต้องจ่ายเพิ่ม' : 'พอดีเป๊ะ');
    const row = document.createElement('div');
    row.className='ledger-row';
    row.innerHTML = `
      <div class="who"><span class="dot" style="border-color:${colorFor(name,state.members)}">${getEmoji(name)}</span><span class="nm">${esc(name)}</span></div>
      <div class="bal ${posneg}">
        ฿${fmt(Math.abs(bal))}
        <div class="tag ${posneg||'pos'}" style="${posneg?'':'background:var(--paper-2);color:var(--ink-soft);'}">${tagText}</div>
      </div>
    `;
    wrap.appendChild(row);
  });
}

function computeSettlements(){
  const {balances} = computeBalances();
  const creditors = [];
  const debtors = [];
  Object.keys(balances).forEach(name=>{
    const b = balances[name];
    if(b>0.005) creditors.push({name, amt:b});
    else if(b<-0.005) debtors.push({name, amt:-b});
  });
  creditors.sort((a,b)=>b.amt-a.amt);
  debtors.sort((a,b)=>b.amt-a.amt);
  const result = [];
  let i=0, j=0;
  while(i<debtors.length && j<creditors.length){
    const pay = Math.min(debtors[i].amt, creditors[j].amt);
    if(pay>0.005){
      result.push({from:debtors[i].name, to:creditors[j].name, amount:Math.round(pay*100)/100});
    }
    debtors[i].amt -= pay;
    creditors[j].amt -= pay;
    if(debtors[i].amt<=0.005) i++;
    if(creditors[j].amt<=0.005) j++;
  }
  return result;
}

function wavyArrowSvg(){
  return `<svg viewBox="0 0 100 22" preserveAspectRatio="none" aria-hidden="true">
    <path d="M4,11 Q20,3 36,11 T68,11 L86,11" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
    <path d="M78,4 L92,11 L78,18" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  </svg>`;
}

function personHtml(name, cls, role){
  return `<div class="person ${cls}">
    <span class="dot" style="border-color:${colorFor(name,state.members)}">${getEmoji(name)}</span>
    <span class="nm">${esc(name)}</span>
    <span class="role">${role}</span>
  </div>`;
}

function renderSettlements(){
  const wrap = el('settlements');
  wrap.innerHTML='';
  const hasExp = state.members.length>0 && state.expenses.length>0;
  el('shareImgBtn').hidden = !hasExp;
  el('copyRow').hidden = !hasExp || computeSettlements().length===0;
  if(state.members.length===0 || state.expenses.length===0){
    wrap.innerHTML = '<div class="empty">ยังไม่มีอะไรให้เคลียร์หนี้ เพิ่มรายจ่ายก่อนนะ</div>';
    return;
  }
  const settlements = computeSettlements();
  if(settlements.length===0){
    wrap.innerHTML = '<div class="empty">ทุกคนจ่ายลงตัวพอดีแล้ว ไม่ต้องโอนใครเลย 🎉</div>';
    return;
  }
  const total = settlements.reduce((s,x)=>s+x.amount,0);
  const head = document.createElement('div');
  head.className = 'settle-summary';
  head.innerHTML = `โอนทั้งหมด <b>${settlements.length} ครั้ง</b> รวม <b>฿${fmt(total)}</b> ก็เคลียร์กันจบ`;
  wrap.appendChild(head);

  settlements.forEach((s, idx)=>{
    const row = document.createElement('div');
    row.className='transfer';
    row.innerHTML = `
      ${settlements.length>1 ? `<span class="step">โอนครั้งที่ ${idx+1}</span>` : ''}
      ${personHtml(s.from, 'from', 'ผู้โอน')}
      <div class="flow">
        <div class="amt">฿${fmt(s.amount)}</div>
        ${wavyArrowSvg()}
        <div class="lbl">โอนให้</div>
      </div>
      ${personHtml(s.to, 'to', 'ผู้รับ')}
    `;
    wrap.appendChild(row);
  });
}

function renderAll(){
  renderMembers();
  renderPaidByPicker();
  renderParticipantsPicker();
  renderExpenseList();
  renderLedger();
  renderSettlements();
  el('settleBtn').disabled = state.expenses.length===0;
  const n = state.expenses.length ? computeSettlements().length : 0;
  el('settleBadge').textContent = n ? String(n) : '';
  renderHistory();
  scheduleSave();
}

/* ---------- toast ---------- */
let toastTimer = null;
function showToast(message, actionLabel, action){
  el('toastMsg').textContent = message;
  const btn = el('toastAction');
  if(actionLabel){
    btn.textContent = actionLabel;
    btn.hidden = false;
    btn.onclick = ()=>{ hideToast(); action(); };
  } else {
    btn.hidden = true;
    btn.onclick = null;
  }
  el('toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, actionLabel ? 6000 : 2500);
}
function hideToast(){
  clearTimeout(toastTimer);
  el('toast').classList.remove('show');
}

/* ---------- ประวัติทริป ---------- */
function fmtDate(ts){
  return new Date(ts).toLocaleDateString('th-TH', {day:'numeric', month:'short', year:'2-digit'});
}
function facesHtml(members, max){
  max = max || 5;
  const shown = members.slice(0, max).map(m=>`<span>${m.emoji}</span>`).join('');
  const extra = members.length > max ? `<span class="more">+${members.length-max}</span>` : '';
  return `<span class="faces" aria-label="${members.length} คน">${shown}${extra}</span>`;
}

function renderHistory(){
  el('histCount').textContent = tripHistory.length;
  const list = el('histList');
  list.innerHTML = '';
  if(tripHistory.length===0){
    list.innerHTML = '<div class="empty small">ยังไม่มีทริปที่เคลียร์แล้ว<br>กด "ยืนยันเคลียร์บิล" เมื่อไร ทริปจะมาเก็บไว้ตรงนี้</div>';
    el('histFoot').hidden = true;
    return;
  }
  el('histFoot').hidden = false;
  el('histCap').textContent = `เก็บไว้ ${tripHistory.length}/${MAX_HISTORY} ทริป เกินนี้ทริปเก่าสุดจะถูกลบเอง`;
  tripHistory.forEach(h=>{
    const b = document.createElement('button');
    b.className = 'hist-item';
    b.innerHTML = `
      <div style="min-width:0">
        <div class="hi-name">${esc(h.tripName)}</div>
        <div class="hi-meta"><span>${fmtDate(h.settledAt)}</span>${facesHtml(h.members)}</div>
      </div>
      <div class="hi-amt">฿${fmt(h.total)}</div>
      <span class="hi-chev" aria-hidden="true">›</span>`;
    b.addEventListener('click', ()=> openHistory(h.id));
    list.appendChild(b);
  });
}

function toggleHistory(force){
  const btn = el('histToggle');
  const open = typeof force==='boolean' ? force : btn.getAttribute('aria-expanded')!=='true';
  btn.setAttribute('aria-expanded', String(open));
  el('histBody').hidden = !open;
}

function buildSnapshot(){
  const {paid, owed} = computeBalances();
  const involved = state.members.filter(m=>
    state.expenses.some(e=> e.paidBy===m || e.participants.includes(m)));
  const r2 = n => Math.round(n*100)/100;
  const snapshot = {
    v: 1,
    id: 'h' + Date.now() + Math.random().toString(36).slice(2,6),
    settledAt: Date.now(),
    tripName: (state.tripName||'').trim() || 'ทริปไม่มีชื่อ',
    members: involved.map(name=>({name, emoji:getEmoji(name)})),
    expenses: state.expenses.map(e=>({desc:e.desc, amount:e.amount, paidBy:e.paidBy, participants:[...e.participants]})),
    total: r2(state.expenses.reduce((s,e)=>s+e.amount, 0)),
    settlements: computeSettlements(),
    perPerson: involved.map(name=>({name, paid:r2(paid[name]||0), share:r2(owed[name]||0)}))
  };
  return snapshot;
}

function settleCurrentRound(){
  const snapshot = buildSnapshot();
  const prevExpenses = state.expenses;
  tripHistory.unshift(snapshot);
  const pruned = tripHistory.length > MAX_HISTORY ? tripHistory.splice(MAX_HISTORY) : [];
  saveHistory();
  askPersist();

  state.expenses = [];
  renderAll();
  saveCurrentNow();

  const msg = pruned.length
    ? `เก็บ "${snapshot.tripName}" แล้ว และลบทริปเก่าสุด "${pruned[0].tripName}" ออก`
    : `เก็บ "${snapshot.tripName}" ไว้ในทริปที่เคลียร์แล้ว`;
  showToast(msg, 'เลิกทำ', ()=>{
    tripHistory = tripHistory.filter(h=>h.id!==snapshot.id).concat(pruned);
    state.expenses = prevExpenses;
    saveHistory();
    renderAll();
    saveCurrentNow();
    showToast('ย้อนกลับแล้ว รายจ่ายกลับมาครบ');
  });
}

let openHistoryId = null;
function openHistory(id){
  const h = tripHistory.find(x=>x.id===id);
  if(!h) return;
  openHistoryId = id;
  const emo = {};
  h.members.forEach(m=>{ emo[m.name] = m.emoji; });
  const face = name => `<span class="dot sm">${emo[name]||'🙂'}</span>`;
  const everyone = h.members.length;

  el('sheetTitle').textContent = h.tripName;
  el('sheetDate').textContent = 'เคลียร์เมื่อ ' + new Date(h.settledAt).toLocaleDateString('th-TH', {weekday:'short', day:'numeric', month:'long', year:'numeric'});

  const transfers = h.settlements.length
    ? h.settlements.map(s=>`
        <div class="mt">
          <div class="p">${face(s.from)}<span class="n">${esc(s.from)}</span></div>
          <span class="arr">→</span>
          <div class="p">${face(s.to)}<span class="n">${esc(s.to)}</span></div>
          <span class="a">฿${fmt(s.amount)}</span>
        </div>`).join('')
    : '<div class="empty small">ทริปนี้จ่ายลงตัวพอดี ไม่มีใครต้องโอน</div>';

  const people = h.perPerson.map(p=>`
      <div class="pp">
        <div class="p">${face(p.name)}<span class="n">${esc(p.name)}</span></div>
        <span class="num">฿${fmt(p.paid)}</span>
        <span class="num">฿${fmt(p.share)}</span>
      </div>`).join('');

  const expenses = h.expenses.map(e=>{
    const who = e.participants.length===everyone ? `หารทุกคน` : `หาร ${e.participants.length} คน: ${e.participants.map(esc).join(', ')}`;
    return `
      <div class="ex">
        <div class="l">
          <div class="d">${esc(e.desc)}</div>
          <div class="s">${emo[e.paidBy]||''} ${esc(e.paidBy)} ออกให้ก่อน, ${who}</div>
        </div>
        <span class="a">฿${fmt(e.amount)}</span>
      </div>`;
  }).join('');

  el('sheetBody').innerHTML = `
    <div class="stats">
      <div><b>฿${fmt(h.total)}</b><small>ยอดรวม</small></div>
      <div><b>${h.expenses.length}</b><small>รายการ</small></div>
      <div><b>${everyone}</b><small>คน</small></div>
    </div>
    <div class="sh-title">ใครโอนให้ใคร</div>
    ${transfers}
    ${h.settlements.length ? '<div class="copy-row"><button class="linkbtn plain" id="sheetCopy">คัดลอกยอดโอน</button></div>' : ''}
    <div class="sh-title">แต่ละคน</div>
    <div class="pp-head"><span>ชื่อ</span><span>ออกไป</span><span>ส่วนของตัวเอง</span></div>
    ${people}
    <div class="sh-title">รายจ่ายทั้งหมด</div>
    ${expenses}
    <div class="sheet-actions">
      <button class="btn danger block" id="sheetDelete">ลบทริปนี้ออกจากประวัติ</button>
    </div>`;
  el('sheetDelete').addEventListener('click', ()=> deleteHistory(id));
  if(el('sheetCopy')) el('sheetCopy').addEventListener('click', ()=> copyTransfers(h));
  el('sheetBody').scrollTop = 0;

  el('histSheet').classList.add('show');
  el('histSheet').setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
  setTimeout(()=> el('sheetClose').focus(), 50);
}

/* ---------- แชร์เป็นรูป / คัดลอกยอดโอน ---------- */
const SHARE_FONT_TEXT = 'กขคทริปยอด฿0123456789abc';
if(document.fonts && document.fonts.load){
  Promise.all([
    document.fonts.load('400 16px Mali', SHARE_FONT_TEXT),
    document.fonts.load('500 16px Mali', SHARE_FONT_TEXT),
    document.fonts.load('700 16px Mali', SHARE_FONT_TEXT),
    document.fonts.load('20px Chonburi', SHARE_FONT_TEXT)
  ]).catch(()=>{});
}

function transfersText(snap){
  if(!snap.settlements.length) return `${snap.tripName}\nจ่ายลงตัวพอดี ไม่ต้องโอนใคร`;
  return [`${snap.tripName} ยอดโอน`]
    .concat(snap.settlements.map(s=>`${s.from} ➜ ${s.to} ฿${fmt(s.amount)}`))
    .join('\n');
}
function copyText(text){
  if(navigator.clipboard && navigator.clipboard.writeText){
    return navigator.clipboard.writeText(text).then(()=>true).catch(()=>legacyCopy(text));
  }
  return Promise.resolve(legacyCopy(text));
}
function legacyCopy(text){
  try{
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly','');
    ta.style.position='fixed'; ta.style.top='-1000px'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  }catch(e){ return false; }
}
function copyTransfers(snap){
  copyText(transfersText(snap)).then(ok=>{
    showToast(ok ? 'คัดลอกยอดโอนแล้ว วางในไลน์ได้เลย' : 'คัดลอกไม่ได้ในเบราว์เซอร์นี้');
  });
}

const SC = {
  paper:'#f6efdc', line:'#dccfae', ink:'#2e2a22', soft:'#6b6252',
  owe:'#c1443c', card:'#fffdf6', row:'#f3ead3', dash:'#d8c9a3', tape:'rgba(243,211,92,0.9)'
};
function rrect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r);
  ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r);
  ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y);
  ctx.closePath();
}
// ตัดคำภาษาไทยให้ถูก: ใช้ Intl.Segmenter ถ้ามี ไม่งั้นแยกตามตัวอักษร (ไม่แยกสระ/วรรณยุกต์ออกจากพยัญชนะ)
function segments(text, granularity){
  try{
    if(window.Intl && Intl.Segmenter){
      return Array.from(new Intl.Segmenter('th', {granularity}).segment(text), x=>x.segment);
    }
  }catch(e){}
  return String(text).match(/.[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u200d\ufe0f]*/gsu) || [];
}
function fitText(ctx, text, maxW){
  text = String(text);
  if(ctx.measureText(text).width <= maxW) return text;
  let chars = segments(text, 'grapheme');
  while(chars.length && ctx.measureText(chars.join('')+'…').width > maxW) chars.pop();
  return chars.join('') + '…';
}
function wrapText(ctx, text, maxW, maxLines){
  const chars = segments(String(text), 'word');
  const lines = []; let cur = '';
  for(const ch of chars){
    if(ctx.measureText(cur+ch).width > maxW && cur){ lines.push(cur); cur = ch; }
    else cur += ch;
  }
  if(cur) lines.push(cur);
  if(lines.length > maxLines){
    const rest = lines.slice(maxLines-1).join('');
    lines.length = maxLines-1;
    lines.push(fitText(ctx, rest, maxW));
  }
  return lines;
}
function hLine(ctx, x0, x1, y){
  ctx.save(); ctx.strokeStyle = SC.dash; ctx.lineWidth = 1.2; ctx.setLineDash([5,4]);
  ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); ctx.restore();
}

// วาดการ์ดสรุป; ถ้าไม่ส่ง H มา = รอบวัดความสูง
function drawShareCard(ctx, snap, H){
  const W = 400, M = 16, P = 18;
  const x0 = M + P, x1 = W - M - P, cw = x1 - x0;
  const cardTop = M + 12;
  const draw = !!H;
  const MAX_EXP = 8;
  const F = (w, px, fam) => fam==='h' ? `${px}px Chonburi, Mali, serif` : `${w} ${px}px Mali, sans-serif`;
  const emo = {}; snap.members.forEach(m=>{ emo[m.name] = m.emoji; });

  if(draw){
    ctx.fillStyle = SC.paper; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = SC.line; ctx.lineWidth = 1;
    for(let ly = 27.5; ly < H; ly += 28){ ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(W, ly); ctx.stroke(); }
    const cardH = H - cardTop - 40;
    rrect(ctx, M, cardTop, W - 2*M, cardH, 16);
    ctx.fillStyle = SC.card; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = SC.ink; ctx.stroke();
    ctx.save(); ctx.translate(W/2, cardTop); ctx.rotate(-0.05);
    ctx.fillStyle = SC.tape; ctx.fillRect(-40, -11, 80, 22); ctx.restore();
  }
  ctx.textBaseline = 'middle';
  let y = cardTop + P + 8;

  // ชื่อทริป
  ctx.font = F(0, 23, 'h');
  const titleLines = wrapText(ctx, snap.tripName, cw, 2);
  titleLines.forEach(t=>{ if(draw){ ctx.fillStyle = SC.ink; ctx.textAlign='left'; ctx.fillText(t, x0, y + 15); } y += 34; });
  ctx.font = F(500, 13);
  if(draw){ ctx.fillStyle = SC.soft; ctx.fillText(snap.dateLabel, x0, y + 8); }
  y += 26;

  // กล่องสถิติ
  const sh = 58, cols = [0.42, 0.29, 0.29];
  const stats = [[`฿${fmt(snap.total)}`, 'ยอดรวม'], [String(snap.expenses.length), 'รายการ'], [String(snap.members.length), 'คน']];
  if(draw){
    rrect(ctx, x0, y, cw, sh, 12); ctx.lineWidth = 2; ctx.strokeStyle = SC.ink; ctx.stroke();
    let cx = x0;
    stats.forEach((st, i)=>{
      const w = cw * cols[i];
      if(i>0){ ctx.save(); ctx.strokeStyle = SC.dash; ctx.setLineDash([4,4]); ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(cx, y+8); ctx.lineTo(cx, y+sh-8); ctx.stroke(); ctx.restore(); }
      ctx.textAlign = 'center'; ctx.fillStyle = SC.ink; ctx.font = F(700, 19);
      ctx.fillText(fitText(ctx, st[0], w-8), cx + w/2, y + 23);
      ctx.fillStyle = SC.soft; ctx.font = F(500, 11.5);
      ctx.fillText(st[1], cx + w/2, y + 44);
      cx += w;
    });
  }
  y += sh;

  const section = (t)=>{
    y += 22;
    ctx.font = F(0, 16, 'h');
    if(draw){ ctx.textAlign='left'; ctx.fillStyle = SC.ink; ctx.fillText(t, x0, y + 10); }
    y += 30;
  };

  // ใครโอนให้ใคร
  section('ใครโอนให้ใคร');
  if(!snap.settlements.length){
    ctx.font = F(500, 14);
    if(draw){ ctx.fillStyle = SC.soft; ctx.textAlign='left'; ctx.fillText('จ่ายลงตัวพอดี ไม่ต้องโอนใคร 🎉', x0, y + 12); }
    y += 26;
  }
  snap.settlements.forEach(st=>{
    const rh = 46;
    if(draw){
      rrect(ctx, x0, y, cw, rh, 12); ctx.fillStyle = SC.row; ctx.fill();
      ctx.font = F(700, 17); ctx.textAlign = 'right'; ctx.fillStyle = SC.owe;
      const amt = `฿${fmt(st.amount)}`;
      const amtW = ctx.measureText(amt).width;
      ctx.fillText(amt, x1 - 12, y + rh/2);
      const arrowW = 30, emoW = 25;
      const side = (cw - 24 - amtW - 14 - arrowW) / 2;
      ctx.font = F(700, 15);
      const fromName = fitText(ctx, st.from, Math.max(20, side - emoW));
      const toName = fitText(ctx, st.to, Math.max(20, side - emoW));
      const person = (name, label, px)=>{
        ctx.textAlign = 'left'; ctx.font = F(400, 17); ctx.fillStyle = SC.ink;
        ctx.fillText(emo[name] || '🙂', px, y + rh/2);
        ctx.font = F(700, 15);
        ctx.fillText(label, px + emoW, y + rh/2);
        return px + emoW + ctx.measureText(label).width;
      };
      const afterFrom = person(st.from, fromName, x0 + 12);
      ctx.textAlign='center'; ctx.font = F(700, 16); ctx.fillStyle = SC.soft;
      ctx.fillText('→', afterFrom + arrowW/2, y + rh/2);
      person(st.to, toName, afterFrom + arrowW);
    }
    y += rh + 8;
  });
  y -= 8;

  // แต่ละคน
  section('แต่ละคน');
  const colShare = x1, colPaid = x1 - 104;
  ctx.font = F(500, 11.5);
  if(draw){
    ctx.fillStyle = SC.soft; ctx.textAlign = 'right';
    ctx.fillText('ออกไป', colPaid, y + 6); ctx.fillText('ส่วนของตัวเอง', colShare, y + 6);
  }
  y += 16;
  snap.perPerson.forEach((pp, i)=>{
    const rh = 32;
    if(draw){
      if(i>0) hLine(ctx, x0, x1, y);
      ctx.textAlign='left'; ctx.fillStyle = SC.ink; ctx.font = F(400, 15);
      ctx.fillText(emo[pp.name] || '🙂', x0, y + rh/2);
      ctx.font = F(700, 14.5);
      ctx.fillText(fitText(ctx, pp.name, colPaid - 70 - x0 - 24), x0 + 23, y + rh/2);
      ctx.textAlign='right'; ctx.font = F(500, 14);
      ctx.fillText(`฿${fmt(pp.paid)}`, colPaid, y + rh/2);
      ctx.fillText(`฿${fmt(pp.share)}`, colShare, y + rh/2);
    }
    y += rh;
  });

  // รายจ่าย
  section('รายจ่ายทั้งหมด');
  const everyone = snap.members.length;
  snap.expenses.slice(0, MAX_EXP).forEach((e, i)=>{
    const rh = 46;
    if(draw){
      if(i>0) hLine(ctx, x0, x1, y);
      ctx.font = F(700, 14.5); ctx.textAlign='right'; ctx.fillStyle = SC.ink;
      const amt = `฿${fmt(e.amount)}`;
      const amtW = ctx.measureText(amt).width;
      ctx.fillText(amt, x1, y + 16);
      ctx.textAlign='left';
      ctx.fillText(fitText(ctx, e.desc, cw - amtW - 14), x0, y + 16);
      ctx.font = F(400, 12); ctx.fillStyle = SC.soft;
      const who = e.participants.length===everyone ? 'หารทุกคน' : `หาร ${e.participants.length} คน (${e.participants.join(', ')})`;
      ctx.fillText(fitText(ctx, `${e.paidBy} ออกให้ก่อน, ${who}`, cw), x0, y + 34);
    }
    y += rh;
  });
  if(snap.expenses.length > MAX_EXP){
    ctx.font = F(500, 13);
    if(draw){ hLine(ctx, x0, x1, y); ctx.fillStyle = SC.soft; ctx.textAlign='left'; ctx.fillText(`+ อีก ${snap.expenses.length - MAX_EXP} รายการ`, x0, y + 16); }
    y += 30;
  }

  y += P;           // ขอบล่างการ์ด
  const cardBottom = y;
  ctx.font = F(500, 12);
  if(draw){ ctx.fillStyle = SC.soft; ctx.textAlign='center'; ctx.fillText('หารเท่า · ใครออกเงินไปก่อน เดี๋ยวคิดให้เอง', W/2, cardBottom + 20); }
  return cardBottom + 40;
}

function renderShareCanvas(snap){
  const S = 2.5, W = 400;
  const probe = document.createElement('canvas'); probe.width = 1; probe.height = 1;
  const H = Math.ceil(drawShareCard(probe.getContext('2d'), snap));
  const c = document.createElement('canvas');
  c.width = Math.round(W * S); c.height = Math.round(H * S);
  const ctx = c.getContext('2d');
  ctx.scale(S, S);
  drawShareCard(ctx, snap, H);
  return c;
}
function dataUrlToFile(dataUrl, name){
  const [head, b64] = dataUrl.split(',');
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) arr[i] = bin.charCodeAt(i);
  return new File([arr], name, {type: head.match(/:(.*?);/)[1]});
}
function shareFileName(){
  const d = new Date();
  const pad = n => String(n).padStart(2,'0');
  return `hantao-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}.png`;
}

function shareImage(snap){
  let dataUrl;
  try{ dataUrl = renderShareCanvas(snap).toDataURL('image/png'); }
  catch(e){ console.warn(e); showToast('สร้างรูปไม่สำเร็จ ลองใหม่อีกครั้งนะ'); return; }
  const name = shareFileName();
  let file = null;
  try{ file = dataUrlToFile(dataUrl, name); }catch(e){}
  if(file && navigator.canShare && navigator.share){
    let can = false;
    try{ can = navigator.canShare({files:[file]}); }catch(e){}
    if(can){
      navigator.share({files:[file], title:snap.tripName}).catch(err=>{
        if(err && err.name === 'AbortError') return;   // ผู้ใช้กดยกเลิกเอง
        openPreview(dataUrl, name);
      });
      return;
    }
  }
  openPreview(dataUrl, name);
}

function openPreview(dataUrl, name){
  el('previewImg').src = dataUrl;
  const a = el('previewDownload');
  a.href = dataUrl; a.download = name;
  el('imgPreview').classList.add('show');
  el('imgPreview').setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
}
function closePreview(){
  el('imgPreview').classList.remove('show');
  el('imgPreview').setAttribute('aria-hidden','true');
  if(!openHistoryId) document.body.style.overflow = '';
}

function currentShareSnapshot(){
  const snap = buildSnapshot();
  snap.dateLabel = 'สรุป ณ ' + new Date().toLocaleDateString('th-TH', {weekday:'short', day:'numeric', month:'short', year:'numeric'});
  return snap;
}
function historyShareSnapshot(h){
  return Object.assign({}, h, {
    dateLabel: 'เคลียร์เมื่อ ' + new Date(h.settledAt).toLocaleDateString('th-TH', {weekday:'short', day:'numeric', month:'short', year:'numeric'})
  });
}

function closeHistory(){
  el('histSheet').classList.remove('show');
  el('histSheet').setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
  openHistoryId = null;
}

function deleteHistory(id){
  const idx = tripHistory.findIndex(h=>h.id===id);
  if(idx<0) return;
  const [removed] = tripHistory.splice(idx, 1);
  saveHistory();
  closeHistory();
  renderHistory();
  showToast(`ลบ "${removed.tripName}" แล้ว`, 'เลิกทำ', ()=>{
    tripHistory.splice(Math.min(idx, tripHistory.length), 0, removed);
    saveHistory();
    renderHistory();
  });
}

let pendingConfirmAction = null;
function showConfirm(message, action, okLabel){
  el('confirmMsg').textContent = message;
  el('confirmOk').textContent = okLabel || 'ยืนยัน';
  pendingConfirmAction = action;
  el('confirmModal').classList.add('show');
}
function hideConfirm(){
  el('confirmModal').classList.remove('show');
  pendingConfirmAction = null;
}
el('confirmCancel').addEventListener('click', hideConfirm);
el('confirmModal').addEventListener('click', e=>{ if(e.target===el('confirmModal')) hideConfirm(); });
el('confirmOk').addEventListener('click', ()=>{
  const action = pendingConfirmAction;
  hideConfirm();
  if(action) action();
});

el('addMemberBtn').addEventListener('click', addMember);
el('memberInput').addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); addMember(); }});
el('addExpenseBtn').addEventListener('click', addExpense);
el('tripName').addEventListener('input', e=>{ state.tripName = e.target.value; scheduleSave(); });

el('resetBtn').addEventListener('click', ()=>{
  showConfirm('ล้างทริปที่กำลังทำอยู่ทั้งหมดเลยนะ ชื่อเพื่อนและรายจ่ายรอบนี้จะหายหมด ย้อนกลับไม่ได้ (ทริปที่เคลียร์แล้วยังอยู่ครบ) แน่ใจไหม?', ()=>{
    state = { tripName:'ทริปเที่ยวของเรา', members:[], expenses:[], currentParticipants:[], memberEmoji:{} };
    el('tripName').value = state.tripName;
    renderAll();
  }, 'ล้างทริปนี้เลย');
});

el('settleBtn').addEventListener('click', ()=>{
  if(state.expenses.length===0) return;
  showConfirm('ทุกคนโอนกันครบแล้วใช่ไหม? ทริปนี้จะย้ายไปเก็บใน "ทริปที่เคลียร์แล้ว" (เปิดดูย้อนหลังได้) แล้วเริ่มรอบใหม่ รายชื่อเพื่อนยังอยู่เหมือนเดิม', settleCurrentRound, 'เคลียร์บิล');
});

document.querySelectorAll('nav.tabs button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('nav.tabs button').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tabpanel').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    el('panel-'+btn.dataset.tab).classList.add('active');
    // jump to the panel's first card so the switch is obvious on a phone
    const target = el('panel-'+btn.dataset.tab);
    const y = target.getBoundingClientRect().top + window.scrollY - 12;
    window.scrollTo({top: Math.max(0, y), behavior: 'smooth'});
  });
});

el('histToggle').addEventListener('click', ()=> toggleHistory());
el('shareImgBtn').addEventListener('click', ()=>{ if(state.expenses.length) shareImage(currentShareSnapshot()); });
el('copyTransfersBtn').addEventListener('click', ()=>{ if(state.expenses.length) copyTransfers(buildSnapshot()); });
el('sheetShare').addEventListener('click', ()=>{
  const h = tripHistory.find(x=>x.id===openHistoryId);
  if(h) shareImage(historyShareSnapshot(h));
});
el('previewClose').addEventListener('click', closePreview);
el('imgPreview').addEventListener('click', e=>{ if(e.target===el('imgPreview')) closePreview(); });
el('sheetClose').addEventListener('click', closeHistory);
el('histSheet').addEventListener('click', e=>{ if(e.target===el('histSheet')) closeHistory(); });
document.addEventListener('keydown', e=>{
  if(e.key!=='Escape') return;
  if(el('confirmModal').classList.contains('show')) hideConfirm();
  else if(el('imgPreview').classList.contains('show')) closePreview();
  else if(openHistoryId) closeHistory();
});
el('histClearAll').addEventListener('click', ()=>{
  showConfirm(`ลบประวัติทริปที่เคลียร์แล้วทั้งหมด ${tripHistory.length} ทริปเลยนะ ย้อนกลับไม่ได้ แน่ใจไหม?`, ()=>{
    tripHistory = [];
    saveHistory();
    renderHistory();
    showToast('ลบประวัติทั้งหมดแล้ว');
  }, 'ลบทั้งหมด');
});

el('tripName').value = state.tripName;
renderAll();