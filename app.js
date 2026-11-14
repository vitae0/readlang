import {LANGUAGES,DEMO_DE,DEMO_KU,DICTIONARY,normalizeWord,tokenize,isWord,historyKey,lookupOpacity,rankForgotten,positionPercent,joinPdfLines} from './core.mjs';

const $=id=>document.getElementById(id);
const el={
 home:$('homeView'),reader:$('readerView'),text:$('readerText'),title:$('currentTitle'),
 native:$('nativeLang'),source:$('bookLang'),grid:$('bookGrid'),file:$('pdfInput'),
 drop:$('dropZone'),status:$('importStatus'),popup:$('wordPopup'),panel:$('vocabPanel'),
 backdrop:$('backdrop'),vocab:$('vocabList'),page:$('pageLabel'),slider:$('pageSlider'),
 heading:$('pageHeading'),percent:$('percentLabel'),toast:$('toast')
};
const KEYS={settings:'readlang:settings:1',progress:'readlang:progress:1',vocab:'readlang:vocab:1',translations:'readlang:translations:1'};
function load(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}}
const state={
 settings:{native:'en',source:'de',lastBook:null,...load(KEYS.settings,{})},
 progress:load(KEYS.progress,{}),vocab:load(KEYS.vocab,{}),translations:load(KEYS.translations,{}),
 books:[],book:null,page:0,db:null,selection:null,requestId:0,hover:null,hide:null,notice:null,importing:false
};
const languages=LANGUAGES.map(x=>x.code);
if(!languages.includes(state.settings.native))state.settings.native='en';
if(!languages.includes(state.settings.source))state.settings.source='de';
function save(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch(e){toast('Tarayıcı depolaması dolu. Eski kitapları silmeyi dene.')}}
function settingsSave(){save(KEYS.settings,state.settings)}
function progressSave(){save(KEYS.progress,state.progress)}
function vocabSave(){save(KEYS.vocab,state.vocab)}
function transSave(){save(KEYS.translations,state.translations)}
function toast(msg){el.toast.textContent=msg;el.toast.classList.remove('hidden');clearTimeout(state.notice);state.notice=setTimeout(()=>el.toast.classList.add('hidden'),4500)}
function requestDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open('readlang-books',1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('books'))r.result.createObjectStore('books',{keyPath:'id'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
function dbOp(mode,callback){return new Promise((resolve,reject)=>{const tx=state.db.transaction('books',mode),r=callback(tx.objectStore('books'));r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);tx.onerror=()=>reject(tx.error)})}
const allBooks=()=>dbOp('readonly',s=>s.getAll());
const fetchBook=id=>dbOp('readonly',s=>s.get(id));
const putBook=book=>dbOp('readwrite',s=>s.put(book));
const delBook=id=>dbOp('readwrite',s=>s.delete(id));
const pair=()=>state.settings.source+'|'+state.settings.native;
const vocabKey=(word,lang=state.settings.source)=>historyKey(lang,word);
function vocabEntry(word,lang=state.settings.source){const key=vocabKey(word,lang);if(!state.vocab[key])state.vocab[key]={word:normalizeWord(word,lang),language:lang,lookups:0,sessions:0,last:0,starred:false};return state.vocab[key]}
function cached(word,source=state.settings.source,target=state.settings.native){
 const key=source+'|'+target+':'+normalizeWord(word,source);
 return state.translations[key]||DICTIONARY[source+'|'+target]?.[normalizeWord(word,source)]||null;
}
function storeMeaning(word,meaning,source=state.settings.source,target=state.settings.native){
 const key=source+'|'+target+':'+normalizeWord(word,source);
 state.translations[key]=String(meaning||'').trim().slice(0,100);transSave();
 const entry=vocabEntry(word,source);entry.meanings??={};entry.meanings[target]=state.translations[key];vocabSave();
}
function increment(word,lang){
 const entry=vocabEntry(word,lang),now=Date.now();
 if(now-entry.last<2400)return;
 if(!entry.last||now-entry.last>5*60*1000)entry.sessions++;
 entry.lookups++;entry.last=now;vocabSave();
 const key=vocabKey(word,lang);
 for(const span of el.text.querySelectorAll('.word'))if(span.dataset.key===key)span.style.setProperty('--underline',lookupOpacity(entry.lookups));
}
function clearTimers(){clearTimeout(state.hover);clearTimeout(state.hide)}
function hidePopup(){state.requestId++;clearTimers();if(state.selection?.node)state.selection.node.classList.remove('active');state.selection=null;el.popup.classList.add('hidden')}
function scheduleHide(){clearTimeout(state.hide);state.hide=setTimeout(hidePopup,280)}
function popupPlace(){
 const node=state.selection?.node;if(!node||el.popup.classList.contains('hidden'))return;
 const b=node.getBoundingClientRect(),p=el.popup;
 const x=Math.min(window.innerWidth-p.offsetWidth-9,Math.max(9,b.left+b.width/2-p.offsetWidth/2));
 let y=b.top-p.offsetHeight-11;if(y<9)y=b.bottom+11;
 p.style.left=Math.max(9,x)+'px';p.style.top=Math.max(9,y)+'px';
}
function make(tag,cls,value){const n=document.createElement(tag);if(cls)n.className=cls;if(value!==undefined)n.textContent=value;return n}
function popupRender(word,meaning,loading=false,note=''){
 el.popup.replaceChildren();
 el.popup.append(make('div','small',word),make('div','meaning'+(loading?' loading':''),meaning));
 if(note)el.popup.append(make('div','note',note));
 if(!loading){
  const row=make('div','actions'),v=vocabEntry(word),star=make('button','',v.starred?'★ Kaydedildi':'☆ Kaydet');
  star.type='button';
  star.onclick=()=>{v.starred=!v.starred;vocabSave();popupRender(word,meaning,false,note);vocabRender()};
  const edit=make('button','','Düzelt');edit.type='button';
  edit.onclick=()=>{
   const form=make('form',''),input=make('input',''),saveBtn=make('button','','Kaydet');
   input.placeholder='Kısa karşılık';input.maxLength=100;input.value=meaning==='Çeviri bulunamadı'?'':meaning;
   input.setAttribute('aria-label','Yeni kelime karşılığı');saveBtn.type='submit';
   form.append(input,saveBtn);
   form.onsubmit=e=>{e.preventDefault();const val=input.value.trim();if(!val)return;storeMeaning(word,val);popupRender(word,val);vocabRender()};
   row.replaceWith(form);input.focus();
  };
  row.append(star,edit);el.popup.append(row);
 }
 el.popup.classList.remove('hidden');popupPlace();
}
async function translateWord(word,source,target){
 if(source===target)return word;
 const known=cached(word,source,target);if(known)return known;
 const params=new URLSearchParams({q:word,langpair:source+'|'+target});
 const ctl=new AbortController(),timeout=setTimeout(()=>ctl.abort(),8500);
 try{
  const res=await fetch('https://api.mymemory.translated.net/get?'+params.toString(),{signal:ctl.signal});
  if(!res.ok)throw Error('Çeviri servisi yanıt vermedi');
  const body=await res.json();
  if(Number(body.responseStatus)!==200)throw Error('Çeviri bu dil çifti için kullanılamıyor');
  let meaning=String(body.responseData?.translatedText||'').replace(/<[^>]*>/g,'').trim();
  if(!meaning||/MYMEMORY WARNING|INVALID LANGUAGE|QUERY LENGTH LIMIT/i.test(meaning)||meaning.toLocaleLowerCase()===word.toLocaleLowerCase())throw Error('Çeviri bulunamadı');
  meaning=meaning.split(/[\n;]/)[0].trim().slice(0,100);
  storeMeaning(word,meaning,source,target);
  return meaning;
 }finally{clearTimeout(timeout)}
}
async function wordOpen(node){
 if(state.selection?.node===node&&!el.popup.classList.contains('hidden'))return;
 clearTimers();if(state.selection?.node)state.selection.node.classList.remove('active');
 const word=node.dataset.word,source=state.settings.source,target=state.settings.native,token=++state.requestId;
 state.selection={node,source,target,word};node.classList.add('active');increment(word,source);
 const hit=cached(word,source,target);
 if(hit){popupRender(word,hit);return}
 if(source===target){popupRender(word,word);return}
 popupRender(word,'Çevriliyor…',true);
 try{
  const result=await translateWord(word,source,target);
  if(token===state.requestId)popupRender(word,result);
 }catch{
  if(token===state.requestId)popupRender(word,'Çeviri bulunamadı',false,'Karşılığını “Düzelt” ile kaydedebilirsin.');
 }
}
function attachWordEvents(){
 el.text.addEventListener('pointerover',e=>{
  const n=e.target.closest('.word');if(!n||e.pointerType==='touch')return;
  if(state.selection?.node===n)return;
  clearTimers();state.hover=setTimeout(()=>wordOpen(n),360);
 });
 el.text.addEventListener('pointerout',e=>{
  if(!e.target.closest('.word'))return;clearTimeout(state.hover);scheduleHide();
 });
 el.text.addEventListener('click',e=>{const n=e.target.closest('.word');if(n){e.stopPropagation();wordOpen(n)}});
 el.text.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('.word')){e.preventDefault();wordOpen(e.target)}});
 el.popup.addEventListener('pointerenter',()=>clearTimeout(state.hide));
 el.popup.addEventListener('pointerleave',scheduleHide);
 document.addEventListener('pointerdown',e=>{if(!el.popup.contains(e.target)&&!e.target.closest('.word'))hidePopup()});
 window.addEventListener('resize',popupPlace);
 window.addEventListener('scroll',popupPlace,{passive:true});
}
function paragraph(text){
 const p=make('p','');
 for(const piece of tokenize(text)){
  if(!isWord(piece)){p.append(document.createTextNode(piece));continue}
  const node=make('span','word',piece);node.tabIndex=0;node.role='button';
  node.setAttribute('aria-label',piece+', anlamını göster');node.dataset.word=piece;
  node.dataset.key=vocabKey(piece);
  node.style.setProperty('--underline',lookupOpacity(state.vocab[node.dataset.key]?.lookups||0));p.append(node);
 }
 return p;
}
function renderPage(){
 if(!state.book)return;hidePopup();
 const total=state.book.pages.length||1;
 state.page=Math.min(Math.max(0,state.page),total-1);
 el.title.textContent=state.book.title;el.heading.textContent='SAYFA '+(state.page+1);
 el.percent.textContent='%'+positionPercent(state.page,total);el.page.textContent=(state.page+1)+' / '+total;
 el.slider.max=total;el.slider.value=state.page+1;
 $('prevBtn').disabled=state.page===0;$('nextBtn').disabled=state.page===total-1;
 el.text.lang=state.settings.source;el.text.replaceChildren();
 const text=state.book.pages[state.page]||'';
 for(const part of text.split(/\n\s*\n/).filter(Boolean))el.text.append(paragraph(part.replace(/\n/g,' ')));
 if(!el.text.childNodes.length)el.text.append(make('p','','Bu sayfada seçilebilir metin yok.'));
}
function remember(){
 if(!state.book)return;
 state.progress[state.book.id]={page:state.page,y:Math.round(window.scrollY),updatedAt:Date.now()};progressSave();
}
function goHome(){
 remember();hidePopup();closePanel();state.book=null;el.title.textContent='Kitaplığım';
 el.reader.classList.add('hidden');el.home.classList.remove('hidden');window.scrollTo(0,0);renderBooks();
}
async function openBook(id){
 const book=await fetchBook(id);if(!book)return;
 state.book=book;state.settings.source=book.sourceLanguage||state.settings.source;
 state.settings.native=book.targetLanguage||state.settings.native;
 el.source.value=state.settings.source;el.native.value=state.settings.native;
 state.page=state.progress[id]?.page||0;state.settings.lastBook=id;settingsSave();
 el.home.classList.add('hidden');el.reader.classList.remove('hidden');renderPage();
 requestAnimationFrame(()=>window.scrollTo({top:state.progress[id]?.y||0,behavior:'instant'}));
}
function changePage(page){
 if(!state.book)return;
 const target=Math.max(0,Math.min(state.book.pages.length-1,page));
 if(target===state.page)return;state.page=target;renderPage();window.scrollTo({top:0,behavior:'instant'});remember();
}
function renderBooks(){
 el.grid.replaceChildren();
 const sorted=[...state.books].sort((a,b)=>(state.progress[b.id]?.updatedAt||b.addedAt||0)-(state.progress[a.id]?.updatedAt||a.addedAt||0));
 for(const book of sorted){
  const card=make('div','bookcard');card.tabIndex=0;card.role='button';
  const top=make('div','icon','▤'),title=make('div','title',book.title),bottom=make('div','bottom');
  const at=state.progress[book.id]?.page||0;
  const info=make('span','',book.pages.length+' sayfa · %'+positionPercent(at,book.pages.length));
  const del=make('button','deletebook','×');del.title='Kitabı sil';del.setAttribute('aria-label',book.title+' kitabını sil');
  del.onclick=async e=>{
   e.stopPropagation();if(!confirm('“'+book.title+'” silinsin mi?'))return;
   try{await delBook(book.id);state.books=state.books.filter(b=>b.id!==book.id);delete state.progress[book.id];progressSave();
    if(state.settings.lastBook===book.id){state.settings.lastBook=null;settingsSave()}
    renderBooks();toast('Kitap silindi.');}catch{toast('Kitap silinemedi.')}
  };
  bottom.append(info,del);card.append(top,title,bottom);
  card.onclick=()=>openBook(book.id);card.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();openBook(book.id)}};
  el.grid.append(card);
 }
}
async function addDemo(language){
 try{
  const ku=language==='ku',book={id:crypto.randomUUID(),title:ku?'Kurmancî · Nimûne':'Deutsch · Beispiel',
   pages:ku?DEMO_KU:DEMO_DE,sourceLanguage:ku?'ku':'de',targetLanguage:ku?'tr':'en',addedAt:Date.now()};
  await putBook(book);state.books.push(book);await openBook(book.id);
 }catch{toast('Örnek kitap kaydedilemedi.')}
}
async function importPDF(file){
 if(!file||state.importing)return;
 if(!/\.pdf$/i.test(file.name)&&file.type!=='application/pdf'){toast('PDF dosyası seç.');return}
 if(file.size>80*1024*1024){toast('80 MB üzerindeki PDF dosyaları desteklenmiyor.');return}
 state.importing=true;el.status.textContent='PDF hazırlanıyor…';
 try{
  const pdfjs=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
  const pdf=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),useSystemFonts:true}).promise;
  if(pdf.numPages>3000)throw Error('Bu dosya 3000 sayfadan uzun.');
  const pages=[];let recognized=0;
  for(let index=1;index<=pdf.numPages;index++){
   el.status.textContent='PDF dönüştürülüyor: '+index+' / '+pdf.numPages;
   const page=await pdf.getPage(index);
   const text=joinPdfLines((await page.getTextContent()).items);
   if(text.length>5)recognized++;pages.push(text);page.cleanup();
   if(index%8===0)await new Promise(resolve=>setTimeout(resolve,0));
  }
  await pdf.destroy();
  if(!recognized)throw Error('Taranmış PDF olabilir. Önce OCR uygulamak gerekiyor.');
  const book={id:crypto.randomUUID(),title:file.name.replace(/\.pdf$/i,'').replace(/[_-]+/g,' '),
   pages,sourceName:file.name,sourceLanguage:state.settings.source,targetLanguage:state.settings.native,addedAt:Date.now()};
  await putBook(book);state.books.push(book);el.status.textContent='';
  if(recognized<pages.length/2)toast('Bazı sayfalarda metin bulunamadı. OCR gerekebilir.');
  await openBook(book.id);
 }catch(err){console.error(err);toast('PDF açılamadı: '+(err.message||'Bilinmeyen hata'));el.status.textContent=''}
 finally{state.importing=false;el.file.value=''}
}
function vocabRender(){
 el.vocab.replaceChildren();
 const list=Object.values(state.vocab).filter(v=>v.language===state.settings.source&&(v.lookups>=2||v.starred))
  .sort((a,b)=>rankForgotten(b)-rankForgotten(a));
 if(!list.length){el.vocab.append(make('p','aside-desc','Henüz kayıt yok. Bir kelimeye birkaç kez baktığında burada görünecek.'));return}
 for(const v of list){
  const row=make('div','vocabrow'),left=make('div',''),right=make('div','');
  left.append(make('div','from',v.word),make('div','to',cached(v.word,v.language,state.settings.native)||'Karşılık kaydedilmedi'));
  right.append(make('p','counts',(v.lookups||0)+' bakış'));
  const star=make('button','star'+(v.starred?' saved':''),v.starred?'★':'☆');
  star.setAttribute('aria-label',v.starred?'Kaydı kaldır':'Kaydet');
  star.onclick=()=>{v.starred=!v.starred;vocabSave();vocabRender()};
  right.append(star);row.append(left,right);el.vocab.append(row);
 }
}
function openPanel(){hidePopup();vocabRender();el.panel.classList.add('open');el.panel.setAttribute('aria-hidden','false');el.backdrop.classList.remove('hidden')}
function closePanel(){el.panel.classList.remove('open');el.panel.setAttribute('aria-hidden','true');el.backdrop.classList.add('hidden')}
function download(name,data){const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=make('a','');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}
function fillLanguages(){
 for(const select of [el.native,el.source]){
  for(const item of LANGUAGES){const option=make('option','',item.label);option.value=item.code;select.append(option)}
 }
 el.native.value=state.settings.native;el.source.value=state.settings.source;
 el.native.onchange=()=>{state.settings.native=el.native.value;settingsSave();hidePopup();if(state.book){state.book.targetLanguage=el.native.value;putBook(state.book).catch(console.error);renderPage()}vocabRender()};
 el.source.onchange=()=>{state.settings.source=el.source.value;settingsSave();hidePopup();if(state.book){state.book.sourceLanguage=el.source.value;putBook(state.book).catch(console.error);renderPage()}vocabRender()};
}
function setup(){
 fillLanguages();attachWordEvents();
 $('homeBtn').onclick=goHome;$('vocabBtn').onclick=openPanel;$('closePanel').onclick=closePanel;el.backdrop.onclick=closePanel;
 $('prevBtn').onclick=()=>changePage(state.page-1);$('nextBtn').onclick=()=>changePage(state.page+1);
 el.slider.oninput=e=>changePage(Number(e.target.value)-1);
 $('germanDemo').onclick=()=>addDemo('de');$('kurdishDemo').onclick=()=>addDemo('ku');
 el.file.onchange=e=>importPDF(e.target.files?.[0]);
 el.drop.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.file.click()}};
 ['dragover','dragenter'].forEach(t=>el.drop.addEventListener(t,e=>{e.preventDefault();el.drop.classList.add('drag')}));
 ['dragleave','drop'].forEach(t=>el.drop.addEventListener(t,e=>{e.preventDefault();el.drop.classList.remove('drag')}));
 el.drop.addEventListener('drop',e=>importPDF([...e.dataTransfer.files].find(f=>/\.pdf$/i.test(f.name)||f.type==='application/pdf')));
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){hidePopup();closePanel()}
  if(!state.book||el.panel.classList.contains('open')||e.target.matches('input,select'))return;
  if(e.key==='ArrowRight')changePage(state.page+1);
  if(e.key==='ArrowLeft')changePage(state.page-1);
 });
 let scrollTimer;window.addEventListener('scroll',()=>{
  clearTimeout(scrollTimer);scrollTimer=setTimeout(remember,380);
 },{passive:true});
 window.addEventListener('pagehide',remember);
 $('exportBtn').onclick=()=>download('readlang-vocabulary.json',{version:1,vocab:state.vocab,translations:state.translations});
 $('importBtn').onclick=()=>$('vocabImport').click();
 $('vocabImport').onchange=async e=>{
  const file=e.target.files?.[0];if(!file)return;
  try{
   if(file.size>3*1024*1024)throw Error('Yedek dosyası çok büyük');
   const data=JSON.parse(await file.text());
   if(data.version!==1||typeof data.vocab!=='object'||!data.vocab||typeof data.translations!=='object'||!data.translations)throw Error('Geçersiz yedek');
   for(const [key,v] of Object.entries(data.vocab))if(/^[a-z-]{2,8}:[^\s]{1,100}$/.test(key)&&v&&typeof v.word==='string'){
    state.vocab[key]={word:normalizeWord(v.word),language:key.split(':')[0],lookups:Math.min(1e6,Math.max(0,Number(v.lookups)||0)),
     sessions:Math.min(1e6,Math.max(0,Number(v.sessions)||0)),last:Number(v.last)||0,starred:!!v.starred};
   }
   for(const [key,value] of Object.entries(data.translations))if(typeof value==='string'&&key.length<200)state.translations[key]=value.slice(0,100);
   vocabSave();transSave();vocabRender();if(state.book)renderPage();toast('Yedek yüklendi.');
  }catch{toast('Kelime yedeği okunamadı.')}finally{e.target.value=''}
 };
}
async function main(){
 setup();
 try{state.db=await requestDB();state.books=await allBooks();renderBooks();
  if(state.settings.lastBook&&state.books.some(b=>b.id===state.settings.lastBook))await openBook(state.settings.lastBook);
 }catch(err){console.error(err);el.status.textContent='Tarayıcı kitap depolaması açılamadı. Özel/gizli modu kapatıp yeniden dene.'}
}
main();