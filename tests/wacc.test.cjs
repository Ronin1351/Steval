const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');

async function request({ticker='AAPL',method='GET',html='<meta name="description" content="The WACC of Apple Inc (AAPL) is 8.4%. The Cost of Equity is 8.55%.">',status=200,error}={}){
  let upstream;
  const context={module:{exports:{}},URL,AbortSignal,Date,fetch:async(url,options)=>{
    upstream={url,options}; if(error)throw error;
    return {ok:status===200,status,headers:{get:()=> 'text/html'},text:async()=>html};
  }};
  const src=fs.readFileSync(path.join(__dirname,'../api/wacc.js'),'utf8').replace('export default async function handler','module.exports = async function handler');
  vm.runInNewContext(src,context);
  const response={code:200,headers:{},setHeader(k,v){this.headers[k.toLowerCase()]=v},status(n){this.code=n;return this},json(body){this.body=body;return this}};
  await context.module.exports({method,query:{ticker}},response);
  return {response,upstream};
}

test('returns selected WACC in percent with source and lookup time',async()=>{
  const {response,upstream}=await request({ticker:' aapl '});
  assert.equal(response.code,200); assert.equal(response.body.wacc,8.4); assert.equal(response.body.ticker,'AAPL');
  assert.equal(response.body.url,'https://valueinvesting.io/AAPL/valuation/wacc');
  assert.ok(Number.isFinite(Date.parse(response.body.retrievedAt)));
  assert.match(response.headers['cache-control'],/s-maxage=/);
  assert.equal(upstream.options.redirect,'error'); assert.ok(upstream.options.signal);
});
test('supports punctuation without matching another company',async()=>{
  const {response}=await request({ticker:'BRK.B',html:"<meta content='The WACC of Berkshire Hathaway (BRK.B) is 7.25%.' name='description'>"});
  assert.equal(response.body.wacc,7.25);
});
for(const [name,html]of [
  ['wrong ticker','<meta name="description" content="The WACC of Microsoft (MSFT) is 7.5%.">'],
  ['equity only','<meta name="description" content="The Cost of Equity of Apple (AAPL) is 9.2%.">'],
  ['range','<meta name="description" content="The WACC of Apple (AAPL) is 7.1% - 9.8%.">'],
  ['missing value','<html>Access unavailable</html>'],
  ['invalid percentage','<meta name="description" content="The WACC of Apple (AAPL) is 900%.">']
])test('does not fabricate WACC from '+name,async()=>{
  const {response}=await request({html}); assert.equal(response.code,502);assert.equal(response.body.wacc,undefined);assert.equal(response.headers['cache-control'],'no-store');
});
for(const ticker of ['', '../AAPL','AAPL?x=1',['AAPL','MSFT'],'A'.repeat(21)])test('rejects malformed ticker '+JSON.stringify(ticker),async()=>{
  const {response,upstream}=await request({ticker}); assert.equal(response.code,400);assert.equal(upstream,undefined);
});
for(const status of [404,429,500])test('handles upstream '+status+' without caching failures',async()=>{
  const {response}=await request({status});assert.equal(response.code,status===404?404:503);assert.equal(response.headers['cache-control'],'no-store');assert.equal(response.body.wacc,undefined);
});
test('handles network/redirect rejection without exposing details',async()=>{
  const {response}=await request({error:new Error('secret upstream detail')});assert.equal(response.code,503);assert.doesNotMatch(JSON.stringify(response.body),/secret/);
});
test('handles request timeout',async()=>{
  const {response}=await request({error:Object.assign(new Error(),{name:'TimeoutError'})});assert.equal(response.code,504);
});
test('only accepts read requests',async()=>{
  const {response,upstream}=await request({method:'POST'});assert.equal(response.code,405);assert.equal(upstream,undefined);
});
