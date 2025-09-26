var config = {
    type: Phaser.WEBGL,
    width: 1008,
    height: 568,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: "arcade",
        arcade: {
            gravity: { x: 0, y: 0 }
        }
    },
    scene: [
        SceneMainMenu,
        SceneMain,
        SceneStadium,
        SceneGameOver,
        SceneUpgradesMenu,
        SceneOptionsMenu,
        SceneCreditsMenu
    ],
    pixelArt: true,
    roundPixels: true
};

var adBlocker = false;

// Game state variables
var beastmode = false, beastmode_count = 0, beastmode_time = 150;
var boostCount = 100, boosting = false, down = 1, firstPlay = false;
var mobile = false, mobileUp = false, mobileDown = false, mobileLeft = false, mobileRight = false;
var moveX = 0, moveY = 0;
var muddyFactor = 0.5, muted = 1, outOfBounds = false;
var score = 10, speed = 200, speedChase = 100, speedBoost = 200, speedXEnemy = 50;
var spinCount = 3, spinning = false, stars = 0, strength = 0;
var touchdown = false, touchdownYards = 100;
var unlockedLevel1 = false, unlockedLevel2 = false, unlockedLevel3 = false;
var yards = 0, yardsToGo = 100, yardsTotal = 0;

// Initialize Phaser game
var game = new Phaser.Game(config);

// ---------------------------
// Disable all Poki/Ads logic
// ---------------------------
var StartLoading = function () {
    console.log("Loading start skipped");
}

var LoadingComplete = function() {
    console.log("Loading complete skipped");
}

var startCommercialFirst = function() {
    console.log("Commercial skipped");
    // Do nothing, wait for Play button
}

var gameStart = function(){
    console.log("Game start skipped");
}

var gameStop = function(){
    console.log("Game stop skipped");
}

// ---------------------------
// Patch the Main Menu Play button
// ---------------------------
// This assumes SceneMainMenu has a button called 'playButton'.
// Redirect it to SceneMain directly.

SceneMainMenu.prototype.create = function() {
    // Original menu code
    // ... (your asset loading, background, etc.)

    // Fix Play button
    if(this.playButton) {
        this.playButton.removeAllListeners();
        this.playButton.on('pointerdown', () => {
            this.scene.start("SceneMain", { down: 1, touchdown: false, yards_to_go: 100, tds: 0 });
        });
    }
};
