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
var activateEndzone = false;
var beastmode = false;
var beastmode_count = 0;
var beastmode_count_max = 0;
var beastmode_time = 150;
var beastmodeBar;
var beastmodeIcon;
var bonusLevel = 0;
var boostIcon;
var boostBar;
var boostCount = 100;
var boosting = false;
var buttonBoost;
var buttonSpin;
var emitter;
var emitterOn = false;
var emitterOnCount = 0;
var down = 1;
var field;
var firstPlay = false;
var instructions1;
var instructions2;
var instructions3;
var instructionsGo;
var instructionsCount = 0;
var invincible = false;
var level = 1;
var mobile = false;
var mobileUp = false;
var mobileDown = false;
var mobileLeft = false;
var mobileRight = false;
var moveX = 0;
var moveY = 0;
var muddyFactor = 0.5;
var musicLoaded = false;
var muted = 1;
var outOfBounds = false;
var particles;
var pickupCounter = 0;
var rank = 'Rookie';
var soundButton1;
var soundButton2;
var score = 10;
var speed = 200;
var speedChase = 100;
var speedBoost = 200;
var speedXEnemy = 50;
var speedOriginal = 200;
var spinCount = 3;
var spinIcon;
var spinning = false;
var stars = 0;
var stiffArmIcon;
var strength = 0;
var strengthIcon;
var tackled = false;
var touchdown = false;
var touchdownYards = 100;
var unlockedBonus1 = false;
var unlockedBonus2 = false;
var unlockedBonus3 = false;
var unlockedBonus4 = false;
var unlockedBonus5 = false;
var unlockedLevel1 = false;
var unlockedLevel2 = false;
var unlockedLevel3 = false;
var unlockedLevel4 = false;
var unlockedLevel5 = false;
var unlockedLevel6 = false;
var unlockedLevel7 = false;
var unlockedLevel8 = false;
var unlockedLevel9 = false;
var unlockedLevel10 = false;
var upgradeBeastmode = 0;
var upgradeBeastmodePrice = 1000;
var upgradeBlocker = 0;
var upgradeBlockerLeft = false;
var upgradeBlockerCenter = false;
var upgradeBlockerRight = false;
var upgradeBlockerPrice = 15000;
var upgradeContract = 0;
var upgradeContractPrice = 1000;
var upgradeSpeed = 0;
var upgradeSpeedPrice = 1000;
var upgradeSkills = 0;
var upgradeSkillsPrice = 1000;
var upgradeStrength = 0;
var upgradeStrengthPrice = 1000;
var yards = 0;
var yardsToGo = 100;
var yardsTotal = 0;

var game = new Phaser.Game(config);

/* 
// PokiSDK initialization removed to disable ads
PokiSDK.init().then(
    () => {
        console.log("PokiSDK initialized");
    }
).catch(
    () => {
        console.log("Adblock enabled");
        adBlocker = true;
    }
);
*/

console.log("not at www.glowmonkey.com");

var StartLoading = function () {
  console.log("Loading start skipped");
}

var LoadingComplete = function() {
  console.log("Loading complete skipped");
}

var startCommercialFirst = function(){
  console.log("Commercial skipped");
  muted = 0;
  game.scene.start("SceneGameOver",{ down: 1, touchdown: false, yards_to_go:100, tds:0 });
  game.scene.remove("SceneMainMenu");
}

var gameStart = function(){
  console.log("Game start skipped");
}

var gameStop = function(){
  console.log("Game stop skipped");
}
