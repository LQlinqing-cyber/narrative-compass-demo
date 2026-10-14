# narrative-compass-demo

叙事罗盘静态演示版。页面沿用原站工作台布局，展示用户提供的中秋游园会真实测试报告，包含原稿、五模块、修复稿、90/100 分评分与文字差异。

访问地址：[静态演示](https://wbh2865120967-max.github.io/narrative-compass-demo/)

原站入口：[连接 API 的叙事罗盘](https://narrative-compass-campus.jingxuantang031.chatgpt.site/)

本页无需登录，不调用 API。报告中的“修复稿复检”没有明细，页面如实说明；保留报告原有评分和建议，不新增结论。

GitHub Pages 发布来源为 `main` 分支根目录，所有资源均随仓库提供。

浏览器验收脚本为 `test/browser.mjs`，使用 Node.js、已有 Playwright 和 Microsoft Edge。`PLAYWRIGHT_MODULE` 可指定已安装的 Playwright 模块；设置 `DEMO_URL` 可验收已发布地址。运行：`node test/browser.mjs`。
