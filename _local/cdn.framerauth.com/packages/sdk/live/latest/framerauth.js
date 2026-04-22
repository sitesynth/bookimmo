(function () {
  var w = typeof window !== 'undefined' ? window : globalThis;
  var listeners = [];
  var store = {
    user: null,
    isAuthenticated: false,
    isLoaded: true,
  };

  function notify(changedKeys) {
    for (var i = 0; i < listeners.length; i++) {
      try {
        var item = listeners[i];
        if (!item) continue;
        if (!item.keys || !changedKeys || !changedKeys.length) {
          item.cb(store);
          continue;
        }
        var hit = false;
        for (var j = 0; j < item.keys.length; j++) {
          if (changedKeys.indexOf(item.keys[j]) !== -1) {
            hit = true;
            break;
          }
        }
        if (hit) item.cb(store);
      } catch (e) {
        // no-op
      }
    }
  }

  function shallowMerge(target, patch) {
    var out = {};
    var k;
    for (k in target) out[k] = target[k];
    for (k in patch) out[k] = patch[k];
    return out;
  }

  w.FramerAuth = {
    getStoreState: function () {
      return store;
    },
    setStoreState: function (next, changedKeys) {
      store = shallowMerge(store, next || {});
      notify(changedKeys || []);
      return store;
    },
    subscribe: function (cb, keys) {
      var item = { cb: cb, keys: Array.isArray(keys) ? keys : null };
      listeners.push(item);
      return function unsubscribe() {
        var idx = listeners.indexOf(item);
        if (idx >= 0) listeners.splice(idx, 1);
      };
    },
    signOut: function (redirectTo) {
      store = { user: null, isAuthenticated: false, isLoaded: true };
      notify(['user', 'isAuthenticated']);
      if (redirectTo && typeof w.location !== 'undefined') {
        try {
          w.location.href = redirectTo;
        } catch (e) {
          // no-op
        }
      }
      return Promise.resolve({ data: true, error: null });
    },
    patchUserData: function (patch) {
      var user = store.user || { data: {} };
      var data = shallowMerge(user.data || {}, patch || {});
      store = shallowMerge(store, { user: shallowMerge(user, { data: data }) });
      notify(['user.data']);
      return Promise.resolve({ data: { user: store.user }, error: null });
    },
  };

  if (typeof console !== 'undefined' && console.info) {
    console.info('Framer Auth - Local stub - v0.1');
  }
})();
