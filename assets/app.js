const T=window.TIMETABLE;
const DAYS=["Monday","Tuesday","Wednesday","Thursday","Friday"];
const SUBJECTS=[...new Set(DAYS.flatMap(d=>T.days[d].map(x=>x[0])))];

let selectedDay = getTodayDay();
let activeView="today";
let deferredInstall=null;

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const mins=t=>{const [h,m]=t.split(":").map(Number);return h*60+m};
const fmt=t=>{let [h,m]=t.split(":").map(Number);const ap=h>=12?"PM":"AM";h=h%12||12;return `${h}:${String(m).padStart(2,"0")} ${ap}`};
const todayName=()=>["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()];
function getTodayDay(){const d=todayName();return DAYS.includes(d)?d:"Monday"}
function nowStatus(day,i){
  if(day!==getTodayDay()) return "future";
  const n=new Date().getHours()*60+new Date().getMinutes(), s=mins(T.slots[i].start), e=mins(T.slots[i].end);
  if(n>=s&&n<e)return"now"; if(n>=e)return"done"; return"up";
}
function greeting(){const h=new Date().getHours();return h<12?"Good morning":h<17?"Good afternoon":"Good evening"}
function showToast(msg){const el=$("#toast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),1800)}
function renderHeader(){
  const d=new Date();
  $("#todayDate").textContent=d.toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  $("#greeting").textContent=greeting();
  const lectures=T.days[selectedDay];
  let idx=-1,label="No more lectures today";
  if(selectedDay===getTodayDay()){
    idx=lectures.findIndex((_,i)=>nowStatus(selectedDay,i)==="now");
    if(idx<0)idx=lectures.findIndex((_,i)=>nowStatus(selectedDay,i)==="up");
    if(idx>=0)label=nowStatus(selectedDay,idx)==="now"?"NOW":"NEXT";
  } else { idx=0; label="SELECTED DAY"; }
  if(idx>=0){
    const x=lectures[idx], s=T.slots[idx];
    $("#nextCard").innerHTML=`<div class="label">${label}</div><h3>${x[0]}</h3><p>${fmt(s.start)} – ${fmt(s.end)}</p><p>${x[1]}${x[2]?" • "+x[2]:""}</p>`;
  } else $("#nextCard").innerHTML=`<div class="label">TODAY</div><h3>Classes finished</h3><p>You're done for the day.</p>`;
}
function renderTabs(){
  $("#dayTabs").innerHTML=DAYS.map(d=>`<button class="${d===selectedDay?"active":""}" data-day="${d}">${d.slice(0,3)}</button>`).join("");
  $$("#dayTabs button").forEach(b=>b.onclick=()=>{selectedDay=b.dataset.day;activeView="today";setView("today");render()});
}
function renderToday(){
  const lectures=T.days[selectedDay];
  $("#scheduleTitle").textContent=`${selectedDay} lectures`;
  $("#schedule").innerHTML=lectures.map((x,i)=>{
    const st=nowStatus(selectedDay,i);
    return `<article class="lecture ${st}">
      <div class="time">${fmt(T.slots[i].start)}<small>to ${fmt(T.slots[i].end)}</small></div>
      <div><div class="subject-name">${x[0]}</div><div class="faculty">${x[1]}</div>${x[2]?`<span class="room">${x[2]}</span>`:""}</div>
      <span class="badge ${st}">${st==="now"?"NOW":st==="done"?"DONE":"UPCOMING"}</span>
    </article>`;
  }).join("");
}
function renderStats(){
  const lectures=T.days[selectedDay], term=lectures.filter(x=>x[0]==="Term Paper").length;
  const present=Object.values(getAttendance()).reduce((a,b)=>a+b,0), total=Object.values(getAttendanceTotal()).reduce((a,b)=>a+b,0);
  const pct=total?Math.round(present/total*100):0;
  $("#stats").innerHTML=`<div class="stat"><strong>${lectures.length}</strong><span>lecture slots</span></div><div class="stat"><strong>${term}</strong><span>term paper slots</span></div><div class="stat"><strong>${pct}%</strong><span>attendance tracked</span></div>`;
}
function renderSubjects(){
  const totals=getAttendanceTotal(), pres=getAttendance();
  $("#subjects").innerHTML=SUBJECTS.map(s=>{
    const t=totals[s]||0,p=pres[s]||0,pct=t?Math.round(p/t*100):0;
    const dayCount=DAYS.filter(d=>T.days[d].some(x=>x[0]===s)).length;
    return `<div class="card"><h3>${s}</h3><p>${dayCount} day${dayCount!==1?"s":""} per week</p><div class="progress"><i style="width:${pct}%"></i></div><p><b>${pct}%</b> attendance • ${p}/${t} marked</p></div>`;
  }).join("");
}
function getAttendance(){return JSON.parse(localStorage.getItem("llm_attendance")||"{}")}
function getAttendanceTotal(){return JSON.parse(localStorage.getItem("llm_attendance_total")||"{}")}
function renderAttendance(){
  const p=getAttendance(),t=getAttendanceTotal();
  $("#attendance").innerHTML=SUBJECTS.map(s=>{
    const total=t[s]||0,present=p[s]||0,pct=total?Math.round(present/total*100):0;
    return `<div class="card"><div class="att-row"><div><h3>${s}</h3><div class="progress"><i style="width:${pct}%"></i></div><p>${present}/${total} present • ${pct}%</p></div><div class="att-actions"><button class="present" onclick="markAttendance('${escapeAttr(s)}',true)">Present</button><button onclick="markAttendance('${escapeAttr(s)}',false)">Absent</button></div></div></div>`;
  }).join("");
}
function escapeAttr(s){return s.replaceAll("'","&#39;")}
window.markAttendance=function(s,present){
  const clean=s.replaceAll("&#39;","'");
  const a=getAttendance(),t=getAttendanceTotal();a[clean]=(a[clean]||0)+(present?1:0);t[clean]=(t[clean]||0)+1;
  localStorage.setItem("llm_attendance",JSON.stringify(a));localStorage.setItem("llm_attendance_total",JSON.stringify(t));
  render();showToast(present?"Attendance marked present":"Attendance marked absent");
}
function renderWeek(){
  let html='<div class="week-table"><div class="week-grid"><div class="week-head">Day</div>'+T.slots.map(s=>`<div class="week-head">${fmt(s.start)}</div>`).join("");
  DAYS.forEach(d=>{html+=`<div class="week-day">${d}</div>`;T.days[d].forEach(x=>html+=`<div><b>${x[0]}</b><br><span class="muted">${x[2]||""}</span></div>`)});html+='</div></div>';
  $("#week").innerHTML=html;
}
function loadNotes(){$("#notes").value=localStorage.getItem("llm_notes")||""}
function setView(view){
  activeView=view;
  ["today","week","subjects","attendance","notes"].forEach(v=>{
    const section=v==="today"?$("#todaySection"):$("#"+v+"Section");
    if(section)section.classList.toggle("hidden",v!==view);
  });
  $$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  if(view==="notes")loadNotes();
}
function render(){renderHeader();renderTabs();renderToday();renderStats();renderSubjects();renderAttendance();renderWeek()}
$("#refreshBtn").onclick=()=>{render();showToast("Updated")}
$("#resetAttendance").onclick=()=>{if(confirm("Reset all attendance records?")){localStorage.removeItem("llm_attendance");localStorage.removeItem("llm_attendance_total");render()}}
$("#saveNotes").onclick=()=>{localStorage.setItem("llm_notes",$("#notes").value);showToast("Notes saved on this device")}
$$(".nav-item").forEach(b=>b.onclick=()=>setView(b.dataset.view));
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;$("#installBtn").hidden=false});
$("#installBtn").onclick=async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;$("#installBtn").hidden=true};
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
render();setView("today");setInterval(render,60000);
