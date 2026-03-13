# 基金复盘/资产记录微信小程序

这是一个原生微信小程序，用于：

- 记录基金或账户资产
- 查看成本、市值、浮动盈亏
- 保存每次基金复盘结论、失误和下一步动作

## 当前功能

- `总览`：展示总成本、总市值、浮盈浮亏、基金级持仓看板、复盘覆盖率
- `资产`：新增、编辑、删除资产记录，并按基金自动聚合持仓，可按名称/代码/标签搜索
- `资产`：支持基金代码查询净值，自动回填基金名称、净值日期，并按份额计算市值
- `复盘`：新增、编辑、删除复盘记录，可直接引用已持有基金做复盘
- 支持云开发数据读写；未配置云环境时自动回退到本地 `Storage`
- 提供 `auth`、`records` 和 `fundQuote` 三个云函数模板
- 支持微信登录；登录后每个用户只能看到和修改自己的数据

## 如何运行

1. 打开微信开发者工具
2. 选择“导入项目”
3. 项目目录选择 `/Users/guangmingdeng/Documents/fund-replay`
4. 使用你当前项目的 `AppID`
5. 导入后直接编译预览

## 开启云开发

1. 在微信开发者工具中开通云开发
2. 把 [utils/config.js](/Users/guangmingdeng/Documents/fund-replay/utils/config.js) 里的 `your-cloud-env-id` 改成真实环境 ID
3. 在云开发控制台创建三个集合：
   - `users`
   - `assets`
   - `reviews`
4. 部署两个云函数目录：
   - `cloudfunctions/auth`
   - `cloudfunctions/records`
   - `cloudfunctions/fundQuote`
5. `fundQuote` 默认模板使用公开基金估值接口做代理查询；如果后续换成你自己的接口，只需要改云函数

未完成以上步骤前，小程序会自动使用本地存储，净值联网查询不可用。

## 目录结构

- `app.*`：全局配置
- `pages/dashboard`：总览页
- `pages/assets`：资产记录页
- `pages/review`：基金复盘页
- `services`：云开发和基金查询服务层
- `services/auth.js`：登录态和用户资料服务
- `utils/store.js`：本地存储与汇总逻辑
- `cloudfunctions/auth`：登录和用户资料云函数
- `cloudfunctions/records`：资产/复盘 CRUD 云函数
- `cloudfunctions/fundQuote`：基金净值查询云函数

## 下一步建议

- 增加按日期的收益曲线
- 增加导出 CSV / Excel
- 增加基金详情页和复盘模板
- 增加用户登录与更细的云数据库权限控制
