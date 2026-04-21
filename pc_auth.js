// PayClub shared utilities v7 - 終極升級版

// ── 通知系統 ──
function PC_sendNotify(toEmail, title, content, type='info'){
  const key = 'pc_notif__' + toEmail;
  const list = JSON.parse(localStorage.getItem(key) || '[]');
  list.unshift({ id: Date.now(), title, content, type, read: false, time: new Date().toISOString() });
  localStorage.setItem(key, JSON.stringify(list.slice(0, 50)));
}
function PC_getUnreadCount(){
  const u = PC_getUser(); if(!u) return 0;
  return JSON.parse(localStorage.getItem('pc_notif__'+u.email)||'[]').filter(n=>!n.read).length;
}

// ── 全域掃描：找出所有與我有關的活動 ──
function PC_getAllMyEvents(){
  const u = PC_getUser(); if(!u) return [];
  const results = [];
  for(let i=0; i<localStorage.length; i++){
    const key = localStorage.key(i);
    if(key && key.startsWith('pc_events__')){
      const evts = JSON.parse(localStorage.getItem(key)||'[]');
      evts.forEach(e => {
        const isOwner = e.ownerEmail === u.email || key === 'pc_events__'+u.email;
        const myMember = (e.members||[]).find(m => m.email === u.email);
        if(isOwner || myMember){
          results.push({ ...e, _isOwner: isOwner, _myMember: myMember, _ownerKey: key });
        }
      });
    }
  }
  return results;
}

// ── Auth & 基本功能 ──
function PC_getUser(){ const sess = sessionStorage.getItem('pc_current_user'); return sess ? JSON.parse(sess) : null; }
function PC_isLoggedIn(){ return !!PC_getUser(); }
function PC_requireLogin(){ if(!PC_isLoggedIn()){ location.href='login.html?next='+encodeURIComponent(location.href); return null; } return PC_getUser(); }
function PC_requireAdmin(){ const user = PC_requireLogin(); if(!user) return null; return user; }

function PC_logout(){
  const u = PC_getUser();
  if(u){
    if(u.isDemo) localStorage.removeItem(PC_eventsKey(u));
    PC_logActivity(u, u.isDemo ? 'logout_demo' : 'logout');
  }
  sessionStorage.removeItem('pc_current_user');
  location.href = 'login.html';
}

function PC_eventsKey(user){ return 'pc_events__' + (user ? user.email : 'guest'); }
function PC_getEvents(){ const u = PC_getUser(); const raw = localStorage.getItem(PC_eventsKey(u)); return raw ? JSON.parse(raw) : []; }
function PC_saveEvents(e){ localStorage.setItem(PC_eventsKey(PC_getUser()), JSON.stringify(e)); }
function PC_getEvent(id){ return PC_getEvents().find(e=>e.id===id) || null; }

function PC_genInviteCode(){
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let code = '';
  for(let i=0;i<8;i++) code += chars[Math.floor(Math.random()*chars.length)]; return code;
}

function PC_findEventByCode(code){
  const upper = code.toUpperCase().trim();
  for(let i=0;i<localStorage.length;i++){
    const key = localStorage.key(i);
    if(key && key.startsWith('pc_events__')){
      try{
        const evts = JSON.parse(localStorage.getItem(key)||'[]');
        const found = evts.find(e=>e.inviteCode && e.inviteCode.toUpperCase()===upper);
        if(found) return {event:found, ownerKey:key, ownerEmail:key.replace('pc_events__','')};
      }catch(e){}
    }
  } return null;
}

function PC_findEventById(eventId){
  for(let i=0;i<localStorage.length;i++){
    const key = localStorage.key(i);
    if(key && key.startsWith('pc_events__')){
      try{
        const evts = JSON.parse(localStorage.getItem(key)||'[]');
        const found = evts.find(e=>e.id===eventId);
        if(found) return {event:found, ownerKey:key, ownerEmail:key.replace('pc_events__','')};
      }catch(e){}
    }
  } return null;
}

function PC_getJoinRequests(eventId){ return JSON.parse(localStorage.getItem('pc_join_req__'+eventId)||'[]'); }
function PC_saveJoinRequests(eventId, reqs){ localStorage.setItem('pc_join_req__'+eventId, JSON.stringify(reqs)); }
function PC_updateEventInStorage(ownerKey, eventId, updateFn){
  const evts = JSON.parse(localStorage.getItem(ownerKey)||'[]');
  const idx = evts.findIndex(e=>e.id===eventId);
  if(idx>=0){ updateFn(evts[idx]); localStorage.setItem(ownerKey, JSON.stringify(evts)); return true; }
  return false;
}

function PC_registerUser(user){
  const reg = JSON.parse(localStorage.getItem('pc_user_registry')||'[]'); const now = new Date().toISOString();
  const existing = reg.find(r=>r.email===user.email);
  if(!existing){ reg.push({email:user.email, name:user.name, isDemo:!!user.isDemo, createdAt:now, lastLogin:now, loginCount:1}); } 
  else { existing.lastLogin=now; existing.loginCount=(existing.loginCount||0)+1; existing.name=user.name; }
  localStorage.setItem('pc_user_registry', JSON.stringify(reg));
}
function PC_logActivity(user, action){
  if(!user) return;
  const logs = JSON.parse(localStorage.getItem('pc_activity_log')||'[]');
  logs.unshift({email:user.email, name:user.name, action, time:new Date().toISOString()});
  if(logs.length>200) logs.splice(200); localStorage.setItem('pc_activity_log', JSON.stringify(logs));
}

// ── UI helpers ──
function PC_fillSidebarUser(){
  const u = PC_getUser(); if(!u) return;
  const n = document.getElementById('userName'), a = document.getElementById('avatarInitial'), r = document.getElementById('userEmail');
  const displayName = u.name || u.email || '使用者';
  if(n) n.textContent = displayName; if(a) a.textContent = displayName.slice(0,1).toUpperCase(); if(r) r.textContent = u.email||'';
  const unread = PC_getUnreadCount();
  const badge = document.getElementById('notifBadge');
  if(badge){ badge.textContent = unread > 0 ? unread : ''; badge.style.display = unread > 0 ? 'inline-block' : 'none'; }
}
function PC_toast(msg, duration=2500){
  let t = document.getElementById('toast');
  if(!t){ t=document.createElement('div'); t.id='toast'; t.className='toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show'); clearTimeout(t._timer); t._timer = setTimeout(()=>t.classList.remove('show'), duration);
}
function PC_nowStr(){ const n = new Date(); return (n.getMonth()+1).toString().padStart(2,'0')+'/'+(n.getDate()).toString().padStart(2,'0')+' '+n.getHours().toString().padStart(2,'0')+':'+n.getMinutes().toString().padStart(2,'0'); }
function PC_genTxId(){ return 'PC'+Date.now().toString(36).toUpperCase(); }

// ── Financial helpers (支援陣列身分) ──
function PC_getPayers(event){ 
  return (event.members||[]).filter(m => {
    const roles = Array.isArray(m.roles) ? m.roles : (Array.isArray(m.role) ? m.role : [m.role]);
    return roles.includes('payer') && m.status !== 'exited' && m.status !== 'pending_invite';
  }); 
}
function PC_getExpectedAmount(event, member){
  const roles = Array.isArray(member.roles) ? member.roles : (Array.isArray(member.role) ? member.role : [member.role]);
  if(!member || !roles.includes('payer')) return 0;
  if(member.customAmount != null) return Number(member.customAmount)||0;
  return Number(event.amount)||0;
}
function PC_getCollected(event){ return PC_getPayers(event).filter(m=>m.status==='paid').reduce((s,m)=>s+PC_getExpectedAmount(event,m),0); }
function PC_getExpected(event){ return PC_getPayers(event).reduce((s,m)=>s+PC_getExpectedAmount(event,m),0); }
function PC_copyText(text, msg){
  navigator.clipboard.writeText(text).then(()=>PC_toast(msg||'✅ 已複製')).catch(()=>{
    const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';
    document.body.appendChild(ta);ta.select();try{document.execCommand('copy');PC_toast(msg||'✅ 已複製');}catch(e){}document.body.removeChild(ta);
  });
}

const ROLE_LABELS = {admin:'管理員', payer:'繳費者', observer:'觀察者', counter:'統計者'};
const ROLE_BADGE  = {admin:'badge-green', payer:'badge-blue', observer:'badge-gray', counter:'badge-orange'};

// ── 側邊欄填充函數 ──
function PC_fillSidebar(activePage = ''){
  const sidebarNav = document.querySelector('.sidebar-nav');
  if(!sidebarNav) return; // 如果頁面沒有側邊欄就跳過
  
  const user = PC_getUser();
  if(!user) return;
  
  // 生成側邊欄 HTML
  let html = '';
  
  // 主選單
  html += `<div class="nav-section">主選單</div>`;
  html += `<a href="dashboard.html" class="nav-item ${activePage==='dashboard'?'active':''}">
    <span class="icon">📊</span> 儀表板
  </a>`;
  html += `<a href="create.html" class="nav-item ${activePage==='create'?'active':''}">
    <span class="icon">➕</span> 建立活動
  </a>`;
  html += `<a href="notifications.html" class="nav-item ${activePage==='notifications'?'active':''}">
    <span class="icon">🔔</span> 通知
    <span class="badge-notify" id="notifBadge" style="display:none"></span>
  </a>`;
  
  // 管理選單
  html += `<div class="nav-section">管理</div>`;
  html += `<a href="payment-methods.html" class="nav-item ${activePage==='payment-methods'?'active':''}">
    <span class="icon">💳</span> 繳費方式管理
  </a>`;
  html += `<a href="report.html" class="nav-item ${activePage==='report'?'active':''}">
    <span class="icon">📄</span> 財務報表
  </a>`;
  
  sidebarNav.innerHTML = html;
}

// ── 關閉側邊欄（手機版用）──
function PC_closeSidebar(){
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('mobileOverlay');
  if(sidebar) sidebar.classList.remove('open');
  if(overlay) overlay.classList.remove('show');
}

// ── 開啟側邊欄（手機版用）──
function PC_openSidebar(){
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('mobileOverlay');
  if(sidebar) sidebar.classList.add('open');
  if(overlay) overlay.classList.add('show');
}
