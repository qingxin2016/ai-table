import * as XLSX from 'xlsx';

export default {
    name: 'ExcelTable',
    props: {
        // 表格数据
        data: {
            type: Array,
            required: true,
            default: () => []
        },
        // 列配置
        columns: {
            type: Array,
            required: true,
            default: () => []
        }
    },
    data() {
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
    },
    computed: {
        // 是否全选
        isAllRowsSelected() {
            if (this.displayData.length === 0) return false;
            const dataRows = this.displayData.filter(row => !row._isGroup);
            if (dataRows.length === 0) return false;
            return dataRows.every((row, index) => {
                const originalIndex = row._originalIndex !== undefined ? row._originalIndex : index;
                return this.selectedRows.has(originalIndex);
            });
        },
        // 是否部分选中
        isSomeRowsSelected() {
            return this.selectedRows.size > 0 && !this.isAllRowsSelected;
        },
        // 获取显示的列
        displayColumns() {
            if (this.columnOrder.length > 0) {
                return this.columnOrder.map(key =>
                    this.internalColumns.find(col => col.key === key)
                ).filter(Boolean);
            }
            return this.internalColumns;
        },
        // 获取显示的数据
        displayData() {
            if (this.enableGroup && this.groupBy) {
                return this.groupedData;
            }
            return this.tableData;
        },
        // 虚拟滚动：计算开始索引
        virtualStartIndex() {
            if (!this.enableVirtualScroll) return 0;
            return Math.floor(this.scrollTop / this.rowHeight);
        },
        // 虚拟滚动：计算结束索引
        virtualEndIndex() {
            if (!this.enableVirtualScroll) return this.displayData.length;
            return Math.min(
                this.displayData.length,
                this.virtualStartIndex + this.visibleRowCount + 5 // 多渲染5行作为缓冲
            );
        },
        // 虚拟滚动：可见行数据
        visibleRows() {
            if (!this.enableVirtualScroll) {
                return this.displayData.map((row, index) => ({ row, index }));
            }
            const result = [];
            for (let i = this.virtualStartIndex; i < this.virtualEndIndex; i++) {
                if (this.displayData[i]) {
                    result.push({
                        row: this.displayData[i],
                        index: i
                    });
                }
            }
            return result;
        },
        // 虚拟滚动：总高度
        totalHeight() {
            if (!this.enableVirtualScroll) return 'auto';
            return this.displayData.length * this.rowHeight;
        },
        // 虚拟滚动：偏移量
        offsetY() {
            if (!this.enableVirtualScroll) return 0;
            return this.virtualStartIndex * this.rowHeight;
        }
    },
    watch: {
        data: {
            immediate: true,
            handler(newData) {
                this.tableData = JSON.parse(JSON.stringify(newData));
                this.initializeData();
            }
        },
        columns: {
            immediate: true,
            deep: true,
            handler(newColumns) {
                this.internalColumns = JSON.parse(JSON.stringify(newColumns));

                // 只在初始化时或新增/删除列时更新 columnOrder
                // 保持现有的列顺序，只添加新列或移除已删除的列
                const newKeys = newColumns.map(col => col.key);
                const existingKeys = this.columnOrder.filter(key => newKeys.includes(key));
                const addedKeys = newKeys.filter(key => !this.columnOrder.includes(key));

                // 如果是初始化（columnOrder为空）或列数量变化，才重置顺序
                if (this.columnOrder.length === 0 || addedKeys.length > 0 || existingKeys.length !== this.columnOrder.length) {
                    // 保持现有顺序，添加新列到末尾
                    this.columnOrder = [...existingKeys, ...addedKeys];
                }
            }
        }
    },
    mounted() {
        document.addEventListener('mouseup', this.handleMouseUp);
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('keydown', this.handleKeyDown);
        this.createFillTooltip();
        this.initializeColumnWidths();
        this.initializeVirtualScroll();
        this.updateHeaderCheckbox();
    },
    updated() {
        this.updateHeaderCheckbox();
    },
    beforeUnmount() {
        document.removeEventListener('mouseup', this.handleMouseUp);
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('keydown', this.handleKeyDown);
        if (this.fillTooltip) {
            document.body.removeChild(this.fillTooltip);
        }

        // 清理虚拟滚动相关监听器
        const container = document.querySelector('.excel-table-container');
        if (container) {
            container.removeEventListener('scroll', this.handleScroll);
        }
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    },
    methods: {
        // 创建填充提示工具
        createFillTooltip() {
            this.fillTooltip = document.createElement('div');
            this.fillTooltip.className = 'fill-tooltip';
            this.fillTooltip.style.display = 'none';
            document.body.appendChild(this.fillTooltip);
        },

        // 初始化列宽
        initializeColumnWidths() {
            const widths = {};
            this.internalColumns.forEach(col => {
                widths[col.key] = col.width || 100;
            });
            this.columnWidths = widths;

            // 加载保存的列宽
            this.loadColumnWidthsFromStorage();
        },

        // 初始化虚拟滚动
        initializeVirtualScroll() {
            this.$nextTick(() => {
                const container = document.querySelector('.excel-table-container');
                if (container) {
                    this.containerHeight = container.clientHeight;
                    this.visibleRowCount = Math.ceil(this.containerHeight / this.rowHeight) + 2;

                    // 添加滚动事件监听
                    container.addEventListener('scroll', this.handleScroll);

                    // 使用 ResizeObserver 监听容器尺寸变化
                    if (typeof ResizeObserver !== 'undefined') {
                        this.resizeObserver = new ResizeObserver(() => {
                            this.containerHeight = container.clientHeight;
                            this.visibleRowCount = Math.ceil(this.containerHeight / this.rowHeight) + 2;
                        });
                        this.resizeObserver.observe(container);
                    }
                }
            });
        },

        // 处理滚动事件
        handleScroll(event) {
            if (this.enableVirtualScroll) {
                this.scrollTop = event.target.scrollTop;
            }
        },

        // 初始化数据
        initializeData() {
            if (this.enableGroup && this.groupBy) {
                this.createGroupedData();
            }
        },

        // 创建分组数据
        createGroupedData() {
            const groups = {};
            this.tableData.forEach((row, index) => {
                const groupValue = row[this.groupBy] || '未分组';
                if (!groups[groupValue]) {
                    groups[groupValue] = [];
                }
                groups[groupValue].push({ ...row, _originalIndex: index });
            });

            this.groupedData = [];
            Object.keys(groups).forEach(groupName => {
                this.groupedData.push({
                    _isGroup: true,
                    _groupName: groupName,
                    _collapsed: this.collapsedGroups.has(groupName)
                });
                groups[groupName].forEach(row => {
                    this.groupedData.push({
                        ...row,
                        _groupName: groupName
                    });
                });
            });
        },

        // 切换分组折叠
        toggleGroup(groupName) {
            if (this.collapsedGroups.has(groupName)) {
                this.collapsedGroups.delete(groupName);
            } else {
                this.collapsedGroups.add(groupName);
            }
            this.createGroupedData();
        },

        // 判断行是否应该显示
        shouldShowRow(row) {
            if (!row._groupName) return true;
            return !this.collapsedGroups.has(row._groupName);
        },

        // 单元格点击
        handleCellClick(rowIndex, colKey, event) {
            const row = this.displayData[rowIndex];
            if (row._isGroup) return;

            this.selectedCell = { rowIndex, colKey };
            this.editingCell = null;
        },

        // 单元格双击进入编辑
        handleCellDblClick(rowIndex, colKey) {
            // 检查是否启用编辑模式
            if (!this.enableEdit) {
                return;
            }

            const row = this.displayData[rowIndex];
            if (row._isGroup) return;

            // 检查是否为计算列，计算列不允许编辑
            const column = this.internalColumns.find(col => col.key === colKey);
            if (column && column.type === 'computed') {
                return; // 计算列不能编辑
            }

            this.editingCell = { rowIndex, colKey };
            this.selectedCell = { rowIndex, colKey };
            this.$nextTick(() => {
                const input = this.$refs[`input-${rowIndex}-${colKey}`];
                if (input && input[0]) {
                    input[0].focus();
                    input[0].select();
                }
            });
        },

        // 单元格值变化（新）
        handleCellUpdate(rowIndex, colKey, newValue) {
            const row = this.displayData[rowIndex];
            const originalIndex = row._originalIndex !== undefined ? row._originalIndex : rowIndex;

            const oldValue = this.tableData[originalIndex][colKey];

            // 对于数组类型的值（如 tags），需要特殊处理比较
            const isValueChanged = Array.isArray(newValue)
                ? JSON.stringify(newValue) !== JSON.stringify(oldValue)
                : newValue !== oldValue;

            console.log('handleCellUpdate:', { rowIndex, colKey, newValue, oldValue, isValueChanged });

            if (isValueChanged) {
                // 直接赋值（Vue 3 的响应式系统会自动处理）
                this.tableData[originalIndex][colKey] = newValue;
                this.modifiedCells.add(`${originalIndex}-${colKey}`);

                // 强制更新以确保视图刷新
                this.$forceUpdate();
            }

            if (this.enableGroup) {
                this.createGroupedData();
            }
        },

        // 单元格值变化（兼容旧版）
        handleCellInput(rowIndex, colKey, event) {
            this.handleCellUpdate(rowIndex, colKey, event.target.value);
        },

        // 单元格输入框失焦
        handleCellBlur(rowIndex, colKey, event) {
            // 延迟处理，避免在输入框内点击时立即失焦
            setTimeout(() => {
                // 检查焦点是否还在当前输入框或其内部
                const input = this.$refs[`input-${rowIndex}-${colKey}`];
                if (input && input[0] && document.activeElement === input[0]) {
                    return; // 焦点还在输入框，不退出编辑模式
                }
                this.editingCell = null;
            }, 100);
        },

        // 键盘事件处理
        handleKeyDown(event) {
            // Escape键退出编辑（优先级最高）
            if (event.key === 'Escape' && this.editingCell) {
                const { rowIndex, colKey } = this.editingCell;
                // 恢复原始值
                const row = this.displayData[rowIndex];
                const originalIndex = row._originalIndex !== undefined ? row._originalIndex : rowIndex;
                const input = this.$refs[`input-${rowIndex}-${colKey}`];
                if (input && input[0]) {
                    input[0].value = this.tableData[originalIndex][colKey];
                }
                this.editingCell = null;
                event.preventDefault();
                return;
            }

            if (!this.selectedCell) return;

            const { rowIndex, colKey } = this.selectedCell;

            // Enter键进入编辑或确认编辑
            if (event.key === 'Enter') {
                if (this.editingCell) {
                    this.editingCell = null;
                    event.preventDefault();
                } else if (this.enableEdit) {
                    this.handleCellDblClick(rowIndex, colKey);
                    event.preventDefault();
                }
            }

            // 方向键导航
            if (!this.editingCell && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
                this.handleArrowNavigation(event.key);
                event.preventDefault();
            }
        },

        // 方向键导航
        handleArrowNavigation(key) {
            const { rowIndex, colKey } = this.selectedCell;
            const colIndex = this.displayColumns.findIndex(col => col.key === colKey);

            let newRowIndex = rowIndex;
            let newColIndex = colIndex;

            switch (key) {
                case 'ArrowUp':
                    newRowIndex = Math.max(0, rowIndex - 1);
                    break;
                case 'ArrowDown':
                    newRowIndex = Math.min(this.displayData.length - 1, rowIndex + 1);
                    break;
                case 'ArrowLeft':
                    newColIndex = Math.max(0, colIndex - 1);
                    break;
                case 'ArrowRight':
                    newColIndex = Math.min(this.displayColumns.length - 1, colIndex + 1);
                    break;
            }

            // 跳过分组行
            while (newRowIndex !== rowIndex && this.displayData[newRowIndex]?._isGroup) {
                if (key === 'ArrowUp') newRowIndex--;
                if (key === 'ArrowDown') newRowIndex++;
                if (newRowIndex < 0 || newRowIndex >= this.displayData.length) {
                    return;
                }
            }

            this.selectedCell = {
                rowIndex: newRowIndex,
                colKey: this.displayColumns[newColIndex].key
            };
        },

        // 填充手柄鼠标按下
        handleFillMouseDown(rowIndex, colKey, event) {
            event.stopPropagation();

            // 检查是否为计算列，计算列不允许填充
            const column = this.internalColumns.find(col => col.key === colKey);
            if (column && column.type === 'computed') {
                return; // 计算列不能填充
            }

            this.isDraggingFill = true;
            this.fillStartCell = { rowIndex, colKey };
            this.fillEndCell = { rowIndex, colKey };
        },

        // 单元格鼠标移动（用于填充预览）
        handleCellMouseEnter(rowIndex, colKey) {
            if (this.isDraggingFill) {
                this.fillEndCell = { rowIndex, colKey };
                this.updateFillTooltip();
            }
        },

        // 更新填充提示
        updateFillTooltip() {
            if (!this.fillTooltip || !this.isDraggingFill) return;

            const range = this.getFillRange();
            const count = (range.endRow - range.startRow + 1) * (range.endCol - range.startCol + 1);

            this.fillTooltip.textContent = `填充 ${count} 个单元格`;
            this.fillTooltip.style.display = 'block';
        },

        // 获取填充范围
        getFillRange() {
            if (!this.fillStartCell || !this.fillEndCell) {
                return { startRow: 0, endRow: 0, startCol: 0, endCol: 0 };
            }

            const startRow = Math.min(this.fillStartCell.rowIndex, this.fillEndCell.rowIndex);
            const endRow = Math.max(this.fillStartCell.rowIndex, this.fillEndCell.rowIndex);
            const startColIndex = this.displayColumns.findIndex(col => col.key === this.fillStartCell.colKey);
            const endColIndex = this.displayColumns.findIndex(col => col.key === this.fillEndCell.colKey);
            const startCol = Math.min(startColIndex, endColIndex);
            const endCol = Math.max(startColIndex, endColIndex);

            return { startRow, endRow, startCol, endCol };
        },

        // 鼠标释放（完成填充）
        handleMouseUp() {
            if (this.isDraggingFill) {
                this.performFill();
                this.isDraggingFill = false;
                this.fillStartCell = null;
                this.fillEndCell = null;
                if (this.fillTooltip) {
                    this.fillTooltip.style.display = 'none';
                }
            }

            if (this.isResizingColumn) {
                // 保存列宽调整
                this.saveColumnWidth(this.resizingColumn, this.columnWidths[this.resizingColumn]);
                this.isResizingColumn = false;
                this.resizingColumn = null;
            }
        },

        // 鼠标移动
        handleMouseMove(event) {
            if (this.isDraggingFill && this.fillTooltip) {
                this.fillTooltip.style.left = (event.clientX + 15) + 'px';
                this.fillTooltip.style.top = (event.clientY + 15) + 'px';
            }

            if (this.isResizingColumn && this.resizingColumn) {
                const diff = event.clientX - this.resizeStartX;
                const newWidth = Math.max(50, this.resizeStartWidth + diff);
                // Vue 3 直接赋值，使用解构确保响应式更新
                this.columnWidths = {
                    ...this.columnWidths,
                    [this.resizingColumn]: newWidth
                };
            }
        },

        // 执行填充操作
        performFill() {
            if (!this.fillStartCell || !this.fillEndCell) return;

            const range = this.getFillRange();
            const sourceValue = this.getRowData(this.fillStartCell.rowIndex)[this.fillStartCell.colKey];

            // 检测是否为数字，支持智能填充
            const isNumber = !isNaN(parseFloat(sourceValue)) && isFinite(sourceValue);
            const sourceNum = isNumber ? parseFloat(sourceValue) : null;

            for (let row = range.startRow; row <= range.endRow; row++) {
                const rowData = this.displayData[row];
                if (rowData._isGroup) continue;

                for (let col = range.startCol; col <= range.endCol; col++) {
                    const colKey = this.displayColumns[col].key;
                    if (row === this.fillStartCell.rowIndex && colKey === this.fillStartCell.colKey) {
                        continue;
                    }

                    // 跳过计算列
                    const column = this.internalColumns.find(c => c.key === colKey);
                    if (column && column.type === 'computed') {
                        continue;
                    }

                    const originalIndex = rowData._originalIndex !== undefined ? rowData._originalIndex : row;

                    // 智能填充：如果是数字，则递增
                    let fillValue = sourceValue;
                    if (isNumber && sourceNum !== null) {
                        const rowOffset = row - this.fillStartCell.rowIndex;
                        const colOffset = col - this.displayColumns.findIndex(c => c.key === this.fillStartCell.colKey);
                        const offset = Math.max(Math.abs(rowOffset), Math.abs(colOffset));
                        fillValue = sourceNum + offset;
                    }

                    this.tableData[originalIndex][colKey] = fillValue;
                    this.modifiedCells.add(`${originalIndex}-${colKey}`);
                }
            }

            if (this.enableGroup) {
                this.createGroupedData();
            }
        },

        // 判断单元格是否在填充预览范围内
        isInFillPreview(rowIndex, colKey) {
            if (!this.isDraggingFill || !this.fillStartCell || !this.fillEndCell) {
                return false;
            }

            const range = this.getFillRange();
            const currentColIndex = this.displayColumns.findIndex(col => col.key === colKey);

            return rowIndex >= range.startRow && rowIndex <= range.endRow &&
                currentColIndex >= range.startCol && currentColIndex <= range.endCol;
        },

        // 列拖动开始
        handleColumnDragStart(colKey, event) {
            this.isDraggingColumn = true;
            this.draggedColumn = colKey;
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', colKey);
        },

        // 列拖动进入
        handleColumnDragEnter(colKey, event) {
            if (!this.isDraggingColumn) return;

            event.preventDefault();
            if (colKey !== this.draggedColumn) {
                this.dropTargetColumn = colKey;

                // 计算鼠标在列中的位置，判断是插入左侧还是右侧
                const th = event.target.closest('th');
                if (th) {
                    const rect = th.getBoundingClientRect();
                    const mouseX = event.clientX;
                    const middle = rect.left + rect.width / 2;
                    this.dragOverPosition = mouseX < middle ? 'left' : 'right';
                }
            }
        },

        // 列拖动结束
        handleColumnDragOver(event) {
            if (this.isDraggingColumn) {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
            }
        },

        // 列拖放完成
        handleColumnDrop(event) {
            event.preventDefault();
            if (this.isDraggingColumn) {
                this.performColumnDrop();
            }
        },

        // 列拖动结束
        handleColumnDragEnd() {
            this.isDraggingColumn = false;
            this.draggedColumn = null;
            this.dropTargetColumn = null;
            this.dragOverPosition = null;
        },

        // 执行列交换
        performColumnDrop() {
            if (!this.draggedColumn || !this.dropTargetColumn) return;

            const fromIndex = this.columnOrder.indexOf(this.draggedColumn);
            let toIndex = this.columnOrder.indexOf(this.dropTargetColumn);

            if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
                const newOrder = [...this.columnOrder];
                const [removed] = newOrder.splice(fromIndex, 1);

                // 如果拖动位置在右侧，且fromIndex < toIndex，需要调整插入位置
                if (this.dragOverPosition === 'right') {
                    if (fromIndex < toIndex) {
                        toIndex = toIndex;
                    } else {
                        toIndex = toIndex + 1;
                    }
                } else {
                    if (fromIndex > toIndex) {
                        toIndex = toIndex;
                    } else {
                        toIndex = toIndex;
                    }
                }

                newOrder.splice(toIndex, 0, removed);
                this.columnOrder = newOrder;
            }
        },

        // 行拖动开始
        handleRowDragStart(rowIndex, event) {
            event.stopPropagation();
            const row = this.displayData[rowIndex];
            if (row._isGroup) {
                event.preventDefault();
                return;
            }

            this.isDraggingRow = true;
            this.draggedRow = rowIndex;
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', String(rowIndex));
        },

        // 行拖动进入
        handleRowDragEnter(rowIndex, event) {
            if (!this.isDraggingRow) return;

            event.preventDefault();
            const row = this.displayData[rowIndex];
            if (!row._isGroup && rowIndex !== this.draggedRow) {
                this.dropTargetRow = rowIndex;

                // 计算鼠标在行中的位置，判断是插入上方还是下方
                const tr = event.target.closest('tr');
                if (tr) {
                    const rect = tr.getBoundingClientRect();
                    const mouseY = event.clientY;
                    const middle = rect.top + rect.height / 2;
                    this.dragOverRowPosition = mouseY < middle ? 'top' : 'bottom';
                }
            }
        },

        // 行拖动结束
        handleRowDragOver(event) {
            if (this.isDraggingRow) {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
            }
        },

        // 行拖放完成
        handleRowDrop(event) {
            event.preventDefault();
            if (this.isDraggingRow) {
                this.performRowDrop();
            }
        },

        // 行拖动结束
        handleRowDragEnd() {
            this.isDraggingRow = false;
            this.draggedRow = null;
            this.dropTargetRow = null;
            this.dragOverRowPosition = null;
        },

        // 执行行交换
        performRowDrop() {
            if (this.draggedRow === null || this.dropTargetRow === null) return;

            const fromRow = this.displayData[this.draggedRow];
            const toRow = this.displayData[this.dropTargetRow];

            if (fromRow._isGroup || toRow._isGroup) return;

            const fromOriginalIndex = fromRow._originalIndex !== undefined ? fromRow._originalIndex : this.draggedRow;
            let toOriginalIndex = toRow._originalIndex !== undefined ? toRow._originalIndex : this.dropTargetRow;

            // 移除源行
            const [movedRow] = this.tableData.splice(fromOriginalIndex, 1);

            // 重新计算目标索引
            if (this.dragOverRowPosition === 'bottom') {
                if (fromOriginalIndex < toOriginalIndex) {
                    toOriginalIndex = toOriginalIndex;
                } else {
                    toOriginalIndex = toOriginalIndex + 1;
                }
            } else {
                if (fromOriginalIndex > toOriginalIndex) {
                    toOriginalIndex = toOriginalIndex;
                } else {
                    toOriginalIndex = toOriginalIndex - 1;
                }
            }

            // 插入到新位置
            this.tableData.splice(toOriginalIndex, 0, movedRow);

            if (this.enableGroup) {
                this.createGroupedData();
            }
        },

        // 获取行数据
        getRowData(rowIndex) {
            const row = this.displayData[rowIndex];
            if (row._originalIndex !== undefined) {
                return this.tableData[row._originalIndex];
            }
            return this.tableData[rowIndex];
        },

        // 判断单元格是否被修改
        isCellModified(rowIndex, colKey) {
            const row = this.displayData[rowIndex];
            const originalIndex = row._originalIndex !== undefined ? row._originalIndex : rowIndex;
            return this.modifiedCells.has(`${originalIndex}-${colKey}`);
        },

        // 保存修改
        saveChanges() {
            this.modifiedCells.clear();
            this.$emit('save', this.tableData);
        },

        // 撤销修改
        undoChanges() {
            this.tableData = JSON.parse(JSON.stringify(this.data));
            this.modifiedCells.clear();
            if (this.enableGroup) {
                this.createGroupedData();
            }
        },

        // 导出数据
        exportData() {
            this.$emit('export', this.tableData);
        },

        // 切换锁定首列
        toggleLockFirstColumn() {
            this.lockFirstColumn = !this.lockFirstColumn;
        },

        // 判断列是否锁定
        isColumnLocked(colIndex) {
            return this.lockFirstColumn && colIndex === 0;
        },

        // 开始调整列宽
        handleColumnResizeStart(colKey, event) {
            event.stopPropagation();
            event.preventDefault();

            this.isResizingColumn = true;
            this.resizingColumn = colKey;
            this.resizeStartX = event.clientX;
            this.resizeStartWidth = this.columnWidths[colKey] || 100;
        },

        // 获取列宽
        getColumnWidth(colKey) {
            return this.columnWidths[colKey] || 100;
        },

        // 获取列样式
        getColumnStyle(colKey) {
            return {
                width: this.getColumnWidth(colKey) + 'px',
                minWidth: this.getColumnWidth(colKey) + 'px',
                maxWidth: this.getColumnWidth(colKey) + 'px'
            };
        },

        // 获取单元格组件
        getCellComponent(type) {
            const typeMap = {
                'text': 'TextCell',
                'number': 'NumberCell',
                'date': 'DateCell',
                'select': 'SelectCell',
                'tags': 'TagsCell',
                'computed': 'ComputedCell'
            };
            return typeMap[type] || 'TextCell';
        },

        // 打开编辑列配置对话框
        openEditColumnDialog(column) {
            this.editingColumnData = { ...column };
            this.showAddColumnDialog = true;
        },

        // 关闭列配置对话框
        handleCloseColumnDialog() {
            this.showAddColumnDialog = false;
            this.editingColumnData = null;
        },

        // 添加列
        handleAddColumn(columnConfig) {
            // 直接添加到内部列配置
            this.internalColumns.push(columnConfig);

            // 更新列顺序
            this.columnOrder.push(columnConfig.key);

            // 初始化新列的宽度
            this.columnWidths[columnConfig.key] = columnConfig.width || 100;

            // 为所有现有数据添加新列的默认值（计算列除外，因为它是自动计算的）
            if (columnConfig.type !== 'computed') {
                this.tableData.forEach(row => {
                    if (!row.hasOwnProperty(columnConfig.key)) {
                        // tags 类型初始化为空数组，其他类型为空字符串
                        row[columnConfig.key] = columnConfig.type === 'tags' ? [] : '';
                    }
                });
            }

            if (this.enableGroup) {
                this.createGroupedData();
            }

            // 同时通知父组件（可选，用于同步状态）
            this.$emit('add-column', columnConfig);
        },

        // 更新列配置
        handleUpdateColumn(columnConfig) {
            // 找到要更新的列
            const columnIndex = this.internalColumns.findIndex(col => col.key === this.editingColumnData.key);

            if (columnIndex !== -1) {
                // 更新列配置 - 完整替换以确保响应式
                const updatedColumn = {
                    key: this.editingColumnData.key, // 保持 key 不变
                    label: columnConfig.label,
                    type: columnConfig.type,
                    width: columnConfig.width || 100
                };

                // 根据类型添加额外配置
                if (columnConfig.type === 'select' || columnConfig.type === 'tags') {
                    updatedColumn.options = columnConfig.options || [];
                }

                if (columnConfig.type === 'computed') {
                    updatedColumn.formula = columnConfig.formula || '';
                }

                // 使用 Vue 3 的响应式更新
                this.internalColumns.splice(columnIndex, 1, updatedColumn);

                // 更新列宽
                this.columnWidths[updatedColumn.key] = updatedColumn.width;

                if (this.enableGroup) {
                    this.createGroupedData();
                }

                // 强制更新视图，确保计算列公式变化立即生效
                this.$forceUpdate();

                // 通知父组件（传递完整的更新后的列配置）
                this.$emit('update-column', updatedColumn);
            }
        },

        // 添加行
        addRow() {
            // 创建一个新的空行对象
            const newRow = {};

            // 为每一列添加空值（计算列除外）
            this.internalColumns.forEach(col => {
                if (col.type !== 'computed') {
                    // tags 类型初始化为空数组
                    newRow[col.key] = col.type === 'tags' ? [] : '';
                }
            });

            // 如果有选中的单元格，在选中行后面插入
            if (this.selectedCell) {
                const row = this.displayData[this.selectedCell.rowIndex];
                const originalIndex = row._originalIndex !== undefined ? row._originalIndex : this.selectedCell.rowIndex;
                this.tableData.splice(originalIndex + 1, 0, newRow);
            } else {
                // 否则添加到末尾
                this.tableData.push(newRow);
            }

            if (this.enableGroup) {
                this.createGroupedData();
            }

            // 通知父组件
            this.$emit('add-row', newRow);
        },

        // 删除选中行
        deleteSelectedRow() {
            if (!this.selectedCell) {
                return;
            }

            const row = this.displayData[this.selectedCell.rowIndex];
            if (row._isGroup) {
                alert('不能删除分组行');
                return;
            }

            if (confirm('确定要删除这一行吗？')) {
                const originalIndex = row._originalIndex !== undefined ? row._originalIndex : this.selectedCell.rowIndex;

                // 删除行
                const deletedRow = this.tableData.splice(originalIndex, 1)[0];

                // 清除选中状态
                this.selectedCell = null;
                this.editingCell = null;

                // 清除该行的所有修改标记
                this.internalColumns.forEach(col => {
                    this.modifiedCells.delete(`${originalIndex}-${col.key}`);
                });

                if (this.enableGroup) {
                    this.createGroupedData();
                }

                // 通知父组件
                this.$emit('delete-row', deletedRow, originalIndex);
            }
        },

        // 切换分组功能
        toggleEnableGroup() {
            this.enableGroup = !this.enableGroup;

            if (this.enableGroup) {
                // 开启分组时，如果还没选择分组列，提示选择
                if (!this.groupBy && this.internalColumns.length > 0) {
                    // 默认选择第一列
                    this.groupBy = this.internalColumns[0].key;
                }
                this.initializeData();
            } else {
                // 关闭分组时，清空分组数据
                this.groupedData = [];
                this.collapsedGroups.clear();
            }
        },

        // 分组列变化
        handleGroupByChange() {
            if (this.enableGroup && this.groupBy) {
                this.initializeData();
            }
        },

        // 保存列宽调整
        saveColumnWidth(columnKey, width) {
            // 更新内部列配置
            const column = this.internalColumns.find(col => col.key === columnKey);
            if (column) {
                column.width = width;
            }

            // 触发事件通知父组件
            this.$emit('column-resize', {
                columnKey,
                width,
                allColumnWidths: { ...this.columnWidths }
            });

            // 可选：保存到本地存储
            this.saveColumnWidthsToStorage();
        },

        // 保存所有列宽到本地存储
        saveColumnWidthsToStorage() {
            try {
                const storageKey = 'excel-table-column-widths';
                localStorage.setItem(storageKey, JSON.stringify(this.columnWidths));
            } catch (error) {
                console.warn('无法保存列宽到本地存储:', error);
            }
        },

        // 从本地存储加载列宽
        loadColumnWidthsFromStorage() {
            try {
                const storageKey = 'excel-table-column-widths';
                const savedWidths = localStorage.getItem(storageKey);
                if (savedWidths) {
                    const widths = JSON.parse(savedWidths);
                    // 合并保存的宽度到当前配置
                    Object.keys(widths).forEach(key => {
                        if (this.columnWidths.hasOwnProperty(key)) {
                            this.columnWidths[key] = widths[key];
                            // 同步更新列配置
                            const column = this.internalColumns.find(col => col.key === key);
                            if (column) {
                                column.width = widths[key];
                            }
                        }
                    });
                }
            } catch (error) {
                console.warn('无法从本地存储加载列宽:', error);
            }
        },

        // 重置列宽到默认值
        resetColumnWidths() {
            // 重置为原始配置的宽度
            this.internalColumns.forEach(col => {
                const originalColumn = this.columns.find(c => c.key === col.key);
                const defaultWidth = originalColumn?.width || 100;
                this.columnWidths[col.key] = defaultWidth;
                col.width = defaultWidth;
            });

            // 清除本地存储
            try {
                const storageKey = 'excel-table-column-widths';
                localStorage.removeItem(storageKey);
            } catch (error) {
                console.warn('无法清除本地存储:', error);
            }

            // 触发强制更新
            this.$forceUpdate();
        },

        // 全选/取消全选
        toggleSelectAll() {
            if (this.isAllRowsSelected) {
                // 取消全选
                this.selectedRows.clear();
            } else {
                // 全选
                this.displayData.forEach((row, index) => {
                    if (!row._isGroup) {
                        const originalIndex = row._originalIndex !== undefined ? row._originalIndex : index;
                        this.selectedRows.add(originalIndex);
                    }
                });
            }
            this.$forceUpdate();
        },

        // 切换单行选中状态
        toggleRowSelection(rowIndex) {
            const row = this.displayData[rowIndex];
            if (row._isGroup) return;

            const originalIndex = row._originalIndex !== undefined ? row._originalIndex : rowIndex;

            if (this.selectedRows.has(originalIndex)) {
                this.selectedRows.delete(originalIndex);
            } else {
                this.selectedRows.add(originalIndex);
            }
            this.$forceUpdate();
        },

        // 判断行是否被选中
        isRowSelected(rowIndex) {
            const row = this.displayData[rowIndex];
            const originalIndex = row._originalIndex !== undefined ? row._originalIndex : rowIndex;
            return this.selectedRows.has(originalIndex);
        },

        // 批量删除选中行
        deleteSelectedRows() {
            if (this.selectedRows.size === 0) {
                alert('请先选择要删除的行');
                return;
            }

            if (confirm(`确定要删除选中的 ${this.selectedRows.size} 行吗？`)) {
                // 将选中的索引转为数组并排序（从大到小，避免删除时索引变化）
                const selectedIndices = Array.from(this.selectedRows).sort((a, b) => b - a);

                selectedIndices.forEach(index => {
                    this.tableData.splice(index, 1);
                });

                // 清空选中状态
                this.selectedRows.clear();
                this.selectedCell = null;
                this.editingCell = null;

                if (this.enableGroup) {
                    this.createGroupedData();
                }

                this.$emit('delete-rows', selectedIndices);
            }
        },

        // 更新表头checkbox的半选状态
        updateHeaderCheckbox() {
            this.$nextTick(() => {
                const headerCheckbox = document.querySelector('.header-checkbox');
                if (headerCheckbox) {
                    headerCheckbox.indeterminate = this.isSomeRowsSelected;
                }
            });
        },

        // 触发文件导入
        triggerImport() {
            const fileInput = this.$refs.fileInput;
            if (fileInput) {
                fileInput.click();
            }
        },

        // 处理文件导入
        handleFileImport(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });

                    // 读取第一个工作表
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];

                    // 将工作表转换为 JSON
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    if (jsonData.length < 2) {
                        alert('Excel 文件中没有足够的数据');
                        return;
                    }

                    // 解析数据
                    this.parseImportedData(jsonData);

                    // 清空文件输入，允许重复导入同一文件
                    event.target.value = '';
                } catch (error) {
                    console.error('导入失败:', error);
                    alert('导入失败: ' + error.message);
                }
            };

            reader.readAsArrayBuffer(file);
        },

        // 解析导入的数据
        parseImportedData(jsonData) {
            // 第一行作为列标题
            const headers = jsonData[0];
            const dataRows = jsonData.slice(1);

            // 自动检测列类型并生成列配置
            const newColumns = headers.map((header, index) => {
                const columnValues = dataRows.map(row => row[index]).filter(v => v !== null && v !== undefined && v !== '');
                const columnType = this.detectColumnType(columnValues);

                const columnKey = this.generateColumnKey(header);

                const columnConfig = {
                    label: header || `列${index + 1}`,
                    key: columnKey,
                    type: columnType,
                    width: 120
                };

                // 如果是下拉框类型，自动生成选项
                if (columnType === 'select' && columnValues.length > 0) {
                    const uniqueValues = [...new Set(columnValues)];
                    if (uniqueValues.length <= 20) { // 只有选项数量合理时才作为下拉框
                        columnConfig.options = uniqueValues.map((value, idx) => ({
                            label: String(value),
                            value: String(value),
                            color: this.getColorForIndex(idx)
                        }));
                    } else {
                        // 选项太多，改为文本类型
                        columnConfig.type = 'text';
                    }
                }

                return columnConfig;
            });

            // 转换数据行
            const newData = dataRows.map(row => {
                const rowData = {};
                headers.forEach((header, index) => {
                    const columnKey = newColumns[index].key;
                    let value = row[index];

                    // 根据列类型转换值
                    if (value !== null && value !== undefined && value !== '') {
                        const columnType = newColumns[index].type;
                        if (columnType === 'date') {
                            value = this.parseExcelDate(value);
                        } else if (columnType === 'number') {
                            value = parseFloat(value) || value;
                        }
                    } else {
                        value = '';
                    }

                    rowData[columnKey] = value;
                });
                return rowData;
            });

            // 询问是否替换现有数据
            const confirmMessage = this.internalColumns.length > 0
                ? `确定要导入数据吗？这将替换当前的 ${this.tableData.length} 行数据和 ${this.internalColumns.length} 列配置。`
                : `确定要导入数据吗？将导入 ${newData.length} 行，${newColumns.length} 列。`;

            if (confirm(confirmMessage)) {
                // 更新列配置
                this.internalColumns = newColumns;
                this.columnOrder = newColumns.map(col => col.key);

                // 初始化列宽
                newColumns.forEach(col => {
                    this.columnWidths[col.key] = col.width || 100;
                });

                // 更新数据
                this.tableData = newData;

                // 清空修改标记和选中状态
                this.modifiedCells.clear();
                this.selectedRows.clear();
                this.selectedCell = null;
                this.editingCell = null;

                if (this.enableGroup) {
                    this.createGroupedData();
                }

                // 通知父组件
                this.$emit('import', {
                    columns: newColumns,
                    data: newData
                });

                alert(`成功导入 ${newData.length} 行数据，${newColumns.length} 列`);
            }
        },

        // 检测列类型
        detectColumnType(values) {
            if (values.length === 0) return 'text';

            let numberCount = 0;
            let dateCount = 0;
            let booleanCount = 0;

            values.forEach(value => {
                // 检查是否为数字
                if (this.isNumber(value)) {
                    numberCount++;
                }
                // 检查是否为日期
                else if (this.isDate(value)) {
                    dateCount++;
                }
                // 检查是否为布尔值
                else if (this.isBoolean(value)) {
                    booleanCount++;
                }
            });

            const threshold = values.length * 0.8; // 80% 的值符合某种类型

            if (numberCount >= threshold) {
                return 'number';
            }
            if (dateCount >= threshold) {
                return 'date';
            }

            // 检查是否适合作为下拉框（选项数量少且有重复）
            const uniqueValues = new Set(values);
            if (uniqueValues.size <= 10 && uniqueValues.size < values.length * 0.5) {
                return 'select';
            }

            return 'text';
        },

        // 判断是否为数字
        isNumber(value) {
            if (typeof value === 'number') return true;
            if (typeof value === 'string') {
                // 移除千分位逗号
                const cleaned = value.replace(/,/g, '');
                return !isNaN(parseFloat(cleaned)) && isFinite(cleaned);
            }
            return false;
        },

        // 判断是否为日期
        isDate(value) {
            if (value instanceof Date) return true;
            if (typeof value === 'number') {
                // Excel 日期数字格式
                if (value > 25569 && value < 60000) { // 大致的日期数字范围
                    return true;
                }
            }
            if (typeof value === 'string') {
                // 常见日期格式
                const datePatterns = [
                    /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/,  // 2025-01-01 或 2025/01/01
                    /^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/,  // 01-01-2025 或 01/01/2025
                    /^\d{4}年\d{1,2}月\d{1,2}日$/      // 2025年1月1日
                ];

                if (datePatterns.some(pattern => pattern.test(value))) {
                    const date = new Date(value);
                    return !isNaN(date.getTime());
                }
            }
            return false;
        },

        // 判断是否为布尔值
        isBoolean(value) {
            if (typeof value === 'boolean') return true;
            if (typeof value === 'string') {
                const lower = value.toLowerCase();
                return ['true', 'false', 'yes', 'no', '是', '否'].includes(lower);
            }
            return false;
        },

        // 解析 Excel 日期
        parseExcelDate(value) {
            if (typeof value === 'number') {
                // Excel 日期数字转换
                const date = XLSX.SSF.parse_date_code(value);
                if (date) {
                    const year = date.y;
                    const month = String(date.m).padStart(2, '0');
                    const day = String(date.d).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                }
            }
            if (typeof value === 'string') {
                try {
                    const date = new Date(value);
                    if (!isNaN(date.getTime())) {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                    }
                } catch (e) {
                    // 忽略错误
                }
            }
            return value;
        },

        // 生成列的 key
        generateColumnKey(header) {
            if (!header) return `col_${Date.now()}`;

            // 转换为拼音或移除特殊字符
            let key = String(header)
                .replace(/\s+/g, '_')
                .replace(/[^\w\u4e00-\u9fa5]/g, '')
                .toLowerCase();

            // 如果是纯中文，使用原始值
            if (/^[\u4e00-\u9fa5]+$/.test(header)) {
                key = header;
            }

            // 确保唯一性
            let finalKey = key;
            let counter = 1;
            while (this.internalColumns.some(col => col.key === finalKey)) {
                finalKey = `${key}_${counter}`;
                counter++;
            }

            return finalKey || `col_${Date.now()}`;
        },

        // 获取索引对应的颜色
        getColorForIndex(index) {
            const colors = [
                '#e3f2fd', '#f3e5f5', '#e8f5e9', '#fff3e0',
                '#fce4ec', '#e0f2f1', '#f1f8e9', '#ede7f6',
                '#e8eaf6', '#e1f5fe', '#f9fbe7', '#fff8e1'
            ];
            return colors[index % colors.length];
        },

        // 切换编辑模式
        toggleEditMode() {
            this.enableEdit = !this.enableEdit;

            // 如果关闭编辑模式，退出当前编辑状态
            if (!this.enableEdit && this.editingCell) {
                this.editingCell = null;
            }
        },

        // 打开条件格式弹窗
        openConditionalFormatDialog() {
            this.showConditionalFormatDialog = true;
        },

        // 关闭条件格式弹窗
        closeConditionalFormatDialog() {
            this.showConditionalFormatDialog = false;
        },

        // 应用条件格式
        applyConditionalFormats(rules) {
            this.conditionalFormats = rules;
            this.$forceUpdate();
        },

        // 检查值是否满足条件
        checkCondition(value, operator, conditionValue, columnType = 'text') {
            const strValue = String(value || '');
            const strCondition = String(conditionValue || '');

            // 空值判断
            if (operator === 'isEmpty') {
                return strValue === '';
            }
            if (operator === 'isNotEmpty') {
                return strValue !== '';
            }

            // 字符串操作
            if (operator === 'contains') {
                return strValue.includes(strCondition);
            }
            if (operator === 'notContains') {
                return !strValue.includes(strCondition);
            }

            // 等于/不等于 - 字符串比较
            if (operator === 'equals') {
                return strValue === strCondition;
            }
            if (operator === 'notEquals') {
                return strValue !== strCondition;
            }

            // 数值/日期比较 - 需要特殊处理
            let compareValue1, compareValue2;

            // 判断是否为日期类型
            if (columnType === 'date' || this.isDateValue(value) || this.isDateValue(conditionValue)) {
                // 日期比较：转换为时间戳
                compareValue1 = this.parseToTimestamp(value);
                compareValue2 = this.parseToTimestamp(conditionValue);

                // 如果任一值无法解析为有效日期，返回 false
                if (compareValue1 === null || compareValue2 === null) {
                    return false;
                }
            } else {
                // 数值比较
                compareValue1 = parseFloat(value);
                compareValue2 = parseFloat(conditionValue);

                // 如果任一值不是有效数字，返回 false
                if (isNaN(compareValue1) || isNaN(compareValue2)) {
                    return false;
                }
            }

            switch (operator) {
                case 'greaterThan':
                    return compareValue1 > compareValue2;
                case 'lessThan':
                    return compareValue1 < compareValue2;
                case 'greaterOrEqual':
                    return compareValue1 >= compareValue2;
                case 'lessOrEqual':
                    return compareValue1 <= compareValue2;
                default:
                    return false;
            }
        },

        // 判断值是否为日期格式
        isDateValue(value) {
            if (!value) return false;
            const strValue = String(value);

            // 检查常见日期格式
            const datePatterns = [
                /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/,  // 2025-01-01 或 2025/01/01
                /^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/,  // 01-01-2025 或 01/01/2025
                /^\d{4}年\d{1,2}月\d{1,2}日$/      // 2025年1月1日
            ];

            return datePatterns.some(pattern => pattern.test(strValue));
        },

        // 将值转换为时间戳（用于日期比较）
        parseToTimestamp(value) {
            if (!value) return null;

            try {
                const date = new Date(value);
                if (isNaN(date.getTime())) {
                    return null;
                }
                // 只比较日期部分，忽略时间
                date.setHours(0, 0, 0, 0);
                return date.getTime();
            } catch (e) {
                return null;
            }
        },

        // 获取单元格的条件格式样式
        getCellConditionalStyle(rowIndex, colKey) {
            if (this.conditionalFormats.length === 0) {
                return {};
            }

            const rowData = this.getRowData(rowIndex);

            // 遍历所有条件格式规则
            for (const rule of this.conditionalFormats) {
                // 检查是否应用到当前列
                if (rule.columnKey !== colKey) {
                    continue;
                }

                const cellValue = rowData[rule.columnKey];

                // 获取列类型
                const column = this.internalColumns.find(col => col.key === rule.columnKey);
                const columnType = column ? column.type : 'text';

                // 检查是否满足条件
                if (this.checkCondition(cellValue, rule.operator, rule.value, columnType)) {
                    return {
                        backgroundColor: rule.backgroundColor,
                        color: rule.textColor
                    };
                }
            }

            return {};
        },

        // 获取整行的条件格式样式
        getRowConditionalStyle(rowIndex) {
            if (this.conditionalFormats.length === 0) {
                return {};
            }

            const rowData = this.getRowData(rowIndex);

            // 遍历所有条件格式规则（整行）
            for (const rule of this.conditionalFormats) {
                if (rule.applyTo !== 'row') {
                    continue;
                }

                const cellValue = rowData[rule.columnKey];

                // 获取列类型
                const column = this.internalColumns.find(col => col.key === rule.columnKey);
                const columnType = column ? column.type : 'text';

                // 检查是否满足条件
                if (this.checkCondition(cellValue, rule.operator, rule.value, columnType)) {
                    return {
                        backgroundColor: rule.backgroundColor,
                        color: rule.textColor
                    };
                }
            }

            return {};
        },

        // 获取单元格的最终样式（合并条件格式）
        getCellStyle(rowIndex, colKey) {
            const rowData = this.displayData[rowIndex];
            if (rowData._isGroup) {
                return {};
            }

            // 先获取整行样式
            const rowStyle = this.getRowConditionalStyle(rowIndex);

            // 再获取单元格样式（单元格样式优先级更高）
            const cellStyle = this.getCellConditionalStyle(rowIndex, colKey);

            // 合并样式
            return {
                ...rowStyle,
                ...cellStyle
            };
        }
    }
}

