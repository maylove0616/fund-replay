const { initCloud, getCloudStatus } = require('./services/cloud');

App({
  onLaunch() {
    initCloud();
  },

  globalData: {
    appName: '基金复盘助手',
    cloudStatus: getCloudStatus()
  }
});
