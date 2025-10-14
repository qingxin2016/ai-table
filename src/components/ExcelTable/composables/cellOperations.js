/**
 * 单元格操作模块
 * 处理单元格的点击、编辑、更新等操作
 */
export function useCellOperations() {
    return {
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
        }
    }
}

