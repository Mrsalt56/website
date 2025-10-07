document.addEventListener('DOMContentLoaded', () => {
  // --------------------------
  // Elements
  // --------------------------
  const searchInput = document.querySelector('.search input');
  const gameCards = Array.from(document.querySelectorAll('.game-card'));
  const searchResults = document.getElementById('search-results');

  const suggestButton = document.getElementById('suggestButton');
  const modal = document.getElementById('suggestionForm');
  const closeBtns = document.querySelectorAll('.modal .close');
  const sendBtn = document.getElementById('sendSuggestion');

  const reportButton = document.getElementById('reportButton');
  const reportModal = document.getElementById('reportForm');
  const sendReportBtn = document.getElementById('sendReport');

  const webhookURL = "https://discord.com/api/webhooks/1415474812037628005/qPca1ARqtULY44_5dbar6dSSLiMvaKrVRchKjXPULxwJElh-M0U2zeogMrs34jv2OWuB";
  const reportWebhookURL = "https://discord.com/api/webhooks/1415474903880171632/FlXBps-LswodW8fRTjkx4VWHAs19CuUR3iuFm63FMa5pLay5uI8jPvxSRVVPRrlQHDAr";

  // --------------------------
  // Filter and search
  // --------------------------
  const popularityAliases = { hot: ['hot', 'trending'], trending: ['hot', 'trending'] };
  let currentFilter = 'all';

  function applyFilter(filter = currentFilter) {
    const f = (filter || 'all').toLowerCase();
    gameCards.forEach(card => {
      const genre = (card.getAttribute('data-genre') || '').toLowerCase();
      const popularity = (card.getAttribute('data-popularity') || '').toLowerCase();
      const show = f === 'all' || f === genre || f === popularity || (popularityAliases[f] && popularityAliases[f].includes(popularity));
      card.style.display = show ? '' : 'none';
    });
  }

  function updateGames() {
    const term = (searchInput.value || '').trim().toLowerCase();
    searchResults.innerHTML = '';
    if (!term) { applyFilter(); searchResults.style.display = 'none'; return; }

    let found = 0;
    gameCards.forEach(card => {
      const name = (card.querySelector('h3')?.innerText || '').toLowerCase();
      if (name.includes(term)) {
        const clone = card.cloneNode(true);
        clone.addEventListener('click', () => {
          const link = clone.getAttribute('data-link');
          link ? window.open(link, '_blank') : alert("No link yet.");
        });
        searchResults.appendChild(clone);
        found++;
      }
      card.style.display = name.includes(term) ? '' : 'none';
    });
    searchResults.style.display = found ? 'flex' : 'none';
  }

  if (searchInput) searchInput.addEventListener('input', updateGames);
  applyFilter('all');

  // --------------------------
  // Suggestion modal
  // --------------------------
  if (suggestButton && modal) suggestButton.addEventListener('click', () => modal.style.display = 'flex');
  closeBtns.forEach(btn => btn.addEventListener('click', () => btn.closest('.modal').style.display = 'none'));
  window.addEventListener('click', e => { if (e.target.classList.contains('modal')) e.target.style.display = 'none'; });

  if (sendBtn) sendBtn.addEventListener('click', () => {
    const name = document.getElementById('gameName')?.value.trim();
    const details = document.getElementById('gameDetails')?.value.trim();
    if (!name) return alert('Enter a game name.');
    fetch(webhookURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: `🎮 **New Game Suggestion**\n**Game:** ${name}\n**Details:** ${details || '(none)'}` })
    }).then(() => { alert('Suggestion sent!'); modal.style.display = 'none'; })
      .catch(err => { console.error(err); alert('Failed to send suggestion.'); });
  });

  // --------------------------
  // Report modal
  // --------------------------
  if (reportButton && reportModal) reportButton.addEventListener('click', () => reportModal.style.display = 'flex');
  if (sendReportBtn) sendReportBtn.addEventListener('click', () => {
    const title = document.getElementById('problemTitle')?.value.trim();
    const details = document.getElementById('problemDetails')?.value.trim();
    if (!title) return alert('Enter a problem title.');
    fetch(reportWebhookURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: `🚨 **Problem Reported**\n**Title:** ${title}\n**Details:** ${details || '(none)'}` })
    }).then(() => { alert('Report sent!'); reportModal.style.display = 'none'; })
      .catch(err => { console.error(err); alert('Failed to send report.'); });
  });

  // --------------------------
  // Game card clicks
  // --------------------------
  gameCards.forEach(card => card.addEventListener('click', () => {
    const link = card.getAttribute('data-link');
    link ? window.open(link, '_blank') : alert("This game doesn't have a link yet.");
  }));

  // --------------------------
  // Firebase Shoutouts
  // --------------------------
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DB_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MSG_SENDER_ID",
    appId: "YOUR_APP_ID",
  };
  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();

  const submitBtn = document.getElementById('submitBtn');
  const userNameInput = document.getElementById('userName');
  const queueList = document.getElementById('queueList');
  const cooldownMsg = document.getElementById('cooldownMsg');
  const COOLDOWN = 60 * 1000;

  submitBtn.addEventListener('click', () => {
    const name = userNameInput.value.trim();
    if (!name) return alert('Enter your name.');
    const lastTime = localStorage.getItem('lastShoutout') || 0;
    if (Date.now() - lastTime < COOLDOWN) { cooldownMsg.textContent = "Please wait before submitting again!"; return; }
    localStorage.setItem('lastShoutout', Date.now());
    cooldownMsg.textContent = '';
    db.ref('shoutouts').push({ name });
    userNameInput.value = '';
    fetch("https://discord.com/api/webhooks/1424618718499176601/6IfTXj3Tdl4FE2YUdrWIBDwOSabR61paQ3YhzCEMfVAK9SLVpXFAbyT7GpiFyCFsAInO", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: `📢 New shoutout request: **${name}**` })
    }).catch(console.error);
  });

  db.ref('shoutouts').on('value', snapshot => {
    queueList.innerHTML = '';
    snapshot.forEach(child => {
      const key = child.key;
      const { name } = child.val();
      const li = document.createElement('li');
      li.textContent = name;
      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'Remove';
      removeBtn.className = 'remove-btn';
      removeBtn.onclick = () => { if (prompt("Enter admin password:") === "56") db.ref(`shoutouts/${key}`).remove(); };
      li.appendChild(removeBtn);
      queueList.appendChild(li);
    });
  });

  // --------------------------
  // Sidebar toggle & scrolling
  // --------------------------
  const sidebar = document.getElementById('siteSidebar');
  const toggle = document.getElementById('sidebarToggle');
  const closeBtn = document.getElementById('sidebarClose');

  toggle.addEventListener('click', () => sidebar.setAttribute('aria-hidden', 'false'));
  closeBtn.addEventListener('click', () => sidebar.setAttribute('aria-hidden', 'true'));
  document.addEventListener('click', e => { if (!sidebar.contains(e.target) && !toggle.contains(e.target)) sidebar.setAttribute('aria-hidden', 'true'); });

  document.querySelectorAll('.games-row').forEach(row => {
    const grid = row.querySelector('.games-grid');
    const leftBtn = row.querySelector('.scroll-btn.left');
    const rightBtn = row.querySelector('.scroll-btn.right');
    let scrollInterval;
    const scrollSpeed = 500;

    const startScroll = (dir) => { clearInterval(scrollInterval); scrollInterval = setInterval(() => grid.scrollLeft += dir * scrollSpeed, 10); };
    const stopScroll = () => clearInterval(scrollInterval);

    [leftBtn, rightBtn].forEach((btn, i) => {
      const dir = i === 0 ? -1 : 1;
      btn.addEventListener('mousedown', () => startScroll(dir));
      btn.addEventListener('mouseup', stopScroll);
      btn.addEventListener('mouseleave', stopScroll);
      btn.addEventListener('touchstart', () => startScroll(dir));
      btn.addEventListener('touchend', stopScroll);
    });
  });

  // --------------------------
  // Horizontal game grids
  // --------------------------
  const enforceHorizontal = () => {
    document.querySelectorAll('.games-grid').forEach(g => {
      g.style.display = 'flex';
      g.style.flexWrap = 'nowrap';
      g.style.overflowX = 'auto';
      g.style.gap = '15px';
    });
    document.querySelectorAll('.games-grid .game-card').forEach(c => {
      c.style.flex = '0 0 auto';
      c.style.width = '160px';
      c.style.maxWidth = '160px';
    });
  };
  window.addEventListener('load', enforceHorizontal);
});
