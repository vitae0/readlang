import test from 'node:test';
import assert from 'node:assert/strict';
import {LANGUAGES,DEMO_DE,DEMO_KU,DICTIONARY,normalizeWord,tokenize,isWord,historyKey,lookupOpacity,rankForgotten,positionPercent,joinPdfLines} from '../core.mjs';

test('German → English available with short local equivalents',()=>{
 assert.ok(LANGUAGES.some(x=>x.code==='de'));
 assert.ok(LANGUAGES.some(x=>x.code==='en'));
 assert.equal(DICTIONARY['de|en'].heute,'today');
 assert.equal(DICTIONARY['de|en'].und,'and');
 assert.ok(DEMO_DE[0].includes('heute Morgen'));
});
test('Kurmancî → Turkish available with Kurdish characters',()=>{
 assert.ok(LANGUAGES.some(x=>x.code==='ku'));
 assert.ok(LANGUAGES.some(x=>x.code==='tr'));
 assert.equal(DICTIONARY['ku|tr'].îro,'bugün');
 assert.ok(DEMO_KU[0].includes('çîçek'));
});
test('at least 25 selectable languages',()=>assert.ok(LANGUAGES.length>=25));
test('case and Unicode normalization',()=>{
 assert.equal(normalizeWord('“Çîçek!”','ku'),'çîçek');
 assert.equal(normalizeWord('ÖFFNEN','de'),'öffnen');
});
test('punctuation remains intact after Unicode tokenization',()=>{
 const input='Heute ist schön. Ez diçim!';
 assert.equal(tokenize(input).join(''),input);
 assert.equal(tokenize(input).filter(isWord).length,6);
});
test('history is separated per source language',()=>{
 assert.equal(historyKey('de','Haus'),'de:haus');
 assert.notEqual(historyKey('de','Haus'),historyKey('en','Haus'));
});
test('underline becomes fainter with repeated lookups',()=>{
 assert.ok(lookupOpacity(0)>lookupOpacity(3));
 assert.ok(lookupOpacity(3)>lookupOpacity(12));
 assert.ok(lookupOpacity(100)>=.1);
});
test('forgotten word ranking weighs repeat sessions and saved words',()=>{
 assert.ok(rankForgotten({lookups:4,sessions:3})>rankForgotten({lookups:4,sessions:1}));
 assert.ok(rankForgotten({lookups:1,starred:true})>rankForgotten({lookups:3}));
});
test('page progress',()=>{
 assert.equal(positionPercent(0,10),10);
 assert.equal(positionPercent(9,10),100);
 assert.equal(positionPercent(0,0),0);
});
test('pdf text lines preserve paragraph breaks',()=>{
 const items=[
  {str:'Das',transform:[0,0,0,0,20,720],height:10},
  {str:'Buch',transform:[0,0,0,0,45,720],height:10},
  {str:'ist',transform:[0,0,0,0,20,690],height:10},
  {str:'gut.',transform:[0,0,0,0,45,690],height:10}
 ];
 assert.equal(joinPdfLines(items),'Das Buch\n\nist gut.');
});
