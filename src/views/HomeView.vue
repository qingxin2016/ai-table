<template>
  <div class="home">
    <div class="table-container">
      <ExcelTable
        :data="tableData"
        :columns="columns"
        @save="handleSave"
        @export="handleExport"
        @add-column="handleAddColumn"
        @update-column="handleUpdateColumn"
        @add-row="handleAddRow"
        @delete-row="handleDeleteRow"
        @column-resize="handleColumnResize"
      />
    </div>
  </div>
</template>

<script>
import ExcelTable from '@/components/ExcelTable/ExcelTable.vue'

export default {
  name: 'HomeView',
  components: {
    ExcelTable
  },
  data() {
    return {
      // 列配置
      columns: [
        { key: 'id', label: 'ID', type: 'text', width: 80 },
        { key: 'name', label: '姓名', type: 'text', width: 120 },
        { key: 'full_info', label: '完整信息', type: 'computed', width: 200, formula: 'CONCAT({name}, " - ", {department}, " - ", {position})' },
        { key: 'department', label: '部门', type: 'text', width: 120 },
        { key: 'position', label: '职位', type: 'text', width: 150 },
        { key: 'salary', label: '薪资', type: 'number', width: 120 },
        { key: 'annual_salary', label: '年薪', type: 'computed', width: 130, formula: '{salary} * 12' },
        { key: 'skills', label: '技能标签', type: 'tags', width: 250, options: [
          { label: 'Vue', value: 'vue', color: '#42b883' },
          { label: 'React', value: 'react', color: '#61dafb' },
          { label: 'JavaScript', value: 'js', color: '#f7df1e' },
          { label: 'TypeScript', value: 'ts', color: '#3178c6' },
          { label: 'Node.js', value: 'node', color: '#339933' },
          { label: 'Python', value: 'python', color: '#3776ab' },
          { label: 'Java', value: 'java', color: '#007396' },
          { label: 'Go', value: 'go', color: '#00add8' }
        ]},
        { key: 'description', label: '简介', type: 'text', width: 250 },
        { key: 'email', label: '邮箱', type: 'text', width: 200 },
        { key: 'phone', label: '电话', type: 'text', width: 130 },
        { key: 'status', label: '状态', type: 'select', width: 100, options: [
          { label: '在职', value: '在职', color: '#c8e6c9' },
          { label: '离职', value: '离职', color: '#ffcdd2' },
          { label: '休假', value: '休假', color: '#fff9c4' }
        ]}
      ],
      // 表格数据
      tableData: [
        {
          id: '001',
          name: '张三',
          department: '技术部',
          position: '前端工程师',
          salary: '15000',
          skills: ['vue', 'js', 'ts'],
          description: '5年前端开发经验，精通Vue.js框架，擅长组件化开发和性能优化',
          email: 'zhangsan@example.com',
          phone: '13800138001',
          status: '在职'
        },
        {
          id: '002',
          name: '李四',
          department: '技术部',
          position: '后端工程师',
          salary: '16000',
          skills: ['java', 'python', 'node'],
          description: '负责后端架构设计和开发，熟悉微服务架构',
          email: 'lisi@example.com',
          phone: '13800138002',
          status: '在职'
        },
        {
          id: '003',
          name: '王五',
          department: '技术部',
          position: '测试工程师',
          salary: '12000',
          skills: ['python', 'js'],
          description: '自动化测试专家',
          email: 'wangwu@example.com',
          phone: '13800138003',
          status: '在职'
        },
        {
          id: '004',
          name: '赵六',
          department: '产品部',
          position: '产品经理',
          salary: '18000',
          skills: [],
          description: '资深产品经理',
          email: 'zhaoliu@example.com',
          phone: '13800138004',
          status: '在职'
        },
        {
          id: '005',
          name: '钱七',
          department: '产品部',
          position: '产品助理',
          salary: '10000',
          skills: [],
          description: '产品新人',
          email: 'qianqi@example.com',
          phone: '13800138005',
          status: '在职'
        },
        {
          id: '006',
          name: '孙八',
          department: '设计部',
          position: 'UI设计师',
          salary: '14000',
          skills: [],
          description: 'UI设计专家',
          email: 'sunba@example.com',
          phone: '13800138006',
          status: '在职'
        },
        {
          id: '007',
          name: '周九',
          department: '设计部',
          position: 'UX设计师',
          salary: '15000',
          skills: [],
          description: '用户体验设计师',
          email: 'zhoujiu@example.com',
          phone: '13800138007',
          status: '在职'
        },
        {
          id: '008',
          name: '吴十',
          department: '市场部',
          position: '市场专员',
          salary: '11000',
          skills: [],
          description: '市场推广',
          email: 'wushi@example.com',
          phone: '13800138008',
          status: '在职'
        },
        {
          id: '009',
          name: '郑十一',
          department: '市场部',
          position: '市场经理',
          salary: '17000',
          skills: [],
          description: '市场部负责人',
          email: 'zhengshiyi@example.com',
          phone: '13800138009',
          status: '在职'
        },
        {
          id: '010',
          name: '刘十二',
          department: '人事部',
          position: '人事专员',
          salary: '9000',
          skills: [],
          description: '负责招聘',
          email: 'liushier@example.com',
          phone: '13800138010',
          status: '在职'
        },
        {
          id: '011',
          name: '陈十三',
          department: '财务部',
          position: '会计',
          salary: '13000',
          skills: [],
          description: '财务核算',
          email: 'chenshisan@example.com',
          phone: '13800138011',
          status: '在职'
        },
        {
          id: '012',
          name: '杨十四',
          department: '财务部',
          position: '出纳',
          salary: '8000',
          skills: [],
          description: '现金管理',
          email: 'yangshisi@example.com',
          phone: '13800138012',
          status: '在职'
        }
      ]
    }
  },
  methods: {
    // 保存数据
    handleSave(data) {
      console.log('保存数据:', data)
      alert('数据已保存！')
      // 这里可以添加实际的保存逻辑，比如调用API
    },
    
    // 导出数据
    handleExport(data) {
      console.log('导出数据:', data)
      // 这里可以添加导出为Excel或CSV的逻辑
      const jsonStr = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'table-data.json'
      a.click()
      URL.revokeObjectURL(url)
    },

    // 添加列
    handleAddColumn(columnConfig) {
      console.log('添加列:', columnConfig)
      // 添加到columns数组
      this.columns.push(columnConfig)
      
      // 为所有现有数据添加新列的默认值
      this.tableData.forEach(row => {
        if (!row.hasOwnProperty(columnConfig.key)) {
          row[columnConfig.key] = ''
        }
      })
    },

    // 更新列配置
    handleUpdateColumn(columnConfig) {
      console.log('更新列:', columnConfig)
      // 查找并更新列配置
      const columnIndex = this.columns.findIndex(col => col.key === columnConfig.key)
      if (columnIndex !== -1) {
        // 更新列配置，保留 key
        this.columns[columnIndex] = {
          ...this.columns[columnIndex],
          label: columnConfig.label,
          type: columnConfig.type,
          width: columnConfig.width,
          options: columnConfig.options,
          formula: columnConfig.formula
        }
        
        // 强制更新以确保响应式
        this.$forceUpdate()
      }
    },

    // 添加行
    handleAddRow(newRow) {
      console.log('添加行:', newRow)
      // 父组件可以在这里处理额外的逻辑
      // 比如记录日志、发送通知等
    },

    // 删除行
    handleDeleteRow(deletedRow, index) {
      console.log('删除行:', deletedRow, '索引:', index)
      // 父组件可以在这里处理额外的逻辑
      // 比如记录日志、发送通知等
    },

    // 列宽调整
    handleColumnResize(resizeInfo) {
      console.log('列宽调整:', resizeInfo)
      // 更新本地列配置
      const column = this.columns.find(col => col.key === resizeInfo.columnKey)
      if (column) {
        column.width = resizeInfo.width
      }
      // 可以在这里发送到后端保存
      // api.saveColumnWidths(resizeInfo.allColumnWidths)
    }
  }
}
</script>

<style scoped>
.home {
  padding: 20px;
  height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  background: #f8fafc;
  overflow: hidden;
}

h1 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 24px;
  flex-shrink: 0;
  text-align: center;
  padding: 20px 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.table-container {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

@media (max-width: 768px) {
  .home {
    padding: 15px;
  }
  
  h1 {
    font-size: 20px;
    padding: 15px 0;
  }
}
</style>
