const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

function getCollectionName(entity) {
  if (entity === 'asset') {
    return 'assets';
  }

  if (entity === 'review') {
    return 'reviews';
  }

  throw new Error('未知实体类型');
}

function normalizePayload(entity, payload, openid) {
  const base = {
    ...payload,
    openid,
    updatedAt: Date.now()
  };

  if (entity === 'asset') {
    return {
      name: payload.name || '',
      code: payload.code || '',
      cost: Number(payload.cost) || 0,
      units: payload.units ? Number(payload.units) : '',
      marketValue: Number(payload.marketValue) || 0,
      nav: payload.nav ? Number(payload.nav) : '',
      navDate: payload.navDate || '',
      date: payload.date || '',
      tags: payload.tags || [],
      ...base
    };
  }

  return {
    fundName: payload.fundName || '',
    date: payload.date || '',
    summary: payload.summary || '',
    mistake: payload.mistake || '',
    nextAction: payload.nextAction || '',
    ...base
  };
}

async function listRecords(entity, openid) {
  const result = await db.collection(getCollectionName(entity)).where({ openid }).orderBy('createdAt', 'desc').get();
  return {
    items: result.data.map((item) => ({
      ...item,
      id: item._id
    }))
  };
}

async function createRecord(entity, payload, openid) {
  await db.collection(getCollectionName(entity)).add({
    data: {
      ...normalizePayload(entity, payload, openid),
      createdAt: Date.now()
    }
  });
  return { success: true };
}

async function updateRecord(entity, id, payload, openid) {
  const collection = db.collection(getCollectionName(entity));
  const current = await collection.where({
    _id: id,
    openid
  }).get();

  if (!current.data.length) {
    throw new Error('记录不存在或无权限');
  }

  await collection.doc(id).update({
    data: normalizePayload(entity, payload, openid)
  });
  return { success: true };
}

async function deleteRecord(entity, id, openid) {
  const collection = db.collection(getCollectionName(entity));
  const current = await collection.where({
    _id: id,
    openid
  }).get();

  if (!current.data.length) {
    throw new Error('记录不存在或无权限');
  }

  await collection.doc(id).remove();
  return { success: true };
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { action, entity, payload = {}, id = '' } = event;

  if (action === 'list') {
    return listRecords(entity, OPENID);
  }

  if (action === 'create') {
    return createRecord(entity, payload, OPENID);
  }

  if (action === 'update') {
    return updateRecord(entity, id, payload, OPENID);
  }

  if (action === 'delete') {
    return deleteRecord(entity, id, OPENID);
  }

  throw new Error('未知操作类型');
};
