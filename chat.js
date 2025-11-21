// -------------------------
// Firebase setup
// -------------------------
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

// -------------------------
// DOM helpers
// -------------------------
const $ = sel => document.querySelector(sel);
const roomListEl = $('#roomList');
const dmListEl = $('#dmList');
const groupListEl = $('#groupList');
const onlineListEl = $('#onlineList');
const adminOnlineListEl = $('#adminOnlineList');

const roomNameEl = $('#roomName');
const roomSubtitleEl = $('#roomSubtitle');
const chatAreaEl = $('#chatArea');
const typingIndicatorEl = $('#typingIndicator');
const msgInputEl = $('#messageInput');
const sendBtnEl = $('#sendBtn');
const displayNameEl = $('#displayName');

const accountModal = $('#accountModal');
const signupView = $('#signupView');
const accountView = $('#accountView');
const accUsernameEl = $('#accUsername');
const accUidEl = $('#accUid');
const accStatusEl = $('#accStatus');

const adminModal = $('#adminModal');
const adminLoginView = $('#adminLoginView');
const adminPanelView = $('#adminPanelView');

// -------------------------
// State
// -------------------------
const SUBJECT_ROOMS = [
  'Math 7', 'Math 8',
  'ELA 7', 'ELA 8',
  'Science', 'Social Studies', 'Random'
];

const PROFANITY = ['badword1','badword2','fuck','shit']; // add more

const ADMIN_KEY = '67614156';
let currentUser = null;
let isAdmin = false;

let currentRoom = null; // { type: 'room'|'group'|'dm', id, label, otherUid? }
let currentMessagesRef = null;
let currentTypingRef = null;
let typingTimeoutId = null;

// rate limiting
let lastMsgTime = 0;
let messagesThisWindow = 0;

// -------------------------
// Utility
// -------------------------
function uid() {
  return 'u_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function now() {
  return Date.now();
}

function sanitizeText(text) {
  let out = text;
  PROFANITY.forEach(w => {
    const re = new RegExp(w, 'ig');
    out = out.replace(re, '***');
  });
  return out;
}

function showModal(modal) {
  modal.style.display = 'flex';
}

function hideModal(modal) {
  modal.style.display = 'none';
}

function scrollToBottom() {
  chatAreaEl.scrollTop = chatAreaEl.scrollHeight;
}

// -------------------------
// ACCOUNT SYSTEM
// -------------------------
function loadUserFromStorage() {
  const raw = localStorage.getItem('chatUser');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function saveUserToStorage(user) {
  localStorage.setItem('chatUser', JSON.stringify(user));
}

function ensureAccount() {
  currentUser = loadUserFromStorage();

  if (!currentUser) {
    // show signup
    signupView.style.display = 'block';
    accountView.style.display = 'none';
    showModal(accountModal);
  } else {
    onLoggedIn();
  }
}

function createAccount() {
  const username = $('#signupUsername').value.trim();
  const password = $('#signupPassword').value.trim();

  if (!username || !password) {
    alert('Enter username and password.');
    return;
  }

  if (PROFANITY.some(w => username.toLowerCase().includes(w))) {
    alert('No profanity in usernames.');
    return;
  }

  const user = {
    uid: uid(),
    username,
    password, // stored ONLY on device
    createdAt: now()
  };

  currentUser = user;
  saveUserToStorage(user);

  // write to /users
  db.ref('users/' + user.uid).set({
    username,
    createdAt: user.createdAt,
    verified: false,
    bannedUntil: 0,
    timeoutUntil: 0,
    role: 'user'
  });

  hideModal(accountModal);
  onLoggedIn();
}

function onLoggedIn() {
  displayNameEl.textContent = currentUser.username;
  accUsernameEl.textContent = currentUser.username;
  accUidEl.textContent = currentUser.uid;
  accStatusEl.textContent = 'Normal';

  signupView.style.display = 'none';
  accountView.style.display = 'block';

  setupPresence();
  loadSidebarRooms();
}

function logout() {
  localStorage.removeItem('chatUser');
  location.reload();
}

// -------------------------
// PRESENCE + ONLINE USERS
// -------------------------
function setupPresence() {
  const presRef = db.ref('presence/' + currentUser.uid);
  presRef.set({
    username: currentUser.username,
    online: true,
    lastSeen: now()
  });
  presRef.onDisconnect().set({
    username: currentUser.username,
    online: false,
    lastSeen: now()
  });

  db.ref('presence').on('value', snap => {
    const onlineUsers = [];
    snap.forEach(child => {
      onlineUsers.push({ uid: child.key, ...child.val() });
    });
    renderOnlineLists(onlineUsers);
  });
}

function renderOnlineLists(users) {
  onlineListEl.innerHTML = '';
  adminOnlineListEl.innerHTML = '';

  users.forEach(u => {
    const li = document.createElement('li');
    li.textContent = u.username;
    if (u.online) {
      const dot = document.createElement('span');
      dot.className = 'status-dot';
      li.appendChild(dot);
    }
    onlineListEl.appendChild(li);

    const li2 = li.cloneNode(true);
    adminOnlineListEl.appendChild(li2);
  });
}

// -------------------------
// SIDEBAR: SUBJECT ROOMS / GROUPS / DMS
// -------------------------
function loadSidebarRooms() {
  // subject rooms static
  roomListEl.innerHTML = '';
  SUBJECT_ROOMS.forEach(name => {
    const li = document.createElement('li');
    li.textContent = name;
    li.dataset.roomId = name.replace(/\s+/g, '_').toLowerCase();
    li.addEventListener('click', () =>
      openRoom({ type: 'room', id: li.dataset.roomId, label: name })
    );
    roomListEl.appendChild(li);
  });

  // groups where user is member
  const groupsRef = db.ref('groups');
  groupsRef.on('value', snap => {
    groupListEl.innerHTML = '';
    snap.forEach(child => {
      const g = child.val();
      if (!g.members || !g.members[currentUser.uid]) return;
      const li = document.createElement('li');
      li.textContent = g.meta.name || 'Group';
      li.dataset.groupId = child.key;
      li.addEventListener('click', () =>
        openRoom({ type: 'group', id: child.key, label: g.meta.name })
      );
      groupListEl.appendChild(li);
    });
  });

  // DMs: list of other uids under /dms/{me}
  const dmsRef = db.ref('dms/' + currentUser.uid);
  dmsRef.on('value', snap => {
    dmListEl.innerHTML = '';
    snap.forEach(child => {
      const otherUid = child.key;
      // get username
      db.ref('users/' + otherUid + '/username').once('value').then(ss => {
        const username = ss.val() || otherUid;
        const li = document.createElement('li');
        li.textContent = username;
        li.dataset.otherUid = otherUid;
        li.addEventListener('click', () =>
          openRoom({
            type: 'dm',
            id: otherUid,
            label: 'DM: ' + username,
            otherUid
          })
        );
        dmListEl.appendChild(li);
      });
    });
  });
}

// Create group
$('#createGroupBtn').addEventListener('click', () => {
  const name = prompt('Group name?');
  if (!name) return;
  const ref = db.ref('groups').push();
  const groupId = ref.key;
  ref.set({
    meta: {
      name,
      owner: currentUser.uid,
      createdAt: now()
    },
    members: {
      [currentUser.uid]: true
    }
  });
  openRoom({ type: 'group', id: groupId, label: name });
});

// -------------------------
// OPEN ROOM
// -------------------------
function detachRoomListeners() {
  if (currentMessagesRef) currentMessagesRef.off();
  if (currentTypingRef) currentTypingRef.off();
  typingIndicatorEl.textContent = '';
}

function roomKey(room) {
  if (!room) return '';
  if (room.type === 'room') return 'room_' + room.id;
  if (room.type === 'group') return 'group_' + room.id;
  if (room.type === 'dm') {
    const ids = [currentUser.uid, room.otherUid].sort().join('_');
    return 'dm_' + ids;
  }
  return '';
}

function openRoom(room) {
  detachRoomListeners();
  currentRoom = room;
  roomNameEl.textContent = room.label;
  roomSubtitleEl.textContent =
    room.type === 'room'
      ? 'Subject room'
      : room.type === 'group'
        ? 'Group chat'
        : 'Private DM';

  chatAreaEl.innerHTML = '';

  // highlight active
  document.querySelectorAll('.list li').forEach(li =>
    li.classList.remove('active')
  );
  if (room.type === 'room') {
    const li = [...roomListEl.children].find(
      li => li.dataset.roomId === room.id
    );
    if (li) li.classList.add('active');
  } else if (room.type === 'group') {
    const li = [...groupListEl.children].find(
      li => li.dataset.groupId === room.id
    );
    if (li) li.classList.add('active');
  } else if (room.type === 'dm') {
    const li = [...dmListEl.children].find(
      li => li.dataset.otherUid === room.otherUid
    );
    if (li) li.classList.add('active');
  }

  let path;
  if (room.type === 'room') path = 'chats/' + room.id;
  if (room.type === 'group') path = 'groups/' + room.id + '/messages';
  if (room.type === 'dm')
    path = 'dms/' + currentUser.uid + '/' + room.otherUid;

  currentMessagesRef = db.ref(path);
  currentMessagesRef
    .orderByChild('createdAt')
    .limitToLast(200)
    .on('child_added', snap => addMessageToUI(snap.key, snap.val()));

  // typing
  const tKey = roomKey(room);
  currentTypingRef = db.ref('typing/' + tKey);
  currentTypingRef.on('value', snap => {
    const typers = [];
    snap.forEach(child => {
      if (child.key === currentUser.uid) return;
      if (child.val()) typers.push(child.key);
    });
    if (!typers.length) {
      typingIndicatorEl.textContent = '';
    } else {
      typingIndicatorEl.textContent =
        typers.length === 1 ? 'Someone is typing…' : 'Several people are typing…';
    }
  });
}

// -------------------------
// RENDER MESSAGE
// -------------------------
function addMessageToUI(key, msg) {
  const div = document.createElement('div');
  const mine = msg.uid === currentUser.uid;
  div.className = 'msg ' + (mine ? 'me' : 'them');

  const userSpan = document.createElement('div');
  userSpan.className = 'username';
  userSpan.textContent = msg.username;
  div.appendChild(userSpan);

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = msg.deleted ? 'Message removed by admin' : msg.text;
  if (msg.deleted) bubble.classList.add('deleted');
  div.appendChild(bubble);

  const meta = document.createElement('div');
  meta.className = 'meta';
  const date = new Date(msg.createdAt);
  meta.textContent = date.toLocaleTimeString();
  div.appendChild(meta);

  // admin per-message actions
  if (isAdmin && !msg.deleted) {
    bubble.addEventListener('contextmenu', e => {
      e.preventDefault();
      if (confirm('Delete this message?')) {
        markMessageDeleted(key, msg);
      }
    });
  }

  chatAreaEl.appendChild(div);
  scrollToBottom();
}

function markMessageDeleted(key, msg) {
  if (!currentRoom) return;
  let path;
  if (currentRoom.type === 'room')
    path = 'chats/' + currentRoom.id + '/' + key;
  if (currentRoom.type === 'group')
    path = 'groups/' + currentRoom.id + '/messages/' + key;
  if (currentRoom.type === 'dm')
    path =
      'dms/' + currentUser.uid + '/' + currentRoom.otherUid + '/' + key;

  db.ref(path).update({
    deleted: true,
    deletedBy: 'admin'
  });

  logAdminAction('deleteMessage', msg.uid);
}

// -------------------------
// SEND MESSAGE
// -------------------------
function sendMessage() {
  if (!currentRoom) return;
  let text = msgInputEl.value.trim();
  if (!text) return;

  const nowTime = now();
  if (nowTime - lastMsgTime > 5000) {
    messagesThisWindow = 0;
    lastMsgTime = nowTime;
  }
  messagesThisWindow++;
  if (messagesThisWindow > 5) {
    alert('Slow down a bit (rate limit).');
    return;
  }

  text = sanitizeText(text);

  // check bans / timeouts
  db.ref('users/' + currentUser.uid).once('value').then(snap => {
    const u = snap.val() || {};
    if (u.bannedUntil && u.bannedUntil > now()) {
      alert('You are banned from chatting right now.');
      return;
    }
    if (u.timeoutUntil && u.timeoutUntil > now()) {
      alert('You are timed out.');
      return;
    }

    let path;
    const msgData = {
      uid: currentUser.uid,
      username: currentUser.username,
      text,
      createdAt: now()
    };

    if (currentRoom.type === 'room')
      path = 'chats/' + currentRoom.id;
    if (currentRoom.type === 'group')
      path = 'groups/' + currentRoom.id + '/messages';
    if (currentRoom.type === 'dm') {
      const path1 =
        'dms/' + currentUser.uid + '/' + currentRoom.otherUid;
      const path2 =
        'dms/' + currentRoom.otherUid + '/' + currentUser.uid;
      const newRef = db.ref(path1).push();
      const key = newRef.key;
      const updates = {};
      updates[path1 + '/' + key] = {
        from: currentUser.uid,
        to: currentRoom.otherUid,
        text,
        createdAt: msgData.createdAt,
        uid: currentUser.uid,
        username: currentUser.username
      };
      updates[path2 + '/' + key] = updates[path1 + '/' + key];
      db.ref().update(updates);
      msgInputEl.value = '';
      return;
    }

    db.ref(path).push(msgData);
    msgInputEl.value = '';
  });
}

// typing indicator
function handleTyping() {
  if (!currentRoom) return;
  const key = roomKey(currentRoom);
  const tRef = db.ref('typing/' + key + '/' + currentUser.uid);
  tRef.set(true);
  if (typingTimeoutId) clearTimeout(typingTimeoutId);
  typingTimeoutId = setTimeout(() => tRef.set(false), 3000);
}

// -------------------------
// ADMIN SYSTEM
// -------------------------
function logAdminAction(type, target, roomIdOverride) {
  const ref = db.ref('adminActions').push();
  ref.set({
    adminUid: currentUser.uid,
    type,
    target: target || '',
    roomId: roomIdOverride || (currentRoom ? roomKey(currentRoom) : ''),
    createdAt: now()
  });
}

function adminLogin() {
  const key = $('#adminKeyInput').value.trim();
  if (key !== ADMIN_KEY) {
    alert('Wrong admin key.');
    return;
  }

  // mark admin in DB
  db.ref('admins/' + currentUser.uid).set(true);
  db.ref('users/' + currentUser.uid + '/role').set('admin');

  isAdmin = true;
  adminLoginView.style.display = 'none';
  adminPanelView.style.display = 'block';
}

function performUserAction(action, username) {
  // find user by username
  db.ref('users')
    .orderByChild('username')
    .equalTo(username)
    .once('value')
    .then(snap => {
      if (!snap.exists()) {
        alert('User not found.');
        return;
      }
      const uid = Object.keys(snap.val())[0];
      const userRef = db.ref('users/' + uid);

      const updates = {};
      const fiveMin = 5 * 60 * 1000;
      const oneHour = 60 * 60 * 1000;

      if (action === 'ban-5')
        updates.bannedUntil = now() + fiveMin;
      if (action === 'ban-60')
        updates.bannedUntil = now() + oneHour;
      if (action === 'unban') updates.bannedUntil = 0;
      if (action === 'timeout-5')
        updates.timeoutUntil = now() + fiveMin;
      if (action === 'timeout-60')
        updates.timeoutUntil = now() + oneHour;
      if (action === 'verify') updates.verified = true;

      userRef.update(updates);
      logAdminAction(action, uid);
      alert('Done: ' + action);
    });
}

function deleteLastNMessages(n) {
  if (!currentRoom || !n) return;
  let path;
  if (currentRoom.type === 'room')
    path = 'chats/' + currentRoom.id;
  if (currentRoom.type === 'group')
    path = 'groups/' + currentRoom.id + '/messages';
  if (currentRoom.type === 'dm')
    path =
      'dms/' + currentUser.uid + '/' + currentRoom.otherUid;

  const ref = db.ref(path);
  ref
    .orderByChild('createdAt')
    .limitToLast(Number(n))
    .once('value')
    .then(snap => {
      const updates = {};
      snap.forEach(child => {
        updates[child.key + '/deleted'] = true;
        updates[child.key + '/deletedBy'] = 'admin';
      });
      ref.update(updates);
      logAdminAction('deleteLastN', '' + n);
    });
}

function deleteMessagesOverXWords(x) {
  if (!currentRoom || !x) return;
  let path;
  if (currentRoom.type === 'room')
    path = 'chats/' + currentRoom.id;
  if (currentRoom.type === 'group')
    path = 'groups/' + currentRoom.id + '/messages';
  if (currentRoom.type === 'dm')
    path =
      'dms/' + currentUser.uid + '/' + currentRoom.otherUid;

  const ref = db.ref(path);
  ref.once('value').then(snap => {
    const updates = {};
    snap.forEach(child => {
      const msg = child.val();
      if (!msg.text) return;
      const words = msg.text.split(/\s+/).length;
      if (words > x) {
        updates[child.key + '/deleted'] = true;
        updates[child.key + '/deletedBy'] = 'admin';
      }
    });
    ref.update(updates);
    logAdminAction('deleteOverX', '' + x);
  });
}

function deleteEntireRoom() {
  if (!currentRoom) return;
  if (!confirm('Delete ENTIRE room? This cannot be undone.')) return;
  let path;
  if (currentRoom.type === 'room')
    path = 'chats/' + currentRoom.id;
  if (currentRoom.type === 'group')
    path = 'groups/' + currentRoom.id + '/messages';
  if (currentRoom.type === 'dm')
    path =
      'dms/' + currentUser.uid + '/' + currentRoom.otherUid;

  db.ref(path).remove();
  logAdminAction('deleteRoom', '');
  chatAreaEl.innerHTML = '';
}

// -------------------------
// EVENTS
// -------------------------
document.addEventListener('DOMContentLoaded', () => {
  ensureAccount();
});

$('#openAccount').addEventListener('click', () => {
  if (!currentUser) return ensureAccount();
  showModal(accountModal);
});

$('#openAdmin').addEventListener('click', () => {
  showModal(adminModal);
});

$('#signupBtn').addEventListener('click', createAccount);
$('#logoutBtn').addEventListener('click', logout);

window.addEventListener('click', e => {
  if (e.target === accountModal) hideModal(accountModal);
  if (e.target === adminModal) hideModal(adminModal);
});

// admin
$('#adminLoginBtn').addEventListener('click', adminLogin);
adminPanelView.style.display = 'none';

document.querySelectorAll('.admin-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    const targetName = $('#targetUsername').value.trim();
    if (
      ['ban-5', 'ban-60', 'unban', 'timeout-5', 'timeout-60', 'verify'].includes(
        action
      )
    ) {
      if (!targetName) return alert('Enter target username first.');
      performUserAction(action, targetName);
    }
  });
});

$('#deleteLastBtn').addEventListener('click', () => {
  const n = Number($('#deleteCount').value);
  if (!n) return;
  deleteLastNMessages(n);
});

$('#deleteLongBtn').addEventListener('click', () => {
  const x = Number($('#deleteOverWords').value);
  if (!x) return;
  deleteMessagesOverXWords(x);
});

$('#deleteRoomBtn').addEventListener('click', deleteEntireRoom);

// sending + typing
sendBtnEl.addEventListener('click', sendMessage);
msgInputEl.addEventListener('keydown', e => {
  if (e.key === 'Enter') sendMessage();
  else handleTyping();
});
msgInputEl.addEventListener('input', handleTyping);
