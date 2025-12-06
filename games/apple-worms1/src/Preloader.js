// ================================
// Preloader.js (Simple & Correct)
// ================================

var canvas, stage, exportRoot;
var loader;

// Make sure Preferences exists
var Preferences = Preferences || {};

// MAIN ENTRY
function init() {
    canvas = document.getElementById("canvas");

    // step 1: load XML first
    loadLevelsXML().then(function() {
        // step 2: preload assets
        loadGameAssets();
    }).catch(function() {
        // fallback if xml fails
        loadGameAssets();
    });
}

// -----------------------------
// Load external levels.xml
// -----------------------------
function loadLevelsXML() {
    return fetch("src/levels.xml")
        .then(function(res) { return res.text(); })
        .then(function(text) {
            Preferences.xmlText = text;
            console.log("XML loaded, length:", text.length);
        });
}

// -----------------------------
// Load CreateJS assets
// -----------------------------
function loadGameAssets() {
    images = images || {};
    ss = ss || {};

    loader = new createjs.LoadQueue(false);

    loader.on("fileload", function(evt) {
        if (evt.item.type === "image") {
            images[evt.item.id] = evt.result;
        }
    });

    loader.on("complete", function(evt) {
        startGame(evt);
    });

    loader.loadManifest(lib.properties.manifest);
}

// -----------------------------
// Start Game
// -----------------------------
function startGame(evt) {
    // load sprite sheets
    for (var i = 0; i < lib.ssMetadata.length; i++) {
        var ssName = lib.ssMetadata[i].name;
        ss[ssName] = loader.getResult(ssName);
    }

    // IMPORTANT: correct main class
    exportRoot = new lib.CoolmathGames800x600Optimized();

    stage = new createjs.Stage(canvas);
    stage.addChild(exportRoot);

    createjs.Touch.enable(stage);
    stage.enableMouseOver();

    createjs.Ticker.framerate = lib.properties.fps;
    createjs.Ticker.on("tick", stage);

    makeResponsive();
}

// -----------------------------
// Responsive canvas support
// -----------------------------
function makeResponsive() {
    var w = lib.properties.width;
    var h = lib.properties.height;
    var sRatio = 1;

    function resize() {
        var iw = window.innerWidth;
        var ih = window.innerHeight;
        var xRatio = iw / w;
        var yRatio = ih / h;

        sRatio = Math.min(xRatio, yRatio);

        canvas.width = w * sRatio;
        canvas.height = h * sRatio;
        canvas.style.width = canvas.width + "px";
        canvas.style.height = canvas.height + "px";
        stage.scaleX = stage.scaleY = sRatio;
    }

    window.addEventListener("resize", resize);
    resize();
}
