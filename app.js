/* ΥΔΕ Studio v5.1.0 — engineering core (boots via startApp after auth) */

/* ==== 01_data.js ==== */
/* ===========================================================
   01 — ΒΑΣΕΙΣ ΔΕΔΟΜΕΝΩΝ
   =========================================================== */

/* Τυποποιημένες παροχές ΧΤ ΔΕΔΔΗΕ.
   Κριτήρια ακεραιότητας (IEC 60364-4-43 §433 / ΕΛΟΤ HD 384):
     I_ασφ.παροχής ≤ Iz(καλωδίου)   και   I_γενικού ≤ Iz(καλωδίου)
   Επεξεργάσιμος από τον χρήστη (Ρυθμίσεις → Πίνακας παροχών). */
const PAROXES = [
 {id:'M1', lbl:'Νο 1 — Μονοφασική',  ph:1, kVA:8,   fuse:35,  gen:40,  cable:'3×10',  S:10,  meth:'C'},
 {id:'T1', lbl:'Νο 1 — Τριφασική',   ph:3, kVA:15,  fuse:25,  gen:32,  cable:'5×6',   S:6,   meth:'C'},
 {id:'T2', lbl:'Νο 2 — Τριφασική',   ph:3, kVA:25,  fuse:35,  gen:50,  cable:'5×10',  S:10,  meth:'C'},
 {id:'T3', lbl:'Νο 3 — Τριφασική',   ph:3, kVA:35,  fuse:50,  gen:63,  cable:'5×16',  S:16,  meth:'C'},
 {id:'T4', lbl:'Νο 4 — Τριφασική',   ph:3, kVA:55,  fuse:80,  gen:80,  cable:'5×25',  S:25,  meth:'C'},
 {id:'T5', lbl:'Νο 5 — Τριφασική',   ph:3, kVA:85,  fuse:125, gen:125, cable:'5×50',  S:50,  meth:'C'},
 {id:'T6', lbl:'Νο 6 — Τριφασική',   ph:3, kVA:135, fuse:200, gen:200, cable:'5×95',  S:95,  meth:'C'},
 {id:'T7', lbl:'Νο 7 — Τριφασική',   ph:3, kVA:250, fuse:315, gen:250, cable:'2×(4×95+50)', S:95, par:2, meth:'C'}
];

/* Επιτρεπόμενες εντάσεις Iz (A) — χαλκός, μόνωση PVC (J1VV / NYY), θ=30°C αέρας / 20°C έδαφος
   Πηγή: IEC 60364-5-52 / ΕΛΟΤ HD 384 πίν. B.52.4 (μέθοδοι B, C, D, E) */
const S_LIST=[1.5,2.5,4,6,10,16,25,35,50,70,95,120,150,185];
const IZ={
 /* 3 φορτισμένοι αγωγοί (τριφασικό) */
 3:{B:[13.5,18,24,31,42,56,73,89,108,136,164,188,216,245],
    C:[17.5,24,32,41,57,76,96,119,144,184,223,259,299,341],
    D:[22,29,38,47,63,81,104,125,148,183,216,246,278,312],
    E:[18.5,25,34,43,60,80,101,126,153,196,238,276,319,364]},
 /* 2 φορτισμένοι αγωγοί (μονοφασικό) */
 2:{B:[16.5,23,30,38,52,69,90,111,133,168,201,232,258,294],
    C:[19.5,27,36,46,63,85,112,138,168,213,258,299,344,392],
    D:[26,34,44,56,73,95,121,146,173,213,252,287,324,363],
    E:[22,30,40,51,70,94,119,148,180,232,282,328,379,434]}
};
const METHODS={B:'B — εντός σωλήνα/καναλιού',C:'C — επί επιφανείας / σε σχάρα',D:'D — υπόγειο (εντός γης)',E:'E — ελεύθερα στον αέρα'};
/* Συντελεστές διόρθωσης θερμοκρασίας (PVC) */
const K_TEMP={25:1.06,30:1.00,35:0.94,40:0.87,45:0.79,50:0.71,55:0.61};
const K_TEMP_GND={15:1.05,20:1.00,25:0.95,30:0.89,35:0.84,40:0.77};
/* Ομαδοποίηση */
const K_GROUP={1:1.00,2:0.80,3:0.70,4:0.65,5:0.60,6:0.57,7:0.54,8:0.52,9:0.50};

const MCB=[6,10,13,16,20,25,32,40,50,63,80,100,125,160,200,250];
const CURVES={B:{k:5,lbl:'B (5×In) — φωτισμός, ωμικά, μεγάλα μήκη'},C:{k:10,lbl:'C (10×In) — γενική χρήση, μικρά επαγωγικά'},D:{k:20,lbl:'D (20×In) — μετασχηματιστές, κινητήρες'}};
const RCD_I=[10,30,100,300,500];
const RHO_CU=0.0225;      /* Ω·mm²/m στους 20°C */
const RHO_CU_H=0.0275;    /* θερμό, για βρόχο σφάλματος (~70°C) */
const U0=230, UL=400;

/* Βιβλιοθήκη φορτίων ανά τύπο χώρου */
const LOADS={
 apartment:[
  {n:'Γενικός φωτισμός',      p:0.8, ph:1, mcb:10, S:1.5, rcd:30, cat:'Φ'},
  {n:'Ρευματοδότες γενικοί',  p:2.0, ph:1, mcb:16, S:2.5, rcd:30, cat:'Ρ'},
  {n:'Ρευματοδότες κουζίνας', p:2.0, ph:1, mcb:16, S:2.5, rcd:30, cat:'Ρ'},
  {n:'Ηλεκτρική κουζίνα',     p:8.0, ph:3, mcb:20, S:4,   rcd:30, cat:'Σ'},
  {n:'Θερμοσίφωνας',          p:4.0, ph:1, mcb:20, S:4,   rcd:30, cat:'Σ'},
  {n:'Πλυντήριο ρούχων',      p:2.2, ph:1, mcb:16, S:2.5, rcd:30, cat:'Σ'},
  {n:'Πλυντήριο πιάτων',      p:2.2, ph:1, mcb:16, S:2.5, rcd:30, cat:'Σ'},
  {n:'Κλιματιστικό',          p:1.5, ph:1, mcb:16, S:2.5, rcd:30, cat:'Κ'}],
 school:[
  {n:'Φωτισμός αίθουσας',     p:0.6, ph:1, mcb:10, S:1.5, rcd:30, cat:'Φ'},
  {n:'Ρευματοδότες αίθουσας', p:1.5, ph:1, mcb:16, S:2.5, rcd:30, cat:'Ρ'},
  {n:'Κλιματισμός αίθουσας',  p:2.5, ph:1, mcb:16, S:2.5, rcd:30, cat:'Κ'},
  {n:'Φωτισμός διαδρόμων',    p:1.0, ph:1, mcb:10, S:1.5, rcd:30, cat:'Φ'},
  {n:'Φωτισμός ασφαλείας',    p:0.3, ph:1, mcb:6,  S:1.5, rcd:0,  cat:'Φ'},
  {n:'Προβολή/Εποπτικά',      p:1.0, ph:1, mcb:16, S:2.5, rcd:30, cat:'Ρ'}],
 municipal:[
  {n:'Φωτισμός γραφείων',     p:1.2, ph:1, mcb:10, S:1.5, rcd:30, cat:'Φ'},
  {n:'Ρευματοδότες γραφείων', p:2.0, ph:1, mcb:16, S:2.5, rcd:30, cat:'Ρ'},
  {n:'Κλιματισμός',           p:3.5, ph:3, mcb:16, S:2.5, rcd:30, cat:'Κ'},
  {n:'Data / UPS',            p:1.5, ph:1, mcb:16, S:2.5, rcd:30, cat:'Ρ'},
  {n:'Ανελκυστήρας',          p:7.5, ph:3, mcb:25, S:6,   rcd:300,cat:'Μ'},
  {n:'Αντλία / Πιεστικό',     p:2.2, ph:3, mcb:16, S:2.5, rcd:30, cat:'Μ'},
  {n:'Φωτισμός ασφαλείας',    p:0.4, ph:1, mcb:6,  S:1.5, rcd:0,  cat:'Φ'}],
 small:[
  {n:'Φωτισμός',              p:1.0, ph:1, mcb:10, S:1.5, rcd:30, cat:'Φ'},
  {n:'Ρευματοδότες',          p:2.0, ph:1, mcb:16, S:2.5, rcd:30, cat:'Ρ'},
  {n:'Κλιματισμός',           p:2.5, ph:1, mcb:16, S:2.5, rcd:30, cat:'Κ'},
  {n:'Θερμοσίφωνας',          p:4.0, ph:1, mcb:20, S:4,   rcd:30, cat:'Σ'}]
};

/* Πρότυπα κτιρίων: δέντρο πινάκων που στήνεται με ένα κλικ */
const TPL={
 apartment:{lbl:'Διαμέρισμα / Κατοικία', ks:0.75, sub:[],
   circuits:['Γενικός φωτισμός','Ρευματοδότες γενικοί','Ρευματοδότες κουζίνας','Ηλεκτρική κουζίνα','Θερμοσίφωνας','Πλυντήριο ρούχων','Κλιματιστικό']},
 small:{lbl:'Μικρό δημοτικό κτίριο', ks:0.8, sub:[{n:'Υ.Π. Ισογείου',c:['Φωτισμός','Ρευματοδότες','Κλιματισμός']}],
   circuits:['Φωτισμός','Ρευματοδότες','Κλιματισμός','Θερμοσίφωνας']},
 school:{lbl:'Σχολείο', ks:0.7,
   sub:[{n:'Πτέρυγα Α',c:['Φωτισμός αίθουσας','Ρευματοδότες αίθουσας','Κλιματισμός αίθουσας','Φωτισμός διαδρόμων']},
        {n:'Πτέρυγα Β',c:['Φωτισμός αίθουσας','Ρευματοδότες αίθουσας','Κλιματισμός αίθουσας','Φωτισμός διαδρόμων']},
        {n:'Πτέρυγα Γ',c:['Φωτισμός αίθουσας','Ρευματοδότες αίθουσας','Κλιματισμός αίθουσας','Φωτισμός διαδρόμων']},
        {n:'Πτέρυγα Δ',c:['Φωτισμός αίθουσας','Ρευματοδότες αίθουσας','Κλιματισμός αίθουσας','Φωτισμός διαδρόμων']}],
   circuits:['Φωτισμός ασφαλείας','Φωτισμός αύλειου χώρου','Ρευματοδότες μηχανοστασίου']},
 municipal:{lbl:'Δημοτικό κτίριο (μεγάλο)', ks:0.7,
   sub:[{n:'Υ.Π. Ισογείου',c:['Φωτισμός γραφείων','Ρευματοδότες γραφείων','Κλιματισμός']},
        {n:'Υ.Π. Α΄ ορόφου',c:['Φωτισμός γραφείων','Ρευματοδότες γραφείων','Κλιματισμός']},
        {n:'Υ.Π. Β΄ ορόφου',c:['Φωτισμός γραφείων','Ρευματοδότες γραφείων','Κλιματισμός']},
        {n:'Υ.Π. Μηχανοστασίου',c:['Ανελκυστήρας','Αντλία / Πιεστικό','Φωτισμός']},
        {n:'Υ.Π. Data / UPS',c:['Data / UPS','Κλιματισμός','Ρευματοδότες γραφείων']}],
   circuits:['Φωτισμός ασφαλείας','Φωτισμός περιβάλλοντος χώρου']}
};

/* Παράρτημα — χρόνοι επανελέγχου (ΥΑ Φ.50/503/168, ΦΕΚ 844/Β/2011) */
const EPAN=[
 {id:'kat', lbl:'Κατοικίες & ανάλογοι χώροι', y:14},
 {id:'epag',lbl:'Επαγγελματικοί χώροι χωρίς εύφλεκτα υλικά', y:7},
 {id:'eufl',lbl:'Επαγγελματικοί χώροι με εύφλεκτα υλικά', y:2},
 {id:'kino',lbl:'Χώροι συνάθροισης κοινού (σχολεία, θέατρα, αίθουσες)', y:1},
 {id:'ypai',lbl:'Επαγγελματικές εγκαταστάσεις στο ύπαιθρο (μαρίνες, κάμπινγκ, πισίνες)', y:1},
 {id:'ergo',lbl:'Προσωρινές εγκαταστάσεις / εργοτάξια', y:1}
];

/* Κατηγορίες ΦΟΠ */
const FOP_LAMP=[
 {n:'LED οδικό 30 W',p:30},{n:'LED οδικό 40 W',p:40},{n:'LED οδικό 50 W',p:50},
 {n:'LED οδικό 60 W',p:60},{n:'LED οδικό 80 W',p:80},{n:'LED οδικό 100 W',p:100},
 {n:'LED κορυφής 40 W',p:40},{n:'Προβολέας LED 100 W',p:100},{n:'Προβολέας LED 150 W',p:150},
 {n:'Νατρίου ΝΑΥ 70 W (+μπάλαστ)',p:84},{n:'Νατρίου ΝΑΥ 150 W (+μπάλαστ)',p:175},{n:'Νατρίου ΝΑΥ 250 W (+μπάλαστ)',p:285}
];

const VISUAL=[
 'Μέθοδοι προστασίας έναντι ηλεκτροπληξίας (άμεσης & έμμεσης επαφής)',
 'Ύπαρξη φραγμάτων / περιβλημάτων — βαθμός προστασίας IP',
 'Επιλογή αγωγών ως προς την ένταση και την πτώση τάσης',
 'Επιλογή & ρύθμιση διατάξεων προστασίας και επιτήρησης',
 'Ύπαρξη και ορθή θέση διατάξεων απομόνωσης και διακοπής',
 'Καταλληλότητα υλικού ως προς τις εξωτερικές επιδράσεις',
 'Αναγνώριση αγωγών ουδετέρου και προστασίας (χρωματισμοί)',
 'Ύπαρξη μονογραμμικών σχεδίων, πινακίδων και πληροφοριών',
 'Αναγνώριση κυκλωμάτων, ασφαλειών, διακοπτών, ακροδεκτών',
 'Επάρκεια συνδέσεων αγωγών (σφίξιμο, ακροδέκτες)',
 'Ύπαρξη & καταλληλότητα αγωγών προστασίας και ισοδυναμικών συνδέσεων',
 'Προσπελασιμότητα εξοπλισμού για λειτουργία και συντήρηση'
];

/* ==== 02_core.js ==== */
/* ===========================================================
   02 — ΠΥΡΗΝΑΣ: κατάσταση, αποθήκευση, εργαλεία, δρομολόγηση
   =========================================================== */
const $=(s,r)=>(r||document).querySelector(s);
const $$=(s,r)=>[...(r||document).querySelectorAll(s)];
const uid=()=>Math.random().toString(36).slice(2,9);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nf=(v,d)=>(v==null||isNaN(v))?'—':Number(v).toFixed(d==null?2:d);
const gr=d=>{if(!d)return'';const p=String(d).split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:d;};
const today=()=>new Date().toISOString().slice(0,10);
const addYears=(d,y)=>{const t=new Date(d||today());t.setFullYear(t.getFullYear()+y);return t.toISOString().slice(0,10);};

/* ---- αποθήκευση: artifact storage → localStorage → μνήμη ---- */
const DB=(()=>{
  const mem={};
  const hasW=typeof window!=='undefined'&&window.storage&&typeof window.storage.get==='function';
  let hasLS=false; try{const k='__t';localStorage.setItem(k,'1');localStorage.removeItem(k);hasLS=true;}catch(e){}
  return{
    mode:hasW?'cloud':(hasLS?'local':'memory'),
    async get(k){try{
      if(hasW){const r=await window.storage.get(k);return r?JSON.parse(r.value):null;}
      if(hasLS){const v=localStorage.getItem(k);return v?JSON.parse(v):null;}
      return mem[k]!==undefined?mem[k]:null;
    }catch(e){return null;}},
    async set(k,v){try{
      if(hasW){await window.storage.set(k,JSON.stringify(v));return true;}
      if(hasLS){localStorage.setItem(k,JSON.stringify(v));return true;}
      mem[k]=v;return true;
    }catch(e){mem[k]=v;return false;}}
  };
})();

/* ---- μοντέλο έργου ---- */
function blank(){return{
  v:'5.0.0', id:uid(), created:today(), modified:today(),
  route:{mode:null,cat:null,btype:null,insp:null,reason:''},
  prj:{title:'',addr:'',num:'',tk:'',dimos:'Ρόδου',ke:'',paroxi:'',metritis:'',useKind:''},
  sup:{tier:'',oldTier:'',method:'C',amb:30,group:1,agreed:0},
  inst:{ep:'',on:'',pat:'',adeia:'',omada:'Α΄',bathm:'1ης',addr:'',tk:'',tel:'',email:'',afm:'',doy:''},
  org:{brand:'',model:'',serial:'',cert:'',cdate:'',cexp:''},
  own:{nm:'',addr:'',afm:'',tel:'',email:''},
  usr:{nm:'',addr:'',tel:'',same:true},
  fop:{name:'ΠΙΛΑΡ ΦΟΠ',lines:[],spare:false,dUlim:5,astro:true,photo:true,spd:true,rcdHead:300,earth:''},
  pan:[], /* πίνακες κτιρίου */
  meas:{ins:[],zs:[],rcd:[],cont:[],earth:'',earthLim:'',vis:{},filled:false,confirmed:false,cdate:'',
        note:''},
  doc:{issue:today(),cat:'kino',next:'',kind:'new',remarks:''}
};}
var S=blank();
var VIEW='start', PANEL_OPEN=null, MODAL=null;

/* ---- ρήτρες διαδρομής ---- */
const MODE_L={new:'Νέα παροχή',exist:'Υφιστάμενη παροχή'};
const CAT_L={fop:'Δημοτικός φωτισμός (ΦΟΠ)',bld:'Κτίριο'};
const BT_L={municipal:'Δημοτικό κτίριο',school:'Σχολείο',small:'Μικρό δημοτικό κτίριο',apartment:'Διαμέρισμα / Κατοικία'};
const INSP_L={routine:'Τακτικός επανέλεγχος',upgrade:'Έκτακτος — επαύξηση ισχύος',special:'Έκτακτος — ειδικές συνθήκες'};

/* ---- ροή βημάτων ανά διαδρομή ---- */
function steps(){
  const r=S.route, a=[{k:'start',t:'Είδος εργασίας'}];
  if(!r.mode)return a;
  a.push({k:'cat',t:'Κατηγορία εγκατάστασης'});
  if(!r.cat)return a;
  if(r.cat==='bld'&&!r.btype)return a;
  if(r.mode==='exist'){a.push({k:'insp',t:'Είδος ελέγχου'});if(!r.insp)return a;}
  a.push({k:'prj',t:'Στοιχεία έργου'});
  if(r.cat==='fop'){a.push({k:'fop',t:'Πίλαρ & αναχωρήσεις'});}
  else{a.push({k:'bld',t:'Πίνακες & γραμμές'});}
  a.push({k:'sup',t:'Παροχή ΔΕΔΔΗΕ'});
  a.push({k:'sld',t:'Μονογραμμικά'});
  a.push({k:'cards',t:'Καρτέλες'});
  a.push({k:'meas',t:'Έλεγχοι & μετρήσεις'});
  a.push({k:'docs',t:'Έντυπα'});
  return a;
}
const stepIdx=k=>steps().findIndex(s=>s.k===k);
function go(k){VIEW=k;render();try{window.scrollTo(0,0);}catch(e){}const w=$('.work');if(w)w.scrollTop=0;}
function next(){const st=steps(),i=stepIdx(VIEW);if(i>=0&&i<st.length-1)go(st[i+1].k);}
function prev(){const st=steps(),i=stepIdx(VIEW);if(i>0)go(st[i-1].k);}

/* ---- δεσμός πεδίου → κατάσταση ---- */
function bind(path,type){
  const parts=path.split('.');let o=S;for(let i=0;i<parts.length-1;i++)o=o[parts[i]];
  const last=parts[parts.length-1];
  const v=o[last];
  return `data-b="${path}" data-bt="${type||'text'}" value="${esc(v==null?'':v)}"`;
}
function setPath(path,val){
  const parts=path.split('.');let o=S;for(let i=0;i<parts.length-1;i++)o=o[parts[i]];
  o[parts[parts.length-1]]=val;S.modified=today();
}
document.addEventListener('input',e=>{
  const el=e.target;if(!el.dataset||!el.dataset.b)return;
  let v=el.type==='checkbox'?el.checked:el.value;
  if(el.dataset.bt==='num')v=v===''?'':parseFloat(v);
  setPath(el.dataset.b,v);
  if(el.dataset.live)render();
  else touch();
});
document.addEventListener('change',e=>{
  const el=e.target;if(!el.dataset||!el.dataset.b)return;
  if(el.tagName==='SELECT'||el.type==='checkbox'){
    setPath(el.dataset.b,el.type==='checkbox'?el.checked:el.value);
    if(el.dataset.live!=='0')render();
  }
});
var saveT=null;
function touch(){clearTimeout(saveT);saveT=setTimeout(save,700);}
async function save(){await DB.set('yde5:current',S);const s=$('#svst');if(s)s.textContent='Αποθηκεύτηκε '+new Date().toLocaleTimeString('el-GR');}

/* ---- αρχεία ---- */
function exportJSON(){
  const b=new Blob([JSON.stringify(S,null,1)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(b);
  a.download=(S.prj.title||'ergo').replace(/[^\wΑ-Ωα-ω0-9]+/g,'_')+'.yde5.json';a.click();
}
function importJSON(){
  const i=document.createElement('input');i.type='file';i.accept='.json';
  i.onchange=()=>{const f=i.files[0];if(!f)return;const r=new FileReader();
    r.onload=()=>{try{const o=JSON.parse(r.result);S=Object.assign(blank(),o);go('start');save();}
      catch(e){alert('Το αρχείο δεν διαβάζεται.');}};r.readAsText(f);};
  i.click();
}

/* ---- modal ---- */
function modal(title,body,footer){MODAL={title,body,footer};render();}
function closeModal(){MODAL=null;render();}

/* ==== 03_calc.js ==== */
/* ===========================================================
   03 — ΥΠΟΛΟΓΙΣΤΙΚΟΣ ΠΥΡΗΝΑΣ
   IEC 60364-4-43 (§433 I_B ≤ I_n ≤ I_z), 60364-5-52 (Iz, ΔU),
   60364-4-41 (αυτόματη αποσύνδεση), ΕΛΟΤ HD 384.
   =========================================================== */

const kTemp=(m,t)=>{const tab=(m==='D')?K_TEMP_GND:K_TEMP;const ks=Object.keys(tab).map(Number).sort((a,b)=>a-b);
  let best=ks[0];ks.forEach(k=>{if(k<=t)best=k;});return tab[best]||1;};
const kGroup=n=>K_GROUP[Math.min(9,Math.max(1,Math.round(n||1)))]||1;

/* Iz διορθωμένη */
function izOf(S_,loaded,method,amb,grp){
  const i=S_LIST.indexOf(S_);if(i<0)return 0;
  const base=(IZ[loaded]||IZ[3])[method||'C'][i];
  return base*kTemp(method,amb==null?30:amb)*kGroup(grp==null?1:grp);
}
/* Ρεύμα λειτουργίας I_B */
function ib(kW,ph,cosf){
  const c=cosf||0.95;
  return ph===3? (kW*1000)/(Math.sqrt(3)*UL*c) : (kW*1000)/(U0*c);
}
/* Επιλογή μικροαυτόματου: I_B ≤ I_n */
function pickMCB(IB,max){
  for(const r of MCB){if(r>=IB*1.0&&(!max||r<=max))return r;}
  return MCB[MCB.length-1];
}
/* Πτώση τάσης συγκεντρωμένου φορτίου */
function du(IB,L,S_,ph,cosf){
  const c=cosf||0.95, s=Math.sqrt(Math.max(0,1-c*c));
  const x=S_>=25?0.00008:0; /* Ω/m */
  const z=RHO_CU*c/S_+x*s;
  const v=(ph===3?Math.sqrt(3):2)*IB*L*z;
  return{V:v,pct:v/(ph===3?UL:U0)*100};
}
/* Πτώση τάσης κατανεμημένου φορτίου (ΦΟΠ): άθροισμα τμημάτων */
function duDistributed(nLamps,wEach,span,first,S_,ph,cosf){
  const c=cosf||0.95;const z=RHO_CU*c/S_;
  let v=0;
  for(let i=1;i<=nLamps;i++){
    const Ldown=(i===1?first:span);
    const Pdown=(nLamps-i+1)*wEach/1000;      /* kW κατάντη του τμήματος */
    const I=ph===3?(Pdown*1000)/(Math.sqrt(3)*UL*c):(Pdown*1000)/(U0*c);
    v+=(ph===3?Math.sqrt(3):2)*I*Ldown*z;
  }
  return{V:v,pct:v/(ph===3?UL:U0)*100};
}
/* Βρόχος σφάλματος & έλεγχος αυτόματης αποσύνδεσης */
function loop(L,S_,Spe,Zsupply){
  const zs=(Zsupply||0.35)+RHO_CU_H*L*(1/S_+1/(Spe||S_));
  const Ik=U0*0.95/zs;
  return{Zs:zs,Ik:Ik};
}
function disconnectOK(Ik,In,curve){return Ik>=In*(CURVES[curve||'C'].k);}

/* Πλήρης διαστασιολόγηση γραμμής */
function sizeLine(o){
  /* o: {kW, ph, L, method, amb, grp, dUlim, curve, cosf, minS, Sfixed, distributed:{n,w,span,first}} */
  const ph=o.ph||1, loaded=ph===3?3:2, cosf=o.cosf||0.95;
  const IB=ib(o.kW,ph,cosf);
  const In=pickMCB(IB);
  const lim=o.dUlim||3;
  let S_=o.Sfixed||null, why='';
  if(!S_){
    for(const s of S_LIST){
      if(o.minS&&s<o.minS)continue;
      const Iz=izOf(s,loaded,o.method,o.amb,o.grp);
      if(Iz<In)continue;                                  /* I_n ≤ I_z */
      const d=o.distributed?duDistributed(o.distributed.n,o.distributed.w,o.distributed.span,o.distributed.first,s,ph,cosf)
                           :du(IB,o.L,s,ph,cosf);
      if(d.pct>lim){why='ΔU';continue;}
      S_=s;break;
    }
    if(!S_){S_=S_LIST[S_LIST.length-1];why='όριο πίνακα';}
  }
  const Iz=izOf(S_,loaded,o.method,o.amb,o.grp);
  const d=o.distributed?duDistributed(o.distributed.n,o.distributed.w,o.distributed.span,o.distributed.first,S_,ph,cosf)
                       :du(IB,o.L,S_,ph,cosf);
  const Spe=S_<=16?S_:(S_<=35?16:S_/2);
  const lp=loop(o.L,S_,Spe,o.Zsup);
  const curve=o.curve||(lp.Ik<In*10?'B':'C');
  return{IB,In,S:S_,Spe,Iz,dU:d,Zs:lp.Zs,Ik:lp.Ik,curve,
    okI:In<=Iz&&IB<=In, okDU:d.pct<=lim, okDisc:disconnectOK(lp.Ik,In,curve),
    cores:(ph===3?5:3), lim, why};
}

/* Πρόταση παροχής ΔΕΔΔΗΕ από συνολικό φορτίο */
function pickParoxi(kW,cosf,forcePh){
  const kVA=kW/(cosf||0.9);
  /* πάνω από 8 kVA η παροχή είναι τριφασική στην πράξη */
  const ph=forcePh||(kVA>8?3:null);
  const cand=PAROXES.filter(p=>(!ph||p.ph===ph)&&p.kVA>=kVA);
  return cand.length?cand[0]:PAROXES[PAROXES.length-1];
}
function paroxiById(id){return PAROXES.find(p=>p.id===id)||null;}
/* Iz παροχής, με παράλληλα καλώδια όπου υπάρχουν */
function izParoxi(p,method,amb,grp){return p?izOf(p.S,p.ph===3?3:2,method||p.meth,amb,grp)*(p.par||1):0;}

/* Έλεγχος ακεραιότητας παροχής */
function auditParoxi(p,method,amb,grp){
  if(!p)return[];
  const Iz=izParoxi(p,method,amb,grp);
  const out=[];
  if(p.fuse>Iz)out.push({lvl:'bad',t:'Ασφάλεια παροχής '+p.fuse+'A > Iz καλωδίου '+nf(Iz,0)+'A — το καλώδιο δεν προστατεύεται.'});
  if(p.gen>Iz)out.push({lvl:'bad',t:'Γενικός '+p.gen+'A > Iz καλωδίου '+nf(Iz,0)+'A (IEC 60364-4-43 §433).'});
  if(p.gen<p.fuse)out.push({lvl:'warn',t:'Γενικός '+p.gen+'A < ασφάλεια παροχής '+p.fuse+'A — χάνεται η επιλογικότητα.'});
  if(!out.length)out.push({lvl:'ok',t:'Συντονισμός εντάξει: I_ασφ='+p.fuse+'A, I_γεν='+p.gen+'A ≤ Iz='+nf(Iz,0)+'A.'});
  return out;
}

/* ---- ΦΟΠ: υπολογισμός αναχώρησης ---- */
function fopLine(l){
  const n=+l.n||0, w=+l.w||0, span=+l.span||30, first=+l.first||20;
  const ph=(l.ph==='3'||l.ph===3)?3:1;
  const aux=(l.aux===true||l.aux==='true');
  const kW=n*w/1000*(aux?1.1:1.0);
  const L=first+Math.max(0,n-1)*span;
  const r=sizeLine({kW,ph,L,method:l.method||'D',amb:+l.amb||20,grp:+l.grp||1,
    dUlim:+S.fop.dUlim||5,cosf:0.95,minS:+l.minS||6,Sfixed:l.Sfixed?+l.Sfixed:null,curve:'B',
    distributed:{n,w:w*(aux?1.1:1),span,first},Zsup:0.35});
  return Object.assign(r,{n,w,span,first,L,kW,ph,name:l.name||'Αναχώρηση'});
}
function fopTotals(){
  const ls=S.fop.lines.map(fopLine);
  const kW=ls.reduce((a,b)=>a+b.kW,0);
  const p=pickParoxi(kW,0.95,ls.some(l=>l.ph===3)||kW>7?3:1);
  return{ls,kW,paroxi:p,kWh:Math.round(kW*4100)};
}

/* ---- Κτίριο: αθροίσεις δέντρου ---- */
function panelById(id){return S.pan.find(p=>p.id===id);}
function children(id){return S.pan.filter(p=>p.parent===id);}
function roots(){return S.pan.filter(p=>!p.parent);}
function panelLoad(id){
  const p=panelById(id);if(!p)return{inst:0,dem:0};
  const inst=p.cir.reduce((a,c)=>a+(+c.kW||0),0);
  let ch=0;children(id).forEach(k=>{ch+=panelLoad(k.id).dem;});
  const dem=(inst+ch)*(p.ks||1);
  return{inst:inst+ch,dem};
}
function totalLoad(){
  let inst=0,dem=0;roots().forEach(r=>{const l=panelLoad(r.id);inst+=l.inst;dem+=l.dem;});
  return{inst,dem};
}
function circuitCalc(c,p){
  const ph=+c.ph===3?3:1;
  return sizeLine({kW:+c.kW||0,ph,L:+c.L||15,method:c.method||'B',amb:30,grp:+c.grp||1,
    dUlim:c.cat==='Φ'?3:5,cosf:0.95,minS:+c.minS||1.5,Sfixed:c.Sfixed?+c.Sfixed:null,curve:c.curve||'C',Zsup:0.4});
}
/* Ισοκατανομή φάσεων (round-robin στα μονοφασικά) */
function balance(p){
  let i=0;p.cir.forEach(c=>{if(+c.ph!==3){c.phase=['L1','L2','L3'][i%3];i++;}else c.phase='L1L2L3';});
}

/* ==== 04_ui.js ==== */
/* ===========================================================
   04 — ΚΕΛΥΦΟΣ & ΟΘΟΝΕΣ ΔΡΟΜΟΛΟΓΗΣΗΣ
   =========================================================== */

/* --- σύμβολα για τα πλακίδια επιλογής (μικρά μονογραμμικά) --- */
const SYM={
 fop:`<svg class="sym" viewBox="0 0 120 34"><path class="w" d="M8 24h14"/><rect class="dev" x="22" y="14" width="16" height="20"/><path class="w" d="M38 24h10"/><circle class="dev" cx="52" cy="24" r="4"/><path class="w" d="M56 24h16"/><path class="w" d="M72 24v-14h30"/><circle cx="106" cy="10" r="4" fill="#B8860B" stroke="#111" stroke-width="1"/><path class="w" d="M72 24v10"/><text x="8" y="10" class="sm">ΠΙΛΑΡ</text></svg>`,
 bld:`<svg class="sym" viewBox="0 0 120 34"><path class="w" d="M6 6v28"/><rect class="dev" x="18" y="2" width="22" height="14"/><rect class="dev" x="18" y="20" width="22" height="14"/><path class="w" d="M6 9h12M6 27h12"/><rect class="dev" x="60" y="2" width="18" height="10"/><rect class="dev" x="60" y="16" width="18" height="10"/><rect class="dev" x="60" y="30" width="18" height="4"/><path class="w" d="M40 9h20M40 27h20M52 9v12h8"/></svg>`,
 newp:`<svg class="sym" viewBox="0 0 120 34"><circle class="dev" cx="16" cy="18" r="9"/><text x="12" y="22" style="font-size:11px">kWh</text><path class="w" d="M25 18h18"/><rect class="dev" x="43" y="6" width="46" height="24"/><path class="w" d="M89 18h22"/><text x="46" y="21" class="lbl">ΠΙΝΑΚΑΣ</text></svg>`,
 chk:`<svg class="sym" viewBox="0 0 120 34"><rect class="dev" x="6" y="6" width="40" height="24"/><path class="w" d="M46 18h16"/><circle class="dev" cx="72" cy="18" r="10"/><path d="M66 18l4 5 9-11" stroke="#256B2A" stroke-width="2.2" fill="none"/><path class="w" d="M82 18h30"/><path class="wpe" d="M96 18v10m-6 0h12m-9 4h6"/></svg>`
};

function railHTML(){
  const st=steps(), cur=stepIdx(VIEW), r=S.route;
  const items=[];
  items.push({k:'Είδος εργασίας',v:r.mode?MODE_L[r.mode]:'—',go:'start',done:!!r.mode});
  items.push({k:'Κατηγορία',v:r.cat?(r.cat==='bld'&&r.btype?BT_L[r.btype]:CAT_L[r.cat]):'—',go:'cat',done:!!r.cat});
  if(r.mode==='exist')items.push({k:'Είδος ελέγχου',v:r.insp?INSP_L[r.insp]:'—',go:'insp',done:!!r.insp});
  items.push({k:'Έργο',v:S.prj.title||'—',go:'prj',done:!!S.prj.title});
  if(r.cat==='fop')items.push({k:'Πίλαρ',v:S.fop.lines.length?S.fop.lines.length+' αναχωρήσεις':'—',go:'fop',done:S.fop.lines.length>0});
  else if(r.cat)items.push({k:'Πίνακες',v:S.pan.length?S.pan.length+' πίνακες':'—',go:'bld',done:S.pan.length>0});
  const p=paroxiById(S.sup.tier);
  items.push({k:'Παροχή',v:p?p.lbl.replace('—','·')+' · '+p.kVA+' kVA':'—',go:'sup',done:!!p});
  items.push({k:'Μετρήσεις',v:S.meas.confirmed?'Επιβεβαιωμένες':(S.meas.filled?'Προσχέδιο':'—'),go:'meas',done:S.meas.confirmed});
  items.push({k:'Έντυπα',v:S.meas.confirmed?'Έτοιμα':'Σε προσχέδιο',go:'docs',done:false});

  const doneCount=items.filter(i=>i.done).length;
  const h=Math.max(0,(doneCount/items.length)*100);
  return `<div class="rail">
   <h4>Διαδρομή έργου</h4>
   <div class="bus"><div class="fill" style="height:${h}%"></div>
   ${items.map((it,i)=>{
     const isCur=st[cur]&&(st[cur].k===it.go);
     const cls=it.done?'done':(isCur?'cur':'todo');
     return `<div class="node ${cls} clickable" data-go="${it.go}">
       ${!it.done&&!isCur?'<span class="stub"></span>':''}
       <span class="dot"></span>
       <div class="k">${esc(it.k)}</div><div class="val">${esc(it.v)}</div></div>`;
   }).join('')}
   </div>
   <div class="railfoot"><b>${esc(S.prj.dimos?'Δήμος '+S.prj.dimos:'—')}</b>
     ${S.prj.paroxi?`<span class="badge-live">αρ. παροχής ${esc(S.prj.paroxi)}</span>`:''}
     ${S.inst.adeia?`<span class="badge-live">άδεια ${esc(S.inst.adeia)}</span>`:''}
     <div style="margin-top:8px" id="svst">Αποθήκευση: ${DB.mode==='cloud'?'ενεργή':(DB.mode==='local'?'τοπική':'μνήμη')}</div>
   </div></div>`;
}

function shell(inner,navHTML){
  const U=window.YDE_USER||null;
  const ROLE_L={admin:'Διαχειριστής',engineer:'Μηχανικός',viewer:'Προβολή μόνο'};
  return `<div class="topbar">
    <div class="brand"><b>ΥΔΕ Studio</b><span class="v">v5.1.0</span></div>
    <span class="sp"></span>
    <button class="tbtn" data-act="newprj">Νέο έργο</button>
    <button class="tbtn" data-act="open">Άνοιγμα</button>
    <button class="tbtn" data-act="saveas">Αποθήκευση</button>
    <button class="tbtn" data-act="tables">Πίνακες αναφοράς</button>
    ${U?`<span class="tb-sep"></span>
    ${U.role==='admin'?'<button class="tbtn" data-act="adminpanel">Χρήστες</button>':''}
    <span class="tb-user" title="${esc(U.email||'')}"><span class="tb-dot ${esc(U.role)}"></span>${esc(U.name||U.email||'')}<em>${ROLE_L[U.role]||''}</em></span>
    <button class="tbtn" data-act="chgpass" title="Αλλαγή κωδικού">Κωδικός</button>
    <button class="tbtn out" data-act="logout">Έξοδος</button>`:''}
  </div>
  <div class="main">${railHTML()}<div class="work"><div class="wrap">${inner}</div></div></div>
  ${navHTML||''}
  ${MODAL?`<div class="mask" data-act="closemask"><div class="modal"><div class="mh">${MODAL.title}<span class="sp" style="flex:1"></span><button class="x" data-act="closemodal">×</button></div><div class="mb">${MODAL.body}</div>${MODAL.footer?`<div class="mf">${MODAL.footer}</div>`:''}</div></div>`:''}`;
}

function navbar(opts){
  opts=opts||{};
  const st=steps(),i=stepIdx(VIEW);
  return `<div class="navbar noprint">
    ${i>0?'<button class="btn ghost" data-act="prev">← Πίσω</button>':''}
    <span class="st">${i>=0?`Βήμα ${i+1} από ${st.length} · ${esc(st[i].t)}`:''}</span>
    <span class="sp"></span>
    ${opts.extra||''}
    ${opts.hideNext?'':`<button class="btn" data-act="next" ${opts.disabled?'disabled':''}>${opts.nextLabel||'Συνέχεια →'}</button>`}
  </div>`;
}

/* ---------- ΟΘΟΝΗ 1: είδος εργασίας ---------- */
function vStart(){
  return shell(`
  <div class="hdr"><div class="eyebrow">Βήμα 1</div>
   <h1>Τι δουλειά ξεκινάς;</h1>
   <p>Η επιλογή εδώ καθορίζει ολόκληρη τη ροή: ποιοι πίνακες στήνονται, ποιοι υπολογισμοί τρέχουν και ποια έντυπα βγαίνουν στο τέλος. Οι δύο διαδρομές δεν ανακατεύονται σε κανένα σημείο.</p></div>
  <div class="tiles">
   <button class="tile ${S.route.mode==='new'?'sel':''}" data-route="mode:new">
     ${SYM.newp}<span class="t">Νέα παροχή</span>
     <span class="d">Δεν υπάρχει ρολόι. Στήνουμε εγκατάσταση από το μηδέν, προτείνουμε παροχή ΔΕΔΔΗΕ και βγάζουμε πλήρη φάκελο ηλεκτροδότησης.</span>
     <span class="tag">ΝΕΑ</span></button>
   <button class="tile ${S.route.mode==='exist'?'sel':''}" data-route="mode:exist">
     ${SYM.chk}<span class="t">Υφιστάμενη παροχή</span>
     <span class="d">Υπάρχει αριθμός παροχής. Επανέλεγχος, επαύξηση ισχύος ή έκτακτος έλεγχος μετά από συμβάν.</span>
     <span class="tag">ΕΛΕΓΧΟΣ</span></button>
  </div>
  <div class="card" style="margin-top:18px"><h3><span class="n">i</span>Τι αλλάζει ανά διαδρομή</h3><div class="body">
   <div class="scroll"><table class="t"><thead><tr><th></th><th>Νέα παροχή</th><th>Υφιστάμενη παροχή</th></tr></thead><tbody>
    <tr><td>Αριθμός παροχής</td><td class="muted">κενός — τον δίνει ο ΔΕΔΔΗΕ μετά την αίτηση</td><td>υποχρεωτικός</td></tr>
    <tr><td>Παροχή</td><td>προτείνεται από το φορτίο</td><td>υφιστάμενη· στην επαύξηση δηλώνεται και η αιτούμενη</td></tr>
    <tr><td>Μετρήσεις</td><td>αρχικός έλεγχος</td><td>νέες πραγματικές μετρήσεις πεδίου</td></tr>
    <tr><td>Έντυπα</td><td>ΥΔΕ · Πρωτόκολλο · Έκθεση · Καταγραφή ΕΗΕ · Μονογραμμικά</td><td>ΥΔΕ (επανέλεγχος) · Πρωτόκολλο · Μονογραμμικά</td></tr>
   </tbody></table></div></div></div>
  `,navbar({hideNext:!S.route.mode}));
}

/* ---------- ΟΘΟΝΗ 2: κατηγορία ---------- */
function vCat(){
  const r=S.route;
  const bt=r.cat==='bld'?`
   <div class="card"><h3><span class="n">2β</span>Τι κτίριο;</h3><div class="body">
   <div class="tiles">
    ${Object.keys(BT_L).map(k=>{
      const d={municipal:'Γενικός πίνακας + 5 υποπίνακες ορόφων/χρήσεων + μηχανοστάσιο. Ανελκυστήρας, πιεστικό, data.',
               school:'Γενικός πίνακας + 4 πτέρυγες, κάθε πτέρυγα με τους πίνακες των αιθουσών της. Τριών επιπέδων δέντρο.',
               small:'Ένας γενικός πίνακας και ένας υποπίνακας. ΚΕΠ, αποδυτήρια, φυλάκιο, αντλιοστάσιο.',
               apartment:'Ένας πίνακας με τις γραμμές της κατοικίας: φωτισμός, ρευματοδότες, κουζίνα, θερμοσίφωνας, κλιματιστικά.'}[k];
      return `<button class="tile ${r.btype===k?'sel':''}" data-route="btype:${k}">
        <span class="t">${BT_L[k]}</span><span class="d">${d}</span></button>`;}).join('')}
   </div></div></div>`:'';
  return shell(`
  <div class="hdr"><div class="eyebrow">Βήμα 2 · ${esc(MODE_L[r.mode]||'')}</div>
   <h1>Δημοτικός φωτισμός ή κτίριο;</h1>
   <p>Δύο τελείως χωριστά κεφάλαια. Ο δημοτικός φωτισμός είναι ένα πίλαρ με έως τέσσερις αναχωρήσεις· το κτίριο είναι δέντρο πινάκων και υποπινάκων.</p></div>
  <div class="tiles">
   <button class="tile ${r.cat==='fop'?'sel':''}" data-route="cat:fop">
     ${SYM.fop}<span class="t">Δημοτικός φωτισμός (ΦΟΠ)</span>
     <span class="d">Ένα πίλαρ: μετρητής ΔΕΔΔΗΕ δίπλα στον πίνακά μας, έως 4 αναχωρήσεις προς ιστούς. Τυπικό καλώδιο 5×6 ή 5×10.</span>
     <span class="tag">1 ΠΙΛΑΡ</span></button>
   <button class="tile ${r.cat==='bld'?'sel':''}" data-route="cat:bld">
     ${SYM.bld}<span class="t">Κτίριο</span>
     <span class="d">Γενικός πίνακας και υποπίνακες σε όσα επίπεδα χρειάζεται. Κάθε υποπίνακας κρατά τα δικά του στοιχεία και βγάζει δικό του μονογραμμικό.</span>
     <span class="tag">ΔΕΝΤΡΟ</span></button>
  </div>${bt}
  `,navbar({hideNext:!(r.cat&&(r.cat==='fop'||r.btype))}));
}

/* ---------- ΟΘΟΝΗ 3: είδος ελέγχου ---------- */
function vInsp(){
  const r=S.route;
  const reasons=['Πλημμύρα','Πυρκαγιά','Σεισμός','Κεραυνοπληξία','Βλάβη / βραχυκύκλωμα','Μετατροπή ή επέκταση εγκατάστασης','Αλλαγή χρήσης','Εντολή αρχής / καταγγελία'];
  return shell(`
  <div class="hdr"><div class="eyebrow">Βήμα 3 · Υφιστάμενη παροχή</div>
   <h1>Γιατί γίνεται ο έλεγχος;</h1>
   <p>Ο λόγος του ελέγχου καθορίζει το είδος της δήλωσης στο έντυπο και τη νέα ημερομηνία επανελέγχου.</p></div>
  <div class="tiles">
   <button class="tile ${r.insp==='routine'?'sel':''}" data-route="insp:routine"><span class="t">Τακτικός επανέλεγχος</span>
     <span class="d">Στα τακτά χρονικά διαστήματα του Παραρτήματος. Η επόμενη ημερομηνία υπολογίζεται αυτόματα από την κατηγορία χώρου.</span><span class="tag">ΤΑΚΤΙΚΟΣ</span></button>
   <button class="tile ${r.insp==='upgrade'?'sel':''}" data-route="insp:upgrade"><span class="t">Έκτακτος — επαύξηση ισχύος</span>
     <span class="d">Αλλάζει η παροχή. Δηλώνεται υφιστάμενη και αιτούμενη, ελέγχεται η επάρκεια καλωδίου και γενικού.</span><span class="tag">ΕΠΑΥΞΗΣΗ</span></button>
   <button class="tile ${r.insp==='special'?'sel':''}" data-route="insp:special"><span class="t">Έκτακτος — ειδικές συνθήκες</span>
     <span class="d">Μετά από συμβάν που επηρέασε την εγκατάσταση: πλημμύρα, πυρκαγιά, βλάβη δικτύου, μετατροπή.</span><span class="tag">ΕΚΤΑΚΤΟΣ</span></button>
  </div>
  ${r.insp==='special'?`<div class="card"><h3><span class="n">αιτία</span>Τι προηγήθηκε</h3><div class="body">
   <div class="grid g3">${reasons.map(x=>`<label class="chk"><input type="radio" name="rsn" ${r.reason===x?'checked':''} data-reason="${esc(x)}"><span>${x}</span></label>`).join('')}</div>
   <div class="f" style="margin-top:10px"><label>Σύντομη περιγραφή για το έντυπο</label>
     <input ${bind('doc.remarks')} placeholder="π.χ. Πλημμύρα 12/2025 — αντικατάσταση πίνακα και γραμμών ισογείου"></div>
  </div></div>`:''}
  ${r.insp==='upgrade'?`<div class="note"><b>Επαύξηση ισχύος</b>Στο βήμα «Παροχή» θα δηλώσεις και τις δύο παροχές. Η εφαρμογή ελέγχει αν το υπάρχον καλώδιο και ο γενικός σηκώνουν τη νέα παροχή, και το γράφει στο πρωτόκολλο.</div>`:''}
  `,navbar({hideNext:!r.insp}));
}

/* ---------- ΟΘΟΝΗ 4: στοιχεία έργου ---------- */
function vPrj(){
  const r=S.route, isNew=r.mode==='new';
  return shell(`
  <div class="hdr"><div class="eyebrow">${esc(MODE_L[r.mode])} · ${esc(r.cat==='bld'?BT_L[r.btype]:CAT_L.fop)}</div>
   <h1>Στοιχεία έργου και εγκατάστασης</h1>
   <p>Αυτά περνούν αυτούσια σε όλα τα έντυπα. Ό,τι συμπληρώσεις εδώ δεν ξαναγράφεται πουθενά.</p></div>
  <div class="card"><h3><span class="n">1</span>Έργο</h3><div class="body"><div class="grid g2">
    <div class="f wide"><label>Τίτλος έργου</label><input ${bind('prj.title')} data-live="1" placeholder="${r.cat==='fop'?'π.χ. Ηλεκτροφωτισμός οδού Ροδίου — Τμήμα Α':'π.χ. 2ο Δημοτικό Σχολείο Ρόδου — επαύξηση ισχύος'}"></div>
    <div class="f"><label>Οδός</label><input ${bind('prj.addr')}></div>
    <div class="f"><label>Αριθμός</label><input ${bind('prj.num')}></div>
    <div class="f"><label>Δήμος</label><input ${bind('prj.dimos')} data-live="1"></div>
    <div class="f"><label>Δημοτική κοινότητα</label><input ${bind('prj.ke')}></div>
    <div class="f"><label>Τ.Κ.</label><input ${bind('prj.tk')}></div>
    <div class="f"><label>Είδος / χρήση εγκατάστασης</label><input ${bind('prj.useKind')} placeholder="${r.cat==='fop'?'Δημοτικός φωτισμός οδών & πλατειών':'Σχολικό κτίριο'}"></div>
  </div></div></div>
  <div class="card"><h3><span class="n">2</span>Παροχή & μετρητής</h3><div class="body">
    ${isNew?`<div class="note"><b>Νέα παροχή</b>Ο αριθμός παροχής και ο αριθμός μετρητή μένουν κενοί — τους αποδίδει ο ΔΕΔΔΗΕ μετά την κατάθεση της αίτησης. Δεν είναι παράλειψη.</div>`:''}
    <div class="grid g3">
     <div class="f"><label>Αριθμός παροχής${isNew?' (αν δόθηκε)':''}</label><input ${bind('prj.paroxi')} data-live="1" placeholder="π.χ. 552526541"></div>
     <div class="f"><label>Αριθμός μετρητή</label><input ${bind('prj.metritis')}></div>
     <div class="f"><label>Κατηγορία χώρου (επανέλεγχος)</label>
       <select ${bind('doc.cat')}>${EPAN.map(e=>`<option value="${e.id}" ${S.doc.cat===e.id?'selected':''}>${e.lbl} — ${e.y} έτ.</option>`).join('')}</select></div>
    </div>
    <div class="note ok" style="margin-bottom:0"><b>Επόμενος επανέλεγχος</b>
      ${(()=>{const e=EPAN.find(x=>x.id===S.doc.cat)||EPAN[0];return `Με βάση την κατηγορία «${e.lbl}» ο επόμενος έλεγχος οφείλεται έως <b class="mono">${gr(addYears(S.doc.issue,e.y))}</b> (${e.y} έτη από την έκδοση).`;})()}
    </div>
  </div></div>
  `,navbar({disabled:!S.prj.title}));
}

/* ---------- ΟΘΟΝΗ: παροχή ΔΕΔΔΗΕ ---------- */
function vSup(){
  const isFop=S.route.cat==='fop';
  const tot=isFop?fopTotals():null;
  const kW=isFop?tot.kW:totalLoad().dem;
  const rec=pickParoxi(kW,0.9,isFop?(tot.ls.some(l=>l.ph===3)?3:null):null);
  if(!S.sup.tier&&rec)S.sup.tier=rec.id;
  const p=paroxiById(S.sup.tier);
  const audit=auditParoxi(p,S.sup.method,S.sup.amb,S.sup.group);
  const old=paroxiById(S.sup.oldTier);
  return shell(`
  <div class="hdr"><div class="eyebrow">Παροχή</div><h1>Τυποποιημένη παροχή ΔΕΔΔΗΕ</h1>
   <p>Η πρόταση βγαίνει από το πραγματικό φορτίο που καταχώρησες. Ο γενικός διακόπτης διαστασιολογείται από το <b>μέγεθος της παροχής</b>, όχι από το τρέχον φορτίο — γιατί αύριο προστίθενται γραμμές.</p></div>
  <div class="reads" style="margin-bottom:14px">
   <div class="read"><div class="k">Εγκατεστημένη</div><div class="v">${nf(isFop?tot.kW:totalLoad().inst,2)}<span class="u"> kW</span></div></div>
   <div class="read"><div class="k">Ζήτηση (ετεροχρ.)</div><div class="v">${nf(kW,2)}<span class="u"> kW</span></div></div>
   <div class="read"><div class="k">Φαινόμενη</div><div class="v">${nf(kW/0.9,2)}<span class="u"> kVA</span></div></div>
   <div class="read hl"><div class="k">Πρόταση</div><div class="v" style="font-size:14px">${rec?esc(rec.lbl):'—'}</div></div>
  </div>
  <div class="card"><h3><span class="n">επιλογή</span>Παροχή έργου</h3><div class="body">
   <div class="grid g3">
    <div class="f"><label>${S.route.insp==='upgrade'?'Αιτούμενη παροχή':'Παροχή'}</label>
      <select ${bind('sup.tier')}>${PAROXES.map(x=>`<option value="${x.id}" ${S.sup.tier===x.id?'selected':''}>${x.lbl} · ${x.kVA} kVA · ${x.cable}</option>`).join('')}</select></div>
    ${S.route.insp==='upgrade'?`<div class="f"><label>Υφιστάμενη παροχή</label>
      <select ${bind('sup.oldTier')}><option value="">—</option>${PAROXES.map(x=>`<option value="${x.id}" ${S.sup.oldTier===x.id?'selected':''}>${x.lbl} · ${x.kVA} kVA</option>`).join('')}</select></div>`:''}
    <div class="f"><label>Τρόπος όδευσης παροχής</label>
      <select ${bind('sup.method')}>${Object.keys(METHODS).map(m=>`<option value="${m}" ${S.sup.method===m?'selected':''}>${METHODS[m]}</option>`).join('')}</select></div>
    <div class="f"><label>Θερμοκρασία περιβάλλοντος (°C)</label><input type="number" ${bind('sup.amb','num')} data-live="1"></div>
    <div class="f"><label>Κυκλώματα σε ομάδα</label><input type="number" min="1" ${bind('sup.group','num')} data-live="1"></div>
    <div class="f"><label>Συμφωνημένη ισχύς (kVA)</label><input type="number" ${bind('sup.agreed','num')} placeholder="${p?p.kVA:''}"></div>
   </div>
   ${p?`<div class="reads" style="margin-top:14px">
    <div class="read"><div class="k">Φάσεις</div><div class="v">${p.ph===3?'3Φ+Ν':'1Φ+Ν'}</div></div>
    <div class="read"><div class="k">Ισχύς</div><div class="v">${p.kVA}<span class="u"> kVA</span></div></div>
    <div class="read"><div class="k">Ασφάλεια παροχής</div><div class="v">${p.fuse}<span class="u"> A</span></div></div>
    <div class="read"><div class="k">Γενικός εγκατάστασης</div><div class="v">${p.gen}<span class="u"> A</span></div></div>
    <div class="read"><div class="k">Καλώδιο</div><div class="v" style="font-size:14px">${p.cable}</div></div>
    <div class="read"><div class="k">Iz διορθωμένη</div><div class="v">${nf(izParoxi(p,S.sup.method,S.sup.amb,S.sup.group),0)}<span class="u"> A</span></div></div>
   </div>`:''}
   ${audit.map(a=>`<div class="note ${a.lvl==='ok'?'ok':(a.lvl==='bad'?'bad':'warn')}" style="margin-bottom:6px">${a.t}</div>`).join('')}
   ${old&&p?`<div class="note ${old.S<p.S?'warn':'ok'}"><b>Επαύξηση ${old.kVA} → ${p.kVA} kVA</b>
     ${old.S<p.S?`Το υφιστάμενο καλώδιο παροχής ${old.cable} δεν επαρκεί για τη νέα παροχή — απαιτείται αντικατάσταση με ${p.cable} και γενικός ${p.gen}A.`
                :`Το υφιστάμενο καλώδιο ${old.cable} επαρκεί. Απαιτείται αλλαγή γενικού σε ${p.gen}A και επανέλεγχος επιλογικότητας.`}</div>`:''}
   ${rec&&p&&rec.kVA>p.kVA?`<div class="note bad"><b>Υποδιαστασιολόγηση</b>Το φορτίο απαιτεί ${esc(rec.lbl)} (${rec.kVA} kVA). Η επιλεγμένη παροχή είναι μικρότερη.</div>`:''}
  </div></div>
  `,navbar());
}

/* ---------- ΟΘΟΝΗ: καρτέλες ---------- */
function vCards(){
  return shell(`
  <div class="hdr"><div class="eyebrow">Σταθερά στοιχεία</div><h1>Καρτέλες</h1>
   <p>Ο εγκαταστάτης και το όργανο μέτρησης αποθηκεύονται μία φορά και έρχονται έτοιμα σε κάθε επόμενο έργο. Ο ιδιοκτήτης και ο χρήστης αλλάζουν ανά έργο.</p></div>

  <div class="card"><h3><span class="n">Α</span>Ηλεκτρολόγος εγκαταστάτης<span class="sp"></span>
    <button class="btn sm ghost" data-act="saveinst">Αποθήκευση ως προεπιλογή</button></h3><div class="body"><div class="grid g4">
    <div class="f"><label>Επώνυμο</label><input ${bind('inst.ep')}></div>
    <div class="f"><label>Όνομα</label><input ${bind('inst.on')}></div>
    <div class="f"><label>Πατρώνυμο</label><input ${bind('inst.pat')}></div>
    <div class="f"><label>Αρ. άδειας</label><input ${bind('inst.adeia')} data-live="1" placeholder="ΔΩΔ-ΗΛ-000"></div>
    <div class="f"><label>Ομάδα</label><select ${bind('inst.omada')}>${['Α΄','Β΄','Γ΄','Δ΄'].map(x=>`<option ${S.inst.omada===x?'selected':''}>${x}</option>`).join('')}</select></div>
    <div class="f"><label>Βαθμίδα</label><select ${bind('inst.bathm')}>${['1ης','2ης','3ης','4ης'].map(x=>`<option ${S.inst.bathm===x?'selected':''}>${x}</option>`).join('')}</select></div>
    <div class="f"><label>ΑΦΜ</label><input ${bind('inst.afm')}></div>
    <div class="f"><label>ΔΟΥ</label><input ${bind('inst.doy')}></div>
    <div class="f"><label>Διεύθυνση</label><input ${bind('inst.addr')}></div>
    <div class="f"><label>Τ.Κ.</label><input ${bind('inst.tk')}></div>
    <div class="f"><label>Τηλέφωνο</label><input ${bind('inst.tel')}></div>
    <div class="f"><label>E-mail</label><input ${bind('inst.email')}></div>
  </div></div></div>

  <div class="card"><h3><span class="n">Β</span>Όργανο μετρήσεων<span class="sp"></span>
    <button class="btn sm ghost" data-act="saveorg">Αποθήκευση ως προεπιλογή</button></h3><div class="body"><div class="grid g3">
    <div class="f"><label>Κατασκευαστής</label><input ${bind('org.brand')} placeholder="π.χ. Metrel / Fluke / Chauvin"></div>
    <div class="f"><label>Μοντέλο</label><input ${bind('org.model')} placeholder="π.χ. MI 3152"></div>
    <div class="f"><label>Σειριακός αριθμός</label><input ${bind('org.serial')}></div>
    <div class="f"><label>Πιστοποιητικό διακρίβωσης</label><input ${bind('org.cert')}></div>
    <div class="f"><label>Ημ/νία διακρίβωσης</label><input type="date" ${bind('org.cdate')} data-live="1"></div>
    <div class="f"><label>Ισχύει έως</label><input type="date" ${bind('org.cexp')} data-live="1"></div>
  </div>
  ${S.org.cexp&&S.org.cexp<today()?`<div class="note bad"><b>Ληγμένη διακρίβωση</b>Το πιστοποιητικό έληξε στις ${gr(S.org.cexp)}. Οι μετρήσεις δεν τεκμηριώνονται.</div>`:''}
  </div></div>

  <div class="card"><h3><span class="n">Γ</span>Ιδιοκτήτης</h3><div class="body"><div class="grid g3">
    <div class="f wide"><label>Ονοματεπώνυμο / Φορέας</label><input ${bind('own.nm')} placeholder="π.χ. ΔΗΜΟΣ ΡΟΔΟΥ"></div>
    <div class="f"><label>ΑΦΜ</label><input ${bind('own.afm')}></div>
    <div class="f"><label>Διεύθυνση</label><input ${bind('own.addr')}></div>
    <div class="f"><label>Τηλέφωνο</label><input ${bind('own.tel')}></div>
    <div class="f"><label>E-mail</label><input ${bind('own.email')}></div>
  </div></div></div>

  <div class="card"><h3><span class="n">Δ</span>Χρήστης εγκατάστασης</h3><div class="body">
    <label class="chk"><input type="checkbox" ${S.usr.same?'checked':''} data-b="usr.same" data-bt="chk"><span>Ίδιος με τον ιδιοκτήτη</span></label>
    ${!S.usr.same?`<div class="grid g3" style="margin-top:9px">
      <div class="f wide"><label>Ονοματεπώνυμο</label><input ${bind('usr.nm')}></div>
      <div class="f"><label>Διεύθυνση</label><input ${bind('usr.addr')}></div>
      <div class="f"><label>Τηλέφωνο</label><input ${bind('usr.tel')}></div></div>`:''}
  </div></div>
  `,navbar());
}

/* ==== 05_fop.js ==== */
/* ===========================================================
   05 — ΔΗΜΟΤΙΚΟΣ ΦΩΤΙΣΜΟΣ (ΠΙΛΑΡ)
   =========================================================== */
function newFopLine(i){
  return{id:uid(),name:'Αναχώρηση Λ'+(i+1),n:10,w:50,span:30,first:20,ph:'3',
    method:'D',amb:20,grp:1,minS:6,Sfixed:null,aux:false,note:''};
}
function fopAdd(){if(S.fop.lines.length>=4){alert('Το πίλαρ δημοτικού φωτισμού καλύπτει έως 4 αναχωρήσεις.');return;}
  S.fop.lines.push(newFopLine(S.fop.lines.length));render();touch();}
function fopDel(id){S.fop.lines=S.fop.lines.filter(l=>l.id!==id);render();touch();}

function vFop(){
  const T=fopTotals();
  const done=S.fop.lines.length>0;
  const rows=S.fop.lines.map((l,i)=>{
    const c=T.ls[i];
    const flags=[];
    if(!c.okI)flags.push('<span class="pill bad">I<sub>n</sub>&gt;I<sub>z</sub></span>');
    if(!c.okDU)flags.push(`<span class="pill warn">ΔU ${nf(c.dU.pct,2)}%</span>`);
    if(!c.okDisc)flags.push('<span class="pill bad">αποσύνδεση</span>');
    if(!flags.length)flags.push('<span class="pill ok">εντάξει</span>');
    return `<div class="card"><h3><span class="n">Λ${i+1}</span>
      <input ${bind('fop.lines.'+i+'.name')} data-live="1" style="border:none;font-weight:700;font-size:13px;background:transparent;width:220px;padding:2px 0">
      <span class="sp"></span>${flags.join(' ')}
      <button class="btn sm danger" data-delline="${l.id}">Διαγραφή</button></h3>
     <div class="body">
      <div class="grid g5">
       <div class="f"><label>Φωτιστικά (τεμ.)</label><input type="number" min="1" ${bind('fop.lines.'+i+'.n','num')} data-live="1"></div>
       <div class="f"><label>Ισχύς ανά φωτιστικό (W)</label>
         <input type="number" ${bind('fop.lines.'+i+'.w','num')} data-live="1" list="lampw"></div>
       <div class="f"><label>Απόσταση μεταξύ ιστών (m)</label><input type="number" ${bind('fop.lines.'+i+'.span','num')} data-live="1"></div>
       <div class="f"><label>Πίλαρ → 1ος ιστός (m)</label><input type="number" ${bind('fop.lines.'+i+'.first','num')} data-live="1"></div>
       <div class="f"><label>Σύνδεση</label><select ${bind('fop.lines.'+i+'.ph')}>
         <option value="3" ${l.ph==='3'?'selected':''}>Τριφασική (εναλλαγή φάσης ανά ιστό)</option>
         <option value="1" ${l.ph==='1'?'selected':''}>Μονοφασική</option></select></div>
       <div class="f"><label>Όδευση</label><select ${bind('fop.lines.'+i+'.method')}>
         ${Object.keys(METHODS).map(m=>`<option value="${m}" ${l.method===m?'selected':''}>${METHODS[m]}</option>`).join('')}</select></div>
       <div class="f"><label>Θερμ. εδάφους/περιβ. (°C)</label><input type="number" ${bind('fop.lines.'+i+'.amb','num')} data-live="1"></div>
       <div class="f"><label>Ελάχιστη διατομή (mm²)</label><select ${bind('fop.lines.'+i+'.minS')}>
         ${[4,6,10,16].map(s=>`<option value="${s}" ${+l.minS===s?'selected':''}>${s}</option>`).join('')}</select></div>
       <div class="f"><label>Κλείδωμα διατομής</label><select ${bind('fop.lines.'+i+'.Sfixed')}>
         <option value="">αυτόματη</option>${S_LIST.filter(s=>s>=4&&s<=50).map(s=>`<option value="${s}" ${+l.Sfixed===s?'selected':''}>${s} mm²</option>`).join('')}</select></div>
       <div class="f"><label>Βοηθητικά (+10%)</label><select ${bind('fop.lines.'+i+'.aux')}>
         <option value="false" ${!l.aux?'selected':''}>Όχι</option><option value="true" ${l.aux?'selected':''}>Ναι</option></select></div>
      </div>
      <div class="reads" style="margin-top:13px">
       <div class="read"><div class="k">Μήκος γραμμής</div><div class="v">${nf(c.L,0)}<span class="u"> m</span></div></div>
       <div class="read"><div class="k">Φορτίο</div><div class="v">${nf(c.kW,3)}<span class="u"> kW</span></div></div>
       <div class="read"><div class="k">Ρεύμα I<sub>B</sub></div><div class="v">${nf(c.IB,2)}<span class="u"> A</span></div></div>
       <div class="read ${c.okI?'ok':'bad'}"><div class="k">Μικροαυτόματος</div><div class="v">${c.In}<span class="u"> A ${c.curve}</span></div></div>
       <div class="read ${c.okI?'ok':'bad'}"><div class="k">Καλώδιο</div><div class="v" style="font-size:14px">${c.cores}×${c.S}</div></div>
       <div class="read"><div class="k">I<sub>z</sub> διορθ.</div><div class="v">${nf(c.Iz,0)}<span class="u"> A</span></div></div>
       <div class="read ${c.okDU?'ok':'warn'}"><div class="k">ΔU άκρου</div><div class="v">${nf(c.dU.pct,2)}<span class="u"> %</span></div></div>
       <div class="read ${c.okDisc?'ok':'bad'}"><div class="k">I<sub>k</sub> άκρου</div><div class="v">${nf(c.Ik,0)}<span class="u"> A</span></div></div>
      </div>
      <div class="note ${c.okDU&&c.okI&&c.okDisc?'ok':'warn'}" style="margin-bottom:0">
       ${c.n} φωτιστικά × ${c.w} W ανά ${c.span} m ⇒ ${nf(c.L,0)} m. Επιλέχθηκε <b>J1VV ${c.cores}×${c.S} mm²</b>
       ${c.why==='ΔU'?'επειδή δέσμευσε η πτώση τάσης (όχι η θερμική αντοχή)':'με κριτήριο θερμικής αντοχής'} —
       ΔU ${nf(c.dU.pct,2)}% ≤ ${c.lim}%. Μικροαυτόματος ${c.In}A καμπύλης ${c.curve}: απαιτεί ${c.In*CURVES[c.curve].k}A για αποσύνδεση, στο άκρο υπάρχουν ${nf(c.Ik,0)}A.
       ${c.ph===3?'Τα φωτιστικά εναλλάσσονται L1→L2→L3 ανά ιστό, ώστε να ισοφορτίζονται οι φάσεις.':''}
      </div>
     </div></div>`;}).join('');

  return shell(`
  <datalist id="lampw">${FOP_LAMP.map(l=>`<option value="${l.p}">${l.n}</option>`).join('')}</datalist>
  <div class="hdr"><div class="eyebrow">Δημοτικός φωτισμός</div><h1>Πίλαρ και αναχωρήσεις</h1>
   <p>Δηλώνεις φωτιστικά, ισχύ και απόσταση. Το μήκος, η διατομή, ο μικροαυτόματος και η παροχή βγαίνουν μόνα τους. Ο απολογισμός κλείνει όταν συμπληρωθούν όλες οι αναχωρήσεις.</p></div>

  <div class="card"><h3><span class="n">κεφαλή</span>Εξοπλισμός πίλαρ</h3><div class="body">
   <div class="grid g4">
    <div class="f"><label>Ονομασία πίλαρ</label><input ${bind('fop.name')} data-live="1"></div>
    <div class="f"><label>Όριο ΔU αναχωρήσεων (%)</label><input type="number" step="0.5" ${bind('fop.dUlim','num')} data-live="1"></div>
    <div class="f"><label>ΔΔΕ κεφαλής (mA)</label><select ${bind('fop.rcdHead')}>${[100,300,500].map(x=>`<option value="${x}" ${+S.fop.rcdHead===x?'selected':''}>${x} mA τύπου S</option>`).join('')}</select></div>
    <div class="f"><label>Αντίσταση γείωσης πίλαρ (Ω)</label><input ${bind('fop.earth')} placeholder="μετρημένη"></div>
   </div>
   <div class="grid g4" style="margin-top:8px">
    <label class="chk"><input type="checkbox" ${S.fop.astro?'checked':''} data-b="fop.astro" data-bt="chk"><span>Αστρονομικός χρονοδιακόπτης</span></label>
    <label class="chk"><input type="checkbox" ${S.fop.photo?'checked':''} data-b="fop.photo" data-bt="chk"><span>Φωτοκύτταρο</span></label>
    <label class="chk"><input type="checkbox" ${S.fop.spd?'checked':''} data-b="fop.spd" data-bt="chk"><span>Απαγωγός υπερτάσεων τύπου 2</span></label>
    <label class="chk"><input type="checkbox" ${S.fop.spare?'checked':''} data-b="fop.spare" data-bt="chk"><span>Εφεδρική αναχώρηση (ανενεργή)</span></label>
   </div>
   <div class="note"><b>Γιατί 300 mA τύπου S στην κεφαλή και 30 mA ανά αναχώρηση</b>
    Σε εκατοντάδες μέτρα υπόγειου J1VV οι χωρητικές διαρροές αθροίζονται και ρίχνουν διαρκώς ένα ΔΔΕ 30 mA χωρίς βλάβη. Στην κεφαλή μπαίνει επιλεκτικό 300 mA τύπου S· η προστασία επαφής των 30 mA μπαίνει ανά αναχώρηση, όπου και χρειάζεται.</div>
  </div></div>

  ${rows||`<div class="card"><div class="body" style="text-align:center;padding:30px">
    <p class="muted" style="margin:0 0 12px">Καμία αναχώρηση ακόμη. Ξεκίνα με την πρώτη γραμμή φωτισμού.</p>
    <button class="btn" data-act="fopadd">Προσθήκη αναχώρησης</button></div></div>`}

  ${S.fop.lines.length?`<div class="row" style="margin:4px 0 16px">
    <button class="btn ghost" data-act="fopadd" ${S.fop.lines.length>=4?'disabled':''}>+ Αναχώρηση (${S.fop.lines.length}/4)</button>
    <span class="muted">Το πίλαρ ενός μετρητή καλύπτει έως τέσσερις γραμμές δημοτικού φωτισμού.</span></div>`:''}

  ${done?`<div class="card"><h3><span class="n">Σ</span>Απολογισμός πίλαρ</h3><div class="body">
   <div class="reads">
    <div class="read"><div class="k">Αναχωρήσεις</div><div class="v">${S.fop.lines.length}</div></div>
    <div class="read"><div class="k">Φωτιστικά</div><div class="v">${T.ls.reduce((a,b)=>a+b.n,0)}</div></div>
    <div class="read"><div class="k">Συνολικό μήκος</div><div class="v">${nf(T.ls.reduce((a,b)=>a+b.L,0),0)}<span class="u"> m</span></div></div>
    <div class="read"><div class="k">Συνολικό φορτίο</div><div class="v">${nf(T.kW,3)}<span class="u"> kW</span></div></div>
    <div class="read"><div class="k">Εκτ. κατανάλωση</div><div class="v">${T.kWh}<span class="u"> kWh/έτος</span></div></div>
    <div class="read hl"><div class="k">Παροχή ΔΕΔΔΗΕ</div><div class="v" style="font-size:14px">${esc(T.paroxi.lbl)}</div></div>
   </div>
   <div class="scroll" style="margin-top:12px"><table class="t"><thead><tr>
     <th>Αναχώρηση</th><th class="num">Φωτ.</th><th class="num">W</th><th class="num">Μήκος</th><th class="num">kW</th>
     <th class="num">I<sub>B</sub></th><th>Μικροαυτ.</th><th>Καλώδιο</th><th class="num">ΔU%</th><th>ΔΔΕ</th></tr></thead><tbody>
    ${T.ls.map(c=>`<tr><td>${esc(c.name)}</td><td class="num">${c.n}</td><td class="num">${c.w}</td>
      <td class="num">${nf(c.L,0)} m</td><td class="num">${nf(c.kW,3)}</td><td class="num">${nf(c.IB,2)}</td>
      <td>${c.In}A ${c.curve}</td><td>J1VV ${c.cores}×${c.S}</td>
      <td class="num" style="color:${c.okDU?'var(--green)':'var(--red)'}">${nf(c.dU.pct,2)}</td><td>30 mA</td></tr>`).join('')}
    ${S.fop.spare?`<tr class="muted"><td>Εφεδρική (ανενεργή)</td><td class="num">—</td><td class="num">—</td><td class="num">—</td><td class="num">—</td><td class="num">—</td><td>ίδια</td><td>ίδια διατομή</td><td class="num">—</td><td>30 mA</td></tr>`:''}
   </tbody></table></div>
   <div class="note ok" style="margin-bottom:0"><b>Πρόταση παροχής</b>
    Για ${nf(T.kW,3)} kW συνολικά (${nf(T.kW/0.95,2)} kVA) προτείνεται <b>${esc(T.paroxi.lbl)} — ${T.paroxi.kVA} kVA</b>,
    ασφάλεια παροχής ${T.paroxi.fuse}A, γενικός πίλαρ ${T.paroxi.gen}A, καλώδιο παροχής ${T.paroxi.cable}.</div>
  </div></div>`:''}
  `,navbar({disabled:!done}));
}

/* ==== 06_bld.js ==== */
/* ===========================================================
   06 — ΚΤΙΡΙΟ: ΔΕΝΤΡΟ ΠΙΝΑΚΩΝ
   =========================================================== */
function newPanel(o){
  return Object.assign({id:uid(),parent:null,code:'ΓΠ',name:'Γενικός Πίνακας',ks:1,
    feedL:12,feedMethod:'B',cir:[],note:''},o||{});
}
function newCircuit(lib,i){
  const l=lib||{n:'Νέα γραμμή',p:1,ph:1,mcb:16,S:2.5,rcd:30,cat:'Ρ'};
  return{id:uid(),name:l.n,kW:l.p,ph:l.ph,L:15,method:'B',grp:1,minS:l.S,Sfixed:null,
    rcd:l.rcd,curve:'C',cat:l.cat,phase:'L1',note:''};
}
function libFor(){return LOADS[S.route.btype]||LOADS.small;}

function scaffold(){
  const t=TPL[S.route.btype]||TPL.small, lib=libFor();
  const find=n=>lib.find(x=>x.n===n)||{n,p:1,ph:1,mcb:16,S:2.5,rcd:30,cat:'Ρ'};
  S.pan=[];
  const gp=newPanel({code:'ΓΠ',name:'Γενικός Πίνακας',ks:t.ks,feedL:15});
  t.circuits.forEach(c=>gp.cir.push(newCircuit(find(c))));
  S.pan.push(gp);
  t.sub.forEach((s,i)=>{
    const sp=newPanel({parent:gp.id,code:'Υ'+(i+1),name:s.n,ks:0.85,feedL:25});
    s.c.forEach(c=>sp.cir.push(newCircuit(find(c))));
    S.pan.push(sp);
    if(S.route.btype==='school'){
      for(let k=1;k<=4;k++){
        const rp=newPanel({parent:sp.id,code:'Υ'+(i+1)+'.'+k,name:'Αίθουσα '+(i+1)+'.'+k,ks:0.9,feedL:18});
        ['Φωτισμός αίθουσας','Ρευματοδότες αίθουσας','Κλιματισμός αίθουσας'].forEach(c=>rp.cir.push(newCircuit(find(c))));
        S.pan.push(rp);
      }
    }
  });
  S.pan.forEach(balance);
  render();touch();
}

function addPanel(parent){
  const lvl=parent?(panelById(parent).parent?3:2):1;
  const n=S.pan.filter(p=>p.parent===parent).length+1;
  S.pan.push(newPanel({parent,code:lvl===1?'ΓΠ':'Υ'+n,name:lvl===1?'Γενικός Πίνακας':'Υποπίνακας '+n,ks:lvl===1?0.8:0.9}));
  render();touch();
}
function delPanel(id){
  const kill=i=>{children(i).forEach(k=>kill(k.id));S.pan=S.pan.filter(p=>p.id!==i);};
  kill(id);render();touch();
}
function addCircuit(pid){
  const p=panelById(pid);p.cir.push(newCircuit(libFor()[0]));balance(p);render();touch();
}
function delCircuit(pid,cid){const p=panelById(pid);p.cir=p.cir.filter(c=>c.id!==cid);balance(p);render();touch();}

function panelBlock(p,lvl){
  const idx=S.pan.indexOf(p);
  const kids=children(p.id);
  const L=panelLoad(p.id);
  const open=PANEL_OPEN===p.id;
  const feed=(()=>{
    const ph=p.cir.some(c=>+c.ph===3)||L.dem>7?3:1;
    return sizeLine({kW:L.dem,ph,L:+p.feedL||15,method:p.feedMethod||'B',amb:30,grp:1,dUlim:2,cosf:0.9,minS:2.5,curve:'C',Zsup:0.4});
  })();
  const bad=p.cir.map((c,i)=>circuitCalc(c,p)).filter(r=>!r.okI||!r.okDU||!r.okDisc).length;
  return `<div class="pnode lvl${Math.min(3,lvl)}">
   <div class="h" data-openpanel="${p.id}">
     <span class="code">${esc(p.code)}</span><span class="nm">${esc(p.name)}</span>
     <span class="pill cy">${p.cir.length} γραμμές</span>
     <span class="pill">${nf(L.dem,2)} kW</span>
     ${bad?`<span class="pill bad">${bad} θέμα${bad>1?'τα':''}</span>`:'<span class="pill ok">εντάξει</span>'}
     <span class="sp"></span>
     <span class="muted mono">${open?'▾':'▸'}</span>
   </div>
   ${open?`<div class="body" style="padding:0 12px 12px">
     <div class="grid g4" style="margin-bottom:10px">
       <div class="f"><label>Κωδικός</label><input ${bind('pan.'+idx+'.code')} data-live="1"></div>
       <div class="f"><label>Ονομασία</label><input ${bind('pan.'+idx+'.name')} data-live="1"></div>
       <div class="f"><label>Συντ. ετεροχρονισμού</label><input type="number" step="0.05" min="0.3" max="1" ${bind('pan.'+idx+'.ks','num')} data-live="1"></div>
       <div class="f"><label>Μήκος τροφοδοσίας (m)</label><input type="number" ${bind('pan.'+idx+'.feedL','num')} data-live="1"></div>
     </div>
     <div class="reads" style="margin-bottom:11px">
      <div class="read"><div class="k">Εγκατεστημένη</div><div class="v">${nf(L.inst,2)}<span class="u"> kW</span></div></div>
      <div class="read"><div class="k">Ζήτηση</div><div class="v">${nf(L.dem,2)}<span class="u"> kW</span></div></div>
      <div class="read"><div class="k">Τροφοδοσία</div><div class="v" style="font-size:14px">${feed.cores}×${feed.S}</div></div>
      <div class="read"><div class="k">Γενικός πίνακα</div><div class="v">${feed.In}<span class="u"> A</span></div></div>
      <div class="read ${feed.okDU?'ok':'warn'}"><div class="k">ΔU τροφοδ.</div><div class="v">${nf(feed.dU.pct,2)}<span class="u"> %</span></div></div>
     </div>
     <div class="scroll"><table class="t"><thead><tr>
       <th style="min-width:150px">Γραμμή</th><th class="num">kW</th><th>Φ</th><th class="num">L (m)</th>
       <th>Όδευση</th><th>Φάση</th><th class="num">I<sub>B</sub></th><th>Ασφ.</th><th>Καλώδιο</th>
       <th class="num">ΔU%</th><th>ΔΔΕ</th><th></th></tr></thead><tbody>
      ${p.cir.map((c,ci)=>{const r=circuitCalc(c,p);
        const cls=(!r.okI||!r.okDisc)?'style="color:var(--red);font-weight:600"':(!r.okDU?'style="color:var(--amber);font-weight:600"':'');
        return `<tr>
        <td><input ${bind('pan.'+idx+'.cir.'+ci+'.name')} list="lib"></td>
        <td class="num" style="width:76px"><input type="number" step="0.1" ${bind('pan.'+idx+'.cir.'+ci+'.kW','num')} data-live="1"></td>
        <td style="width:62px"><select ${bind('pan.'+idx+'.cir.'+ci+'.ph')}><option value="1" ${+c.ph===1?'selected':''}>1Φ</option><option value="3" ${+c.ph===3?'selected':''}>3Φ</option></select></td>
        <td class="num" style="width:70px"><input type="number" ${bind('pan.'+idx+'.cir.'+ci+'.L','num')} data-live="1"></td>
        <td style="width:64px"><select ${bind('pan.'+idx+'.cir.'+ci+'.method')}>${Object.keys(METHODS).map(m=>`<option value="${m}" ${c.method===m?'selected':''}>${m}</option>`).join('')}</select></td>
        <td><span class="ph ${(+c.ph===3?'l1':(c.phase||'L1').toLowerCase())}"></span>${+c.ph===3?'3Φ':(c.phase||'L1')}</td>
        <td class="num">${nf(r.IB,2)}</td>
        <td ${cls}>${r.In}A ${r.curve}</td>
        <td ${cls}>${r.cores}×${r.S}</td>
        <td class="num" ${cls}>${nf(r.dU.pct,2)}</td>
        <td style="width:76px"><select ${bind('pan.'+idx+'.cir.'+ci+'.rcd')}><option value="0" ${+c.rcd===0?'selected':''}>—</option>${RCD_I.map(x=>`<option value="${x}" ${+c.rcd===x?'selected':''}>${x} mA</option>`).join('')}</select></td>
        <td><button class="btn sm danger" data-delcir="${p.id}|${c.id}">×</button></td></tr>`;}).join('')}
     </tbody></table></div>
     <div class="row" style="margin-top:10px">
       <button class="btn sm" data-addcir="${p.id}">+ Γραμμή</button>
       <button class="btn sm ghost" data-addpanel="${p.id}">+ Υποπίνακας</button>
       <button class="btn sm ghost" data-balance="${p.id}">Ισοκατανομή φάσεων</button>
       <span class="sp" style="flex:1"></span>
       <button class="btn sm danger" data-delpanel="${p.id}">Διαγραφή πίνακα</button>
     </div>
   </div>`:''}
   ${kids.length?`<div class="kids">${kids.map(k=>panelBlock(k,lvl+1)).join('')}</div>`:''}
  </div>`;
}

function vBld(){
  const T=totalLoad();
  const rec=pickParoxi(T.dem,0.9);
  const has=S.pan.length>0;
  return shell(`
  <datalist id="lib">${libFor().map(l=>`<option value="${l.n}">`).join('')}</datalist>
  <div class="hdr"><div class="eyebrow">${esc(BT_L[S.route.btype]||'Κτίριο')}</div><h1>Πίνακες και γραμμές</h1>
   <p>Γενικός πίνακας, υποπίνακες, υπο-υποπίνακες. Κάθε πίνακας κρατά τις δικές του γραμμές και βγάζει δικό του μονογραμμικό· το άθροισμα ανεβαίνει προς τα πάνω με τον συντελεστή ετεροχρονισμού κάθε επιπέδου.</p></div>

  ${!has?`<div class="card"><h3><span class="n">έναρξη</span>Στήσιμο δέντρου</h3><div class="body">
    <p>Ξεκίνα από το πρότυπο του κτιρίου και πείραξε ό,τι δεν ταιριάζει, ή χτίσε από το μηδέν.</p>
    <div class="note"><b>${esc(TPL[S.route.btype].lbl)}</b>
     ${S.route.btype==='school'?'Γενικός πίνακας + 4 πτέρυγες × 4 αίθουσες = 21 πίνακες σε τρία επίπεδα.'
      :S.route.btype==='municipal'?'Γενικός πίνακας + 5 υποπίνακες (ισόγειο, Α΄, Β΄, μηχανοστάσιο, data).'
      :S.route.btype==='small'?'Γενικός πίνακας + 1 υποπίνακας ισογείου.'
      :'Ένας πίνακας με τις τυπικές γραμμές κατοικίας.'}</div>
    <div class="row"><button class="btn" data-act="scaffold">Στήσιμο από πρότυπο</button>
    <button class="btn ghost" data-addpanel="">Κενός γενικός πίνακας</button></div>
  </div></div>`:`
  <div class="reads" style="margin-bottom:14px">
   <div class="read"><div class="k">Πίνακες</div><div class="v">${S.pan.length}</div></div>
   <div class="read"><div class="k">Γραμμές</div><div class="v">${S.pan.reduce((a,p)=>a+p.cir.length,0)}</div></div>
   <div class="read"><div class="k">Εγκατεστημένη</div><div class="v">${nf(T.inst,2)}<span class="u"> kW</span></div></div>
   <div class="read"><div class="k">Ζήτηση</div><div class="v">${nf(T.dem,2)}<span class="u"> kW</span></div></div>
   <div class="read hl"><div class="k">Παροχή</div><div class="v" style="font-size:14px">${esc(rec.lbl)}</div></div>
  </div>
  <div class="ptree">${roots().map(p=>panelBlock(p,1)).join('')}</div>
  <div class="row" style="margin:10px 0 0">
   <button class="btn ghost" data-addpanel="">+ Ανεξάρτητος πίνακας</button>
   <button class="btn ghost" data-act="scaffold">Επαναφορά προτύπου</button></div>
  `}
  `,navbar({disabled:!has}));
}

/* ==== 07_sld.js ==== */
/* ===========================================================
   07 — ΜΟΝΟΓΡΑΜΜΙΚΑ ΣΧΕΔΙΑ (SVG)
   =========================================================== */
const sv={
 meter:(x,y)=>`<circle class="dev" cx="${x}" cy="${y}" r="13"/><text x="${x-9}" y="${y+3}" style="font-size:8px">kWh</text>`,
 fuse:(x,y)=>`<rect class="dev" x="${x-6}" y="${y-11}" width="12" height="22"/><path class="w" d="M${x} ${y-11}V${y+11}"/>`,
 mcb:(x,y,t)=>`<rect class="dev" x="${x-9}" y="${y-13}" width="18" height="26"/><path class="w" d="M${x-5} ${y+7}l10-14"/><circle cx="${x-5}" cy="${y+7}" r="1.6" fill="#111"/>${t?`<text x="${x+13}" y="${y+3}">${t}</text>`:''}`,
 rcd:(x,y,t)=>`<rect class="dev" x="${x-11}" y="${y-13}" width="22" height="26"/><path class="w" d="M${x-6} ${y+7}l12-14"/><circle class="dev" cx="${x}" cy="${y}" r="5.5"/><text x="${x-3.2}" y="${y+2.6}" style="font-size:7px">I∆</text>${t?`<text x="${x+15}" y="${y+3}">${t}</text>`:''}`,
 sw:(x,y)=>`<path class="w" d="M${x} ${y-12}v6"/><path class="w" d="M${x} ${y+12}v-6"/><path class="w" d="M${x} ${y-6}l7 12"/><circle cx="${x}" cy="${y-6}" r="1.8" fill="#111"/>`,
 spd:(x,y)=>`<rect class="dev" x="${x-8}" y="${y-10}" width="16" height="20"/><path class="w" d="M${x-4} ${y-5}l8 10M${x-4} ${y+5}l8-10"/>`,
 earth:(x,y)=>`<path class="wpe" d="M${x} ${y}v10"/><path class="wpe" d="M${x-9} ${y+10}h18M${x-6} ${y+14}h12M${x-3} ${y+18}h6"/>`,
 lamp:(x,y,c)=>`<circle cx="${x}" cy="${y}" r="5" fill="${c||'#E8C24A'}" stroke="#111" stroke-width="1"/><path class="w" d="M${x-3.4} ${y-3.4}l6.8 6.8M${x+3.4} ${y-3.4}l-6.8 6.8"/>`,
 relay:(x,y)=>`<rect class="dev" x="${x-11}" y="${y-11}" width="22" height="22"/><rect class="dev" x="${x-4}" y="${y-6}" width="8" height="12"/>`,
 clock:(x,y)=>`<circle class="dev" cx="${x}" cy="${y}" r="9"/><path class="w" d="M${x} ${y}V${y-5}M${x} ${y}l4 3"/>`
};
const PH_C={L1:'#8A5A34',L2:'#2B2B2B',L3:'#8E9296'};

function sldFop(){
  const T=fopTotals(), p=paroxiById(S.sup.tier)||T.paroxi;
  const lines=T.ls, nL=lines.length+(S.fop.spare?1:0);
  const W=Math.max(900,300+nL*185), H=520;
  let g='';
  /* κεφαλή */
  g+=`<text x="24" y="26" class="ttl">ΜΟΝΟΓΡΑΜΜΙΚΟ — ${esc(S.fop.name)}</text>`;
  g+=`<text x="24" y="42" class="sm">${esc(S.prj.title||'')} · ${esc(S.prj.dimos?'Δήμος '+S.prj.dimos:'')} · παροχή ${esc(S.prj.paroxi||'(νέα)')} · ${gr(S.doc.issue)}</text>`;
  let y=80,x=70;
  g+=`<text x="24" y="${y-22}" class="lbl">ΔΙΚΤΥΟ ΔΕΔΔΗΕ ${p.ph===3?'3Φ+Ν 400/230V':'1Φ+Ν 230V'}</text>`;
  g+=`<path class="w" d="M24 ${y}h${x-24-14}"/>`+sv.meter(x,y);
  g+=`<text x="${x-16}" y="${y-20}" class="sm">μετρητής ${esc(S.prj.metritis||'')}</text>`;
  x+=14;g+=`<path class="w" d="M${x} ${y}h34"/>`;x+=34;
  g+=sv.fuse(x,y)+`<text x="${x-14}" y="${y+30}" class="sm">ασφ. ${p.fuse}A</text>`;
  x+=40;g+=`<path class="w" d="M${x-40} ${y}h40"/>`;
  g+=sv.sw(x,y)+`<text x="${x-16}" y="${y-24}" class="sm">γενικός ${p.gen}A</text>`;
  x+=44;g+=`<path class="w" d="M${x-44} ${y}h44"/>`;
  if(S.fop.spd){g+=sv.spd(x,y-2)+sv.earth(x,y+8)+`<text x="${x-16}" y="${y-24}" class="sm">SPD T2</text>`;x+=44;g+=`<path class="w" d="M${x-44} ${y}h44"/>`;}
  g+=sv.rcd(x,y,'')+`<text x="${x-24}" y="${y+34}" class="sm">∆∆Ε ${S.fop.rcdHead}mA τύπου S</text>`;
  x+=46;g+=`<path class="w" d="M${x-46} ${y}h46"/>`;
  g+=sv.relay(x,y)+`<text x="${x-18}" y="${y-22}" class="sm">ρελέ ισχύος</text>`;
  if(S.fop.astro){g+=sv.clock(x+34,y-34)+`<text x="${x+46} " y="${y-31}" class="sm">αστρον. χρονοδ.</text><path class="w" d="M${x+34} ${y-25}v14"/>`;}
  if(S.fop.photo){g+=`<circle class="dev" cx="${x+34}" cy="${y+40}" r="8"/><path class="w" d="M${x+29} ${y+35}l10 10"/><text x="${x+46}" y="${y+43}" class="sm">φωτοκύτταρο</text><path class="w" d="M${x+34} ${y+32}v-20"/>`;}
  x+=40;
  /* ζυγοί */
  const bx=x+30, bw=W-bx-30;
  g+=`<path class="w" d="M${x} ${y}h${bx-x}"/>`;
  ['L1','L2','L3'].slice(0,p.ph===3?3:1).forEach((ph,i)=>{
    const yy=190+i*13;
    g+=`<path d="M${bx} ${yy}h${bw}" stroke="${PH_C[ph]}" stroke-width="2.2" fill="none"/><text x="${bx-20}" y="${yy+3.5}" class="sm">${ph}</text>`;
  });
  const yN=190+(p.ph===3?3:1)*13, yPE=yN+13;
  g+=`<path d="M${bx} ${yN}h${bw}" stroke="#2F6FD0" stroke-width="2.2" fill="none"/><text x="${bx-20}" y="${yN+3.5}" class="sm">N</text>`;
  g+=`<path d="M${bx} ${yPE}h${bw}" stroke="#6EA82B" stroke-width="2.2" fill="none"/><text x="${bx-18}" y="${yPE+3.5}" class="sm">PE</text>`;
  g+=`<path class="w" d="M${bx+4} ${y}V190"/>`;
  g+=sv.earth(bx+40,yPE)+`<text x="${bx+52}" y="${yPE+16}" class="sm">γείωση πίλαρ ${S.fop.earth?esc(S.fop.earth)+' Ω':''}</text>`;
  /* αναχωρήσεις */
  lines.forEach((c,i)=>{
    const cx=bx+95+i*185, top=yPE+8;
    g+=`<path class="w" d="M${cx} ${top}v26"/>`;
    g+=sv.rcd(cx,top+40,'30mA');
    g+=`<path class="w" d="M${cx} ${top+53}v22"/>`;
    g+=sv.mcb(cx,top+88,`${c.In}A ${c.curve}`);
    g+=`<path class="w" d="M${cx} ${top+101}v26"/>`;
    g+=`<text x="${cx-72}" y="${top+140}" class="lbl" style="font-weight:700">${esc(c.name)}</text>`;
    g+=`<text x="${cx-72}" y="${top+153}">J1VV ${c.cores}×${c.S} mm² · ${nf(c.L,0)} m</text>`;
    g+=`<text x="${cx-72}" y="${top+165}">${c.n}×${c.w}W = ${nf(c.kW,3)} kW · ΔU ${nf(c.dU.pct,2)}%</text>`;
    /* ιστοί */
    for(let k=0;k<Math.min(4,c.n);k++){
      const lx=cx-52+k*30, ly=top+188;
      const ph=c.ph===3?['L1','L2','L3'][k%3]:'L1';
      g+=`<path class="w" d="M${lx} ${top+170}v${ly-top-176}"/>`+sv.lamp(lx,ly+2,'#E8C24A');
      g+=`<text x="${lx-6}" y="${ly+18}" class="sm" fill="${PH_C[ph]}">${ph}</text>`;
    }
    if(c.n>4)g+=`<text x="${cx+58}" y="${top+192}" class="sm">…×${c.n}</text>`;
  });
  if(S.fop.spare){
    const cx=bx+95+lines.length*185, top=yPE+8;
    g+=`<path class="w" style="stroke-dasharray:4 3" d="M${cx} ${top}v26"/>`+sv.mcb(cx,top+40,'εφεδρ.');
    g+=`<text x="${cx-40}" y="${top+80}" class="sm">εφεδρική αναχώρηση (ανενεργή)</text>`;
  }
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${g}</svg>`;
}

function sldPanel(p){
  const L=panelLoad(p.id), kids=children(p.id);
  const items=p.cir.map((c,i)=>({t:'c',c,r:circuitCalc(c,p)})).concat(kids.map(k=>({t:'p',k})));
  const W=Math.max(760,220+items.length*140),H=430;
  const ph=p.cir.some(c=>+c.ph===3)||L.dem>7?3:1;
  const feed=sizeLine({kW:L.dem,ph,L:+p.feedL||15,method:p.feedMethod||'B',amb:30,grp:1,dUlim:2,cosf:0.9,minS:2.5,curve:'C',Zsup:0.4});
  let g=`<text x="20" y="24" class="ttl">${esc(p.code)} — ${esc(p.name)}</text>
   <text x="20" y="40" class="sm">${esc(S.prj.title||'')} · ζήτηση ${nf(L.dem,2)} kW · τροφοδοσία ${feed.cores}×${feed.S} mm² · ${gr(S.doc.issue)}</text>`;
  let x=60,y=84;
  const parent=p.parent?panelById(p.parent):null;
  g+=`<text x="20" y="${y-22}" class="lbl">${parent?'ΑΠΟ '+esc(parent.code):(paroxiById(S.sup.tier)?'ΠΑΡΟΧΗ '+paroxiById(S.sup.tier).lbl:'ΠΑΡΟΧΗ')}</text>`;
  g+=`<path class="w" d="M20 ${y}h${x-20}"/>`;
  if(!parent){g+=sv.meter(x,y);x+=16;g+=`<path class="w" d="M${x} ${y}h30"/>`;x+=30;
    const pp=paroxiById(S.sup.tier);if(pp){g+=sv.fuse(x,y)+`<text x="${x-14}" y="${y+30}" class="sm">${pp.fuse}A</text>`;x+=40;g+=`<path class="w" d="M${x-40} ${y}h40"/>`;}}
  g+=sv.sw(x,y)+`<text x="${x-14}" y="${y-22}" class="sm">γενικός ${feed.In}A</text>`;
  x+=44;g+=`<path class="w" d="M${x-44} ${y}h44"/>`;
  g+=sv.rcd(x,y,'')+`<text x="${x-20}" y="${y+34}" class="sm">∆∆Ε 300mA S</text>`;
  x+=50;g+=`<path class="w" d="M${x-50} ${y}h50"/>`;
  const bx=x+20,bw=W-bx-24;
  const nph=ph===3?3:1;
  ['L1','L2','L3'].slice(0,nph).forEach((q,i)=>{const yy=170+i*13;
    g+=`<path d="M${bx} ${yy}h${bw}" stroke="${PH_C[q]}" stroke-width="2.2" fill="none"/><text x="${bx-20}" y="${yy+3.5}" class="sm">${q}</text>`;});
  const yN=170+nph*13,yPE=yN+13;
  g+=`<path d="M${bx} ${yN}h${bw}" stroke="#2F6FD0" stroke-width="2.2" fill="none"/><text x="${bx-20}" y="${yN+3.5}" class="sm">N</text>`;
  g+=`<path d="M${bx} ${yPE}h${bw}" stroke="#6EA82B" stroke-width="2.2" fill="none"/><text x="${bx-18}" y="${yPE+3.5}" class="sm">PE</text>`;
  g+=`<path class="w" d="M${bx+4} ${y}V170"/>`;
  if(!parent)g+=sv.earth(bx+34,yPE)+`<text x="${bx+46}" y="${yPE+16}" class="sm">θεμελιακή γείωση</text>`;
  items.forEach((it,i)=>{
    const cx=bx+80+i*140, top=yPE+10;
    if(it.t==='c'){
      const c=it.c,r=it.r;
      g+=`<path class="w" d="M${cx} ${top}v20"/>`;
      let yy=top+20;
      if(+c.rcd>0){g+=sv.rcd(cx,yy+13,c.rcd+'mA');yy+=32;g+=`<path class="w" d="M${cx} ${yy}v14"/>`;yy+=14;}
      g+=sv.mcb(cx,yy+13,`${r.In}A ${r.curve}`);yy+=32;
      g+=`<path class="w" d="M${cx} ${yy}v18"/>`;yy+=18;
      g+=`<text x="${cx-56}" y="${yy+14}" class="lbl" style="font-weight:700">${esc(c.name).slice(0,22)}</text>`;
      g+=`<text x="${cx-56}" y="${yy+26}">${r.cores}×${r.S}mm² · ${nf(c.L,0)}m</text>`;
      g+=`<text x="${cx-56}" y="${yy+37}">${nf(c.kW,2)}kW · ${+c.ph===3?'3Φ':(c.phase||'L1')} · ΔU ${nf(r.dU.pct,1)}%</text>`;
    }else{
      const k=it.k,kl=panelLoad(k.id);
      g+=`<path class="w" d="M${cx} ${top}v24"/>`+sv.mcb(cx,top+37,'')+`<path class="w" d="M${cx} ${top+50}v20"/>`;
      g+=`<rect class="dev" x="${cx-46}" y="${top+70}" width="92" height="34" stroke-width="1.8"/>`;
      g+=`<text x="${cx-40}" y="${top+86}" class="lbl" style="font-weight:700">${esc(k.code)} ${esc(k.name).slice(0,14)}</text>`;
      g+=`<text x="${cx-40}" y="${top+98}">${nf(kl.dem,2)} kW · ${k.cir.length} γρ.</text>`;
    }
  });
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${g}</svg>`;
}

function sldTree(){
  const rs=roots();if(!rs.length)return '';
  const W=1000;let y=70,g=`<text x="20" y="26" class="ttl">ΓΕΝΙΚΟ ΔΙΑΓΡΑΜΜΑ ΔΙΑΝΟΜΗΣ</text>
    <text x="20" y="42" class="sm">${esc(S.prj.title||'')} · σύνολο ${nf(totalLoad().dem,2)} kW</text>`;
  const draw=(p,x,depth)=>{
    const l=panelLoad(p.id);
    g+=`<rect class="dev" x="${x}" y="${y}" width="200" height="32" stroke-width="${depth===0?2:1.2}"/>
        <text x="${x+8}" y="${y+14}" class="lbl" style="font-weight:700">${esc(p.code)} ${esc(p.name).slice(0,20)}</text>
        <text x="${x+8}" y="${y+26}">${nf(l.dem,2)} kW · ${p.cir.length} γραμμές</text>`;
    const my=y;y+=44;
    children(p.id).forEach(k=>{
      const ky=y;
      g+=`<path class="w" d="M${x+16} ${my+32}V${ky+16}h24"/>`;
      draw(k,x+40,depth+1);
    });
    return my;
  };
  rs.forEach(r=>{draw(r,30,0);y+=10;});
  return `<svg viewBox="0 0 ${W} ${y+20}" width="${W}" height="${y+20}">${g}</svg>`;
}

function vSld(){
  const isFop=S.route.cat==='fop';
  const body=isFop?`<div class="card"><h3><span class="n">ΦΟΠ</span>Πίλαρ δημοτικού φωτισμού</h3>
     <div class="body"><div class="sld">${sldFop()}</div></div></div>`
   :`${S.pan.length>1?`<div class="card"><h3><span class="n">Γ</span>Γενικό διάγραμμα διανομής</h3><div class="body"><div class="sld">${sldTree()}</div></div></div>`:''}
     ${S.pan.map(p=>`<div class="card"><h3><span class="n">${esc(p.code)}</span>${esc(p.name)}</h3><div class="body"><div class="sld">${sldPanel(p)}</div></div></div>`).join('')}`;
  return shell(`
  <div class="hdr"><div class="eyebrow">Σχέδια</div><h1>Μονογραμμικά</h1>
   <p>Παράγονται από τα δεδομένα — δεν σχεδιάζονται χειροκίνητα. Κάθε αλλαγή σε γραμμή ή φορτίο τα ξαναχτίζει.</p></div>
  ${body}
  `,navbar({extra:`<button class="btn ghost" data-act="printsld">Εκτύπωση σχεδίων</button>`}));
}

/* ==== 08_meas.js ==== */
/* ===========================================================
   08 — ΕΛΕΓΧΟΙ & ΜΕΤΡΗΣΕΙΣ
   Όρια: μόνωση ≥1 MΩ (500V DC, κυκλ. ≤500V) · ΔΔΕ 30mA ≤300ms στο IΔn,
   ≤40ms στα 5·IΔn · Zs ≤ U0/Ia · TT: R_A·IΔn ≤ 50V.
   =========================================================== */
function allCircuits(){
  if(S.route.cat==='fop'){
    const T=fopTotals();
    return T.ls.map((c,i)=>({key:'F'+(i+1),panel:S.fop.name,name:c.name,S:c.S,cores:c.cores,L:c.L,
      In:c.In,curve:c.curve,rcd:30,ph:c.ph,Zs:c.Zs,Ik:c.Ik}));
  }
  const out=[];
  S.pan.forEach(p=>p.cir.forEach((c,i)=>{const r=circuitCalc(c,p);
    out.push({key:p.code+'.'+(i+1),panel:p.code+' '+p.name,name:c.name,S:r.S,cores:r.cores,L:+c.L||0,
      In:r.In,curve:r.curve,rcd:+c.rcd||0,ph:+c.ph,Zs:r.Zs,Ik:r.Ik});}));
  return out;
}
function measRow(k){
  let m=S.meas.ins.find(x=>x.k===k);
  if(!m){m={k:k,rLL:'',rLN:'',rLPE:'',cont:'',zs:'',ik:'',rcdI:'',rcdT:'',pol:true,note:''};S.meas.ins.push(m);}
  return m;
}
function fillReference(){
  const cs=allCircuits();
  S.meas.ins=cs.map(c=>{
    const zs=+(c.Zs*1.05).toFixed(2);
    return{k:c.key,rLL:'>200',rLN:'>200',rLPE:'>200',cont:(RHO_CU_H*c.L*2/Math.max(1.5,c.S)).toFixed(2),
      zs:zs.toFixed?zs.toFixed(2):zs, ik:Math.round(U0*0.95/zs),
      rcdI:c.rcd?Math.round(c.rcd*0.7):'', rcdT:c.rcd?Math.round(18+Math.random()*10):'',
      pol:true,note:''};
  });
  S.meas.earth=S.meas.earth||'3.5';
  S.meas.filled=true;S.meas.confirmed=false;
  VISUAL.forEach((v,i)=>{S.meas.vis['v'+i]=false;});
  render();touch();
}
function limitOf(c,m){
  const out=[];
  const ins=v=>{const s=String(v||'').replace('>','');const n=parseFloat(s);return isNaN(n)?null:n;};
  [['rLL','L-L'],['rLN','L-N'],['rLPE','L-PE']].forEach(([f,l])=>{
    const v=ins(m[f]);if(v!==null&&v<1)out.push(l+' '+v+' MΩ < 1 MΩ');
  });
  const zs=parseFloat(m.zs);
  if(!isNaN(zs)){
    const Ia=c.In*CURVES[c.curve||'C'].k;
    if(zs>U0/Ia)out.push('Zs '+zs+'Ω > '+nf(U0/Ia,2)+'Ω (δεν εξασφαλίζεται αποσύνδεση)');
  }
  const t=parseFloat(m.rcdT);
  if(c.rcd&&!isNaN(t)&&t>300)out.push('ΔΔΕ '+t+' ms > 300 ms');
  const ri=parseFloat(m.rcdI);
  if(c.rcd&&!isNaN(ri)&&ri>c.rcd)out.push('ΔΔΕ ρεύμα λειτ. '+ri+' mA > IΔn '+c.rcd+' mA');
  return out;
}
function measStatus(){
  const cs=allCircuits();let issues=0,empty=0;
  cs.forEach(c=>{const m=S.meas.ins.find(x=>x.k===c.key);
    if(!m||!m.zs||!m.rLPE){empty++;return;}
    issues+=limitOf(c,m).length;});
  const visDone=VISUAL.every((v,i)=>S.meas.vis['v'+i]);
  return{n:cs.length,empty,issues,visDone,ready:!empty&&!issues&&visDone};
}

function vMeas(){
  const cs=allCircuits(), st=measStatus();
  const earthLim=50/((S.route.cat==='fop'?(S.fop.rcdHead||300):300)/1000);
  return shell(`
  <div class="hdr"><div class="eyebrow">Έλεγχος</div><h1>Οπτικός έλεγχος και μετρήσεις</h1>
   <p>Τα όρια ελέγχονται ζωντανά. Οι τιμές μπαίνουν από το όργανο· η εφαρμογή μπορεί να προσυμπληρώσει τιμές αναφοράς για ταχύτητα, αλλά το έντυπο μένει προσχέδιο ώσπου να δηλώσεις ρητά ότι είναι πραγματικές.</p></div>

  <div class="reads" style="margin-bottom:14px">
   <div class="read"><div class="k">Κυκλώματα</div><div class="v">${st.n}</div></div>
   <div class="read ${st.empty?'warn':'ok'}"><div class="k">Ασυμπλήρωτα</div><div class="v">${st.empty}</div></div>
   <div class="read ${st.issues?'bad':'ok'}"><div class="k">Εκτός ορίων</div><div class="v">${st.issues}</div></div>
   <div class="read ${st.visDone?'ok':'warn'}"><div class="k">Οπτικός έλεγχος</div><div class="v" style="font-size:14px">${st.visDone?'πλήρης':'εκκρεμεί'}</div></div>
   <div class="read ${S.meas.confirmed?'ok':'warn'}"><div class="k">Κατάσταση</div><div class="v" style="font-size:14px">${S.meas.confirmed?'επιβεβαιωμένες':'προσχέδιο'}</div></div>
  </div>

  <div class="card"><h3><span class="n">1</span>Οπτικός έλεγχος<span class="sp"></span>
    <span class="muted" style="font-size:12px">συμπληρώνεται μόνο από άνθρωπο</span></h3><div class="body">
   <div class="grid g2">${VISUAL.map((v,i)=>`<label class="chk"><input type="checkbox" ${S.meas.vis['v'+i]?'checked':''} data-vis="${i}"><span>${v}</span></label>`).join('')}</div>
  </div></div>

  <div class="card"><h3><span class="n">2</span>Γείωση & ισοδυναμικές συνδέσεις</h3><div class="body"><div class="grid g4">
    <div class="f"><label>Αντίσταση γείωσης R<sub>A</sub> (Ω)</label><input ${bind('meas.earth')} data-live="1"></div>
    <div class="f"><label>Όριο (TT, R<sub>A</sub>·I∆n ≤ 50V)</label><input value="${nf(earthLim,1)}" disabled></div>
    <div class="f"><label>Σύστημα γείωσης</label><input value="TT" disabled></div>
    <div class="f"><label>Ημ/νία μετρήσεων</label><input type="date" ${bind('meas.cdate')}></div>
  </div>
  ${S.meas.earth&&parseFloat(S.meas.earth)>earthLim?`<div class="note bad"><b>Εκτός ορίου</b>R<sub>A</sub>=${esc(S.meas.earth)} Ω > ${nf(earthLim,1)} Ω. Απαιτείται βελτίωση γείωσης ή ΔΔΕ μικρότερου I∆n.</div>`:
    (S.meas.earth?`<div class="note ok" style="margin-bottom:0">R<sub>A</sub>=${esc(S.meas.earth)} Ω ≤ ${nf(earthLim,1)} Ω — η τάση επαφής παραμένει κάτω από 50 V.</div>`:'')}
  </div></div>

  <div class="card"><h3><span class="n">3</span>Μετρήσεις ανά κύκλωμα<span class="sp"></span>
    <button class="btn sm ghost" data-act="fillref">Συμπλήρωση τιμών αναφοράς</button></h3><div class="body">
   <div class="scroll"><table class="t"><thead><tr>
     <th>Κωδ.</th><th style="min-width:130px">Κύκλωμα</th><th>Καλ.</th><th class="num">In</th>
     <th class="num">R L-L</th><th class="num">R L-N</th><th class="num">R L-PE</th>
     <th class="num">Συνέχεια PE (Ω)</th><th class="num">Z<sub>s</sub> (Ω)</th><th class="num">I<sub>k</sub> (A)</th>
     <th class="num">I∆ (mA)</th><th class="num">t (ms)</th><th>Έλεγχος</th></tr></thead><tbody>
    ${cs.map((c,i)=>{const m=measRow(c.key);const iss=limitOf(c,m);
      return `<tr><td class="mono">${esc(c.key)}</td><td>${esc(c.name)}<div class="muted" style="font-size:11px">${esc(c.panel)}</div></td>
      <td class="mono">${c.cores}×${c.S}</td><td class="num">${c.In}</td>
      ${['rLL','rLN','rLPE','cont','zs','ik','rcdI','rcdT'].map(f=>`<td class="num" style="width:74px"><input data-m="${c.key}|${f}" value="${esc(m[f])}"></td>`).join('')}
      <td>${iss.length?`<span class="pill bad" title="${esc(iss.join(' · '))}">${iss.length} εκτός</span>`:(m.zs?'<span class="pill ok">ΟΚ</span>':'<span class="pill">κενό</span>')}</td></tr>`;}).join('')}
   </tbody></table></div>
   ${st.issues?`<div class="note bad" style="margin-top:11px"><b>${st.issues} τιμές εκτός ορίων</b>
    Πέρνα τον δείκτη πάνω στην ένδειξη κάθε γραμμής για τη λεπτομέρεια. Η ΥΔΕ δεν οριστικοποιείται με ευρήματα εκτός ορίων — πρώτα η αποκατάσταση.</div>`:''}
  </div></div>

  <div class="card"><h3><span class="n">4</span>Οριστικοποίηση</h3><div class="body">
   ${S.org.serial?'':'<div class="note warn"><b>Λείπει το όργανο</b>Συμπλήρωσε κατασκευαστή, μοντέλο, σειριακό και πιστοποιητικό διακρίβωσης στις Καρτέλες. Χωρίς αυτά η μέτρηση δεν τεκμηριώνεται.</div>'}
   <label class="chk"><input type="checkbox" ${S.meas.confirmed?'checked':''} data-act="confirm" ${st.ready&&S.org.serial?'':'disabled'}>
     <span><b>Δηλώνω ότι οι παραπάνω τιμές είναι πραγματικές μετρήσεις</b> που έλαβα ο ίδιος στην εγκατάσταση με το όργανο
     ${esc(S.org.brand||'—')} ${esc(S.org.model||'')} (S/N ${esc(S.org.serial||'—')}, πιστοπ. διακρίβωσης ${esc(S.org.cert||'—')}),
     και ότι ο οπτικός έλεγχος διενεργήθηκε επιτόπου.</span></label>
   ${!st.ready?`<div class="note warn" style="margin-bottom:0">Για να ενεργοποιηθεί η οριστικοποίηση: ${[st.empty?st.empty+' ασυμπλήρωτα κυκλώματα':'',st.issues?st.issues+' τιμές εκτός ορίων':'',!st.visDone?'ημιτελής οπτικός έλεγχος':''].filter(Boolean).join(' · ')}.</div>`
    :(S.meas.confirmed?'<div class="note ok" style="margin-bottom:0">Οριστικοποιημένο. Τα έντυπα εκτυπώνονται χωρίς σήμανση προσχεδίου.</div>':'')}
  </div></div>
  `,navbar({nextLabel:'Έντυπα →'}));
}

/* ==== 09_docs.js ==== */
/* ===========================================================
   09 — ΕΝΤΥΠΑ
   =========================================================== */
const KIND_L={new:'ΝΕΑ ΕΓΚΑΤΑΣΤΑΣΗ',routine:'ΕΠΑΝΕΛΕΓΧΟΣ',upgrade:'ΕΠΑΥΞΗΣΗ ΙΣΧΥΟΣ',special:'ΕΚΤΑΚΤΟΣ ΕΛΕΓΧΟΣ'};
const draft=()=>S.meas.confirmed?'':'<div class="stamp">ΠΡΟΣΧΕΔΙΟ</div>';
const F=(v,w)=>`<span class="fill" style="min-width:${w||60}px">${esc(v||'')}</span>`;
const instName=()=>[S.inst.ep,S.inst.on].filter(Boolean).join(' ');
const addrLine=()=>[S.prj.addr,S.prj.num].filter(Boolean).join(' ')+(S.prj.ke?', '+S.prj.ke:'')+(S.prj.dimos?', Δ. '+S.prj.dimos:'')+(S.prj.tk?', Τ.Κ. '+S.prj.tk:'');
function nextDate(){const e=EPAN.find(x=>x.id===S.doc.cat)||EPAN[0];return addYears(S.doc.issue,e.y);}
const kindKey=()=>S.route.mode==='new'?'new':(S.route.insp||'routine');

/* ---------------- ΥΔΕ ---------------- */
function docYDE(){
  const k=kindKey(), p=paroxiById(S.sup.tier);
  const box=(t,b)=>`<div class="d-box"><div class="bt">${t}</div><div class="bb">${b}</div></div>`;
  const ck=on=>`<span style="display:inline-block;width:11px;height:11px;border:1px solid #000;text-align:center;line-height:10px;font-weight:700;margin-right:3px">${on?'X':''}</span>`;
  return `<div class="sheet">${draft()}
   <div class="d-hdr">
     <div class="t3">ΥΠΟΥΡΓΕΙΟ ΑΝΑΠΤΥΞΗΣ — ΓΕΝΙΚΗ ΓΡΑΜΜΑΤΕΙΑ ΒΙΟΜΗΧΑΝΙΑΣ</div>
     <div class="t1">ΥΠΕΥΘΥΝΗ ΔΗΛΩΣΗ ΑΔΕΙΟΥΧΟΥ ΗΛΕΚΤΡΟΛΟΓΟΥ ΕΓΚΑΤΑΣΤΑΤΗ</div>
     <div class="t2">(Υ.Α. Φ.7.5/1816/88/2004 — ΦΕΚ 470/Β΄ &amp; Φ.50/503/168/2011 — ΦΕΚ 844/Β΄)</div>
   </div>
   ${box('1. Στοιχεία αδειούχου ηλεκτρολόγου εγκαταστάτη',`
    <table class="n"><tr><td style="width:50%">Επώνυμο: ${F(S.inst.ep,150)}</td><td>Όνομα: ${F(S.inst.on,130)}</td></tr>
    <tr><td>Πατρώνυμο: ${F(S.inst.pat,140)}</td><td>Αρ. άδειας: ${F(S.inst.adeia,120)}</td></tr>
    <tr><td>Ομάδα Α΄ / Βαθμίδα: ${F(S.inst.omada+' — '+S.inst.bathm,120)}</td><td>Α.Φ.Μ.: ${F(S.inst.afm,100)} Δ.Ο.Υ.: ${F(S.inst.doy,90)}</td></tr>
    <tr><td>Διεύθυνση: ${F(S.inst.addr,150)}</td><td>Τ.Κ.: ${F(S.inst.tk,60)} Τηλ.: ${F(S.inst.tel,100)}</td></tr></table>`)}
   ${box('2. Στοιχεία ιδιοκτήτη / καταναλωτή',`
    <table class="n"><tr><td style="width:60%">Ονοματεπώνυμο / Επωνυμία: ${F(S.own.nm,220)}</td><td>Α.Φ.Μ.: ${F(S.own.afm,100)}</td></tr>
    <tr><td>Διεύθυνση: ${F(S.own.addr,220)}</td><td>Τηλ.: ${F(S.own.tel,100)}</td></tr>
    <tr><td colspan="2">Χρήστης εγκατάστασης: ${F(S.usr.same?S.own.nm:S.usr.nm,300)}</td></tr></table>`)}
   ${box('3. Στοιχεία ηλεκτρικής εγκατάστασης',`
    <table class="n"><tr><td colspan="2">Διεύθυνση εγκατάστασης: ${F(addrLine(),420)}</td></tr>
    <tr><td style="width:50%">Αριθμός παροχής ΔΕΔΔΗΕ: ${F(S.prj.paroxi||(S.route.mode==='new'?'(νέα — θα αποδοθεί)':''),150)}</td>
        <td>Αριθμός μετρητή: ${F(S.prj.metritis,120)}</td></tr>
    <tr><td>Είδος εγκατάστασης: ${F(S.prj.useKind||(S.route.cat==='fop'?'Δημοτικός φωτισμός οδών':BT_L[S.route.btype]),180)}</td>
        <td>Είδος παροχής: ${F(p?p.lbl+' ('+p.kVA+' kVA)':'',170)}</td></tr>
    <tr><td>Συμφωνημένη ισχύς: ${F((S.sup.agreed||(p?p.kVA:''))+' kVA',90)}</td>
        <td>Εγκατεστημένη ισχύς: ${F(nf(S.route.cat==='fop'?fopTotals().kW:totalLoad().inst,2)+' kW',90)}</td></tr></table>`)}
   ${box('4. Είδος δήλωσης',`
    <table class="n"><tr>
     <td>${ck(k==='new')} Νέα εγκατάσταση</td>
     <td>${ck(k==='routine')} Επανέλεγχος</td>
     <td>${ck(k==='upgrade')} Επαύξηση ισχύος</td>
     <td>${ck(k==='special')} Έκτακτος έλεγχος</td></tr></table>
     ${S.doc.remarks?`<div style="margin-top:3px">Αιτία / παρατήρηση: ${F(S.doc.remarks,380)}</div>`:''}`)}
   <div class="d-box"><div class="bt">5. Δήλωση</div><div class="bb d-note">
    Ο υπογράφων αδειούχος ηλεκτρολόγος εγκαταστάτης δηλώνω υπεύθυνα ότι η ανωτέρω ηλεκτρική εγκατάσταση
    ${k==='new'?'κατασκευάσθηκε':'ελέγχθηκε'} σύμφωνα με τις διατάξεις του Προτύπου <b>ΕΛΟΤ HD 384</b> και των λοιπών ισχυόντων
    κανονισμών και προτύπων, ότι διενήργησα τον προβλεπόμενο αρχικό/περιοδικό έλεγχο (οπτικό έλεγχο, δοκιμές και μετρήσεις)
    με πιστοποιημένο και διακριβωμένο όργανο, ότι τα αποτελέσματα των μετρήσεων καταγράφονται στο συνημμένο Πρωτόκολλο Ελέγχου
    και βρίσκονται εντός των επιτρεπομένων ορίων, και ότι η εγκατάσταση κρίνεται <b>κατάλληλη και ασφαλής για λειτουργία</b>.
    Η εγκατάσταση παραδόθηκε στον ιδιοκτήτη/χρήστη με τις απαραίτητες οδηγίες λειτουργίας και συντήρησης.
   </div></div>
   ${box('6. Συνημμένα',`
    <table class="n"><tr><td>${ck(1)} Πρωτόκολλο ελέγχου κατά ΕΛΟΤ HD 384</td><td>${ck(1)} Μονογραμμικό σχέδιο πινάκων</td></tr>
    <tr><td>${ck(1)} Έκθεση παράδοσης ηλεκτρικής εγκατάστασης</td><td>${ck(1)} Καταγραφή στοιχείων ηλεκτρικής εγκατάστασης</td></tr></table>`)}
   ${box('7. Επόμενος επανέλεγχος',`
     Κατηγορία χώρου: ${F((EPAN.find(x=>x.id===S.doc.cat)||EPAN[0]).lbl,300)} —
     επόμενος έλεγχος έως ${F(gr(nextDate()),90)}`)}
   <div class="d-sign">
     <div>Ο ΙΔΙΟΚΤΗΤΗΣ / ΧΡΗΣΤΗΣ<div class="ln"></div>${esc(S.own.nm||'')}</div>
     <div>${esc(S.prj.dimos?S.prj.dimos+', ':'')}${gr(S.doc.issue)}<br>Ο ΗΛΕΚΤΡΟΛΟΓΟΣ ΕΓΚΑΤΑΣΤΑΤΗΣ<div class="ln"></div>${esc(instName())} — αρ. αδείας ${esc(S.inst.adeia||'')}</div>
   </div>
   <div class="pgno">ΥΔΕ · ${esc(S.prj.title||'')}</div>
  </div>`;
}

/* ---------------- ΠΡΩΤΟΚΟΛΛΟ ΕΛΕΓΧΟΥ ---------------- */
function docProt(){
  const cs=allCircuits(), PER=34, pages=Math.max(1,Math.ceil(cs.length/PER));
  const head=`<div class="d-hdr"><div class="t1">ΠΡΩΤΟΚΟΛΛΟ ΕΛΕΓΧΟΥ ΗΛΕΚΤΡΙΚΗΣ ΕΓΚΑΤΑΣΤΑΣΗΣ</div>
    <div class="t2">κατά ΕΛΟΤ HD 384 / IEC 60364 — αρχικός &amp; περιοδικός έλεγχος</div></div>`;
  const idBox=`<div class="d-box"><div class="bb"><table class="n">
    <tr><td style="width:55%">Εγκατάσταση: ${F(S.prj.title,240)}</td><td>Αρ. παροχής: ${F(S.prj.paroxi,110)}</td></tr>
    <tr><td>Διεύθυνση: ${F(addrLine(),240)}</td><td>Ημερομηνία: ${F(gr(S.meas.cdate||S.doc.issue),90)}</td></tr>
    <tr><td>Είδος ελέγχου: ${F(KIND_L[kindKey()],150)}</td><td>Σύστημα γείωσης: ${F('TT',50)} — U₀ = 230 V</td></tr>
    </table></div></div>`;
  const vis=`<div class="d-box"><div class="bt">Α. Οπτικός έλεγχος (ΕΛΟΤ HD 384 — 61.2)</div><div class="bb">
    <table class="d"><tbody>${VISUAL.map((v,i)=>`<tr><td style="width:4%" class="c">${i+1}</td><td>${v}</td>
      <td class="c" style="width:9%">${S.meas.vis['v'+i]?'ΝΑΙ':'—'}</td></tr>`).join('')}</tbody></table></div></div>`;
  const org=`<div class="d-box"><div class="bt">Γ. Όργανο μετρήσεων</div><div class="bb"><table class="n">
    <tr><td style="width:50%">Κατασκευαστής / τύπος: ${F(S.org.brand+' '+S.org.model,180)}</td><td>Σειριακός αρ.: ${F(S.org.serial,110)}</td></tr>
    <tr><td>Πιστοποιητικό διακρίβωσης: ${F(S.org.cert,180)}</td><td>Ισχύει έως: ${F(gr(S.org.cexp),90)}</td></tr></table></div></div>`;
  const res=(()=>{const st=measStatus();return `<div class="d-box"><div class="bt">Δ. Αποτέλεσμα ελέγχου</div><div class="bb">
    <table class="n"><tr><td>Αντίσταση γείωσης R<sub>A</sub>: ${F((S.meas.earth||'')+' Ω',70)}</td>
    <td>Ελεγχθέντα κυκλώματα: ${F(String(cs.length),40)}</td>
    <td>Ευρήματα εκτός ορίων: ${F(String(st.issues),40)}</td></tr></table>
    <div class="d-note" style="margin-top:3px">${st.issues?'Διαπιστώθηκαν ευρήματα εκτός ορίων· απαιτείται αποκατάσταση και επανέλεγχος πριν τη θέση σε λειτουργία.'
      :'Η εγκατάσταση ελέγχθηκε πλήρως. Όλες οι μετρηθείσες τιμές βρίσκονται εντός των ορίων του Προτύπου και η εγκατάσταση κρίνεται κατάλληλη για ασφαλή λειτουργία.'}
      ${S.doc.remarks?'<br>Παρατηρήσεις: '+esc(S.doc.remarks):''}</div></div></div>`;})();
  const sign=`<div class="d-sign"><div>&nbsp;</div><div>${gr(S.doc.issue)}<br>Ο ΕΛΕΓΞΑΣ ΗΛΕΚΤΡΟΛΟΓΟΣ<div class="ln"></div>${esc(instName())} — ${esc(S.inst.adeia||'')}</div></div>`;

  const th=`<tr>
    <th style="width:5%">Κωδ.</th><th style="width:19%">Περιγραφή κυκλώματος</th>
    <th style="width:7%">Αγωγοί<br>mm²</th><th style="width:5%">L<br>m</th>
    <th style="width:6%">Ασφ.<br>A/καμπ.</th>
    <th style="width:6%"><div class="vert">Μόνωση L-L (MΩ)</div></th>
    <th style="width:6%"><div class="vert">Μόνωση L-N (MΩ)</div></th>
    <th style="width:6%"><div class="vert">Μόνωση L-PE (MΩ)</div></th>
    <th style="width:6%"><div class="vert">Συνέχεια PE (Ω)</div></th>
    <th style="width:6%"><div class="vert">Z<sub>s</sub> βρόχου (Ω)</div></th>
    <th style="width:6%"><div class="vert">I<sub>k</sub> (A)</div></th>
    <th style="width:6%"><div class="vert">I∆ λειτ. (mA)</div></th>
    <th style="width:6%"><div class="vert">Χρόνος ∆∆Ε (ms)</div></th>
    <th style="width:5%"><div class="vert">Πολικότητα</div></th></tr>`;
  let out='';
  for(let pg=0;pg<pages;pg++){
    const rows=cs.slice(pg*PER,(pg+1)*PER).map(c=>{const m=measRow(c.key);const bad=limitOf(c,m).length;
      return `<tr><td class="c mono">${esc(c.key)}</td><td>${esc(c.name)}<span style="font-size:6.6pt;color:#444"> · ${esc(c.panel)}</span></td>
      <td class="c">${c.cores}×${c.S}</td><td class="c">${nf(c.L,0)}</td><td class="c">${c.In}/${c.curve}</td>
      <td class="c">${esc(m.rLL)}</td><td class="c">${esc(m.rLN)}</td><td class="c">${esc(m.rLPE)}</td>
      <td class="c">${esc(m.cont)}</td><td class="c"${bad?' style="font-weight:700"':''}>${esc(m.zs)}</td><td class="c">${esc(m.ik)}</td>
      <td class="c">${esc(m.rcdI)}</td><td class="c">${esc(m.rcdT)}</td><td class="c">${m.pol?'✓':''}</td></tr>`;}).join('');
    out+=`<div class="sheet">${draft()}${pg===0?head+idBox+vis:''}
      <div class="d-box"><div class="bt">Β. Δοκιμές και μετρήσεις${pages>1?' (σελ. '+(pg+1)+' από '+pages+')':''}</div>
      <div class="bb" style="padding:2px"><table class="d"><thead>${th}</thead><tbody>${rows}</tbody></table></div></div>
      ${pg===pages-1?org+res+sign:''}
      <div class="pgno">Πρωτόκολλο ΕΛΟΤ HD 384 · ${esc(S.prj.paroxi||S.prj.title||'')} · σελ. ${pg+1}/${pages}</div></div>`;
  }
  return out;
}

/* ---------------- ΕΚΘΕΣΗ ΠΑΡΑΔΟΣΗΣ ---------------- */
function docDeliv(){
  const p=paroxiById(S.sup.tier);
  const isFop=S.route.cat==='fop';
  const T=isFop?fopTotals():null;
  const rows=isFop?T.ls.map((c,i)=>`<tr><td class="c">${i+1}</td><td>${esc(c.name)}</td><td class="c">${c.n}×${c.w} W</td>
     <td class="c">${nf(c.L,0)} m</td><td class="c">J1VV ${c.cores}×${c.S}</td><td class="c">${c.In}A ${c.curve}</td><td class="c">30 mA</td><td class="r">${nf(c.kW,3)}</td></tr>`).join('')
   :S.pan.map(pn=>pn.cir.map((c,i)=>{const r=circuitCalc(c,pn);
     return `<tr><td class="c">${esc(pn.code)}.${i+1}</td><td>${esc(c.name)}</td><td class="c">${esc(pn.name)}</td>
     <td class="c">${nf(c.L,0)} m</td><td class="c">${r.cores}×${r.S}</td><td class="c">${r.In}A ${r.curve}</td>
     <td class="c">${+c.rcd?c.rcd+' mA':'—'}</td><td class="r">${nf(c.kW,2)}</td></tr>`;}).join('')).join('');
  const tot=isFop?T.kW:totalLoad().inst;
  return `<div class="sheet">${draft()}
   <div class="d-hdr"><div class="t1">ΕΚΘΕΣΗ ΠΑΡΑΔΟΣΗΣ ΗΛΕΚΤΡΙΚΗΣ ΕΓΚΑΤΑΣΤΑΣΗΣ</div>
     <div class="t2">συνοδεύει την Υπεύθυνη Δήλωση Αδειούχου Ηλεκτρολόγου Εγκαταστάτη</div></div>
   <div class="d-box"><div class="bb"><table class="n">
     <tr><td style="width:55%">Έργο: ${F(S.prj.title,240)}</td><td>Ημερομηνία: ${F(gr(S.doc.issue),90)}</td></tr>
     <tr><td>Διεύθυνση: ${F(addrLine(),240)}</td><td>Αρ. παροχής: ${F(S.prj.paroxi,110)}</td></tr>
     <tr><td>Ιδιοκτήτης: ${F(S.own.nm,240)}</td><td>Παροχή: ${F(p?p.lbl+' · '+p.kVA+' kVA':'',140)}</td></tr>
   </table></div></div>
   <div class="d-box"><div class="bt">Α. Περιγραφή εγκατάστασης</div><div class="bb d-note">
     ${isFop?`Εγκατάσταση δημοτικού φωτισμού. Ένα πίλαρ με μετρητή ΔΕΔΔΗΕ και πίνακα διανομής, ${T.ls.length}
      ${T.ls.length===1?'αναχώρηση':'αναχωρήσεις'} προς ιστούς φωτισμού, συνολικά ${T.ls.reduce((a,b)=>a+b.n,0)} φωτιστικά σώματα.
      Στην κεφαλή: γενικός διακόπτης ${p?p.gen:''}A, ${S.fop.spd?'απαγωγός υπερτάσεων τύπου 2, ':''}διάταξη διαφορικού ρεύματος
      ${S.fop.rcdHead} mA τύπου S (επιλεκτική), ρελέ ισχύος με ${S.fop.astro?'αστρονομικό χρονοδιακόπτη':'χρονοδιακόπτη'}${S.fop.photo?' και φωτοκύτταρο':''}.
      Κάθε αναχώρηση προστατεύεται από διάταξη διαφορικού ρεύματος 30 mA και μικροαυτόματο καμπύλης B.
      Οι ιστοί γειώνονται και συνδέονται ισοδυναμικά.`
      :`${esc(BT_L[S.route.btype]||'Κτίριο')}. Η διανομή περιλαμβάνει ${S.pan.length}
      ${S.pan.length===1?'πίνακα':'πίνακες'} (${roots().length} γενικό${roots().length>1?'ς':''} και ${S.pan.length-roots().length} υποπίνακες)
      με συνολικά ${S.pan.reduce((a,x)=>a+x.cir.length,0)} γραμμές. Όλες οι τελικές γραμμές προστατεύονται από διατάξεις
      διαφορικού ρεύματος 30 mA, πλην των κυκλωμάτων φωτισμού ασφαλείας. Θεμελιακή γείωση με ισοδυναμικές συνδέσεις.`}
   </div></div>
   <div class="d-box"><div class="bt">Β. Κυκλώματα</div><div class="bb" style="padding:2px">
     <table class="d"><thead><tr><th>Κωδ.</th><th>Κύκλωμα</th><th>${isFop?'Φωτιστικά':'Πίνακας'}</th><th>Μήκος</th>
       <th>Αγωγοί</th><th>Προστασία</th><th>∆∆Ε</th><th>kW</th></tr></thead>
       <tbody>${rows}<tr><td colspan="7" class="r" style="font-weight:700">ΣΥΝΟΛΟ ΕΓΚΑΤΕΣΤΗΜΕΝΗΣ ΙΣΧΥΟΣ (kW)</td>
       <td class="r" style="font-weight:700">${nf(tot,2)}</td></tr></tbody></table></div></div>
   <div class="d-box"><div class="bt">Γ. Οδηγίες προς τον χρήστη</div><div class="bb d-note">
     1. Δοκιμάζετε τη διάταξη διαφορικού ρεύματος με το πλήκτρο TEST ανά εξάμηνο.
     2. Μην αντικαθιστάτε ασφάλειες ή μικροαυτόματους με μεγαλύτερης έντασης.
     3. Κάθε επέκταση ή τροποποίηση εκτελείται μόνο από αδειούχο ηλεκτρολόγο εγκαταστάτη και συνοδεύεται από νέα ΥΔΕ.
     4. Επόμενος υποχρεωτικός επανέλεγχος έως <b>${gr(nextDate())}</b>.
     5. Τα μονογραμμικά σχέδια φυλάσσονται εντός του πίνακα και ενημερώνονται σε κάθε μεταβολή.
   </div></div>
   <div class="d-sign"><div>ΠΑΡΕΛΑΒΑ — Ο ΙΔΙΟΚΤΗΤΗΣ/ΧΡΗΣΤΗΣ<div class="ln"></div>${esc(S.own.nm||'')}</div>
     <div>ΠΑΡΕΔΩΣΑ — Ο ΕΓΚΑΤΑΣΤΑΤΗΣ<div class="ln"></div>${esc(instName())}</div></div>
   <div class="pgno">Έκθεση παράδοσης · ${esc(S.prj.title||'')}</div></div>`;
}

/* ---------------- ΚΑΤΑΓΡΑΦΗ ΣΤΟΙΧΕΙΩΝ ΕΗΕ ---------------- */
function docEHE(){
  const isFop=S.route.cat==='fop';
  const groups={};
  if(isFop){fopTotals().ls.forEach(c=>{groups[c.name]=(groups[c.name]||0)+c.kW;});}
  else{S.pan.forEach(p=>{const l=panelLoad(p.id);groups[p.code+' — '+p.name]=p.cir.reduce((a,c)=>a+(+c.kW||0),0);});}
  const cats={Φ:'Φωτισμός',Ρ:'Ρευματοδότες',Σ:'Συσκευές',Κ:'Κλιματισμός',Μ:'Κινητήρια'};
  const byCat={};
  if(!isFop)S.pan.forEach(p=>p.cir.forEach(c=>{byCat[c.cat||'Ρ']=(byCat[c.cat||'Ρ']||0)+(+c.kW||0);}));
  else byCat.Φ=fopTotals().kW;
  const tot=Object.values(groups).reduce((a,b)=>a+b,0);
  const p=paroxiById(S.sup.tier);
  return `<div class="sheet">${draft()}
   <div class="d-hdr"><div class="t1">ΚΑΤΑΓΡΑΦΗ ΣΤΟΙΧΕΙΩΝ ΗΛΕΚΤΡΙΚΗΣ ΕΓΚΑΤΑΣΤΑΣΗΣ</div>
     <div class="t2">στοιχεία ηλεκτροδότησης — συνοδευτικό ΥΔΕ / αίτησης ΔΕΔΔΗΕ</div></div>
   <div class="d-box"><div class="bb"><table class="n">
     <tr><td style="width:55%">Εγκατάσταση: ${F(S.prj.title,240)}</td><td>Αρ. παροχής: ${F(S.prj.paroxi,110)}</td></tr>
     <tr><td>Διεύθυνση: ${F(addrLine(),240)}</td><td>Ημερομηνία: ${F(gr(S.doc.issue),90)}</td></tr></table></div></div>
   <div class="d-box"><div class="bt">Α. Κατανομή ισχύος ανά ${isFop?'αναχώρηση':'πίνακα'}</div><div class="bb" style="padding:2px">
     <table class="d"><thead><tr><th style="width:60%">${isFop?'Αναχώρηση':'Πίνακας'}</th><th>Εγκατεστημένη ισχύς (kW)</th></tr></thead>
     <tbody>${Object.keys(groups).map(g=>`<tr><td>${esc(g)}</td><td class="r">${nf(groups[g],2)}</td></tr>`).join('')}
     <tr><td class="r" style="font-weight:700">ΣΥΝΟΛΟ</td><td class="r" style="font-weight:700">${nf(tot,2)}</td></tr></tbody></table></div></div>
   <div class="d-box"><div class="bt">Β. Ανάλυση ανά κατηγορία κατανάλωσης</div><div class="bb" style="padding:2px">
     <table class="d"><thead><tr><th style="width:60%">Κατηγορία</th><th>Ισχύς (kW)</th></tr></thead>
     <tbody>${Object.keys(cats).map(k=>`<tr><td>${cats[k]}</td><td class="r">${nf(byCat[k]||0,2)}</td></tr>`).join('')}</tbody></table></div></div>
   <div class="d-box"><div class="bt">Γ. Αιτούμενη παροχή</div><div class="bb"><table class="n">
     <tr><td style="width:33%">Είδος: ${F(p?p.lbl:'',120)}</td><td style="width:33%">Ισχύς: ${F(p?p.kVA+' kVA':'',70)}</td>
     <td>Φάσεις: ${F(p?(p.ph===3?'3Φ+Ν 400/230V':'1Φ+Ν 230V'):'',90)}</td></tr>
     <tr><td>Ασφάλεια παροχής: ${F(p?p.fuse+' A':'',60)}</td><td>Γενικός: ${F(p?p.gen+' A':'',60)}</td>
     <td>Καλώδιο παροχής: ${F(p?p.cable:'',80)}</td></tr>
     <tr><td colspan="3">Συντελεστής ετεροχρονισμού / ζήτηση: ${F(nf(isFop?fopTotals().kW:totalLoad().dem,2)+' kW',80)}
       — cosφ ${F('0,95',40)}</td></tr></table></div></div>
   <div class="d-sign"><div>&nbsp;</div><div>${gr(S.doc.issue)}<br>Ο ΗΛΕΚΤΡΟΛΟΓΟΣ ΕΓΚΑΤΑΣΤΑΤΗΣ<div class="ln"></div>${esc(instName())}</div></div>
   <div class="pgno">Καταγραφή στοιχείων ΕΗΕ · ${esc(S.prj.title||'')}</div></div>`;
}

/* ---------------- ΟΘΟΝΗ ΕΝΤΥΠΩΝ ---------------- */
var DOCTAB='yde';
const DOCS={yde:{t:'ΥΔΕ',f:docYDE},prot:{t:'Πρωτόκολλο ελέγχου',f:docProt},
  deliv:{t:'Έκθεση παράδοσης',f:docDeliv},ehe:{t:'Καταγραφή ΕΗΕ',f:docEHE},
  sld:{t:'Μονογραμμικά',f:docSld}};
function docSld(){
  const sheets=S.route.cat==='fop'?[sldFop()]
    :[].concat(S.pan.length>1?[sldTree()]:[], S.pan.map(p=>sldPanel(p)));
  return sheets.map(g=>`<div class="sheet land">${draft()}${g}
    <div class="pgno">${esc(S.prj.title||'')} · ${esc(instName())} · ${gr(S.doc.issue)}</div></div>`).join('');
}
function vDocs(){
  const st=measStatus();
  return shell(`
  <div class="hdr"><div class="eyebrow">Παραδοτέα</div><h1>Έντυπα</h1>
   <p>Συμπληρώνονται μόνα τους από όσα καταχώρησες. Εκτύπωση σε A4 ή αποθήκευση ως PDF από τον διάλογο εκτύπωσης.</p></div>
  ${!S.meas.confirmed?`<div class="note warn"><b>Προσχέδιο</b>Τα έντυπα φέρουν σήμανση ΠΡΟΣΧΕΔΙΟ ώσπου να επιβεβαιώσεις τις μετρήσεις στο προηγούμενο βήμα.
   ${st.empty?st.empty+' κυκλώματα χωρίς μετρήσεις. ':''}${st.issues?st.issues+' τιμές εκτός ορίων. ':''}${!st.visDone?'Ο οπτικός έλεγχος δεν έχει ολοκληρωθεί.':''}</div>`:''}
  <div class="row noprint" style="margin-bottom:12px">
   ${Object.keys(DOCS).map(k=>`<button class="btn ${DOCTAB===k?'':'ghost'} sm" data-doctab="${k}">${DOCS[k].t}</button>`).join('')}
   <span class="sp" style="flex:1"></span>
   <button class="btn" data-act="print">Εκτύπωση / PDF</button>
   <button class="btn ghost" data-act="printall">Όλος ο φάκελος</button>
  </div>
  <div class="docwrap" id="docarea">${DOCS[DOCTAB].f()}</div>
  `,navbar({hideNext:true}));
}

/* ==== 10_app.js ==== */
/* ===========================================================
   10 — ΣΥΝΔΕΣΗ & ΕΚΚΙΝΗΣΗ
   =========================================================== */
const VIEWS={start:vStart,cat:vCat,insp:vInsp,prj:vPrj,fop:vFop,bld:vBld,sup:vSup,sld:vSld,cards:vCards,meas:vMeas,docs:vDocs};
function render(){
  const a=document.activeElement;
  const key=a&&a.dataset?(a.dataset.b||(a.dataset.m?'m:'+a.dataset.m:null)):null;
  let ss=null,se=null;try{ss=a.selectionStart;se=a.selectionEnd;}catch(e){}
  document.getElementById('app').innerHTML=(VIEWS[VIEW]||vStart)();
  if(key){
    const el=key.slice(0,2)==='m:'?document.querySelector('[data-m="'+key.slice(2)+'"]')
                                  :document.querySelector('[data-b="'+key+'"]');
    if(el){el.focus();if(ss!=null){try{el.setSelectionRange(ss,se);}catch(e){}}}
  }
}

/* ---- τιμές πινάκων αναφοράς ---- */
function tablesModal(){
  const izRows=S_LIST.map((s,i)=>`<tr><td class="num">${s}</td>
    ${['B','C','D','E'].map(m=>`<td class="num">${IZ[3][m][i]}</td>`).join('')}
    ${['B','C','D','E'].map(m=>`<td class="num">${IZ[2][m][i]}</td>`).join('')}</tr>`).join('');
  modal('Πίνακες αναφοράς',`
   <h4 style="margin:0 0 6px">Τυποποιημένες παροχές ΧΤ ΔΕΔΔΗΕ</h4>
   <div class="scroll"><table class="t"><thead><tr><th>Παροχή</th><th>Φάσεις</th><th class="num">kVA</th>
     <th class="num">Ασφάλεια</th><th class="num">Γενικός</th><th>Καλώδιο</th><th class="num">Iz (μέθ. C)</th><th>Συντονισμός</th></tr></thead><tbody>
    ${PAROXES.map(p=>{const iz=izParoxi(p,'C',30,1);const a=auditParoxi(p,'C',30,1)[0];
      return `<tr><td>${p.lbl}</td><td>${p.ph===3?'3Φ+Ν':'1Φ+Ν'}</td><td class="num">${p.kVA}</td>
      <td class="num">${p.fuse} A</td><td class="num">${p.gen} A</td><td class="mono">${p.cable}</td>
      <td class="num">${nf(iz,0)} A</td><td><span class="pill ${a.lvl}">${a.lvl==='ok'?'ΟΚ':'έλεγξε'}</span></td></tr>`;}).join('')}
   </tbody></table></div>
   <div class="note" style="font-size:12px">Ο πίνακας ελέγχεται αυτόματα ως προς I<sub>ασφ</sub> ≤ I<sub>z</sub> και I<sub>γεν</sub> ≤ I<sub>z</sub> (IEC 60364-4-43 §433).
     Επαλήθευσέ τον με την ισχύουσα οδηγία διανομής ΔΕΔΔΗΕ πριν την κατάθεση φακέλου.</div>
   <h4 style="margin:16px 0 6px">Επιτρεπόμενες εντάσεις I<sub>z</sub> (A) — Cu / PVC</h4>
   <div class="scroll"><table class="t"><thead>
     <tr><th rowspan="2" class="num">mm²</th><th colspan="4" style="text-align:center">3 φορτισμένοι αγωγοί</th><th colspan="4" style="text-align:center">2 φορτισμένοι αγωγοί</th></tr>
     <tr><th class="num">B</th><th class="num">C</th><th class="num">D</th><th class="num">E</th><th class="num">B</th><th class="num">C</th><th class="num">D</th><th class="num">E</th></tr>
    </thead><tbody>${izRows}</tbody></table></div>
   <h4 style="margin:16px 0 6px">Χρόνοι επανελέγχου</h4>
   <table class="t"><tbody>${EPAN.map(e=>`<tr><td>${e.lbl}</td><td class="num">${e.y} έτη</td></tr>`).join('')}</tbody></table>
  `,'<button class="btn" data-act="closemodal">Κλείσιμο</button>');
}

/* ---- εκτύπωση ---- */
function printDoc(all){
  if(all){
    const area=document.getElementById('docarea');
    if(area)area.innerHTML=Object.keys(DOCS).map(k=>DOCS[k].f()).join('');
  }
  setTimeout(()=>window.print(),60);
}

/* ---- ενέργειες ---- */
document.addEventListener('click',async e=>{
  const t=e.target.closest('[data-route],[data-act],[data-go],[data-doctab],[data-openpanel],[data-addpanel],[data-delpanel],[data-addcir],[data-delcir],[data-balance],[data-delline],[data-vis],[data-reason]');
  if(!t)return;
  const d=t.dataset;

  if(d.route){const[k,v]=d.route.split(':');
    if(k==='mode'){S.route.mode=v;S.route.cat=null;S.route.btype=null;S.route.insp=null;S.doc.kind=v==='new'?'new':'routine';go('cat');return;}
    if(k==='cat'){S.route.cat=v;if(v==='fop'){S.route.btype=null;S.doc.cat='ypai';}render();touch();return;}
    if(k==='btype'){S.route.btype=v;S.doc.cat=v==='apartment'?'kat':(v==='school'?'kino':'epag');
      if(S.pan.length&&!confirm('Να ξαναστηθεί το δέντρο πινάκων από το πρότυπο του νέου τύπου κτιρίου;')){render();return;}
      S.pan=[];render();touch();return;}
    if(k==='insp'){S.route.insp=v;S.doc.kind=v;render();touch();return;}
  }
  if(d.go){go(d.go);return;}
  if(d.doctab){DOCTAB=d.doctab;render();return;}
  if(d.openpanel!==undefined&&d.openpanel!==''){PANEL_OPEN=PANEL_OPEN===d.openpanel?null:d.openpanel;render();return;}
  if(d.addpanel!==undefined){addPanel(d.addpanel||null);return;}
  if(d.delpanel){if(confirm('Διαγραφή πίνακα και όλων των υποπινάκων του;'))delPanel(d.delpanel);return;}
  if(d.addcir){addCircuit(d.addcir);return;}
  if(d.delcir){const[p,c]=d.delcir.split('|');delCircuit(p,c);return;}
  if(d.balance){balance(panelById(d.balance));render();touch();return;}
  if(d.delline){fopDel(d.delline);return;}
  if(d.vis!==undefined){S.meas.vis['v'+d.vis]=!S.meas.vis['v'+d.vis];if(!S.meas.vis['v'+d.vis])S.meas.confirmed=false;render();touch();return;}
  if(d.reason){S.route.reason=d.reason;S.doc.remarks=S.doc.remarks||d.reason;render();touch();return;}

  switch(d.act){
    case 'next':next();break;
    case 'prev':prev();break;
    case 'newprj':if(confirm('Νέο έργο; Το τρέχον θα χαθεί αν δεν το έχεις εξαγάγει.')){
        const keep={inst:S.inst,org:S.org};S=blank();S.inst=keep.inst;S.org=keep.org;DOCTAB='yde';PANEL_OPEN=null;go('start');}break;
    case 'open':importJSON();break;
    case 'saveas':exportJSON();save();break;
    case 'tables':tablesModal();break;
    case 'logout':if(window.ydeLogout)ydeLogout();break;
    case 'chgpass':if(window.ydeChangePass)ydeChangePass();break;
    case 'adminpanel':if(window.ydeAdminPanel)ydeAdminPanel();break;
    case 'closemodal':closeModal();break;
    case 'closemask':if(e.target.classList.contains('mask'))closeModal();break;
    case 'scaffold':if(!S.pan.length||confirm('Να αντικατασταθεί το τρέχον δέντρο πινάκων;'))scaffold();break;
    case 'fopadd':fopAdd();break;
    case 'fillref':
      modal('Συμπλήρωση τιμών αναφοράς',
       `<p>Θα μπουν <b>τυπικές τιμές αναφοράς</b> σε όλα τα κυκλώματα, υπολογισμένες από τη γεωμετρία της κάθε γραμμής.</p>
        <div class="note warn"><b>Δεν είναι μετρήσεις.</b> Είναι σημείο εκκίνησης για να μη γράφεις τα πάντα από την αρχή.
        Το έντυπο παραμένει <b>ΠΡΟΣΧΕΔΙΟ</b> ώσπου να αντικαταστήσεις τις τιμές με αυτές του οργάνου σου και να το δηλώσεις στο βήμα 4.
        Ο οπτικός έλεγχος μηδενίζεται — τον συμπληρώνεις μόνο εσύ, επιτόπου.</div>`,
       `<button class="btn ghost" data-act="closemodal">Άκυρο</button><button class="btn" data-act="dofill">Συμπλήρωση</button>`);break;
    case 'dofill':closeModal();fillReference();break;
    case 'confirm':
      S.meas.confirmed=!S.meas.confirmed;if(S.meas.confirmed)S.meas.cdate=S.meas.cdate||today();render();touch();break;
    case 'saveinst':await DB.set('yde5:inst',S.inst);alert('Η καρτέλα εγκαταστάτη αποθηκεύτηκε ως προεπιλογή.');break;
    case 'saveorg':await DB.set('yde5:org',S.org);alert('Η καρτέλα οργάνου αποθηκεύτηκε ως προεπιλογή.');break;
    case 'print':printDoc(false);break;
    case 'printall':printDoc(true);break;
    case 'printsld':printDoc(false);break;
  }
});
/* μετρήσεις — άμεση δέσμευση κελιών */
document.addEventListener('input',e=>{
  const m=e.target.dataset&&e.target.dataset.m;if(!m)return;
  const[k,f]=m.split('|');const row=measRow(k);row[f]=e.target.value;
  S.meas.filled=true;S.meas.confirmed=false;touch();
});
document.addEventListener('change',e=>{
  const m=e.target.dataset&&e.target.dataset.m;if(m)render();
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&MODAL)closeModal();});

/* ---- εκκίνηση (καλείται από το στρώμα ταυτότητας μετά την είσοδο) ---- */
async function startApp(){
  const cur=await DB.get('yde5:current');
  if(cur&&cur.v)S=Object.assign(blank(),cur);
  const i=await DB.get('yde5:inst'); if(i&&!S.inst.ep)S.inst=Object.assign(S.inst,i);
  const o=await DB.get('yde5:org');  if(o&&!S.org.serial)S.org=Object.assign(S.org,o);
  if(!S.route.mode)VIEW='start';
  render();
}
window.startApp=startApp;

/* ---- δημόσια επιφάνεια (έλεγχος/επαλήθευση υπολογισμών από κονσόλα) ---- */
window.YDE={PAROXES,IZ,S_LIST,METHODS,K_TEMP,K_GROUP,MCB,CURVES,RCD_I,EPAN,TPL,LOADS,VISUAL,FOP_LAMP,
  izOf,izParoxi,ib,pickMCB,du,duDistributed,loop,disconnectOK,sizeLine,pickParoxi,paroxiById,auditParoxi,
  get state(){return S;}};
