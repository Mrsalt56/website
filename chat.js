/*  
============================================
=             SALTY CHAT SYSTEM            =
=                (chat.js)                 =
============================================
Dark UI +:
✔ Accounts
✔ Display name + PFP in settings
✔ Admin key in settings (KEY = 616756)
✔ Notifications
✔ Group invites + DM requests
✔ Image & video uploads (Firebase Storage)
✔ Rooms, Groups, DMs
✔ Presence & typing
✔ Moderation tools
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
const storage = firebase.storage();

/* -----------------------------------------
   DOM Helpers
----------------------------------------- */
const $ = (sel) => document.querySelector(sel);

const roomListEl = $("#roomList");
const dmListEl = $("#dmList");
const groupListEl = $("#groupList");
const onlineListEl = $("#onlineList");
const adminOnlineListEl = $("#adminOnlineList");

const displayNameEl = $("#displayName");
const pfpPreviewEl = $("#pfpPreview");
const chatAreaEl = $("#chatArea");
const roomNameEl = $("#roomName");
const roomSubtitleEl = $("#roomSubtitle");
const typingIndicatorEl = $("#typingIndicator");
const notifDot = $("#notifDot");
const notificationsListEl = $("#notificationsList");

const msgInput = $("#messageInput");
const sendBtn = $("#sendBtn");
const uploadBtn = $("#uploadBtn");
const fileInput = $("#fileInput");

/* Modals */
const accountModal = $("#accountModal");
const settingsModal = $("#settingsModal");
const notificationsModal = $("#notificationsModal");
const adminModal = $("#adminModal");
const signupView = $("#signupView");
const accountView = $("#accountView");

/* Settings inputs */
const settingsDisplayNameInput = $("#settingsDisplayName");
const settingsPfpFileInput = $("#settingsPfpFile");
const settingsSaveBtn = $("#settingsSaveBtn");
const settingsAdminKeyInput = $("#settingsAdminKey");
const settingsAdminBtn = $("#settingsAdminBtn");

/* -----------------------------------------
   STATE
----------------------------------------- */
let currentUser = null;       // { uid, username, password, createdAt, displayName?, pfpUrl? }
let isAdmin = false;
let currentRoom = null;       // { type: 'room'|'group'|'dm', id, label, otherUid? }
let currentMessagesRef = null;
let currentTypingRef = null;

let lastMsgTime = 0;
let msgCount = 0;
let typingTimeout = null;

/* New admin key */
const ADMIN_KEY = "616756";

/* Profanity list */
const PROFANITY = ["fuck","shit","bitch","whore","nigger","fag","cunt","slut"];

/* Subject Rooms (fixed IDs) */
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
    const r = new RegExp(p, "ig");
    t = t.replace(r, "***");
  });
  return t;
}

function showModal(modal) { modal.style.display = "flex"; }
function hideModal(modal) { modal.style.display = "none"; }

function scrollBottom() {
  chatAreaEl.scrollTop = chatAreaEl.scrollHeight;
}

/* -----------------------------------------
   Account Storage
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

/* Ensure logged in or ask to create */
function ensureAccount() {
  const stored = loadUser();
  if (!stored) {
    signupView.style.display = "block";
    accountView.style.display = "none";
    showModal(accountModal);
    return;
  }
  currentUser = stored;
  afterLogin();
}

/* Sign up */
$("#signupBtn").addEventListener("click", () => {
  const username = $("#signupUsername").value.trim();
  const password = $("#signupPassword").value.trim();

  if (!username || !password) return alert("Enter username & password.");

  if (PROFANITY.some(p => username.toLowerCase().includes(p))) {
    return alert("No profanity in usernames.");
  }

  const user = {
    uid: uid(),
    username,
    password,
    createdAt: now(),
    displayName: username,
    pfpUrl: ""
  };

  currentUser = user;
  saveUser(user);

  db.ref("users/" + user.uid).set({
    username,
    displayName: user.displayName,
    createdAt: user.createdAt,
    verified: false,
    bannedUntil: 0,
    timeoutUntil: 0,
    role: "user",
    pfpUrl: ""
  });

  hideModal(accountModal);
  afterLogin();
});

/* After login: fetch profile and start everything */
function afterLogin() {
  // Sync with DB in case profile updated
  db.ref("users/" + currentUser.uid).once("value").then(snap => {
    const data = snap.val() || {};
    currentUser.displayName = data.displayName || currentUser.username;
    currentUser.pfpUrl = data.pfpUrl || "";

    saveUser(currentUser);

    displayNameEl.textContent = currentUser.displayName;
    if (currentUser.pfpUrl) {
      pfpPreviewEl.src = currentUser.pfpUrl;
    } else {
      pfpPreviewEl.src =
        "https://ui-avatars.com/api/?background=1f2937&color=fff&name=" +
        encodeURIComponent(currentUser.displayName || currentUser.username);
    }

    setupPresence();
    loadRooms();
    listenForNotifications();
  });
}

/* -----------------------------------------
   Presence
----------------------------------------- */
function setupPresence() {
  const presRef = db.ref("presence/" + currentUser.uid);

  presRef.set({
    username: currentUser.displayName || currentUser.username,
    online: true,
    lastSeen: now()
  });

  presRef.onDisconnect().set({
    username: currentUser.displayName || currentUser.username,
    online: false,
    lastSeen: now()
  });

  db.ref("presence").on("value", snap => {
    onlineListEl.innerHTML = "";
    adminOnlineListEl.innerHTML = "";

    snap.forEach(child => {
      const val = child.val();
      const li = document.createElement("li");
      li.textContent = val.username + (val.online ? " ●" : " ○");
      onlineListEl.appendChild(li);

      const li2 = li.cloneNode(true);
      adminOnlineListEl.appendChild(li2);
    });
  });
}

/* -----------------------------------------
   Rooms / DMs / Groups
----------------------------------------- */
function loadRooms() {
  roomListEl.innerHTML = "";
  SUBJECT_ROOMS.forEach(r => {
    const li = document.createElement("li");
    li.textContent = r.name;
    li.dataset.id = r.id;
    li.addEventListener("click", () => {
      openRoom({ type: "room", id: r.id, label: r.name });
    });
    roomListEl.appendChild(li);
  });

  loadDMs();
  loadGroups();
}

function loadDMs() {
  const ref = db.ref("dms/" + currentUser.uid);
  ref.on("value", snap => {
    dmListEl.innerHTML = "";
    snap.forEach(child => {
      const otherUid = child.key;
      db.ref("users/" + otherUid + "/displayName").once("value").then(ns => {
        const name = ns.val() || otherUid;
        const li = document.createElement("li");
        li.textContent = name;
        li.addEventListener("click", () => {
          openRoom({
            type: "dm",
            id: otherUid,
            otherUid,
            label: "DM: " + name
          });
        });
        dmListEl.appendChild(li);
      });
    });
  });
}

function loadGroups() {
  db.ref("groups").on("value", snap => {
    groupListEl.innerHTML = "";
    snap.forEach(child => {
      const group = child.val();
      if (!group.members || !group.members[currentUser.uid]) return;

      const li = document.createElement("li");
      li.textContent = group.meta.name || "Group";
      li.addEventListener("click", () => {
        openRoom({
          type: "group",
          id: child.key,
          label: group.meta.name || "Group"
        });
      });
      groupListEl.appendChild(li);
    });
  });
}

$("#createGroupBtn").addEventListener("click", () => {
  const name = prompt("Group name?");
  if (!name) return;

  const ref = db.ref("groups").push();
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
});

/* -----------------------------------------
   Notifications
----------------------------------------- */
function listenForNotifications() {
  const ref = db.ref("notifications/" + currentUser.uid);
  ref.on("value", snap => {
    notificationsListEl.innerHTML = "";
    let has = false;

    snap.forEach(child => {
      has = true;
      const data = child.val();
      const li = document.createElement("li");

      if (data.type === "group_invite") {
        li.innerHTML = `
          <span><strong>${data.from}</strong> invited you to <b>${data.groupName}</b></span>
          <button class="accept" data-id="${child.key}" data-type="group_invite">Accept</button>
        `;
      }

      if (data.type === "dm_request") {
        li.innerHTML = `
          <span><strong>${data.from}</strong> wants to DM you</span>
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
  ref.once("value").then(snap => {
    const data = snap.val();
    if (!data) return;

    if (type === "group_invite") {
      db.ref("groups/" + data.groupId + "/members/" + currentUser.uid).set(true);
    }

    if (type === "dm_request") {
      const me = currentUser.uid;
      const other = data.dmUid;
      db.ref("dms/" + me + "/" + other).set({ placeholder: true });
      db.ref("dms/" + other + "/" + me).set({ placeholder: true });
    }

    ref.remove();
  });
}

/* Example functions you could call when inviting:
function sendGroupInvite(targetUid, groupId, groupName) {
  db.ref("notifications/" + targetUid).push({
    type: "group_invite",
    from: currentUser.displayName || currentUser.username,
    groupId,
    groupName,
    createdAt: now()
  });
}

function sendDMRequest(targetUid) {
  db.ref("notifications/" + targetUid).push({
    type: "dm_request",
    from: currentUser.displayName || currentUser.username,
    dmUid: currentUser.uid,
    createdAt: now()
  });
}
*/

/* -----------------------------------------
   Open Room + Typing
----------------------------------------- */
function roomKey(room) {
  if (room.type === "room") return "room_" + room.id;
  if (room.type === "group") return "group_" + room.id;
  if (room.type === "dm") {
    const ids = [currentUser.uid, room.otherUid].sort().join("_");
    return "dm_" + ids;
  }
  return "";
}

function openRoom(room) {
  if (currentMessagesRef) currentMessagesRef.off();
  if (currentTypingRef) currentTypingRef.off();

  currentRoom = room;
  roomNameEl.textContent = room.label;
  roomSubtitleEl.textContent =
    room.type === "room"
      ? "Classroom chat"
      : room.type === "group"
      ? "Group chat"
      : "Private DM";

  chatAreaEl.innerHTML = "";

  let path;
  if (room.type === "room") path = "chats/" + room.id;
  if (room.type === "group") path = "groups/" + room.id + "/messages";
  if (room.type === "dm") path = "dms/" + currentUser.uid + "/" + room.otherUid;

  currentMessagesRef = db.ref(path);
  currentMessagesRef.orderByChild("createdAt").on("child_added", snap => {
    addMessage(snap.key, snap.val());
  });

  const tKey = roomKey(room);
  currentTypingRef = db.ref("typing/" + tKey);
  currentTypingRef.on("value", snap => {
    const typers = [];
    snap.forEach(c => {
      if (c.key !== currentUser.uid && c.val()) typers.push(c.key);
    });

    if (typers.length === 0) typingIndicatorEl.textContent = "";
    else if (typers.length === 1) typingIndicatorEl.textContent = "Someone is typing...";
    else typingIndicatorEl.textContent = "Multiple people are typing...";
  });

  // Highlight active
  document.querySelectorAll(".list li").forEach(li => li.classList.remove("active"));
}

/* Typing */

function handleTyping() {
  if (!currentRoom) return;
  const tKey = roomKey(currentRoom);
  const ref = db.ref("typing/" + tKey + "/" + currentUser.uid);
  ref.set(true);
  if (typingTimeout) clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => ref.set(false), 3000);
}

/* -----------------------------------------
   Render Messages (text + images + videos)
----------------------------------------- */
function addMessage(key, msg) {
  const div = document.createElement("div");
  const me = msg.uid === currentUser.uid;
  div.className = "msg " + (me ? "me" : "them");

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  // Attachments first
  if (msg.fileUrl) {
    if (msg.fileType === "image") {
      const img = document.createElement("img");
      img.src = msg.fileUrl;
      img.alt = msg.originalName || "image";
      bubble.appendChild(img);
    } else if (msg.fileType === "video") {
      const vid = document.createElement("video");
      vid.src = msg.fileUrl;
      vid.controls = true;
      bubble.appendChild(vid);
    }
  }

  // Text
  if (msg.text && msg.text.trim() !== "") {
    const textNode = document.createElement("div");
    textNode.textContent = msg.deleted ? "Message removed" : msg.text;
    if (msg.deleted) {
      textNode.style.opacity = "0.6";
      textNode.style.fontStyle = "italic";
    }
    bubble.appendChild(textNode);
  } else if (msg.deleted) {
    bubble.textContent = "Message removed";
  }

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = new Date(msg.createdAt).toLocaleTimeString();

  div.appendChild(bubble);
  div.appendChild(meta);
  chatAreaEl.appendChild(div);
  scrollBottom();
}

/* -----------------------------------------
   Sending: text & uploading files
----------------------------------------- */
sendBtn.addEventListener("click", sendMessage);
msgInput.addEventListener("keydown", e => {
  if (e.key === "Enter") sendMessage();
  else handleTyping();
});

uploadBtn.addEventListener("click", () => {
  if (!currentRoom) return alert("Select a room first.");
  fileInput.click();
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;
  uploadFileAndSend(file);
  fileInput.value = "";
});

function sendMessage() {
  if (!currentRoom) return;
  let text = msgInput.value.trim();
  if (!text) return;

  // Rate limit
  const nowTime = now();
  if (nowTime - lastMsgTime > 5000) {
    msgCount = 0;
    lastMsgTime = nowTime;
  }
  msgCount++;
  if (msgCount > 5) {
    alert("Slow down a bit.");
    return;
  }

  text = sanitize(text);

  db.ref("users/" + currentUser.uid).once("value").then(snap => {
    const u = snap.val() || {};
    if (u.bannedUntil && u.bannedUntil > now()) {
      return alert("You are banned right now.");
    }
    if (u.timeoutUntil && u.timeoutUntil > now()) {
      return alert("You are timed out.");
    }

    const baseMsg = {
      uid: currentUser.uid,
      username: currentUser.username,
      displayName: currentUser.displayName || currentUser.username,
      text,
      createdAt: now()
    };

    if (currentRoom.type === "dm") {
      const me = currentUser.uid;
      const other = currentRoom.otherUid;
      const key = db.ref().push().key;

      db.ref("dms/" + me + "/" + other + "/" + key).set(baseMsg);
      db.ref("dms/" + other + "/" + me + "/" + key).set(baseMsg);
    } else if (currentRoom.type === "room") {
      db.ref("chats/" + currentRoom.id).push(baseMsg);
    } else if (currentRoom.type === "group") {
      db.ref("groups/" + currentRoom.id + "/messages").push(baseMsg);
    }

    msgInput.value = "";
  });
}

/* Upload file => Storage => send msg with fileUrl */
function uploadFileAndSend(file) {
  db.ref("users/" + currentUser.uid).once("value").then(snap => {
    const u = snap.val() || {};
    if (u.bannedUntil && u.bannedUntil > now()) {
      return alert("You are banned right now.");
    }
    if (u.timeoutUntil && u.timeoutUntil > now()) {
      return alert("You are timed out.");
    }

    const path = `uploads/${currentUser.uid}/${Date.now()}_${file.name}`;
    const fileRef = storage.ref().child(path);

    fileRef.put(file).then(snap => snap.ref.getDownloadURL()).then(url => {
      const fileType = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
        ? "video"
        : "file";

      const baseMsg = {
        uid: currentUser.uid,
        username: currentUser.username,
        displayName: currentUser.displayName || currentUser.username,
        text: msgInput.value.trim() ? sanitize(msgInput.value.trim()) : "",
        createdAt: now(),
        fileUrl: url,
        fileType,
        originalName: file.name
      };

      msgInput.value = "";

      if (currentRoom.type === "dm") {
        const me = currentUser.uid;
        const other = currentRoom.otherUid;
        const key = db.ref().push().key;
        db.ref("dms/" + me + "/" + other + "/" + key).set(baseMsg);
        db.ref("dms/" + other + "/" + me + "/" + key).set(baseMsg);
      } else if (currentRoom.type === "room") {
        db.ref("chats/" + currentRoom.id).push(baseMsg);
      } else if (currentRoom.type === "group") {
        db.ref("groups/" + currentRoom.id + "/messages").push(baseMsg);
      }
    });
  });
}

/* -----------------------------------------
   Settings (PFP + display name + admin key)
----------------------------------------- */
$("#openSettings").addEventListener("click", () => {
  settingsDisplayNameInput.value =
    currentUser.displayName || currentUser.username;

  showModal(settingsModal);
});

settingsSaveBtn.addEventListener("click", () => {
  const newName = settingsDisplayNameInput.value.trim() || currentUser.username;
  currentUser.displayName = newName;

  const file = settingsPfpFileInput.files[0];

  function finishUpdate(pfpUrl) {
    if (pfpUrl) {
      currentUser.pfpUrl = pfpUrl;
      pfpPreviewEl.src = pfpUrl;
    } else if (!currentUser.pfpUrl) {
      pfpPreviewEl.src =
        "https://ui-avatars.com/api/?background=1f2937&color=fff&name=" +
        encodeURIComponent(newName);
    }

    displayNameEl.textContent = newName;
    saveUser(currentUser);

    db.ref("users/" + currentUser.uid).update({
      displayName: newName,
      pfpUrl: currentUser.pfpUrl || ""
    });

    hideModal(settingsModal);
  }

  if (file) {
    const path = `pfp/${currentUser.uid}/${Date.now()}_${file.name}`;
    const pfpRef = storage.ref().child(path);
    pfpRef.put(file).then(snap => snap.ref.getDownloadURL()).then(url => {
      finishUpdate(url);
    });
  } else {
    finishUpdate(null);
  }
});

/* Admin unlock from settings */
settingsAdminBtn.addEventListener("click", () => {
  const key = settingsAdminKeyInput.value.trim();
  if (key !== ADMIN_KEY) {
    alert("Wrong admin key.");
    return;
  }
  enableAdmin();
});

function enableAdmin() {
  if (isAdmin) {
    showModal(adminModal);
    return;
  }
  isAdmin = true;
  db.ref("admins/" + currentUser.uid).set(true);
  db.ref("users/" + currentUser.uid + "/role").set("admin");
  $("#adminLoginView").style.display = "none";
  $("#adminPanelView").style.display = "block";
  showModal(adminModal);
}

/* We still keep old login button as backup */
$("#adminLoginBtn").addEventListener("click", () => {
  const key = $("#adminKeyInput").value.trim();
  if (key !== ADMIN_KEY) return alert("Wrong admin key.");
  enableAdmin();
});

/* -----------------------------------------
   Admin actions
----------------------------------------- */
document.querySelectorAll(".admin-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const action = btn.dataset.action;
    if (!action) return;
    const target = $("#targetUsername").value.trim();
    if (!target) return alert("Enter username");
    performAdminAction(action, target);
  });
});

function performAdminAction(action, username) {
  db.ref("users")
    .orderByChild("username")
    .equalTo(username)
    .once("value")
    .then(snap => {
      if (!snap.exists()) return alert("User not found");
      const uid = Object.keys(snap.val())[0];
      const ref = db.ref("users/" + uid);

      const FIVE = 5 * 60 * 1000;
      const HOUR = 60 * 60 * 1000;
      const updates = {};

      if (action === "ban-5") updates.bannedUntil = now() + FIVE;
      if (action === "ban-60") updates.bannedUntil = now() + HOUR;
      if (action === "unban") updates.bannedUntil = 0;
      if (action === "timeout-5") updates.timeoutUntil = now() + FIVE;
      if (action === "timeout-60") updates.timeoutUntil = now() + HOUR;
      if (action === "verify") updates.verified = true;

      ref.update(updates);
      alert("Action applied.");
    });
}

/* Delete last N messages */
$("#deleteLastBtn").addEventListener("click", () => {
  if (!currentRoom) return;
  const n = Number($("#deleteCount").value);
  if (!n) return;

  let path;
  if (currentRoom.type === "room") path = "chats/" + currentRoom.id;
  if (currentRoom.type === "group") path = "groups/" + currentRoom.id + "/messages";
  if (currentRoom.type === "dm") path = "dms/" + currentUser.uid + "/" + currentRoom.otherUid;

  const ref = db.ref(path);
  ref.orderByChild("createdAt").limitToLast(n).once("value").then(snap => {
    snap.forEach(child => {
      ref.child(child.key).update({ deleted: true });
    });
  });
});

/* Delete messages over X words */
$("#deleteLongBtn").addEventListener("click", () => {
  if (!currentRoom) return;
  const x = Number($("#deleteOverWords").value);
  if (!x) return;

  let path;
  if (currentRoom.type === "room") path = "chats/" + currentRoom.id;
  if (currentRoom.type === "group") path = "groups/" + currentRoom.id + "/messages";
  if (currentRoom.type === "dm") path = "dms/" + currentUser.uid + "/" + currentRoom.otherUid;

  const ref = db.ref(path);
  ref.once("value").then(snap => {
    snap.forEach(child => {
      const msg = child.val();
      if (!msg.text) return;
      const count = msg.text.split(/\s+/).length;
      if (count > x) {
        ref.child(child.key).update({ deleted: true });
      }
    });
  });
});

/* Delete entire room */
$("#deleteRoomBtn").addEventListener("click", () => {
  if (!currentRoom) return;
  if (!confirm("Delete ENTIRE room? This cannot be undone.")) return;

  let path;
  if (currentRoom.type === "room") path = "chats/" + currentRoom.id;
  if (currentRoom.type === "group") path = "groups/" + currentRoom.id + "/messages";
  if (currentRoom.type === "dm") path = "dms/" + currentUser.uid + "/" + currentRoom.otherUid;

  db.ref(path).remove();
  chatAreaEl.innerHTML = "";
});

/* -----------------------------------------
   Misc UI events
----------------------------------------- */
$("#openNotifications").addEventListener("click", () => {
  notifDot.style.display = "none";
  showModal(notificationsModal);
});

$("#closeNotificationsBtn").addEventListener("click", () => {
  hideModal(notificationsModal);
});

$("#logoutBtn").addEventListener("click", logout);

window.addEventListener("click", e => {
  if (e.target === accountModal) hideModal(accountModal);
  if (e.target === settingsModal) hideModal(settingsModal);
  if (e.target === notificationsModal) hideModal(notificationsModal);
  if (e.target === adminModal) hideModal(adminModal);
});

/* -----------------------------------------
   Start
----------------------------------------- */
document.addEventListener("DOMContentLoaded", ensureAccount);
