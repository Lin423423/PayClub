
// PayClub shared auth & data utilities
const DEMO_USER = { name: 'Demo 幹部', email: 'demo@payclub.app', role: 'leader' };

const SEED_EVENTS = [
  { 
    id:'e1', title:'2025 迎新活動', amount:300, deadline:'2025-10-15', desc:'社團迎新費用', status:'active',
    members:[
      {name:'林小明', status:'paid', type:'payer', paidAt:'10/05 14:22'},
      {name:'陳美玲', status:'paid', type:'payer', paidAt:'10/06 09:11'},
      {name:'王管理員', status:'viewer', type:'admin', paidAt:''}
    ]
  }
];

function PC_getUser() {
  const raw = localStorage.getItem('pc_current_user');
  return raw ? JSON.parse(raw) : null;
}

function PC_getEvents() {
  const raw = localStorage.getItem('pc_events');
  if (!raw) {
    localStorage.setItem('pc_events', JSON.stringify(SEED_EVENTS));
    return SEED_EVENTS;
  }
  return JSON.parse(raw);
}

function PC_saveEvents(events) {
  localStorage.setItem('pc_events', JSON.stringify(events));
}

function PC_nowStr() {
  const now = new Date();
  return (now.getMonth()+1).toString().padStart(2,'0')+'/'+now.getDate().toString().padStart(2,'0')+' '+now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0');
}

function PC_toast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id='toast';
    t.style.cssText = "position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#6366f1;color:white;padding:12px 24px;border-radius:12px;z-index:9999;opacity:0;transition:0.3s;pointer-events:none;";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  setTimeout(() => { t.style.opacity = '0'; }, 3000);
}

function PC_fillSidebarUser() {
  const user = PC_getUser();
  if (!user) return;
  const nameEl = document.getElementById('userName');
  if (nameEl) nameEl.textContent = user.name;
}
