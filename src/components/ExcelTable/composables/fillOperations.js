/**
 * 填充操作模块
 * 处理单元格拖动填充功能
 */
export function useFillOperations() {
    return {
        // 创建填充提示工具
        createFillTooltip() {
            this.fillTooltip = document.createElement('div');
            this.fillTooltip.className = 'fill-tooltip';
            this.fillTooltip.style.display = 'none';
            document.body.appendChild(this.fillTooltip);
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
        }
    }
}
