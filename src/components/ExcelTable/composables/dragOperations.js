/**
 * 拖拽操作模块
 * 处理列拖动和行拖动功能
 */
export function useDragOperations() {
    return {
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
        }
    }
}
