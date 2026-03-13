const auth = require('../../services/auth');

Page({
  data: {
    loggedIn: false,
    profile: null,
    draftNickname: '',
    draftAvatarUrl: ''
  },

  onShow() {
    const profile = auth.getStoredUser();
    this.setData({
      loggedIn: Boolean(profile),
      profile,
      draftNickname: profile ? profile.nickname || '' : '',
      draftAvatarUrl: profile ? profile.avatarUrl || '' : ''
    });
  },

  async handleLogin() {
    try {
      wx.showLoading({
        title: '登录中'
      });
      const profile = await auth.login();
      this.setData({
        loggedIn: true,
        profile,
        draftNickname: profile.nickname || '',
        draftAvatarUrl: profile.avatarUrl || ''
      });
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });
    } catch (error) {
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  handleNicknameInput(event) {
    this.setData({
      draftNickname: event.detail.value
    });
  },

  handleChooseAvatar(event) {
    this.setData({
      draftAvatarUrl: event.detail.avatarUrl
    });
  },

  async saveProfile() {
    try {
      const profile = await auth.updateProfile({
        nickname: this.data.draftNickname.trim() || '微信用户',
        avatarUrl: this.data.draftAvatarUrl
      });
      this.setData({
        profile,
        draftNickname: profile.nickname || '',
        draftAvatarUrl: profile.avatarUrl || ''
      });
      wx.showToast({
        title: '已保存',
        icon: 'success'
      });
    } catch (error) {
      wx.showToast({
        title: error.message || '保存失败',
        icon: 'none'
      });
    }
  },

  handleLogout() {
    wx.showModal({
      title: '退出登录',
      content: '退出后将无法查看和编辑当前账号数据，确认继续吗？',
      success: ({ confirm }) => {
        if (!confirm) {
          return;
        }

        auth.logout();
        this.setData({
          loggedIn: false,
          profile: null,
          draftNickname: '',
          draftAvatarUrl: ''
        });
        wx.showToast({
          title: '已退出',
          icon: 'success'
        });
      }
    });
  }
});
