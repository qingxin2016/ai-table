<template>
  <div v-if="visible" class="dialog-overlay">
    <div class="dialog-container">
      <div class="dialog-header">
        <h3>{{ editingColumn ? '编辑列配置' : '添加列' }}</h3>
        <button class="close-btn" @click="handleClose">×</button>
      </div>
      
      <div class="dialog-body">
        <div class="form-group">
          <label>列名称</label>
          <input 
            v-model="formData.label" 
            type="text" 
            placeholder="请输入列名称"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label>列标识（英文）</label>
          <input 
            v-model="formData.key" 
            type="text" 
            placeholder="例如: name, age"
            class="form-input"
            :disabled="editingColumn !== null"
            :title="editingColumn ? '编辑模式下不能修改列标识' : ''"
          />
          <small v-if="editingColumn" style="color: #999; font-size: 12px; margin-top: 4px; display: block;">
            编辑模式下不能修改列标识
          </small>
        </div>

        <div class="form-group">
          <label>列类型</label>
          <select v-model="formData.type" class="form-select">
            <option value="text">文本</option>
            <option value="number">数字</option>
            <option value="date">日期</option>
            <option value="select">下拉框（单选）</option>
            <option value="tags">多选标签</option>
            <option value="computed">计算列</option>
          </select>
        </div>

        <div class="form-group">
          <label>列宽</label>
          <input 
            v-model.number="formData.width" 
            type="number" 
            placeholder="默认100"
            class="form-input"
            min="50"
          />
        </div>

        <!-- 下拉框/多选标签特有配置 -->
        <div v-if="formData.type === 'select' || formData.type === 'tags'" class="form-group">
          <label>{{ formData.type === 'tags' ? '标签选项配置' : '下拉选项配置' }}</label>
          <div class="select-options">
            <div 
              v-for="(option, index) in formData.options" 
              :key="index"
              class="option-item"
            >
              <input 
                v-model="option.label" 
                type="text" 
                placeholder="选项名称"
                class="option-input"
              />
              <input 
                v-model="option.value" 
                type="text" 
                placeholder="选项值"
                class="option-input"
              />
              <input 
                v-model="option.color" 
                type="color" 
                class="color-input"
                title="背景颜色"
              />
              <button 
                class="remove-btn"
                @click="removeOption(index)"
                v-if="formData.options.length > 1"
              >
                ×
              </button>
            </div>
            <button class="add-option-btn" @click="addOption">
              + 添加选项
            </button>
          </div>
        </div>

        <!-- 计算列特有配置 -->
        <div v-if="formData.type === 'computed'" class="form-group">
          <label>公式配置</label>
          <div class="formula-editor">
            <!-- 列选择器 -->
            <div class="formula-toolbar">
              <label class="toolbar-label">插入列：</label>
              <select v-model="selectedColumn" class="toolbar-select" @change="insertColumn">
                <option value="">选择列...</option>
                <option 
                  v-for="col in availableColumns" 
                  :key="col.key"
                  :value="col.key"
                >
                  {{ col.label }} ({{'{'}}{{ col.key }}{{'}'}}）
                </option>
              </select>
            </div>

            <!-- 数学函数选择器 -->
            <div class="formula-toolbar">
              <label class="toolbar-label">数学函数：</label>
              <div class="function-buttons">
                <button 
                  v-for="func in mathFunctions.filter(f => f.category === 'math')" 
                  :key="func.name"
                  type="button"
                  class="function-btn math-func"
                  @click="insertFunction(func.template)"
                  :title="func.description"
                >
                  {{ func.name }}
                </button>
              </div>
            </div>

            <!-- 字符串函数选择器 -->
            <div class="formula-toolbar">
              <label class="toolbar-label">字符串函数：</label>
              <div class="function-buttons">
                <button 
                  v-for="func in mathFunctions.filter(f => f.category === 'string')" 
                  :key="func.name"
                  type="button"
                  class="function-btn string-func"
                  @click="insertFunction(func.template)"
                  :title="func.description"
                >
                  {{ func.name }}
                </button>
              </div>
            </div>

            <!-- 运算符 -->
            <div class="formula-toolbar">
              <label class="toolbar-label">运算符：</label>
              <div class="operator-buttons">
                <button 
                  v-for="op in operators" 
                  :key="op"
                  type="button"
                  class="operator-btn"
                  @click="insertOperator(op)"
                >
                  {{ op }}
                </button>
              </div>
            </div>

            <!-- 公式输入框 -->
            <div class="formula-input-group">
              <label>公式表达式：</label>
              <textarea 
                ref="formulaInput"
                v-model="formData.formula" 
                class="formula-textarea"
                placeholder="例如: {salary} * 1.2 或 ({salary} + {bonus}) * 0.8"
                @input="validateFormula"
                rows="3"
              ></textarea>
            </div>

            <!-- 公式预览和验证 -->
            <div class="formula-preview">
              <div class="preview-label">
                <span>公式预览：</span>
                <span 
                  class="validation-status"
                  :class="{ 'valid': formulaValid, 'invalid': !formulaValid && formData.formula }"
                >
                  {{ formulaValidationMessage }}
                </span>
              </div>
              <div class="preview-content" :class="{ 'error': !formulaValid && formData.formula }">
                {{ formulaPreview }}
              </div>
            </div>

            <!-- 使用说明 -->
            <div class="formula-help">
              <div class="help-title">📝 使用说明：</div>
              <ul>
                <li>使用 <code>{{'{'}}列标识{{'}'}}</code> 引用其他列的值</li>
                <li>支持基本运算符：+ - * / ( )</li>
                <li>支持数学函数：SUM、AVG、MAX、MIN、ABS、ROUND、FLOOR、CEIL、SQRT、POW</li>
                <li>支持字符串函数：CONCAT、UPPER、LOWER、TRIM、SUBSTRING、LENGTH</li>
                <li>✨ 支持字符串和数学函数混合使用</li>
              </ul>
              <div class="help-examples">
                <div class="help-subtitle">示例：</div>
                <div class="example-item">
                  <strong>数学计算：</strong>
                  <code>({{'{'}}salary{{'}'}} + {{'{'}}bonus{{'}'}}) * 0.8</code>
                </div>
                <div class="example-item">
                  <strong>字符串拼接：</strong>
                  <code>CONCAT({{'{'}}name{{'}'}}, "-", {{'{'}}department{{'}'}}, "部")</code>
                </div>
                <div class="example-item">
                  <strong>混合使用：</strong>
                  <code>CONCAT({{'{'}}name{{'}'}}, " (", {{'{'}}salary{{'}'}} * 12, "元/年)")</code>
                </div>
                <div class="example-item">
                  <strong>字符串长度计算：</strong>
                  <code>LENGTH({{'{'}}name{{'}'}}) + LENGTH({{'{'}}department{{'}'}}) + 10</code>
                </div>
                <div class="example-item">
                  <strong>复杂混合：</strong>
                  <code>CONCAT(UPPER({{'{'}}name{{'}'}}}), " - 年薪:", ROUND({{'{'}}salary{{'}'}} * 12 / 10000, 2), "万")</code>
                </div>
                <div class="example-item">
                  <strong>嵌套函数：</strong>
                  <code>CONCAT({{'{'}}department{{'}'}}, " - ", SUM({{'{'}}salary{{'}'}} + {{'{'}}bonus{{'}'}}))</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <button class="btn btn-cancel" @click="handleClose">取消</button>
        <button class="btn btn-primary" @click="handleConfirm">确定</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AddColumnDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    columns: {
      type: Array,
      default: () => []
    },
    editingColumn: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      formData: {
        label: '',
        key: '',
        type: 'text',
        width: 100,
        options: [
          { label: '选项1', value: 'option1', color: '#e3f2fd' }
        ],
        formula: ''
      },
      selectedColumn: '',
      formulaValid: true,
      formulaValidationMessage: '',
      mathFunctions: [
        { name: 'SUM', template: 'SUM()', description: '求和', category: 'math' },
        { name: 'AVG', template: 'AVG()', description: '平均值', category: 'math' },
        { name: 'MAX', template: 'MAX()', description: '最大值', category: 'math' },
        { name: 'MIN', template: 'MIN()', description: '最小值', category: 'math' },
        { name: 'ABS', template: 'ABS()', description: '绝对值', category: 'math' },
        { name: 'ROUND', template: 'ROUND()', description: '四舍五入', category: 'math' },
        { name: 'FLOOR', template: 'FLOOR()', description: '向下取整', category: 'math' },
        { name: 'CEIL', template: 'CEIL()', description: '向上取整', category: 'math' },
        { name: 'SQRT', template: 'SQRT()', description: '平方根', category: 'math' },
        { name: 'POW', template: 'POW(,2)', description: '幂运算', category: 'math' },
        { name: 'CONCAT', template: 'CONCAT()', description: '字符串拼接', category: 'string' },
        { name: 'UPPER', template: 'UPPER()', description: '转大写', category: 'string' },
        { name: 'LOWER', template: 'LOWER()', description: '转小写', category: 'string' },
        { name: 'TRIM', template: 'TRIM()', description: '去除首尾空格', category: 'string' },
        { name: 'SUBSTRING', template: 'SUBSTRING(,0,5)', description: '截取子串', category: 'string' },
        { name: 'LENGTH', template: 'LENGTH()', description: '字符串长度', category: 'string' }
      ],
      operators: ['+', '-', '*', '/', '(', ')']
    }
  },
  computed: {
    availableColumns() {
      // 返回可用于计算的列（排除计算列本身）
      return this.columns.filter(col => col.type !== 'computed');
    },
    formulaPreview() {
      if (!this.formData.formula) {
        return '请输入公式...';
      }
      
      // 将列引用替换为列名，便于预览
      let preview = this.formData.formula;
      const columnRefs = preview.match(/\{([^}]+)\}/g);
      
      if (columnRefs) {
        columnRefs.forEach(ref => {
          const columnKey = ref.slice(1, -1);
          const column = this.columns.find(col => col.key === columnKey);
          if (column) {
            preview = preview.replace(ref, `[${column.label}]`);
          }
        });
      }
      
      return preview;
    }
  },
  methods: {
    handleClose() {
      this.$emit('close');
      this.resetForm();
    },
    
    handleConfirm() {
      // 验证
      if (!this.formData.label.trim()) {
        alert('请输入列名称');
        return;
      }
      if (!this.formData.key.trim()) {
        alert('请输入列标识');
        return;
      }

      // 验证下拉框/多选标签选项
      if (this.formData.type === 'select' || this.formData.type === 'tags') {
        const hasEmpty = this.formData.options.some(opt => !opt.label.trim() || !opt.value.trim());
        if (hasEmpty) {
          alert(this.formData.type === 'tags' ? '请完善标签选项配置' : '请完善下拉选项配置');
          return;
        }
      }

      // 验证计算列公式
      if (this.formData.type === 'computed') {
        if (!this.formData.formula.trim()) {
          alert('请输入计算公式');
          return;
        }
        if (!this.formulaValid) {
          alert('公式格式错误，请检查后重试');
          return;
        }
      }

      const columnConfig = {
        label: this.formData.label,
        key: this.formData.key,
        type: this.formData.type,
        width: this.formData.width || 100,
      };

      // 根据列类型添加特定配置
      if (this.formData.type === 'select' || this.formData.type === 'tags') {
        columnConfig.options = [...this.formData.options];
      } else {
        // 如果不是 select/tags 类型，删除 options（避免残留旧数据）
        columnConfig.options = undefined;
      }

      if (this.formData.type === 'computed') {
        columnConfig.formula = this.formData.formula;
      } else {
        // 如果不是 computed 类型，删除 formula（避免残留旧数据）
        columnConfig.formula = undefined;
      }

      // 确保编辑模式下 key 始终存在
      if (this.editingColumn && !columnConfig.key) {
        columnConfig.key = this.editingColumn.key;
      }

      // 区分新增和编辑
      if (this.editingColumn) {
        this.$emit('update', columnConfig);
      } else {
        this.$emit('confirm', columnConfig);
      }
      this.handleClose();
    },
    
    resetForm() {
      this.formData = {
        label: '',
        key: '',
        type: 'text',
        width: 100,
        options: [
          { label: '选项1', value: 'option1', color: '#e3f2fd' }
        ],
        formula: ''
      };
      this.selectedColumn = '';
      this.formulaValid = true;
      this.formulaValidationMessage = '';
    },

    addOption() {
      this.formData.options.push({
        label: `选项${this.formData.options.length + 1}`,
        value: `option${this.formData.options.length + 1}`,
        color: '#e3f2fd'
      });
    },

    removeOption(index) {
      this.formData.options.splice(index, 1);
    },

    // 计算列相关方法
    insertColumn() {
      if (this.selectedColumn) {
        this.insertTextAtCursor(`{${this.selectedColumn}}`);
        this.selectedColumn = '';
      }
    },

    insertFunction(template) {
      this.insertTextAtCursor(template);
      // 将光标移动到括号内
      this.$nextTick(() => {
        const textarea = this.$refs.formulaInput;
        if (textarea) {
          const pos = textarea.selectionStart - 1;
          textarea.setSelectionRange(pos, pos);
          textarea.focus();
        }
      });
    },

    insertOperator(operator) {
      this.insertTextAtCursor(operator);
    },

    insertTextAtCursor(text) {
      const textarea = this.$refs.formulaInput;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = this.formData.formula;

      this.formData.formula = value.substring(0, start) + text + value.substring(end);

      this.$nextTick(() => {
        const newPos = start + text.length;
        textarea.setSelectionRange(newPos, newPos);
        textarea.focus();
      });

      this.validateFormula();
    },

    validateFormula() {
      const formula = this.formData.formula.trim();
      
      if (!formula) {
        this.formulaValid = true;
        this.formulaValidationMessage = '';
        return;
      }

      try {
        // 检查括号是否匹配
        let openCount = 0;
        for (let char of formula) {
          if (char === '(') openCount++;
          if (char === ')') openCount--;
          if (openCount < 0) {
            throw new Error('括号不匹配');
          }
        }
        if (openCount !== 0) {
          throw new Error('括号不匹配');
        }

        // 检查列引用是否有效
        const columnRefs = formula.match(/\{([^}]+)\}/g);
        if (columnRefs) {
          for (let ref of columnRefs) {
            const columnKey = ref.slice(1, -1);
            const column = this.columns.find(col => col.key === columnKey);
            if (!column) {
              throw new Error(`列 {${columnKey}} 不存在`);
            }
            if (column.type === 'computed') {
              throw new Error(`不能引用计算列 {${columnKey}}`);
            }
          }
        }

        // 检查是否包含字符串函数
        const hasStringFunc = /CONCAT|UPPER|LOWER|TRIM|SUBSTRING|LENGTH/.test(formula);

        if (hasStringFunc) {
          // 字符串函数的简单验证
          // 检查函数语法是否正确（支持嵌套括号）
          const stringFuncs = ['CONCAT', 'UPPER', 'LOWER', 'TRIM', 'SUBSTRING', 'LENGTH'];
          for (let func of stringFuncs) {
            const regex = new RegExp(`${func}\\s*\\(`, 'g');
            if (regex.test(formula)) {
              // 查找函数开始位置
              const startIndex = formula.indexOf(`${func}(`);
              if (startIndex !== -1) {
                // 从函数开始位置找到匹配的右括号
                let bracketCount = 0;
                let foundClosing = false;
                for (let i = startIndex + func.length; i < formula.length; i++) {
                  if (formula[i] === '(') bracketCount++;
                  else if (formula[i] === ')') {
                    bracketCount--;
                    if (bracketCount === 0) {
                      foundClosing = true;
                      break;
                    }
                  }
                }
                if (!foundClosing) {
                  throw new Error(`${func} 函数括号不匹配`);
                }
              }
            }
          }
          
          this.formulaValid = true;
          this.formulaValidationMessage = '✓ 公式有效（支持嵌套函数）';
        } else {
          // 数学表达式验证
          // 检查是否有列引用或纯数字表达式
          if (!columnRefs && !/\d/.test(formula)) {
            throw new Error('公式中需要包含列引用或数字');
          }

          // 尝试构建一个测试表达式
          let testExpression = formula;
          if (columnRefs) {
            columnRefs.forEach(ref => {
              testExpression = testExpression.replace(new RegExp(ref.replace(/[{}]/g, '\\$&'), 'g'), '1');
            });
          }

          // 替换数学函数（支持嵌套括号）
          testExpression = this.replaceFuncInValidation(testExpression, 'SUM', args => `(${args.replace(/,/g, '+')})`);
          testExpression = this.replaceFuncInValidation(testExpression, 'AVG', args => {
            const count = (args.match(/,/g) || []).length + 1;
            return `((${args.replace(/,/g, '+')}) / ${count})`;
          });
          testExpression = testExpression.replace(/MAX/g, 'Math.max');
          testExpression = testExpression.replace(/MIN/g, 'Math.min');
          testExpression = testExpression.replace(/ABS/g, 'Math.abs');
          testExpression = testExpression.replace(/ROUND/g, 'Math.round');
          testExpression = testExpression.replace(/FLOOR/g, 'Math.floor');
          testExpression = testExpression.replace(/CEIL/g, 'Math.ceil');
          testExpression = testExpression.replace(/SQRT/g, 'Math.sqrt');
          testExpression = testExpression.replace(/POW/g, 'Math.pow');

          // 尝试执行表达式
          new Function('Math', `"use strict"; return (${testExpression})`)(Math);

          this.formulaValid = true;
          this.formulaValidationMessage = '✓ 公式有效';
        }
      } catch (error) {
        this.formulaValid = false;
        this.formulaValidationMessage = '✗ ' + error.message;
      }
    },

    // 验证时替换函数（支持嵌套括号，考虑引号）
    replaceFuncInValidation(expression, funcName, replacer) {
      let result = expression;
      let changed = true;
      
      while (changed) {
        changed = false;
        const regex = new RegExp(`${funcName}\\s*\\(`, 'g');
        let match;
        
        while ((match = regex.exec(result)) !== null) {
          const startIdx = match.index;
          const argsStartIdx = startIdx + match[0].length;
          
          // 找到匹配的右括号（考虑引号内的括号）
          let bracketCount = 1;
          let endIdx = argsStartIdx;
          let inQuote = false;
          let quoteChar = '';
          
          while (endIdx < result.length && bracketCount > 0) {
            const char = result[endIdx];
            
            // 处理引号
            if ((char === '"' || char === "'") && (endIdx === 0 || result[endIdx - 1] !== '\\')) {
              if (!inQuote) {
                inQuote = true;
                quoteChar = char;
              } else if (char === quoteChar) {
                inQuote = false;
              }
            } 
            // 只在引号外计算括号
            else if (!inQuote) {
              if (char === '(') bracketCount++;
              else if (char === ')') bracketCount--;
            }
            
            endIdx++;
          }
          
          if (bracketCount === 0) {
            // 提取参数
            const args = result.substring(argsStartIdx, endIdx - 1);
            const replacement = replacer(args);
            
            // 替换整个函数调用
            result = result.substring(0, startIdx) + replacement + result.substring(endIdx);
            changed = true;
            break; // 重新开始匹配
          }
        }
      }
      
      return result;
    }
  },
  watch: {
    visible: {
      handler(newVal) {
        if (newVal && this.editingColumn) {
          // 编辑模式，填充表单数据
          this.formData = {
            label: this.editingColumn.label || '',
            key: this.editingColumn.key || '',
            type: this.editingColumn.type || 'text',
            width: this.editingColumn.width || 100,
            options: this.editingColumn.options ? JSON.parse(JSON.stringify(this.editingColumn.options)) : [
              { label: '选项1', value: 'option1', color: '#e3f2fd' }
            ],
            formula: this.editingColumn.formula || ''
          };
          // 验证公式（如果是计算列）
          if (this.formData.type === 'computed' && this.formData.formula) {
            this.$nextTick(() => {
              this.validateFormula();
            });
          }
        }
      }
    }
  }
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-container {
  background: white;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
  max-height: 80vh;
  overflow: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.dialog-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.form-input,
.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d4d4d4;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #0078d4;
}

.select-options {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 12px;
  background: #f9f9f9;
}

.option-item {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}

.option-input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #d4d4d4;
  border-radius: 4px;
  font-size: 13px;
}

.color-input {
  width: 40px;
  height: 32px;
  border: 1px solid #d4d4d4;
  border-radius: 4px;
  cursor: pointer;
}

.remove-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: #ff4444;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  background: #cc0000;
}

.add-option-btn {
  width: 100%;
  padding: 8px;
  border: 1px dashed #0078d4;
  background: white;
  color: #0078d4;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.add-option-btn:hover {
  background: #f0f8ff;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
}

.btn {
  padding: 8px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f0f0f0;
  color: #333;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-primary {
  background: #0078d4;
  color: white;
}

.btn-primary:hover {
  background: #005a9e;
}

/* 计算列公式编辑器样式 */
.formula-editor {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 12px;
  background: #fafafa;
}

.formula-toolbar {
  margin-bottom: 12px;
}

.formula-toolbar .toolbar-label {
  display: inline-block;
  font-size: 13px;
  font-weight: 500;
  color: #333;
  margin-right: 8px;
  min-width: 70px;
}

.formula-toolbar .toolbar-select {
  padding: 6px 10px;
  border: 1px solid #d4d4d4;
  border-radius: 4px;
  font-size: 13px;
  background: white;
  cursor: pointer;
  min-width: 200px;
}

.function-buttons,
.operator-buttons {
  display: inline-flex;
  gap: 6px;
  flex-wrap: wrap;
}

.function-btn,
.operator-btn {
  padding: 4px 10px;
  border: 1px solid #d4d4d4;
  border-radius: 3px;
  background: white;
  color: #0078d4;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.function-btn:hover,
.operator-btn:hover {
  background: #e8f4ff;
  border-color: #0078d4;
}

.function-btn.math-func {
  color: #0078d4;
}

.function-btn.string-func {
  color: #16a34a;
  border-color: #86efac;
}

.function-btn.string-func:hover {
  background: #f0fdf4;
  border-color: #16a34a;
}

.operator-btn {
  min-width: 32px;
  padding: 4px 8px;
  font-weight: bold;
}

.formula-input-group {
  margin-bottom: 12px;
}

.formula-input-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #333;
  margin-bottom: 6px;
}

.formula-textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #d4d4d4;
  border-radius: 4px;
  font-size: 13px;
  font-family: 'Consolas', 'Monaco', monospace;
  resize: vertical;
  background: white;
  box-sizing: border-box;
}

.formula-textarea:focus {
  outline: none;
  border-color: #0078d4;
  box-shadow: 0 0 0 2px rgba(0, 120, 212, 0.1);
}

.formula-preview {
  margin-bottom: 12px;
  padding: 10px;
  background: white;
  border: 1px solid #d4d4d4;
  border-radius: 4px;
}

.preview-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  font-weight: 500;
  color: #666;
  margin-bottom: 6px;
}

.validation-status {
  font-size: 12px;
  font-weight: 500;
}

.validation-status.valid {
  color: #28a745;
}

.validation-status.invalid {
  color: #dc3545;
}

.preview-content {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  color: #333;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 3px;
  min-height: 30px;
  line-height: 1.5;
}

.preview-content.error {
  color: #dc3545;
  background: #fff5f5;
}

.formula-help {
  background: #fff9e6;
  border: 1px solid #ffe58f;
  border-radius: 4px;
  padding: 10px;
}

.help-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.formula-help ul {
  margin: 0;
  padding-left: 20px;
  font-size: 12px;
  color: #666;
}

.formula-help li {
  margin-bottom: 4px;
  line-height: 1.5;
}

.formula-help code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 11px;
  color: #d63384;
}

.help-examples {
  margin-top: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.help-subtitle {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.example-item {
  margin-bottom: 8px;
  font-size: 12px;
  line-height: 1.6;
}

.example-item:last-child {
  margin-bottom: 0;
}

.example-item strong {
  display: inline-block;
  min-width: 100px;
  color: #0078d4;
  font-size: 12px;
}

.example-item code {
  background: white;
  border: 1px solid #e0e0e0;
  padding: 3px 8px;
  display: inline-block;
  margin-left: 8px;
}
</style>

