import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-database.js";

document.addEventListener('DOMContentLoaded', () => {

  // ------------------------
  // Game search / filter
  // ------------------------
  const searchInput = document.querySelector('.search input');
  const gameCards = Array.from(document.querySelectorAll('.game-card'));
  const searchResults = document.getElementById('search-results');

  const suggestButton = document.getElementById('suggestButton');
  const modal = document.getElementById('suggestionForm');
  const closeBtns = document.querySelectorAll('.modal .close');
  const sendBtn = document.getElementById('sendSuggestion');

  const webhookURL = "https://discord.com/api/webhooks/1415474812037628005/qPca1ARqtULY44_5dbar6dSSLiMvaKrVRchKjXPULxwJElh-M0U2zeogMrs34jv2OWuB";
  const reportWebhookURL = "https://discord.com/api/webhooks/1415474903880171632/FlXBps-LswodW8fRTjkx4VWHAs19CuUR3iuFm63FMa5pLay5uI8jPvxSRVVPRrlQHDAr";

  let currentFilter = 'all';
  const popularityAliases = { hot: ['hot','trending'], trending: ['hot','trending'] };

  function applyFilter(filter = currentFilter) {
    const f = (filter || 'all').toLowerCase();
    gameCards.forEach(card => {
      const genre = (card.getAttribute('data-genre') || '').toLowerCase();
      const popularity = (card.getAttribute('data-popularity') || '').toLowerCase();
      let show = f === 'all' || f === '' || f === genre || f === popularity || (popularityAliases[f] && popularityAliases[f].includes(popularity));
      card.style.display = show ? '' : 'none';
    });
  }

  function updateGames() {
    const searchTerm = (searchInput.value || '').trim().toLowerCase();
    searchResults.innerHTML = '';
    if (!searchTerm) { searchResults.style.display='none'; applyFilter(); return; }
    let found = 0;
    gameCards.forEach(card => {
      const name = (card.querySelector('h3')?.innerText || '').toLowerCase();
      if (name.includes(searchTerm)) {
        const clone = card.cloneNode(true);
        clone.addEventListener('click', () => {
          const link = clone.getAttribute('data-link');
          if (link) window.open(link,'_blank');
          else alert("This game doesn't have a link yet.");
        });
        searchResults.appendChild(clone);
        found++;
      }
      card.style.display = name.includes(searchTerm) ? '' : 'none';
    });
    searchResults.style.display = found>0 ? 'flex' : 'none';
  }

  if (searchInput) searchInput.addEventListener('input', updateGames);

  // ------------------------
  // Suggestion / report modals
  // ------------------------
  if (suggestButton && modal) suggestButton.addEventListener('click', () => modal.style.display='flex');
  closeBtns.forEach(btn => btn.addEventListener('click', () => btn.closest('.modal').style.display='none'));
  window.addEventListener('click', e => { if(e.target.classList?.contains('modal')) e.target.style.display='none'; });

  if (sendBtn) sendBtn.addEventListener('click', () => {
    const name = document.getElementById('gameName')?.value.trim();
    const details = document.getElementById('gameDetails')?.value.trim();
    if (!name) return alert('Please enter a game name.');
    fetch(webhookURL,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({content:`🎮 **New Game Suggestion**\n**Game:** ${name}\n**Details:** ${details||'(none)'}`})
    }).then(()=>{alert('Suggestion sent!'); modal.style.display='none';})
      .catch(err=>{console.error(err); alert('Failed to send suggestion.')});
  });

  const reportButton = document.getElementById('reportButton');
  const reportModal = document.getElementById('reportForm');
  const sendReportBtn = document.getElementById('sendReport');

  if (reportButton && reportModal) reportButton.addEventListener('click', () => reportModal.style.display='flex');
  if (sendReportBtn) sendReportBtn.addEventListener('click', () => {
    const title = document.getElementById('problemTitle')?.value.trim();
    const details = document.getElementById('problemDetails')?.value.trim();
    if (!title) return alert('Enter a problem title.');
    fetch(reportWebhookURL,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({content:`🚨 **Problem Reported**\n**Title:** ${title}\n**Details:** ${details||'(none)'}`})
    }).then(()=>{alert('Report sent!'); reportModal.style.display='none';})
      .catch(err=>{console.error(err); alert('Failed to send report.')});
  });

  // ------------------------
  // Navigation filter
  // ------------------------
  const navLinks = document.querySelectorAll('.site-nav a');
  const allSections = document.querySelectorAll('.games-section');
  navLinks.forEach(link => link.addEventListener('click', e => {
    e.preventDefault();
    navLinks.forEach(l=>l.classList.remove('active')); link.classList.add('active');
    const filter = (link.getAttribute('data-filter')||'all').toLowerCase();
    const unifiedContainer = document.getElementById('search-results');
    unifiedContainer.innerHTML='';
    if(filter==='all'){ unifiedContainer.style.display='none'; allSections.forEach(section=>section.style.display='block'); document.querySelectorAll('.game-card').forEach(card=>card.style.display=''); return; }
    allSections.forEach(section=>section.style.display='none'); unifiedContainer.style.display='flex';
    let found=0;
    document.querySelectorAll('.game-card').forEach(card=>{
      const genre = (card.getAttribute('data-genre')||'').toLowerCase();
      const popularity = (card.getAttribute('data-popularity')||'').toLowerCase();
      if(filter===genre||filter===popularity){ const clone=card.cloneNode(true); clone.addEventListener('click',()=>{const link=clone.getAttribute('data-link'); if(link) window.open(link,'_blank');}); unifiedContainer.appendChild(clone); found++; }
    });
    if(found===0) unifiedContainer.innerHTML='<p>No games found.</p>';
  }));

  // ------------------------
  // Horizontal scrolling
  // ------------------------
  document.querySelectorAll('.games-row').forEach(row => {
    const grid = row.querySelector('.games-grid');
    const leftBtn = row.querySelector('.scroll-btn.left');
    const rightBtn = row.querySelector('.scroll-btn.right');
    let scrollInterval; const scrollSpeed=500;
    const startScroll=(dir)=>{clearInterval(scrollInterval); scrollInterval=setInterval(()=>{grid.scrollLeft+=dir*scrollSpeed;},10);};
    const stopScroll=()=>clearInterval(scrollInterval);
    leftBtn.addEventListener('mousedown',()=>startScroll(-1));
    rightBtn.addEventListener('mousedown',()=>startScroll(1));
    leftBtn.addEventListener('mouseup',stopScroll); rightBtn.addEventListener('mouseup',stopScroll);
    leftBtn.addEventListener('mouseleave',stopScroll); rightBtn.addEventListener('mouseleave',stopScroll);
    leftBtn.addEventListener('touchstart',()=>startScroll(-1)); rightBtn.addEventListener('touchstart',()=>startScroll(1));
    leftBtn.addEventListener('touchend',stopScroll); rightBtn.addEventListener('touchend',stopScroll);
  });

  // ------------------------
  // Sidebar
  // ------------------------
  const sidebar = document.getElementById('siteSidebar');
  const toggle = document.getElementById('sidebarToggle');
  const closeBtn = document.getElementById('sidebarClose');
  const sbSuggest = document.getElementById('sbSuggest');
  const sbReport = document.getElementById('sbReport');
  if(sidebar && toggle){
    const openSidebar=()=>sidebar.setAttribute('aria-hidden','false');
    const closeSidebar=()=>sidebar.setAttribute('aria-hidden','true');
    toggle.addEventListener('click',openSidebar);
    closeBtn?.addEventListener('click',closeSidebar);
    document.addEventListener('click',e=>{if(!sidebar.contains(e.target)&&!toggle.contains(e.target)) closeSidebar();});
    sidebar.addEventListener('click',e=>e.stopPropagation());
    document.addEventListener('keydown',e=>{if(e.key==='Escape') closeSidebar();});
    sbSuggest?.addEventListener('click',e=>{e.preventDefault(); document.getElementById('suggestionForm').style.display='flex'; closeSidebar();});
    sbReport?.addEventListener('click',e=>{e.preventDefault(); document.getElementById('reportForm').style.display='flex'; closeSidebar();});
  }

  // ------------------------
  // Enforce horizontal grid
  // ------------------------
  document.querySelectorAll('.games-grid').forEach(g=>{
    g.style.display='flex'; g.style.flexWrap='nowrap'; g.style.overflowX='auto'; g.style.overflowY='hidden'; g.style.gap='15px';
    g.querySelectorAll('.game-card').forEach(c=>{c.style.flex='0 0 auto'; c.style.width='160px'; c.style.maxWidth='160px';});
  });

  applyFilter('all');

  // ------------------------
  // Firebase Shoutout Queue
  // ------------------------
  const firebaseConfig = {
    apiKey: "AIzaSyDyk5FAyCRyAn6ll5_nfSV5e16mvi1l-n4",
    authDomain: "mrsalt56-e6066.firebaseapp.com",
    databaseURL: "https://mrsalt56-e6066-default-rtdb.firebaseio.com",
    projectId: "mrsalt56-e6066",
    storageBucket: "mrsalt56-e6066.appspot.com",
    messagingSenderId: "716178119141",
    appId: "1:716178119141:web:2c39c7f79213699a38b70c",
    measurementId: "G-FZWFSV1K2D"
  };
  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);

  const submitBtn = document.getElementById("submitBtn");
  const userNameInput = document.getElementById("userName");
  const queueList = document.getElementById("queueList");
  const cooldownMsg = document.getElementById("cooldownMsg");
  const COOLDOWN = 60*1000;

  submitBtn.addEventListener("click",()=>{
    const name=userNameInput.value.trim();
    if(!name) return alert("Please enter your name.");
    const lastTime = localStorage.getItem("lastShoutout")||0;
    if(Date.now()-lastTime<COOLDOWN){cooldownMsg.textContent="Please wait before submitting again!"; return;}
    localStorage.setItem("lastShoutout",Date.now()); cooldownMsg.textContent="";
    push(ref(db,"shoutouts"),{name}); userNameInput.value="";
    fetch("https://discord.com/api/webhooks/1424618718499176601/6IfTXj3Tdl4FE2YUdrWIBDwOSabR61paQ3YhzCEMfVAK9SLVpXFAbyT7GpiFyCFsAInO",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({content:`📢 New shoutout request: **${name}**`})}).catch(console.error);
  });

  onValue(ref(db,"shoutouts"),snapshot=>{
    queueList.innerHTML="";
    snapshot.forEach(childSnap=>{
      const key=childSnap.key; const {name}=childSnap.val();
      const li=document.createElement("li"); li.textContent=name;
      const removeBtn=document.createElement("button"); removeBtn.textContent="Remove"; removeBtn.className="remove-btn";
      removeBtn.onclick=()=>{if(prompt("Enter admin password:")==="56") remove(ref(db,`shoutouts/${key}`));};
      li.appendChild(removeBtn); queueList.appendChild(li);
    });
  });

});
