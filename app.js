const { initCloud, getCloudStatus } = require('./services/cloud');
const auth = require('./services/auth');

App({
  onLaunch() {
    initCloud();
    this.globalData.user = auth.getStoredUser();
  },

  globalData: {
    appName: '基金复盘助手',
    cloudStatus: getCloudStatus(),
    user: null
  }
});
