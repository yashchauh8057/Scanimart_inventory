(function () {
  'use strict';

  const SESSION_KEY = 'scanimartSession';

  const ROLES = {
    admin: { label: 'Admin', home: '/frontend/dashboard.html' },
    user: { label: 'User', home: '/frontend/pos.html' },
    staff: { label: 'Staff', home: '/frontend/cash-counter.html' },
    security: { label: 'Security', home: '/frontend/exit-check.html' }
  };

  function saveSession(session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; }
    catch { return null; }
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function roleHome(role) {
    return (ROLES[role] || ROLES.user).home;
  }

  function homePage() {
    const session = getSession();
    return session ? roleHome(session.role) : '/frontend/login.html';
  }

  function requireRole(roles) {
    const session = getSession();
    if (!session || !roles.includes(session.role)) {
      window.location.href = 'login.html';
      return null;
    }
    return session;
  }

  async function signInWithPassword(email, password) {
    const account = await window.API.authLogin({ email, password });
    return saveSession({
      user: account.name,
      email: account.email,
      uid: account.role,
      role: account.role
    });
  }

  function logout() {
    clearSession();
    window.location.href = 'login.html';
  }

  window.AppAuth = {
    ROLES,
    getSession,
    saveSession,
    clearSession,
    logout,
    requireRole,
    roleHome,
    homePage,
    signInWithPassword
  };
})();
