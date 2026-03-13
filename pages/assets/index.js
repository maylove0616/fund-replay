const store = require('../../utils/store');
const repository = require('../../services/repository');
const { fetchFundByCode } = require('../../services/fund');

function createForm() {
  return {
    name: '',
    code: '',
    cost: '',
    units: '',
    marketValue: '',
    nav: '',
    navDate: '',
    date: store.formatDate(),
    tags: ''
  };
}

Page({
  data: {
    form: createForm(),
    assets: [],
    assetGroups: [],
    keyword: '',
    editingId: '',
    submitLabel: '保存资产记录',
    cloudStatus: repository.getCloudStatus(),
    quoteStatus: ''
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

  handleKeywordInput(event) {
    this.setData(
      {
        keyword: event.detail.value
      },
      () => {
        this.refreshList();
      }
    );
  },

  async fetchQuote() {
    try {
      wx.showLoading({
        title: '查询中'
      });

      const quote = await fetchFundByCode(this.data.form.code);
      const nextForm = {
        ...this.data.form,
        code: quote.code || this.data.form.code,
        name: quote.name || this.data.form.name,
        nav: quote.nav || '',
        navDate: quote.navDate || this.data.form.navDate,
        date: quote.navDate || this.data.form.date
      };

      if (nextForm.units && quote.nav) {
        nextForm.marketValue = (Number(nextForm.units) * Number(quote.nav)).toFixed(2);
      }

      this.setData({
        form: nextForm,
        quoteStatus: `已更新净值 ${quote.nav}（${quote.navDate || '未知日期'}）`
      });
    } catch (error) {
      wx.showToast({
        title: error.message || '查询失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  computeMarketValue() {
    const { units, nav } = this.data.form;
    if (!units || !nav) {
      wx.showToast({
        title: '请先填写份额和净值',
        icon: 'none'
      });
      return;
    }

    this.setData({
      'form.marketValue': (Number(units) * Number(nav)).toFixed(2),
      quoteStatus: '已按份额和净值计算当前市值'
    });
  },

  async submitAsset() {
    const { name, code, cost, units, marketValue, nav, navDate, date, tags } = this.data.form;
    if (!name || !cost || !marketValue) {
      wx.showToast({
        title: '请补全名称、成本和市值',
        icon: 'none'
      });
      return;
    }

    const payload = {
      name,
      code,
      cost: Number(cost),
      units: units ? Number(units) : '',
      marketValue: Number(marketValue),
      nav: nav ? Number(nav) : '',
      navDate,
      date,
      tags: tags
        .split(/[，,]/)
        .map((item) => item.trim())
        .filter(Boolean)
    };

    const synced = await repository.saveAsset(payload, this.data.editingId);

    wx.showToast({
      title: synced ? (this.data.editingId ? '已同步到云端' : '已写入云端') : (this.data.editingId ? '资产已更新' : '资产已记录'),
      icon: 'success'
    });

    this.resetForm();
    await this.refreshList();
  },

  startEdit(event) {
    const { id } = event.currentTarget.dataset;
    const current = this.data.assets.find((item) => item.id === id);

    if (!current) {
      return;
    }

    this.setData({
      editingId: id,
      submitLabel: '更新资产记录',
      form: {
        name: current.name || '',
        code: current.code || '',
        cost: `${current.cost || ''}`,
        units: `${current.units || ''}`,
        marketValue: `${current.marketValue || ''}`,
        nav: `${current.nav || ''}`,
        navDate: current.navDate || '',
        date: current.date || store.formatDate(),
        tags: (current.tags || []).join(', ')
      },
      quoteStatus: current.nav ? `上次净值 ${current.nav}（${current.navDate || '未记录日期'}）` : ''
    });
  },

  deleteAsset(event) {
    const { id } = event.currentTarget.dataset;

    wx.showModal({
      title: '删除资产记录',
      content: '删除后不会恢复，确认继续吗？',
      success: async ({ confirm }) => {
        if (!confirm) {
          return;
        }

        await repository.removeAsset(id);
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
      submitLabel: '保存资产记录',
      quoteStatus: ''
    });
  },

  async refreshList() {
    const keyword = (this.data.keyword || '').trim().toLowerCase();
    const assets = (await repository.getAssets()).map(store.decorateAsset);
    const reviews = await repository.getReviews();
    const assetGroups = store.getAssetGroups(assets, reviews);
    const filter = (item) => {
      if (!keyword) {
        return true;
      }

      const tags = (item.tags || []).join(' ').toLowerCase();
      return [item.name, item.code, item.date, item.latestDate, tags]
        .join(' ')
        .toLowerCase()
        .includes(keyword);
    };

    this.setData({
      cloudStatus: repository.getCloudStatus(),
      assets: assets.filter(filter),
      assetGroups: assetGroups.filter(filter)
    });
  }
});
