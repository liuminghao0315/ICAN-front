export type ReportPdfRefreshFn = () => Promise<string | null | undefined>

export type ResolveReportPdfUrlOptions = {
  currentUrl?: string | null
  refresh?: ReportPdfRefreshFn
}

export async function resolveReportPdfUrl(options: ResolveReportPdfUrlOptions): Promise<string | null> {
  if (options.currentUrl) {
    return options.currentUrl
  }

  if (!options.refresh) {
    return null
  }

  const refreshedUrl = await options.refresh()
  return refreshedUrl || null
}
