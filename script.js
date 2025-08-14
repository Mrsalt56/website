const input = document.querySelector('input');
const games = document.querySelectorAll('#games img');

input.addEventListener('input', () => {
  const searchTerm = input.value.toLowerCase();
  games.forEach(game => {
    if (game.alt.toLowerCase().includes(searchTerm)) {
      game.style.display = 'block';
    } else {
      game.style.display = 'none';
    }
  });
});

const suggestButton = document.getElementById('suggestButton');
const modal = document.getElementById('suggestionForm');
const closeBtn = document.querySelector('.close');
const sendBtn = document.getElementById('sendSuggestion');

suggestButton.onclick = () => {
  modal.style.display = 'block';
};

closeBtn.onclick = () => {
  modal.style.display = 'none';
};

window.onclick = (e) => {
  if (e.target == modal) {
    modal.style.display = 'none';
  }
};

const webhookURL = "https://discord.com/api/webhooks/1405341631078727753/23FCdrJHMuOfcBBeUgpNugGopa_njHiJz_U0I7FIWD9TW2wxaHyv102cuJ_eIMcldpWE";

sendBtn.onclick = () => {
  const name = document.getElementById("gameName").value.trim();
  const details = document.getElementById("gameDetails").value.trim();

  if (!name) {
    alert("Please enter a game name.");
    return;
  }

  const payload = {
    content: `🎮 **New Game Suggestion**\n**Game:** ${name}\n**Details:** ${details || "No details provided"}`
  };

  fetch(webhookURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  .then(response => {
    if (response.ok) {
      alert("Suggestion sent successfully!");
    } else {
      alert("Failed to send suggestion. Please try again.");
    }
  })
  .catch(error => {
    console.error("Error sending to Discord:", error);
    alert("There was an error sending your suggestion.");
  });

  document.getElementById("gameName").value = "";
  document.getElementById("gameDetails").value = "";
  modal.style.display = "none";
};
