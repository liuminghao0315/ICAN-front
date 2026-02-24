import { ref } from 'vue'
import { createApp, defineComponent, h } from 'vue'
import { ElMessage } from 'element-plus'
import { getResultById } from '@/api'
import ReportView from '@/components/ReportView.vue'

/**
 * 正在导出的 resultId 集合，防止重复触发。
 * 每次修改都重新赋值新 Set，确保 Vue 响应式系统能检测到变化。
 */
const exportingIds = ref(new Set<string>())

function markExporting(id: string) {
  exportingIds.value = new Set(exportingIds.value).add(id)
}

function unmarkExporting(id: string) {
  const next = new Set(exportingIds.value)
  next.delete(id)
  exportingIds.value = next
}

/**
 * 通过 resultId 获取分析数据，动态挂载 ReportView 并导出 PDF
 */
async function exportReportById(resultId: string): Promise<void> {
  if (!resultId) {
    ElMessage.warning('无效的报告 ID')
    return
  }

  if (exportingIds.value.has(resultId)) {
    ElMessage.info('该报告正在导出中，请稍候...')
    return
  }

  markExporting(resultId)

  const loadingMsg = ElMessage.info({
    message: '正在获取报告数据...',
    duration: 0,
  })

  let mountNode: HTMLDivElement | null = null
  let app: ReturnType<typeof createApp> | null = null
  let renderingMsg: ReturnType<typeof ElMessage.info> | null = null

  try {
    // 1. 获取分析结果数据
    const res = await getResultById(resultId)
    if (res.code !== 200 || !res.data) {
      throw new Error(res.message || '获取报告数据失败')
    }
    const analysisData = res.data

    loadingMsg.close()
    renderingMsg = ElMessage.info({
      message: '正在生成 PDF 报告，请稍候...',
      duration: 0,
    })

    // 2. 动态挂载隐藏的 ReportView 到 body
    mountNode = document.createElement('div')
    mountNode.style.cssText = [
      'position:fixed',
      'left:-9999px',
      'top:0',
      'width:1200px',
      'background:#fff',
      'z-index:-1',
      'pointer-events:none',
    ].join(';')
    document.body.appendChild(mountNode)

    const WrapperComp = defineComponent({
      render() {
        return h(ReportView, { data: analysisData })
      },
    })

    app = createApp(WrapperComp)
    app.mount(mountNode)

    // 3. 等待两帧 + 300ms，确保 DOM 及图表渲染完成
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })
    await new Promise<void>((resolve) => setTimeout(resolve, 300))

    // 4. 动态加载依赖并截图
    const [html2canvasModule, jsPDFModule] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ])
    const html2canvas = html2canvasModule.default
    const jsPDF = jsPDFModule.default || (jsPDFModule as any).jsPDF

    const reportContainer = mountNode.querySelector('.report-container') as HTMLElement
    if (!reportContainer) {
      throw new Error('无法获取报告内容区域')
    }

    const canvas = await html2canvas(reportContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: reportContainer.scrollWidth,
      height: reportContainer.scrollHeight,
    })

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('无法生成报告图片')
    }

    // 5. 生成 PDF（支持多页）
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 10
    const contentWidth = pageWidth - margin * 2
    const availableHeight = pageHeight - margin * 2

    const imgWidth = canvas.width
    const imgHeight = canvas.height
    const ratio = contentWidth / imgWidth
    const scaledHeight = imgHeight * ratio

    const imgData = canvas.toDataURL('image/jpeg', 0.92)

    if (scaledHeight <= availableHeight) {
      pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, scaledHeight)
    } else {
      let yOffset = 0
      const pageImgHeight = availableHeight / ratio

      while (yOffset < imgHeight) {
        const sliceHeight = Math.min(pageImgHeight, imgHeight - yOffset)
        const sliceCanvas = document.createElement('canvas')
        sliceCanvas.width = imgWidth
        sliceCanvas.height = sliceHeight
        const ctx = sliceCanvas.getContext('2d')!
        ctx.drawImage(canvas, 0, yOffset, imgWidth, sliceHeight, 0, 0, imgWidth, sliceHeight)
        const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.92)
        if (yOffset > 0) pdf.addPage()
        pdf.addImage(sliceData, 'JPEG', margin, margin, contentWidth, sliceHeight * ratio)
        yOffset += sliceHeight
      }
    }

    // 6. 生成文件名并保存
    const title =
      (analysisData as any).videoTitle ||
      (analysisData as any).videoInfo?.fileName ||
      '分析报告'
    const safeTitle = title.replace(/[\\/:*?"<>|]/g, '_').slice(0, 30)
    const dateStr = new Date().toISOString().slice(0, 10)
    pdf.save(`分析报告_${safeTitle}_${dateStr}.pdf`)

    renderingMsg.close()
    ElMessage.success('PDF 报告导出成功！')
  } catch (error: any) {
    loadingMsg.close()
    renderingMsg?.close()
    console.error('PDF 导出失败:', error)
    ElMessage.error(error?.message || 'PDF 导出失败，请稍后重试')
  } finally {
    // 7. 清理：卸载组件、移除 DOM 节点、解除导出锁
    if (app) {
      try { app.unmount() } catch (_) { /* ignore */ }
    }
    if (mountNode && mountNode.parentNode) {
      mountNode.parentNode.removeChild(mountNode)
    }
    unmarkExporting(resultId)
  }
}

/**
 * 批量导出：串行依次导出多个 resultId 对应的报告
 */
async function exportReportsByIds(resultIds: string[]): Promise<void> {
  const validIds = resultIds.filter(Boolean)
  if (validIds.length === 0) {
    ElMessage.warning('没有可导出的报告')
    return
  }

  const pendingIds = validIds.filter((id) => !exportingIds.value.has(id))
  if (pendingIds.length === 0) {
    ElMessage.info('所选报告均在导出中，请稍候...')
    return
  }

  if (pendingIds.length < validIds.length) {
    ElMessage.info(`${validIds.length - pendingIds.length} 条报告正在导出中，将跳过`)
  }

  ElMessage.info(`开始导出 ${pendingIds.length} 份报告，请勿关闭页面...`)

  for (const id of pendingIds) {
    await exportReportById(id)
  }
}

export function useExportReport() {
  return {
    exportingIds,
    exportReportById,
    exportReportsByIds,
  }
}
