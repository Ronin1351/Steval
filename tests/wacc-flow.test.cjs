const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');

function setup(){
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  const block=html.match(/\/\/ WACC lookup lifecycle\r?\n([\s\S]*?)\/\/ End WACC lookup lifecycle/);
  assert.ok(block,'WACC lookup lifecycle must exist');
  const elements={};
  function g(id){return elements[id]??={value:'',textContent:'',children:[],listeners:{},addEventListener(type,fn){this.listeners[type]=fn},appendChild(child){this.children.push(child)}}}
  g('ticker').value='AAPL';g('wacc').value='10';
  const pending=[];let computations=0;
  const ctx=vm.createContext({g,getTicker:()=>g('ticker').value.trim().toUpperCase(),SEC_BASE:'/api',Date,URL,encodeURIComponent,
    document:{createElement:()=>({}),createTextNode:text=>({textContent:text})},
    computeSnapshot(){computations++},computeVerdict(){},fetch:url=>new Promise(resolve=>pending.push({url,resolve}))});
  vm.runInContext(block[1],ctx);
  return {g,pending,computations:()=>computations,run:code=>vm.runInContext(code,ctx),load:ticker=>vm.runInContext(`loadWacc(${JSON.stringify(ticker)}, ++stockFetchSequence)`,ctx)};
}
function response(ticker='AAPL',wacc=8.4){return {ok:true,json:async()=>({ticker,wacc,url:`https://valueinvesting.io/${ticker}/valuation/wacc`,source:'ValueInvesting.io',retrievedAt:'2026-11-04T01:00:00Z'})}}

test('clears previous WACC then fills selected estimate and source',async()=>{
  const app=setup(),done=app.load('AAPL');assert.equal(app.g('wacc').value,'');
  app.pending[0].resolve(response());await done;assert.equal(app.g('wacc').value,'8.4');
  assert.ok(app.g('waccStatus').children.some(x=>x.href==='https://valueinvesting.io/AAPL/valuation/wacc'));
  assert.ok(app.computations()>=2);
});
test('preserves a manual edit while lookup is pending',async()=>{
  const app=setup(),done=app.load('AAPL');app.g('wacc').value='11';app.g('wacc').listeners.input();
  app.pending[0].resolve(response());await done;assert.equal(app.g('wacc').value,'11');assert.match(app.g('waccStatus').textContent,/Manual/);
});
test('old WACC cannot overwrite newer request result',async()=>{
  const app=setup(),older=app.load('AAPL');app.g('ticker').value='MSFT';app.g('ticker').listeners.input();
  const newer=app.load('MSFT');app.pending[1].resolve(response('MSFT',7.5));await newer;
  app.pending[0].resolve(response());await older;assert.equal(app.g('wacc').value,'7.5');
});
test('changing ticker invalidates financial request guard and clears WACC',async()=>{
  const app=setup(),done=app.load('AAPL');app.g('ticker').value='MSFT';app.g('ticker').listeners.input();
  assert.equal(app.run('isCurrentStockFetch("AAPL", 1)'),false);
  app.pending[0].resolve(response());await done;assert.equal(app.g('wacc').value,'');
});
test('unavailable source leaves blank and allows manual entry',async()=>{
  const app=setup(),done=app.load('AAPL');app.pending[0].resolve({ok:false});await done;
  assert.equal(app.g('wacc').value,'');assert.match(app.g('waccStatus').textContent,/unavailable/i);
  app.g('wacc').value='9';app.g('wacc').listeners.input();assert.equal(app.g('wacc').value,'9');
});
test('rejects mismatched or malformed lookup response',async()=>{
  for(const data of [response('MSFT',7.5),response('AAPL',null),response('AAPL',900)]){
    const app=setup(),done=app.load('AAPL');app.pending[0].resolve(data);await done;assert.equal(app.g('wacc').value,'');
  }
});
