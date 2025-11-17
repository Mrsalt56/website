const viewportWidth = window.innerWidth;
const viewportHeight = window.innerHeight;

const srcURL = 'https://raw.githubusercontent.com/Indiana-Leiter/GrannyGames/main'
const gamesManifestURL = `${srcURL}/games.json`;

alert('script is running');

fetch(gamesManifestURL)
.then(response => {
    if (!response.ok) throw new Error("Failed to fetch games list");
    return response.json();
})
.then(data => {
    let games = data.games;

    for (let i = 0; i < games.length; i++) {
        const game = games[i];
        const safeId = game.name.replace(/\s+/g, '-');
        const gameURL = `${srcURL}/${game.file}`;
        const imageURL = game.icon;

        createButton(safeId, game.name, 20 + (i*300), viewportHeight/2-20, 200, 40, imageURL);
        document.getElementById(safeId).onclick = () => {
            openTabFunc(gameURL, game.name);
        };
    }
})
.catch(error => {
    alert("Error loading game names: " + error);
    console.error("Error loading game names: ", error);
});

function openTabFunc(url, gameName) {
    fetch(url)
    .then(response => {
        if (!response.ok) throw new Error("Network response was not okay");
        return response.text();
    })
    .then(html => {
        const blob = new Blob([html], { type: 'text/html' });
        const blobUrl = URL.createObjectURL(blob);

        const newTab = window.open('about:blank', '_blank');
        if (!newTab) {
            alert('Pop-up blocked. Please allow pop-ups for this site.');
            return;
        }

        newTab.document.write(`
            <!DOCTYPE html>
            <html>
            <head><title>${gameName}</title></head>
            <body style="margin:0;overflow:hidden;background:#000;">
                <iframe src="${blobUrl}" style="border:none;width:100vw;height:100vh;"></iframe>
            </body>
            </html>
        `);
        newTab.document.close();
    })
    .catch(error => {
        alert('Error fetching HTML: ' + error);
        console.error("Error fetching HTML: ", error);
    });
}

function createButton(id, text, x, y, width, height, imageURL) {
    const button = document.createElement('button');
    button.id = id;
    button.style.position = 'absolute';
    button.style.left = `${x}px`;
    button.style.top = `${y}px`;
    button.style.width = `${width}px`;
    button.style.height = `${height}px`;
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'start';
    button.style.padding = '5px';
    button.style.gap = '10px';

    if (imageURL) {
        const img = document.createElement('img');
        img.src = imageURL;
        img.style.height = '100%';
        img.style.aspectRatio = '1';
        img.style.objectFit = 'contain';
        button.appendChild(img);
    }

    const span = document.createElement('span');
    span.textContent = text;
    button.appendChild(span);

    document.body.appendChild(button);
}


function createTextBox(id, text, x, y, width, height, borderWidth, readOnly) {
    const textBox = document.createElement("textarea");
    textBox.id = id; 
    textBox.value = text; 
    textBox.style.position = "absolute";
    textBox.style.left = x + "px"; 
    textBox.style.top = y + "px"; 
    textBox.style.width = width + "px";
    textBox.style.height = height + "px";
    textBox.style.resize = "none";
    textBox.style.border = borderWidth + "px solid black";
    textBox.readOnly = readOnly;

    document.body.appendChild(textBox); 

    return textBox;
    
}

function createTextInput(id, placeholder, x, y, width, height) {
    const textInput = document.createElement("input");
    textInput.id = id; 
    textInput.type = "text";
    textInput.placeholder = placeholder; 
    textInput.style.position = "absolute";
    textInput.style.left = x + "px"; 
    textInput.style.top = y + "px"; 
    textInput.style.width = width + "px"; 
    textInput.style.height = height + "px"; 
    textInput.autocomplete = "off";

    document.body.appendChild(textInput);

    return textInput;
}