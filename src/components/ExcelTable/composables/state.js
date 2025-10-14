/**
 * 状态定义模块
 * 定义组件的所有响应式数据
 */
export function useState() {
    return {
        // 内部数据副本
        tableData: [],
        // 内部列配置副本
        internalColumns: [],
        // 修改记录
        modifiedCells: new Set(),
        // 当前选中的单元格
        selectedCell: null,
        // 正在编辑的单元格
        editingCell: null,
        // 多选行
        selectedRows: new Set(),
        // 拖动填充相关
        isDraggingFill: false,
        fillStartCell: null,
        fillEndCell: null,
        fillTooltip: null,
        // 列拖动相关
        isDraggingColumn: false,
        draggedColumn: null,
        dropTargetColumn: null,
        dragOverPosition: null, // 'left' or 'right'
        // 行拖动相关
        isDraggingRow: false,
        draggedRow: null,
        dropTargetRow: null,
        dragOverRowPosition: null, // 'top' or 'bottom'
        // 分组相关
        enableGroup: false,
        groupBy: '',
        groupedData: [],
        collapsedGroups: new Set(),
        // 列顺序
        columnOrder: [],
        // 锁定设置
        lockFirstRow: true,
        lockFirstColumn: false,
        // 列宽调整相关
        isResizingColumn: false,
        resizingColumn: null,
        resizeStartX: 0,
        resizeStartWidth: 0,
        columnWidths: {},
        // 添加列弹窗
        showAddColumnDialog: false,
        editingColumnData: null,
        // 虚拟滚动相关
        enableVirtualScroll: true,
        rowHeight: 30, // 默认行高
        visibleRowCount: 20, // 可见行数（初始值，会动态计算）
        scrollTop: 0,
        containerHeight: 600,
        // 编辑模式
        enableEdit: true,
        // 条件格式
        conditionalFormats: [],
        showConditionalFormatDialog: false
    }
}

