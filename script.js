const searchInput = document.querySelector('.search input');
const gameCards = document.querySelectorAll('.game-card');
const searchResults = document.getElementById('search-results');

const suggestButton = document.getElementById('suggestButton');
const modal = document.getElementById('suggestionForm');
const closeBtns = document.querySelectorAll('.close');
const sendBtn = document.getElementById('sendSuggestion');
const webhookURL = "YOUR_GAME_SUGGESTION_WEBHOOK";
const reportWebhookURL = "YOUR_PROBLEM_REPORT_WEBHOOK";

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
