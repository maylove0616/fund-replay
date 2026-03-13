const { CLOUD_ENV_ID } = require('../utils/config');

let cloudReady = false;
let cloudAvailable = false;
let cloudError = '';

function initCloud() {
  if (!wx.cloud) {
    cloudAvailable = false;
    cloudError = '当前基础库不支持云开发';
    return;
  }

  try {
    wx.cloud.init({
      env: CLOUD_ENV_ID === 'your-cloud-env-id' ? undefined : CLOUD_ENV_ID,
      traceUser: true
    });
    cloudReady = true;
    cloudAvailable = true;
    cloudError = CLOUD_ENV_ID === 'your-cloud-env-id' ? '未配置云环境，当前回退到本地存储' : '';
  } catch (error) {
    cloudAvailable = false;
    cloudReady = false;
    cloudError = error.message || '云开发初始化失败';
  }
}

function canUseCloud() {
  return cloudReady && CLOUD_ENV_ID !== 'your-cloud-env-id';
}

function getCloudStatus() {
  return {
    available: cloudAvailable,
    enabled: canUseCloud(),
    envId: CLOUD_ENV_ID,
    message: cloudError
  };
}

module.exports = {
  canUseCloud,
  getCloudStatus,
  initCloud
};
