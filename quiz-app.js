(function(){
"use strict";
var $app=document.getElementById("app");
var KIND={m:"Single choice",s:"Select all that apply",w:"Short answer"};
var KEY="frontend-drill-v1";
var store={seen:{},sessions:0,best:null};
try{var raw=localStorage.getItem(KEY);if(raw){var p=JSON.parse(raw);if(p&&typeof p==="object")store=Object.assign(store,p);}}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(store));}catch(e){}}
function hash(s){var h=5381;for(var i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return (h>>>0).toString(36);}
BANK.forEach(function(q){q.id=hash(q.q);});
var TOPICS=[];BANK.forEach(function(q){if(TOPICS.indexOf(q.t)<0)TOPICS.push(q.t);});
function count(f){return BANK.filter(f).length;}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
function inline(s){return esc(s).replace(/`([^`]+)`/g,"<code>$1</code>");}
function qhtml(s){var parts=s.split("\n\n");var out='<p class="qtext">'+inline(parts[0]).replace(/\n/g,"<br>")+"</p>";if(parts.length>1)out+="<pre><code>"+esc(parts.slice(1).join("\n\n"))+"</code></pre>";return out;}
function plainQ(s){return s.split("\n\n")[0].replace(/`/g,"");}

var cfg={n:20,types:{m:true,s:true,w:true},topics:{}};
TOPICS.forEach(function(t){cfg.topics[t]=true;});
var st=null; // active session

function pool(c){return BANK.filter(function(q){return c.types[q.k]&&c.topics[q.t];});}
function pick(c){
  var p=pool(c),n=Math.min(c.n,p.length);
  var kinds=["m","s","w"].filter(function(k){return c.types[k]&&p.some(function(q){return q.k===k;});});
  var w={m:.55,s:.2,w:.25},tot=kinds.reduce(function(a,k){return a+w[k];},0);
  var by={};kinds.forEach(function(k){
    var items=shuffle(p.filter(function(q){return q.k===k;}));
    // unseen questions first, random inside each group
    items=items.filter(function(q){return !store.seen[q.id];}).concat(items.filter(function(q){return store.seen[q.id];}));
    by[k]=items;});
  var res=[],want={};
  kinds.forEach(function(k){want[k]=Math.min(by[k].length,Math.round(n*w[k]/tot));});
  kinds.forEach(function(k){res=res.concat(by[k].splice(0,want[k]));});
  var rest=shuffle([].concat.apply([],kinds.map(function(k){return by[k];})));
  while(res.length<n&&rest.length)res.push(rest.shift());
  while(res.length>n)res.pop();
  return shuffle(res);
}
function prep(q){
  var o={q:q,done:false,res:null};
  if(q.k!=="w"){
    var opts=q.o.map(function(t,i){return {t:t,ok:q.k==="m"?i===0:i<q.r};});
    o.opts=shuffle(opts);o.sel=[];
  }else{o.text="";}
  return o;
}
function start(list){
  st={items:list.map(prep),i:0,t0:Date.now()};
  render();window.scrollTo(0,0);
}

/* ---------- screens ---------- */
function home(){
  var p=pool(cfg),n=Math.min(cfg.n,p.length);
  var seen=BANK.filter(function(q){return store.seen[q.id];}).length;
  var h='<h1>Interview Forge</h1><p class="lede">'+BANK.length+' advanced frontend questions in three formats: single choice, select-all-that-apply and short written answers. Each session draws a new random set, preferring questions you haven\'t seen yet.</p>';
  h+='<div class="panel">';
  h+='<div><h2>Questions per session</h2><div class="row" role="group" aria-label="Questions per session">'+[10,20,30,50].map(function(x){return '<button class="chip num" data-act="n" data-v="'+x+'" aria-pressed="'+(cfg.n===x)+'">'+x+'</button>';}).join("")+'</div></div>';
  h+='<div><h2>Question types</h2><div class="row">'+["m","s","w"].map(function(k){return '<button class="chip" data-act="type" data-v="'+k+'" aria-pressed="'+cfg.types[k]+'">'+KIND[k]+' <small>'+count(function(q){return q.k===k;})+'</small></button>';}).join("")+'</div></div>';
  h+='<div><h2>Topics</h2><div class="row">'+TOPICS.map(function(t){return '<button class="chip" data-act="topic" data-v="'+esc(t)+'" aria-pressed="'+cfg.topics[t]+'">'+esc(t)+' <small>'+count(function(q){return q.t===t;})+'</small></button>';}).join("")+'</div>'+
    '<p class="hint"><button class="linkbtn" data-act="alltopics">All</button> · <button class="linkbtn" data-act="notopics">None</button></p></div>';
  h+='<div class="actions"><button class="btn" data-act="start"'+(p.length?"":" disabled")+'>Start '+n+' questions</button>'+(p.length?'':'<span class="hint">Pick at least one type and topic.</span>')+'</div>';
  h+='<div class="stats"><span>Sessions <b>'+store.sessions+'</b></span><span>Best score <b>'+(store.best==null?"–":store.best+"%")+'</b></span><span>Seen <b>'+seen+'/'+BANK.length+'</b></span>'+(seen||store.sessions?'<button class="linkbtn" data-act="reset">Reset progress</button>':"")+'</div>';
  h+='</div>';
  return h;
}
function cur(){return st.items[st.i];}
function quiz(){
  var it=cur(),q=it.q,total=st.items.length;
  var h='<div class="qhead"><span>Question '+(st.i+1)+' of '+total+'</span><button class="linkbtn" data-act="end">End and see score</button></div>';
  h+='<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="'+total+'" aria-valuenow="'+st.i+'"><div style="width:'+(st.i/total*100)+'%"></div></div>';
  h+='<div class="qcard"><div class="tags"><span class="tag">'+esc(q.t)+'</span><span class="tag type">'+KIND[q.k]+'</span></div>'+qhtml(q.q);
  if(q.k==="w"){
    h+='<textarea id="ans" placeholder="Write your answer in a few sentences. Press Ctrl+Enter to check." aria-label="Your answer"'+(it.done?" disabled":"")+'>'+esc(it.text)+'</textarea>';
    if(it.done)h+=writtenFeedback(it);
  }else{
    h+='<div class="opts'+(q.k==="s"?" multi":"")+'" role="'+(q.k==="m"?"radiogroup":"group")+'" aria-label="Answer options">';
    it.opts.forEach(function(o,i){
      var on=it.sel.indexOf(i)>=0,cls="opt",lab="";
      if(it.done){
        if(on&&o.ok){cls+=" ok";lab="Correct";}
        else if(on&&!o.ok){cls+=" no";lab="Wrong";}
        else if(!on&&o.ok){cls+=" miss";lab=q.k==="s"?"Missed":"Answer";}
      }
      h+='<button class="'+cls+'" data-act="opt" data-i="'+i+'" role="'+(q.k==="m"?"radio":"checkbox")+'" aria-checked="'+on+'"'+(it.done?" disabled":"")+'><span class="mk" aria-hidden="true"></span><span class="tx">'+inline(o.t)+'</span><span class="st">'+(lab||'<span class="key">'+(i+1)+'</span>')+'</span></button>';
    });
    h+='</div>';
    if(q.k==="s"&&!it.done)h+='<p class="hint" style="margin:0">Choose every option that applies.</p>';
    if(it.done)h+=choiceFeedback(it);
  }
  h+='</div>';
  var last=st.i===total-1;
  h+='<div class="foot"><button class="btn ghost" data-act="skip"'+(it.done?" hidden":"")+'>Skip</button><span></span>';
  if(!it.done)h+='<button class="btn" data-act="check"'+(canCheck(it)?"":" disabled")+'>Check answer</button>';
  else h+='<button class="btn" data-act="next">'+(last?"See results":"Next question")+'</button>';
  h+='</div>';
  return h;
}
function canCheck(it){return it.q.k==="w"?it.text.trim().length>0:it.sel.length>0;}
function choiceFeedback(it){
  var ok=it.res===1,q=it.q;
  var msg=ok?"Correct.":(q.k==="s"?"Not quite. Select exactly the right set.":"Not quite.");
  return '<div class="verdict '+(ok?"ok":"no")+'"><strong>'+msg+'</strong>'+(q.e?'<p>'+inline(q.e)+'</p>':"")+'</div>';
}
function coverage(it){
  var t=it.text.toLowerCase();
  return it.q.kw.map(function(g){return {label:g[0],hit:g.some(function(w){return t.indexOf(w)>=0;})};});
}
function writtenFeedback(it){
  var cov=coverage(it),hits=cov.filter(function(c){return c.hit;}).length;
  var h='<div class="model"><h3>Model answer</h3><p>'+inline(it.q.m)+'</p></div>';
  h+='<div><h2 style="margin-bottom:8px">Key ideas in your answer: '+hits+' of '+cov.length+'</h2><div class="ideas">'+cov.map(function(c){return '<span class="idea '+(c.hit?"hit":"miss")+'">'+esc(c.label)+'</span>';}).join("")+'</div><p class="hint">Matching is by keyword, so a good answer in different words can score low. Judge yourself:</p></div>';
  h+='<div class="seg" role="group" aria-label="Rate your answer">'+[["1","I got it"],["0.5","Partly"],["0","Missed it"]].map(function(x){return '<button class="chip" data-act="grade" data-v="'+x[0]+'" aria-pressed="'+(String(it.res)===x[0])+'">'+x[1]+'</button>';}).join("")+'</div>';
  return h;
}
function tally(){
  var r={score:0,answered:0,total:st.items.length,by:{}};
  st.items.forEach(function(it){
    var t=it.q.t;r.by[t]=r.by[t]||{s:0,n:0};r.by[t].n++;
    if(it.done){r.answered++;r.score+=it.res;r.by[t].s+=it.res;}
  });
  return r;
}
function results(){
  var r=tally(),pct=Math.round(r.score/r.total*100);
  var lbl=pct>=85?"Interview ready":pct>=70?"Solid":pct>=50?"Getting there":"Needs more review";
  var h='<h1>Results</h1><div class="panel">';
  h+='<div class="score"><span class="big">'+pct+'%</span><span class="lbl">'+lbl+'</span><span class="hint" style="margin:0">'+(Math.round(r.score*2)/2)+' of '+r.total+' points · '+r.answered+' answered · '+Math.max(1,Math.round((st.end-st.t0)/60000))+' min</span></div>';
  var tps=Object.keys(r.by).sort(function(a,b){return r.by[a].s/r.by[a].n-r.by[b].s/r.by[b].n;});
  h+='<div><h2>By topic, weakest first</h2><div class="topics">'+tps.map(function(t){var b=r.by[t],p=Math.round(b.s/b.n*100);return '<div class="trow"><span>'+esc(t)+'</span><div class="meter"><div style="width:'+p+'%"></div></div><span class="n">'+(Math.round(b.s*2)/2)+'/'+b.n+'</span></div>';}).join("")+'</div></div>';
  var missed=st.items.filter(function(it){return it.res!==1;}).length;
  h+='<div class="actions"><button class="btn" data-act="again">New random session</button>'+(missed?'<button class="btn ghost" data-act="retry">Retry the '+missed+' not fully correct</button>':"")+'<button class="btn ghost" data-act="home">Change settings</button></div></div>';
  h+='<h2 style="margin:26px 0 10px">Review</h2><div class="review">'+st.items.map(function(it,i){return reviewItem(it,i);}).join("")+'</div>';
  return h;
}
function reviewItem(it,i){
  var q=it.q,b=!it.done?["skip","SKIPPED"]:it.res===1?["ok","CORRECT"]:it.res===0.5?["part","PARTLY"]:["no","WRONG"];
  var body=qhtml(q.q),a="";
  if(q.k==="w"){
    a='<p class="ans"><b>Your answer:</b> '+(it.text.trim()?esc(it.text):"(none)")+'</p><div class="model"><h3>Model answer</h3><p>'+inline(q.m)+'</p></div>';
  }else{
    var right=it.opts.filter(function(o){return o.ok;}).map(function(o){return inline(o.t);}).join("; ");
    var mine=it.sel.map(function(i){return inline(it.opts[i].t);}).join("; ")||"(none)";
    a='<p class="ans"><b>Your answer:</b> '+mine+'</p><p class="ans"><b>Correct:</b> '+right+'</p>'+(q.e?'<p class="ans">'+inline(q.e)+'</p>':"");
  }
  return '<details><summary><span class="badge '+b[0]+'">'+b[1]+'</span><span class="qs">'+(i+1)+'. '+esc(plainQ(q.q))+'</span><span class="tag">'+esc(q.t)+'</span></summary><div class="dbody">'+body+a+'</div></details>';
}
function render(){
  var focus=document.activeElement&&document.activeElement.id==="ans";var pos=focus?document.activeElement.selectionStart:0;
  $app.innerHTML=!st?home():st.end?results():quiz();
  if(st&&!st.end&&cur().q.k==="w"&&!cur().done){var ta=document.getElementById("ans");if(ta&&focus){ta.focus();ta.setSelectionRange(pos,pos);}}
}

/* ---------- actions ---------- */
function check(){
  var it=cur();if(it.done||!canCheck(it))return;
  it.done=true;store.seen[it.q.id]=1;save();
  if(it.q.k==="w"){var cov=coverage(it),h=cov.filter(function(c){return c.hit;}).length/cov.length;it.res=h>=.7?1:h>=.4?.5:0;}
  else{var good=it.sel.length===it.opts.filter(function(o){return o.ok;}).length&&it.sel.every(function(i){return it.opts[i].ok;});it.res=good?1:0;}
  render();
}
function next(){
  if(st.i<st.items.length-1){st.i++;render();window.scrollTo(0,0);}else finish();
}
function finish(){
  st.end=Date.now();var r=tally(),pct=Math.round(r.score/r.total*100);
  store.sessions++;if(store.best==null||pct>store.best)store.best=pct;
  st.items.forEach(function(it){if(it.done)store.seen[it.q.id]=1;});save();
  render();window.scrollTo(0,0);
}
document.addEventListener("click",function(e){
  var b=e.target.closest("[data-act]");if(!b||b.disabled)return;
  var a=b.dataset.act,v=b.dataset.v;
  if(a==="n"){cfg.n=+v;}
  else if(a==="type"){cfg.types[v]=!cfg.types[v];}
  else if(a==="topic"){cfg.topics[v]=!cfg.topics[v];}
  else if(a==="alltopics"){TOPICS.forEach(function(t){cfg.topics[t]=true;});}
  else if(a==="notopics"){TOPICS.forEach(function(t){cfg.topics[t]=false;});}
  else if(a==="start"){start(pick(cfg));return;}
  else if(a==="reset"){store={seen:{},sessions:0,best:null};save();}
  else if(a==="opt"){var it=cur(),i=+b.dataset.i;if(it.done)return;
    if(it.q.k==="m")it.sel=[i];else{var k=it.sel.indexOf(i);if(k>=0)it.sel.splice(k,1);else it.sel.push(i);}}
  else if(a==="check"){check();return;}
  else if(a==="next"){next();return;}
  else if(a==="skip"){next();return;}
  else if(a==="grade"){cur().res=+v;}
  else if(a==="end"){finish();return;}
  else if(a==="again"){start(pick(cfg));return;}
  else if(a==="retry"){var list=st.items.filter(function(it){return it.res!==1;}).map(function(it){return it.q;});start(shuffle(list));return;}
  else if(a==="home"){st=null;}
  else if(a==="brand"){st=null;}
  else if(a==="theme"){toggleTheme();return;}
  render();
});
document.addEventListener("input",function(e){
  if(e.target.id==="ans"){var it=cur();it.text=e.target.value;var c=document.querySelector('[data-act="check"]');if(c)c.disabled=!canCheck(it);}
});
document.addEventListener("keydown",function(e){
  if(!st||st.end)return;var it=cur(),t=e.target;
  if(t.id==="ans"){if(e.key==="Enter"&&(e.ctrlKey||e.metaKey)){e.preventDefault();check();}return;}
  if(e.altKey||e.ctrlKey||e.metaKey)return;
  if(/^[1-9]$/.test(e.key)&&it.opts&&!it.done&&+e.key<=it.opts.length){
    var i=+e.key-1;if(it.q.k==="m")it.sel=[i];else{var k=it.sel.indexOf(i);if(k>=0)it.sel.splice(k,1);else it.sel.push(i);}render();
  }else if(e.key==="Enter"&&t.tagName!=="BUTTON"){e.preventDefault();if(it.done)next();else check();}
});
function toggleTheme(){
  var r=document.documentElement,cur=r.getAttribute("data-theme");
  var dark=cur?cur==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;
  r.setAttribute("data-theme",dark?"light":"dark");
  try{localStorage.setItem(KEY+"-theme",dark?"light":"dark");}catch(e){}
}
try{var th=localStorage.getItem(KEY+"-theme");if(th)document.documentElement.setAttribute("data-theme",th);}catch(e){}
render();
})();
