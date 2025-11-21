/*  
============================================
=             SALTY CHAT SYSTEM            =
=                (chat.js)                 =
============================================
Everything here is self-contained:
✔ Accounts
✔ Rooms
✔ DMs
✔ Groups
✔ Notifications
✔ Admin tools
✔ Moderation
✔ Typing
✔ Presence
✔ Realtime chat
============================================
*/

/* -----------------------------------------
    Firebase Init
----------------------------------------- */
const firebaseConfig = {
  apiKey: "AIzaSyDyk5FAyCRyAn6ll5_nfSV5e16mvi1l-n4",
  authDomain: "mrsalt56-e6066.firebaseapp.com",
  databaseURL: "https://mrsalt56-e6066-default-rtdb.firebaseio.com",
  projectId: "mrsalt56-e6066",
  storageBucket: "mrsalt56-e6066.appspot.com",
  messagingSenderId: "716178119141",
  appId: "1:716178119141:web:2c39c7f79213699a38b70c"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/* -----------------------------------------
    DOM Helpers
----------------------------------------- */
const $ = (sel) => document.querySelector(sel);

/* Sidebar elements */
const roomListEl = $("#roomList");
const dmListEl = $("#dmList");
const groupListEl = $("#groupList");
const onlineListEl = $("#onlineList");

/* Modals & UI */
const displayNameEl = $("#displayName");
const chatAreaEl = $("#chatArea");
const roomNameEl = $("#roomName");
const roomSubtitleEl = $("#roomSubtitle");
const typingIndicatorEl = $("#typingIndicator");
const notifDot = $("#notifDot");
const notificationsListEl = $("#notificationsList");

const accountModal = $("#accountModal");
const notificationsModal = $("#notificationsModal");
const adminModal = $("#adminModal");
const signupView = $("#signupView");
const accountView = $("#accountView");

/* Inputs */
const msgInput = $("#messageInput");
const sendBtn = $("#sendBtn");

/* -----------------------------------------
    APP STATE
----------------------------------------- */
let currentUser = null;
let isAdmin = false;
let currentRoom = null;     // {type: room/group/dm, id, label, otherUid?}
let currentMessagesRef = null;
let currentTypingRef = null;

/* Spam limiter */
let lastMsgTime = 0;
let msgCount = 0;

/* Typing */
let typingTimeout = null;

/* Admin */
const ADMIN_KEY = "67614156";

/* Username profanity block list */
const PROFANITY = ["fuck","shit","bitch","whore","nigger","fag","cunt","slut"];

/* -----------------------------------------
    Subject Rooms (FULL LIST YOU PROVIDED)
----------------------------------------- */
const SUBJECT_ROOMS = [
  {name:"Math 7", id:"math_7"},
  {name:"Math 8", id:"math_8"},
  {name:"ELA 7", id:"ela_7"},
  {name:"ELA 8", id:"ela_8"},
  {name:"AVID", id:"avid"},
  {name:"Science 7", id:"science_7"},
  {name:"Science 8", id:"science_8"},
  {name:"History 7", id:"history_7"},
  {name:"History 8", id:"history_8"},
  {name:"Coding", id:"coding"},
  {name:"Life Skills", id:"life_skills"},
  {name:"ASB", id:"asb"},
  {name:"Band", id:"band"}
];

/* -----------------------------------------
    Utility
----------------------------------------- */
const now = () => Date.now();

const uid = () => "u_" + Math.random().toString(36).slice(2) + Date.now();

function sanitize(text) {
  let t = text;
  PROFANITY.forEach(p => {
    const r = new RegExp(p,"ig");
    t = t.replace(r,"***");
  });
  return t;
}

function showModal(modal) { modal.style.display = "flex"; }
function hideModal(modal) { modal.style.display = "none"; }

function scrollBottom() {
  chatAreaEl.scrollTop = chatAreaEl.scrollHeight;
}

/* -----------------------------------------
    ACCOUNT SYSTEM
----------------------------------------- */

function loadUser() {
  try {
    return JSON.parse(localStorage.getItem("saltyUser"));
  } catch {
    return null;
  }
}

function saveUser(user) {
  localStorage.setItem("saltyUser", JSON.stringify(user));
}

function logout() {
  localStorage.removeItem("saltyUser");
  location.reload();
}

function ensureAccount() {
  const u = loadUser();
  if (!u) {
    signupView.style.display = "block";
    accountView.style.display = "none";
    showModal(accountModal);
    return;
  }
  currentUser = u;
  afterLogin();
}

/* Create new account */
$("#signupBtn").addEventListener("click", () => {
  const name = $("#signupUsername").value.trim();
  const pass = $("#signupPassword").value.trim();

  if (!name || !pass) return alert("Enter both fields.");

  if (PROFANITY.some(p => name.toLowerCase().includes(p)))
    return alert("Username contains profanity");

  const user = {
    uid: uid(),
    username: name,
    password: pass,
    createdAt: now()
  };

  currentUser = user;
  saveUser(user);

  db.ref("users/" + user.uid).set({
    username: user.username,
    createdAt: user.createdAt,
    verified: false,
    bannedUntil: 0,
    timeoutUntil: 0,
    role: "user"
  });

  hideModal(accountModal);
  afterLogin();
});

/* After Login Setup */
function afterLogin() {
  displayNameEl.textContent = currentUser.username;

  setupPresence();
  loadRooms();
  listenForNotifications();
}

/* -----------------------------------------
    PRESENCE SYSTEM
----------------------------------------- */

function setupPresence() {
  const ref = db.ref("presence/" + currentUser.uid);

  ref.set({
    username: currentUser.username,
    online: true,
    lastSeen: now()
  });

  ref.onDisconnect().set({
    username: currentUser.username,
    online: false,
    lastSeen: now()
  });

  db.ref("presence").on("value", s => {
    onlineListEl.innerHTML = "";
    s.forEach(c => {
      const u = c.val();
      const li = document.createElement("li");
      li.textContent = u.username + (u.online ? " ●" : " ○");
      onlineListEl.appendChild(li);
    });
  });
}

/* -----------------------------------------
    LOAD ROOMS, DMS, GROUPS
----------------------------------------- */

function loadRooms() {
  roomListEl.innerHTML = "";
  SUBJECT_ROOMS.forEach(r => {
    const li = document.createElement("li");
    li.textContent = r.name;
    li.dataset.id = r.id;

    li.addEventListener("click", () => {
      openRoom({type:"room",id:r.id,label:r.name});
    });

    roomListEl.appendChild(li);
  });

  loadDMs();
  loadGroups();
}

/* Load DMs */
function loadDMs() {
  const ref = db.ref("dms/" + currentUser.uid);
  ref.on("value", s => {
    dmListEl.innerHTML = "";
    s.forEach(child => {
      const otherUid = child.key;
      db.ref("users/" + otherUid + "/username").once("value").then(nameSnap => {
        const li = document.createElement("li");
        li.textContent = nameSnap.val() || "Unknown";
        li.addEventListener("click", () => {
          openRoom({
            type:"dm",
            id:otherUid,
            label:"DM: " + nameSnap.val(),
            otherUid
          });
        });
        dmListEl.appendChild(li);
      });
    });
  });
}

/* Load Groups */
function loadGroups() {
  db.ref("groups").on("value", s => {
    groupListEl.innerHTML = "";
    s.forEach(child => {
      const g = child.val();
      if (!g.members || !g.members[currentUser.uid]) return;

      const li = document.createElement("li");
      li.textContent = g.meta.name;
      li.addEventListener("click", () => {
        openRoom({type:"group",id:child.key,label:g.meta.name});
      });
      groupListEl.appendChild(li);
    });
  });
}

/* Create Group */
$("#createGroupBtn").addEventListener("click", () => {
  const name = prompt("Group name:");
  if (!name) return;

  const ref = db.ref("groups").push();
  ref.set({
    meta: {name, owner: currentUser.uid, createdAt: now()},
    members: {[currentUser.uid]: true}
  });
});

/* -----------------------------------------
    NOTIFICATIONS SYSTEM
----------------------------------------- */

function listenForNotifications() {
  const ref = db.ref("notifications/" + currentUser.uid);
  ref.on("value", s => {
    notificationsListEl.innerHTML = "";

    let has = false;

    s.forEach(child => {
      has = true;
      const data = child.val();

      const li = document.createElement("li");

      if (data.type === "group_invite") {
        li.innerHTML = `
          <strong>${data.from}</strong> invited you to group <b>${data.groupName}</b>
          <button class="accept" data-id="${child.key}" data-type="group_invite">Accept</button>
        `;
      }

      if (data.type === "dm_request") {
        li.innerHTML = `
          <strong>${data.from}</strong> wants to DM you
          <button class="accept" data-id="${child.key}" data-type="dm_request">Accept</button>
        `;
      }

      notificationsListEl.appendChild(li);
    });

    notifDot.style.display = has ? "block" : "none";

    document.querySelectorAll(".accept").forEach(btn => {
      btn.addEventListener("click", () => {
        acceptNotification(btn.dataset.id, btn.dataset.type);
      });
    });
  });
}

function acceptNotification(id, type) {
  const ref = db.ref("notifications/" + currentUser.uid + "/" + id);

  ref.once("value").then(s => {
    const data = s.val();
    if (!data) return;

    if (type === "group_invite") {
      db.ref("groups/" + data.groupId + "/members/" + currentUser.uid).set(true);
    }

    if (type === "dm_request") {
      const me = currentUser.uid;
      const other = data.dmUid;

      db.ref("dms/" + me + "/" + other).set({placeholder:true});
      db.ref("dms/" + other + "/" + me).set({placeholder:true});
    }

    ref.remove();
  });
}

/* -----------------------------------------
    OPEN ROOM
----------------------------------------- */

function openRoom(room) {
  if (currentMessagesRef) currentMessagesRef.off();
  if (currentTypingRef) currentTypingRef.off();

  currentRoom = room;
  roomNameEl.textContent = room.label;
  roomSubtitleEl.textContent =
    room.type === "room" ? "Classroom chat" :
    room.type === "group" ? "Group chat" :
    "Private DM";

  chatAreaEl.innerHTML = "";

  let path = "";

  if (room.type === "room") path = "chats/" + room.id;
  if (room.type === "group") path = "groups/" + room.id + "/messages";
  if (room.type === "dm")   path = "dms/" + currentUser.uid + "/" + room.otherUid;

  currentMessagesRef = db.ref(path);
  currentMessagesRef.orderByChild("createdAt").on("child_added", snap => {
    addMessage(snap.key, snap.val());
  });

  /* Typing indicator */
  const tKey = roomKey(room);
  currentTypingRef = db.ref("typing/" + tKey);
  currentTypingRef.on("value", snap => {
    const typers = [];
    snap.forEach(c => {
      if (c.key !== currentUser.uid && c.val()) typers.push(c.key);
    });

    typingIndicatorEl.textContent =
      typers.length === 0 ? "" :
      typers.length === 1 ? "Someone is typing..." :
      "Several people are typing...";
  });
}

function roomKey(room) {
  if (room.type === "room") return "room_" + room.id;
  if (room.type === "group") return "group_" + room.id;
  if (room.type === "dm") {
    const a = [currentUser.uid, room.otherUid].sort().join("_");
    return "dm_" + a;
  }
}

/* -----------------------------------------
    RENDER MESSAGE
----------------------------------------- */
function addMessage(key, msg) {
  const div = document.createElement("div");
  div.className = "msg " + (msg.uid === currentUser.uid ? "me" : "them");

  const b = document.createElement("div");
  b.className = "bubble";
  b.textContent = msg.deleted ? "Message removed" : msg.text;

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = new Date(msg.createdAt).toLocaleTimeString();

  div.appendChild(b);
  div.appendChild(meta);
  chatAreaEl.appendChild(div);
  scrollBottom();
}

/* -----------------------------------------
    SEND MESSAGE
----------------------------------------- */
sendBtn.addEventListener("click", sendMessage);
msgInput.addEventListener("keydown", e => {
  if (e.key === "Enter") sendMessage();
  else typing();
});

function sendMessage() {
  if (!currentRoom) return;

  let text = msgInput.value.trim();
  if (!text) return;

  /* Spam limiter */
  if (now() - lastMsgTime > 5000) {
    msgCount = 0;
    lastMsgTime = now();
  }
  msgCount++;
  if (msgCount > 5) return alert("Slow down!");

  text = sanitize(text);

  db.ref("users/" + currentUser.uid).once("value").then(s => {
    const u = s.val();
    if (!u) return;

    if (u.bannedUntil > now()) return alert("You are banned.");
    if (u.timeoutUntil > now()) return alert("You are timed out.");

    let path = "";
    if (currentRoom.type === "room") path = "chats/" + currentRoom.id;
    if (currentRoom.type === "group") path = "groups/" + currentRoom.id + "/messages";

    if (currentRoom.type === "dm") {
      const me = currentUser.uid;
      const other = currentRoom.otherUid;

      const msgObj = {
        uid: me,
        username: currentUser.username,
        text,
        createdAt: now()
      };

      const k = db.ref().push().key;

      db.ref("dms/" + me + "/" + other + "/" + k).set(msgObj);
      db.ref("dms/" + other + "/" + me + "/" + k).set(msgObj);

      msgInput.value = "";
      return;
    }

    db.ref(path).push({
      uid: currentUser.uid,
      username: currentUser.username,
      text,
      createdAt: now()
    });

    msgInput.value = "";
  });
}

/* Typing */
function typing() {
  if (!currentRoom) return;
  const key = roomKey(currentRoom);
  const ref = db.ref("typing/" + key + "/" + currentUser.uid);
  ref.set(true);

  if (typingTimeout) clearTimeout(typingTimeout);

  typingTimeout = setTimeout(() => {
    ref.set(false);
  }, 3000);
}

/* -----------------------------------------
    ADMIN SYSTEM
----------------------------------------- */

$("#openNotifications").addEventListener("click", () => {
  notifDot.style.display = "none";
  showModal(notificationsModal);
});

$("#openSettings").addEventListener("click", () => {
  alert("Settings coming soon!");
});

$("#logoutBtn").addEventListener("click", logout);

$("#adminLoginBtn").addEventListener("click", () => {
  const k = $("#adminKeyInput").value.trim();
  if (k !== ADMIN_KEY) return alert("Wrong key");

  isAdmin = true;
  db.ref("admins/" + currentUser.uid).set(true);
  db.ref("users/" + currentUser.uid + "/role").set("admin");

  $("#adminLoginView").style.display = "none";
  $("#adminPanelView").style.display = "block";
});

document.querySelectorAll(".admin-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const action = btn.dataset.action;
    const target = $("#targetUsername").value.trim();
    if (!target) return alert("Enter username");

    performAdminAction(action, target);
  });
});

function performAdminAction(action, username) {
  db.ref("users").orderByChild("username").equalTo(username)
    .once("value").then(s => {
      if (!s.exists()) return alert("User not found");

      const uid = Object.keys(s.val())[0];
      const ref = db.ref("users/" + uid);

      const FIVE = 5 * 60000;
      const HOUR = 60 * 60000;
      const updates = {};

      if (action === "ban-5") updates.bannedUntil = now() + FIVE;
      if (action === "ban-60") updates.bannedUntil = now() + HOUR;
      if (action === "unban") updates.bannedUntil = 0;
      if (action === "timeout-5") updates.timeoutUntil = now() + FIVE;
      if (action === "timeout-60") updates.timeoutUntil = now() + HOUR;
      if (action === "verify") updates.verified = true;

      ref.update(updates);
      alert("Done!");
    });
}

/* Delete last N messages */
$("#deleteLastBtn").addEventListener("click", () => {
  if (!currentRoom) return;
  const num = Number($("#deleteCount").value);
  if (!num) return;

  let path = "";
  if (currentRoom.type === "room") path = "chats/" + currentRoom.id;
  if (currentRoom.type === "group") path = "groups/" + currentRoom.id + "/messages";
  if (currentRoom.type === "dm") path = "dms/" + currentUser.uid + "/" + currentRoom.otherUid;

  db.ref(path).orderByChild("createdAt").limitToLast(num)
    .once("value").then(s => {
      s.forEach(c => {
        db.ref(path + "/" + c.key).update({deleted:true});
      });
    });
});

/* Delete messages over X words */
$("#deleteLongBtn").addEventListener("click", () => {
  if (!currentRoom) return;
  const x = Number($("#deleteOverWords").value);
  if (!x) return;

  let path = "";
  if (currentRoom.type === "room") path = "chats/" + currentRoom.id;
  if (currentRoom.type === "group") path = "groups/" + currentRoom.id + "/messages";
  if (currentRoom.type === "dm") path = "dms/" + currentUser.uid + "/" + currentRoom.otherUid;

  db.ref(path).once("value").then(s => {
    s.forEach(c => {
      const msg = c.val();
      if (!msg.text) return;
      const wc = msg.text.split(/\s+/).length;
      if (wc > x) db.ref(path + "/" + c.key).update({deleted:true});
    });
  });
});

/* Delete entire room */
$("#deleteRoomBtn").addEventListener("click", () => {
  if (!currentRoom) return;
  if (!confirm("Delete ENTIRE room?")) return;

  let path="";
  if (currentRoom.type==="room") path="chats/"+currentRoom.id;
  if (currentRoom.type==="group") path="groups/"+currentRoom.id+"/messages";
  if (currentRoom.type==="dm") path="dms/"+currentUser.uid+"/"+currentRoom.otherUid;

  db.ref(path).remove();
  chatAreaEl.innerHTML = "";
});

/* -----------------------------------------
    App Start
----------------------------------------- */
document.addEventListener("DOMContentLoaded", ensureAccount);
window.addEventListener("click", e => {
  if (e.target === accountModal) hideModal(accountModal);
  if (e.target === notificationsModal) hideModal(notificationsModal);
  if (e.target === adminModal) hideModal(adminModal);
});
