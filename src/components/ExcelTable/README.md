# ExcelTable 组件文件结构

## 概述
为了提高代码的可维护性，将原来的大文件 `excelTable.js` 拆分成多个功能模块。

## 文件结构

```
ExcelTable/
├── index.js                           # 主入口文件，组合所有模块
├── ExcelTable.vue                     # Vue 组件模板
├── excelTable.css                     # 样式文件
├── excelTable.js                      # 原始文件（已废弃，保留作参考）
├── composables/                       # 功能模块目录
│   ├── state.js                       # 状态定义模块
│   ├── computed.js                    # 计算属性模块
│   ├── watchers.js                    # 监听器模块
│   ├── lifecycle.js                   # 生命周期钩子模块
│   ├── cellOperations.js              # 单元格操作模块
│   ├── fillOperations.js              # 填充操作模块
│   ├── dragOperations.js              # 拖拽操作模块
│   ├── columnOperations.js            # 列操作模块
│   ├── rowOperations.js               # 行操作模块
│   ├── groupOperations.js             # 分组操作模块
│   ├── virtualScroll.js               # 虚拟滚动模块
│   ├── dataOperations.js              # 数据操作模块
│   ├── conditionalFormat.js           # 条件格式模块
│   └── mouseOperations.js             # 鼠标操作模块
├── CellRenderers/                     # 单元格渲染器
│   ├── TextCell.vue
│   ├── NumberCell.vue
│   ├── DateCell.vue
│   ├── SelectCell.vue
│   ├── TagsCell.vue
│   └── ComputedCell.vue
├── AddColumnDialog.vue                # 添加列对话框
└── ConditionalFormatDialog.vue        # 条件格式对话框
```

## 模块说明

### 核心模块

#### `state.js` - 状态定义模块
- 定义组件的所有响应式数据
- 包含表格数据、列配置、选中状态、编辑状态等

#### `computed.js` - 计算属性模块
- 定义所有计算属性
- 包含虚拟滚动计算、数据过滤、选中状态计算等

#### `watchers.js` - 监听器模块
- 定义数据监听和响应逻辑
- 监听 props 变化并同步到内部状态

#### `lifecycle.js` - 生命周期钩子模块
- 定义组件生命周期相关的方法
- 处理事件监听器的添加和移除

### 功能模块

#### `cellOperations.js` - 单元格操作模块
- 单元格点击、双击、编辑
- 键盘导航（方向键、Enter、Escape）
- 单元格值更新和验证

#### `fillOperations.js` - 填充操作模块
- 拖动填充功能
- 智能填充（数字递增）
- 填充预览和提示

#### `dragOperations.js` - 拖拽操作模块
- 列拖动排序
- 行拖动排序
- 拖拽状态管理

#### `columnOperations.js` - 列操作模块
- 列的添加、编辑、删除
- 列宽调整
- 列锁定功能
- 列宽本地存储

#### `rowOperations.js` - 行操作模块
- 行的添加、删除
- 行选择（单选、多选、全选）
- 批量操作

#### `groupOperations.js` - 分组操作模块
- 数据分组
- 分组展开/折叠
- 分组数据管理

#### `virtualScroll.js` - 虚拟滚动模块
- 大数据量虚拟滚动
- 滚动事件处理
- 容器尺寸监听

#### `dataOperations.js` - 数据操作模块
- 数据导入/导出
- 保存/撤销操作
- Excel 文件解析
- 数据类型检测

#### `conditionalFormat.js` - 条件格式模块
- 条件格式规则管理
- 样式应用逻辑
- 条件判断算法

#### `mouseOperations.js` - 鼠标操作模块
- 鼠标事件处理
- 拖拽状态管理
- 列宽调整交互

## 使用方式

组件的使用方式保持不变：

```vue
<template>
  <ExcelTable 
    :data="tableData" 
    :columns="columns"
    @save="handleSave"
    @export="handleExport"
  />
</template>

<script>
import ExcelTable from './components/ExcelTable/ExcelTable.vue'

export default {
  components: {
    ExcelTable
  },
  // ...
}
</script>
```

## 优势

1. **模块化**: 每个功能模块职责单一，便于理解和维护
2. **可复用**: 模块可以在其他组件中复用
3. **易测试**: 每个模块可以独立测试
4. **易扩展**: 新功能可以作为新模块添加
5. **易调试**: 问题定位更加精确

## 迁移说明

- 原 `excelTable.js` 文件已被拆分，但保留作为参考
- 新的入口文件是 `index.js`
- 所有功能保持不变，只是代码组织方式改变
- 如需修改功能，请在对应的模块文件中进行
