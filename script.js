const searchInput = document.querySelector('.search input');
const gameLinks = document.querySelectorAll('#games a');
const searchResults = document.getElementById('search-results');
const genreFilter = document.getElementById("genreFilter");
const popularityFilter = document.getElementById("popularityFilter");

const suggestButton = document.getElementById('suggestButton');
const modal = document.getElementById('suggestionForm');
const closeBtn = document.querySelector('.close');
const sendBtn = document.getElementById('sendSuggestion');
const webhookURL = "https://discord.com/api/webhooks/1405341631078727753/23FCdrJHMuOfcBBeUgpNugGopa_njHiJz_U0I7FIWD9TW2wxaHyv102cuJ_eIMcldpWE";

function updateGames() {
  const searchTerm = searchInput.value.toLowerCase();
  const genre = genreFilter.value;
  const popularity = popularityFilter.value;

searchResults.innerHTML = '';

  gameLinks.forEach(link => {
    const img = link.querySelector('img');
    const name = img.alt.toLowerCase();
    const gameGenre = img.dataset.genre || "all";
    const gamePopularity = img.dataset.popularity || "all";

    const matchesSearch = name.includes(searchTerm);
    const matchesFilters = (genre === "all" || gameGenre === genre) &&
                           (popularity === "all" || gamePopularity === popularity);

    link.style.display = matchesFilters ? 'block' : 'none';

    if (matchesSearch) {
      const clone = img.cloneNode(true);
      clone.style.transition = 'transform 0.2s, filter 0.2s';
      searchResults.appendChild(clone);
    }
  });

  searchResults.style.display = searchResults.children.length > 0 ? 'flex' : 'none';
}

searchInput.addEventListener('input', updateGames);
genreFilter.addEventListener('change', updateGames);
popularityFilter.addEventListener('change', updateGames);

suggestButton.onclick = () => { modal.style.display = 'block'; };
closeBtn.onclick = () => { modal.style.display = 'none'; };
window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

sendBtn.onclick = () => {
  const name = document.getElementById("gameName").value.trim();
  const details = document.getElementById("gameDetails").value.trim();

  if (!name) { alert("Please enter a game name."); return; }

  const payload = {
    content: `🎮 **New Game Suggestion**\n**Game:** ${name}\n**Details:** ${details || "No details provided"}`
  };

  fetch(webhookURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  .then(response => {
    if (response.ok) alert("Suggestion sent successfully!");
    else alert("Failed to send suggestion. Please try again.");
  })
  .catch(error => {
    console.error("Error sending to Discord:", error);
    alert("There was an error sending your suggestion.");
  });

  document.getElementById("gameName").value = "";
  document.getElementById("gameDetails").value = "";
  modal.style.display = "none";
};
