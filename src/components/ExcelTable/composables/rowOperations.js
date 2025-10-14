/**
 * 行操作模块
 * 处理行的添加、删除、选择等功能
 */
export function useRowOperations() {
    return {
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
        }
    }
}
