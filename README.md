# 数据对账平台

这是一个基于HTML5、CSS和JavaScript开发的数据对账平台，用于上传、查看和管理Excel数据文件。

## 项目结构

项目包含以下文件：

- `claude2.html` - 网站的HTML结构
- `claude2.css` - 所有样式定义
- `claude2.js` - 所有交互功能和动态内容生成
- `README.md` - 项目说明文档

## 功能特点

1. **文件上传**
   - 支持拖放上传Excel文件
   - 支持点击上传区域选择文件
   - 支持.xlsx、.xls和.csv格式

2. **数据展示**
   - 动态生成表格内容
   - 显示上传的Excel数据
   - 自动提取关键字段（承运商、交易数量、收入等）

3. **交互功能**
   - 月份选择器下拉菜单
   - 表格行点击高亮
   - 删除功能
   - 列设置（可自定义显示/隐藏列）

4. **数据统计**
   - 显示上传的报表数量
   - 显示未发布的报表数量
   - 显示收到的收入总额
   - 显示待处理的收入总额

## 使用方法

1. 打开`claude2.html`文件在浏览器中查看网站
2. 点击上传区域或将Excel文件拖放到上传区域
3. 上传成功后，数据将自动显示在表格中
4. 使用筛选标签和列设置按钮自定义数据视图
5. 点击表格行可高亮显示该行
6. 使用操作菜单（每行最右侧的三点图标）可以删除数据

## Excel文件格式要求

上传的Excel文件应包含以下列（不区分大小写，可以使用多种常见命名）：

- **Carrier/carrier/CARRIER** - 承运商名称
- **Total Transaction Number/Transactions/transactions/Count/count** - 交易数量
- **Total Revenue/Revenue/revenue/Amount/amount/Value/value** - 收入金额

如果这些列不存在，系统将生成随机值。

## 技术实现

- 使用HTML5的拖放API实现文件上传
- 使用XLSX库解析Excel文件
- 使用Flexbox布局实现响应式设计
- 使用Font Awesome图标库提供界面图标

## 浏览器兼容性

该项目兼容所有现代浏览器，包括：
- Chrome
- Firefox
- Safari
- Edge

## 注意事项

- 所有数据处理都在浏览器中完成，不会上传到服务器
- 页面刷新后，所有数据将被清除（没有持久化存储） 