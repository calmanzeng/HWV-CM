/* HWV-CM 原型 v2 · 本地数据层
 * 原则：单人、本机、明文 localStorage、零网络请求。
 * 单一存储键，删除即整体移除，避免残留孤片。
 */
(function (global) {
  'use strict';

  var KEY = 'hwv.v2.state';
  var VERSION = 2;
  var listeners = [];

  var box = (function () {
    try {
      var s = global.localStorage;
      s.setItem('hwv.probe', '1');
      s.removeItem('hwv.probe');
      return s;
    } catch (e) {
      return null;
    }
  })();

  var fallback = null;

  function blank() {
    return {
      version: VERSION,
      createdAt: null,
      updatedAt: null,
      event: null,
      results: null,
      observations: [],
      agreements: []
    };
  }

  function normalize(raw) {
    var base = blank();
    if (!raw || typeof raw !== 'object') return base;
    if (raw.version !== VERSION) return base; // 版本不符按空处理，不做猜测性迁移
    base.createdAt = typeof raw.createdAt === 'string' ? raw.createdAt : null;
    base.updatedAt = typeof raw.updatedAt === 'string' ? raw.updatedAt : null;
    if (raw.event && typeof raw.event === 'object') base.event = raw.event;
    if (raw.results && typeof raw.results === 'object') base.results = raw.results;
    if (Array.isArray(raw.observations)) base.observations = raw.observations;
    if (Array.isArray(raw.agreements)) base.agreements = raw.agreements;
    return base;
  }

  function read() {
    if (!box) return normalize(fallback);
    try {
      var raw = box.getItem(KEY);
      return raw ? normalize(JSON.parse(raw)) : blank();
    } catch (e) {
      return blank();
    }
  }

  function notify(state) {
    listeners.forEach(function (fn) {
      try { fn(state); } catch (e) {}
    });
    try {
      global.dispatchEvent(new CustomEvent('hwv:store', { detail: state }));
    } catch (e) {}
  }

  function write(next) {
    var state = normalize(next);
    state.version = VERSION;
    state.updatedAt = new Date().toISOString();
    if (!state.createdAt) state.createdAt = state.updatedAt;

    if (!box) {
      fallback = state;
      notify(state);
      return { ok: false, reason: 'unavailable', state: state };
    }
    try {
      box.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      return { ok: false, reason: 'quota', state: read() };
    }
    notify(state);
    return { ok: true, reason: 'saved', state: state };
  }

  var Store = {
    KEY: KEY,
    VERSION: VERSION,
    available: !!box,

    read: read,

    onChange: function (fn) {
      if (typeof fn === 'function') listeners.push(fn);
    },

    hasContent: function (state) {
      var s = state || read();
      var fields = ['facts', 'disputed', 'feelings', 'needs', 'interpretation'];
      if (s.event) {
        for (var i = 0; i < fields.length; i++) {
          var v = s.event[fields[i]];
          if (typeof v === 'string' && v.trim()) return true;
        }
      }
      if (s.results) return true;
      if (s.observations.length || s.agreements.length) return true;
      return false;
    },

    saveEvent: function (patch) {
      var s = read();
      var merged = s.event || {};
      Object.keys(patch || {}).forEach(function (k) {
        merged[k] = typeof patch[k] === 'string' ? patch[k] : '';
      });
      merged.updatedAt = new Date().toISOString();
      s.event = merged;
      return write(s);
    },

    saveResults: function (data) {
      var s = read();
      s.results = { data: data || {}, savedAt: new Date().toISOString() };
      return write(s);
    },

    addObservation: function (text, confirmed) {
      var s = read();
      s.observations.push({
        text: String(text || ''),
        confirmed: !!confirmed,
        at: new Date().toISOString()
      });
      return write(s);
    },

    clearAll: function () {
      if (!box) {
        fallback = null;
        notify(blank());
        return { ok: false, reason: 'unavailable' };
      }
      try {
        box.removeItem(KEY);
      } catch (e) {
        return { ok: false, reason: 'error' };
      }
      try {
        global.sessionStorage.removeItem('hwv.flow.safety');
        global.sessionStorage.removeItem('hwv.flow.consent');
      } catch (e) {}
      var empty = box.getItem(KEY) === null;
      notify(blank());
      return { ok: empty, reason: empty ? 'deleted' : 'error' };
    },

    sizeBytes: function () {
      if (!box) return 0;
      try {
        var raw = box.getItem(KEY);
        return raw ? new Blob([raw]).size : 0;
      } catch (e) {
        return 0;
      }
    },

    exportText: function () {
      var s = read();
      var payload = {
        app: 'HWV-CM',
        schema: VERSION,
        exportedAt: new Date().toISOString(),
        note: '本文件由用户在本机主动导出。内容为单人记录，未上传任何服务器，不含对方数据。',
        data: {
          event: s.event,
          results: s.results,
          observations: s.observations,
          agreements: s.agreements,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt
        }
      };
      return JSON.stringify(payload, null, 2);
    }
  };

  global.HWVStore = Store;
})(window);