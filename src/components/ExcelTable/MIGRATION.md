# ExcelTable 模块化迁移指南

## 概述
本指南帮助开发者从原来的单文件 `excelTable.js` 迁移到新的模块化结构。

## 主要变化

### 1. 文件结构变化

**旧结构:**
```
ExcelTable/
├── excelTable.js          # 1714行的大文件
├── ExcelTable.vue
└── ...
```

**新结构:**
```
ExcelTable/
├── index.js               # 主入口文件
├── composables/           # 功能模块目录
│   ├── state.js          # 状态管理
│   ├── computed.js       # 计算属性
│   ├── cellOperations.js # 单元格操作
│   └── ...               # 其他功能模块
├── ExcelTable.vue
└── ...
```

### 2. 导入方式变化

**旧方式:**
```javascript
import excelTableLogic from './excelTable.js'
```

**新方式:**
```javascript
import excelTableLogic from './index.js'
```

## 功能模块映射

以下是原 `excelTable.js` 中的功能在新模块中的位置：

### 状态数据 → `state.js`
- `tableData`, `internalColumns`
- `selectedCell`, `editingCell`
- `modifiedCells`, `selectedRows`
- 所有响应式数据定义

### 计算属性 → `computed.js`
- `isAllRowsSelected`, `isSomeRowsSelected`
- `displayColumns`, `displayData`
- `virtualStartIndex`, `virtualEndIndex`
- 虚拟滚动相关计算

### 监听器 → `watchers.js`
- `data` 监听器
- `columns` 监听器

### 生命周期 → `lifecycle.js`
- `mounted`, `updated`, `beforeUnmount`
- 事件监听器管理

### 单元格操作 → `cellOperations.js`
- `handleCellClick`, `handleCellDblClick`
- `handleCellUpdate`, `handleCellBlur`
- `handleKeyDown`, `handleArrowNavigation`
- `getRowData`, `isCellModified`

### 填充操作 → `fillOperations.js`
- `handleFillMouseDown`, `performFill`
- `getFillRange`, `isInFillPreview`
- `createFillTooltip`, `updateFillTooltip`

### 拖拽操作 → `dragOperations.js`
- `handleColumnDragStart`, `performColumnDrop`
- `handleRowDragStart`, `performRowDrop`
- 列和行的拖拽排序

### 列操作 → `columnOperations.js`
- `handleAddColumn`, `handleUpdateColumn`
- `handleColumnResizeStart`, `getColumnWidth`
- `toggleLockFirstColumn`, `resetColumnWidths`
- 列宽本地存储

### 行操作 → `rowOperations.js`
- `addRow`, `deleteSelectedRow`
- `toggleSelectAll`, `toggleRowSelection`
- `deleteSelectedRows`, `updateHeaderCheckbox`

### 分组操作 → `groupOperations.js`
- `createGroupedData`, `toggleGroup`
- `toggleEnableGroup`, `handleGroupByChange`
- `shouldShowRow`, `initializeData`

### 虚拟滚动 → `virtualScroll.js`
- `initializeVirtualScroll`, `handleScroll`

### 数据操作 → `dataOperations.js`
- `saveChanges`, `undoChanges`, `exportData`
- `handleFileImport`, `parseImportedData`
- `detectColumnType`, `generateColumnKey`
- Excel 导入导出相关

### 条件格式 → `conditionalFormat.js`
- `openConditionalFormatDialog`, `applyConditionalFormats`
- `checkCondition`, `getCellStyle`
- 条件格式规则处理

### 鼠标操作 → `mouseOperations.js`
- `handleMouseUp`, `handleMouseMove`
- 鼠标事件处理

## 如何添加新功能

### 1. 创建新模块
```javascript
// src/components/ExcelTable/composables/newFeature.js
export function useNewFeature() {
    return {
        // 新功能的方法
        newMethod() {
            // 实现逻辑
        }
    }
}
```

### 2. 在主入口文件中导入
```javascript
// src/components/ExcelTable/index.js
import { useNewFeature } from './composables/newFeature.js'

export default {
    // ...
    methods: {
        // ...其他模块
        ...useNewFeature()
    }
}
```

## 如何修改现有功能

### 1. 定位功能所在模块
根据功能类型，找到对应的模块文件。

### 2. 修改对应模块
在相应的模块文件中进行修改。

### 3. 测试功能
确保修改不影响其他功能。

## 调试技巧

### 1. 功能定位
- 单元格相关问题 → `cellOperations.js`
- 拖拽问题 → `dragOperations.js` 或 `fillOperations.js`
- 数据问题 → `dataOperations.js`
- 显示问题 → `computed.js` 或对应功能模块

### 2. 状态调试
所有状态都在 `state.js` 中定义，可以在 Vue DevTools 中查看。

### 3. 模块间通信
模块间通过 `this` 访问其他模块的方法和状态，保持了原有的调用方式。

## 兼容性说明

### 完全兼容
- 所有 API 保持不变
- 组件使用方式不变
- 功能行为完全一致

### 开发体验改进
- 代码更易维护
- 功能定位更精确
- 模块职责更清晰

## 常见问题

### Q: 如何确保所有功能正常工作？
A: 新的模块化结构保持了所有原有功能，只是重新组织了代码结构。

### Q: 性能是否受到影响？
A: 不会。模块化只是在开发时的代码组织，运行时性能完全相同。

### Q: 如何回退到旧版本？
A: 原 `excelTable.js` 文件仍然保留，如需回退可以修改导入路径。

### Q: 如何贡献代码？
A: 根据功能类型，在对应的模块文件中进行修改，遵循单一职责原则。

## 总结

模块化重构带来的好处：
1. **可维护性**: 代码结构清晰，易于理解和修改
2. **可扩展性**: 新功能可以作为独立模块添加
3. **可测试性**: 每个模块可以独立测试
4. **团队协作**: 多人可以同时开发不同模块
5. **代码复用**: 模块可以在其他项目中复用

迁移过程对用户完全透明，所有现有功能保持不变。
