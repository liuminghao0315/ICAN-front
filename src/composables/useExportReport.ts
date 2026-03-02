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
      if (response.status === 403) {
        throw new Error('报告链接已过期，请重新生成报告后再导出')
      } else if (response.status === 404) {
        throw new Error('报告文件不存在，可能尚未生成完毕')
      } else {
        throw new Error(`下载失败（错误 ${response.status}），请稍后重试`)
      }
    }

    const blob = await response.blob()
    if (!blob || blob.size === 0) {
      throw new Error('报告文件内容为空，请重新生成后导出')
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
    // 将所有英文浏览器错误替换为中文提示
    let msg: string = error?.message || ''
    if (!msg || /failed to fetch/i.test(msg) || /network error/i.test(msg) || /load failed/i.test(msg)) {
      msg = '网络连接失败，报告链接可能已过期，请重新生成报告后再试'
    } else if (/cors/i.test(msg)) {
      msg = '跨域请求被拒绝，请联系管理员检查服务器配置'
    } else if (/timeout/i.test(msg) || /timed out/i.test(msg)) {
      msg = '下载请求超时，请检查网络后重试'
    } else if (/abort/i.test(msg)) {
      msg = '下载已取消'
    }
    ElMessage.error(msg || 'PDF 下载失败，请稍后重试')
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
