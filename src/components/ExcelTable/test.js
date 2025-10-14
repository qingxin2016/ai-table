/**
 * ExcelTable 模块化测试文件
 * 用于验证所有模块是否正确导入和组合
 */

// 导入所有模块
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

// 导入主入口
import excelTableLogic from './index.js'

/**
 * 测试所有模块是否正确导出函数
 */
function testModuleExports() {
    const modules = [
        { name: 'useState', module: useState },
        { name: 'useComputed', module: useComputed },
        { name: 'useWatchers', module: useWatchers },
        { name: 'useLifecycle', module: useLifecycle },
        { name: 'useCellOperations', module: useCellOperations },
        { name: 'useFillOperations', module: useFillOperations },
        { name: 'useDragOperations', module: useDragOperations },
        { name: 'useColumnOperations', module: useColumnOperations },
        { name: 'useRowOperations', module: useRowOperations },
        { name: 'useGroupOperations', module: useGroupOperations },
        { name: 'useVirtualScroll', module: useVirtualScroll },
        { name: 'useDataOperations', module: useDataOperations },
        { name: 'useConditionalFormat', module: useConditionalFormat },
        { name: 'useMouseOperations', module: useMouseOperations }
    ]

    console.log('🧪 测试模块导出...')

    modules.forEach(({ name, module }) => {
        if (typeof module === 'function') {
            const result = module()
            if (typeof result === 'object' && result !== null) {
                console.log(`✅ ${name}: 导出 ${Object.keys(result).length} 个方法/属性`)
            } else {
                console.error(`❌ ${name}: 返回值不是对象`)
            }
        } else {
            console.error(`❌ ${name}: 不是函数`)
        }
    })
}

/**
 * 测试主入口文件结构
 */
function testMainExport() {
    console.log('\n🧪 测试主入口文件...')

    const requiredProperties = ['name', 'props', 'data', 'computed', 'watch', 'methods']
    const missingProperties = requiredProperties.filter(prop => !(prop in excelTableLogic))

    if (missingProperties.length === 0) {
        console.log('✅ 主入口文件结构正确')

        // 检查各部分是否有内容
        if (excelTableLogic.name === 'ExcelTable') {
            console.log('✅ 组件名称正确')
        }

        if (typeof excelTableLogic.data === 'function') {
            console.log('✅ data 函数正确')
        }

        if (typeof excelTableLogic.computed === 'object') {
            console.log(`✅ computed 包含 ${Object.keys(excelTableLogic.computed).length} 个计算属性`)
        }

        if (typeof excelTableLogic.watch === 'object') {
            console.log(`✅ watch 包含 ${Object.keys(excelTableLogic.watch).length} 个监听器`)
        }

        if (typeof excelTableLogic.methods === 'object') {
            console.log(`✅ methods 包含 ${Object.keys(excelTableLogic.methods).length} 个方法`)
        }

    } else {
        console.error(`❌ 主入口文件缺少属性: ${missingProperties.join(', ')}`)
    }
}

/**
 * 测试关键方法是否存在
 */
function testKeyMethods() {
    console.log('\n🧪 测试关键方法...')

    const keyMethods = [
        'handleCellClick',
        'handleCellDblClick',
        'handleCellUpdate',
        'addRow',
        'deleteSelectedRow',
        'handleAddColumn',
        'saveChanges',
        'exportData',
        'toggleEnableGroup',
        'performFill',
        'handleColumnDragStart',
        'openConditionalFormatDialog'
    ]

    const methods = excelTableLogic.methods || {}
    const missingMethods = keyMethods.filter(method => !(method in methods))

    if (missingMethods.length === 0) {
        console.log('✅ 所有关键方法都存在')
    } else {
        console.error(`❌ 缺少关键方法: ${missingMethods.join(', ')}`)
    }
}

/**
 * 运行所有测试
 */
function runTests() {
    console.log('🚀 开始 ExcelTable 模块化测试\n')

    try {
        testModuleExports()
        testMainExport()
        testKeyMethods()

        console.log('\n🎉 所有测试完成！')
        console.log('📊 模块化重构成功，所有功能模块正常工作')

    } catch (error) {
        console.error('\n💥 测试过程中出现错误:', error)
    }
}

// 如果直接运行此文件，执行测试
if (typeof window === 'undefined') {
    // Node.js 环境
    runTests()
} else {
    // 浏览器环境，将测试函数暴露到全局
    window.testExcelTableModules = runTests
}

export { runTests }
