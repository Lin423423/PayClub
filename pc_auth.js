// PayClub shared utilities v4
const DEMO_USER = { name: 'Demo 幹部', email: 'demo@payclub.app', role: 'leader', isDemo: true };

// NO seed events - all users start empty
function PC_getUser(){ return JSON.parse(localStorage.getItem('pc_current_user')||'null'); }
function PC_isLoggedIn(){ return !!PC_getUser(); }
function PC_requireLogin(){
  if(!PC_isLoggedIn()){ location.href='login.html?next='+encodeURIComponent(location.href); return null; }
  return PC_getUser();
}
function PC_requireLeader(){
  const u=PC_requireLogin();
  if(!u)return null;
  if(u.role!=='leader'){ location.href='member.html'; return null; }
  return u;
}
function PC_logout(){
  const u=PC_getUser();
  if(u){
    // Always clear events on logout (per-user isolation)
    localStorage.removeItem(PC_eventsKey(u));
    PC_logActivity(u, u.isDemo?'logout_demo':'logout');
    localStorage.removeItem('pc_current_user');
  }
  location.href='login.html';
}

// Storage key per user
function PC_eventsKey(user){ return 'pc_events__'+(user?user.email:'guest'); }

function PC_getEvents(){
  const u=PC_getUser();
  const key=PC_eventsKey(u);
  const raw=localStorage.getItem(key);
  if(!raw) return []; // Empty for all new users
  return JSON.parse(raw);
}
function PC_saveEvents(e){ const u=PC_getUser(); localStorage.setItem(PC_eventsKey(u),JSON.stringify(e)); }
function PC_getEvent(id){ return PC_getEvents().find(e=>e.id===id)||null; }

// Generate random invite code
function PC_genInviteCode(){
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code='';
  for(let i=0;i<8;i++) code+=chars[Math.floor(Math.random()*chars.length)];
  return code;
}

// User registry for admin
function PC_registerUser(user){
  const reg=JSON.parse(localStorage.getItem('pc_user_registry')||'[]');
  const now=new Date().toISOString();
  const existing=reg.find(r=>r.email===user.email);
  if(!existing){
    reg.push({email:user.email,name:user.name,role:user.role,isDemo:!!user.isDemo,createdAt:now,lastLogin:now,loginCount:1});
  } else {
    existing.lastLogin=now; existing.loginCount=(existing.loginCount||0)+1; existing.name=user.name;
  }
  localStorage.setItem('pc_user_registry',JSON.stringify(reg));
}
function PC_logActivity(user,action){
  if(!user)return;
  const logs=JSON.parse(localStorage.getItem('pc_activity_log')||'[]');
  logs.unshift({email:user.email,name:user.name,action,time:new Date().toISOString()});
  if(logs.length>200)logs.splice(200);
  localStorage.setItem('pc_activity_log',JSON.stringify(logs));
}

function PC_fillSidebarUser(){
  const u=PC_getUser(); if(!u)return;
  const n=document.getElementById('userName'); const a=document.getElementById('avatarInitial');
  if(n)n.textContent=u.name; if(a)a.textContent=u.name.slice(0,1);
}

function PC_toast(msg,duration=2500){
  let t=document.getElementById('toast');
  if(!t){t=document.createElement('div');t.id='toast';t.className='toast';document.body.appendChild(t);}
  t.textContent=msg; t.classList.add('show');
  clearTimeout(t._timer); t._timer=setTimeout(()=>t.classList.remove('show'),duration);
}
function PC_nowStr(){
  const n=new Date();
  return (n.getMonth()+1).toString().padStart(2,'0')+'/'+(n.getDate()).toString().padStart(2,'0')+' '+n.getHours().toString().padStart(2,'0')+':'+n.getMinutes().toString().padStart(2,'0');
}
function PC_getPayers(event){ return (event.members||[]).filter(m=>m.role==='payer'); }
function PC_getExpectedAmount(event,member){
  if(!member||member.role!=='payer') return 0;
  if(event.amountMode==='custom'&&member.customAmount!=null) return Number(member.customAmount)||0;
  return Number(event.amount)||0;
}
function PC_getCollected(event){
  return PC_getPayers(event).filter(m=>m.status==='paid').reduce((s,m)=>s+PC_getExpectedAmount(event,m),0);
}
function PC_getExpected(event){
  return PC_getPayers(event).reduce((s,m)=>s+PC_getExpectedAmount(event,m),0);
}
