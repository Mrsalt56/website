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
const reportWebhookURL = "https://discord.com/api/webhooks/1405419496331808789/WxRxJIiqmG9xVXrIdXx2VqzIJkikX6lE3uzk6A2QzrHfxdUuQJgGnD1wZqxO5Qalq_Ts";

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

    if (matchesSearch && searchTerm.length > 0) {
      const cloneLink = link.cloneNode(true); 
      cloneLink.style.display = 'inline-block';
      cloneLink.style.marginRight = '10px';

      const cloneImg = cloneLink.querySelector('img');
      cloneImg.style.width = '12vw';
      cloneImg.style.height = '12vw';
      cloneImg.style.objectFit = 'cover';
      cloneImg.style.borderRadius = '1vw';
      cloneImg.style.transition = 'transform 0.2s, filter 0.2s';
      cloneImg.onmouseover = () => {
        cloneImg.style.transform = 'scale(1.05)';
        cloneImg.style.filter = 'brightness(80%)';
      };
      cloneImg.onmouseout = () => {
        cloneImg.style.transform = 'scale(1)';
        cloneImg.style.filter = 'brightness(100%)';
      };

      searchResults.appendChild(cloneLink);
    }
  });

  searchResults.style.display = searchResults.children.length > 0 ? 'flex' : 'none';
  searchResults.style.overflowX = 'auto';
  searchResults.style.gap = '1vw';
  searchResults.style.flexWrap = 'nowrap';
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

const sendReportBtn = document.getElementById("sendReport");

sendReportBtn.onclick = () => {
  const title = document.getElementById("problemTitle").value.trim();
  const details = document.getElementById("problemDetails").value.trim();

  if (!title) { 
    alert("Please enter a title for the problem."); 
    return; 
  }

  const payload = {
    content: `🚨 **Problem Reported**\n**Title:** ${title}\n**Details:** ${details || "No details provided"}`
  };

  fetch(reportWebhookURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  .then(response => {
    if (response.ok) alert("Problem report sent successfully!");
    else alert("Failed to send problem report. Please try again.");
  })
  .catch(error => {
    console.error("Error sending to Discord:", error);
    alert("There was an error sending your report.");
  });

  document.getElementById("problemTitle").value = "";
  document.getElementById("problemDetails").value = "";
  document.getElementById("reportForm").style.display = "none";
};

const reportButton = document.getElementById("reportButton");
const reportModal = document.getElementById("reportForm");

reportButton.onclick = () => { 
  reportModal.style.display = 'block'; 
};
