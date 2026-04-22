const _noop = () => {};
const _ok = (data) => Promise.resolve({ data, error: null });

const _state = {
  user: null,
  site: { links: { account: "/account" } },
};

function _syncGlobalAuth() {
  try {
    if (typeof window === "undefined" || !window.FramerAuth || !window.FramerAuth.setStoreState) return;
    window.FramerAuth.setStoreState({
      user: _state.user,
      isAuthenticated: !!_state.user,
      isLoaded: true,
    }, ["user", "isAuthenticated"]);
  } catch (_e) {
    // no-op
  }
}

const q = {
  getSite: async () => ({ data: { site: _state.site }, error: null }),
  getUser: async () => ({ data: { user: _state.user }, error: null }),
  validateLicenseKey: async ({ license_key } = {}) =>
    ({ data: { valid: !!license_key }, error: license_key ? null : { message: "License key is required." } }),
  activateLicenseKey: async () => _ok({ message: "Activated." }),
  signUp: async ({ email, password, options } = {}) => {
    if (!email || !password) return { data: { user: null, session: null }, error: { message: "Email and password are required." } };
    const data = options && options.data ? options.data : {};
    _state.user = { email, first_name: data.first_name || "", last_name: data.last_name || "", data };
    _syncGlobalAuth();
    return { data: { user: _state.user, session: { access_token: "local-stub-token" } }, error: null };
  },
  signInWithPassword: async ({ email, password } = {}) => {
    if (!email || !password) return { data: { user: null, session: null }, error: { message: "Email and password are required." } };
    _state.user = _state.user || { email, first_name: "", last_name: "", data: {} };
    _syncGlobalAuth();
    return { data: { user: _state.user, session: { access_token: "local-stub-token" } }, error: null };
  },
  resetPasswordForEmail: async ({ email } = {}) =>
    email ? _ok({ message: "Email instructions sent." }) : { data: { message: null }, error: { message: "Email is required." } },
  updatePasswordForEmail: async ({ email, password } = {}) =>
    email && password ? _ok({ message: "Password updated." }) : { data: { message: null }, error: { message: "Email and password are required." } },
  updateUser: async (patch = {}) => {
    _state.user = { ...(_state.user || {}), ...patch };
    _syncGlobalAuth();
    return { data: { user: _state.user }, error: null };
  },
  patchUserData: async (patch = {}) => {
    const user = _state.user || { email: "", first_name: "", last_name: "", data: {} };
    user.data = { ...(user.data || {}), ...patch };
    _state.user = user;
    _syncGlobalAuth();
    return { data: user.data, error: null };
  },
  signOut: async (redirectTo) => {
    _state.user = null;
    _syncGlobalAuth();
    if (redirectTo && typeof window !== "undefined" && window.location) {
      try {
        window.location.href = redirectTo;
      } catch (_e) {
        // no-op
      }
    }
    return _ok(true);
  },
};

const Te = {
  label: { title: "Label", type: "object", controls: {} },
  input: { title: "Input", type: "object", controls: {} },
  button: { title: "Button", type: "object", controls: {} },
};

function Q() { return null; }
Q.defaultProps = {};

function Ve() { return null; }
function He() { return null; }

if (typeof console !== "undefined" && console.info) {
  console.info("Framer Auth - Local xlni stub - v0.1");
}

export { _noop as a, Te as i, Ve as n, q as o, Q as r, _noop as s, He as t };
