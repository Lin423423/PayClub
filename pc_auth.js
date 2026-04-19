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

function PC_fillSidebarUser(){
  const u = PC_getUser(); if(!u) return;
  const n = document.getElementById('userName'), a = document.getElementById('avatarInitial'), r = document.getElementById('userEmail');
  if(n) n.textContent = u.name;
  if(a) a.textContent = u.name.slice(0,1);
  if(r) r.textContent = u.email;
  
  const unread = PC_getUnreadCount();
  const badge = document.getElementById('notifBadge');
  if(badge){
    badge.textContent = unread > 0 ? unread : '';
    badge.style.display = unread > 0 ? 'inline-block' : 'none';
  }
}

function PC_getExpectedAmount(event, member){
  if(!member || !(member.role||[]).includes('payer')) return 0;
  if(member.customAmount != null) return Number(member.customAmount);
  return Number(event.amount || 0);
}

function PC_getUser(){ return JSON.parse(sessionStorage.getItem('pc_current_user')); }
function PC_requireLogin(){ if(!PC_getUser()){ location.href='login.html?next='+encodeURIComponent(location.href); return null; } return PC_getUser(); }
function PC_requireAdmin(){ return PC_requireLogin(); }
function PC_saveEvents(e){ localStorage.setItem('pc_events__' + PC_getUser().email, JSON.stringify(e)); }
function PC_nowStr(){ const n = new Date(); return (n.getMonth()+1)+'/'+n.getDate()+' '+n.getHours()+':'+n.getMinutes(); }
function PC_genTxId(){ return 'PC'+Date.now().toString(36).toUpperCase(); }
function PC_getPayers(e){ return (e.members||[]).filter(m=>(m.role||[]).includes('payer') && m.status !== 'exited'); }
function PC_getCollected(e){ return PC_getPayers(e).filter(m=>m.status==='paid').reduce((s,m)=>s+PC_getExpectedAmount(e,m), 0); }
function PC_getExpected(e){ return PC_getPayers(e).reduce((s,m)=>s+PC_getExpectedAmount(e,m), 0); }
function PC_copyText(t,m){ navigator.clipboard.writeText(t).then(()=>PC_toast(m||'✅ 已複製')); }
const ROLE_LABELS = {admin:'管理員', payer:'繳費者', observer:'觀察者', counter:'統計者'};
