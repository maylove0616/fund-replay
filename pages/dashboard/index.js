const store = require('../../utils/store');
const repository = require('../../services/repository');
const auth = require('../../services/auth');

Page({
  data: {
    cloudStatus: repository.getCloudStatus(),
    loggedIn: false,
    stats: {
      totalCost: '0.00',
      totalMarketValue: '0.00',
      floatingPnL: '0.00',
      floatingPnLClass: 'success',
      assetPnLRate: '0.00%',
      assetCount: 0,
      groupCount: 0,
      profitableCount: 0,
      profitableGroupCount: 0,
      reviewCount: 0,
      reviewCoverageRate: '0%',
      latestAsset: null,
      latestReview: null,
      recentAssets: [],
      topGroups: []
    }
  },

  async onShow() {
    const user = auth.getStoredUser();
    if (!user) {
      this.setData({
        loggedIn: false,
        stats: store.getDashboardStats([], [])
      });
      return;
    }

    try {
      const snapshot = await repository.getSnapshot();
      this.setData({
        loggedIn: true,
        cloudStatus: repository.getCloudStatus(),
        stats: store.getDashboardStats(snapshot.assets, snapshot.reviews)
      });
    } catch (error) {
      this.setData({
        loggedIn: true,
        stats: store.getDashboardStats([], [])
      });
      wx.showToast({
        title: error.message || '读取数据失败',
        icon: 'none'
      });
    }
  },

  goLogin() {
    wx.switchTab({
      url: '/pages/profile/index'
    });
  }
});
