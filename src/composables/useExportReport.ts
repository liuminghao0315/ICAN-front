import { ref } from 'vue'
import { ElMessage } from 'element-plus'

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
 * 通过 MinIO 预签名 URL 直接下载 PDF 报告
 * @param pdfUrl  后端返回的 reportPdfUrl（MinIO 预签名地址）
 * @param fileName 可选的自定义文件名
 */
async function exportReportByUrl(pdfUrl: string, fileName?: string): Promise<void> {
  if (!pdfUrl) {
    ElMessage.warning('PDF 报告尚未生成，请稍后重试')
    return
  }
  if (exportingIds.value.has(pdfUrl)) {
    ElMessage.info('该报告正在下载中，请稍候...')
    return
  }

  markExporting(pdfUrl)

  try {
    const response = await fetch(pdfUrl)
    if (!response.ok) {
      throw new Error(`下载失败，状态码: ${response.status}`)
    }

    const blob = await response.blob()
    if (!blob || blob.size === 0) {
      throw new Error('PDF 报告文件为空')
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName || `分析报告_${new Date().toISOString().slice(0, 10)}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    ElMessage.success('PDF 报告下载成功！')
  } catch (error: any) {
    console.error('PDF 下载失败:', error)
    const msg = error?.message || 'PDF 下载失败，请稍后重试'
    ElMessage.error(msg)
  } finally {
    unmarkExporting(pdfUrl)
  }
}

async function exportReportsByUrls(items: { url: string; fileName?: string }[]): Promise<void> {
  const valid = items.filter(i => i.url)
  if (!valid.length) { ElMessage.warning('没有可导出的报告'); return }
  const pending = valid.filter(i => !exportingIds.value.has(i.url))
  if (!pending.length) { ElMessage.info('所选报告均在下载中，请稍候...'); return }
  if (pending.length < valid.length) {
    ElMessage.info(`${valid.length - pending.length} 条报告正在下载中，将跳过`)
  }
  ElMessage.info(`开始下载 ${pending.length} 份报告...`)
  for (const item of pending) await exportReportByUrl(item.url, item.fileName)
}

export function useExportReport() {
  return { exportingIds, exportReportByUrl, exportReportsByUrls }
}
