import {test,beforeEach} from 'node:test';import assert from 'node:assert/strict';import {getHistory,saveToHistory} from '../src/storage';
const key='confluence_core_history_v2';let store=new Map<string,string>();Object.defineProperty(globalThis,'localStorage',{value:{getItem:(k:string)=>store.get(k)||null,setItem:(k:string,v:string)=>store.set(k,v)},configurable:true});
const entry={ticker:'aapl',currentPrice:100,cloudMax:95,cloudMin:90,kijunSen:97,nextHvnResistance:115,adx:25,rsi:55,atr:2,adxRising:false,aboveSupportHvn:false,above200Ema:true,rvolConfirmed:false,chochBullish:true,chochFresh:false,bosEnabled:false,bosBullish:false,totalCash:10000,riskLevel:1};
beforeEach(()=>{store=new Map()});
test('legacy history defaults override off and normalizes ticker',()=>{store.set(key,JSON.stringify([entry]));const h=getHistory();assert.equal(h[0].allowRiskOverride,false);assert.equal(h[0].ticker,'AAPL')});
test('malformed root and entries safely filtered',()=>{store.set(key,'{}');assert.deepEqual(getHistory(),[]);store.set(key,JSON.stringify([null,{ticker:9},entry]));assert.equal(getHistory().length,1)});
test('out-of-range legacy risk retained unchanged for correction',()=>{store.set(key,JSON.stringify([{...entry,riskLevel:7}]));assert.equal(getHistory()[0].riskLevel,7)});
test('save validates and deduplicates ticker case',()=>{store.set(key,JSON.stringify([entry]));assert.equal(saveToHistory({...entry,ticker:' AAPL ',allowRiskOverride:false}).length,1);assert.throws(()=>saveToHistory({...entry,riskLevel:7,allowRiskOverride:false}));assert.equal(getHistory()[0].riskLevel,1)});
