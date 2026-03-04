/**
 * 【全模态智能事件流】数据验证工具
 * 
 * 用于验证 timelineEvents 数据结构的完整性和正确性
 */

import { mockAnalysisResult } from '@/data/mockAnalysisResult'
import type { TimelineEvent } from '@/data/mockAnalysisResult'

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  statistics: {
    totalEvents: number
    speechEvents: number
    visualEvents: number
    audioEffectEvents: number
    highRiskEvents: number
    mediumRiskEvents: number
    lowRiskEvents: number
    visualEventsWithBBox: number
    coverageSeconds: number
  }
}

export function verifyTimelineEvents(): ValidationResult {
  const events = mockAnalysisResult.timelineEvents
  const errors: string[] = []
  const warnings: string[] = []
  
  // 统计数据
  let speechCount = 0
  let visualCount = 0
  let audioEffectCount = 0
  let highRiskCount = 0
  let mediumRiskCount = 0
  let lowRiskCount = 0
  let visualWithBBoxCount = 0
  
  // 验证每个事件
  events.forEach((event, index) => {
    // 1. 检查必填字段
    if (!event.id) errors.push(`事件 #${index}: 缺少 id`)
    if (!event.modality) errors.push(`事件 #${index}: 缺少 modality`)
    if (event.startTime === undefined) errors.push(`事件 #${index}: 缺少 startTime`)
    if (event.endTime === undefined) errors.push(`事件 #${index}: 缺少 endTime`)
    if (event.riskScore === undefined) errors.push(`事件 #${index}: 缺少 riskScore`)
    
    // 2. 检查时间逻辑
    if (event.startTime >= event.endTime) {
      errors.push(`事件 ${event.id}: startTime (${event.startTime}) >= endTime (${event.endTime})`)
    }
    
    // 3. 统计模态类型
    if (event.modality === 'speech') {
      speechCount++
      const speechEvent = event as any
      if (!speechEvent.transcript) warnings.push(`事件 ${event.id}: Speech 卡片缺少 transcript`)
    } else if (event.modality === 'visual') {
      visualCount++
      const visualEvent = event as any
      if (!visualEvent.detectionLabel) warnings.push(`事件 ${event.id}: Visual 卡片缺少 detectionLabel`)
      if (visualEvent.boundingBox) visualWithBBoxCount++
    } else if (event.modality === 'audio-effect') {
      audioEffectCount++
      const audioEvent = event as any
      if (!audioEvent.description) warnings.push(`事件 ${event.id}: AudioEffect 卡片缺少 description`)
    }
    
    // 4. 统计风险等级（根据 riskScore 计算）
    if (event.riskScore > 70) highRiskCount++
    else if (event.riskScore >= 40) mediumRiskCount++
    else lowRiskCount++
  })
  
  // 5. 检查时间覆盖率
  const videoDuration = mockAnalysisResult.videoInfo.duration
  const coverageSet = new Set<number>()
  events.forEach(event => {
    for (let t = Math.floor(event.startTime); t <= Math.floor(event.endTime); t++) {
      coverageSet.add(t)
    }
  })
  const coverageSeconds = coverageSet.size
  const coveragePercent = (coverageSeconds / videoDuration * 100).toFixed(1)
  
  if (coveragePercent < '80') {
    warnings.push(`时间覆盖率仅为 ${coveragePercent}%，建议至少达到 80%`)
  }
  
  // 6. 检查排序
  for (let i = 1; i < events.length; i++) {
    if (events[i].startTime < events[i - 1].startTime) {
      errors.push(`事件排序错误: ${events[i].id} (${events[i].startTime}s) 应该在 ${events[i - 1].id} (${events[i - 1].startTime}s) 之前`)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    statistics: {
      totalEvents: events.length,
      speechEvents: speechCount,
      visualEvents: visualCount,
      audioEffectEvents: audioEffectCount,
      highRiskEvents: highRiskCount,
      mediumRiskEvents: mediumRiskCount,
      lowRiskEvents: lowRiskCount,
      visualEventsWithBBox: visualWithBBoxCount,
      coverageSeconds
    }
  }
}

// 控制台打印验证结果
export function printValidationReport() {
  const result = verifyTimelineEvents()
  
  console.log('='.repeat(60))
  console.log('【全模态智能事件流】数据验证报告')
  console.log('='.repeat(60))
  
  if (result.isValid) {
    console.log('✅ 验证通过！数据结构完整且正确。')
  } else {
    console.log('❌ 验证失败！发现以下错误：')
    result.errors.forEach(err => console.error(`  - ${err}`))
  }
  
  if (result.warnings.length > 0) {
    console.log('\n⚠️  警告：')
    result.warnings.forEach(warn => console.warn(`  - ${warn}`))
  }
  
  console.log('\n📊 统计数据：')
  console.log(`  总事件数: ${result.statistics.totalEvents}`)
  console.log(`  ├─ Speech: ${result.statistics.speechEvents}`)
  console.log(`  ├─ Visual: ${result.statistics.visualEvents} (含检测框: ${result.statistics.visualEventsWithBBox})`)
  console.log(`  └─ AudioEffect: ${result.statistics.audioEffectEvents}`)
  console.log(`\n  风险分布:`)
  console.log(`  ├─ 高风险: ${result.statistics.highRiskEvents}`)
  console.log(`  ├─ 中风险: ${result.statistics.mediumRiskEvents}`)
  console.log(`  └─ 低风险: ${result.statistics.lowRiskEvents}`)
  console.log(`\n  时间覆盖: ${result.statistics.coverageSeconds}/${mockAnalysisResult.videoInfo.duration} 秒 (${(result.statistics.coverageSeconds / mockAnalysisResult.videoInfo.duration * 100).toFixed(1)}%)`)
  
  console.log('='.repeat(60))
  
  return result
}
