const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

async function getOrCreateUser(openid) {
  const collection = db.collection('users');
  const result = await collection.where({ openid }).limit(1).get();

  if (result.data.length) {
    const user = result.data[0];
    return {
      id: user._id,
      openid: user.openid,
      nickname: user.nickname || '微信用户',
      avatarUrl: user.avatarUrl || '',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  const now = Date.now();
  const user = {
    openid,
    nickname: '微信用户',
    avatarUrl: '',
    createdAt: now,
    updatedAt: now
  };

  const created = await collection.add({
    data: user
  });

  return {
    id: created._id,
    ...user
  };
}

async function updateProfile(openid, payload) {
  const collection = db.collection('users');
  const current = await collection.where({ openid }).limit(1).get();

  if (!current.data.length) {
    throw new Error('用户不存在');
  }

  const currentUser = current.data[0];
  const nextUser = {
    nickname: payload.nickname || currentUser.nickname || '微信用户',
    avatarUrl: payload.avatarUrl || currentUser.avatarUrl || '',
    updatedAt: Date.now()
  };

  await collection.doc(currentUser._id).update({
    data: nextUser
  });

  return {
    id: currentUser._id,
    openid,
    nickname: nextUser.nickname,
    avatarUrl: nextUser.avatarUrl,
    createdAt: currentUser.createdAt,
    updatedAt: nextUser.updatedAt
  };
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { action, payload = {} } = event;

  if (action === 'login' || action === 'session') {
    const user = await getOrCreateUser(OPENID);
    return {
      success: true,
      user
    };
  }

  if (action === 'updateProfile') {
    const user = await updateProfile(OPENID, payload);
    return {
      success: true,
      user
    };
  }

  return {
    success: false,
    message: '未知操作类型'
  };
};
