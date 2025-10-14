/**
 * 监听器模块
 * 定义数据监听和响应逻辑
 */
export function useWatchers() {
    return {
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
                // 保持现有的列顺序,只添加新列或移除已删除的列
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
    }
}

