/* P1-02 / P1-03 异常注入测试（Node 隔离环境，模拟浏览器 Storage）
 *
 * 执行入口（从干净环境）：
 *   1. cd apps/web
 *   2. node node_modules/.pnpm/esbuild@0.25.12/node_modules/esbuild/bin/esbuild src/store.ts --bundle --format=cjs --outfile=%TEMP%/hwv-store-test.cjs
 *   3. node test-store-injection.cjs
 */
'use strict';

const path = require('path');
const os = require('os');

const storePath = path.join(os.tmpdir(), 'hwv-store-test.cjs');

function makeStorage(initial, { failGet = false, failSet = false, failRemove = false } = {}) {
  const map = new Map(Object.entries(initial || {}));
  const state = {
    failGet,
    failSet,
    failRemove,
  };
  return {
    getItem(key) {
      if (state.failGet) throw new Error('simulated getItem failure');
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      if (state.failSet) throw new Error('simulated setItem failure');
      map.set(key, String(value));
    },
    removeItem(key) {
      if (state.failRemove) throw new Error('simulated removeItem failure');
      map.delete(key);
    },
    key(i) { return Array.from(map.keys())[i] ?? null; },
    get length() { return map.size; },
    _map: map,
    _state: state,
  };
}

let failures = 0;
function check(name, ok, detail = '') {
  if (ok) console.log(`PASS  ${name}`);
  else { failures++; console.log(`FAIL  ${name} ${detail}`); }
}

// ---- 场景 1：JSON 损坏进入保护，原数据不被覆盖 ----
{
  const raw = '{not-valid-json';
  global.window = {
    localStorage: makeStorage({ 'hwv.v2.state': raw }),
    sessionStorage: makeStorage({}),
    dispatchEvent() {},
    CustomEvent: class {},
  };
  delete require.cache[require.resolve(storePath)];
  const S = require(storePath);
  S.read(); // isCorrupted 由 read() 刷新
  check('损坏 JSON 被识别为保护模式', S.isCorrupted() === true);
  const res = S.saveExtra('knowSelf.q1', { text: 'x' });
  check('保护模式下写入被拒绝', res.ok === false && res.reason === 'protected', `got ${res.reason}`);
  const still = global.window.localStorage.getItem('hwv.v2.state');
  check('原始 JSON 未被覆盖', still === raw, `now: ${still}`);
  const exp = S.exportText();
  check('损坏时导出保留原始字符串', typeof exp === 'string' && exp.indexOf('preservedRaw') !== -1 && exp.indexOf(raw) !== -1);
  delete global.window;
}

// ---- 场景 2：getItem 抛异常进入保护（P1-03） ----
{
  const raw = JSON.stringify({ version: 2, updatedAt: 'x', event: null, results: null, observations: [], agreements: [], extra: {} });
  global.window = {
    localStorage: makeStorage({ 'hwv.v2.state': raw }, { failGet: true }),
    sessionStorage: makeStorage({}),
    dispatchEvent() {},
    CustomEvent: class {},
  };
  delete require.cache[require.resolve(storePath)];
  const S = require(storePath);
  S.read(); // isCorrupted 由 read() 刷新
  check('getItem 异常进入保护模式', S.isCorrupted() === true, 'corrupted should be true');
  const res = S.saveEvent({ facts: 'new' });
  check('读取失败后自动保存被拒绝', res.ok === false && res.reason === 'protected', `got ${res.reason}`);
  // 恢复可读
  global.window.localStorage._map.set('hwv.v2.state', raw);
  delete require.cache[require.resolve(storePath)];
  const S2 = require(storePath);
  check('存储恢复后可重新读取且未损坏', S2.isCorrupted() === false);
  check('原数据仍可读回（未被覆盖）', S2.read().version === 2);
  delete global.window;
}

// ---- 场景 3：正确版本但内部结构损坏（observations 混入 null） ----
{
  const raw = JSON.stringify({ version: 2, updatedAt: 'x', event: null, results: null, observations: [null], agreements: [], extra: {} });
  global.window = {
    localStorage: makeStorage({ 'hwv.v2.state': raw }),
    sessionStorage: makeStorage({}),
    dispatchEvent() {},
    CustomEvent: class {},
  };
  delete require.cache[require.resolve(storePath)];
  const S = require(storePath);
  S.read(); // isCorrupted 由 read() 刷新
  check('结构损坏（observations 含 null）进入保护', S.isCorrupted() === true);
  const still = global.window.localStorage.getItem('hwv.v2.state');
  check('结构损坏时原数据不被覆盖', still === raw);
  delete global.window;
}

// ---- 场景 4：clearAll 部分失败（session 不可用）不谎报 ----
{
  const raw = JSON.stringify({ version: 2, updatedAt: 'x', event: null, results: null, observations: [], agreements: [], extra: {} });
  global.window = {
    localStorage: makeStorage({ 'hwv.v2.state': raw }),
    sessionStorage: makeStorage({}, { failGet: false }),
    dispatchEvent() {},
    CustomEvent: class {},
  };
  // 让 sessionStorage 探测失败
  const origSet = global.window.sessionStorage.setItem.bind(global.window.sessionStorage);
  global.window.sessionStorage.setItem = () => { throw new Error('session unavailable'); };
  delete require.cache[require.resolve(storePath)];
  const S = require(storePath);
  const res = S.clearAll();
  check('sessionStorage 不可用时 clearAll 返回失败', res.ok === false && res.reason === 'session', `got ${res.reason}`);
  check('失败时必须报告四个受影响键', Array.isArray(res.sessionKeys) && res.sessionKeys.length === 4, `got ${JSON.stringify(res.sessionKeys)}`);
  check('报告的键名必须是四个会话键', Array.isArray(res.sessionKeys) &&
    ['hwv.flow.safety', 'hwv.flow.consent', 'hwv.flow.reviewId', 'hwv.flow.agreementId'].every((k) => res.sessionKeys.includes(k)),
    `got ${JSON.stringify(res.sessionKeys)}`);
  global.window.sessionStorage.setItem = origSet;
  delete global.window;
}

// ---- 场景 6：agreements 含 null 进入保护 ----
{
  const raw = JSON.stringify({ version: 2, updatedAt: 'x', event: null, results: null, observations: [], agreements: [null], extra: {} });
  global.window = {
    localStorage: makeStorage({ 'hwv.v2.state': raw }),
    sessionStorage: makeStorage({}),
    dispatchEvent() {},
    CustomEvent: class {},
  };
  delete require.cache[require.resolve(storePath)];
  const S = require(storePath);
  S.read();
  check('结构损坏（agreements 含 null）进入保护', S.isCorrupted() === true);
  const still = global.window.localStorage.getItem('hwv.v2.state');
  check('agreements 损坏时原数据不被覆盖', still === raw);
  delete global.window;
}

// ---- 场景 7：事件字段出现错误类型进入保护 ----
{
  const raw = JSON.stringify({ version: 2, updatedAt: 'x', event: { facts: 123, disputed: '', feelings: '', needs: '', interpretation: '', updatedAt: 'x' }, results: null, observations: [], agreements: [], extra: {} });
  global.window = {
    localStorage: makeStorage({ 'hwv.v2.state': raw }),
    sessionStorage: makeStorage({}),
    dispatchEvent() {},
    CustomEvent: class {},
  };
  delete require.cache[require.resolve(storePath)];
  const S = require(storePath);
  S.read();
  check('事件字段非字符串（facts=123）进入保护', S.isCorrupted() === true);
  const still = global.window.localStorage.getItem('hwv.v2.state');
  check('事件字段损坏时原数据不被覆盖', still === raw);
  delete global.window;
}

// ---- 场景 8：未知 Schema 版本进入保护 ----
{
  const raw = JSON.stringify({ version: 99, updatedAt: 'x', event: null, results: null, observations: [], agreements: [], extra: {} });
  global.window = {
    localStorage: makeStorage({ 'hwv.v2.state': raw }),
    sessionStorage: makeStorage({}),
    dispatchEvent() {},
    CustomEvent: class {},
  };
  delete require.cache[require.resolve(storePath)];
  const S = require(storePath);
  S.read();
  check('未知 Schema 版本进入保护', S.isCorrupted() === true);
  const res = S.saveExtra('k', { v: 1 });
  check('未知版本写入被拒绝', res.ok === false && res.reason === 'protected', `got ${res.reason}`);
  const still = global.window.localStorage.getItem('hwv.v2.state');
  check('未知版本原数据不被覆盖', still === raw);
  delete global.window;
}

// ---- 场景 9：同一 Store 实例的恢复行为（P1-03） ----
{
  const raw = JSON.stringify({ version: 2, updatedAt: 'x', event: null, results: null, observations: [], agreements: [], extra: {} });
  global.window = {
    localStorage: makeStorage({ 'hwv.v2.state': raw }, { failGet: true }),
    sessionStorage: makeStorage({}),
    dispatchEvent() {},
    CustomEvent: class {},
  };
  delete require.cache[require.resolve(storePath)];
  const S = require(storePath);
  S.read();
  check('getItem 异常进入保护（场景9前置）', S.isCorrupted() === true);
  const rejected = S.saveExtra('k0', { v: 0 });
  check('保护状态下同一实例写入被拒绝', rejected.ok === false && rejected.reason === 'protected', `got ${rejected.reason}`);

  // 同一实例：解除存储故障后，下一次 read() 必须重新执行完整读取与结构验证
  global.window.localStorage._state.failGet = false;
  const s1 = S.read();
  check('同一实例恢复后保护解除', S.isCorrupted() === false);
  check('同一实例恢复后原数据完好', s1.version === 2);

  // 恢复后多次自动保存：无状态竞争、无损坏标记
  const r1 = S.saveExtra('k1', { v: 1 });
  const r2 = S.saveEvent({ facts: '一段新内容' });
  const r3 = S.addObservation('一条观察', false, { id: 'obs-r' });
  check('恢复后第一次写成功', r1.ok === true);
  check('恢复后第二次写成功且内容存在', r2.ok === true && S.read().event?.facts === '一段新内容');
  check('恢复后第三次写成功', r3.ok === true);
  check('多次写入后仍无损坏标记', S.isCorrupted() === false);
  check('原数据未被多次写入破坏', S.read().version === 2);

  // 再次注入故障：保护必须重新进入（不能因为恢复过一次就永久放行）
  global.window.localStorage._state.failGet = true;
  S.read();
  check('再次出现读取异常时保护重新进入', S.isCorrupted() === true);
  delete global.window;
}

// ---- 场景 10：非法顶层字段类型（observations/agreements/event 等非对象）进入保护 ----
{
  const cases = [
    { name: 'observations 为字符串', raw: JSON.stringify({ version: 2, updatedAt: 'x', event: null, results: null, observations: 'invalid-data', agreements: [], extra: {} }) },
    { name: 'agreements 为数字', raw: JSON.stringify({ version: 2, updatedAt: 'x', event: null, results: null, observations: [], agreements: 42, extra: {} }) },
    { name: 'event 为字符串', raw: JSON.stringify({ version: 2, updatedAt: 'x', event: 'oops', results: null, observations: [], agreements: [], extra: {} }) },
    { name: 'extra 为数组（非对象）', raw: JSON.stringify({ version: 2, updatedAt: 'x', event: null, results: null, observations: [], agreements: [], extra: [1, 2] }) },
  ];
  for (const c of cases) {
    global.window = {
      localStorage: makeStorage({ 'hwv.v2.state': c.raw }),
      sessionStorage: makeStorage({}),
      dispatchEvent() {},
      CustomEvent: class {},
    };
    delete require.cache[require.resolve(storePath)];
    const S = require(storePath);
    S.read();
    check(`${c.name} 进入保护模式`, S.isCorrupted() === true);
    const still = global.window.localStorage.getItem('hwv.v2.state');
    check(`${c.name} 时原始数据不被覆盖`, still === c.raw);
    delete global.window;
  }
}

// ---- 场景 5：正常路径可写 ----
{
  global.window = {
    localStorage: makeStorage({}),
    sessionStorage: makeStorage({}),
    dispatchEvent() {},
    CustomEvent: class {},
  };
  delete require.cache[require.resolve(storePath)];
  const S = require(storePath);
  const res = S.saveExtra('knowSelf.q1', { text: '正常' });
  check('正常路径写入成功', res.ok === true && res.reason === 'saved');
  check('无损坏时 isCorrupted=false', S.isCorrupted() === false);
  delete global.window;
}

console.log(failures === 0 ? '\n全部通过' : `\n${failures} 项失败`);
process.exit(failures === 0 ? 0 : 1);
