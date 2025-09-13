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

  // Current active filter (keeps state when searching)
  let currentFilter = 'all';

  // Helper: show/hide cards according to currentFilter
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

      card.style.display = show ? '' : 'none'; // '' -> use CSS default (flex item), 'none' hides
    });
  }

  // SEARCH - show clones in the search bar (clones get click handlers)
  function updateGames() {
    const searchTerm = (searchInput && searchInput.value || '').trim().toLowerCase();
    searchResults.innerHTML = '';

    if (searchTerm.length === 0) {
      // no search: hide results and reapply active filter
      searchResults.style.display = 'none';
      applyFilter();
      return;
    }

    // search: show matching clones in search-results and hide non-matching in main grid
    let found = 0;
    gameCards.forEach(card => {
      const name = (card.querySelector('h3')?.innerText || '').toLowerCase();
      const matches = name.includes(searchTerm);
      if (matches) {
        const clone = card.cloneNode(true);
        // ensure clones open the game
        clone.addEventListener('click', () => {
          const link = clone.getAttribute('data-link');
          if (link) window.open(link, '_blank');
          else alert("This game doesn't have a link yet.");
        });
        searchResults.appendChild(clone);
        found++;
      }
      // hide original card if it doesn't match (so the grid reflects search)
      card.style.display = matches ? '' : 'none';
    });

    searchResults.style.display = found > 0 ? 'flex' : 'none';
  }
  if (searchInput) searchInput.addEventListener('input', updateGames);

  // MODALS
  if (suggestButton && modal) {
    suggestButton.addEventListener('click', () => { modal.style.display = 'flex'; });
  }
  closeBtns.forEach(btn => btn.addEventListener('click', () => {
    const m = btn.closest('.modal');
    if (m) m.style.display = 'none';
  }));
  // click outside to close
  window.addEventListener('click', e => {
    if (e.target && e.target.classList && e.target.classList.contains('modal')) {
      e.target.style.display = 'none';
    }
  });

  // SUGGESTION submit
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

  // REPORT FORM
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

  // Make original game cards clickable (single listener set)
  gameCards.forEach(card => {
    card.addEventListener('click', () => {
      const link = card.getAttribute('data-link');
      if (link) window.open(link, '_blank');
      else alert("This game doesn't have a link yet.");
    });
  });

// --- NAV FILTER (unified row mode) ---
const navLinks = document.querySelectorAll('.site-nav a');
const allSections = document.querySelectorAll('.games-section');

navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();

    // update active tab
    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    const filter = (link.getAttribute('data-filter') || 'all').toLowerCase();

    const unifiedContainer = document.getElementById('search-results');
    unifiedContainer.innerHTML = '';

    if (filter === 'all') {
      // show normal layout again
      unifiedContainer.style.display = 'none';
      allSections.forEach(section => section.style.display = 'block');
      document.querySelectorAll('.game-card').forEach(card => {
        card.style.display = '';
      });
      return;
    }

    // otherwise, hide sections and build a unified row
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

  // === Force cards to stay horizontal (keeps your previous behavior) ===
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

  // initialize
  applyFilter('all');
});
