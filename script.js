document.addEventListener('DOMContentLoaded', () => {
  // ------------------------
  // Game search & filter
  // ------------------------
  const searchInput = document.querySelector('.search input');
  const gameCards = Array.from(document.querySelectorAll('.game-card'));
  const searchResults = document.getElementById('search-results');

const suggestButton =
  document.getElementById('sbSuggest') ||
  document.getElementById('suggestButton');
  const modal = document.getElementById('suggestionForm');
  const closeBtns = document.querySelectorAll('.modal .close');
  const sendBtn = document.getElementById('sendSuggestion');

  const webhookURL = "https://discord.com/api/webhooks/1442643918356480091/UUR5lCKDC2OUBI5xQWeWMO_vwRiCXgFswnbWOoC2OWX2iCzSintVVQFCu1xFzuCj8ljq";
  const reportWebhookURL = "https://discord.com/api/webhooks/1442642641576525854/VinflwdNekq4_nVAPn7R4XyQwHrUtqbobeu2HMSuzDEvOHInYxIjnqyi4hH8pKuE6lxU";

  let currentFilter = 'all';
  const popularityAliases = { hot: ['hot','trending'], trending: ['hot','trending'] };

  function applyFilter(filter = currentFilter) {
    const f = (filter || 'all').toLowerCase();
    gameCards.forEach(card => {
      const genre = (card.getAttribute('data-genre') || '').toLowerCase();
      const popularity = (card.getAttribute('data-popularity') || '').toLowerCase();
      let show = f === 'all' || f === '' || f === genre || f === popularity || (popularityAliases[f] && popularityAliases[f].includes(popularity));
      card.style.display = show ? '' : 'none';
    });
  }

  function updateGames() {
    const searchTerm = (searchInput.value || '').trim().toLowerCase();
    searchResults.innerHTML = '';
    if (!searchTerm) { searchResults.style.display='none'; applyFilter(); return; }

    let found = 0;
    gameCards.forEach(card => {
      const name = (card.querySelector('h3')?.innerText || '').toLowerCase();
      const matches = name.includes(searchTerm);
      card.style.display = matches ? '' : 'none';
      if (matches) {
        const clone = card.cloneNode(true);
        clone.addEventListener('click', () => {
          const link = clone.getAttribute('data-link');
          if (link) window.open(link,'_blank'); else alert("This game doesn't have a link yet.");
        });
        searchResults.appendChild(clone);
        found++;
      }
    });
    searchResults.style.display = found > 0 ? 'flex' : 'none';
  }

  if (searchInput) searchInput.addEventListener('input', updateGames);

  // ------------------------
  // Suggestion modal
  // ------------------------
  if (suggestButton && modal) {
    suggestButton.addEventListener('click', () => { modal.style.display='flex'; });
  }
  closeBtns.forEach(btn => btn.addEventListener('click', () => {
    const m = btn.closest('.modal');
    if (m) m.style.display='none';
  }));
  window.addEventListener('click', e => {
    if (e.target.classList.contains('modal')) e.target.style.display='none';
  });

  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      const name = document.getElementById('gameName')?.value.trim();
      const details = document.getElementById('gameDetails')?.value.trim();
      if (!name) { alert('Please enter a game name.'); return; }
      fetch(webhookURL, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ content:`🎮 **New Game Suggestion**\n**Game:** ${name}\n**Details:** ${details || '(none)'}` })
      }).then(() => {
        alert('Suggestion sent!');
        modal.style.display='none';
      }).catch(err => { console.error(err); alert('Failed to send suggestion.'); });
    });
  }

  // ------------------------
  // Report modal
  // ------------------------
const reportButton =
  document.getElementById('sbReport') ||
  document.getElementById('reportButton'); 
const reportModal = document.getElementById('reportForm');
const sendReportBtn = document.getElementById('sendReport');

  if (reportButton && reportModal) reportButton.addEventListener('click', () => reportModal.style.display='flex');
  if (sendReportBtn) {
    sendReportBtn.addEventListener('click', () => {
      const title = document.getElementById('problemTitle')?.value.trim();
      const details = document.getElementById('problemDetails')?.value.trim();
      if (!title) { alert('Enter a problem title.'); return; }
      fetch(reportWebhookURL, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ content:`🚨 **Problem Reported**\n**Title:** ${title}\n**Details:** ${details || '(none)'}` })
      }).then(() => { alert('Report sent!'); reportModal.style.display='none'; })
        .catch(err => { console.error(err); alert('Failed to send report.'); });
    });
  }

  // ------------------------
  // Game card clicks
  // ------------------------
  gameCards.forEach(card => {
    card.addEventListener('click', () => {
      const link = card.getAttribute('data-link');
      if (link) window.open(link,'_blank'); else alert("This game doesn't have a link yet.");
    });
  });

  document.querySelectorAll('.movie-card').forEach(card => {
    card.addEventListener('click', () => {
      const link = card.getAttribute('data-link');
      if (link) {
        window.open(link, '_blank'); // opens Google Doc
      }
    });
  });

  
  // ------------------------
  // Nav filters
  // ------------------------
  const navLinks = document.querySelectorAll('.site-nav a');
  const allSections = document.querySelectorAll('.games-section');
  navLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      const filter = (link.getAttribute('data-filter') || 'all').toLowerCase();
      const unifiedContainer = document.getElementById('search-results');
      unifiedContainer.innerHTML='';

      if (filter==='all') {
        unifiedContainer.style.display='none';
        allSections.forEach(section => section.style.display='block');
        document.querySelectorAll('.game-card').forEach(card => card.style.display='');
        return;
      }

      allSections.forEach(section => section.style.display='none');
      unifiedContainer.style.display='flex';

      let found = 0;
      document.querySelectorAll('.game-card').forEach(card => {
        const genre = (card.getAttribute('data-genre') || '').toLowerCase();
        const popularity = (card.getAttribute('data-popularity') || '').toLowerCase();
        if (filter===genre || filter===popularity) {
          const clone = card.cloneNode(true);
          clone.addEventListener('click', () => {
            const link = clone.getAttribute('data-link');
            if (link) window.open(link,'_blank');
          });
          unifiedContainer.appendChild(clone);
          found++;
        }
      });

      if (found===0) unifiedContainer.innerHTML='<p>No games found.</p>';
    });
  });

  // ------------------------
  // Horizontal scrolling grids (smooth + fast)
  // ------------------------
document.querySelectorAll('.games-row').forEach(row => {
  const grid = row.querySelector('.games-grid');
  const leftBtn = row.querySelector('.scroll-btn.left');
  const rightBtn = row.querySelector('.scroll-btn.right');

  let scrolling = false;
  let direction = 0;
  const scrollSpeed = 15000; // ⚡ pixels per second — adjust this for faster/slower

  let lastTime = 0;

  function step(timestamp) {
    if (!scrolling) return;
    if (!lastTime) lastTime = timestamp;

    const delta = (timestamp - lastTime) / 1000; // convert to seconds
    lastTime = timestamp;

    grid.scrollLeft += direction * scrollSpeed * delta;
    requestAnimationFrame(step);
  }

  const startScroll = dir => {
    direction = dir;
    if (!scrolling) {
      scrolling = true;
      lastTime = 0;
      requestAnimationFrame(step);
    }
  };

  const stopScroll = () => { scrolling = false; };

  leftBtn.addEventListener('mousedown', () => startScroll(-1));
  rightBtn.addEventListener('mousedown', () => startScroll(1));
  leftBtn.addEventListener('mouseup', stopScroll);
  rightBtn.addEventListener('mouseup', stopScroll);
  leftBtn.addEventListener('mouseleave', stopScroll);
  rightBtn.addEventListener('mouseleave', stopScroll);

  // Mobile touch support
  leftBtn.addEventListener('touchstart', () => startScroll(-1));
  rightBtn.addEventListener('touchstart', () => startScroll(1));
  leftBtn.addEventListener('touchend', stopScroll);
  rightBtn.addEventListener('touchend', stopScroll);
});

// ------------------------
// Firebase Shoutouts
// ------------------------
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

// Initialize Firebase (compat)
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const submitBtn = document.getElementById("submitBtn");
const userNameInput = document.getElementById("userName");
const queueList = document.getElementById("queueList");
const cooldownMsg = document.getElementById("cooldownMsg");
const COOLDOWN = 60 * 1000;

// Submit a shoutout
submitBtn.addEventListener("click", () => {
  const name = userNameInput.value.trim();
  if (!name) return alert("Name submitted✅");

  const lastTime = localStorage.getItem("lastShoutout") || 0;
  if (Date.now() - lastTime < COOLDOWN) {
    cooldownMsg.textContent = "Please wait before submitting again!";
    return;
  }

  localStorage.setItem("lastShoutout", Date.now());
  cooldownMsg.textContent = "";

  // Push to Firebase
  db.ref("shoutouts").push({ name, timestamp: Date.now() });

  // Clear input
  userNameInput.value = "";

  // Send to Discord webhook
  fetch("https://discord.com/api/webhooks/1442644059091898510/LVEBqv-Gz5qkkVYYM6Ud0qPHDKMT846A9K8AiuDqGLpKb6_0R66dMkyYYP2dZPOan5SE", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: `📢 New shoutout request: **${name}**` })
  }).catch(console.error);
});

// Listen for updates and display shoutouts
db.ref("shoutouts").orderByChild("timestamp").on("value", snapshot => {
  const shoutouts = [];
  snapshot.forEach(childSnap => {
    shoutouts.push({ key: childSnap.key, name: childSnap.val().name });
  });

  // Keep oldest first (first-come-first-serve)
  shoutouts.sort((a, b) => a.timestamp - b.timestamp);

  // Display first 10
  const MAX_VISIBLE = 10;
  const visibleShoutouts = shoutouts.slice(0, MAX_VISIBLE);
  const hiddenCount = shoutouts.length - visibleShoutouts.length;

  // Update the list
  queueList.innerHTML = "";
  visibleShoutouts.forEach(entry => {
    const li = document.createElement("li");
    li.textContent = entry.name;
    li.style.color = "black"; // black font
    li.style.marginBottom = "4px";

    // Remove button
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.className = "remove-btn";
    removeBtn.onclick = () => {
      const password = prompt("Enter admin password:");
      if (password === "56") db.ref(`shoutouts/${entry.key}`).remove();
    };

    li.appendChild(removeBtn);
    queueList.appendChild(li);
  });

  // Show "and X more" if needed
  if (hiddenCount > 0) {
    const moreLi = document.createElement("li");
    moreLi.textContent = `and ${hiddenCount} more`;
    moreLi.style.color = "black";
    moreLi.style.fontStyle = "italic";
    queueList.appendChild(moreLi);
  }
});
  // ------------------------
  // Initialize filter
  // ------------------------
  applyFilter('all');
});
// ✅ Sidebar Toggle Fix (runs immediately)
(() => {
  const sidebar = document.getElementById('siteSidebar');
  const toggle = document.getElementById('sidebarToggle');
  const closeBtn = document.getElementById('sidebarClose');

  if (!sidebar || !toggle) {
    console.warn('Sidebar or toggle button not found');
    return;
  }

  console.log('✅ Sidebar toggle initialized');

  function openSidebar() {
    sidebar.setAttribute('aria-hidden', 'false');
  }

  function closeSidebar() {
    sidebar.setAttribute('aria-hidden', 'true');
  }

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    openSidebar();
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeSidebar();
    });
  }

  document.addEventListener('click', (e) => {
    if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
      closeSidebar();
    }
  });
})();



const navLinks = document.querySelectorAll('.site-nav a');
const moviesPage = document.getElementById('moviesPage');
const gameSections = document.querySelectorAll('.games-section');

navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();

    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    const page = link.dataset.page;

    if (page === "movies") {
      moviesPage.style.display = "block";
      gameSections.forEach(sec => sec.style.display = "none");
    } else {
      moviesPage.style.display = "none";
      gameSections.forEach(sec => sec.style.display = "block");
    }
  });
});

const movieSearch = document.getElementById("movieSearch");
const movieCards = document.querySelectorAll(".movie-card");

if (movieSearch) {
  movieSearch.addEventListener("input", () => {
    const q = movieSearch.value.toLowerCase();

    movieCards.forEach(card => {
      const title = card.dataset.title;
      card.style.display = title.includes(q) ? "" : "none";
    });
  });
}
// ------------------------
// Sidebar dropdowns
// ------------------------
document.querySelectorAll(".sidebar-box[data-collapsible]").forEach((box) => {
  const head = box.querySelector(".sb-head");
  const body = box.querySelector(".sb-body");
  if (!head || !body) return;

  const startOpen = box.getAttribute("data-open") === "true";
  setOpen(startOpen);

  function setOpen(open) {
    box.setAttribute("data-open", open ? "true" : "false");
    head.setAttribute("aria-expanded", open ? "true" : "false");
    body.hidden = !open;
  }

  head.addEventListener("click", () => {
    const isOpen = box.getAttribute("data-open") === "true";
    setOpen(!isOpen);
  });
});

// ------------------------
// Stats: 7-day visits + session timer
// ------------------------
const visits7dEl = document.getElementById("visits7d");
const sessionTimerEl = document.getElementById("sessionTimer");

function localDateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(date, delta) {
  const d = new Date(date);
  d.setDate(d.getDate() + delta);
  return d;
}

// ------------------------
// Questions (votes)
// ------------------------
async function vote(questionId, answer) {
  const voteKey = `voted_${questionId}`;
  if (localStorage.getItem(voteKey)) return; // already voted on this device

  localStorage.setItem(voteKey, "1");

  const path = `analytics/questions/${questionId}/${answer}`;
  await inc(path);

  renderResults(questionId);
}

async function renderResults(questionId) {
  const a = await get(`analytics/questions/${questionId}/a`);
  const b = await get(`analytics/questions/${questionId}/b`);
  const yes = await get(`analytics/questions/${questionId}/yes`);
  const no = await get(`analytics/questions/${questionId}/no`);

  const el = document.getElementById(`q-${questionId}`);
  if (!el) return;

  // handle either type (wyr uses a/b, yn uses yes/no)
  if (questionId.startsWith("wyr")) {
    const total = (a || 0) + (b || 0);
    el.textContent = total ? `Fly: ${a || 0} • Invisible: ${b || 0}` : "No votes yet.";
  } else {
    const total = (yes || 0) + (no || 0);
    el.textContent = total ? `Yes: ${yes || 0} • No: ${no || 0}` : "No votes yet.";
  }
}

document.querySelectorAll(".q-btn[data-q][data-a]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const q = btn.getAttribute("data-q");
    const a = btn.getAttribute("data-a");
    if (!q || !a) return;
    await vote(q, a);
  });
});

// load current results on open
renderResults("wyr1");
renderResults("yn1");

async function inc(path) {
  if (!window.db && !(typeof firebase !== "undefined" && firebase.apps && firebase.apps.length)) return;
  const _db = window.db || firebase.database();
  return _db.ref(path).transaction((n) => (n || 0) + 1);
}

async function get(path) {
  if (!window.db && !(typeof firebase !== "undefined" && firebase.apps && firebase.apps.length)) return 0;
  const _db = window.db || firebase.database();
  const snap = await _db.ref(path).once("value");
  return snap.val() || 0;
}

// count a "visit" once per device per day
(async () => {
  const today = localDateKey();
  const last = localStorage.getItem("visitStamp");

  if (last !== today) {
    localStorage.setItem("visitStamp", today);
    await inc(`analytics/visits/${today}`);
  }

  // sum last 7 days (today + previous 6)
  const days = Array.from({ length: 7 }, (_, i) => localDateKey(addDays(new Date(), -i)));
  const counts = await Promise.all(days.map((k) => get(`analytics/visits/${k}`)));
  const total = counts.reduce((a, b) => a + (Number(b) || 0), 0);

  if (visits7dEl) visits7dEl.textContent = String(total);
})();

// session timer
(() => {
  const start = Date.now();
  function tick() {
    const s = Math.floor((Date.now() - start) / 1000);
    const hh = String(Math.floor(s / 3600)).padStart(2, "0");
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    if (sessionTimerEl) sessionTimerEl.textContent = `${hh}:${mm}:${ss}`;
  }
  tick();
  setInterval(tick, 1000);
})();

// ------------------------
// Sidebar dropdowns (FIX for .sb-drop)
// ------------------------
document.querySelectorAll(".sb-drop").forEach((drop) => {
  const head = drop.querySelector(".sb-drop-head");
  const body = drop.querySelector(".sb-drop-body");
  if (!head || !body) return;

  function setOpen(open) {
    drop.setAttribute("data-open", open ? "true" : "false");
    head.setAttribute("aria-expanded", open ? "true" : "false");
    body.hidden = !open;
  }

  // start closed unless data-open="true"
  setOpen(drop.getAttribute("data-open") === "true");

  head.addEventListener("click", (e) => {
    e.preventDefault();
    const isOpen = drop.getAttribute("data-open") === "true";
    setOpen(!isOpen);
  });
});

// ------------------------
// GLOBAL Daily Question (Firebase)
// ------------------------
const DAILY_QUESTIONS = [
  { id: "wyr_invisible_fly", text: "Would you rather be invisible or fly?", a: "Be invisible", b: "Fly" },
  { id: "wyr_no_tiktok_no_games", text: "Would you rather never use TikTok again or never play games again?", a: "No TikTok", b: "No games" },
  { id: "yn_aliens", text: "Do you believe aliens exist?", a: "Yes", b: "No" },
  { id: "yn_skip_1000", text: "Would you skip school for $1,000?", a: "Yes", b: "No" }
];

// Elements
const qText = document.getElementById("questionText");
const qA = document.getElementById("qOptionA");
const qB = document.getElementById("qOptionB");
const qResults = document.getElementById("qResults");
const qLabelA = document.getElementById("qLabelA");
const qLabelB = document.getElementById("qLabelB");
const qPctA = document.getElementById("qPctA");
const qPctB = document.getElementById("qPctB");
const qFillA = document.getElementById("qFillA");
const qFillB = document.getElementById("qFillB");
const qVotedNote = document.getElementById("qVotedNote");

function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

// Pick same question for everyone each day
function getDailyQuestion() {
  const day = Math.floor(Date.now() / 86400000);
  return DAILY_QUESTIONS[day % DAILY_QUESTIONS.length];
}

const dailyQ = getDailyQuestion();
const dayKey = todayKey();
const baseRef = db.ref(`dailyQuestions/${dayKey}`);

qText.textContent = dailyQ.text;
qA.textContent = dailyQ.a;
qB.textContent = dailyQ.b;
qLabelA.textContent = dailyQ.a;
qLabelB.textContent = dailyQ.b;

// Init question in DB if missing
baseRef.child("questionId").set(dailyQ.id);
baseRef.child("votes").once("value", snap => {
  if (!snap.exists()) {
    baseRef.child("votes").set({ A: 0, B: 0 });
  }
});

// Listen for live vote updates
baseRef.child("votes").on("value", snap => {
  const v = snap.val() || { A: 0, B: 0 };
  const total = v.A + v.B || 1;

  const pctA = Math.round((v.A / total) * 100);
  const pctB = 100 - pctA;

  qPctA.textContent = pctA + "%";
  qPctB.textContent = pctB + "%";
  qFillA.style.width = pctA + "%";
  qFillB.style.width = pctB + "%";
});

// Voting (1 vote per day per device)
function vote(option) {
  const votedKey = `voted_${dayKey}`;
  if (localStorage.getItem(votedKey)) return;

  baseRef.child(`votes/${option}`).transaction(v => (v || 0) + 1);
  localStorage.setItem(votedKey, option);

  qResults.hidden = false;
  qVotedNote.textContent = "You voted today ✔";
}

qA.onclick = () => vote("A");
qB.onclick = () => vote("B");

// If already voted today, show results
if (localStorage.getItem(`voted_${dayKey}`)) {
  qResults.hidden = false;
  qVotedNote.textContent = "You already voted today ✔";
}
