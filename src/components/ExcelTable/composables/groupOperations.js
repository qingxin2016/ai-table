/**
 * 分组操作模块
 * 处理数据分组和分组展开/折叠功能
 */
export function useGroupOperations() {
    return {
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
        }
    }
}
