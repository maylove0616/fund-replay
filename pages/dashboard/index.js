const store = require('../../utils/store');
const repository = require('../../services/repository');

Page({
  data: {
    cloudStatus: repository.getCloudStatus(),
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
    const snapshot = await repository.getSnapshot();
    this.setData({
      cloudStatus: repository.getCloudStatus(),
      stats: store.getDashboardStats(snapshot.assets, snapshot.reviews)
    });
  }
});
