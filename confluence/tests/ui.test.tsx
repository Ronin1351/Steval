import { test } from 'node:test';import assert from 'node:assert/strict';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import App from '../src/App';
const html=()=>renderToStaticMarkup(React.createElement(App));
test('empty UI onboards without bearish claim or execution-block overlay',()=>{const s=html();assert.doesNotMatch(s,/BEARISH \(BELOW 200\)|Execution Blocked/);assert.match(s,/Start a setup/)});
test('all native inputs have associated labels',()=>{const s=html();for(const match of s.matchAll(/<input\b[^>]*>/g)){const id=match[0].match(/\bid="([^"]+)"/)?.[1];assert.ok(id);assert.ok(s.includes(`for="${id}"`))}});
test('all switches have accessible names',()=>{for(const m of html().matchAll(/<button\b[^>]*role="switch"[^>]*>/g))assert.match(m[0],/aria-label="[^"]+"/)});
test('mobile verdict summary exists before input controls',()=>{const s=html();assert.ok(s.indexOf('mobile-verdict')>=0);assert.ok(s.indexOf('mobile-verdict')<s.indexOf('<input'))});
