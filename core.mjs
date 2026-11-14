export const LANGUAGES=[
['en','English'],['de','Deutsch'],['ku','Kurmancî'],['tr','Türkçe'],['fr','Français'],['es','Español'],['it','Italiano'],['pt','Português'],['nl','Nederlands'],['sv','Svenska'],['da','Dansk'],['no','Norsk'],['fi','Suomi'],['pl','Polski'],['cs','Čeština'],['sk','Slovenčina'],['ro','Română'],['hu','Magyar'],['el','Ελληνικά'],['ru','Русский'],['uk','Українська'],['ar','العربية'],['fa','فارسی'],['hi','हिन्दी'],['ja','日本語'],['ko','한국어'],['zh','中文'],['id','Bahasa Indonesia'],['sq','Shqip'],['ckb','Soranî']
].map(([code,label])=>({code,label}));
export const DEMO_DE=[
'Als ich heute Morgen aufgewacht bin, war es draußen noch dunkel. Ich habe mir einen Kaffee gemacht und ein Buch aus dem Regal genommen. Das Buch erzählt die Geschichte eines jungen Mannes, der in einer kleinen Stadt lebt. Jeden Tag fährt er mit dem Zug zur Arbeit.\n\nHeute ist aber etwas anders. Auf dem Weg zum Bahnhof trifft er eine alte Freundin. Sie haben sich seit vielen Jahren nicht mehr gesehen.',
'Sie setzen sich in ein kleines Café und sprechen über ihre Kindheit. Die Zeit vergeht schnell. Am Nachmittag geht er nach Hause und denkt darüber nach, wie überraschend das Leben manchmal ist.\n\nEr beschließt, seine Freundin bald wiederzusehen. Vielleicht können sie zusammen einen Ausflug machen.'
];
export const DEMO_KU=[
'Rojekê li gundekî biçûk, zarokek bi navê Azad hebû. Ew her sibeh zû radibû û diçû derve. Li wir dar, çîçek û çivîkên gelek hebûn. Azad ji dengê çivîkan pir hez dikir.\n\nRojekê dayika wî got: «Îro em ê biçin bajêr.» Azad pir kêfxweş bû. Wî pirsî: «Em ê kengî vegerin malê?» Dayika wî got: «Êvarê.»',
'Dema ew gihîştin bajêr, kolan tijî mirov bûn. Azad destê dayika xwe girt û bi baldarî meşiya.\n\nLi ber pirtûkxaneyê rawestiya. Di hundir de gelek pirtûkên rengîn hebûn.'
];
export const DICTIONARY={
'de|en':{
als:'when',ich:'I',heute:'today',morgen:'morning',aufgewacht:'woke up',bin:'am',war:'was',es:'it',draußen:'outside',noch:'still',dunkel:'dark',habe:'have',mir:'myself',einen:'a',kaffee:'coffee',gemacht:'made',und:'and',ein:'a',buch:'book',aus:'from',dem:'the',regal:'shelf',genommen:'taken',das:'the',erzählt:'tells',die:'the',geschichte:'story',eines:'of a',jungen:'young',mannes:'man',der:'who',in:'in',einer:'a',kleinen:'small',stadt:'town',lebt:'lives',jeden:'every',tag:'day',fährt:'travels',er:'he',mit:'with',zug:'train',zur:'to the',arbeit:'work',ist:'is',aber:'but',etwas:'something',anders:'different',auf:'on',weg:'way',zum:'to the',bahnhof:'station',trifft:'meets',eine:'a',alte:'old',freundin:'friend',sie:'they',haben:'have',sich:'themselves',seit:'for',vielen:'many',jahren:'years',nicht:'not',mehr:'anymore',gesehen:'seen',setzen:'sit',sprechen:'speak',über:'about',ihre:'their',kindheit:'childhood',zeit:'time',vergeht:'passes',schnell:'quickly',am:'in the',nachmittag:'afternoon',geht:'goes',nach:'to',hause:'home',denkt:'thinks',darüber:'about it',wie:'how',überraschend:'surprising',leben:'life',manchmal:'sometimes',beschließt:'decides',seine:'his',bald:'soon',wiederzusehen:'see again',vielleicht:'perhaps',können:'can',zusammen:'together',ausflug:'trip',machen:'make'
},
'ku|tr':{
rojekê:'bir gün',li:'-de / -da',gundekî:'bir köyde',bi:'ile',navê:'adı',zarokek:'bir çocuk',hebû:'vardı',ew:'o',her:'her',sibeh:'sabah',zû:'erken',radibû:'kalkardı',û:'ve',diçû:'giderdi',derve:'dışarı',wir:'orada',dar:'ağaç',çîçek:'çiçek',çivîkên:'kuşlar',gelek:'çok',ji:'-den / -dan',dengê:'sesi',çivîkan:'kuşların',pir:'çok',hez:'sevgi',dikir:'yapardı',dayika:'annesi',wî:'onun',got:'dedi',îro:'bugün',em:'biz',ê:'gelecek zaman',biçin:'gidelim',bajêr:'şehre',kêfxweş:'mutlu',bû:'oldu',pirsî:'sordu',kengî:'ne zaman',vegerin:'döneriz',malê:'eve',êvarê:'akşam',dema:'-diği zaman',gihîştin:'ulaştılar',kolan:'sokak',tijî:'dolu',mirov:'insan',destê:'elini',xwe:'kendi',girt:'tuttu',baldarî:'dikkat',meşiya:'yürüdü',ber:'ön',pirtûkxaneyê:'kütüphane',rawestiya:'durdu',hundir:'içeride',pirtûkên:'kitaplar',rengîn:'renkli',ez:'ben',tu:'sen',baş:'iyi',spas:'teşekkürler'
}
};
export const normalizeWord=(word,lang='ku')=>String(word||'').normalize('NFC').trim().toLocaleLowerCase(lang==='tr'?'tr':'und').replace(/^[^\p{L}\p{M}]+|[^\p{L}\p{M}]+$/gu,'');
export const tokenize=text=>String(text).match(/[\p{L}\p{M}]+(?:[’'-][\p{L}\p{M}]+)*|[^\p{L}\p{M}]+/gu)||[];
export const isWord=text=>/^[\p{L}\p{M}]/u.test(text);
export const historyKey=(lang,word)=>lang+':'+normalizeWord(word,lang);
export const lookupOpacity=count=>Math.max(.10,1/(1+Math.max(0,count)*.32));
export const rankForgotten=v=>(v.starred?8:0)+Math.max(0,Number(v.lookups||0)-1)*.8+Math.max(0,Number(v.sessions||0)-1)*2;
export const positionPercent=(index,total)=>total?Math.round(100*(index+1)/total):0;
export function joinPdfLines(items){
 const rows=[];let row=null;
 for(const item of items){
  if(typeof item?.str!=='string')continue;
  const y=Number(item.transform?.[5]||0);
  if(!row||Math.abs(row.y-y)>2.8){row={y,parts:[],height:Number(item.height)||10};rows.push(row);}
  row.parts.push(item.str);
  if(item.hasEOL)row=null;
 }
 let out='';
 for(let i=0;i<rows.length;i++){
  const line=rows[i].parts.join(' ').replace(/\s+/g,' ').trim();if(!line)continue;
  const prev=rows[i-1],gap=prev?Math.abs(prev.y-rows[i].y):0;
  if(out.endsWith('-')&&/^\p{L}/u.test(line))out=out.slice(0,-1)+line;
  else out+=(out?(gap>rows[i].height*1.7?'\n\n':' '):'')+line;
 }
 return out.trim();
}
