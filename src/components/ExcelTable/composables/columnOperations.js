/**
 * 列操作模块
 * 处理列的添加、编辑、宽度调整等功能
 */
export function useColumnOperations() {
    return {
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

        // 切换锁定首列
        toggleLockFirstColumn() {
            this.lockFirstColumn = !this.lockFirstColumn;
        },

        // 判断列是否锁定
        isColumnLocked(colIndex) {
            return this.lockFirstColumn && colIndex === 0;
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
        }
    }
}
