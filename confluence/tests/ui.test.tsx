import { test } from 'node:test';import assert from 'node:assert/strict';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import App from '../src/App';
const html=()=>renderToStaticMarkup(React.createElement(App));
test('empty UI onboards without bearish claim or execution-block overlay',()=>{const s=html();assert.doesNotMatch(s,/BEARISH \(BELOW 200\)|Execution Blocked/);assert.match(s,/Start a setup/)});
test('all native inputs have associated labels',()=>{const s=html();for(const match of s.matchAll(/<input\b[^>]*>/g)){const id=match[0].match(/\bid="([^"]+)"/)?.[1];assert.ok(id);assert.ok(s.includes(`for="${id}"`))}});
test('all switches have accessible names',()=>{for(const m of html().matchAll(/<button\b[^>]*role="switch"[^>]*>/g))assert.match(m[0],/aria-label="[^"]+"/)});
test('mobile verdict summary exists before input controls',()=>{const s=html();assert.ok(s.indexOf('mobile-verdict')>=0);assert.ok(s.indexOf('mobile-verdict')<s.indexOf('<input'))});

test('phone groups provide named expandable controls and result navigation',()=>{const s=html();for(const name of ['Asset &amp; levels','Momentum','Confirmations','Risk &amp; sizing'])assert.match(s,new RegExp('aria-expanded="(?:true|false)"[^>]*>'+name));assert.match(s,/View result/)});

import { Field } from '../src/controls';
test('short readings start narrow and long numeric values expand without a digit limit',()=>{const render=(value:number)=>renderToStaticMarkup(React.createElement(Field,{label:'Price',value,onChange:()=>{}}));assert.match(render(25),/width:calc\(4ch \+ 20px\)/);assert.match(render(123456.78),/width:calc\(9ch \+ 20px\)/);assert.doesNotMatch(render(123456.78),/maxlength/i)});
