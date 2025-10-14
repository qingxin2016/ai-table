<template>
  <div v-if="visible" class="dialog-overlay" @click.self="handleClose">
    <div class="dialog-container">
      <div class="dialog-header">
        <h3>条件格式设置</h3>
        <button class="close-btn" @click="handleClose">×</button>
      </div>
      
      <div class="dialog-body">
        <div class="rules-list">
          <div 
            v-for="(rule, index) in rules" 
            :key="index"
            class="rule-item"
          >
            <div class="rule-header">
              <span class="rule-number">规则 {{ index + 1 }}</span>
              <button 
                class="delete-rule-btn"
                @click="deleteRule(index)"
                v-if="rules.length > 1"
              >
                ×
              </button>
            </div>

            <div class="form-row">
              <label>应用到：</label>
              <select v-model="rule.applyTo" class="form-select">
                <option value="cell">单元格</option>
                <option value="row">整行</option>
              </select>
            </div>

            <div class="form-row">
              <label>选择列：</label>
              <select v-model="rule.columnKey" class="form-select">
                <option value="">请选择列</option>
                <option 
                  v-for="column in columns" 
                  :key="column.key"
                  :value="column.key"
                >
                  {{ column.label }}
                </option>
              </select>
            </div>

            <div class="form-row">
              <label>条件：</label>
              <select v-model="rule.operator" class="form-select">
                <option value="equals">等于</option>
                <option value="notEquals">不等于</option>
                <option value="contains">包含</option>
                <option value="notContains">不包含</option>
                <option value="isEmpty">为空</option>
                <option value="isNotEmpty">不为空</option>
                <option value="greaterThan">大于</option>
                <option value="lessThan">小于</option>
                <option value="greaterOrEqual">大于等于</option>
                <option value="lessOrEqual">小于等于</option>
              </select>
            </div>

            <div 
              v-if="!['isEmpty', 'isNotEmpty'].includes(rule.operator)"
              class="form-row"
            >
              <label>条件值：</label>
              <!-- 根据列类型显示不同的输入控件 -->
              <input 
                v-if="getColumnType(rule.columnKey) === 'date'"
                v-model="rule.value" 
                type="date" 
                class="form-input"
                title="选择日期进行比较"
              />
              <input 
                v-else-if="getColumnType(rule.columnKey) === 'number'"
                v-model="rule.value" 
                type="number" 
                placeholder="输入数值"
                class="form-input"
              />
              <input 
                v-else
                v-model="rule.value" 
                type="text" 
                placeholder="输入条件值"
                class="form-input"
              />
              <!-- 智能提示 -->
              <small v-if="getColumnType(rule.columnKey) === 'date'" style="color: #666; font-size: 12px; margin-top: 4px; display: block;">
                💡 提示：日期列支持日期比较（大于/小于等）
              </small>
              <small v-else-if="getColumnType(rule.columnKey) === 'number'" style="color: #666; font-size: 12px; margin-top: 4px; display: block;">
                💡 提示：数字列支持数值比较（大于/小于等）
              </small>
              <small v-else-if="['contains', 'notContains'].includes(rule.operator)" style="color: #666; font-size: 12px; margin-top: 4px; display: block;">
                💡 提示：文本列支持模糊匹配（包含/不包含）
              </small>
            </div>

            <div class="form-row">
              <label>背景颜色：</label>
              <div class="color-picker-group">
                <input 
                  v-model="rule.backgroundColor" 
                  type="color" 
                  class="color-input"
                />
                <input 
                  v-model="rule.backgroundColor" 
                  type="text" 
                  class="color-text"
                  placeholder="#ffffff"
                />
                <div 
                  class="color-preview"
                  :style="{ backgroundColor: rule.backgroundColor }"
                ></div>
              </div>
            </div>

            <div class="form-row">
              <label>文字颜色：</label>
              <div class="color-picker-group">
                <input 
                  v-model="rule.textColor" 
                  type="color" 
                  class="color-input"
                />
                <input 
                  v-model="rule.textColor" 
                  type="text" 
                  class="color-text"
                  placeholder="#000000"
                />
                <div 
                  class="color-preview"
                  :style="{ backgroundColor: rule.textColor }"
                ></div>
              </div>
            </div>

            <div v-if="index < rules.length - 1" class="rule-divider"></div>
          </div>
        </div>

        <button class="add-rule-btn" @click="addRule">
          + 添加规则
        </button>
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
  name: 'ConditionalFormatDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    columns: {
      type: Array,
      default: () => []
    },
    existingRules: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      rules: []
    }
  },
  watch: {
    visible: {
      handler(newVal) {
        if (newVal) {
          // 打开弹窗时初始化规则
          if (this.existingRules.length > 0) {
            this.rules = JSON.parse(JSON.stringify(this.existingRules));
          } else {
            this.rules = [this.createEmptyRule()];
          }
        }
      },
      immediate: true
    }
  },
  methods: {
    createEmptyRule() {
      return {
        applyTo: 'cell',
        columnKey: '',
        operator: 'equals',
        value: '',
        backgroundColor: '#ffeb3b',
        textColor: '#000000'
      };
    },

    addRule() {
      this.rules.push(this.createEmptyRule());
    },

    deleteRule(index) {
      this.rules.splice(index, 1);
    },

    handleClose() {
      this.$emit('close');
    },

    handleConfirm() {
      // 验证规则
      const validRules = this.rules.filter(rule => {
        if (!rule.columnKey) {
          return false;
        }
        if (!['isEmpty', 'isNotEmpty'].includes(rule.operator) && !rule.value) {
          return false;
        }
        return true;
      });

      if (validRules.length === 0) {
        alert('请至少配置一个有效的规则');
        return;
      }

      this.$emit('confirm', validRules);
      this.handleClose();
    },

    // 获取列的类型
    getColumnType(columnKey) {
      if (!columnKey) return 'text';
      const column = this.columns.find(col => col.key === columnKey);
      return column ? column.type : 'text';
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
  width: 600px;
  max-width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
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
  overflow-y: auto;
  flex: 1;
}

.rules-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.rule-item {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 16px;
  background: #fafafa;
}

.rule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.rule-number {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.delete-rule-btn {
  width: 24px;
  height: 24px;
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

.delete-rule-btn:hover {
  background: #cc0000;
}

.form-row {
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row label {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.form-select,
.form-input {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  background: white;
}

.form-select:focus,
.form-input:focus {
  outline: none;
  border-color: #1890ff;
}

.color-picker-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.color-input {
  width: 50px;
  height: 36px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
}

.color-text {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
}

.color-preview {
  width: 36px;
  height: 36px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

.rule-divider {
  height: 1px;
  background: #e0e0e0;
  margin-top: 16px;
}

.add-rule-btn {
  width: 100%;
  padding: 10px;
  border: 1px dashed #1890ff;
  background: white;
  color: #1890ff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-top: 16px;
}

.add-rule-btn:hover {
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
  background: #1890ff;
  color: white;
}

.btn-primary:hover {
  background: #0050b3;
}
</style>

