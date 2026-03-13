const { canUseCloud } = require('./cloud');

async function fetchFundByCode(code) {
  const fundCode = (code || '').trim();
  if (!fundCode) {
    throw new Error('请先输入基金代码');
  }

  if (!canUseCloud()) {
    throw new Error('未启用云开发，暂时无法联网查询净值');
  }

  const response = await wx.cloud.callFunction({
    name: 'fundQuote',
    data: {
      code: fundCode
    }
  });
  const result = response.result || {};

  if (!result.success) {
    throw new Error(result.message || '基金查询失败');
  }

  return result.data;
}

module.exports = {
  fetchFundByCode
};
