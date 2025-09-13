const searchInput = document.querySelector('.search input');
const gameCards = document.querySelectorAll('.game-card');
const searchResults = document.getElementById('search-results');

const suggestButton = document.getElementById('suggestButton');
const modal = document.getElementById('suggestionForm');
const closeBtns = document.querySelectorAll('.close');
const sendBtn = document.getElementById('sendSuggestion');
const webhookURL = "https://discord.com/api/webhooks/1415474812037628005/qPca1ARqtULY44_5dbar6dSSLiMvaKrVRchKjXPULxwJElh-M0U2zeogMrs34jv2OWuB";
const reportWebhookURL = "https://discord.com/api/webhooks/1415474903880171632/FlXBps-LswodW8fRTjkx4VWHAs19CuUR3iuFm63FMa5pLay5uI8jPvxSRVVPRrlQHDAr";

// --- SEARCH ---
function updateGames() {
  const searchTerm = searchInput.value.toLowerCase();
  searchResults.innerHTML = '';

  gameCards.forEach(card => {
    const name = card.querySelector('h3').innerText.toLowerCase();
    const matchesSearch = name.includes(searchTerm);

    card.style.display = matchesSearch || searchTerm === '' ? 'block' : 'none';

    if (matchesSearch && searchTerm.length > 0) {
      const clone = card.cloneNode(true);
      searchResults.appendChild(clone);
    }
  });

  searchResults.style.display = searchResults.children.length > 0 ? 'flex' : 'none';
}
searchInput.addEventListener('input', updateGames);

// --- MODALS ---
suggestButton.onclick = () => { modal.style.display = 'flex'; };
closeBtns.forEach(btn => btn.onclick = () => { btn.closest('.modal').style.display = 'none'; });
window.onclick = e => { if (e.target.classList.contains('modal')) e.target.style.display = 'none'; };

// --- SEND SUGGESTION ---
sendBtn.onclick = () => {
  const name = document.getElementById("gameName").value.trim();
  const details = document.getElementById("gameDetails").value.trim();
  if (!name) { alert("Please enter a game name."); return; }
  fetch(webhookURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: `🎮 **New Game Suggestion**\n**Game:** ${name}\n**Details:** ${details}` })
  }).then(() => alert("Suggestion sent!"));
};

// --- REPORT FORM ---
const reportButton = document.getElementById("reportButton");
const reportModal = document.getElementById("reportForm");
const sendReportBtn = document.getElementById("sendReport");

reportButton.onclick = () => { reportModal.style.display = 'flex'; };
sendReportBtn.onclick = () => {
  const title = document.getElementById("problemTitle").value.trim();
  const details = document.getElementById("problemDetails").value.trim();
  if (!title) { alert("Enter a problem title."); return; }
  fetch(reportWebhookURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: `🚨 **Problem Reported**\n**Title:** ${title}\n**Details:** ${details}` })
  }).then(() => alert("Report sent!"));
};
document.querySelectorAll('.game-card').forEach(card => {
  card.addEventListener('click', () => {
    const link = card.getAttribute('data-link');
    if (link) {
      window.open(link, "_blank"); // opens in new tab
    }
  });
})
// --- MAKE GAME CARDS CLICKABLE ---
document.querySelectorAll('.game-card').forEach(card => {
  card.addEventListener('click', () => {
    const link = card.getAttribute('data-link');
    if (link) {
      window.open(link, "_blank"); // opens in a new tab
    } else {
      alert("This game doesn't have a link yet.");
    }
  });
});
const navLinks = document.querySelectorAll('.site-nav a');

navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const filter = link.getAttribute('data-filter');

    document.querySelectorAll('.game-card').forEach(card => {
      const genre = card.getAttribute('data-genre');
      const popularity = card.getAttribute('data-popularity');

      if (
        filter === 'trending' && popularity === 'hot' ||
        filter === 'new' && popularity === 'new' ||
        filter === genre // matches "action", "puzzle", "sports", "platformer"
      ) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
if (filter === 'all' ||
    (filter === 'trending' && popularity === 'hot') ||
    (filter === 'new' && popularity === 'new') ||
    filter === genre) {
  card.style.display = 'block';
} else {
  card.style.display = 'none';
}
        
      }
    });
  });
});
// --- NAV FILTER ---
const navLinks = document.querySelectorAll('.site-nav a');

navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();

    // remove active class from all tabs
    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    const filter = link.getAttribute('data-filter');

    document.querySelectorAll('.game-card').forEach(card => {
      const genre = card.getAttribute('data-genre');
      const popularity = card.getAttribute('data-popularity');

      if (
        filter === 'all' ||
        filter === genre ||
        filter === popularity
      ) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  });
});
