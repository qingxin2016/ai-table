<template>
  <div class="excel-table-wrapper" :class="{ 'readonly-mode': !enableEdit }">
    <!-- 工具栏 -->
    <div class="excel-toolbar">
      <button @click="showAddColumnDialog = true" :disabled="!enableEdit" class="toolbar-btn">
        <span class="btn-icon">⊕</span>
        <span class="btn-text">添加列</span>
      </button>
      <button @click="addRow" :disabled="!enableEdit" class="toolbar-btn">
        <span class="btn-icon">＋</span>
        <span class="btn-text">添加行</span>
      </button>
      <button @click="deleteSelectedRows" :disabled="!enableEdit || selectedRows.size === 0" title="删除选中行" class="toolbar-btn">
        <span class="btn-icon">－</span>
        <span class="btn-text">删除</span>
        <span v-if="selectedRows.size > 0" class="badge">{{ selectedRows.size }}</span>
      </button>
      <div class="separator"></div>
      <button @click="saveChanges" :disabled="!enableEdit || modifiedCells.size === 0" class="toolbar-btn">
        <span class="btn-icon">✓</span>
        <span class="btn-text">保存</span>
        <span v-if="modifiedCells.size > 0" class="badge">{{ modifiedCells.size }}</span>
      </button>
      <button @click="undoChanges" :disabled="!enableEdit || modifiedCells.size === 0" class="toolbar-btn">
        <span class="btn-icon">↶</span>
        <span class="btn-text">撤销</span>
      </button>
      <div class="separator"></div>
      <button @click="exportData" class="toolbar-btn">
        <span class="btn-icon">↗</span>
        <span class="btn-text">导出</span>
      </button>
      <button @click="triggerImport" class="toolbar-btn">
        <span class="btn-icon">↙</span>
        <span class="btn-text">导入</span>
      </button>
      <input 
        ref="fileInput" 
        type="file" 
        accept=".xlsx,.xls,.csv" 
        style="display: none" 
        @change="handleFileImport"
      />
      <div class="separator"></div>
      <button 
        @click="toggleLockFirstColumn"
        :class="{ 'active': lockFirstColumn }"
        title="锁定第一个数据列（序号列始终固定）"
        class="toolbar-btn"
      >
        <span class="btn-icon">⊡</span>
        <span class="btn-text">锁定首列</span>
      </button>
      <button 
        @click="resetColumnWidths"
        title="重置所有列宽为默认值"
        class="toolbar-btn"
      >
        <span class="btn-icon">⟲</span>
        <span class="btn-text">重置列宽</span>
      </button>
      <div class="separator"></div>
      <button 
        @click="openConditionalFormatDialog"
        class="toolbar-btn"
        title="设置条件格式"
      >
        <span class="btn-icon">🎨</span>
        <span class="btn-text">填色</span>
      </button>
      <button 
        @click="toggleEditMode"
        :class="{ 'active': enableEdit }"
        title="切换编辑模式（关闭后只能查看，不能编辑）"
        class="toolbar-btn"
      >
        <span class="btn-icon">{{ enableEdit ? '✎' : '👁' }}</span>
        <span class="btn-text">{{ enableEdit ? '编辑模式' : '只读模式' }}</span>
      </button>
      <button 
        @click="enableVirtualScroll = !enableVirtualScroll"
        :class="{ 'active': enableVirtualScroll }"
        title="开启/关闭虚拟滚动（大数据量时开启可提升性能）"
        class="toolbar-btn"
      >
        <span class="btn-icon">⚡</span>
        <span class="btn-text">{{ enableVirtualScroll ? '虚拟滚动' : '普通模式' }}</span>
      </button>
      <div class="separator"></div>
      <button 
        @click="toggleEnableGroup"
        :class="{ 'active': enableGroup }"
        title="开启/关闭分组功能"
        class="toolbar-btn"
      >
        <span class="btn-icon">≡</span>
        <span class="btn-text">{{ enableGroup ? '分组' : '分组' }}</span>
      </button>
      <div class="toolbar-group" v-if="enableGroup">
        <label class="toolbar-label">分组列：</label>
        <select v-model="groupBy" class="toolbar-select" @change="handleGroupByChange">
          <option value="">请选择分组列</option>
          <option 
            v-for="column in displayColumns" 
            :key="column.key"
            :value="column.key"
          >
            {{ column.label }}
          </option>
        </select>
      </div>
    </div>
    
    <!-- 表格容器 -->
    <div class="excel-table-container">
      <table class="excel-table">
        <thead>
          <tr>
            <!-- 行号列 - 选择框 -->
            <th class="row-numbers-column checkbox-column">
              <input 
                type="checkbox" 
                class="row-checkbox header-checkbox"
                :checked="isAllRowsSelected"
                :indeterminate="isSomeRowsSelected"
                @change="toggleSelectAll"
                title="全选/取消全选"
              />
            </th>
            <!-- 数据列 -->
            <th
              v-for="(column, colIndex) in displayColumns"
              :key="column.key"
              :draggable="!isResizingColumn"
              :style="getColumnStyle(column.key)"
              @dragstart="handleColumnDragStart(column.key, $event)"
              @dragenter="handleColumnDragEnter(column.key, $event)"
              @dragover="handleColumnDragOver"
              @drop="handleColumnDrop"
              @dragend="handleColumnDragEnd"
              :class="{
                'dragging': isDraggingColumn && draggedColumn === column.key,
                'drag-over-left': isDraggingColumn && dropTargetColumn === column.key && dragOverPosition === 'left',
                'drag-over-right': isDraggingColumn && dropTargetColumn === column.key && dragOverPosition === 'right',
                'locked-column': isColumnLocked(colIndex),
                'resizing': isResizingColumn && resizingColumn === column.key,
                'computed-header': column.type === 'computed'
              }"
            >
              <span class="column-drag-handle">
                <span v-if="column.type === 'computed'" class="column-type-icon" title="计算列">ƒ</span>
                {{ column.label }}
              </span>
              <button 
                class="column-config-btn"
                @click.stop="openEditColumnDialog(column)"
                title="编辑列配置"
              >
                ⚙
              </button>
              <div 
                class="column-resizer"
                :class="{ 'resizing': isResizingColumn && resizingColumn === column.key }"
                @mousedown="handleColumnResizeStart(column.key, $event)"
              ></div>
            </th>
          </tr>
        </thead>
        <tbody>
          <!-- 虚拟滚动：顶部占位 -->
          <tr v-if="enableVirtualScroll && offsetY > 0" class="virtual-spacer">
            <td :colspan="displayColumns.length + 1" :style="{ height: offsetY + 'px', padding: 0, border: 'none' }"></td>
          </tr>
          
          <!-- 渲染可见行 -->
          <template v-for="{ row, index: rowIndex } in visibleRows" :key="rowIndex">
            <!-- 分组标题行 -->
            <tr
              v-if="row._isGroup"
              class="group-header"
              :class="{ 'collapsed': row._collapsed }"
              @click="toggleGroup(row._groupName)"
            >
              <td :colspan="displayColumns.length + 1">
                <span class="group-icon">▼</span>
                {{ row._groupName }}
              </td>
            </tr>
            
            <!-- 数据行 -->
            <tr
              v-else-if="!row._isGroup && shouldShowRow(row)"
              class="group-row"
              :class="{
                'dragging-row': isDraggingRow && draggedRow === rowIndex,
                'drag-over-row-top': isDraggingRow && dropTargetRow === rowIndex && dragOverRowPosition === 'top',
                'drag-over-row-bottom': isDraggingRow && dropTargetRow === rowIndex && dragOverRowPosition === 'bottom'
              }"
              @dragenter="handleRowDragEnter(rowIndex, $event)"
              @dragover="handleRowDragOver"
              @drop="handleRowDrop"
            >
              <!-- 行号 -->
              <td 
                class="row-numbers-column checkbox-column"
                :class="{ 'row-selected': isRowSelected(rowIndex) }"
              >
                <div class="row-number-content">
                  <!-- 序号（默认显示） -->
                  <span class="row-number-text">
                    {{ row._originalIndex !== undefined ? row._originalIndex + 1 : rowIndex + 1 }}
                  </span>
                  <!-- 选择框（hover时显示） -->
                  <input 
                    type="checkbox" 
                    class="row-checkbox"
                    :checked="isRowSelected(rowIndex)"
                    @change="toggleRowSelection(rowIndex)"
                    @click.stop
                  />
                  <!-- 拖动图标 -->
                  <span 
                    class="row-drag-icon"
                    draggable="true"
                    @dragstart="handleRowDragStart(rowIndex, $event)"
                    @dragend="handleRowDragEnd"
                  >
                    ⋮⋮
                  </span>
                </div>
              </td>
              
              <!-- 数据单元格 -->
              <td
                v-for="(column, colIndex) in displayColumns"
                :key="column.key"
                :style="{
                  ...getColumnStyle(column.key),
                  ...getCellStyle(rowIndex, column.key)
                }"
                :class="{
                  'selected': selectedCell && selectedCell.rowIndex === rowIndex && selectedCell.colKey === column.key,
                  'editing': editingCell && editingCell.rowIndex === rowIndex && editingCell.colKey === column.key,
                  'modified': isCellModified(rowIndex, column.key),
                  'fill-preview': isInFillPreview(rowIndex, column.key),
                  'locked-column': isColumnLocked(colIndex),
                  'computed-column': column.type === 'computed'
                }"
                @click="handleCellClick(rowIndex, column.key, $event)"
                @dblclick="handleCellDblClick(rowIndex, column.key)"
                @mouseenter="handleCellMouseEnter(rowIndex, column.key)"
              >
                <!-- 使用单元格渲染器 -->
                <component
                  :is="getCellComponent(column.type)"
                  :value="getRowData(rowIndex)[column.key]"
                  :isEditing="editingCell && editingCell.rowIndex === rowIndex && editingCell.colKey === column.key"
                  :options="column.options"
                  :formula="column.formula"
                  :rowData="getRowData(rowIndex)"
                  @update="handleCellUpdate(rowIndex, column.key, $event)"
                  @blur="handleCellBlur(rowIndex, column.key, $event)"
                />
                
                <!-- 填充手柄（计算列不显示） -->
                <div
                  v-if="selectedCell && selectedCell.rowIndex === rowIndex && selectedCell.colKey === column.key && column.type !== 'computed'"
                  class="fill-handle"
                  @mousedown="handleFillMouseDown(rowIndex, column.key, $event)"
                ></div>
              </td>
            </tr>
          </template>
          
          <!-- 虚拟滚动：底部占位 -->
          <tr v-if="enableVirtualScroll && virtualEndIndex < displayData.length" class="virtual-spacer">
            <td 
              :colspan="displayColumns.length + 1" 
              :style="{ 
                height: (displayData.length - virtualEndIndex) * rowHeight + 'px', 
                padding: 0, 
                border: 'none' 
              }"
            ></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 添加列弹窗 -->
    <AddColumnDialog
      :visible="showAddColumnDialog"
      :columns="internalColumns"
      :editingColumn="editingColumnData"
      @close="handleCloseColumnDialog"
      @confirm="handleAddColumn"
      @update="handleUpdateColumn"
    />

    <!-- 条件格式弹窗 -->
    <ConditionalFormatDialog
      :visible="showConditionalFormatDialog"
      :columns="internalColumns"
      :existingRules="conditionalFormats"
      @close="closeConditionalFormatDialog"
      @confirm="applyConditionalFormats"
    />
  </div>
</template>

<script>
import excelTableLogic from './index.js'
import AddColumnDialog from './AddColumnDialog.vue'
import ConditionalFormatDialog from './ConditionalFormatDialog.vue'
import TextCell from './CellRenderers/TextCell.vue'
import NumberCell from './CellRenderers/NumberCell.vue'
import DateCell from './CellRenderers/DateCell.vue'
import SelectCell from './CellRenderers/SelectCell.vue'
import TagsCell from './CellRenderers/TagsCell.vue'
import ComputedCell from './CellRenderers/ComputedCell.vue'

export default {
  ...excelTableLogic,
  components: {
    AddColumnDialog,
    ConditionalFormatDialog,
    TextCell,
    NumberCell,
    DateCell,
    SelectCell,
    TagsCell,
    ComputedCell
  }
}
</script>

<style>
@import './excelTable.css';
</style>

