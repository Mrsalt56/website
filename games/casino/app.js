
// Simple local storage balance
const BALANCE_KEY = "mini_casino_balance_v1";
let balance = Number(localStorage.getItem(BALANCE_KEY) || 1000);
const $ = (sel) => document.querySelector(sel);

function setBalance(v){
  balance = Math.max(0, Math.round(v));
  localStorage.setItem(BALANCE_KEY, balance);
  const balEl = $("#balance");
  if(balEl) balEl.textContent = balance.toString();
}
setBalance(balance);

// Tabs
document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b=>b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));
    btn.classList.add("active");
    const panel = document.getElementById(btn.dataset.tab);
    if(panel) panel.classList.add("active");
  });
});

// Reset with password
const resetBtn = $("#reset");
if(resetBtn){
  resetBtn.addEventListener("click", ()=>{
    const pass = prompt("Enter password to reset balance:");
    if(pass === "loser"){
      setBalance(1000);
      alert("Balance reset to $1000 ✅");
    } else if (pass !== null) {
      alert("❌ Wrong password. Balance not reset.");
    }
  });
}

/* -------------------- SLOTS -------------------- */
const symbols = ["🍒","🍋","🔔","7️⃣","⭐"];
const weights = [4,4,3,2,1]; // relative frequency; stars are rare
function spinOne(){
  const total = weights.reduce((a,b)=>a+b,0);
  const pick = Math.floor(Math.random()*total);
  let sum=0;
  for(let i=0;i<symbols.length;i++){
    sum+=weights[i];
    if(pick<sum) return symbols[i];
  }
  return symbols[0];
}

const reelEls = [$("#reel0"), $("#reel1"), $("#reel2")];
const slotMsg = $("#slotMsg");

function slotsPayout(a,b,c,bet){
  // Three of a kind multipliers
  const threeMult = { "⭐":50, "7️⃣":25, "🔔":10, "🍋":6, "🍒":4 };
  if(a===b && b===c){
    return bet * (threeMult[a] || 0);
  }
  // Any two matching → 2× bet
  if(a===b || a===c || b===c) return bet * 2;
  return 0;
}

async function animateReels(results){
  const durations = [900, 1200, 1500];
  for(let i=0;i<reelEls.length;i++){
    const el = reelEls[i];
    if(!el) continue;
    let t = 0;
    await new Promise(res=>{
      const start = performance.now();
      const tick = (now)=>{
        t = now - start;
        if(t < durations[i]){
          el.textContent = symbols[Math.floor(Math.random()*symbols.length)];
          requestAnimationFrame(tick);
        } else {
          el.textContent = results[i];
          res();
        }
      };
      requestAnimationFrame(tick);
    });
  }
}

let spinning=false;
const spinBtn = $("#spin");
if(spinBtn){
  spinBtn.addEventListener("click", async ()=>{
    if(spinning) return;
    const betSel = $("#slotBet");
    const bet = Number(betSel ? betSel.value : 5);
    if(balance < bet){
      if(slotMsg){slotMsg.textContent = "Not enough balance."; slotMsg.classList.add("error");}
      return;
    }
    if(slotMsg) slotMsg.classList.remove("error");
    setBalance(balance - bet);
    spinning = true;
    const res = [spinOne(), spinOne(), spinOne()];
    await animateReels(res);
    const win = slotsPayout(...res, bet);
    if(win>0){
      setBalance(balance + win);
      if(slotMsg) slotMsg.textContent = `You won $${win}! (${res.join(" ")})`;
    }else{
      if(slotMsg) slotMsg.textContent = `No win. (${res.join(" ")})`;
    }
    spinning = false;
  });
}

/* -------------------- BLACKJACK -------------------- */
const suits = ["♠","♥","♦","♣"];
const ranks = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

function createDeck(){
  const d=[];
  for(const s of suits){
    for(const r of ranks){
      d.push({r,s});
    }
  }
  for(let i=d.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [d[i],d[j]]=[d[j],d[i]];
  }
  return d;
}
function cardValue(r){
  if(r==="A") return 11;
  if(["K","Q","J"].includes(r)) return 10;
  return Number(r);
}
function handValue(hand){
  let total=0, aces=0;
  for(const c of hand){
    total += cardValue(c.r);
    if(c.r==="A") aces++;
  }
  // adjust aces from 11 to 1 as needed
  while(total>21 && aces>0){
    total -= 10;
    aces--;
  }
  return total;
}
function renderCard(c){
  const el = document.createElement("div");
  el.className = "card" + ((c.s==="♥"||c.s==="♦") ? " red" : "");
  el.textContent = `${c.r}${c.s}`;
  return el;
}
function renderBack(){
  const el = document.createElement("div");
  el.className = "card";
  el.textContent = "🂠";
  return el;
}

let deck=[], player=[], dealer=[], bjActive=false, firstMove=false, currentBet=0;

const bjMsg = $("#bjMsg");
const dealerCards = $("#dealerCards");
const playerCards = $("#playerCards");
const dealerScore = $("#dealerScore");
const playerScore = $("#playerScore");

function resetBJUI(){
  if(!dealerCards||!playerCards) return;
  dealerCards.innerHTML = "";
  playerCards.innerHTML = "";
  if(dealerScore) dealerScore.textContent = "Score: ?";
  if(playerScore) playerScore.textContent = "Score: 0";
  if(bjMsg) bjMsg.textContent = "";
}

function setBJButtons({deal=true,hit=false,stand=false,double=false}){
  const d=$("#deal"), h=$("#hit"), s=$("#stand"), dbl=$("#double");
  if(d) d.disabled = !deal;
  if(h) h.disabled = !hit;
  if(s) s.disabled = !stand;
  if(dbl) dbl.disabled = !double;
}

function startRound(){
  resetBJUI();
  const betSel = $("#bjBet");
  currentBet = Number(betSel ? betSel.value : 5);
  if(balance < currentBet){
    if(bjMsg){bjMsg.textContent = "Not enough balance."; bjMsg.classList.add("error");}
    return;
  }
  if(bjMsg) bjMsg.classList.remove("error");
  setBalance(balance - currentBet);

  deck = createDeck();
  player = [deck.pop(), deck.pop()];
  dealer = [deck.pop(), deck.pop()];

  // Render
  if(dealerCards){
    dealerCards.append(renderCard(dealer[0]));
    dealerCards.append(renderBack());
  }
  if(playerCards){
    playerCards.append(renderCard(player[0]));
    playerCards.append(renderCard(player[1]));
  }

  if(playerScore) playerScore.textContent = "Score: " + handValue(player);
  if(dealerScore) dealerScore.textContent = "Score: ?";

  bjActive = true;
  firstMove = true;
  setBJButtons({deal:false, hit:true, stand:true, double:true});

  const isBJ = (h)=> h.length===2 && handValue(h)===21;
  if(isBJ(player) || isBJ(dealer)){
    finishRound(true);
  }
}

function playerHit(){
  if(!bjActive) return;
  player.push(deck.pop());
  if(playerCards) playerCards.append(renderCard(player[player.length-1]));
  if(playerScore) playerScore.textContent = "Score: " + handValue(player);
  firstMove = false;
  const dbl=$("#double"); if(dbl) dbl.disabled = true;
  if(handValue(player) > 21){
    finishRound();
  }
}

function playerStand(){
  if(!bjActive) return;
  dealerPlay();
  finishRound();
}

function playerDouble(){
  if(!bjActive || !firstMove) return;
  if(balance < currentBet){
    if(bjMsg){bjMsg.textContent = "Not enough balance to double."; bjMsg.classList.add("error");}
    return;
  }
  if(bjMsg) bjMsg.classList.remove("error");
  setBalance(balance - currentBet);
  currentBet *= 2;
  playerHit();
  if(handValue(player) <= 21){
    playerStand();
  }
}

function dealerPlay(){
  if(!dealerCards) return;
  dealerCards.innerHTML = "";
  for(const c of dealer) dealerCards.append(renderCard(c));

  while(handValue(dealer) < 17){
    dealer.push(deck.pop());
    dealerCards.append(renderCard(dealer[dealer.length-1]));
  }
  if(dealerScore) dealerScore.textContent = "Score: " + handValue(dealer);
}

function finishRound(immediate=false){
  setBJButtons({deal:true, hit:false, stand:false, double:false});
  bjActive = false;

  if(dealerCards && dealerCards.querySelectorAll(".card").length<dealer.length){
    dealerCards.innerHTML = "";
    for(const c of dealer) dealerCards.append(renderCard(c));
    if(dealerScore) dealerScore.textContent = "Score: " + handValue(dealer);
  }

  const p = handValue(player);
  const d = handValue(dealer);
  const isBJ = (h)=> h.length===2 && handValue(h)===21;

  let msg = "";
  let payout = 0;

  if(p>21){
    msg = "You bust. Dealer wins.";
  } else if(d>21){
    msg = "Dealer busts! You win.";
    payout = currentBet * 2;
  } else if(immediate && isBJ(player) && isBJ(dealer)){
    msg = "Push. Both have blackjack.";
    payout = currentBet;
  } else if(immediate && isBJ(player)){
    msg = "Blackjack! You win 3:2";
    payout = Math.floor(currentBet * 2.5);
  } else if(p>d){
    msg = "You win!";
    payout = currentBet * 2;
  } else if(p<d){
    msg = "Dealer wins.";
  } else {
    msg = "Push.";
    payout = currentBet;
  }

  if(payout>0){
    setBalance(balance + payout);
    if(bjMsg){ bjMsg.classList.remove("error"); bjMsg.textContent = `${msg} (+$${payout - currentBet})`; }
  } else {
    if(bjMsg){ bjMsg.classList.remove("error"); bjMsg.textContent = msg; }
  }
}

// Hook BJ buttons
const dBtn=$("#deal"), hBtn=$("#hit"), sBtn=$("#stand"), dblBtn=$("#double");
if(dBtn) dBtn.addEventListener("click", startRound);
if(hBtn) hBtn.addEventListener("click", playerHit);
if(sBtn) sBtn.addEventListener("click", playerStand);
if(dblBtn) dblBtn.addEventListener("click", playerDouble);

/* -------------------- WHEEL -------------------- */
const wheelPrizes = [
  {emoji:"❌", amount:0, weight:50},
  {emoji:"💵", amount:100, weight:25},
  {emoji:"💰", amount:250, weight:15},
  {emoji:"💎", amount:500, weight:7},
  {emoji:"⭐", amount:1000, weight:3}
];

const WHEEL_COST = 250;
const FREE_SPIN_KEY = "mini_casino_free_wheel";
const FREE_INTERVAL = 60*60*1000; // 1 hour

const wheelDisplay = $("#wheelDisplay");
const wheelMsg = $("#wheelMsg");
const spinWheelBtn = $("#spinWheel");
const freeWheelBtn = $("#freeWheel");

function updateFreeWheel(){
  if(!freeWheelBtn) return;
  const last = Number(localStorage.getItem(FREE_SPIN_KEY) || 0);
  const now = Date.now();
  if(now - last >= FREE_INTERVAL){
    freeWheelBtn.disabled = false;
    freeWheelBtn.textContent = "Free Spin Ready!";
  }else{
    freeWheelBtn.disabled = true;
    const remain = Math.ceil((FREE_INTERVAL - (now-last))/60000);
    freeWheelBtn.textContent = `Free in ${remain}m`;
  }
}
setInterval(updateFreeWheel, 10000);
updateFreeWheel();

function weightedPick(items){
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let r = Math.random() * total;
  for(const item of items){
    if(r < item.weight) return item;
    r -= item.weight;
  }
  return items[0];
}

async function doWheelSpin(free=false){
  if(!wheelMsg || !wheelDisplay) return;
  if(!free && balance < WHEEL_COST){
    wheelMsg.textContent = "Not enough balance for $250 spin.";
    wheelMsg.classList.add("error");
    return;
  }
  wheelMsg.classList.remove("error");
  if(!free) setBalance(balance - WHEEL_COST);

  const prize = weightedPick(wheelPrizes);

  const spinSymbols = wheelPrizes.map(p=>p.emoji);
  let i = 0;
  let duration = 2500;
  let interval = 80;
  const start = Date.now();

  return new Promise(resolve=>{
    const tick = ()=>{
      wheelDisplay.textContent = spinSymbols[i % spinSymbols.length];
      i++;
      const elapsed = Date.now() - start;
      if(elapsed < duration){
        interval = 80 + Math.floor((elapsed / duration) * 300);
        setTimeout(tick, interval);
      }else{
        wheelDisplay.textContent = prize.emoji;
        if(prize.amount > 0){
          setBalance(balance + prize.amount);
          wheelMsg.textContent = `You won $${prize.amount}!`;
        }else{
          wheelMsg.textContent = `No prize. Try again!`;
        }

        if(free){
          localStorage.setItem(FREE_SPIN_KEY, Date.now());
          updateFreeWheel();
        }
        resolve();
      }
    };
    tick();
  });
}

if(spinWheelBtn) spinWheelBtn.addEventListener("click", ()=>doWheelSpin(false));
if(freeWheelBtn) freeWheelBtn.addEventListener("click", ()=>doWheelSpin(true));

/* -------------------- COIN FLIP -------------------- */
const coinMsg = $("#coinMsg");
const coinShow = $("#coinShow");
function playCoinFlip(pick){
  const bet = Number($("#coinBet")?.value || 5);
  if(balance < bet){
    if(coinMsg){ coinMsg.textContent = "Not enough balance."; coinMsg.classList.add("error"); }
    return;
  }
  if(coinMsg) coinMsg.classList.remove("error");
  setBalance(balance - bet);

  // simple "flip" animation
  let flips=0;
  const faces = ["Heads","Tails"];
  const anim = setInterval(()=>{
    if(coinShow) coinShow.textContent = faces[flips%2]==="Heads" ? "🙂" : "🦅";
    flips++;
    if(flips>12){
      clearInterval(anim);
      const result = Math.random() < 0.5 ? "Heads" : "Tails";
      if(coinShow) coinShow.textContent = result==="Heads" ? "🙂" : "🦅";
      if(result===pick){
        setBalance(balance + bet*2);
        if(coinMsg) coinMsg.textContent = `🪙 ${result}! You win $${bet}.`;
      }else{
        if(coinMsg) coinMsg.textContent = `🪙 ${result}. You lose.`;
      }
    }
  }, 80);
}
const headsBtn=$("#pickHeads"), tailsBtn=$("#pickTails");
if(headsBtn) headsBtn.addEventListener("click", ()=>playCoinFlip("Heads"));
if(tailsBtn) tailsBtn.addEventListener("click", ()=>playCoinFlip("Tails"));

/* -------------------- DICE / CRAPS (Pass Line simplified) -------------------- */
let crapsPoint = 0;
const crapsMsg = $("#crapsMsg");
const crapsPointEl = $("#crapsPoint");
const die1 = $("#die1"), die2 = $("#die2");
function rollDie(){ return 1 + Math.floor(Math.random()*6); }
function updateDice(a,b){
  const faces = ["⚀","⚁","⚂","⚃","⚄","⚅"];
  if(die1) die1.textContent = faces[a-1];
  if(die2) die2.textContent = faces[b-1];
}

function crapsRoll(){
  const bet = Number($("#crapsBet")?.value || 5);
  if(crapsPoint===0){
    if(balance < bet){
      if(crapsMsg){crapsMsg.textContent="Not enough balance."; crapsMsg.classList.add("error");}
      return;
    }
    if(crapsMsg) crapsMsg.classList.remove("error");
    setBalance(balance - bet);
  }
  const a = rollDie(), b = rollDie();
  updateDice(a,b);
  const total = a+b;

  if(crapsPoint===0){
    if(total===7 || total===11){
      // win
      setBalance(balance + bet*2);
      if(crapsMsg) crapsMsg.textContent = `Come-out ${total}! You win $${bet}.`;
    }else if([2,3,12].includes(total)){
      if(crapsMsg) crapsMsg.textContent = `Craps ${total}. You lose.`;
    }else{
      crapsPoint = total;
      if(crapsPointEl) crapsPointEl.textContent = String(crapsPoint);
      if(crapsMsg) crapsMsg.textContent = `Point set to ${crapsPoint}. Roll again…`;
      return;
    }
  }else{
    if(total===crapsPoint){
      setBalance(balance + bet*2);
      if(crapsMsg) crapsMsg.textContent = `Hit the point ${crapsPoint}! You win $${bet}.`;
      crapsPoint = 0;
      if(crapsPointEl) crapsPointEl.textContent = "–";
    }else if(total===7){
      if(crapsMsg) crapsMsg.textContent = `Seven out. You lose.`;
      crapsPoint = 0;
      if(crapsPointEl) crapsPointEl.textContent = "–";
    }else{
      if(crapsMsg) crapsMsg.textContent = `Rolled ${total}. Keep going…`;
      return;
    }
  }
}
const crapsRollBtn = $("#crapsRoll");
const crapsResetBtn = $("#crapsReset");
if(crapsRollBtn) crapsRollBtn.addEventListener("click", crapsRoll);
if(crapsResetBtn) crapsResetBtn.addEventListener("click", ()=>{
  crapsPoint=0;
  if(crapsPointEl) crapsPointEl.textContent = "–";
  if(crapsMsg) crapsMsg.textContent = "Round reset.";
});

/* -------------------- HIGHER / LOWER -------------------- */
let hiloA = 0, hiloActive=false, hiloBet=5;
const hiloMsg = $("#hiloMsg");
const hiloCardA = $("#hiloCardA");
const hiloCardB = $("#hiloCardB");
function drawCardNum(){ return 1 + Math.floor(Math.random()*13); }
function labelCard(n){
  return ["A","2","3","4","5","6","7","8","9","10","J","Q","K"][n-1];
}
function hiloNew(){
  hiloBet = Number($("#hiloBet")?.value || 5);
  if(balance < hiloBet){
    if(hiloMsg){hiloMsg.textContent="Not enough balance."; hiloMsg.classList.add("error");}
    return;
  }
  if(hiloMsg) {hiloMsg.classList.remove("error"); hiloMsg.textContent="Guess higher or lower!";}
  setBalance(balance - hiloBet);
  hiloA = drawCardNum();
  hiloActive=true;
  if(hiloCardA) hiloCardA.textContent = labelCard(hiloA);
  if(hiloCardB) hiloCardB.textContent = "?";
  $("#guessHigher").disabled=false;
  $("#guessLower").disabled=false;
}
function hiloGuess(dir){
  if(!hiloActive) return;
  const b = drawCardNum();
  if(hiloCardB) hiloCardB.textContent = labelCard(b);
  $("#guessHigher").disabled=true;
  $("#guessLower").disabled=true;
  hiloActive=false;
  if((dir==="higher" && b>hiloA) || (dir==="lower" && b<hiloA)){
    setBalance(balance + hiloBet*2);
    if(hiloMsg) hiloMsg.textContent = `Correct! You win $${hiloBet}.`;
  }else if(b===hiloA){
    setBalance(balance + hiloBet); // push
    if(hiloMsg) hiloMsg.textContent = `Tie. Push.`;
  }else{
    if(hiloMsg) hiloMsg.textContent = `Wrong guess. You lose.`;
  }
}
const hiloNewBtn=$("#hiloNew"), hiloHighBtn=$("#guessHigher"), hiloLowBtn=$("#guessLower");
if(hiloNewBtn) hiloNewBtn.addEventListener("click", hiloNew);
if(hiloHighBtn) hiloHighBtn.addEventListener("click", ()=>hiloGuess("higher"));
if(hiloLowBtn) hiloLowBtn.addEventListener("click", ()=>hiloGuess("lower"));

/* -------------------- CRASH -------------------- */
let crashTimer=null, crashRunning=false, crashStartBet=0, crashCurrent=1.00, crashCrashAt=0;
const crashMult = $("#crashMult");
const crashMsg = $("#crashMsg");
function drawCrashPoint(){
  // Provably-fair-ish: crash point following 1/(1-r) with cap
  const r = Math.random();
  return Math.max(1.0, Math.min(100, 1/(1-r)));
}
function crashStart(){
  if(crashRunning) return;
  crashStartBet = Number($("#crashBet")?.value || 5);
  if(balance < crashStartBet){
    if(crashMsg){crashMsg.textContent="Not enough balance."; crashMsg.classList.add("error");}
    return;
  }
  if(crashMsg) crashMsg.classList.remove("error");
  setBalance(balance - crashStartBet);
  crashCurrent = 1.00;
  crashCrashAt = drawCrashPoint();
  crashRunning = true;
  $("#crashCashout").disabled = false;
  if(crashMult) crashMult.textContent = crashCurrent.toFixed(2) + "×";
  if(crashMsg) crashMsg.textContent = "Rising…";
  crashTimer = setInterval(()=>{
    crashCurrent *= 1.015; // growth rate
    if(crashMult) crashMult.textContent = crashCurrent.toFixed(2) + "×";
    if(crashCurrent >= crashCrashAt){
      clearInterval(crashTimer);
      crashTimer=null; crashRunning=false;
      $("#crashCashout").disabled = true;
      if(crashMsg) crashMsg.textContent = "💥 Crashed at " + crashCrashAt.toFixed(2) + "×. You lose.";
    }
  }, 100);
}
function crashCashout(){
  if(!crashRunning) return;
  clearInterval(crashTimer); crashTimer=null; crashRunning=false;
  $("#crashCashout").disabled = true;
  const win = Math.floor(crashStartBet * crashCurrent);
  setBalance(balance + win);
  if(crashMsg) crashMsg.textContent = `✅ Cashed out at ${crashCurrent.toFixed(2)}× for $${win}.`;
}
const crashStartBtn=$("#crashStart"), crashCashBtn=$("#crashCashout");
if(crashStartBtn) crashStartBtn.addEventListener("click", crashStart);
if(crashCashBtn) crashCashBtn.addEventListener("click", crashCashout);

/* -------------------- PLINKO -------------------- */
const plinkoBoard = $("#plinkoBoard");
const plinkoMsg = $("#plinkoMsg");
function plinkoMultipliers(rows, risk){
  // bucket multipliers from edges to center (symmetric)
  const base = {
    low:  [0.5,0.7,0.9,1,1.2,1.5,2,3,5],
    med:  [0.3,0.6,0.8,1,1.5,2,3,5,10],
    high: [0.2,0.4,0.7,1,2,4,6,10,20]
  }[risk];
  // scale to number of bins = rows+1
  const bins = rows+1;
  const out = new Array(bins).fill(1);
  for(let i=0;i<bins;i++){
    const t = i/(bins-1); // 0..1 position
    const idx = Math.round(t*(base.length-1));
    out[i] = base[idx];
  }
  return out;
}
function plinkoDrop(){
  const bet = Number($("#plinkoBet")?.value || 5);
  const rows = Number($("#plinkoRows")?.value || 10);
  const risk = ($("#plinkoRisk")?.value || "med");
  if(balance < bet){
    if(plinkoMsg){plinkoMsg.textContent="Not enough balance."; plinkoMsg.classList.add("error");}
    return;
  }
  if(plinkoMsg) {plinkoMsg.classList.remove("error"); plinkoMsg.textContent="Dropping…";}
  setBalance(balance - bet);

  // simulate path: start center, at each row random left/right
  const cols = rows+1;
  let col = Math.floor(cols/2);
  const path = [col];
  for(let r=0;r<rows;r++){
    col += (Math.random()<0.5 ? -1 : 1);
    col = Math.max(0, Math.min(cols-1, col));
    path.push(col);
  }

  // render board
  if(plinkoBoard){
    plinkoBoard.innerHTML = "";
    for(let r=0;r<rows;r++){
      const row = document.createElement("div");
      row.className = "plinko-row";
      for(let c=0;c<cols;c++){
        const peg = document.createElement("div");
        peg.className = "plinko-peg";
        if(path[r]===c) peg.classList.add("active");
        row.appendChild(peg);
      }
      plinkoBoard.appendChild(row);
    }
  }

  const mults = plinkoMultipliers(rows, risk);
  const hit = path[path.length-1];
  const win = Math.floor(bet * mults[hit]);
  if(win>0){
    setBalance(balance + win);
    if(plinkoMsg) plinkoMsg.textContent = `Ball landed in slot ${hit+1}/${cols} → ${mults[hit]}×. You won $${win}.`;
  }else{
    if(plinkoMsg) plinkoMsg.textContent = `Ball landed in slot ${hit+1}/${cols}. No payout.`;
  }
}
const plinkoBtn=$("#plinkoDrop");
if(plinkoBtn) plinkoBtn.addEventListener("click", plinkoDrop);

/* -------------------- MINES -------------------- */
let minesBoard=[], minesRevealed=0, minesActive=false, minesBet=0, minesSafe=0, minesTotal=5;
const minesGrid = $("#minesGrid");
const minesMsg = $("#minesMsg");
function minesMultiplier(){
  // simple scaling: more safe reveals -> higher multiplier; more mines -> higher rate
  const base = 1 + (minesRevealed * (0.1 + minesTotal*0.02));
  return Math.max(1, Math.min(10, base));
}
function minesNew(){
  minesBet = Number($("#minesBet")?.value || 5);
  minesTotal = Number($("#minesCount")?.value || 5);
  if(balance < minesBet){
    if(minesMsg){minesMsg.textContent="Not enough balance."; minesMsg.classList.add("error");}
    return;
  }
  if(minesMsg) {minesMsg.classList.remove("error"); minesMsg.textContent="Pick safe tiles. 💣 ends the round.";}
  setBalance(balance - minesBet);
  minesRevealed=0; minesActive=true; minesSafe=25 - minesTotal;
  minesBoard = new Array(25).fill(0);
  // plant mines
  let planted=0;
  while(planted<minesTotal){
    const i = Math.floor(Math.random()*25);
    if(minesBoard[i]===0){ minesBoard[i]=1; planted++; }
  }
  // build grid
  if(minesGrid){
    minesGrid.innerHTML = "";
    for(let i=0;i<25;i++){
      const tile = document.createElement("button");
      tile.className = "mine-tile";
      tile.dataset.idx = String(i);
      tile.textContent = "❓";
      tile.addEventListener("click", ()=>minesReveal(i, tile));
      minesGrid.appendChild(tile);
    }
  }
  $("#minesCashout").disabled=false;
}
function minesReveal(i, el){
  if(!minesActive || !el) return;
  if(el.classList.contains("revealed")) return;
  if(minesBoard[i]===1){
    el.textContent="💣"; el.classList.add("revealed","bomb");
    minesActive=false;
    $("#minesCashout").disabled=true;
    if(minesMsg) minesMsg.textContent = "Boom! You lose the bet.";
    // reveal all bombs
    if(minesGrid){
      [...minesGrid.children].forEach((c,idx)=>{
        if(minesBoard[idx]===1){ c.textContent="💣"; c.classList.add("revealed","bomb"); }
      });
    }
    return;
  }else{
    el.textContent="✅";
    el.classList.add("revealed","safe");
    minesRevealed++;
    if(minesRevealed===minesSafe){
      // cleared all safes -> auto cashout full multiplier
      const mult = minesMultiplier();
      const win = Math.floor(minesBet * mult);
      setBalance(balance + win);
      minesActive=false; $("#minesCashout").disabled=true;
      if(minesMsg) minesMsg.textContent = `Cleared all safes! ${mult.toFixed(2)}× → $${win}.`;
    }else{
      if(minesMsg) minesMsg.textContent = `Safe! Current multiplier: ${minesMultiplier().toFixed(2)}×`;
    }
  }
}
function minesCashout(){
  if(!minesActive) return;
  const mult = minesMultiplier();
  const win = Math.floor(minesBet * mult);
  setBalance(balance + win);
  minesActive=false;
  $("#minesCashout").disabled=true;
  if(minesMsg) minesMsg.textContent = `Cash out ${mult.toFixed(2)}× → $${win}.`;
  // reveal bombs to end
  if(minesGrid){
    [...minesGrid.children].forEach((c,idx)=>{
      if(minesBoard[idx]===1){ c.textContent="💣"; c.classList.add("revealed","bomb"); }
    });
  }
}
const minesNewBtn=$("#minesNew"), minesCashBtn=$("#minesCashout");
if(minesNewBtn) minesNewBtn.addEventListener("click", minesNew);
if(minesCashBtn) minesCashBtn.addEventListener("click", minesCashout);

/* -------------------- POKER (High Card) -------------------- */
const pokerMsg = $("#pokerMsg");
const pokerDealer = $("#pokerDealer");
const pokerPlayer = $("#pokerPlayer");
function pokerDeal(){
  const bet = Number($("#pokerBet")?.value || 5);
  if(balance < bet){
    if(pokerMsg){pokerMsg.textContent="Not enough balance."; pokerMsg.classList.add("error");}
    return;
  }
  if(pokerMsg) pokerMsg.classList.remove("error");
  setBalance(balance - bet);
  const d = createDeck();
  const pc = d.pop();
  const dc = d.pop();
  if(pokerPlayer){ pokerPlayer.innerHTML=""; pokerPlayer.append(renderCard(pc)); }
  if(pokerDealer){ pokerDealer.innerHTML=""; pokerDealer.append(renderCard(dc)); }

  const pv = cardValue(pc.r);
  const dv = cardValue(dc.r);
  if(pv>dv){
    setBalance(balance + bet*2);
    if(pokerMsg) pokerMsg.textContent = "You win! (+$"+bet+")";
  }else if(pv<dv){
    if(pokerMsg) pokerMsg.textContent = "Dealer wins.";
  }else{
    setBalance(balance + bet);
    if(pokerMsg) pokerMsg.textContent = "Push.";
  }
}
const pokerDealBtn=$("#pokerDeal");
if(pokerDealBtn) pokerDealBtn.addEventListener("click", pokerDeal);

/* -------------------- SCRATCH CARD -------------------- */
const scratchMsg = $("#scratchMsg");
const scratchGrid = $("#scratchGrid");
function scratchBuy(){
  const cost = 10;
  if(balance < cost){
    if(scratchMsg){scratchMsg.textContent="Not enough balance for a ticket."; scratchMsg.classList.add("error");}
    return;
  }
  if(scratchMsg) scratchMsg.classList.remove("error");
  setBalance(balance - cost);
  // Build 3x3 grid with weighted symbols
  const prizes = [
    {emoji:"❌", amount:0, weight:50},
    {emoji:"💵", amount:20, weight:28},
    {emoji:"💰", amount:50, weight:15},
    {emoji:"💎", amount:100, weight:6},
    {emoji:"⭐", amount:250, weight:1}
  ];
  const bag = [];
  for(const p of prizes){ for(let i=0;i<p.weight;i++) bag.push(p); }
  const cells = [];
  for(let i=0;i<9;i++){
    cells.push(bag[Math.floor(Math.random()*bag.length)]);
  }
  if(scratchGrid){
    scratchGrid.innerHTML="";
    cells.forEach((cell,idx)=>{
      const b = document.createElement("button");
      b.className="scratch-cell";
      b.textContent="🧧";
      b.dataset.idx = String(idx);
      b.addEventListener("click", ()=>{
        if(b.classList.contains("revealed")) return;
        b.classList.add("revealed");
        b.textContent = cell.emoji;
      });
      scratchGrid.appendChild(b);
    });
  }
  // Check best triplet (match 3)
  const counts = {};
  cells.forEach(c=>{ counts[c.emoji]=(counts[c.emoji]||0)+1; });
  let best=null;
  for(const p of prizes){
    if((counts[p.emoji]||0)>=3) { best = p; break; }
  }
  if(best && best.amount>0){
    setTimeout(()=>{
      setBalance(balance + best.amount);
      if(scratchMsg) scratchMsg.textContent = `You matched 3 ${best.emoji}! Win $${best.amount}.`;
    }, 300);
  }else{
    if(scratchMsg) scratchMsg.textContent = "No three-of-a-kind. Better luck next time.";
  }
}
const scratchBtn=$("#scratchBuy");
if(scratchBtn) scratchBtn.addEventListener("click", scratchBuy);

// Initial UI for BJ
setBJButtons({deal:true,hit:false,stand:false,double:false});


/* -------------------- ROULETTE -------------------- */
const rouletteBoard=$("#rouletteBoard");
const rouletteMsg=$("#rouletteMsg");
const rouletteColors=["green"].concat(Array(18).fill("red"),Array(18).fill("black")); // 37 numbers

function buildRoulette(){
  if(!rouletteBoard) return;
  rouletteBoard.innerHTML="";
  for(let i=0;i<37;i++){
    const cell=document.createElement("div");
    cell.className="roulette-cell "+rouletteColors[i];
    cell.textContent=i;
    cell.addEventListener("click",()=>{
      document.querySelectorAll(".roulette-cell").forEach(c=>c.classList.remove("active"));
      cell.classList.add("active");
      rouletteBoard.dataset.pick=i;
    });
    rouletteBoard.appendChild(cell);
  }
}
buildRoulette();

const rouletteSpinBtn=$("#rouletteSpin");
if(rouletteSpinBtn) rouletteSpinBtn.addEventListener("click",()=>{
  const bet=Number($("#rouletteBet")?.value||5);
  if(balance<bet){
    if(rouletteMsg){rouletteMsg.textContent="Not enough balance"; rouletteMsg.classList.add("error");}
    return;
  }
  if(rouletteMsg) rouletteMsg.classList.remove("error");
  setBalance(balance-bet);
  const pick=Number(rouletteBoard?.dataset.pick||-1);
  const result=Math.floor(Math.random()*37);
  const winColor=rouletteColors[result];
  let payout=0;
  if(pick===result){payout=bet*35;}
  if(pick===-1){ if(rouletteMsg){rouletteMsg.textContent="Pick a number!";} setBalance(balance+bet); return;}
  if(payout>0){
    setBalance(balance+payout);
    if(rouletteMsg) rouletteMsg.textContent=`Result ${result} (${winColor}). You win $${payout}!`;
  }else{
    if(rouletteMsg) rouletteMsg.textContent=`Result ${result} (${winColor}). You lose.`;
  }
});
