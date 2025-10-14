<template>
  <div class="computed-cell">
    <span class="computed-indicator" title="计算列">ƒ</span>
    <span 
      class="cell-content computed-value" 
      :class="{ 'text-right': isNumericResult }"
      :title="'公式: ' + formula"
    >
      {{ computedValue }}
    </span>
  </div>
</template>

<script>
export default {
  name: 'ComputedCell',
  props: {
    value: {
      type: [String, Number],
      default: ''
    },
    formula: {
      type: String,
      default: ''
    },
    rowData: {
      type: Object,
      default: () => ({})
    },
    isEditing: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      lastResult: null
    }
  },
  computed: {
    computedValue() {
      if (!this.formula || !this.rowData) {
        return '';
      }
      
      try {
        // 解析并计算公式
        const result = this.calculateFormula(this.formula, this.rowData);
        this.lastResult = result;
        
        // 格式化数字结果
        if (typeof result === 'number' && !isNaN(result)) {
          // 如果是整数，不显示小数
          if (Number.isInteger(result)) {
            return result.toLocaleString('en-US');
          }
          // 如果是小数，保留2位
          return result.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
          });
        }
        
        return result;
      } catch (error) {
        this.lastResult = null;
        return '#错误';
      }
    },
    isNumericResult() {
      return typeof this.lastResult === 'number' && !isNaN(this.lastResult);
    }
  },
  methods: {
    calculateFormula(formula, rowData) {
      try {
        // 统一处理：支持字符串函数和数学函数混合使用
        return this.calculateMixedFormula(formula, rowData);
      } catch (error) {
        console.error('公式计算错误:', error);
        throw new Error('公式计算错误');
      }
    },
    
    calculateMixedFormula(formula, rowData) {
      let expression = formula;
      const stringFuncPattern = /CONCAT|UPPER|LOWER|TRIM|SUBSTRING|LENGTH/;
      const hasMathFunc = /SUM|AVG|MAX|MIN|ABS|ROUND|FLOOR|CEIL|SQRT|POW/.test(expression);
      const hasStringFunc = stringFuncPattern.test(expression);
      
      // 存储中间结果的变量
      const tempVars = {};
      let tempVarCounter = 0;
      
      // 1. 首先处理所有字符串函数，将结果保存为临时变量
      if (hasStringFunc) {
        // 处理 CONCAT 函数（支持嵌套括号）
        expression = this.replaceFunctionWithBrackets(expression, 'CONCAT', (args) => {
          const result = this.evaluateConcatMixed(args, rowData, tempVars);
          const varName = `__temp${tempVarCounter++}__`;
          tempVars[varName] = result;
          return varName;
        });
        
        // 处理 UPPER 函数
        expression = expression.replace(/UPPER\(([^)]+)\)/g, (match, args) => {
          const value = this.getValueMixed(args.trim(), rowData, tempVars);
          const result = String(value).toUpperCase();
          const varName = `__temp${tempVarCounter++}__`;
          tempVars[varName] = result;
          return varName;
        });
        
        // 处理 LOWER 函数
        expression = expression.replace(/LOWER\(([^)]+)\)/g, (match, args) => {
          const value = this.getValueMixed(args.trim(), rowData, tempVars);
          const result = String(value).toLowerCase();
          const varName = `__temp${tempVarCounter++}__`;
          tempVars[varName] = result;
          return varName;
        });
        
        // 处理 TRIM 函数
        expression = expression.replace(/TRIM\(([^)]+)\)/g, (match, args) => {
          const value = this.getValueMixed(args.trim(), rowData, tempVars);
          const result = String(value).trim();
          const varName = `__temp${tempVarCounter++}__`;
          tempVars[varName] = result;
          return varName;
        });
        
        // 处理 SUBSTRING 函数
        expression = expression.replace(/SUBSTRING\(([^)]+)\)/g, (match, args) => {
          const result = this.evaluateSubstringMixed(args, rowData, tempVars);
          const varName = `__temp${tempVarCounter++}__`;
          tempVars[varName] = result;
          return varName;
        });
        
        // 处理 LENGTH 函数（返回数字，可用于数学计算）
        expression = expression.replace(/LENGTH\(([^)]+)\)/g, (match, args) => {
          const value = this.getValueMixed(args.trim(), rowData, tempVars);
          return String(value).length;
        });
      }
      
      // 2. 处理列引用 {columnKey}
      const columnRefs = expression.match(/\{([^}]+)\}/g);
      if (columnRefs) {
        columnRefs.forEach(ref => {
          const columnKey = ref.slice(1, -1);
          const value = rowData[columnKey];
          
          // 如果表达式包含数学函数或运算符，转换为数字
          if (hasMathFunc || /[\+\-\*\/]/.test(expression)) {
            const numValue = parseFloat(value) || 0;
            expression = expression.replace(new RegExp(ref.replace(/[{}]/g, '\\$&'), 'g'), numValue);
          } else {
            // 否则保持为字符串
            expression = expression.replace(new RegExp(ref.replace(/[{}]/g, '\\$&'), 'g'), `"${value}"`);
          }
        });
      }
      
      // 3. 处理数学函数
      if (hasMathFunc) {
        expression = this.replaceMathFunctions(expression);
      }
      
      // 4. 如果表达式是纯字符串或临时变量，直接返回
      if (!hasMathFunc && !(/[\+\-\*\/\(\)]/.test(expression))) {
        // 检查是否是临时变量
        if (tempVars[expression]) {
          return tempVars[expression];
        }
        // 去掉引号
        if (expression.startsWith('"') && expression.endsWith('"')) {
          return expression.slice(1, -1);
        }
        return expression;
      }
      
      // 5. 替换临时变量为实际值
      Object.keys(tempVars).forEach(varName => {
        const value = tempVars[varName];
        // 如果是在数学表达式中，尝试转换为数字
        if (/[\+\-\*\/]/.test(expression) && !isNaN(parseFloat(value))) {
          expression = expression.replace(new RegExp(varName, 'g'), parseFloat(value));
        } else {
          expression = expression.replace(new RegExp(varName, 'g'), `"${value}"`);
        }
      });
      
      // 6. 执行最终计算
      try {
        // 如果是纯数学表达式
        if (!expression.includes('"')) {
          const result = new Function('Math', `"use strict"; return (${expression})`)(Math);
          return result;
        } else {
          // 包含字符串的表达式
          const result = new Function(`"use strict"; return (${expression})`)();
          return result;
        }
      } catch (error) {
        console.error('表达式计算错误:', expression, error);
        throw error;
      }
    },
    
    // 获取值（支持临时变量、列引用、字符串字面量、数学表达式）
    getValueMixed(expr, rowData, tempVars) {
      expr = expr.trim();
      
      // 临时变量
      if (tempVars[expr]) {
        return tempVars[expr];
      }
      
      // 字符串字面量
      if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
        return expr.slice(1, -1);
      }
      
      // 列引用
      if (expr.startsWith('{') && expr.endsWith('}')) {
        const columnKey = expr.slice(1, -1);
        return rowData[columnKey] || '';
      }
      
      // 检查是否包含数学函数或运算符（数学表达式）
      if (/SUM|AVG|MAX|MIN|ABS|ROUND|FLOOR|CEIL|SQRT|POW|[\+\-\*\/\(\)]/.test(expr)) {
        try {
          // 处理数学表达式
          let mathExpr = expr;
          
          // 替换列引用
          const columnRefs = mathExpr.match(/\{([^}]+)\}/g);
          if (columnRefs) {
            columnRefs.forEach(ref => {
              const columnKey = ref.slice(1, -1);
              const value = rowData[columnKey];
              const numValue = parseFloat(value) || 0;
              mathExpr = mathExpr.replace(new RegExp(ref.replace(/[{}]/g, '\\$&'), 'g'), numValue);
            });
          }
          
          // 替换数学函数
          mathExpr = this.replaceMathFunctions(mathExpr);
          
          // 计算表达式
          const result = new Function('Math', `"use strict"; return (${mathExpr})`)(Math);
          return result;
        } catch (error) {
          console.error('数学表达式计算错误:', expr, error);
          return expr; // 返回原始值
        }
      }
      
      // 普通值
      return expr;
    },
    
    // 评估 CONCAT 函数（支持混合）
    evaluateConcatMixed(argsStr, rowData, tempVars) {
      const args = this.splitArgs(argsStr);
      const values = args.map(arg => this.getValueMixed(arg, rowData, tempVars));
      return values.join('');
    },
    
    // 评估 SUBSTRING 函数（支持混合）
    evaluateSubstringMixed(argsStr, rowData, tempVars) {
      const args = this.splitArgs(argsStr);
      if (args.length < 2) {
        throw new Error('SUBSTRING 需要至少2个参数');
      }
      const str = String(this.getValueMixed(args[0], rowData, tempVars));
      const start = parseInt(args[1]) || 0;
      const length = args.length > 2 ? parseInt(args[2]) : undefined;
      
      return length !== undefined ? str.substring(start, start + length) : str.substring(start);
    },
    
    // 保留原有的方法以兼容
    calculateMathFormula(formula, rowData) {
      // 替换列引用 {columnKey} 为实际值
      let expression = formula;
      
      // 匹配所有 {columnKey} 格式的引用
      const columnRefs = formula.match(/\{([^}]+)\}/g);
      
      if (columnRefs) {
        columnRefs.forEach(ref => {
          const columnKey = ref.slice(1, -1); // 去掉 { }
          const value = rowData[columnKey];
          const numValue = parseFloat(value) || 0;
          expression = expression.replace(ref, numValue);
        });
      }
      
      // 替换数学函数
      expression = this.replaceMathFunctions(expression);
      
      // 使用 Function 构造器安全计算（限制只能使用Math对象）
      try {
        const result = new Function('Math', `"use strict"; return (${expression})`)(Math);
        return result;
      } catch (error) {
        throw new Error('公式计算错误');
      }
    },
    
    calculateStringFormula(formula, rowData) {
      let result = formula;
      
      // 首先处理列引用，用引号包裹字符串值
      const columnRefs = formula.match(/\{([^}]+)\}/g);
      const columnValues = {};
      
      if (columnRefs) {
        columnRefs.forEach(ref => {
          const columnKey = ref.slice(1, -1);
          const value = rowData[columnKey] || '';
          columnValues[ref] = String(value);
        });
      }
      
      // 处理 CONCAT 函数
      result = result.replace(/CONCAT\(([^)]+)\)/g, (match, args) => {
        return this.evaluateConcat(args, columnValues);
      });
      
      // 处理 UPPER 函数
      result = result.replace(/UPPER\(([^)]+)\)/g, (match, args) => {
        const value = this.getStringValue(args.trim(), columnValues);
        return `"${value.toUpperCase()}"`;
      });
      
      // 处理 LOWER 函数
      result = result.replace(/LOWER\(([^)]+)\)/g, (match, args) => {
        const value = this.getStringValue(args.trim(), columnValues);
        return `"${value.toLowerCase()}"`;
      });
      
      // 处理 TRIM 函数
      result = result.replace(/TRIM\(([^)]+)\)/g, (match, args) => {
        const value = this.getStringValue(args.trim(), columnValues);
        return `"${value.trim()}"`;
      });
      
      // 处理 SUBSTRING 函数
      result = result.replace(/SUBSTRING\(([^)]+)\)/g, (match, args) => {
        return this.evaluateSubstring(args, columnValues);
      });
      
      // 处理 LENGTH 函数
      result = result.replace(/LENGTH\(([^)]+)\)/g, (match, args) => {
        const value = this.getStringValue(args.trim(), columnValues);
        return value.length;
      });
      
      // 如果结果仍然包含列引用，替换它们
      Object.keys(columnValues).forEach(ref => {
        result = result.replace(new RegExp(ref.replace(/[{}]/g, '\\$&'), 'g'), `"${columnValues[ref]}"`);
      });
      
      // 如果结果被引号包裹，去掉引号
      if (result.startsWith('"') && result.endsWith('"')) {
        return result.slice(1, -1);
      }
      
      return result;
    },
    
    getStringValue(expr, columnValues) {
      // 去掉首尾引号（如果有）
      expr = expr.trim();
      if (expr.startsWith('"') && expr.endsWith('"')) {
        return expr.slice(1, -1);
      }
      if (expr.startsWith("'") && expr.endsWith("'")) {
        return expr.slice(1, -1);
      }
      // 如果是列引用
      if (columnValues[expr]) {
        return columnValues[expr];
      }
      return expr;
    },
    
    evaluateConcat(args, columnValues) {
      // 分割参数，注意要正确处理引号内的逗号
      const parts = this.splitArgs(args);
      const values = parts.map(part => this.getStringValue(part, columnValues));
      return `"${values.join('')}"`;
    },
    
    evaluateSubstring(args, columnValues) {
      const parts = this.splitArgs(args);
      if (parts.length < 2) {
        throw new Error('SUBSTRING 需要至少2个参数');
      }
      const str = this.getStringValue(parts[0], columnValues);
      const start = parseInt(parts[1]) || 0;
      const length = parts.length > 2 ? parseInt(parts[2]) : undefined;
      
      const result = length !== undefined ? str.substring(start, start + length) : str.substring(start);
      return `"${result}"`;
    },
    
    splitArgs(argsStr) {
      // 参数分割，支持引号内的逗号和括号嵌套
      const args = [];
      let current = '';
      let inQuote = false;
      let quoteChar = '';
      let bracketDepth = 0; // 括号深度
      
      for (let i = 0; i < argsStr.length; i++) {
        const char = argsStr[i];
        
        // 处理引号
        if ((char === '"' || char === "'") && (i === 0 || argsStr[i-1] !== '\\')) {
          if (!inQuote) {
            inQuote = true;
            quoteChar = char;
            current += char;
          } else if (char === quoteChar) {
            inQuote = false;
            current += char;
          } else {
            current += char;
          }
        } 
        // 处理括号（不在引号内时）
        else if (!inQuote) {
          if (char === '(') {
            bracketDepth++;
            current += char;
          } else if (char === ')') {
            bracketDepth--;
            current += char;
          } else if (char === ',' && bracketDepth === 0) {
            // 只在括号外的逗号才分割参数
            args.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        } else {
          current += char;
        }
      }
      
      if (current) {
        args.push(current.trim());
      }
      
      return args;
    },
    
    replaceMathFunctions(expression) {
      // 替换常用数学函数为 Math 对象方法
      let result = expression;
      
      // 处理 SUM 函数 (求和) - 支持嵌套括号
      result = this.replaceFunctionWithBrackets(result, 'SUM', (args) => {
        const values = args.split(',').map(v => v.trim());
        return `(${values.join(' + ')})`;
      });
      
      // 处理 AVG 函数 (平均值) - 支持嵌套括号
      result = this.replaceFunctionWithBrackets(result, 'AVG', (args) => {
        const values = args.split(',').map(v => v.trim());
        return `((${values.join(' + ')}) / ${values.length})`;
      });
      
      // 替换其他函数（简单替换函数名）
      result = result.replace(/MAX/g, 'Math.max');
      result = result.replace(/MIN/g, 'Math.min');
      result = result.replace(/ABS/g, 'Math.abs');
      result = result.replace(/ROUND/g, 'Math.round');
      result = result.replace(/FLOOR/g, 'Math.floor');
      result = result.replace(/CEIL/g, 'Math.ceil');
      result = result.replace(/SQRT/g, 'Math.sqrt');
      result = result.replace(/POW/g, 'Math.pow');
      result = result.replace(/LOG/g, 'Math.log');
      result = result.replace(/EXP/g, 'Math.exp');
      
      return result;
    },
    
    // 替换函数，支持嵌套括号（考虑引号）
    replaceFunctionWithBrackets(expression, funcName, replacer) {
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
    formula: {
      handler(newVal, oldVal) {
        if (newVal !== oldVal) {
          // 公式变化时强制重新计算
          this.$forceUpdate();
        }
      }
    }
  }
}
</script>

<style scoped>
.computed-cell {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
}

.cell-content {
  display: flex;
  align-items: center;
  flex: 1;
  width: 100%;
  height: 100%;
  white-space: pre-wrap;
  word-wrap: break-word;
  padding: 0 20px 0 15px;
  background: transparent;
  line-height: 1.5;
}

.computed-value {
  color: #2c5aa0;
  font-weight: 500;
  cursor: help;
  font-variant-numeric: tabular-nums;
}

.computed-indicator {
  position: absolute;
  left: 4px;
  top: 50%;
  transform: translateY(-50%);
  color: #2c5aa0;
  font-weight: bold;
  font-size: 12px;
  opacity: 0.6;
  pointer-events: none;
}

.computed-cell:hover {
  background: #f5f5f5;
}

.computed-cell:hover .computed-indicator {
  opacity: 0.9;
}

.cell-content.text-right {
  justify-content: flex-end;
  text-align: right;
}
</style>

