const store = require('../utils/store');
const { canUseCloud, getCloudStatus } = require('./cloud');

function unwrap(result) {
  return result && result.result ? result.result : {};
}

async function callRecords(action, entity, payload = {}) {
  const response = await wx.cloud.callFunction({
    name: 'records',
    data: {
      action,
      entity,
      ...payload
    }
  });

  return unwrap(response);
}

async function getAssets() {
  if (canUseCloud()) {
    try {
      const result = await callRecords('list', 'asset');
      return result.items || [];
    } catch (error) {
      return store.getAssets();
    }
  }

  return store.getAssets();
}

async function saveAsset(payload, id = '') {
  if (canUseCloud()) {
    try {
      await callRecords(id ? 'update' : 'create', 'asset', { id, payload });
      return true;
    } catch (error) {
      if (id) {
        store.updateAsset(id, payload);
      } else {
        store.addAsset(payload);
      }
      return false;
    }
  }

  if (id) {
    store.updateAsset(id, payload);
  } else {
    store.addAsset(payload);
  }

  return false;
}

async function removeAsset(id) {
  if (canUseCloud()) {
    try {
      await callRecords('delete', 'asset', { id });
      return true;
    } catch (error) {
      store.deleteAsset(id);
      return false;
    }
  }

  store.deleteAsset(id);
  return false;
}

async function getReviews() {
  if (canUseCloud()) {
    try {
      const result = await callRecords('list', 'review');
      return result.items || [];
    } catch (error) {
      return store.getReviews();
    }
  }

  return store.getReviews();
}

async function saveReview(payload, id = '') {
  if (canUseCloud()) {
    try {
      await callRecords(id ? 'update' : 'create', 'review', { id, payload });
      return true;
    } catch (error) {
      if (id) {
        store.updateReview(id, payload);
      } else {
        store.addReview(payload);
      }
      return false;
    }
  }

  if (id) {
    store.updateReview(id, payload);
  } else {
    store.addReview(payload);
  }

  return false;
}

async function removeReview(id) {
  if (canUseCloud()) {
    try {
      await callRecords('delete', 'review', { id });
      return true;
    } catch (error) {
      store.deleteReview(id);
      return false;
    }
  }

  store.deleteReview(id);
  return false;
}

async function getSnapshot() {
  const [assets, reviews] = await Promise.all([getAssets(), getReviews()]);
  return { assets, reviews };
}

module.exports = {
  getAssets,
  getCloudStatus,
  getReviews,
  getSnapshot,
  removeAsset,
  removeReview,
  saveAsset,
  saveReview
};
