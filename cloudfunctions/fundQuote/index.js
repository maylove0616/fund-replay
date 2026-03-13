const cloud = require('wx-server-sdk');
const https = require('https');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

function request(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        let body = '';
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () => {
          resolve(body);
        });
      })
      .on('error', reject);
  });
}

function formatDate(raw) {
  if (!raw) {
    return '';
  }

  const matched = `${raw}`.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (!matched) {
    return `${raw}`;
  }

  return `${matched[1]}-${matched[2]}-${matched[3]}`;
}

function parseResponse(code, content) {
  const matched = content.match(/jsonpgz\((.*)\);?/);
  if (!matched) {
    throw new Error('未解析到基金数据');
  }

  const data = JSON.parse(matched[1]);
  return {
    code: data.fundcode || code,
    name: data.name || '',
    nav: data.dwjz || data.gsz || '',
    navDate: formatDate(data.jzrq || ''),
    estimateNav: data.gsz || '',
    estimateTime: data.gztime || '',
    source: 'eastmoney'
  };
}

exports.main = async (event) => {
  const code = (event.code || '').trim();
  if (!code) {
    return {
      success: false,
      message: '缺少基金代码'
    };
  }

  try {
    const content = await request(`https://fundgz.1234567.com.cn/js/${code}.js`);
    return {
      success: true,
      data: parseResponse(code, content)
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '基金查询失败'
    };
  }
};
