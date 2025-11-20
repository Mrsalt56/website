// ============================
// FIREBASE CONFIG
// ============================
const firebaseConfig = {
  apiKey: "AIzaSyDyk5FAyCRyAn6ll5_nfSV5e16mvi1l-n4",
  authDomain: "mrsalt56-e6066.firebaseapp.com",
  databaseURL: "https://mrsalt56-e6066-default-rtdb.firebaseio.com",
  projectId: "mrsalt56-e6066",
  storageBucket: "mrsalt56-e6066.appspot.com",
  messagingSenderId: "716178119141",
  appId: "1:716178119141:web:2c39c7f79213699a38b70c",
  measurementId: "G-FZWFSV1K2D"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ============================
// CONSTANTS
// ============================
const SUBJECT_ROOMS = [
  "Math 7","Math 8","ELA 7","ELA 8","AVID",
  "Science 7","Science 8","History 7","History 8",
  "Coding","Life Skills","ASB","Band"
];

const ADMIN_DISPLAYNAME = "KEY= 67614156";

// ============================
// UTILS
// ============================
const $id = id => document.getElementById(id);

function escapeHtml(s){
  return String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;');
}

async function sha256Hex(str){
  const enc = new TextEncoder();
  const data = enc.encode(str);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

function normalizeUid(name){
  return name.toLowerCase().replace(/\s+/g,'_').replace(/[^\w\-]/g,'_');
}

function makeDmRoomId(uid1, uid2){
  const a = uid1 < uid2 ? uid1 : uid2;
  const b = uid1 < uid2 ? uid2 : uid1;
  return `dm__${a}__${b}`;
}

// ============================
// PROFANITY
// ============================
const BAD_WORDS = [
  "fuck","shit","bitch","asshole","slut","whore","nigger","faggot","cunt","bastard","dick"
];

function containsProfanity(s){
  if(!s) return false;
  const low = s.toLowerCase();
  for(const w of BAD_WORDS){
    if(low.includes(w)) return true;
    const alt = w.split('').map(ch=>{
      if(ch === 'a') return '@';
      if(ch === 'i') return '1';
      if(ch === 'o') return '0';
      return ch;
    }).join('');
    if(low.includes(alt)) return true;
  }
  return false;
}

function sanitizeMessage(s){
  let out = s;
  for(const w of BAD_WORDS){
    const re = new RegExp(w,'gi');
    out = out.replace(re,'***');
  }
  return out;
}

// ============================
// LOCAL USER STORAGE
// ============================
function saveLocalUser(u){ localStorage.setItem('salty_chat_user', JSON.stringify(u)); }
function loadLocalUser(){ try { return JSON.parse(localStorage.getItem('salty_chat_user')||'null'); } catch(e){ return null; } }
function clearLocalUser(){ localStorage.removeItem('salty_chat_user'); }

// ============================
// PRESENCE (ONLINE)
// ============================
let presenceRef = null;

async function setPresenceIfLoggedIn(){
  const u = loadLocalUser();
  if(!u) return;
  const uid = u.uid;
  const pRef = db.ref('presence/' + uid);
  pRef.set({ displayName: u.displayName, lastActive: Date.now() });
  pRef.onDisconnect().remove();
  presenceRef = pRef;
}

function watchPresence(){
  const list = $id('onlineList');
  db.ref('presence').on('value', snap=>{
    const arr = [];
    snap.forEach(c=>arr.push(c.val()));
    arr.sort((a,b)=>(a.displayName||'').localeCompare(b.displayName||''));
    list.innerHTML = arr.length
      ? arr.map(e=>`<div><span class="chat-online-dot"></span>${escapeHtml(e.displayName||'')}</div>`).join('')
      : '<div class="chat-small">No one online</div>';
  });
}

// ============================
// VERIFIED USERS
// ============================
const verifiedMap = {};
function watchVerified(){
  db.ref('verified').on('value', snap=>{
    Object.keys(verifiedMap).forEach(k=>delete verifiedMap[k]);
    snap.forEach(c=>{
      if(c.val()) verifiedMap[c.key] = true;
    });
  });
}
function isVerified(uid){
  return !!verifiedMap[uid];
}

// ============================
// DOM references
// ============================
const roomsListEl  = $id('roomsList');
const groupsListEl = $id('groupsList');
const dmsListEl    = $id('dmsList');

let currentChat = {
  type: null,   // 'room' | 'group' | 'dm'
  id: null,
  path: null
};
let messagesRef = null;

// ============================
// SUBJECT ROOMS
// ============================
function buildSubjectRooms(){
  roomsListEl.innerHTML = '';
  SUBJECT_ROOMS.forEach(r=>{
    const id = normalizeUid(r);
    const div = document.createElement('div');
    div.className = 'chat-list-item';
    div.id = 'room-' + id;
    div.innerHTML = `
      <div>
        <div>${escapeHtml(r)}</div>
        <div class="chat-preview" id="last-room-${id}"></div>
      </div>
    `;
    div.addEventListener('click', ()=>openChat('room', id, r));
    roomsListEl.appendChild(div);
  });
}

// Watch last message previews for subject rooms
function watchSubjectLastMessages(){
  SUBJECT_ROOMS.forEach(r=>{
    const id = normalizeUid(r);
    const ref = db.ref('chats/' + id).limitToLast(1);
    ref.on('value', snap=>{
      let text = '';
      snap.forEach(c=>{
        const v = c.val();
        if(v){
          const msgText = (v.text || v.message || '').toString();
          text = `${v.name || 'Unknown'}: ${msgText.substring(0,30)}`;
        }
      });
      const el = $id('last-room-' + id);
      if(el) el.textContent = text;
    });
  });
}

// ============================
// GROUPS
// ============================
function watchGroupList(){
  groupsListEl.innerHTML = '';
  db.ref('groups').on('value', snap=>{
    groupsListEl.innerHTML = '';
    const arr = [];
    snap.forEach(c=>{
      const v = c.val();
      if(!v) return;
      arr.push({id:c.key, ...v});
    });
    if(!arr.length){
      groupsListEl.innerHTML = '<div class="chat-small">No groups yet.</div>';
      return;
    }
    arr.sort((a,b)=>(a.name||'').localeCompare(b.name||''));
    arr.forEach(g=>{
      const div = document.createElement('div');
      div.className = 'chat-list-item';
      div.id = 'group-' + g.id;
      div.innerHTML = `
        <div>
          <div>${escapeHtml(g.name||'Group')}</div>
          <div class="chat-preview" id="last-group-${g.id}"></div>
        </div>
      `;
      div.addEventListener('click', ()=>openChat('group', g.id, g.name || 'Group'));
      groupsListEl.appendChild(div);
    });

    // watch last group messages
    arr.forEach(g=>{
      const ref = db.ref('chats/' + g.id).limitToLast(1);
      ref.on('value', snap2=>{
        let text = '';
        snap2.forEach(c2=>{
          const v = c2.val();
          if(v){
            const msgText = (v.text || v.message || '').toString();
            text = `${v.name || 'Unknown'}: ${msgText.substring(0,30)}`;
          }
        });
        const el = $id('last-group-' + g.id);
        if(el) el.textContent = text;
      });
    });
  });
}

// Create group
$id('createGroupBtn').addEventListener('click', async ()=>{
  const me = loadLocalUser();
  if(!me) return alert('Login first.');
  const name = prompt('Group name:');
  if(!name) return;
  if(containsProfanity(name)) return alert('Group name has banned words.');
  const id = 'grp_' + normalizeUid(name) + '_' + Date.now().toString(36);
  await db.ref('groups/' + id).set({
    name,
    ownerUid: me.uid,
    createdAt: Date.now()
  });
  openChat('group', id, name);
});

// ============================
// DM LIST & NOTIFICATIONS
// ============================
let dmListeners = {};
let currentNotifTimeout = null;

function showNotif(msg){
  const el = $id('notifArea');
  el.textContent = msg || '';
  if(currentNotifTimeout) clearTimeout(currentNotifTimeout);
  if(msg){
    currentNotifTimeout = setTimeout(()=>{ el.textContent=''; }, 5000);
  }
}

function watchDmList(){
  const me = loadLocalUser();
  if(!me) return;
  const uid = me.uid;
  db.ref('dmIndex/' + uid).on('value', snap=>{
    dmsListEl.innerHTML = '';
    const arr = [];
    snap.forEach(c=>{
      arr.push({roomId:c.key, ...c.val()});
    });
    if(!arr.length){
      dmsListEl.innerHTML = '<div class="chat-small">No DMs yet.</div>';
      return;
    }
    arr.sort((a,b)=>(a.displayName||'').localeCompare(b.displayName||''));
    arr.forEach(d=>{
      const div = document.createElement('div');
      div.className = 'chat-list-item';
      div.id = 'dm-' + d.roomId;
      div.innerHTML = `
        <div>
          <div>${escapeHtml(d.displayName||'User')}</div>
          <div class="chat-preview" id="last-dm-${d.roomId}"></div>
        </div>
      `;
      div.addEventListener('click', ()=>openChat('dm', d.roomId, d.displayName||'DM'));
      dmsListEl.appendChild(div);
    });

    // attach watchers for last DM message + notifications
    Object.values(dmListeners).forEach(unsub=>unsub && unsub());
    dmListeners = {};
    arr.forEach(d=>{
      const ref = db.ref('dms/' + d.roomId).limitToLast(1);
      const cb = ref.on('value', snap2=>{
        let lastMsg = null;
        snap2.forEach(c2=> lastMsg = c2.val());
        const el = $id('last-dm-' + d.roomId);
        if(lastMsg){
          const text = (lastMsg.text || lastMsg.message || '').toString().substring(0,30);
          if(el) el.textContent = `${lastMsg.name || 'Unknown'}: ${text}`;
          const meNow = loadLocalUser();
          if(meNow && lastMsg.uid !== meNow.uid){
            if(!(currentChat.type === 'dm' && currentChat.id === d.roomId)){
              showNotif(`New DM from ${lastMsg.name || 'Unknown'}`);
            }
          }
        }
      });
      dmListeners[d.roomId] = ()=>ref.off('value', cb);
    });
  });
}

// Start DM (search user)
$id('startDmBtn').addEventListener('click', async ()=>{
  const me = loadLocalUser();
  if(!me) return alert('Login first.');
  const targetName = prompt('Enter exact display name of user to DM:');
  if(!targetName) return;
  const targetUid = normalizeUid(targetName);
  if(targetUid === me.uid) return alert('You cannot DM yourself.');

  const snap = await db.ref('users/' + targetUid).get();
  if(!snap.exists()){
    return alert('User not found. Make sure you typed their name exactly.');
  }
  const target = snap.val();
  const roomId = makeDmRoomId(me.uid, targetUid);

  await db.ref('dmIndex/' + me.uid + '/' + roomId).set({
    otherUid: targetUid,
    displayName: target.displayName
  });
  await db.ref('dmIndex/' + targetUid + '/' + roomId).set({
    otherUid: me.uid,
    displayName: me.displayName
  });

  openChat('dm', roomId, target.displayName);
});

// ============================
// OPEN CHAT
// ============================
function clearActiveChatItems(){
  document.querySelectorAll('.chat-list-item').forEach(el=>el.classList.remove('active'));
}

function openChat(type, id, label){
  const me = loadLocalUser();
  if(!me){
    alert('Please login or create an account first.');
    return;
  }

  clearActiveChatItems();
  if(type === 'room'){
    const el = $id('room-' + id);
    if(el) el.classList.add('active');
  } else if(type === 'group'){
    const el = $id('group-' + id);
    if(el) el.classList.add('active');
  } else if(type === 'dm'){
    const el = $id('dm-' + id);
    if(el) el.classList.add('active');
  }

  $id('currentRoomTitle').innerHTML = `<strong>${escapeHtml(label)}</strong>`;
  $id('chatArea').innerHTML = `<div class="chat-small">Loading messages...</div>`;
  $id('inputRow').style.display = 'flex';
  showNotif('');

  if(messagesRef) messagesRef.off();

  let path;
  if(type === 'dm'){
    path = 'dms/' + id;
  } else {
    path = 'chats/' + id;
  }

  currentChat.type = type;
  currentChat.id = id;
  currentChat.path = path;

  // Use limitToLast without orderByChild to avoid index issues
  messagesRef = db.ref(path).limitToLast(500);
  messagesRef.on('value', snap=>{
    const msgs = [];
    snap.forEach(c=>msgs.push({ key:c.key, ...c.val() }));
    renderMessages(msgs);
  });
}

// ============================
// RENDER MESSAGES
// ============================
function renderMessages(messages){
  const area = $id('chatArea');
  area.innerHTML = '';
  if(!messages.length){
    area.innerHTML = '<div class="chat-small">No messages yet — say hi 👋</div>';
    return;
  }

  messages.forEach(m=>{
    const wrap = document.createElement('div');
    wrap.className = 'chat-msg';

    const meta = document.createElement('div');
    meta.className = 'chat-msg-meta';

    const t = new Date(m.ts || 0).toLocaleString();
    const verifiedLabel = isVerified(m.uid)
      ? '<span class="chat-verified-badge">✔</span>'
      : '';

    meta.innerHTML = `
      <div style="font-weight:700">
        ${escapeHtml(m.name || 'Unknown')}${verifiedLabel}
      </div>
      <div class="chat-small">${t}</div>
    `;

    const bubble = document.createElement('div');
    bubble.className = 'chat-msg-bubble';

    if(m.deleted){
      bubble.textContent = '[message deleted by admin]';
    } else {
      const content = (m.text || m.message || '').toString();
      bubble.textContent = content;
    }

    wrap.appendChild(meta);
    wrap.appendChild(bubble);
    area.appendChild(wrap);
  });

  area.scrollTop = area.scrollHeight;
}

// ============================
// SEND MESSAGE (rate limited)
// ============================
let lastMsgTime = 0;
const MSG_COOLDOWN = 1200; // ms

async function sendMessageFromInput(){
  const input = $id('messageInput');
  if(!input) return;
  const raw = input.value.trim();
  if(!raw) return;
  if(!currentChat.id || !currentChat.path){
    alert('Select a room, group, or DM first.');
    return;
  }

  const now = Date.now();
  if(now - lastMsgTime < MSG_COOLDOWN){
    alert('Slow down! You are sending messages too fast.');
    return;
  }
  lastMsgTime = now;

  const me = loadLocalUser();
  if(!me){
    alert('Please login first.');
    return;
  }

  // bans
  const banSnap = await db.ref('bans/' + me.uid).get();
  if(banSnap.exists()){
    alert('You are banned from chat.');
    return;
  }

  // timeouts
  const toSnap = await db.ref('timeouts/' + me.uid).get();
  if(toSnap.exists()){
    const until = toSnap.val().until || 0;
    if(Date.now() < until){
      alert('You are timed out and cannot send messages yet.');
      return;
    }
  }

  let clean = sanitizeMessage(raw).slice(0,1000);
  input.value = '';

  const payload = {
    name: me.displayName,
    uid: me.uid,
    text: clean,
    ts: Date.now()
  };

  db.ref(currentChat.path).push(payload).catch(err=>console.error('send error', err));
}

$id('sendBtn').addEventListener('click', sendMessageFromInput);
document.addEventListener('keydown', e=>{
  if(e.key === 'Enter' && document.activeElement === $id('messageInput')){
    sendMessageFromInput();
  }
});

// ============================
// ADMIN PANEL WITH VERIFY
// ============================
function checkAndRenderAdminUI(){
  const me = loadLocalUser();
  if(!me) return;
  const adminUid = normalizeUid(ADMIN_DISPLAYNAME); // "key__67614156"
  if(me.uid !== adminUid) return;

  const area = $id('adminArea');
  area.innerHTML = `<button id="adminLogin" class="chat-admin-btn">Admin</button>`;

  $id('adminLogin').onclick = ()=>{
    const pw = prompt('Enter admin password:');
    if(pw !== '67614156'){
      alert('Incorrect admin password.');
      return;
    }
    openAdminPanel(adminUid);
  };
}

function openAdminPanel(adminUid){
  const modal = document.createElement('div');
  modal.style.position='fixed';
  modal.style.left='50%';
  modal.style.top='50%';
  modal.style.transform='translate(-50%,-50%)';
  modal.style.background='rgba(6,7,10,0.98)';
  modal.style.padding='18px';
  modal.style.zIndex=9999;
  modal.style.borderRadius='8px';
  modal.style.minWidth='420px';
  modal.style.color='#fff';
  modal.id='adminModal';
  modal.innerHTML = `
    <h3>Admin Panel</h3>
    <div style="display:flex;gap:8px;margin-bottom:8px">
      <button id="closeAdmin" class="chat-admin-btn">Close</button>
      <button id="reloadUsers" class="chat-admin-btn">Refresh Presence</button>
    </div>

    <div style="margin-bottom:10px">
      <label>Ban user (uid): <input id="banUid" placeholder="user_uid"></label>
      <button id="banBtn" class="chat-admin-btn chat-admin-btn-danger">Ban</button>
      <button id="unbanBtn" class="chat-admin-btn">Unban</button>
    </div>

    <div style="margin-bottom:10px">
      <label>Timeout user (uid): <input id="timeoutUid" placeholder="user_uid"></label>
      <label>Duration (minutes): <input id="timeoutMin" type="number" min="5" max="60" value="5" style="width:80px"></label>
      <button id="timeoutBtn" class="chat-admin-btn">Timeout</button>
    </div>

    <div style="margin-bottom:10px">
      <label>Verify user (uid): <input id="verifyUid" placeholder="user_uid"></label>
      <button id="verifyBtn" class="chat-admin-btn">Verify</button>
      <button id="unverifyBtn" class="chat-admin-btn">Unverify</button>
    </div>

    <div style="margin-bottom:10px">
      <label>Delete last N messages: <input id="delN" type="number" min="1" value="10" style="width:80px"></label>
      <select id="delRoom">
        ${SUBJECT_ROOMS.map(r=>`<option value="${normalizeUid(r)}">${escapeHtml(r)}</option>`).join('')}
      </select>
      <button id="delNBtn" class="chat-admin-btn chat-admin-btn-danger">Delete</button>
    </div>

    <div style="margin-bottom:10px">
      <label>Delete messages with more than X words:
        <input id="delWordsCount" type="number" min="1" value="30" style="width:80px">
      </label>
      <select id="delWordsRoom">
        ${SUBJECT_ROOMS.map(r=>`<option value="${normalizeUid(r)}">${escapeHtml(r)}</option>`).join('')}
      </select>
      <button id="delWordsBtn" class="chat-admin-btn chat-admin-btn-danger">Delete</button>
    </div>

    <div style="margin-bottom:10px">
      <label>Delete whole room:
        <select id="delRoomAll">
          ${SUBJECT_ROOMS.map(r=>`<option value="${normalizeUid(r)}">${escapeHtml(r)}</option>`).join('')}
        </select>
      </label>
      <button id="delRoomBtn" class="chat-admin-btn chat-admin-btn-danger">Delete Room</button>
    </div>

    <div style="margin-top:12px" id="adminResult" class="chat-small"></div>
  `;
  document.body.appendChild(modal);

  $id('closeAdmin').onclick = ()=>modal.remove();
  $id('reloadUsers').onclick = ()=>setPresenceIfLoggedIn();

  $id('banBtn').onclick = async ()=>{
    const uid = $id('banUid').value.trim();
    if(!uid) return alert('enter uid');
    await db.ref('bans/' + uid).set({ by: loadLocalUser().uid, at: Date.now() });
    $id('adminResult').textContent = `Banned ${uid}`;
  };
  $id('unbanBtn').onclick = async ()=>{
    const uid = $id('banUid').value.trim();
    if(!uid) return alert('enter uid');
    await db.ref('bans/' + uid).remove();
    $id('adminResult').textContent = `Unbanned ${uid}`;
  };

  $id('timeoutBtn').onclick = async ()=>{
    const uid = $id('timeoutUid').value.trim();
    let min = parseInt($id('timeoutMin').value||'5',10);
    if(!uid) return alert('enter uid');
    if(isNaN(min) || min < 5) min = 5;
    if(min > 60) min = 60;
    const until = Date.now() + (min*60*1000);
    await db.ref('timeouts/' + uid).set({ by: loadLocalUser().uid, until, minutes: min });
    $id('adminResult').textContent = `Timed out ${uid} for ${min} minute(s)`;
  };

  $id('verifyBtn').onclick = async ()=>{
    const uid = $id('verifyUid').value.trim();
    if(!uid) return alert('enter uid');
    await db.ref('verified/' + uid).set(true);
    $id('adminResult').textContent = `Verified ${uid}`;
  };
  $id('unverifyBtn').onclick = async ()=>{
    const uid = $id('verifyUid').value.trim();
    if(!uid) return alert('enter uid');
    await db.ref('verified/' + uid).remove();
    $id('adminResult').textContent = `Unverified ${uid}`;
  };

  $id('delNBtn').onclick = async ()=>{
    const n = parseInt($id('delN').value||'10',10);
    const room = $id('delRoom').value;
    if(!n || n <= 0) return alert('enter N');
    const ref = db.ref('chats/' + room).limitToLast(n);
    const snap = await ref.get();
    const updates = {};
    snap.forEach(c=>{ updates[`chats/${room}/${c.key}`] = null; });
    await db.ref().update(updates);
    $id('adminResult').textContent = `Deleted last ${n} messages from ${room}`;
  };

  $id('delWordsBtn').onclick = async ()=>{
    const cnt = parseInt($id('delWordsCount').value||'30',10);
    const room = $id('delWordsRoom').value;
    if(!cnt || cnt <= 0) return alert('enter count');
    const snap = await db.ref('chats/' + room).get();
    const updates = {};
    snap.forEach(c=>{
      const val = c.val() || {};
      const txt = (val.text || val.message || '').trim();
      const wc = txt ? txt.split(/\s+/).length : 0;
      if(wc > cnt) updates[`chats/${room}/${c.key}`] = null;
    });
    await db.ref().update(updates);
    $id('adminResult').textContent = `Deleted messages with > ${cnt} words in ${room}`;
  };

  $id('delRoomBtn').onclick = async ()=>{
    const room = $id('delRoomAll').value;
    if(!confirm('Are you sure? This deletes entire room chat history.')) return;
    await db.ref('chats/' + room).remove();
    $id('adminResult').textContent = `Deleted all messages in ${room}`;
  };
}

// ============================
// LOGIN / SIGNUP UI
// ============================
async function renderUserBox(){
  const box = $id('userBox');
  const saved = loadLocalUser();
  box.innerHTML = '';

  if(saved && saved.displayName){
    box.innerHTML = `
      <div style="flex:1">
        <div class="chat-user-name">${escapeHtml(saved.displayName)}</div>
        <div class="chat-small">Logged in on this device</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <button id="logoutBtn" style="background:#ff4d4d;padding:6px 8px;border-radius:6px;border:none;color:#fff;cursor:pointer">Logout</button>
      </div>
    `;
    $id('logoutBtn').addEventListener('click', ()=>{
      if(presenceRef) presenceRef.remove();
      clearLocalUser();
      renderUserBox();
      renderLoggedInSmall();
      $id('chatArea').innerHTML = '<div class="chat-small">Pick a room, group, or DM on the left to start chatting.</div>';
      $id('inputRow').style.display = 'none';
    });
    renderLoggedInSmall();
    setPresenceIfLoggedIn();
    checkAndRenderAdminUI();
    watchDmList();
    return;
  }

  box.innerHTML = `
    <div style="width:100%">
      <div class="chat-login-panel">
        <input id="regName" placeholder="Display name (like: Chris)" />
        <input id="regPass" type="password" placeholder="Password" />
        <div style="display:flex;gap:8px">
          <button id="registerBtn">Create Account</button>
          <button id="loginBtn" style="background:#2e8b57">Login</button>
        </div>
      </div>
    </div>
  `;

  $id('registerBtn').onclick = async ()=>{
    const name = ($id('regName').value||'').trim();
    const pass = ($id('regPass').value||'').trim();
    if(!name || !pass) return alert('Please set a name and a password.');
    if(containsProfanity(name)) return alert('That username contains banned words — choose a different name.');
    if(name.length < 2) return alert('Choose a longer name.');
    const uid = normalizeUid(name);
    const pwHash = await sha256Hex(pass);
    const ref = db.ref('users/' + uid);
    const snap = await ref.get();
    if(snap.exists()) return alert('That name is already taken. Choose another.');
    await ref.set({ displayName:name, passwordHash:pwHash, createdAt:Date.now() });
    saveLocalUser({ uid, displayName:name });
    renderUserBox();
    alert('Account created and logged in on this device.');
  };

  $id('loginBtn').onclick = async ()=>{
    const name = ($id('regName').value||'').trim();
    const pass = ($id('regPass').value||'').trim();
    if(!name || !pass) return alert('Enter name and password.');
    const uid = normalizeUid(name);
    const pwHash = await sha256Hex(pass);
    const ref = db.ref('users/' + uid);
    const snap = await ref.get();
    if(!snap.exists()) return alert('User not found. Create an account first.');
    const data = snap.val();
    if(data.passwordHash !== pwHash) return alert('Incorrect password.');
    saveLocalUser({ uid, displayName:data.displayName });
    renderUserBox();
    alert('Logged in on this device.');
  };
}

function renderLoggedInSmall(){
  const small = $id('loggedInAs');
  const saved = loadLocalUser();
  small.textContent = saved ? `Signed in as ${saved.displayName}` : '';
}

// ============================
// INIT
// ============================
(function init(){
  buildSubjectRooms();
  watchSubjectLastMessages();
  watchGroupList();
  renderUserBox();
  watchPresence();
  watchVerified();
})();
