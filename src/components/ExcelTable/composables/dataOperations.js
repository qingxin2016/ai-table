/**
 * 数据操作模块
 * 处理数据的保存、撤销、导入导出等功能
 */
import * as XLSX from 'xlsx';

export function useDataOperations() {
    return {
        // 保存修改
        saveChanges() {
            this.modifiedCells.clear();
            this.$emit('save', this.tableData);
        },

        // 撤销修改
        undoChanges() {
            this.tableData = JSON.parse(JSON.stringify(this.data));
            this.modifiedCells.clear();
            if (this.enableGroup) {
                this.createGroupedData();
            }
        },

        // 导出数据
        exportData() {
            this.$emit('export', this.tableData);
        },

        // 触发文件导入
        triggerImport() {
            const fileInput = this.$refs.fileInput;
            if (fileInput) {
                fileInput.click();
            }
        },

        // 处理文件导入
        handleFileImport(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });

                    // 读取第一个工作表
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];

                    // 将工作表转换为 JSON
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    if (jsonData.length < 2) {
                        alert('Excel 文件中没有足够的数据');
                        return;
                    }

                    // 解析数据
                    this.parseImportedData(jsonData);

                    // 清空文件输入，允许重复导入同一文件
                    event.target.value = '';
                } catch (error) {
                    console.error('导入失败:', error);
                    alert('导入失败: ' + error.message);
                }
            };

            reader.readAsArrayBuffer(file);
        },

        // 解析导入的数据
        parseImportedData(jsonData) {
            // 第一行作为列标题
            const headers = jsonData[0];
            const dataRows = jsonData.slice(1);

            // 自动检测列类型并生成列配置
            const newColumns = headers.map((header, index) => {
                const columnValues = dataRows.map(row => row[index]).filter(v => v !== null && v !== undefined && v !== '');
                const columnType = this.detectColumnType(columnValues);

                const columnKey = this.generateColumnKey(header);

                const columnConfig = {
                    label: header || `列${index + 1}`,
                    key: columnKey,
                    type: columnType,
                    width: 120
                };

                // 如果是下拉框类型，自动生成选项
                if (columnType === 'select' && columnValues.length > 0) {
                    const uniqueValues = [...new Set(columnValues)];
                    if (uniqueValues.length <= 20) { // 只有选项数量合理时才作为下拉框
                        columnConfig.options = uniqueValues.map((value, idx) => ({
                            label: String(value),
                            value: String(value),
                            color: this.getColorForIndex(idx)
                        }));
                    } else {
                        // 选项太多，改为文本类型
                        columnConfig.type = 'text';
                    }
                }

                return columnConfig;
            });

            // 转换数据行
            const newData = dataRows.map(row => {
                const rowData = {};
                headers.forEach((header, index) => {
                    const columnKey = newColumns[index].key;
                    let value = row[index];

                    // 根据列类型转换值
                    if (value !== null && value !== undefined && value !== '') {
                        const columnType = newColumns[index].type;
                        if (columnType === 'date') {
                            value = this.parseExcelDate(value);
                        } else if (columnType === 'number') {
                            value = parseFloat(value) || value;
                        }
                    } else {
                        value = '';
                    }

                    rowData[columnKey] = value;
                });
                return rowData;
            });

            // 询问是否替换现有数据
            const confirmMessage = this.internalColumns.length > 0
                ? `确定要导入数据吗？这将替换当前的 ${this.tableData.length} 行数据和 ${this.internalColumns.length} 列配置。`
                : `确定要导入数据吗？将导入 ${newData.length} 行，${newColumns.length} 列。`;

            if (confirm(confirmMessage)) {
                // 更新列配置
                this.internalColumns = newColumns;
                this.columnOrder = newColumns.map(col => col.key);

                // 初始化列宽
                newColumns.forEach(col => {
                    this.columnWidths[col.key] = col.width || 100;
                });

                // 更新数据
                this.tableData = newData;

                // 清空修改标记和选中状态
                this.modifiedCells.clear();
                this.selectedRows.clear();
                this.selectedCell = null;
                this.editingCell = null;

                if (this.enableGroup) {
                    this.createGroupedData();
                }

                // 通知父组件
                this.$emit('import', {
                    columns: newColumns,
                    data: newData
                });

                alert(`成功导入 ${newData.length} 行数据，${newColumns.length} 列`);
            }
        },

        // 检测列类型
        detectColumnType(values) {
            if (values.length === 0) return 'text';

            let numberCount = 0;
            let dateCount = 0;
            let booleanCount = 0;

            values.forEach(value => {
                // 检查是否为数字
                if (this.isNumber(value)) {
                    numberCount++;
                }
                // 检查是否为日期
                else if (this.isDate(value)) {
                    dateCount++;
                }
                // 检查是否为布尔值
                else if (this.isBoolean(value)) {
                    booleanCount++;
                }
            });

            const threshold = values.length * 0.8; // 80% 的值符合某种类型

            if (numberCount >= threshold) {
                return 'number';
            }
            if (dateCount >= threshold) {
                return 'date';
            }

            // 检查是否适合作为下拉框（选项数量少且有重复）
            const uniqueValues = new Set(values);
            if (uniqueValues.size <= 10 && uniqueValues.size < values.length * 0.5) {
                return 'select';
            }

            return 'text';
        },

        // 判断是否为数字
        isNumber(value) {
            if (typeof value === 'number') return true;
            if (typeof value === 'string') {
                // 移除千分位逗号
                const cleaned = value.replace(/,/g, '');
                return !isNaN(parseFloat(cleaned)) && isFinite(cleaned);
            }
            return false;
        },

        // 判断是否为日期
        isDate(value) {
            if (value instanceof Date) return true;
            if (typeof value === 'number') {
                // Excel 日期数字格式
                if (value > 25569 && value < 60000) { // 大致的日期数字范围
                    return true;
                }
            }
            if (typeof value === 'string') {
                // 常见日期格式
                const datePatterns = [
                    /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/,  // 2025-01-01 或 2025/01/01
                    /^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/,  // 01-01-2025 或 01/01/2025
                    /^\d{4}年\d{1,2}月\d{1,2}日$/      // 2025年1月1日
                ];

                if (datePatterns.some(pattern => pattern.test(value))) {
                    const date = new Date(value);
                    return !isNaN(date.getTime());
                }
            }
            return false;
        },

        // 判断是否为布尔值
        isBoolean(value) {
            if (typeof value === 'boolean') return true;
            if (typeof value === 'string') {
                const lower = value.toLowerCase();
                return ['true', 'false', 'yes', 'no', '是', '否'].includes(lower);
            }
            return false;
        },

        // 解析 Excel 日期
        parseExcelDate(value) {
            if (typeof value === 'number') {
                // Excel 日期数字转换
                const date = XLSX.SSF.parse_date_code(value);
                if (date) {
                    const year = date.y;
                    const month = String(date.m).padStart(2, '0');
                    const day = String(date.d).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                }
            }
            if (typeof value === 'string') {
                try {
                    const date = new Date(value);
                    if (!isNaN(date.getTime())) {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                    }
                } catch (e) {
                    // 忽略错误
                }
            }
            return value;
        },

        // 生成列的 key
        generateColumnKey(header) {
            if (!header) return `col_${Date.now()}`;

            // 转换为拼音或移除特殊字符
            let key = String(header)
                .replace(/\s+/g, '_')
                .replace(/[^\w\u4e00-\u9fa5]/g, '')
                .toLowerCase();

            // 如果是纯中文，使用原始值
            if (/^[\u4e00-\u9fa5]+$/.test(header)) {
                key = header;
            }

            // 确保唯一性
            let finalKey = key;
            let counter = 1;
            while (this.internalColumns.some(col => col.key === finalKey)) {
                finalKey = `${key}_${counter}`;
                counter++;
            }

            return finalKey || `col_${Date.now()}`;
        },

        // 获取索引对应的颜色
        getColorForIndex(index) {
            const colors = [
                '#e3f2fd', '#f3e5f5', '#e8f5e9', '#fff3e0',
                '#fce4ec', '#e0f2f1', '#f1f8e9', '#ede7f6',
                '#e8eaf6', '#e1f5fe', '#f9fbe7', '#fff8e1'
            ];
            return colors[index % colors.length];
        },

        // 切换编辑模式
        toggleEditMode() {
            this.enableEdit = !this.enableEdit;

            // 如果关闭编辑模式，退出当前编辑状态
            if (!this.enableEdit && this.editingCell) {
                this.editingCell = null;
            }
        }
    }
}
