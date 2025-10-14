/**
 * 鼠标操作模块
 * 处理鼠标事件和交互
 */
export function useMouseOperations() {
    return {
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
        }
    }
}
