/**
 * 计算属性模块
 * 定义所有计算属性
 */
export function useComputed() {
    return {
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
    }
}

