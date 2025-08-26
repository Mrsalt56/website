// Simple local storage balance
const BALANCE_KEY = "mini_casino_balance_v1";
let balance = Number(localStorage.getItem(BALANCE_KEY) || 1000);
const $ = (sel) => document.querySelector(sel);

function setBalance(v){
  balance = Math.max(0, Math.round(v));
  localStorage.setItem(BALANCE_KEY, balance);
  $("#balance").textContent = balance.toString();
}
setBalance(balance);

// Tabs
document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b=>b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

// Reset
$("#reset").addEventListener("click", ()=>{
  if(confirm("Reset balance to $1000?")){
    setBalance(1000);
  }
});

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
  // quick spin animation
  for(let i=0;i<reelEls.length;i++){
    const el = reelEls[i];
    let t = 0;
    await new Promise(res=>{
      const start = performance.now();
      const tick = (now)=>{
        t = now - start;
        if(t < durations[i]){
          // show random symbol while spinning
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
$("#spin").addEventListener("click", async ()=>{
  if(spinning) return;
  const bet = Number($("#slotBet").value);
  if(balance < bet){
    slotMsg.textContent = "Not enough balance.";
    slotMsg.classList.add("error");
    return;
  }
  slotMsg.classList.remove("error");
  setBalance(balance - bet);
  spinning = true;
  const res = [spinOne(), spinOne(), spinOne()];
  await animateReels(res);
  const win = slotsPayout(...res, bet);
  if(win>0){
    setBalance(balance + win);
    slotMsg.textContent = `You won $${win}! (${res.join(" ")})`;
  }else{
    slotMsg.textContent = `No win. (${res.join(" ")})`;
  }
  spinning = false;
});

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
  dealerCards.innerHTML = "";
  playerCards.innerHTML = "";
  dealerScore.textContent = "Score: ?";
  playerScore.textContent = "Score: 0";
  bjMsg.textContent = "";
}

function setBJButtons({deal=true,hit=false,stand=false,double=false}){
  $("#deal").disabled = !deal;
  $("#hit").disabled = !hit;
  $("#stand").disabled = !stand;
  $("#double").disabled = !double;
}

function startRound(){
  resetBJUI();
  currentBet = Number($("#bjBet").value);
  if(balance < currentBet){
    bjMsg.textContent = "Not enough balance.";
    bjMsg.classList.add("error");
    return;
  }
  bjMsg.classList.remove("error");
  setBalance(balance - currentBet);

  deck = createDeck();
  player = [deck.pop(), deck.pop()];
  dealer = [deck.pop(), deck.pop()];

  // Render
  dealerCards.append(renderCard(dealer[0]));
  dealerCards.append(renderBack());
  playerCards.append(renderCard(player[0]));
  playerCards.append(renderCard(player[1]));

  playerScore.textContent = "Score: " + handValue(player);
  dealerScore.textContent = "Score: ?";

  bjActive = true;
  firstMove = true;
  setBJButtons({deal:false, hit:true, stand:true, double:true});

  // Instant blackjack checks
  const pVal = handValue(player);
  const dVal = handValue(dealer);
  const isBJ = (h)=> h.length===2 && handValue(h)===21;
  if(isBJ(player) || isBJ(dealer)){
    finishRound(true);
  }
}

function playerHit(){
  if(!bjActive) return;
  player.push(deck.pop());
  playerCards.append(renderCard(player[player.length-1]));
  playerScore.textContent = "Score: " + handValue(player);
  firstMove = false;
  $("#double").disabled = true;
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
    bjMsg.textContent = "Not enough balance to double.";
    bjMsg.classList.add("error");
    return;
  }
  bjMsg.classList.remove("error");
  setBalance(balance - currentBet);
  currentBet *= 2;
  // one hit, then stand
  playerHit();
  if(handValue(player) <= 21){
    playerStand();
  }
}

function dealerPlay(){
  // reveal dealer second card
  dealerCards.innerHTML = "";
  for(const c of dealer) dealerCards.append(renderCard(c));

  // dealer hits to 17 (soft 17 hits)
  while(handValue(dealer) < 17){
    dealer.push(deck.pop());
    dealerCards.append(renderCard(dealer[dealer.length-1]));
  }
  dealerScore.textContent = "Score: " + handValue(dealer);
}

function finishRound(immediate=false){
  setBJButtons({deal:true, hit:false, stand:false, double:false});
  bjActive = false;

  // reveal dealer if not already
  if(dealerCards.querySelectorAll(".card").length<dealer.length){
    dealerCards.innerHTML = "";
    for(const c of dealer) dealerCards.append(renderCard(c));
    dealerScore.textContent = "Score: " + handValue(dealer);
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
    bjMsg.classList.remove("error");
    bjMsg.textContent = `${msg} (+$${payout - currentBet})`;
  } else {
    bjMsg.classList.remove("error");
    bjMsg.textContent = msg;
  }
}

// Hook buttons
$("#deal").addEventListener("click", startRound);
$("#hit").addEventListener("click", playerHit);
$("#stand").addEventListener("click", playerStand);
$("#double").addEventListener("click", playerDouble);

// Initial UI
setBJButtons({deal:true,hit:false,stand:false,double:false});
