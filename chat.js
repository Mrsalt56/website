/*  
============================================
=             SALTY CHAT SYSTEM            =
=                (chat.js)                 =
============================================
Dark UI +:
✔ Accounts (localStorage)
✔ Display name + PFP in settings
✔ Admin key (KEY = 616756)
✔ Notifications (DM requests + group invites)
✔ Image & video uploads (Firebase Storage)
✔ Rooms, Groups, DMs
✔ Presence & typing
✔ Moderation tools
✔ User popup (PFP click → profile)
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
  storageBucket: "mrsalt56-e6066.firebasestorage.app",
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

/* Sidebar / lists */
const roomListEl = $("#roomList");
const dmListEl = $("#dmList");
const groupListEl = $("#groupList");
const onlineListEl = $("#onlineList");
const adminOnlineListEl = $("#adminOnlineList");

/* Main UI */
const displayNameEl = $("#displayName");
const pfpPreviewEl = $("#pfpPreview");
const chatAreaEl = $("#chatArea");
const roomNameEl = $("#roomName");
const roomSubtitleEl = $("#roomSubtitle");
const typingIndicatorEl = $("#typingIndicator");
const notifDot = $("#notifDot");
const notificationsListEl = $("#notificationsList");

/* Inputs */
const msgInput = $("#messageInput");
const sendBtn = $("#sendBtn");
const uploadBtn = $("#uploadBtn");
const fileInput = $("#fileInput");

/* Modals */
const accountModal = $("#accountModal");
const settingsModal = $("#settingsModal");
const notificationsModal = $("#notificationsModal");
const adminModal = $("#adminModal");
const userPopup = $("#userPopup");
const signupView = $("#signupView");
const accountView = $("#accountView");

/* Account info */
const accUsernameEl = $("#accUsername");
const accUidEl = $("#accUid");
const accStatusEl = $("#accStatus");

/* Settings inputs */
const settingsDisplayNameInput = $("#settingsDisplayName");
const settingsPfpFileInput = $("#settingsPfpFile");
const settingsAdminKeyInput = $("#settingsAdminKey");
const settingsAdminBtn = $("#settingsAdminBtn");
const settingsSaveBtn = $("#settingsSaveBtn");

/* User popup */
const popupPfp = $("#popupPfp");
const popupDisplayName = $("#popupDisplayName");
const popupRealName = $("#popupRealName");
const popupDmBtn = $("#popupDmBtn");
const popupInviteBtn = $("#popupInviteBtn");
const popupCloseBtn = $("#popupCloseBtn");

/* Admin views */
const adminLoginView = $("#adminLoginView");
const adminPanelView = $("#adminPanelView");

/* -----------------------------------------
   STATE
----------------------------------------- */
let currentUser = null;   // { uid, username, password, displayName, pfpUrl, createdAt }
let isAdmin = false;
let currentRoom = null;   // { type: 'room'|'group'|'dm', id, label, otherUid? }
let currentMessagesRef = null;
let currentTypingRef = null;

let lastMsgTime = 0;
let msgCount = 0;
let typingTimeout = null;

/* Admin key */
const ADMIN_KEY = "616756";

/* Profanity list (you can add more) */
const PROFANITY = [
"fuck","fuk","f*ck","f**k","fuxk","fusk","fock","phuck","phuk",
"f#ck","f@ck","f£ck","fück","fucc","fukk","fukc","f u c k",
"f-u-c-k","f.u.c.k","f—ck","f🖕ck","fʊck","fck","fk","fquk",

"shit","sh1t","sh!t","sh¡t","shiit","shyt","shyte","s#it","s@it",
"shlt","sh*t","sh**","sh.it","s h i t","sнit","§hit",
"sh1†","sh!+","shït","shlt","sh!t.","s#1t",

"bitch","b1tch","b!tch","b*tch","b!+ch","btch","bich",
"b!ch","b¡tch","b*t¢h","b1+ch","b1t¢h","b i t c h",
"bïtch","b1tc#","bxtch","b17ch","b!7ch","b|tch",

"hoe","h0e","h03","h0ee","h0r","h0re","ho3",
"whore","wh0re","wh0r3","w h o r e","whørë",
"whor3","w#ore","w@ore","whoar","wh0ar","wh0rr","h0ar","h/oe","høe",

"slut","slutt","sluut","slvt","sl*t","sl@t","slvtt","s/ut",
"5lut","§lut","slüt","slut.","s l u t","sl+","s!ut",
"slvt","slvt.","slv+","sl℮t","sIut",

"cunt","c*nt","c@nt","kunt","k@nt","cu nt","cuntt",
"cün†","c#nt","c/nt","c u n t","¢unt","cun+",
"kun7","kʊnt","cunt.","c*nt.","c nt","c🅤nt",

"ass","a$$","@ss","azz","4ss","a55","a.ss","a s s",
"assh0le","asshole","a$$hole","@sshole","azzhole",
"ashole","assh0l3","4sshole","a$s","ass·","a55hole",

"dick","dik","d1ck","d!ck","d!k","d1k","d¡ck","dïck",
"d¡k","dix","dxck","d!ck.","d|ck","d1¢k","d1©k",
"d!©k","d1ck.","d1ckk","d1c|<",

"pussy","pussi","pusy","p*ssy","p@ssy","p0ssy","pussy.",
"pus5y","pu55y","p u s s y","püssy","pússy","p$ssy",
"pssy","p_ssy","puśsy","puss¥","pʊssy","púss¥","pøssy",

"fag","f@g","f4g","fa6","f4gg","fag.","f@g.","fa9",
"f@ggot","faggot","f*ggot","fa99ot","f4gg0t","fΛggot",
"fΔggot","f4g9t","fag9t","f a g","f—g","f\\ag",

"nigger","n1gger","n¡gger","n!gger","nigg3r","ni99er",
"nlgg3r","n¡gg3r","n¡gger","n!gg3r","nlgger","nigga",
"n1gga","ni99a","n¡gga","n¡9ga","n1gg4","nlgg4",
"n1g9a","nigg@",

"retard","r3tard","ret@rd","r*tard","reetard","retarded",
"r3tarded","r3t@rd","r3t@rd3d","retard.","r€tard",
"retardd","retard3d","r e t a r d","ret@rded",
"ret@rddd","re+tard","re-tard","r-tard","rtard"
];

/* Subject rooms */
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
const myUid = () => currentUser?.uid || "";
const uuid = () => "u_" + Math.random().toString(36).slice(2) + Date.now();

/* Safe profanity filter – escapes regex chars so no crashes */
function sanitize(text) {
  let clean = text;

  PROFANITY.forEach(p => {
    const safe = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(safe, "gi");
    clean = clean.replace(regex, "***");
  });

  return clean;
}

function showModal(modal) {
  if (modal) modal.style.display = "flex";
}
function hideModal(modal) {
  if (modal) modal.style.display = "none";
}

function scrollBottom() {
  chatAreaEl.scrollTop = chatAreaEl.scrollHeight;
}

/* -----------------------------------------
   Account (localStorage)
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

/* Signup */
$("#signupBtn").addEventListener("click", () => {
  const username = $("#signupUsername").value.trim();
  const password = $("#signupPassword").value.trim();

  if (!username || !password) return alert("Enter username and password.");

  if (PROFANITY.some(p => username.toLowerCase().includes(p.replace(/\*/g, "")))) {
    return alert("Username has profanity.");
  }

  const uid = uuid();
  const user = {
    uid,
    username,
    password,
    displayName: username,
    pfpUrl: "",
    createdAt: now()
  };

  currentUser = user;
  saveUser(user);

  db.ref("users/" + uid).set({
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

/* After login: sync + init systems */
function afterLogin() {
  const uid = myUid();
  db.ref("users/" + uid).once("value").then(snap => {
    const data = snap.val() || {};
    currentUser.displayName = data.displayName || currentUser.username;
    currentUser.pfpUrl = data.pfpUrl || "";

    saveUser(currentUser);

    displayNameEl.textContent = currentUser.displayName;
    accUsernameEl.textContent = currentUser.username;
    accUidEl.textContent = currentUser.uid;
    accStatusEl.textContent = data.role === "admin" ? "Admin" : "User";

    if (currentUser.pfpUrl) {
      pfpPreviewEl.src = currentUser.pfpUrl;
    } else {
      pfpPreviewEl.src =
        "https://ui-avatars.com/api/?background=1f2937&color=fff&name=" +
        encodeURIComponent(currentUser.displayName);
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
  const uid = myUid();
  const presRef = db.ref("presence/" + uid);
  const quickUserSelect = $("#quickUserSelect");

  // Set current user presence
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

  // ONE unified presence listener
  db.ref("presence").on("value", snap => {
    onlineListEl.innerHTML = "";
    quickUserSelect.innerHTML = '<option value="">Select user…</option>';
    if (adminOnlineListEl) adminOnlineListEl.innerHTML = "";

    snap.forEach(child => {
      const val = child.val();
      const childUid = child.key;

      // Build name with verified badge
      db.ref("users/" + childUid + "/verified").once("value").then(vs => {
        let name = val.username;
        if (vs.val()) name += " ✔";
        const status = val.online ? " ●" : " ○";

        // --- Sidebar online list ---
        const li = document.createElement("li");
        li.textContent = name + " " + status;
        onlineListEl.appendChild(li);

        // --- Admin list ---
        if (adminOnlineListEl) {
          const li2 = li.cloneNode(true);
          adminOnlineListEl.appendChild(li2);
        }

        // --- Quick-Select Dropdown (skip yourself) ---
        if (childUid !== myUid()) {
          const op = document.createElement("option");
          op.value = childUid;
          op.textContent = name;
          quickUserSelect.appendChild(op);
        }
      });
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
/* -----------------------------------------
   Load & Render DMs (sorted + search + delete)
----------------------------------------- */
function loadDMs() {
  const searchInput = $("#dmSearch");

  db.ref("dms/" + myUid()).on("value", snap => {
    const dmItems = [];
    const tasks = [];

    snap.forEach(child => {
      const otherId = child.key; // this is the UID being stored in DMs for now

      // 1) Get last message time for sorting
      const lastMsgTask = db
        .ref("dms/" + myUid() + "/" + otherId)
        .orderByChild("createdAt")
        .limitToLast(1)
        .once("value")
        .then(lastSnap => {
          let lastTime = 0;
          lastSnap.forEach(m => {
            lastTime = m.val()?.createdAt || 0;
          });

          // 2) Try users/{otherId}
          return db.ref("users/" + otherId).once("value").then(uSnap => {
            if (uSnap.exists()) {
              const u = uSnap.val() || {};
              let name = u.displayName || u.username || otherId;
              if (u.verified) name += " ✔";

              dmItems.push({ id: otherId, name, lastTime });
              return;
            }

            // 3) Fallback to presence/{otherId}
            return db.ref("presence/" + otherId).once("value").then(pSnap => {
              const p = pSnap.val() || {};

              let foundName = p.username;
              if (!foundName) {
                // Make a readable temporary name
                foundName = "User_" + otherId.slice(-4);

                // Write it into presence for future lookups
                db.ref("presence/" + otherId).update({
                  username: foundName
                });
              }

              dmItems.push({
                id: otherId,
                name: foundName,
                lastTime
              });
            });
          });
        });

      tasks.push(lastMsgTask);
    });

    // After async tasks finish
    Promise.all(tasks).then(() => {
      // SORT: newest → oldest
      dmItems.sort((a, b) => b.lastTime - a.lastTime);

      const applyFilterAndRender = () => {
        const q = (searchInput?.value || "").toLowerCase();
        const filtered = q
          ? dmItems.filter(dm => dm.name.toLowerCase().includes(q))
          : dmItems;

        renderDMList(filtered);
      };

      applyFilterAndRender();

      // Bind search ONCE
      if (searchInput && !searchInput._wiredForDMSearch) {
        searchInput.addEventListener("input", applyFilterAndRender);
        searchInput._wiredForDMSearch = true;
      }
    });

    if (!snap.exists()) {
      dmListEl.innerHTML = "";
    }
  });
}
/*----------
DM FRFR RENDER 
-------*/
function renderDMList(list) {
  dmListEl.innerHTML = "";

  list.forEach(dm => {
    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.justifyContent = "space-between";
    li.style.alignItems = "center";

    // --- DM NAME TEXT ---
    const nameSpan = document.createElement("span");
    nameSpan.textContent = dm.name;
    nameSpan.style.cursor = "pointer";
//MESSAGE BUTTON
nameSpan.onclick = () => {
  const basePath = "dms/" + myUid() + "/" + dm.id;

  db.ref(basePath + "/otherUid")
    .once("value")
    .then(s => {
      const other = s.val() || dm.id; // fallback

      openRoom({
        type: "dm",
        id: dm.id,
        otherUid: other,
        label: "DM: " + dm.name
      });
    });
};

    // DELETE BUTTON
    const delBtn = document.createElement("button");
    delBtn.textContent = "✖";
    delBtn.style.background = "transparent";
    delBtn.style.border = "none";
    delBtn.style.color = "#f87171";
    delBtn.style.cursor = "pointer";
    delBtn.title = "Delete DM";

    delBtn.onclick = () => {
      if (!confirm("Delete this DM for YOU only?")) return;
      db.ref("dms/" + myUid() + "/" + dm.id).remove();

      const remaining = list.filter(x => x.id !== dm.id);
      renderDMList(remaining);
    };

    li.appendChild(nameSpan);
    li.appendChild(delBtn);
    dmListEl.appendChild(li);
  });
}

/* Groups */
const quickGroupSelect = $("#quickGroupSelect");

function loadGroups() {
  db.ref("groups").on("value", snap => {
    groupListEl.innerHTML = "";

    // Reset dropdown with default option
    quickGroupSelect.innerHTML = '<option value="">Select group…</option>';

    snap.forEach(child => {
      const group = child.val();
      const groupId = child.key;

      // Only groups the user is in
      if (!group.members || !group.members[myUid()]) return;

      const name = group.meta?.name || "Group";

      // ---- SIDEBAR GROUP LIST ----
      const li = document.createElement("li");
      li.textContent = name;
      li.addEventListener("click", () => {
        openRoom({
          type: "group",
          id: groupId,
          label: name
        });
      });
      groupListEl.appendChild(li);

      // ---- GROUP DROPDOWN FOR INVITES ----
      const op = document.createElement("option");
      op.value = groupId;     // 🔥 correct Firebase ID
      op.textContent = name;  // readable name
      quickGroupSelect.appendChild(op);
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
      owner: myUid(),
      createdAt: now()
    },
    members: {
      [myUid()]: true
    }
  });
});

/* -----------------------------------------
   Notifications
----------------------------------------- */
function listenForNotifications() {
  const ref = db.ref("notifications/" + myUid());
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
      } else if (data.type === "dm_request") {
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
  const ref = db.ref("notifications/" + myUid() + "/" + id);
  ref.once("value").then(snap => {
    const data = snap.val();
    if (!data) return;

    if (type === "group_invite") {
      db.ref("groups/" + data.groupId + "/members/" + myUid()).set(true);
    }

   if (type === "dm_request") {
  const me = myUid();
  const other = data.dmUid;

  // Create DM on both sides
const base = {
  establishedAt: now(),
  otherUid: other
};

const base2 = {
  establishedAt: now(),
  otherUid: me
};

   db.ref("dms/" + me + "/" + other).set(base);
   db.ref("dms/" + other + "/" + me).set(base2);


  // 🔥 AUTO-OPEN DM for the accepting user
  openRoom({
    type: "dm",
    id: other,
    otherUid: other,
    label: "DM: " + data.from
  });
}

/* Helpers for popup */
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
    dmUid: myUid(),
    createdAt: now()
  });
}
     
    ref.remove();
  });
}

/* Helpers for popup & quick actions */
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
    dmUid: myUid(),
    createdAt: now()
  });
}

/* -----------------------------------------
   Room / Typing
----------------------------------------- */
function roomKey(room) {
  if (!room) return "";
  if (room.type === "room") return "room_" + room.id;
  if (room.type === "group") return "group_" + room.id;
  if (room.type === "dm") {
    const ids = [myUid(), room.otherUid].sort().join("_");
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
  if (room.type === "dm") path = "dms/" + myUid() + "/" + room.otherUid;

  currentMessagesRef = db.ref(path);
  currentMessagesRef.orderByChild("createdAt").on("child_added", snap => {
    addMessage(snap.key, snap.val());
  });

  const tKey = roomKey(room);
  currentTypingRef = db.ref("typing/" + tKey);
  currentTypingRef.on("value", snap => {
    const typers = [];
    snap.forEach(c => {
      if (c.key !== myUid() && c.val()) typers.push(c.key);
    });
    if (typers.length === 0) typingIndicatorEl.textContent = "";
    else if (typers.length === 1) typingIndicatorEl.textContent = "Someone is typing...";
    else typingIndicatorEl.textContent = "Multiple people are typing...";
  });

  document.querySelectorAll(".list li").forEach(li => li.classList.remove("active"));
}

/* Typing */
function handleTyping() {
  if (!currentRoom) return;
  const tKey = roomKey(currentRoom);
  const ref = db.ref("typing/" + tKey + "/" + myUid());
  ref.set(true);
  if (typingTimeout) clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => ref.set(false), 3000);
}

/* -----------------------------------------
   Render Messages (Option A layout)
----------------------------------------- */
function addMessage(key, msg) {
  const isMe = msg.uid === myUid();

  // ROW
  const row = document.createElement("div");
  row.className = "msg-row";
  row.style.display = "flex";
  row.style.marginBottom = "14px";
  row.style.position = "relative";  // required for pfp overlap

  // --- CREATE PFP FIRST (important) ---
  const pfp = document.createElement("img");
  pfp.src =
    msg.pfpUrl ||
    "https://ui-avatars.com/api/?background=1f2937&color=fff&name=" +
      encodeURIComponent(msg.displayName || msg.username);

  pfp.style.width = "34px";
  pfp.style.height = "34px";
  pfp.style.borderRadius = "50%";
  pfp.style.position = "absolute";
  pfp.style.top = "50%";
  pfp.style.transform = "translateY(-50%)";
  pfp.style.zIndex = "1";
  pfp.onclick = () => openUserPopup(msg.uid);

  // --- MESSAGE WRAPPER ---
  const wrapper = document.createElement("div");
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.maxWidth = "70%";

  if (isMe) wrapper.style.marginLeft = "auto";

  // --- USERNAME ---
  const name = document.createElement("div");
  let dn = msg.displayName || msg.username;
  if (msg.verified) dn += " ✔";

  name.textContent = dn;
  name.style.fontSize = "0.78rem";
  name.style.fontWeight = "600";
  name.style.marginBottom = "4px";
  name.style.opacity = "0.85";
  name.style.textAlign = isMe ? "right" : "left";

  // --- BUBBLE ---
  const bubble = document.createElement("div");
  bubble.className = "bubble";

  if (isMe) {
    bubble.style.background = "linear-gradient(135deg, #2563eb, #4f46e5)";
    bubble.style.borderColor = "rgba(129,140,248,0.8)";
    bubble.style.alignSelf = "flex-end";
  }

  // IMAGE / VIDEO
  if (msg.fileUrl) {
    if (msg.fileType === "image") {
      const img = document.createElement("img");
      img.src = msg.fileUrl;
      img.style.maxWidth = "250px";
      img.style.borderRadius = "8px";
      bubble.appendChild(img);
    } else if (msg.fileType === "video") {
      const vid = document.createElement("video");
      vid.src = msg.fileUrl;
      vid.controls = true;
      vid.style.maxWidth = "250px";
      vid.style.borderRadius = "8px";
      bubble.appendChild(vid);
    }
  }

  // TEXT
  const text = document.createElement("div");
  if (msg.deleted) {
    text.textContent = "Message removed";
    text.style.opacity = "0.6";
    text.style.fontStyle = "italic";
  } else {
    text.textContent = msg.text || "";
  }
  bubble.appendChild(text);

  // TIME
  const meta = document.createElement("div");
  meta.textContent = new Date(msg.createdAt).toLocaleTimeString();
  meta.style.fontSize = "0.70rem";
  meta.style.marginTop = "3px";
  meta.style.opacity = "0.6";
  meta.style.textAlign = isMe ? "right" : "left";

  // --- ASSEMBLE ---
  wrapper.appendChild(name);
  wrapper.appendChild(bubble);
  wrapper.appendChild(meta);
  row.appendChild(wrapper);
  row.appendChild(pfp);

  // --- PFP BEHIND BUBBLE ---
  if (isMe) {
    pfp.style.right = "-18px";  // overlap amount
    bubble.style.marginRight = "24px";
  } else {
    pfp.style.left = "-18px";
    bubble.style.marginLeft = "24px";
  }

  chatAreaEl.appendChild(row);
  scrollBottom();
}

/* -----------------------------------------
   Send Message (text)
----------------------------------------- */
sendBtn.addEventListener("click", sendMessage);
msgInput.addEventListener("keydown", e => {
  if (e.key === "Enter") sendMessage();
  else handleTyping();
});

function sendMessage() {
  if (!currentRoom) return;
  let text = msgInput.value.trim();
  if (!text) return;

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

  db.ref("users/" + myUid()).once("value").then(snap => {
    const u = snap.val() || {};
    if (u.bannedUntil && u.bannedUntil > now()) {
      return alert("You are banned.");
    }
    if (u.timeoutUntil && u.timeoutUntil > now()) {
      return alert("You are timed out.");
    }

    const baseMsg = {
      uid: myUid(),
      username: currentUser.username,
      displayName: currentUser.displayName || currentUser.username,
      pfpUrl: currentUser.pfpUrl || "",
      text,
      createdAt: now()
    };

    if (currentRoom.type === "dm") {
      const me = myUid();
      const other = currentRoom.otherUid;
      const k = db.ref().push().key;
      db.ref("dms/" + me + "/" + other + "/" + k).set(baseMsg);
      db.ref("dms/" + other + "/" + me + "/" + k).set(baseMsg);
    } else if (currentRoom.type === "room") {
      db.ref("chats/" + currentRoom.id).push(baseMsg);
    } else if (currentRoom.type === "group") {
      db.ref("groups/" + currentRoom.id + "/messages").push(baseMsg);
    }

    msgInput.value = "";
  });
}

/* -----------------------------------------
   File Upload (image + video)
----------------------------------------- */
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

function uploadFileAndSend(file) {
  db.ref("users/" + myUid()).once("value").then(snap => {
    const u = snap.val() || {};
    if (u.bannedUntil && u.bannedUntil > now()) {
      return alert("You are banned right now.");
    }
    if (u.timeoutUntil && u.timeoutUntil > now()) {
      return alert("You are timed out.");
    }

    const path = `uploads/${myUid()}/${Date.now()}_${file.name}`;
    const fileRef = storage.ref().child(path);

    fileRef.put(file).then(s => s.ref.getDownloadURL()).then(url => {
      const fileType = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
        ? "video"
        : "file";

      const baseMsg = {
        uid: myUid(),
        username: currentUser.username,
        displayName: currentUser.displayName || currentUser.username,
        pfpUrl: currentUser.pfpUrl || "",
        text: msgInput.value.trim() ? sanitize(msgInput.value.trim()) : "",
        fileUrl: url,
        fileType,
        originalName: file.name,
        createdAt: now()
      };

      msgInput.value = "";

      if (currentRoom.type === "dm") {
        const me = myUid();
        const other = currentRoom.otherUid;
        const k = db.ref().push().key;
        db.ref("dms/" + me + "/" + other + "/" + k).set(baseMsg);
        db.ref("dms/" + other + "/" + me + "/" + k).set(baseMsg);
      } else if (currentRoom.type === "room") {
        db.ref("chats/" + currentRoom.id).push(baseMsg);
      } else if (currentRoom.type === "group") {
        db.ref("groups/" + currentRoom.id + "/messages").push(baseMsg);
      }
    });
  });
}

/* -----------------------------------------
   User Popup (PFP click)
----------------------------------------- */
function openUserPopup(uid) {
  if (!uid) return;
  db.ref("users/" + uid).once("value").then(snap => {
    const u = snap.val();
    if (!u) return;

   let n = u.displayName || u.username;
   if (u.verified) n += " ✔";
   popupDisplayName.textContent = n;
    popupRealName.textContent = "@" + u.username;
    popupPfp.src =
      u.pfpUrl ||
      "https://ui-avatars.com/api/?background=1f2937&color=fff&name=" +
        encodeURIComponent(u.displayName || u.username);

    popupDmBtn.onclick = () => {
      sendDMRequest(uid);
      hideModal(userPopup);
      alert("DM request sent.");
    };

    popupInviteBtn.onclick = () => {
      const groupId = prompt("Enter group ID to invite them to:");
      if (!groupId) return;
      db.ref("groups/" + groupId + "/meta/name").once("value").then(ns => {
        const name = ns.val() || "Group";
        sendGroupInvite(uid, groupId, name);
        hideModal(userPopup);
        alert("Invite sent.");
      });
    };

    showModal(userPopup);
  });
}

popupCloseBtn.addEventListener("click", () => hideModal(userPopup));

/* -----------------------------------------
   Settings (display name + PFP + admin key)
----------------------------------------- */
$("#openSettings").addEventListener("click", () => {
  settingsDisplayNameInput.value =
    currentUser?.displayName || currentUser?.username || "";
  settingsPfpFileInput.value = "";
  showModal(settingsModal);
});

settingsSaveBtn.addEventListener("click", () => {
  const newName =
    settingsDisplayNameInput.value.trim() || currentUser.username;
  currentUser.displayName = newName;

  const pfpFile = settingsPfpFileInput.files[0];

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

    db.ref("users/" + myUid()).update({
      displayName: newName,
      pfpUrl: currentUser.pfpUrl || ""
    });

    hideModal(settingsModal);
  }

  if (pfpFile) {
    const path = `pfp/${myUid()}/${Date.now()}_${pfpFile.name}`;
    const pfpRef = storage.ref().child(path);
    pfpRef.put(pfpFile).then(s => s.ref.getDownloadURL()).then(url => {
      finishUpdate(url);
    });
  } else {
    finishUpdate(null);
  }
});

/* Admin unlock (from settings) */
settingsAdminBtn.addEventListener("click", () => {
  const key = settingsAdminKeyInput.value.trim();
  if (key !== ADMIN_KEY) {
    alert("Wrong admin key.");
    return;
  }
  enableAdmin();
});

/* Backup login inside admin modal */
$("#adminLoginBtn").addEventListener("click", () => {
  const key = $("#adminKeyInput").value.trim();
  if (key !== ADMIN_KEY) return alert("Wrong admin key.");
  enableAdmin();
});

function enableAdmin() {
  if (isAdmin) {
    showModal(adminModal);
    return;
  }
  isAdmin = true;
  db.ref("admins/" + myUid()).set(true);
  db.ref("users/" + myUid() + "/role").set("admin");
  if (adminLoginView && adminPanelView) {
    adminLoginView.style.display = "none";
    adminPanelView.style.display = "block";
  }
  showModal(adminModal);
}

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

      if (action === "ban-60") updates.bannedUntil = now() + HOUR;
      if (action === "unban") updates.bannedUntil = 0;
      if (action === "timeout-5") updates.timeoutUntil = now() + FIVE;
      if (action === "timeout-60") updates.timeoutUntil = now() + HOUR;
      if (action === "verify") updates.verified = true;
      if (action === "delete-account") {
 
  db.ref("users/" + uid).remove();
  db.ref("presence/" + uid).remove();
  db.ref("dms/" + uid).remove();

  db.ref("dms").once("value").then(s => {
    s.forEach(u => {
      db.ref("dms/" + u.key + "/" + uid).remove();
    });
  });

  db.ref("groups").once("value").then(s => {
    s.forEach(g => {
      db.ref("groups/" + g.key + "/members/" + uid).remove();
    });
  });

  alert("Account deleted.");
  return;
}
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
  if (currentRoom.type === "dm") path = "dms/" + myUid() + "/" + currentRoom.otherUid;

  const ref = db.ref(path);

  ref.orderByChild("createdAt")
    .limitToLast(n)
    .once("value")
    .then(snap => {
      snap.forEach(child => {
        ref.child(child.key).remove();
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
  if (currentRoom.type === "dm") path = "dms/" + myUid() + "/" + currentRoom.otherUid;

  const ref = db.ref(path);

  ref.once("value").then(snap => {
    snap.forEach(child => {
      const msg = child.val();
      if (!msg.text) return;
      const count = msg.text.split(/\s+/).length;
      if (count > x) {
        ref.child(child.key).remove();
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
  if (currentRoom.type === "dm") path = "dms/" + myUid() + "/" + currentRoom.otherUid;

  db.ref(path).remove();
  chatAreaEl.innerHTML = "";
});

/* -----------------------------------------
   Misc UI
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
  if (e.target === userPopup) hideModal(userPopup);
});
/*------------------
Quick button lowkey
--------------------*/
$("#quickDmBtn").addEventListener("click", () => {
    const uid = quickUserSelect.value;
    if (!uid) return alert("Select someone first.");

    sendDMRequest(uid);
    alert("DM request sent!");
});

$("#quickInviteBtn").addEventListener("click", () => {
    const uid = quickUserSelect.value;
    const groupId = quickGroupSelect.value;

    if (!uid) return alert("Select a user.");
    if (!groupId) return alert("Select a group.");

    db.ref("groups/" + groupId + "/meta/name").once("value").then(snap => {
        const name = snap.val() || "Group";
        sendGroupInvite(uid, groupId, name);
        alert("Invite sent!");
    });
});

function repairPresenceUsername(uid, expectedName) {
  db.ref("presence/" + uid).once("value").then(snap => {
    if (!snap.exists()) return;

    const val = snap.val();
    if (!val.username || val.username.trim() === "") {
      db.ref("presence/" + uid).update({
        username: expectedName
      });
    }
  });
}
/* -----------------------------------------
   Start
----------------------------------------- */
document.addEventListener("DOMContentLoaded", ensureAccount);
