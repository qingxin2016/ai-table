/**
 * 条件格式模块
 * 处理条件格式的设置和应用
 */
export function useConditionalFormat() {
    return {
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
