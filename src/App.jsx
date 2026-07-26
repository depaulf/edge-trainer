import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const SUITS=['♠','♥','♦','♣'];
const RANKS=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
function cardValue(r){if(r==='A')return 11;if(['J','Q','K'].includes(r))return 10;return parseInt(r);}
function hiLoValue(r){if(['2','3','4','5','6'].includes(r))return 1;if(['10','J','Q','K','A'].includes(r))return -1;return 0;}
function randomCard(){const r=RANKS[Math.floor(Math.random()*RANKS.length)],s=SUITS[Math.floor(Math.random()*SUITS.length)];return{rank:r,suit:s,red:s==='♥'||s==='♦'};}
function handTotal(cards){let s=0,a=0;cards.forEach(c=>{if(c.rank==='A'){s+=11;a++;}else s+=cardValue(c.rank);});while(s>21&&a>0){s-=10;a--;}return s;}

const HARD={5:{2:'H',3:'H',4:'H',5:'H',6:'H',7:'H',8:'H',9:'H',10:'H',11:'H'},6:{2:'H',3:'H',4:'H',5:'H',6:'H',7:'H',8:'H',9:'H',10:'H',11:'H'},7:{2:'H',3:'H',4:'H',5:'H',6:'H',7:'H',8:'H',9:'H',10:'H',11:'H'},8:{2:'H',3:'H',4:'H',5:'H',6:'H',7:'H',8:'H',9:'H',10:'H',11:'H'},9:{2:'H',3:'D',4:'D',5:'D',6:'D',7:'H',8:'H',9:'H',10:'H',11:'H'},10:{2:'D',3:'D',4:'D',5:'D',6:'D',7:'D',8:'D',9:'D',10:'H',11:'H'},11:{2:'D',3:'D',4:'D',5:'D',6:'D',7:'D',8:'D',9:'D',10:'D',11:'D'},12:{2:'H',3:'H',4:'S',5:'S',6:'S',7:'H',8:'H',9:'H',10:'H',11:'H'},13:{2:'S',3:'S',4:'S',5:'S',6:'S',7:'H',8:'H',9:'H',10:'H',11:'H'},14:{2:'S',3:'S',4:'S',5:'S',6:'S',7:'H',8:'H',9:'H',10:'H',11:'H'},15:{2:'S',3:'S',4:'S',5:'S',6:'S',7:'H',8:'H',9:'H',10:'R',11:'H'},16:{2:'S',3:'S',4:'S',5:'S',6:'S',7:'H',8:'H',9:'R',10:'R',11:'R'},17:{2:'S',3:'S',4:'S',5:'S',6:'S',7:'S',8:'S',9:'S',10:'S',11:'S'}};
const SOFT={13:{2:'H',3:'H',4:'H',5:'D',6:'D',7:'H',8:'H',9:'H',10:'H',11:'H'},14:{2:'H',3:'H',4:'H',5:'D',6:'D',7:'H',8:'H',9:'H',10:'H',11:'H'},15:{2:'H',3:'H',4:'D',5:'D',6:'D',7:'H',8:'H',9:'H',10:'H',11:'H'},16:{2:'H',3:'H',4:'D',5:'D',6:'D',7:'H',8:'H',9:'H',10:'H',11:'H'},17:{2:'H',3:'D',4:'D',5:'D',6:'D',7:'H',8:'H',9:'H',10:'H',11:'H'},18:{2:'S',3:'D',4:'D',5:'D',6:'D',7:'S',8:'S',9:'H',10:'H',11:'H'},19:{2:'S',3:'S',4:'S',5:'S',6:'S',7:'S',8:'S',9:'S',10:'S',11:'S'},20:{2:'S',3:'S',4:'S',5:'S',6:'S',7:'S',8:'S',9:'S',10:'S',11:'S'}};
const PAIRS={'A':{2:'P',3:'P',4:'P',5:'P',6:'P',7:'P',8:'P',9:'P',10:'P',11:'P'},'10':{2:'S',3:'S',4:'S',5:'S',6:'S',7:'S',8:'S',9:'S',10:'S',11:'S'},'9':{2:'P',3:'P',4:'P',5:'P',6:'P',7:'S',8:'P',9:'P',10:'S',11:'S'},'8':{2:'P',3:'P',4:'P',5:'P',6:'P',7:'P',8:'P',9:'P',10:'P',11:'P'},'7':{2:'P',3:'P',4:'P',5:'P',6:'P',7:'P',8:'H',9:'H',10:'H',11:'H'},'6':{2:'P',3:'P',4:'P',5:'P',6:'P',7:'H',8:'H',9:'H',10:'H',11:'H'},'5':{2:'D',3:'D',4:'D',5:'D',6:'D',7:'D',8:'D',9:'D',10:'H',11:'H'},'4':{2:'H',3:'H',4:'H',5:'P',6:'P',7:'H',8:'H',9:'H',10:'H',11:'H'},'3':{2:'P',3:'P',4:'P',5:'P',6:'P',7:'P',8:'H',9:'H',10:'H',11:'H'},'2':{2:'P',3:'P',4:'P',5:'P',6:'P',7:'P',8:'H',9:'H',10:'H',11:'H'}};
const ACTION_LABEL={H:'Hit',S:'Stand',D:'Double',P:'Split',R:'Surrender'};
const ACTION_KEYS=[{key:'H',label:'Hit'},{key:'S',label:'Stand'},{key:'D',label:'Double'},{key:'P',label:'Split'},{key:'R',label:'Surr.'}];

const DEVIATIONS=[
  {label:'Insurance vs A',dealerUp:'A',threshold:3,dir:'gte',basic:'No insurance',dev:'Take insurance',explain:"Insurance pays 2:1 if dealer has blackjack. At TC +3 the deck is so 10-rich that insurance becomes profitable — the only time it ever is."},
  {label:'16 vs 10',dealerUp:'10',playerTotal:16,threshold:0,dir:'gte',basic:'Surrender/Hit',dev:'Stand',explain:"At TC 0+, deck is balanced or 10-rich. Dealer busts more, so standing on 16 vs 10 becomes mathematically correct."},
  {label:'15 vs 10',dealerUp:'10',playerTotal:15,threshold:4,dir:'gte',basic:'Surrender/Hit',dev:'Stand',explain:"At TC +4 the shoe is heavily 10-loaded. Dealer busts much more — standing on 15 vs 10 becomes correct."},
  {label:'12 vs 3',dealerUp:'3',playerTotal:12,threshold:2,dir:'gte',basic:'Hit',dev:'Stand',explain:"Basic strategy hits 12 vs 3. At TC +2, enough 10s remain that dealer will bust more — stand and let them take the risk."},
  {label:'12 vs 2',dealerUp:'2',playerTotal:12,threshold:3,dir:'gte',basic:'Hit',dev:'Stand',explain:"You hit 12 vs 2 normally. At TC +3 the deck is 10-rich enough the dealer busts frequently — flip to stand."},
  {label:'11 vs A',dealerUp:'A',playerTotal:11,threshold:1,dir:'gte',basic:'Hit',dev:'Double',explain:"Basic strategy hits 11 vs Ace. At TC +1, enough 10s exist that doubling is profitable — you'll make 21 far more often."},
  {label:'9 vs 2',dealerUp:'2',playerTotal:9,threshold:1,dir:'gte',basic:'Hit',dev:'Double',explain:"Normally hit 9 vs 2. At TC +1 the deck is 10-rich enough that doubling down starts making you more money long-term."},
  {label:'10 vs 10',dealerUp:'10',playerTotal:10,threshold:4,dir:'gte',basic:'Hit',dev:'Double',explain:"Normally hit 10 vs dealer 10. At TC +4, the shoe is so loaded with 10s that doubling becomes correct even vs a strong dealer."},
  {label:'9 vs 7',dealerUp:'7',playerTotal:9,threshold:3,dir:'gte',basic:'Hit',dev:'Double',explain:"Basic hits 9 vs 7. At TC +3 you double — 10-rich deck means you'll draw strong and dealer can still bust."},
  {label:'13 vs 2',dealerUp:'2',playerTotal:13,threshold:-1,dir:'lte',basic:'Stand',dev:'Hit',explain:"You normally stand 13 vs 2. At TC -1 or lower the deck is low-card rich — dealer less likely to bust, so hitting to improve becomes correct."},
];

const STAGES=[
  {id:1,name:'Kindergarten 🌱',desc:'Hard 17+ stand · Hard 8- hit · Hard 12–16 vs 5–6'},
  {id:2,name:'Beginner 📗',desc:'Hard totals only, any dealer card'},
  {id:3,name:'Intermediate 📘',desc:'Hard + soft hands with Ace'},
  {id:4,name:'Advanced 📙',desc:'All hands including pairs'},
  {id:5,name:'Expert 🏆',desc:'Everything — full basic strategy'},
];

const LEVELS=[
  {min:0,title:'Newcomer',icon:'🎲',color:'text-stone-400'},
  {min:150,title:'Apprentice',icon:'📖',color:'text-amber-400'},
  {min:400,title:'Student',icon:'🎓',color:'text-amber-400'},
  {min:800,title:'Counter',icon:'🔢',color:'text-emerald-400'},
  {min:1400,title:'Sharp',icon:'🧠',color:'text-emerald-400'},
  {min:2200,title:'Analyst',icon:'📊',color:'text-sky-400'},
  {min:3200,title:'Tactician',icon:'♟️',color:'text-sky-400'},
  {min:4500,title:'Pro',icon:'💼',color:'text-violet-400'},
  {min:6000,title:'Shark',icon:'🦈',color:'text-rose-400'},
];

function getLevel(xp){for(let i=LEVELS.length-1;i>=0;i--){if(xp>=LEVELS[i].min)return{...LEVELS[i],index:i};}return{...LEVELS[0],index:0};}
function xpProgress(xp){const lv=getLevel(xp);const nx=LEVELS[lv.index+1];if(!nx)return{pct:100,toNext:0};const range=nx.min-lv.min;const prog=xp-lv.min;return{pct:Math.round(prog/range*100),toNext:nx.min-xp};}

const CHATTER=["So where you from?","Nice hand!","You been here long?","Did you see the game?","What are you drinking?","First time here?","You're on a roll!","Dealer's been cold all night","You play here often?","That was close!","What brings you to Vegas?","Feeling lucky?","Nice one!","Wild night in here."];

const DAILY_GOAL = 20;

// ─── Audio ────────────────────────────────────────────────────────────
function playTone(type){
  try{
    const ctx=new(window.AudioContext||window.webkitAudioContext)();const now=ctx.currentTime;
    if(type==='correct'){[0,0.09].forEach((d,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(i===0?880:1318.5,now+d);g.gain.setValueAtTime(0,now+d);g.gain.linearRampToValueAtTime(0.18,now+d+0.01);g.gain.exponentialRampToValueAtTime(0.001,now+d+0.3);o.connect(g).connect(ctx.destination);o.start(now+d);o.stop(now+d+0.32);});}
    else if(type==='bonus'){const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';[0,0.1,0.2].forEach((d,i)=>{o.frequency.setValueAtTime([880,1100,1320][i],now+d);});g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(0.22,now+0.01);g.gain.exponentialRampToValueAtTime(0.001,now+0.5);o.connect(g).connect(ctx.destination);o.start(now);o.stop(now+0.55);}
    else{const o=ctx.createOscillator(),g=ctx.createGain();o.type='sawtooth';o.frequency.setValueAtTime(180,now);o.frequency.exponentialRampToValueAtTime(90,now+0.25);g.gain.setValueAtTime(0.001,now);g.gain.linearRampToValueAtTime(0.12,now+0.02);g.gain.exponentialRampToValueAtTime(0.001,now+0.3);o.connect(g).connect(ctx.destination);o.start(now);o.stop(now+0.32);}
  }catch(e){}
}
function speak(text){try{if('speechSynthesis'in window){window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.rate=0.95;window.speechSynthesis.speak(u);}}catch(e){}}

function injectDealStyles(){
  if(document.getElementById('bj-deal-css'))return;
  const s=document.createElement('style');s.id='bj-deal-css';
  s.textContent=`
    @keyframes dealSlide {
      0%   { transform: translateX(380px) translateY(-4px) rotate(5deg); }
      68%  { transform: translateX(-4px)  translateY(1px)  rotate(-0.3deg); }
      86%  { transform: translateX(2px)   translateY(0)    rotate(0.1deg); }
      100% { transform: translateX(0)     translateY(0)    rotate(0deg); }
    }
  `;
  document.head.appendChild(s);
}

function playDealSound(){
  try{
    const ctx=new(window.AudioContext||window.webkitAudioContext)();
    const now=ctx.currentTime;

    // ── PART 1: Felt slide ──────────────────────────────────────────
    // Low-frequency fabric friction — felt kills everything above ~280Hz
    const sLen=Math.floor(ctx.sampleRate*0.30);
    const sBuf=ctx.createBuffer(1,sLen,ctx.sampleRate);
    const sData=sBuf.getChannelData(0);
    for(let i=0;i<sLen;i++){
      // Slight grain texture to simulate felt fibers
      sData[i]=(Math.random()*2-1)*0.8 + (Math.random()*2-1)*0.2*Math.sin(i*0.004);
    }
    const slideSrc=ctx.createBufferSource();slideSrc.buffer=sBuf;

    // Very aggressive low-pass — felt is dense fabric
    const lpf1=ctx.createBiquadFilter();lpf1.type='lowpass';lpf1.frequency.value=220;lpf1.Q.value=0.5;
    const lpf2=ctx.createBiquadFilter();lpf2.type='lowpass';lpf2.frequency.value=180;lpf2.Q.value=0.4;

    const slideGain=ctx.createGain();
    slideGain.gain.setValueAtTime(0,now);
    slideGain.gain.linearRampToValueAtTime(0.28,now+0.03);   // soft attack
    slideGain.gain.setValueAtTime(0.24,now+0.12);            // sustained scrape
    slideGain.gain.linearRampToValueAtTime(0.18,now+0.22);   // taper off as card slows
    slideGain.gain.exponentialRampToValueAtTime(0.001,now+0.30);

    slideSrc.connect(lpf1);lpf1.connect(lpf2);lpf2.connect(slideGain);slideGain.connect(ctx.destination);
    slideSrc.start(now);slideSrc.stop(now+0.31);

    // ── PART 2: Arrival thud ────────────────────────────────────────
    // Soft percussive bump when card reaches its position on felt
    const tStart=now+0.26;
    const tLen=Math.floor(ctx.sampleRate*0.08);
    const tBuf=ctx.createBuffer(1,tLen,ctx.sampleRate);
    const tData=tBuf.getChannelData(0);
    for(let i=0;i<tLen;i++) tData[i]=Math.random()*2-1;
    const thudSrc=ctx.createBufferSource();thudSrc.buffer=tBuf;

    const tbpf=ctx.createBiquadFilter();tbpf.type='bandpass';tbpf.frequency.value=260;tbpf.Q.value=1.8;
    const tlpf=ctx.createBiquadFilter();tlpf.type='lowpass';tlpf.frequency.value=420;tlpf.Q.value=0.6;

    const thudGain=ctx.createGain();
    thudGain.gain.setValueAtTime(0,tStart);
    thudGain.gain.linearRampToValueAtTime(0.45,tStart+0.006); // sharp attack
    thudGain.gain.exponentialRampToValueAtTime(0.001,tStart+0.07); // fast decay

    thudSrc.connect(tbpf);tbpf.connect(tlpf);tlpf.connect(thudGain);thudGain.connect(ctx.destination);
    thudSrc.start(tStart);thudSrc.stop(tStart+0.08);

  }catch(e){}
}

// ─── Strategy helpers ─────────────────────────────────────────────────
function explainAction(playerCards,dealerUp,action,isPair,isSoft,total){
  const dv=dealerUp==='A'?'Ace':dealerUp;
  if(isPair){const r=playerCards[0].rank;
    if(action==='P'){if(r==='A')return"Always split Aces — two hands starting at 11 beats one soft 12.";if(r==='8')return"Always split 8s. Hard 16 is the worst hand; two hands at 8 are far better.";return`Splitting ${r}s vs dealer ${dv} turns one mediocre hand into two stronger ones — dealer is weak enough to bust.`;}
    if(action==='S')return`Pairs of ${r==='10'?'10s':r} vs ${dv}: you already have a strong total — splitting would break it up.`;
    if(action==='H')return`${r}s vs dealer ${dv} aren't worth splitting — dealer is too strong, hit instead.`;
    if(action==='D')return`A pair of 5s totals 10 — treat it as hard 10 and double vs dealer ${dv}, don't split.`;}
  if(isSoft){if(action==='D')return`Soft ${total} vs dealer ${dv}: dealer is weak, double to capitalize — your Ace is a safety net if you draw low.`;if(action==='S')return`Soft ${total} vs ${dv} is strong enough to stand — Ace gives flexibility, no need to risk drawing.`;if(action==='H')return`Soft ${total} vs ${dv}: not strong enough to stand, dealer isn't weak enough to double — hit, your Ace protects you.`;}
  if(action==='D')return`Hard ${total} vs dealer ${dv}: dealer is weak — double to get more money in while odds favor you.`;
  if(action==='S')return`Hard ${total} vs dealer ${dv}: dealer is weak and likely to bust — stand and let them hang.`;
  if(action==='R')return`Hard ${total} vs dealer ${dv}: near-certain loss — surrendering saves half your bet.`;
  if(action==='H')return`Hard ${total} vs dealer ${dv}: dealer is strong — improve your hand even at bust risk.`;
  return"";
}
function universalRule(playerCards,dealerUp,action,isPair,isSoft,total){
  const dw=['2','3','4','5','6'].includes(dealerUp);
  if(isPair){const r=playerCards[0].rank;if(r==='A'||r==='8')return"📏 Rule: ALWAYS split Aces and 8s, no exceptions.";if(r==='10')return"📏 Rule: NEVER split 10s — 20 is too good to break up.";if(r==='5')return"📏 Rule: NEVER split 5s — treat as hard 10 and double when dealer is weak.";return"📏 Rule: Split low pairs only when dealer shows 2–7 (weak cards most likely to bust them).";}
  if(isSoft)return"📏 Rule: Soft hands can't bust on one card — lean toward hitting or doubling, rarely stand below soft 18.";
  if(total>=17)return"📏 Rule: Hard 17+ — ALWAYS stand, no matter what.";
  if(total<=11)return"📏 Rule: Hard 11 or less can never bust on one card — hit or double, never stand.";
  if(total>=12&&total<=16)return dw?"📏 Rule: Dealer 2–6 is weak and likely to bust. Stand on stiff hands (12–16) and let them hang.":"📏 Rule: Dealer 7–Ace is strong. Hit your stiff hands (12–16) even at bust risk.";
  return"📏 Rule: Dealer upcard drives everything — 2–6 weak (stand more), 7–Ace strong (hit more).";
}
function getCorrectAction(playerCards,dealerUp){
  const ranks=playerCards.map(c=>c.rank);const isPair=ranks[0]===ranks[1]&&playerCards.length===2;const dv=dealerUp==='A'?11:cardValue(dealerUp);
  if(isPair){const pk=ranks[0]==='A'?'A':(cardValue(ranks[0])===10?'10':ranks[0]);const act=PAIRS[pk]?.[dv];if(act)return{action:act,isPair:true,isSoft:false,total:cardValue(ranks[0])*2>21?12:cardValue(ranks[0])*2};}
  let na=0,rs=0;ranks.forEach(r=>{if(r==='A'){na++;rs+=11;}else rs+=cardValue(r);});let ft=rs,ua=na;while(ft>21&&ua>0){ft-=10;ua--;}
  const isSoft=na>0&&ua>0&&playerCards.length===2;
  if(isSoft&&SOFT[ft])return{action:SOFT[ft][dv]||'H',isPair:false,isSoft:true,total:ft};
  const hv=Math.min(ft,21);let act=hv<=8?'H':hv>=18&&!isSoft?'S':HARD[hv]?HARD[hv][dv]||'H':hv>=17?'S':'H';
  return{action:act,isPair:false,isSoft:false,total:hv};
}
function makeHandKey(playerCards,dealerUp,result){if(result.isPair)return`p${playerCards[0].rank}-v${dealerUp}`;if(result.isSoft)return`s${result.total}-v${dealerUp}`;return`h${result.total}-v${dealerUp}`;}
function makeHandLabel(key){const[h,d]=key.split('-v');if(h.startsWith('p'))return`Pair of ${h.slice(1)}s vs ${d}`;if(h.startsWith('s'))return`Soft ${h.slice(1)} vs ${d}`;return`Hard ${h.slice(1)} vs ${d}`;}

function makeHardTotal(target){for(let i=0;i<30;i++){const v=['2','3','4','5','6','7','8','9','10'];const r1=v[Math.floor(Math.random()*v.length)];const v1=r1==='10'?10:parseInt(r1);const v2=target-v1;if(v2<2||v2>10)continue;const r2=v2===10?'10':v2.toString();if(r1===r2)continue;return[{rank:r1,suit:SUITS[Math.floor(Math.random()*4)],red:Math.random()<0.5},{rank:r2,suit:SUITS[Math.floor(Math.random()*4)],red:Math.random()<0.5}];}return null;}
function generateHandForStage(stage){
  let playerCards,dealerUp=RANKS[Math.floor(Math.random()*RANKS.length)];
  if(stage===1){const r=Math.random();if(r<0.4){dealerUp=['5','6'][Math.floor(Math.random()*2)];playerCards=makeHardTotal(12+Math.floor(Math.random()*5));}else if(r<0.7){playerCards=makeHardTotal(17+Math.floor(Math.random()*4));}else{playerCards=makeHardTotal(5+Math.floor(Math.random()*4));}}
  else if(stage===2){for(let i=0;i<20;i++){const v=['2','3','4','5','6','7','8','9','10'];const r1=v[Math.floor(Math.random()*v.length)],r2=v[Math.floor(Math.random()*v.length)];if(r1===r2)continue;playerCards=[{rank:r1,suit:SUITS[Math.floor(Math.random()*4)],red:Math.random()<0.5},{rank:r2,suit:SUITS[Math.floor(Math.random()*4)],red:Math.random()<0.5}];break;}}
  else if(stage===3){if(Math.random()<0.4){const sr=['2','3','4','5','6','7','8','9'][Math.floor(Math.random()*8)];playerCards=[{rank:'A',suit:SUITS[Math.floor(Math.random()*4)],red:false},{rank:sr,suit:SUITS[Math.floor(Math.random()*4)],red:Math.random()<0.5}];}else{const v=['2','3','4','5','6','7','8','9','10'];const r1=v[Math.floor(Math.random()*v.length)],r2=v.filter(x=>x!==r1)[Math.floor(Math.random()*(v.length-1))];playerCards=[{rank:r1,suit:SUITS[Math.floor(Math.random()*4)],red:Math.random()<0.5},{rank:r2,suit:SUITS[Math.floor(Math.random()*4)],red:Math.random()<0.5}];}}
  else{playerCards=[randomCard(),randomCard()];}
  return{playerCards:playerCards||[randomCard(),randomCard()],dealerUp};
}
function generateNemesisHand(key){
  try{
    const[h,d]=key.split('-v');const dealerUp=d;
    if(h.startsWith('p')){const rank=h.slice(1);const s1=SUITS[Math.floor(Math.random()*4)],s2=SUITS[Math.floor(Math.random()*4)];return{playerCards:[{rank,suit:s1,red:s1==='♥'||s1==='♦'},{rank,suit:s2,red:s2==='♥'||s2==='♦'}],dealerUp};}
    if(h.startsWith('s')){const tot=parseInt(h.slice(1));const ov=tot-11;if(ov<2||ov>10)return generateHandForStage(4);const or=ov===10?'10':ov.toString();const s1=SUITS[Math.floor(Math.random()*4)],s2=SUITS[Math.floor(Math.random()*4)];return{playerCards:[{rank:'A',suit:s1,red:s1==='♥'||s1==='♦'},{rank:or,suit:s2,red:s2==='♥'||s2==='♦'}],dealerUp};}
    const tot=parseInt(h.slice(1));const cards=makeHardTotal(tot);return{playerCards:cards||[randomCard(),randomCard()],dealerUp};
  }catch(e){return generateHandForStage(4);}
}

// ─── Storage helpers ──────────────────────────────────────────────────
const GS_KEY='bj_gs_v2';
function freshGs(){return{xp:0,streak:0,bestStreak:0,lastPlayDate:null,totalHands:0,totalCorrect:0,sessions:[],nemesis:{},todayDate:null,todayHands:0,todayCorrect:0,todayXP:0};}
async function loadGs(){try{const r=localStorage.getItem(GS_KEY);return r?JSON.parse(r):freshGs();}catch(e){return freshGs();}}
async function saveGs(data){try{localStorage.setItem(GS_KEY,JSON.stringify(data));}catch(e){}}

// ─── Card component ───────────────────────────────────────────────────
function Card({card,hidden,small,deal,dealDelay=0}){
  const w=small?'w-10 h-14':'w-14 h-20';
  const anim=deal?{animation:`dealSlide 0.42s cubic-bezier(0.12,0.82,0.25,1) ${dealDelay}s both`}:{};
  if(hidden)return(<div style={anim} className={`${w} rounded-lg bg-gradient-to-br from-emerald-800 to-emerald-950 border-2 border-amber-600/40 shadow-lg flex items-center justify-center`}><div className="w-6 h-10 rounded border border-amber-500/30"></div></div>);
  return(<div style={anim} className={`${w} rounded-lg bg-stone-50 shadow-lg flex flex-col items-center justify-center font-serif select-none`}><span className={`${small?'text-base':'text-xl'} font-bold ${card.red?'text-rose-700':'text-stone-900'}`}>{card.rank}</span><span className={`${small?'text-sm':'text-lg'} -mt-1 ${card.red?'text-rose-700':'text-stone-900'}`}>{card.suit}</span></div>);
}

// ─── XP Burst animation ───────────────────────────────────────────────
function XPBurst({amount,isBonus,onDone}){
  useEffect(()=>{const t=setTimeout(onDone,1400);return()=>clearTimeout(t);},[]);
  return(
    <div className="fixed inset-0 pointer-events-none flex items-start justify-center z-50 pt-32">
      <div className={`px-5 py-2 rounded-xl font-black text-2xl shadow-2xl ${isBonus?'bg-amber-500 text-emerald-950 animate-bounce':'bg-emerald-600 text-white'}`}>
        {isBonus?`⚡ BONUS! +${amount} XP`:`+${amount} XP`}
      </div>
    </div>
  );
}

// ─── Level Up modal ───────────────────────────────────────────────────
function LevelUpModal({level,onClose}){
  useEffect(()=>{const t=setTimeout(onClose,3500);return()=>clearTimeout(t);},[]);
  return(
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-emerald-900 border-2 border-amber-500 rounded-2xl p-8 text-center max-w-xs mx-4 shadow-2xl">
        <div className="text-5xl mb-2">{level.icon}</div>
        <div className="text-amber-300 text-xs uppercase tracking-widest mb-1">Level Up!</div>
        <div className={`font-black text-3xl mb-2 ${level.color}`}>{level.title}</div>
        <div className="text-amber-200/60 text-sm">The subconscious is watching. Keep grinding. 🧠</div>
      </div>
    </div>
  );
}

// ─── Progress Dashboard ───────────────────────────────────────────────
function ProgressDashboard({gs}){
  if(!gs)return<div className="text-amber-200/40 text-center py-8">Loading...</div>;
  const lv=getLevel(gs.xp);const xpp=xpProgress(gs.xp);
  const chartData=gs.sessions.slice(-14).map((s,i)=>({name:s.date?s.date.slice(5):`#${i+1}`,acc:s.total?Math.round(s.correct/s.total*100):0}));
  const nemList=Object.entries(gs.nemesis||{}).map(([k,v])=>({k,...v,rate:v.total>=3?Math.round(v.wrong/v.total*100):0})).filter(n=>n.total>=3&&n.rate>20).sort((a,b)=>b.rate-a.rate).slice(0,6);
  const today=new Date().toISOString().slice(0,10);
  const todayProgress=gs.todayDate===today?Math.min(100,Math.round((gs.todayCorrect||0)/DAILY_GOAL*100)):0;
  const motivations=[
    [0,"Start your first session — the habit begins today 🌱"],
    [1,"Day 1 — every expert started here. Don't break the chain."],
    [3,"3 days in — momentum is building ⚡"],
    [7,"A full week! Your subconscious is starting to encode this 🧠"],
    [14,"Two weeks strong 🔥 The pattern is getting automatic."],
    [30,"30 days — this is now part of who you are. Protect it."],
  ];
  const msg=motivations.slice().reverse().find(([d])=>gs.streak>=d)?.[1]||"";
  return(
    <div className="flex flex-col gap-4">
      {/* Level card */}
      <div className="bg-emerald-950/60 rounded-xl border border-amber-600/30 p-4">
        <div className="flex items-center justify-between mb-3">
          <div><div className="text-3xl">{lv.icon}</div><div className={`font-black text-xl ${lv.color}`}>{lv.title}</div></div>
          <div className="text-right"><div className="text-amber-200/50 text-xs uppercase tracking-widest">Total XP</div><div className="text-amber-300 font-black text-3xl">{gs.xp.toLocaleString()}</div></div>
        </div>
        {xpp.toNext>0&&(<><div className="flex justify-between text-xs text-amber-200/40 mb-1"><span>{lv.title}</span><span>{xpp.toNext} XP to next level</span></div><div className="w-full bg-emerald-950 rounded-full h-2.5"><div className="bg-gradient-to-r from-amber-600 to-amber-400 h-2.5 rounded-full transition-all" style={{width:`${xpp.pct}%`}}></div></div></>)}
        {xpp.toNext===0&&<div className="text-amber-300/70 text-sm text-center mt-1">🦈 Maximum level — you are the edge.</div>}
      </div>

      {/* Streak + daily goal + stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-emerald-950/60 rounded-xl border border-amber-600/20 p-3 text-center">
          <div className="text-2xl">{gs.streak>=14?'🔥':gs.streak>=7?'⚡':gs.streak>=3?'📅':'⬜'}</div>
          <div className="text-amber-300 font-black text-2xl">{gs.streak}</div>
          <div className="text-amber-200/40 text-xs">day streak</div>
          {gs.bestStreak>0&&<div className="text-amber-200/30 text-xs">best: {gs.bestStreak}</div>}
        </div>
        <div className="bg-emerald-950/60 rounded-xl border border-amber-600/20 p-3 text-center">
          <div className="text-2xl">🎯</div>
          <div className="text-amber-300 font-black text-2xl">{gs.totalHands}</div>
          <div className="text-amber-200/40 text-xs">total hands</div>
        </div>
        <div className="bg-emerald-950/60 rounded-xl border border-amber-600/20 p-3 text-center">
          <div className="text-2xl">✓</div>
          <div className="text-amber-300 font-black text-2xl">{gs.totalHands?Math.round(gs.totalCorrect/gs.totalHands*100):0}%</div>
          <div className="text-amber-200/40 text-xs">accuracy</div>
        </div>
      </div>

      {/* Daily goal */}
      <div className="bg-emerald-950/60 rounded-xl border border-amber-600/20 p-3">
        <div className="flex justify-between text-xs text-amber-200/60 mb-1.5">
          <span>Today's goal: {DAILY_GOAL} correct hands</span>
          <span>{gs.todayDate===today?gs.todayCorrect:0} / {DAILY_GOAL}</span>
        </div>
        <div className="w-full bg-emerald-950 rounded-full h-3">
          <div className={`h-3 rounded-full transition-all ${todayProgress>=100?'bg-amber-400':'bg-emerald-600'}`} style={{width:`${todayProgress}%`}}></div>
        </div>
        {todayProgress>=100&&<div className="text-amber-300 text-xs text-center mt-1">✓ Daily goal complete! +50 bonus XP earned</div>}
      </div>

      {msg&&<div className="text-amber-200/60 text-xs text-center italic px-2">{msg}</div>}

      {/* Accuracy chart */}
      {chartData.length>1&&(
        <div className="bg-emerald-950/60 rounded-xl border border-amber-600/20 p-4">
          <div className="text-amber-300/60 text-xs uppercase tracking-widest mb-3">Accuracy trend</div>
          <ResponsiveContainer width="100%" height={110}>
            <LineChart data={chartData} margin={{top:5,right:5,bottom:0,left:-20}}>
              <XAxis dataKey="name" tick={{fill:'#78350f',fontSize:9}} axisLine={false} tickLine={false}/>
              <YAxis domain={[0,100]} tick={{fill:'#78350f',fontSize:9}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{background:'#052e16',border:'1px solid #92400e',borderRadius:'8px',fontSize:11}} formatter={(v)=>[`${v}%`,'Accuracy']}/>
              <Line type="monotone" dataKey="acc" stroke="#f59e0b" strokeWidth={2.5} dot={{fill:'#f59e0b',r:3}} activeDot={{r:5}}/>
            </LineChart>
          </ResponsiveContainer>
          <div className="text-amber-200/30 text-xs mt-1 text-right">Target: 85%+ mastery</div>
        </div>
      )}
      {chartData.length<=1&&gs.totalHands<20&&<div className="text-amber-200/30 text-xs text-center py-2">Play 20+ hands to unlock accuracy chart</div>}

      {/* Nemesis hands */}
      {nemList.length>0&&(
        <div className="bg-emerald-950/60 rounded-xl border border-rose-800/20 p-4">
          <div className="text-rose-300/70 text-xs uppercase tracking-widest mb-3">😤 Your nemesis hands — getting extra reps</div>
          <div className="flex flex-col gap-2.5">
            {nemList.map(n=>(
              <div key={n.k} className="flex items-center justify-between gap-3">
                <span className="text-amber-200/80 text-xs flex-1">{n.label||makeHandLabel(n.k)}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-emerald-950 rounded-full h-1.5"><div className="bg-rose-500 h-1.5 rounded-full" style={{width:`${n.rate}%`}}></div></div>
                  <span className="text-rose-400 text-xs font-bold w-8 text-right">{n.rate}%</span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-amber-200/30 text-xs mt-3">These hands appear more often in Strategy drills until you master them.</div>
        </div>
      )}
      {nemList.length===0&&gs.totalHands<15&&<div className="text-amber-200/30 text-xs text-center py-2">Play 15+ strategy hands to unlock nemesis tracking</div>}
    </div>
  );
}

// ─── Strategy Trainer ─────────────────────────────────────────────────
function StrategyTrainer({onAnswer,nemesis}){
  const[stage,setStage]=useState(()=>parseInt(localStorage.getItem('bj_stage')||'1'));
  const[dealerUp,setDealerUp]=useState('6');
  const[playerCards,setPlayerCards]=useState([]);
  const[feedback,setFeedback]=useState(null);
  const[streak,setStreak]=useState(0);
  const[best,setBest]=useState(0);
  const[stats,setStats]=useState({correct:0,total:0});
  const[dealKey,setDealKey]=useState(0);

  useEffect(()=>{localStorage.setItem('bj_stage',stage);},[stage]);

  const newHand=useCallback((s)=>{
    const nemKeys=Object.entries(nemesis||{}).filter(([,v])=>v.total>=3&&v.wrong/v.total>0.35).map(([k])=>k);
    let hand;
    if(nemKeys.length>0&&Math.random()<0.3){hand=generateNemesisHand(nemKeys[Math.floor(Math.random()*nemKeys.length)]);}
    else{hand=generateHandForStage(s||stage);}
    setPlayerCards(hand.playerCards);setDealerUp(hand.dealerUp);setFeedback(null);
    setDealKey(k=>k+1);
    // Real dealer order: player card 1 → dealer card → player card 2
    [0, 320, 640].forEach(ms=>setTimeout(playDealSound,ms));
  },[stage,nemesis]);

  useEffect(()=>{newHand(stage);},[stage]);

  function handleGuess(action){
    if(feedback)return;
    const result=getCorrectAction(playerCards,dealerUp);
    const isRight=action===result.action;
    const ns={correct:stats.correct+(isRight?1:0),total:stats.total+1};
    setStats(ns);setStreak(s=>{const n=isRight?s+1:0;setBest(b=>Math.max(b,n));return n;});
    const explanation=explainAction(playerCards,dealerUp,result.action,result.isPair,result.isSoft,result.total);
    const rule=!isRight?universalRule(playerCards,dealerUp,result.action,result.isPair,result.isSoft,result.total):null;
    const hKey=makeHandKey(playerCards,dealerUp,result);
    const hLabel=makeHandLabel(hKey);
    setFeedback({isRight,correct:result.action,explanation,rule});
    onAnswer&&onAnswer(isRight,hKey,hLabel);
  }

  const acc=stats.total?Math.round(stats.correct/stats.total*100):0;
  const canUp=stats.total>=15&&acc>=85&&stage<5;

  return(
    <div className="flex flex-col items-center gap-5">
      <div className="w-full flex items-center justify-between bg-emerald-950/40 rounded-xl px-3 py-2 border border-amber-600/10">
        <button onClick={()=>{setStage(s=>Math.max(1,s-1));setStats({correct:0,total:0});}} disabled={stage<=1} className="text-amber-300/50 hover:text-amber-300 disabled:opacity-20 px-2 text-sm">◀</button>
        <div className="text-center"><div className="text-amber-300 text-xs font-bold">{STAGES[stage-1].name}</div><div className="text-amber-200/40 text-xs">{STAGES[stage-1].desc}</div></div>
        <button onClick={()=>{setStage(s=>Math.min(5,s+1));setStats({correct:0,total:0});}} disabled={stage>=5} className="text-amber-300/50 hover:text-amber-300 disabled:opacity-20 px-2 text-sm">▶</button>
      </div>
      {canUp&&(<div className="w-full bg-emerald-800/40 border border-emerald-500/30 rounded-lg px-3 py-2 flex items-center justify-between"><span className="text-emerald-300 text-xs">🎉 {acc}% accuracy — ready to level up!</span><button onClick={()=>{setStage(s=>s+1);setStats({correct:0,total:0});}} className="text-xs bg-emerald-600 text-white px-3 py-1 rounded-lg font-bold">Level up →</button></div>)}
      <div className="flex flex-col items-center gap-2"><span className="text-amber-300/70 text-xs uppercase tracking-widest">Dealer</span>{dealerUp&&<Card key={`d-${dealKey}`} card={{rank:dealerUp,suit:'♠',red:false}} deal dealDelay={0.32}/>}</div>
      <div className="flex flex-col items-center gap-2"><span className="text-amber-300/70 text-xs uppercase tracking-widest">Your hand</span><div className="flex gap-2">{playerCards.map((c,i)=><Card key={`p-${dealKey}-${i}`} card={c} deal dealDelay={i===0?0:0.64}/>)}</div></div>
      {!feedback?(
        <div className="grid grid-cols-5 gap-2 w-full max-w-md">
          {ACTION_KEYS.map(a=>(<button key={a.key} onClick={()=>handleGuess(a.key)} className="py-3 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-amber-100 font-semibold text-sm border border-amber-600/30 transition-colors">{a.label}</button>))}
        </div>
      ):(
        <div className="flex flex-col items-center gap-3 max-w-md text-center">
          <div className={`px-4 py-2 rounded-lg font-bold ${feedback.isRight?'bg-emerald-600':'bg-rose-700'} text-white`}>{feedback.isRight?'✓ Correct':`✗ Correct play: ${ACTION_LABEL[feedback.correct]}`}</div>
          <p className="text-amber-200/80 text-sm leading-relaxed px-2">{feedback.explanation}</p>
          {feedback.rule&&<p className="text-amber-300/90 text-xs leading-relaxed px-3 py-2 bg-emerald-950/60 rounded-lg border border-amber-600/20">{feedback.rule}</p>}
          <button onClick={()=>newHand(stage)} className="px-6 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-emerald-950 font-bold">Next hand →</button>
        </div>
      )}
      <div className="flex gap-6 text-amber-200/70 text-sm"><span>Streak: <b className="text-amber-300">{streak}</b></span><span>Best: <b className="text-amber-300">{best}</b></span><span>Accuracy: <b className="text-amber-300">{acc}%</b> ({stats.correct}/{stats.total})</span></div>
    </div>
  );
}

// ─── Learn Count ──────────────────────────────────────────────────────
function LearnCount({onDone}){
  const[step,setStep]=useState(0);const[qCard,setQCard]=useState(randomCard());const[qFb,setQFb]=useState(null);const[qScore,setQScore]=useState({r:0,t:0});
  function nq(){setQCard(randomCard());setQFb(null);}
  function aq(val){const c=hiLoValue(qCard.rank);const ok=val===c;setQScore(s=>({r:s.r+(ok?1:0),t:s.t+1}));setQFb({ok,c});playTone(ok?'correct':'wrong');}
  const steps=[
    {title:"Why count at all?",body:"Blackjack odds shift as cards leave the deck. When lots of low cards (2–6) have been played, the remaining deck is rich in 10s and Aces — that favors YOU: more blackjacks, dealer busts more often. Counting tracks that shift so you bet more when the deck favors you."},
    {title:"The Hi-Lo system",body:"Every card gets a value. Low cards (2–6) = +1 because removing them makes the deck more dangerous for the dealer. High cards (10, J, Q, K, A) = −1 because removing them weakens the deck. Middle cards (7, 8, 9) = 0.",showTable:true},
    {title:"Running count",body:"As each card is dealt, add its value to a running total in your head. Start at 0. See a 5 → +1. See a King → −1. See an 8 → no change. That's your running count — the raw balance of high vs low cards remaining."},
    {title:"True count",body:"Running count alone isn't enough with multiple decks — +6 means a lot more in 1 deck than in 6. Convert: True Count = Running Count ÷ Decks Remaining. True count +2 or higher = your signal to raise your bet."},
    {title:"Quiz: card values",body:"Let's drill the values one card at a time before moving to full shoes.",quiz:true},
  ];
  const cur=steps[step];
  return(
    <div className="flex flex-col items-center gap-6 max-w-md mx-auto">
      <div className="flex gap-1.5">{steps.map((_,i)=><div key={i} className={`h-1.5 w-8 rounded-full ${i<=step?'bg-amber-500':'bg-emerald-800'}`}></div>)}</div>
      <h3 className="text-amber-300 font-bold text-lg text-center">{cur.title}</h3>
      <p className="text-amber-100/80 text-sm leading-relaxed text-center">{cur.body}</p>
      {cur.showTable&&<div className="flex gap-8"><div className="text-center"><div className="text-emerald-400 font-black text-xl">+1</div><div className="text-amber-200/60 text-sm">2 3 4 5 6</div></div><div className="text-center"><div className="text-stone-400 font-black text-xl">0</div><div className="text-amber-200/60 text-sm">7 8 9</div></div><div className="text-center"><div className="text-rose-400 font-black text-xl">−1</div><div className="text-amber-200/60 text-sm">10 J Q K A</div></div></div>}
      {cur.quiz?(
        <div className="flex flex-col items-center gap-4">
          <Card card={qCard}/>
          {!qFb?(<div className="flex gap-3"><button onClick={()=>aq(1)} className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold">+1</button><button onClick={()=>aq(0)} className="px-5 py-2 rounded-lg bg-stone-600 hover:bg-stone-500 text-white font-bold">0</button><button onClick={()=>aq(-1)} className="px-5 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-bold">−1</button></div>)
          :(<div className="flex flex-col items-center gap-2"><div className={`px-4 py-1.5 rounded-lg font-bold text-sm ${qFb.ok?'bg-emerald-600':'bg-rose-700'} text-white`}>{qFb.ok?'✓ Correct':`✗ It's ${qFb.c>0?'+1':qFb.c<0?'−1':'0'}`}</div><button onClick={nq} className="px-5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-emerald-950 font-bold text-sm">Next →</button></div>)}
          <span className="text-amber-200/50 text-xs">Score: {qScore.r}/{qScore.t}</span>
          {qScore.t>=10&&<button onClick={onDone} className="px-6 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-emerald-950 font-bold">Start counting →</button>}
        </div>
      ):(<button onClick={()=>setStep(s=>s+1)} className="px-6 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-emerald-950 font-bold">{step===steps.length-2?"Quiz time →":"Next →"}</button>)}
    </div>
  );
}

// ─── Count Trainer ────────────────────────────────────────────────────
function CountTrainer(){
  const[learnMode,setLearnMode]=useState(true);const[deckCount,setDeckCount]=useState(1);const[speed,setSpeed]=useState(1500);const[distraction,setDistraction]=useState(false);const[running,setRunning]=useState(false);const[shoe,setShoe]=useState([]);const[idx,setIdx]=useState(0);const[guessMode,setGuessMode]=useState(false);const[userGuess,setUserGuess]=useState('');const[result,setResult]=useState(null);
  const intRef=useRef(null);const distRef=useRef(null);const rc=useRef(0);
  function bShoe(n){let c=[];for(let d=0;d<n;d++)RANKS.forEach(r=>SUITS.forEach(s=>c.push({rank:r,suit:s,red:s==='♥'||s==='♦'})));for(let i=c.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[c[i],c[j]]=[c[j],c[i]];}return c;}
  function start(){const s=bShoe(deckCount);setShoe(s);setIdx(0);rc.current=0;setResult(null);setGuessMode(false);setUserGuess('');setRunning(true);}
  function stop(){setRunning(false);clearInterval(intRef.current);}
  useEffect(()=>{if(!running)return;intRef.current=setInterval(()=>{setIdx(p=>{const n=p+1;if(p<shoe.length)rc.current+=hiLoValue(shoe[p].rank);if(n>=shoe.length){clearInterval(intRef.current);setRunning(false);setGuessMode(true);}return n;});},speed);return()=>clearInterval(intRef.current);},[running,shoe,speed]);
  useEffect(()=>{if(distraction&&running){const f=()=>{speak(CHATTER[Math.floor(Math.random()*CHATTER.length)]);distRef.current=setTimeout(f,3000+Math.random()*4000);};distRef.current=setTimeout(f,2000);}else{clearTimeout(distRef.current);try{window.speechSynthesis?.cancel();}catch(e){}}return()=>{clearTimeout(distRef.current);try{window.speechSynthesis?.cancel();}catch(e){};};},[distraction,running]);
  function submit(){const g=parseInt(userGuess);const dl=Math.max(1,deckCount-Math.floor(idx/52));const tc=(rc.current/dl).toFixed(1);const ok=g===rc.current;setResult({guess:g,actual:rc.current,ok,tc});setGuessMode(false);playTone(ok?'correct':'wrong');}
  const cur=idx>0&&idx<=shoe.length?shoe[idx-1]:null;
  if(learnMode)return<LearnCount onDone={()=>setLearnMode(false)}/>;
  return(
    <div className="flex flex-col items-center gap-6">
      <button onClick={()=>setLearnMode(true)} className="text-amber-300/50 hover:text-amber-300 text-xs underline">← Back to lesson</button>
      <div className="flex gap-2 items-center flex-wrap justify-center">
        <label className="flex items-center gap-2 text-amber-200/80 text-sm">Decks:<select value={deckCount} onChange={e=>setDeckCount(parseInt(e.target.value))} disabled={running} className="bg-emerald-900 border border-amber-600/30 rounded px-2 py-1 text-amber-100">{[1,2,4,6,8].map(n=><option key={n} value={n}>{n}</option>)}</select></label>
        <label className="flex items-center gap-2 text-amber-200/80 text-sm">Speed:<select value={speed} onChange={e=>setSpeed(parseInt(e.target.value))} disabled={running} className="bg-emerald-900 border border-amber-600/30 rounded px-2 py-1 text-amber-100"><option value={2500}>Slow</option><option value={1500}>Medium</option><option value={800}>Fast</option><option value={400}>Pro</option></select></label>
        <button onClick={()=>setDistraction(d=>!d)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${distraction?'bg-rose-700 border-rose-500 text-white':'bg-emerald-900 border-amber-600/20 text-amber-200/60'}`}>🗣 {distraction?'Chatter ON':'Chatter'}</button>
      </div>
      {distraction&&<p className="text-rose-300/60 text-xs text-center">Casino chatter playing through your speaker while you count</p>}
      <div className="h-24 flex items-center justify-center">{cur?<Card card={cur}/>:<div className="w-14 h-20 rounded-lg border-2 border-dashed border-amber-600/30"></div>}</div>
      <div className="text-amber-200/60 text-xs">Card {Math.min(idx,shoe.length)} / {shoe.length||deckCount*52}</div>
      {!running&&!guessMode&&!result&&<button onClick={start} className="px-6 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-emerald-950 font-bold">Start shoe</button>}
      {running&&<button onClick={stop} className="px-6 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-bold">Stop</button>}
      {guessMode&&(<div className="flex flex-col items-center gap-3"><span className="text-amber-200">Running count?</span><input type="number" value={userGuess} onChange={e=>setUserGuess(e.target.value)} onKeyDown={e=>e.key==='Enter'&&userGuess!==''&&submit()} autoFocus className="w-24 text-center bg-emerald-900 border border-amber-600/40 rounded px-2 py-2 text-amber-100 text-lg"/><button onClick={submit} className="px-6 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-emerald-950 font-bold">Submit</button></div>)}
      {result&&(<div className="flex flex-col items-center gap-3"><div className={`px-4 py-2 rounded-lg font-bold ${result.ok?'bg-emerald-600':'bg-rose-700'} text-white`}>{result.ok?'✓ Correct!':`✗ Actual: ${result.actual} (you said ${result.guess})`}</div><div className="text-amber-200/70 text-sm">True count: {result.tc}</div><button onClick={start} className="px-6 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-emerald-950 font-bold">New shoe →</button></div>)}
      <div className="text-amber-200/40 text-xs text-center">Hi-Lo: 2–6 = +1 · 7–9 = 0 · 10/J/Q/K/A = −1</div>
    </div>
  );
}

// ─── True Count Trainer ───────────────────────────────────────────────
function TrueCountTrainer(){
  const DO=[0.5,1,1.5,2,2.5,3,3.5,4,5,6];const[rc,setRc]=useState(0);const[dl,setDl]=useState(2);const[ua,setUa]=useState('');const[fb,setFb]=useState(null);const[stats,setStats]=useState({c:0,t:0});
  function ns(){setRc(Math.floor(Math.random()*21)-10);setDl(DO[Math.floor(Math.random()*DO.length)]);setUa('');setFb(null);}
  useEffect(()=>{ns();},[]);
  function sub(){const g=parseFloat(ua);const actual=rc/dl;const rounded=Math.round(actual*2)/2;const ok=Math.abs(g-rounded)<0.3;setStats(s=>({c:s.c+(ok?1:0),t:s.t+1}));setFb({ok,rounded,exact:actual.toFixed(2)});playTone(ok?'correct':'wrong');}
  const acc=stats.t?Math.round(stats.c/stats.t*100):0;
  return(
    <div className="flex flex-col items-center gap-6 max-w-md mx-auto">
      <div className="text-amber-200/60 text-sm text-center">True Count = Running Count ÷ Decks Remaining<br/><span className="text-xs text-amber-200/40">Round to nearest 0.5</span></div>
      <div className="flex gap-12 justify-center">
        <div className="flex flex-col items-center gap-1"><span className="text-amber-300/60 text-xs uppercase tracking-widest">Running Count</span><span className={`text-4xl font-black ${rc>0?'text-emerald-400':rc<0?'text-rose-400':'text-amber-200'}`}>{rc>0?`+${rc}`:rc}</span></div>
        <div className="flex flex-col items-center gap-1"><span className="text-amber-300/60 text-xs uppercase tracking-widest">Decks Left</span><span className="text-4xl font-black text-amber-200">{dl}</span></div>
      </div>
      {!fb?(<div className="flex flex-col items-center gap-3"><span className="text-amber-200">True count:</span><input type="number" step="0.5" value={ua} onChange={e=>setUa(e.target.value)} onKeyDown={e=>e.key==='Enter'&&ua!==''&&sub()} autoFocus placeholder="e.g. +2.5" className="w-28 text-center bg-emerald-900 border border-amber-600/40 rounded px-2 py-2 text-amber-100 text-lg"/><button onClick={sub} disabled={ua===''} className="px-6 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-emerald-950 font-bold">Submit</button></div>)
      :(<div className="flex flex-col items-center gap-3 text-center"><div className={`px-4 py-2 rounded-lg font-bold ${fb.ok?'bg-emerald-600':'bg-rose-700'} text-white`}>{fb.ok?'✓ Correct!':`✗ Answer: ${fb.rounded>0?'+':''}${fb.rounded}`}</div>{!fb.ok&&<p className="text-amber-200/70 text-xs">{rc} ÷ {dl} = {fb.exact} → rounded to {fb.rounded>0?'+':''}${fb.rounded}</p>}<button onClick={ns} className="px-6 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-emerald-950 font-bold">Next →</button></div>)}
      <div className="text-amber-200/60 text-sm">Accuracy: <b className="text-amber-300">{acc}%</b> ({stats.c}/{stats.t})</div>
    </div>
  );
}

// ─── Deviation Trainer ────────────────────────────────────────────────
function DeviationTrainer(){
  const[sc,setSc]=useState(null);const[tc,setTc]=useState(0);const[fb,setFb]=useState(null);const[stats,setStats]=useState({c:0,t:0});
  function ns(){setSc(DEVIATIONS[Math.floor(Math.random()*DEVIATIONS.length)]);setTc(Math.floor(Math.random()*13)-4);setFb(null);}
  useEffect(()=>{ns();},[]);
  function ans(dev){if(!sc)return;const should=sc.dir==='gte'?tc>=sc.threshold:tc<=sc.threshold;const ok=dev===should;setStats(s=>({c:s.c+(ok?1:0),t:s.t+1}));setFb({ok,should,sc,tc});playTone(ok?'correct':'wrong');}
  if(!sc)return null;const acc=stats.t?Math.round(stats.c/stats.t*100):0;
  return(
    <div className="flex flex-col items-center gap-5 max-w-md mx-auto">
      <div className="text-amber-200/50 text-xs text-center">Should you deviate from basic strategy?</div>
      <div className="bg-emerald-950/60 rounded-xl border border-amber-600/20 p-4 w-full text-center"><div className="text-amber-300 font-bold text-lg mb-1">{sc.label}</div><div className="text-amber-200/60 text-sm">Basic: <span className="text-amber-200">{sc.basic}</span></div><div className="text-amber-200/60 text-sm">Deviation: <span className="text-emerald-400 font-semibold">{sc.dev}</span></div></div>
      <div className="flex flex-col items-center gap-1"><span className="text-amber-300/60 text-xs uppercase tracking-widest">True Count</span><span className={`text-4xl font-black ${tc>0?'text-emerald-400':tc<0?'text-rose-400':'text-amber-200'}`}>{tc>0?`+${tc}`:tc}</span></div>
      {!fb?(<div className="flex gap-3 flex-wrap justify-center"><button onClick={()=>ans(true)} className="px-4 py-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm">Deviate → {sc.dev}</button><button onClick={()=>ans(false)} className="px-4 py-3 rounded-lg bg-stone-700 hover:bg-stone-600 text-white font-bold text-sm">Basic → {sc.basic.split('/')[0].trim()}</button></div>)
      :(<div className="flex flex-col items-center gap-3 text-center max-w-xs"><div className={`px-4 py-2 rounded-lg font-bold ${fb.ok?'bg-emerald-600':'bg-rose-700'} text-white`}>{fb.ok?`✓ Correct — ${fb.should?'deviate':'stick to basic'}`:`✗ Should ${fb.should?'deviate':'stick to basic'}`}</div><p className="text-amber-200/70 text-xs leading-relaxed">{sc.explain}</p><p className="text-amber-300/50 text-xs">Triggers when TC {sc.dir==='gte'?'≥':'≤'} {sc.threshold>0?`+${sc.threshold}`:sc.threshold}</p><button onClick={ns} className="px-6 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-emerald-950 font-bold">Next →</button></div>)}
      <div className="text-amber-200/60 text-sm">Accuracy: <b className="text-amber-300">{acc}%</b> ({stats.c}/{stats.t})</div>
    </div>
  );
}

// ─── Combined Trainer ─────────────────────────────────────────────────
function CombinedTrainer(){
  const[phase,setPhase]=useState('play');const[dUp,setDUp]=useState(null);const[pCards,setPCards]=useState([]);const[extras,setExtras]=useState([]);const[fb,setFb]=useState(null);const[cGuess,setCGuess]=useState('');const[cFb,setCFb]=useState(null);const[distraction,setDistraction]=useState(false);const[stats,setStats]=useState({p:{c:0,t:0},r:{c:0,t:0}});
  const dRef=useRef(null);
  useEffect(()=>{if(distraction){const f=()=>{speak(CHATTER[Math.floor(Math.random()*CHATTER.length)]);dRef.current=setTimeout(f,3500+Math.random()*4000);};dRef.current=setTimeout(f,1500);}else{clearTimeout(dRef.current);try{window.speechSynthesis?.cancel();}catch(e){}}return()=>{clearTimeout(dRef.current);try{window.speechSynthesis?.cancel();}catch(e){};};},[distraction]);
  function nh(){setExtras(Array.from({length:Math.floor(Math.random()*5)+2},randomCard));setDUp(randomCard());setPCards([randomCard(),randomCard()]);setPhase('play');setFb(null);setCGuess('');setCFb(null);}
  useEffect(()=>{nh();},[]);
  function rc(cards){return cards.reduce((s,c)=>s+hiLoValue(c.rank),0);}
  function hp(action){if(!dUp)return;const r=getCorrectAction(pCards,dUp.rank);const ok=action===r.action;const ex=explainAction(pCards,dUp.rank,r.action,r.isPair,r.isSoft,r.total);setStats(s=>({...s,p:{c:s.p.c+(ok?1:0),t:s.p.t+1}}));setFb({ok,correct:r.action,ex});playTone(ok?'correct':'wrong');setPhase('count');}
  function sc(){const g=parseInt(cGuess);const all=[...extras,dUp,...pCards];const actual=rc(all);const ok=g===actual;setStats(s=>({...s,r:{c:s.r.c+(ok?1:0),t:s.r.t+1}}));setCFb({ok,actual});playTone(ok?'correct':'wrong');setPhase('result');}
  if(!dUp)return null;
  const all=[...extras,dUp,...pCards];const pAcc=stats.p.t?Math.round(stats.p.c/stats.p.t*100):0;const rAcc=stats.r.t?Math.round(stats.r.c/stats.r.t*100):0;
  return(
    <div className="flex flex-col items-center gap-5 max-w-md mx-auto">
      <div className="flex items-center justify-between w-full"><div className="text-amber-200/50 text-xs">Count ALL visible cards · Make correct play</div><button onClick={()=>setDistraction(d=>!d)} className={`px-2 py-1 rounded text-xs font-bold border ${distraction?'bg-rose-700 border-rose-500 text-white':'bg-emerald-900 border-amber-600/20 text-amber-200/60'}`}>🗣 {distraction?'ON':'OFF'}</button></div>
      <div className="flex flex-col items-center gap-1 w-full"><span className="text-amber-300/40 text-xs uppercase tracking-widest">Already dealt</span><div className="flex flex-wrap gap-1.5 justify-center">{extras.map((c,i)=><Card key={i} card={c} small/>)}</div></div>
      <div className="w-full border-t border-amber-600/10"></div>
      <div className="flex gap-8 justify-center"><div className="flex flex-col items-center gap-1"><span className="text-amber-300/60 text-xs uppercase tracking-widest">Dealer</span><Card card={dUp}/></div><div className="flex flex-col items-center gap-1"><span className="text-amber-300/60 text-xs uppercase tracking-widest">Your hand</span><div className="flex gap-1.5">{pCards.map((c,i)=><Card key={i} card={c}/>)}</div></div></div>
      {phase==='play'&&<div className="grid grid-cols-5 gap-2 w-full">{ACTION_KEYS.map(a=><button key={a.key} onClick={()=>hp(a.key)} className="py-3 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-amber-100 font-semibold text-sm border border-amber-600/30">{a.label}</button>)}</div>}
      {(phase==='count'||phase==='result')&&fb&&(<div className={`w-full px-3 py-2 rounded-lg text-sm text-center ${fb.ok?'bg-emerald-800/50':'bg-rose-900/40'}`}><span className="font-bold text-white">{fb.ok?`✓ ${ACTION_LABEL[fb.correct]}`:`✗ Should be: ${ACTION_LABEL[fb.correct]}`}</span><p className="text-amber-200/60 text-xs mt-1">{fb.ex}</p></div>)}
      {phase==='count'&&(<div className="flex flex-col items-center gap-3"><span className="text-amber-200 text-sm">Running count of all {all.length} visible cards?</span><input type="number" value={cGuess} onChange={e=>setCGuess(e.target.value)} onKeyDown={e=>e.key==='Enter'&&cGuess!==''&&sc()} autoFocus className="w-24 text-center bg-emerald-900 border border-amber-600/40 rounded px-2 py-2 text-amber-100 text-lg"/><button onClick={sc} disabled={cGuess===''} className="px-6 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-emerald-950 font-bold">Submit</button></div>)}
      {phase==='result'&&cFb&&(<div className="flex flex-col items-center gap-3"><div className={`px-4 py-2 rounded-lg font-bold ${cFb.ok?'bg-emerald-600':'bg-rose-700'} text-white`}>{cFb.ok?`✓ Count: ${cFb.actual>0?'+':''}${cFb.actual}`:`✗ Count was ${cFb.actual>0?'+':''}${cFb.actual}`}</div><button onClick={nh} className="px-6 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-emerald-950 font-bold">Next →</button></div>)}
      <div className="flex gap-4 text-amber-200/60 text-xs"><span>Strategy: <b className="text-amber-300">{pAcc}%</b> ({stats.p.c}/{stats.p.t})</span><span>Count: <b className="text-amber-300">{rAcc}%</b> ({stats.r.c}/{stats.r.t})</span></div>
    </div>
  );
}

// ─── Paper Trading ────────────────────────────────────────────────────
function PaperTrading(){
  const UNIT=10;const shoeR=useRef([]);const idxR=useRef(0);const rcR=useRef(0);
  const[bankroll,setBankroll]=useState(500);const[bet,setBet]=useState(10);const[pH,setPH]=useState([]);const[dH,setDH]=useState([]);const[phase,setPhase]=useState('betting');const[result,setResult]=useState(null);const[dRC,setDRC]=useState(0);const[dTC,setDTC]=useState(0);const[dDL,setDDL]=useState(6);const[stats,setStats]=useState({h:0,w:0,p:0});const[hist,setHist]=useState([]);const[pct,setPct]=useState(0);const[casinoDealKey,setCasinoDealKey]=useState(0);
  function buildShoe(){let c=[];for(let d=0;d<6;d++)RANKS.forEach(r=>SUITS.forEach(s=>c.push({rank:r,suit:s,red:s==='♥'||s==='♦'})));for(let i=c.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[c[i],c[j]]=[c[j],c[i]];}return c;}
  function initShoe(){shoeR.current=buildShoe();idxR.current=0;rcR.current=0;ud();}
  function ud(){const rem=shoeR.current.length-idxR.current;const dl=Math.max(0.5,rem/52);setDRC(rcR.current);setDTC(parseFloat((rcR.current/dl).toFixed(1)));setDDL(parseFloat(dl.toFixed(1)));setPct(Math.round(idxR.current/shoeR.current.length*100));}
  function draw(){if(idxR.current>=shoeR.current.length)return null;const c=shoeR.current[idxR.current++];rcR.current+=hiLoValue(c.rank);ud();return c;}
  useEffect(()=>{initShoe();},[]);
  function recBet(tc){if(tc<=0)return UNIT;if(tc<1)return UNIT*2;if(tc<2)return UNIT*3;if(tc<3)return UNIT*5;return UNIT*8;}
  const rb=recBet(dTC);const sig=dTC>=2?'hot':dTC<=-1?'cold':'neutral';
  function deal(){
    if(idxR.current>shoeR.current.length*0.75)initShoe();
    const c1=draw(),c2=draw(),d1=draw(),d2=draw();if(!c1)return;
    const ph=[c1,c2],dh=[d1,d2];setPH(ph);setDH(dh);setPhase('playing');setResult(null);
    setCasinoDealKey(k=>k+1);
    [0, 320, 640, 960].forEach(ms=>setTimeout(playDealSound,ms));
    if(handTotal(ph)===21){resolve(ph,dh,true);}
  }
  function hit(){const c=draw();if(!c)return;const nh=[...pH,c];setPH(nh);playDealSound();if(handTotal(nh)>=21)resolve(nh,dH,false);}
  function stand(){resolve(pH,dH,false);}
  function dbl(){if(bet*2>bankroll)return;setBet(b=>b*2);const c=draw();if(!c)return;const nh=[...pH,c];setPH(nh);resolve(nh,dH,false);}
  function resolve(ph,dh,nat){
    let dc=[...dh];const pt=handTotal(ph);
    if(pt<=21&&!nat){while(handTotal(dc)<17){const c=draw();if(!c)break;dc.push(c);}}
    setDH(dc);const dt=handTotal(dc);
    let out;if(pt>21)out='bust';else if(nat&&dt!==21)out='bj';else if(dt>21)out='win';else if(pt>dt)out='win';else if(pt<dt)out='lose';else out='push';
    const ba=bet;let profit=out==='bj'?Math.floor(ba*1.5):out==='win'?ba:out==='lose'||out==='bust'?-ba:0;
    setBankroll(b=>b+profit);setStats(s=>({h:s.h+1,w:s.w+(out==='win'||out==='bj'?1:0),p:s.p+profit}));
    setHist(h=>[...h.slice(-11),{out,profit}]);setResult({out,profit,pt,dt:handTotal(dc)});setPhase('result');
    playTone(profit>0?'correct':profit<0?'wrong':'correct');
  }
  function next(){setBet(UNIT);setPhase('betting');}
  function reset(){initShoe();setBankroll(500);setStats({h:0,w:0,p:0});setHist([]);setPhase('betting');setPH([]);setDH([]);setResult(null);}
  const wr=stats.h?Math.round(stats.w/stats.h*100):0;
  return(
    <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
      <div className="w-full grid grid-cols-3 gap-2">
        <div className="bg-emerald-950/60 rounded-xl border border-amber-600/20 p-3 text-center"><div className="text-amber-300/60 text-xs uppercase tracking-widest">Bankroll</div><div className={`text-xl font-black ${bankroll>=500?'text-emerald-400':'text-rose-400'}`}>${bankroll}</div></div>
        <div className={`rounded-xl border p-3 text-center ${sig==='hot'?'bg-emerald-900/60 border-emerald-500/40':sig==='cold'?'bg-rose-900/40 border-rose-500/20':'bg-emerald-950/60 border-amber-600/20'}`}><div className="text-amber-300/60 text-xs uppercase tracking-widest">True Count</div><div className={`text-xl font-black ${sig==='hot'?'text-emerald-400':sig==='cold'?'text-rose-400':'text-amber-200'}`}>{dTC>0?'+':''}{dTC}</div></div>
        <div className="bg-emerald-950/60 rounded-xl border border-amber-600/20 p-3 text-center"><div className="text-amber-300/60 text-xs uppercase tracking-widest">Session P/L</div><div className={`text-xl font-black ${stats.p>=0?'text-emerald-400':'text-rose-400'}`}>{stats.p>=0?'+':''}{stats.p}</div></div>
      </div>
      {sig==='hot'&&<div className="w-full bg-emerald-800/50 border border-emerald-500/40 rounded-lg px-3 py-2 text-center"><span className="text-emerald-300 font-bold text-sm">🔥 Hot deck — bet ${rb}</span><span className="text-emerald-300/50 text-xs ml-2">(TC {dTC>0?'+':''}{dTC})</span></div>}
      {sig==='cold'&&<div className="w-full bg-rose-900/30 border border-rose-500/20 rounded-lg px-3 py-2 text-center"><span className="text-rose-300 text-sm">❄️ Cold deck — bet minimum ${UNIT} or sit out</span></div>}
      {sig==='neutral'&&phase==='betting'&&<div className="w-full bg-stone-800/30 border border-stone-600/20 rounded-lg px-3 py-2 text-center"><span className="text-amber-200/50 text-xs">Neutral shoe · Recommended bet: ${rb} · RC: {dRC>0?'+':''}{dRC}</span></div>}
      <div className="w-full"><div className="flex justify-between text-amber-200/30 text-xs mb-1"><span>Shoe: {pct}% dealt</span><span>{dDL} decks left</span></div><div className="w-full bg-emerald-950 rounded-full h-1.5"><div className="bg-amber-500 h-1.5 rounded-full transition-all" style={{width:`${pct}%`}}></div></div>{pct>70&&<div className="text-amber-300/50 text-xs text-center mt-1">♻️ Reshuffle approaching</div>}</div>
      {dH.length>0&&(<div className="flex flex-col items-center gap-1"><span className="text-amber-300/60 text-xs uppercase tracking-widest">Dealer {phase==='playing'?'(?)':phase!=='betting'?`(${handTotal(dH)})`:''}  </span><div className="flex gap-2">{dH.map((c,i)=><Card key={`cd-${casinoDealKey}-${i}`} card={c} hidden={i===1&&phase==='playing'} deal dealDelay={i===0?0.32:0.96}/>)}</div></div>)}
      {pH.length>0&&(<div className="flex flex-col items-center gap-1"><span className="text-amber-300/60 text-xs uppercase tracking-widest">You ({handTotal(pH)})</span><div className="flex gap-2 flex-wrap justify-center">{pH.map((c,i)=><Card key={`cp-${casinoDealKey}-${i}`} card={c} deal={i>=pH.length-1} dealDelay={pH.length===2?(i===0?0:0.64):0}/>)}</div></div>)}
      {phase==='betting'&&(<div className="flex flex-col items-center gap-3 w-full"><div className="flex justify-between w-full px-1 text-xs text-amber-200/50"><span>Your bet: <b className="text-amber-200">${bet}</b></span><span className={sig==='hot'?'text-emerald-400':'text-amber-200/30'}>Rec: ${rb}</span></div><div className="flex gap-2 flex-wrap justify-center">{[10,20,30,40,50,60,70,80].map(b=><button key={b} onClick={()=>setBet(b)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${bet===b?'bg-amber-600 text-emerald-950':'bg-emerald-900 text-amber-200/60 border border-amber-600/20'}`}>${b}</button>)}</div><button onClick={deal} disabled={bet>bankroll||bankroll<=0} className="px-8 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-emerald-950 font-bold text-lg w-full">Deal — Bet ${bet}</button>{bankroll<=0&&<button onClick={reset} className="px-4 py-2 rounded-lg bg-rose-700 text-white text-sm font-bold">Reset session</button>}</div>)}
      {phase==='playing'&&<div className="flex gap-2 w-full"><button onClick={hit} className="flex-1 py-3 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-amber-100 font-bold">Hit</button><button onClick={stand} className="flex-1 py-3 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-amber-100 font-bold">Stand</button><button onClick={dbl} disabled={bet*2>bankroll||pH.length>2} className="flex-1 py-3 rounded-lg bg-emerald-800 hover:bg-emerald-700 disabled:opacity-30 text-amber-100 font-bold text-sm">Double</button></div>}
      {phase==='result'&&result&&(<div className="flex flex-col items-center gap-3 w-full"><div className={`w-full py-3 rounded-xl font-bold text-lg text-center ${result.out==='bj'?'bg-amber-500 text-emerald-950':result.out==='win'?'bg-emerald-600 text-white':result.out==='push'?'bg-stone-600 text-white':'bg-rose-700 text-white'}`}>{result.out==='bj'?`🎰 Blackjack! +$${result.profit}`:result.out==='win'?`✓ Win +$${result.profit}`:result.out==='push'?'↔ Push':`✗ ${result.out==='bust'?'Bust':'Lose'} -$${Math.abs(result.profit)}`}</div><div className="text-amber-200/50 text-xs">You: {result.pt} · Dealer: {result.dt}</div><button onClick={next} className="px-8 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-emerald-950 font-bold w-full">Next hand →</button></div>)}
      {hist.length>0&&<div className="flex gap-1 flex-wrap justify-center">{hist.map((h,i)=><span key={i} className={`text-xs px-1.5 py-0.5 rounded font-bold ${h.profit>0?'bg-emerald-800 text-emerald-300':h.profit===0?'bg-stone-700 text-stone-300':'bg-rose-900 text-rose-300'}`}>{h.profit>0?'+':''}{h.profit}</span>)}</div>}
      <div className="flex gap-4 text-amber-200/40 text-xs"><span>Hands: <b className="text-amber-300">{stats.h}</b></span><span>Win rate: <b className="text-amber-300">{wr}%</b></span><button onClick={reset} className="text-amber-300/30 hover:text-amber-300 underline">Reset</button></div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────
export default function App(){
  const[tab,setTab]=useState('strategy');
  const[gs,setGs]=useState(null);
  const[xpBurst,setXpBurst]=useState(null);
  const[levelUp,setLevelUp]=useState(null);
  const gsRef=useRef(null);

  useEffect(()=>{
    injectDealStyles();
    loadGs().then(data=>{
      // Check streak on load
      const today=new Date().toISOString().slice(0,10);
      if(data.lastPlayDate&&data.lastPlayDate!==today){
        const yest=new Date(Date.now()-86400000).toISOString().slice(0,10);
        if(data.lastPlayDate!==yest)data.streak=0;
      }
      setGs(data);gsRef.current=data;
    });
  },[]);

  async function persistGs(newGs){gsRef.current={...newGs};setGs({...newGs});await saveGs(newGs);}

  function handleAnswer(isRight,handKey,handLabel){
    if(!gsRef.current)return;
    const g={...gsRef.current};
    const today=new Date().toISOString().slice(0,10);
    if(g.lastPlayDate!==today){
      if(g.todayDate&&g.todayHands>0){g.sessions=[...(g.sessions||[]).slice(-29),{date:g.todayDate,correct:g.todayCorrect,total:g.todayHands,xp:g.todayXP}];}
      const yest=new Date(Date.now()-86400000).toISOString().slice(0,10);
      if(g.lastPlayDate===yest){g.streak=(g.streak||0)+1;}else{g.streak=g.lastPlayDate?0:0;g.streak=1;}
      if(g.streak>(g.bestStreak||0))g.bestStreak=g.streak;
      g.lastPlayDate=today;g.todayDate=today;g.todayHands=0;g.todayCorrect=0;g.todayXP=0;
    }
    g.totalHands=(g.totalHands||0)+1;g.todayHands=(g.todayHands||0)+1;
    if(isRight){g.totalCorrect=(g.totalCorrect||0)+1;g.todayCorrect=(g.todayCorrect||0)+1;}
    if(handKey){const ex=g.nemesis[handKey]||{wrong:0,total:0,label:handLabel||handKey};g.nemesis={...g.nemesis,[handKey]:{...ex,total:ex.total+1,wrong:ex.wrong+(isRight?0:1),label:handLabel||ex.label}};}
    let xpE=isRight?10:2;let isBonus=false;
    if(isRight){const rnd=Math.random();if(rnd<0.04){xpE=30;isBonus=true;}else if(rnd<0.15){xpE=20;isBonus=true;}if(g.streak>=7)xpE+=3;else if(g.streak>=3)xpE+=1;}
    // Daily goal bonus
    if(isRight&&g.todayCorrect===DAILY_GOAL){xpE+=50;isBonus=true;}
    const prevXP=g.xp||0;g.xp=prevXP+xpE;g.todayXP=(g.todayXP||0)+xpE;
    const prevLv=getLevel(prevXP);const newLv=getLevel(g.xp);
    if(newLv.index>prevLv.index)setTimeout(()=>setLevelUp(newLv),400);
    setXpBurst({amount:xpE,isBonus});setTimeout(()=>setXpBurst(null),1500);
    playTone(isBonus?'bonus':isRight?'correct':'wrong');
    persistGs(g);
  }

  const lv=gs?getLevel(gs.xp):{title:'...',icon:'🎲',color:'text-stone-400',index:0};
  const xpp=gs?xpProgress(gs.xp):{pct:0,toNext:0};
  const today=new Date().toISOString().slice(0,10);
  const todayCorrect=gs&&gs.todayDate===today?gs.todayCorrect||0:0;
  const TABS=[{key:'strategy',label:'Strategy'},{key:'count',label:'Running Count'},{key:'truecount',label:'True Count'},{key:'deviation',label:'Deviation'},{key:'combined',label:'Combined'},{key:'casino',label:'🎰 Casino'},{key:'progress',label:'📈 Progress'}];

  return(
    <div className="min-h-screen bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 flex flex-col items-center py-6 px-4 font-sans">
      {xpBurst&&<XPBurst amount={xpBurst.amount} isBonus={xpBurst.isBonus} onDone={()=>setXpBurst(null)}/>}
      {levelUp&&<LevelUpModal level={levelUp} onClose={()=>setLevelUp(null)}/>}
      <div className="w-full max-w-2xl">
        {/* Header HUD */}
        <div className="flex items-center justify-between mb-4 bg-emerald-950/60 rounded-2xl border border-amber-600/20 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{lv.icon}</span>
            <div><div className={`font-black text-sm ${lv.color}`}>{lv.title}</div><div className="text-amber-200/40 text-xs">{gs?.xp||0} XP</div></div>
          </div>
          <div className="flex-1 mx-4">
            <div className="flex justify-between text-amber-200/30 text-xs mb-1"><span></span>{xpp.toNext>0&&<span>{xpp.toNext} to next</span>}</div>
            <div className="w-full bg-emerald-950 rounded-full h-1.5"><div className="bg-gradient-to-r from-amber-600 to-amber-400 h-1.5 rounded-full transition-all" style={{width:`${xpp.pct}%`}}></div></div>
            <div className="text-amber-200/30 text-xs mt-0.5">Daily goal: {todayCorrect}/{DAILY_GOAL} ✓</div>
          </div>
          <div className="text-center">
            <div className="text-2xl">{(gs?.streak||0)>=7?'🔥':(gs?.streak||0)>=3?'⚡':'📅'}</div>
            <div className="text-amber-300 font-black text-lg leading-none">{gs?.streak||0}</div>
            <div className="text-amber-200/40 text-xs">streak</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4 justify-center">
          {TABS.map(t=><button key={t.key} onClick={()=>setTab(t.key)} className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${tab===t.key?'bg-amber-600 text-emerald-950':'bg-emerald-900 text-amber-200/60 border border-amber-600/20'}`}>{t.label}</button>)}
        </div>

        <div className="bg-emerald-900/40 rounded-2xl border border-amber-600/20 p-5 shadow-2xl">
          {tab==='strategy'&&<StrategyTrainer onAnswer={handleAnswer} nemesis={gs?.nemesis||{}}/>}
          {tab==='count'&&<CountTrainer/>}
          {tab==='truecount'&&<TrueCountTrainer/>}
          {tab==='deviation'&&<DeviationTrainer/>}
          {tab==='combined'&&<CombinedTrainer/>}
          {tab==='casino'&&<PaperTrading/>}
          {tab==='progress'&&<ProgressDashboard gs={gs}/>}
        </div>
        <p className="text-center text-amber-200/20 text-xs mt-4">Dealer stands soft 17 · DAS allowed · 6-deck shoe</p>
      </div>
    </div>
  );
}
