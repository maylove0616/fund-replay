const STORAGE_KEY = 'fund_replay_auth_user';

function getStoredUser() {
  return wx.getStorageSync(STORAGE_KEY) || null;
}

function setStoredUser(user) {
  wx.setStorageSync(STORAGE_KEY, user);
  const app = getApp();
  if (app && app.globalData) {
    app.globalData.user = user;
  }
}

function clearStoredUser() {
  wx.removeStorageSync(STORAGE_KEY);
  const app = getApp();
  if (app && app.globalData) {
    app.globalData.user = null;
  }
}

async function callAuth(action, payload = {}) {
  const response = await wx.cloud.callFunction({
    name: 'auth',
    data: {
      action,
      ...payload
    }
  });

  return response.result || {};
}

async function login() {
  const result = await callAuth('login');
  if (!result.success) {
    throw new Error(result.message || '登录失败');
  }

  setStoredUser(result.user);
  return result.user;
}

async function refreshSession() {
  const result = await callAuth('session');
  if (!result.success || !result.user) {
    clearStoredUser();
    return null;
  }

  setStoredUser(result.user);
  return result.user;
}

async function updateProfile(payload) {
  const result = await callAuth('updateProfile', { payload });
  if (!result.success) {
    throw new Error(result.message || '更新资料失败');
  }

  setStoredUser(result.user);
  return result.user;
}

function logout() {
  clearStoredUser();
}

function isLoggedIn() {
  return Boolean(getStoredUser());
}

module.exports = {
  getStoredUser,
  isLoggedIn,
  login,
  logout,
  refreshSession,
  updateProfile
};
