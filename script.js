document.addEventListener('DOMContentLoaded', () => {
  // Elements
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

  const popularityAliases = {
    hot: ['hot', 'trending'],
    trending: ['hot', 'trending']
  };

  function applyFilter(filter = currentFilter) {
    const f = (filter || 'all').toLowerCase();
    gameCards.forEach(card => {
      const genre = (card.getAttribute('data-genre') || '').toLowerCase();
      const popularity = (card.getAttribute('data-popularity') || '').toLowerCase();

      let show = false;
      if (f === 'all' || f === '') show = true;
      else if (f === genre) show = true;
      else if (f === popularity) show = true;
      else if (popularityAliases[f] && popularityAliases[f].includes(popularity)) show = true;

      card.style.display = show ? '' : 'none';
    });
  }

  function updateGames() {
    const searchTerm = (searchInput && searchInput.value || '').trim().toLowerCase();
    searchResults.innerHTML = '';

    if (searchTerm.length === 0) {
      searchResults.style.display = 'none';
      applyFilter();
      return;
    }

    let found = 0;
    gameCards.forEach(card => {
      const name = (card.querySelector('h3')?.innerText || '').toLowerCase();
      const matches = name.includes(searchTerm);
      if (matches) {
        const clone = card.cloneNode(true);
        clone.addEventListener('click', () => {
          const link = clone.getAttribute('data-link');
          if (link) window.open(link, '_blank');
          else alert("This game doesn't have a link yet.");
        });
        searchResults.appendChild(clone);
        found++;
      }
      card.style.display = matches ? '' : 'none';
    });

    searchResults.style.display = found > 0 ? 'flex' : 'none';
  }
  if (searchInput) searchInput.addEventListener('input', updateGames);

  if (suggestButton && modal) {
    suggestButton.addEventListener('click', () => { modal.style.display = 'flex'; });
  }
  closeBtns.forEach(btn => btn.addEventListener('click', () => {
    const m = btn.closest('.modal');
    if (m) m.style.display = 'none';
  }));
  window.addEventListener('click', e => {
    if (e.target && e.target.classList && e.target.classList.contains('modal')) {
      e.target.style.display = 'none';
    }
  });

  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      const name = document.getElementById('gameName')?.value.trim();
      const details = document.getElementById('gameDetails')?.value.trim();
      if (!name) { alert('Please enter a game name.'); return; }
      fetch(webhookURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: `🎮 **New Game Suggestion**\n**Game:** ${name}\n**Details:** ${details || '(none)'}` })
      }).then(() => {
        alert('Suggestion sent!');
        if (modal) modal.style.display = 'none';
      }).catch(err => {
        console.error(err);
        alert('Failed to send suggestion.');
      });
    });
  }

  const reportButton = document.getElementById('reportButton');
  const reportModal = document.getElementById('reportForm');
  const sendReportBtn = document.getElementById('sendReport');

  if (reportButton && reportModal) {
    reportButton.addEventListener('click', () => { reportModal.style.display = 'flex'; });
  }
  if (sendReportBtn) {
    sendReportBtn.addEventListener('click', () => {
      const title = document.getElementById('problemTitle')?.value.trim();
      const details = document.getElementById('problemDetails')?.value.trim();
      if (!title) { alert('Enter a problem title.'); return; }
      fetch(reportWebhookURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: `🚨 **Problem Reported**\n**Title:** ${title}\n**Details:** ${details || '(none)'}` })
      }).then(() => {
        alert('Report sent!');
        if (reportModal) reportModal.style.display = 'none';
      }).catch(err => {
        console.error(err);
        alert('Failed to send report.');
      });
    });
  }

  gameCards.forEach(card => {
    card.addEventListener('click', () => {
      const link = card.getAttribute('data-link');
      if (link) window.open(link, '_blank');
      else alert("This game doesn't have a link yet.");
    });
  });

const navLinks = document.querySelectorAll('.site-nav a');
const allSections = document.querySelectorAll('.games-section');

navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();

    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    const filter = (link.getAttribute('data-filter') || 'all').toLowerCase();

    const unifiedContainer = document.getElementById('search-results');
    unifiedContainer.innerHTML = '';

    if (filter === 'all') {
      unifiedContainer.style.display = 'none';
      allSections.forEach(section => section.style.display = 'block');
      document.querySelectorAll('.game-card').forEach(card => {
        card.style.display = '';
      });
      return;
    }

    allSections.forEach(section => section.style.display = 'none');
    unifiedContainer.style.display = 'flex';

    let found = 0;
    document.querySelectorAll('.game-card').forEach(card => {
      const genre = (card.getAttribute('data-genre') || '').toLowerCase();
      const popularity = (card.getAttribute('data-popularity') || '').toLowerCase();

      if (filter === genre || filter === popularity) {
        const clone = card.cloneNode(true);
        clone.addEventListener('click', () => {
          const link = clone.getAttribute('data-link');
          if (link) window.open(link, '_blank');
        });
        unifiedContainer.appendChild(clone);
        found++;
      }
    });

    if (found === 0) {
      unifiedContainer.innerHTML = '<p>No games found.</p>';
    }
  });
});

  function enforceHorizontal() {
    document.querySelectorAll('.games-grid').forEach(g => {
      g.style.display = 'flex';
      g.style.flexWrap = 'nowrap';
      g.style.overflowX = 'auto';
      g.style.overflowY = 'hidden';
      g.style.gap = '15px';
    });

    document.querySelectorAll('.games-grid .game-card').forEach(c => {
      c.style.flex = '0 0 auto';
      c.style.width = '160px';
      c.style.maxWidth = '160px';
    });
  }
  window.addEventListener('load', enforceHorizontal);

  applyFilter('all');
});

(function() {
  const sidebar = document.getElementById('siteSidebar');
  const toggle = document.getElementById('sidebarToggle');
  const closeBtn = document.getElementById('sidebarClose');


  const sbSuggest = document.getElementById('sbSuggest');
  const sbReport = document.getElementById('sbReport');

  if (!sidebar || !toggle) return;

  function openSidebar() {
    sidebar.setAttribute('aria-hidden', 'false');
  }
  function closeSidebar() {
    sidebar.setAttribute('aria-hidden', 'true');
  }

  toggle.addEventListener('click', openSidebar);
  closeBtn && closeBtn.addEventListener('click', closeSidebar);


  document.addEventListener('click', (e) => {
    if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {

      closeSidebar();
    }
  });

  if (sbSuggest) {
    sbSuggest.addEventListener('click', (e) => {
      e.preventDefault();
      const modal = document.getElementById('suggestionForm');
      if (modal) modal.style.display = 'flex';
      closeSidebar();
    });
  }
  if (sbReport) {
    sbReport.addEventListener('click', (e) => {
      e.preventDefault();
      const modal = document.getElementById('reportForm');
      if (modal) modal.style.display = 'flex';
      closeSidebar();
    });
  }

  sidebar.addEventListener('click', (e) => {
    e.stopPropagation();
  });


  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSidebar();
  });
})();


document.querySelectorAll('.games-row').forEach(row => {
  const grid = row.querySelector('.games-grid');
  const leftBtn = row.querySelector('.scroll-btn.left');
  const rightBtn = row.querySelector('.scroll-btn.right');

  let scrollInterval;
  const scrollSpeed =  30; 

  const startScroll = (direction) => {
    stopScroll();
    scrollInterval = setInterval(() => {
      grid.scrollLeft += direction * scrollSpeed;
    }, 5);
  };

  const stopScroll = () => clearInterval(scrollInterval);

  leftBtn.addEventListener('mousedown', () => startScroll(-1));
  rightBtn.addEventListener('mousedown', () => startScroll(1));

  leftBtn.addEventListener('mouseup', stopScroll);
  rightBtn.addEventListener('mouseup', stopScroll);
  leftBtn.addEventListener('mouseleave', stopScroll);
  rightBtn.addEventListener('mouseleave', stopScroll);


  leftBtn.addEventListener('touchstart', () => startScroll(-1));
  rightBtn.addEventListener('touchstart', () => startScroll(1));
  leftBtn.addEventListener('touchend', stopScroll);
  rightBtn.addEventListener('touchend', stopScroll);
});


// === Shoutout Queue Integration ==
document.addEventListener('DOMContentLoaded', () => {
  const shoutoutForm = document.getElementById('shoutoutForm');
  const shoutoutNameInput = document.getElementById('shoutoutName');
  const shoutoutQueueList = document.getElementById('shoutoutQueue');

  const shoutoutWebhookURL = "https://discord.com/api/webhooks/1424611296778653786/wTVLd0EQB2ZRifvDXAJsz9T1j9L-p1AU852T_W3uMfQ7Aq78d0UDM2t8uGQaGTtNnRpj";
  const SHOUTOUT_PASSWORD = "html,js,css,56";
  const TIME_LIMIT_MS = 60000;

  let shoutoutQueue = [];


  function sendShoutoutToDiscord(name) {
    fetch(shoutoutWebhookURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: `📢 New shoutout request: **${name}**` })
    }).catch(err => console.error('Error sending shoutout webhook:', err));
  }

  function sendShoutoutCompleteToDiscord(name) {
    fetch(shoutoutWebhookURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: `✅ Shoutout completed: **${name}**` })
    }).catch(err => console.error('Error sending completion webhook:', err));
  }

  function removeShoutoutByQueueIndex(queueIndex) {
    if (queueIndex >= 0 && queueIndex < shoutoutQueue.length) {
      const name = shoutoutQueue[queueIndex].name;
      clearTimeout(shoutoutQueue[queueIndex].timer);
      shoutoutQueue.splice(queueIndex, 1);
      updateShoutoutQueue();
      sendShoutoutCompleteToDiscord(name);
    }
  }

  function updateShoutoutQueue() {
    shoutoutQueueList.innerHTML = '';

    shoutoutQueue.slice(0, 10).forEach((item, i) => {
      const li = document.createElement('li');
      li.textContent = item.name;

      const completeBtn = document.createElement('button');
      completeBtn.textContent = '✅';
      completeBtn.style.marginLeft = '10px';
      completeBtn.style.cursor = 'pointer';
      completeBtn.title = 'Mark as complete';
      completeBtn.addEventListener('click', () => {
        const entered = prompt("Enter password to complete this shoutout:");
        if (entered === SHOUTOUT_PASSWORD) {
          removeShoutoutByQueueIndex(i);
        } else {
          alert("Incorrect password!");
        }
      });

      li.appendChild(completeBtn);
      shoutoutQueueList.appendChild(li);
    });

    if (shoutoutQueue.length > 10) {
      const note = document.createElement('li');
      note.textContent = `...and ${shoutoutQueue.length - 10} more`;
      note.style.fontStyle = 'italic';
      shoutoutQueueList.appendChild(note);
    }
  }

  if (shoutoutForm) {
    shoutoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = shoutoutNameInput.value.trim();
      if (!name) return;

      const timer = setTimeout(() => {
        const index = shoutoutQueue.findIndex(item => item.name === name);
        if (index !== -1) removeShoutoutByQueueIndex(index);
      }, TIME_LIMIT_MS);

      shoutoutQueue.push({ name, timer });
      updateShoutoutQueue();
      sendShoutoutToDiscord(name);
      shoutoutNameInput.value = '';
    });
  }

  updateShoutoutQueue();
});
