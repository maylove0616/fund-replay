const store = require('../../utils/store');
const repository = require('../../services/repository');

function createForm() {
  return {
    fundName: '',
    date: store.formatDate(),
    summary: '',
    mistake: '',
    nextAction: ''
  };
}

Page({
  data: {
    form: createForm(),
    reviews: [],
    trackedFunds: [],
    editingId: '',
    submitLabel: '保存复盘',
    cloudStatus: repository.getCloudStatus()
  },

  async onShow() {
    await this.refreshList();
  },

  handleInput(event) {
    const { field } = event.currentTarget.dataset;
    this.setData({
      [`form.${field}`]: event.detail.value
    });
  },

  async submitReview() {
    const { fundName, date, summary, mistake, nextAction } = this.data.form;
    if (!fundName || !summary || !nextAction) {
      wx.showToast({
        title: '请补全基金、结论和动作',
        icon: 'none'
      });
      return;
    }

    const payload = {
      fundName,
      date,
      summary,
      mistake,
      nextAction
    };

    const synced = await repository.saveReview(payload, this.data.editingId);

    wx.showToast({
      title: synced ? (this.data.editingId ? '已同步到云端' : '已写入云端') : (this.data.editingId ? '复盘已更新' : '复盘已保存'),
      icon: 'success'
    });

    this.resetForm();
    await this.refreshList();
  },

  startEdit(event) {
    const { id } = event.currentTarget.dataset;
    const current = this.data.reviews.find((item) => item.id === id);

    if (!current) {
      return;
    }

    this.setData({
      editingId: id,
      submitLabel: '更新复盘',
      form: {
        fundName: current.fundName || '',
        date: current.date || store.formatDate(),
        summary: current.summary || '',
        mistake: current.mistake || '',
        nextAction: current.nextAction || ''
      }
    });
  },

  deleteReview(event) {
    const { id } = event.currentTarget.dataset;

    wx.showModal({
      title: '删除复盘',
      content: '删除后不会恢复，确认继续吗？',
      success: async ({ confirm }) => {
        if (!confirm) {
          return;
        }

        await repository.removeReview(id);
        if (this.data.editingId === id) {
          this.resetForm();
        }
        await this.refreshList();
        wx.showToast({
          title: '已删除',
          icon: 'success'
        });
      }
    });
  },

  resetForm() {
    this.setData({
      form: createForm(),
      editingId: '',
      submitLabel: '保存复盘'
    });
  },

  useTrackedFund(event) {
    const { name } = event.currentTarget.dataset;
    this.setData({
      'form.fundName': name
    });
  },

  async refreshList() {
    const reviews = await repository.getReviews();
    const assets = await repository.getAssets();
    this.setData({
      cloudStatus: repository.getCloudStatus(),
      reviews,
      trackedFunds: store.getAssetGroups(assets, reviews).slice(0, 6).map((item) => ({
        name: item.name,
        code: item.code,
        label: item.code ? `${item.name} · ${item.code}` : item.name
      }))
    });
  }
});
