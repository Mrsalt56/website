document.addEventListener('DOMContentLoaded', () => {
  // ------------------------
  // Game search & filter
  // ------------------------
  const searchInput = document.querySelector('.search input');
  const gameCards = Array.from(document.querySelectorAll('.game-card'));
  const searchResults = document.getElementById('search-results');

  const suggestButton = document.getElementById('suggestButton');
  const modal = document.getElementById('suggestionForm');
  const closeBtns = document.querySelectorAll('.modal .close');
  const sendBtn = document.getElementById('sendSuggestion');

  const webhookURL = "https://discord.com/api/webhooks/1415474812037628005/qPca1ARqtULY44_5dbar6dSSLiMvaKrVRchKjXPULxwJElh-M0U2zeogMrs34jv2OWuB";
  const reportWebhookURL = "https://discord.com/api/webhooks/1415474903880171632/FlXBps-LswodW8fRTjkx4VWHAs19CuUR3iuFm63FMa5pLay5uI8jPvxSRVVPRrlQHDAr";

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
  const reportButton = document.getElementById('reportButton');
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
  // Horizontal scrolling grids
  // ------------------------
  function enforceHorizontal() {
    document.querySelectorAll('.games-grid').forEach(g => {
      g.style.display='flex';
      g.style.flexWrap='nowrap';
      g.style.overflowX='auto';
      g.style.overflowY='hidden';
      g.style.gap='15px';
    });
    document.querySelectorAll('.games-grid .game-card').forEach(c => {
      c.style.flex='0 0 auto';
      c.style.width='160px';
      c.style.maxWidth='160px';
    });
  }
  window.addEventListener('load', enforceHorizontal);

  document.querySelectorAll('.games-row').forEach(row => {
    const grid = row.querySelector('.games-grid');
    const leftBtn = row.querySelector('.scroll-btn.left');
    const rightBtn = row.querySelector('.scroll-btn.right');
    let scrollInterval;
    const scrollSpeed = 500;

    const startScroll = dir => { clearInterval(scrollInterval); scrollInterval=setInterval(()=>grid.scrollLeft+=dir*scrollSpeed,10); };
    const stopScroll = () => clearInterval(scrollInterval);

    [leftBtn, rightBtn].forEach((btn,i)=>{
      const dir = i===0?-1:1;
      btn.addEventListener('mousedown', ()=>startScroll(dir));
      btn.addEventListener('mouseup', stopScroll);
      btn.addEventListener('mouseleave', stopScroll);
      btn.addEventListener('touchstart', ()=>startScroll(dir));
      btn.addEventListener('touchend', stopScroll);
    });
  });

  // ------------------------
  // Sidebar toggle
  // ------------------------
  const sidebar = document.getElementById('siteSidebar');
  const toggle = document.getElementById('sidebarToggle');
  const closeBtn = document.getElementById('sidebarClose');
  if(toggle) toggle.addEventListener('click', ()=>sidebar.setAttribute('aria-hidden','false'));
  if(closeBtn) closeBtn.addEventListener('click', ()=>sidebar.setAttribute('aria-hidden','true'));
  document.addEventListener('click', e=>{ if(sidebar && toggle && !sidebar.contains(e.target) && !toggle.contains(e.target)) sidebar.setAttribute('aria-hidden','true'); });

  // ------------------------
  // Firebase Shoutouts
  // ------------------------
  const submitBtn = document.getElementById("submitBtn");
  const userNameInput = document.getElementById("userName");
  const queueList = document.getElementById("queueList");
  const cooldownMsg = document.getElementById("cooldownMsg");
  const COOLDOWN = 60*1000;

  if(submitBtn) {
    submitBtn.addEventListener("click", () => {
      const name = userNameInput.value.trim();
      if(!name) return alert("Please enter your name.");
      const lastTime = localStorage.getItem("lastShoutout") || 0;
      if(Date.now()-lastTime<COOLDOWN){ cooldownMsg.textContent="Please wait before submitting again!"; return; }
      localStorage.setItem("lastShoutout", Date.now());
      cooldownMsg.textContent="";
      firebase.database().ref("shoutouts").push({name});
      userNameInput.value="";
      fetch("YOUR_DISCORD_WEBHOOK_URL",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({content:`📢 New shoutout request: **${name}**`})}).catch(console.error);
    });

    firebase.database().ref("shoutouts").on("value", snapshot => {
      queueList.innerHTML="";
      snapshot.forEach(childSnap=>{
        const key = childSnap.key;
        const {name} = childSnap.val();
        const li = document.createElement("li"); li.textContent=name;
        const removeBtn = document.createElement("button"); removeBtn.textContent="Remove"; removeBtn.className="remove-btn";
        removeBtn.onclick=()=>{ if(prompt("Enter admin password:")==="56") firebase.database().ref(`shoutouts/${key}`).remove(); };
        li.appendChild(removeBtn); queueList.appendChild(li);
      });
    });
  }

  // ------------------------
  // Initialize filter
  // ------------------------
  applyFilter('all');
});
