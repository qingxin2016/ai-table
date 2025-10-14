/**
 * ExcelTable 组件主入口文件
 * 组合所有功能模块
 */
import { useState } from './composables/state.js'
import { useComputed } from './composables/computed.js'
import { useWatchers } from './composables/watchers.js'
import { useLifecycle } from './composables/lifecycle.js'
import { useCellOperations } from './composables/cellOperations.js'
import { useFillOperations } from './composables/fillOperations.js'
import { useDragOperations } from './composables/dragOperations.js'
import { useColumnOperations } from './composables/columnOperations.js'
import { useRowOperations } from './composables/rowOperations.js'
import { useGroupOperations } from './composables/groupOperations.js'
import { useVirtualScroll } from './composables/virtualScroll.js'
import { useDataOperations } from './composables/dataOperations.js'
import { useConditionalFormat } from './composables/conditionalFormat.js'
import { useMouseOperations } from './composables/mouseOperations.js'

export default {
    name: 'ExcelTable',
    props: {
        // 表格数据
        data: {
            type: Array,
            required: true,
            default: () => []
        },
        // 列配置
        columns: {
            type: Array,
            required: true,
            default: () => []
        }
    },

    // 组合所有状态
    data() {
        return {
            ...useState()
        }
    },

    // 组合所有计算属性
    computed: {
        ...useComputed()
    },

    // 组合所有监听器
    watch: {
        ...useWatchers()
    },

    // 组合生命周期钩子
    ...useLifecycle(),

    // 组合所有方法
    methods: {
        ...useCellOperations(),
        ...useFillOperations(),
        ...useDragOperations(),
        ...useColumnOperations(),
        ...useRowOperations(),
        ...useGroupOperations(),
        ...useVirtualScroll(),
        ...useDataOperations(),
        ...useConditionalFormat(),
        ...useMouseOperations()
    }
}
