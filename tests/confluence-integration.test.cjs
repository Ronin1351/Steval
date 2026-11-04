const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..');
test('Steval exposes an isolated, named Confluence tab',()=>{const s=fs.readFileSync(path.join(root,'index.html'),'utf8');assert.match(s,/data-tab="confluence-workspace"/);assert.match(s,/Confluence trade setup/);assert.match(s,/\/confluence\//)});
test('Vercel serves built workspace and retains original API source directory',()=>{const c=JSON.parse(fs.readFileSync(path.join(root,'vercel.json'),'utf8'));assert.equal(c.outputDirectory,'public');assert.equal(c.buildCommand,'npm run build');assert.ok(fs.existsSync(path.join(root,'api/wacc.js')))});
test('build script copies Steval without bundling API as static files',()=>{const s=fs.readFileSync(path.join(root,'scripts/build.cjs'),'utf8');assert.match(s,/index\.html/);assert.doesNotMatch(s,/copy.*api/i)});

test('Confluence engine, validation and storage retain the remediated contract',()=>{
assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(root,'confluence/src/logic.ts'),'utf8').replace(/\r\n/g,'\n')).digest('hex'),'dfde41ce1013747be592f8637358fe4674c6baf06d7c8efe865d59213401e808');
assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(root,'confluence/src/types.ts'),'utf8').replace(/\r\n/g,'\n')).digest('hex'),'8a2bdb59f9e0a6c3693e68a64b2395928996da50e3ee83b08bc0cee44f21bb8f');
assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(root,'confluence/src/storage.ts'),'utf8').replace(/\r\n/g,'\n')).digest('hex'),'94145a7d074a57b39472010a0cf49b02db649a39b1f3f663aec6ca99bffef305');
});

test('embedded Confluence shares the document scroll instead of nesting a frame',()=>{const s=fs.readFileSync(path.join(root,'index.html'),'utf8');assert.doesNotMatch(s,/<iframe\b/);assert.match(s,/confluenceHost/)});
