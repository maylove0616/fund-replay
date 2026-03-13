const ASSET_KEY = 'fund_replay_assets';
const REVIEW_KEY = 'fund_replay_reviews';

function readList(key) {
  return wx.getStorageSync(key) || [];
}

function writeList(key, list) {
  wx.setStorageSync(key, list);
}

function sumBy(list, field) {
  return list.reduce((total, item) => total + (Number(item[field]) || 0), 0);
}

function formatDate(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

function getAssets() {
  return readList(ASSET_KEY);
}

function addAsset(payload) {
  const nextList = [
    {
      id: uid('asset'),
      createdAt: Date.now(),
      ...payload
    },
    ...getAssets()
  ];
  writeList(ASSET_KEY, nextList);
  return nextList;
}

function updateAsset(id, payload) {
  const nextList = getAssets().map((item) => {
    if (item.id !== id) {
      return item;
    }

    return {
      ...item,
      ...payload,
      updatedAt: Date.now()
    };
  });

  writeList(ASSET_KEY, nextList);
  return nextList;
}

function deleteAsset(id) {
  const nextList = getAssets().filter((item) => item.id !== id);
  writeList(ASSET_KEY, nextList);
  return nextList;
}

function getReviews() {
  return readList(REVIEW_KEY);
}

function normalizeCode(code) {
  return (code || '').trim().toUpperCase();
}

function normalizeName(name) {
  return (name || '').trim();
}

function getAssetGroupKey(asset) {
  const code = normalizeCode(asset.code);
  if (code) {
    return `code:${code}`;
  }
  return `name:${normalizeName(asset.name)}`;
}

function decorateAsset(asset) {
  const pnl = Number(asset.marketValue) - Number(asset.cost);
  const quoteMeta = asset.units || asset.nav
    ? `份额 ${asset.units || '未填'} · 净值 ${asset.nav || '未填'}${asset.navDate ? ` · ${asset.navDate}` : ''}`
    : '';
  return {
    ...asset,
    code: asset.code || '',
    name: asset.name || '',
    date: asset.date || '',
    units: asset.units || '',
    nav: asset.nav || '',
    navDate: asset.navDate || '',
    tags: asset.tags || [],
    quoteMeta,
    pnl: pnl.toFixed(2),
    pnlClass: pnl >= 0 ? 'success' : 'accent'
  };
}

function getAssetGroups(assetList = getAssets(), reviewList = getReviews()) {
  const assets = assetList;
  const reviews = reviewList;
  const reviewMap = reviews.reduce((map, item) => {
    const name = normalizeName(item.fundName);
    if (!name || map[name]) {
      return map;
    }

    map[name] = item;
    return map;
  }, {});

  const groups = assets.reduce((map, item) => {
    const key = getAssetGroupKey(item);
    if (!map[key]) {
      map[key] = {
        key,
        name: normalizeName(item.name),
        code: normalizeCode(item.code),
        totalCost: 0,
        totalMarketValue: 0,
        positions: 0,
        latestDate: item.date || '',
        tags: [],
        reviewId: '',
        reviewDate: '',
        reviewSummary: ''
      };
    }

    const current = map[key];
    current.totalCost += Number(item.cost) || 0;
    current.totalMarketValue += Number(item.marketValue) || 0;
    current.positions += 1;

    if ((item.date || '') > current.latestDate) {
      current.latestDate = item.date || '';
    }

    (item.tags || []).forEach((tag) => {
      if (tag && !current.tags.includes(tag)) {
        current.tags.push(tag);
      }
    });

    const matchedReview = reviewMap[current.name];
    if (matchedReview) {
      current.reviewId = matchedReview.id;
      current.reviewDate = matchedReview.date;
      current.reviewSummary = matchedReview.summary;
    }

    return map;
  }, {});

  return Object.values(groups)
    .map((item) => {
      const pnl = item.totalMarketValue - item.totalCost;
      return {
        ...item,
        totalCost: item.totalCost.toFixed(2),
        totalMarketValue: item.totalMarketValue.toFixed(2),
        pnl: pnl.toFixed(2),
        pnlClass: pnl >= 0 ? 'success' : 'accent'
      };
    })
    .sort((left, right) => right.latestDate.localeCompare(left.latestDate));
}

function addReview(payload) {
  const nextList = [
    {
      id: uid('review'),
      createdAt: Date.now(),
      ...payload
    },
    ...getReviews()
  ];
  writeList(REVIEW_KEY, nextList);
  return nextList;
}

function updateReview(id, payload) {
  const nextList = getReviews().map((item) => {
    if (item.id !== id) {
      return item;
    }

    return {
      ...item,
      ...payload,
      updatedAt: Date.now()
    };
  });

  writeList(REVIEW_KEY, nextList);
  return nextList;
}

function deleteReview(id) {
  const nextList = getReviews().filter((item) => item.id !== id);
  writeList(REVIEW_KEY, nextList);
  return nextList;
}

function getDashboardStats(assetList = getAssets(), reviewList = getReviews()) {
  const assets = assetList;
  const reviews = reviewList;
  const groups = getAssetGroups(assets, reviews);
  const totalCost = sumBy(assets, 'cost');
  const totalMarketValue = sumBy(assets, 'marketValue');
  const floatingPnL = totalMarketValue - totalCost;
  const assetPnLRate = totalCost > 0 ? (floatingPnL / totalCost) * 100 : 0;
  const profitableCount = assets.filter((item) => Number(item.marketValue) >= Number(item.cost)).length;
  const profitableGroupCount = groups.filter((item) => Number(item.pnl) >= 0).length;
  const latestAsset = assets[0] || null;
  const latestReview = reviews[0] || null;
  const recentAssets = assets.slice(0, 3).map(decorateAsset);
  const reviewCoverageRate = groups.length > 0 ? (groups.filter((item) => item.reviewId).length / groups.length) * 100 : 0;

  return {
    totalCost: totalCost.toFixed(2),
    totalMarketValue: totalMarketValue.toFixed(2),
    floatingPnL: floatingPnL.toFixed(2),
    floatingPnLClass: floatingPnL >= 0 ? 'success' : 'accent',
    assetPnLRate: `${assetPnLRate.toFixed(2)}%`,
    assetCount: assets.length,
    groupCount: groups.length,
    reviewCount: reviews.length,
    profitableCount,
    profitableGroupCount,
    reviewCoverageRate: `${reviewCoverageRate.toFixed(0)}%`,
    latestAsset,
    latestReview,
    recentAssets,
    topGroups: groups.slice(0, 3)
  };
}

module.exports = {
  addAsset,
  addReview,
  deleteAsset,
  deleteReview,
  decorateAsset,
  formatDate,
  getAssets,
  getAssetGroupKey,
  getAssetGroups,
  getDashboardStats,
  getReviews,
  updateAsset,
  updateReview
};
