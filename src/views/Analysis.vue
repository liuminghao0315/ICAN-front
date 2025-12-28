<template>
  <div class="analysis-page">
    <div class="header-actions">
      <h2 class="page-title">分析结果</h2>
    </div>
    
    <el-card class="content-card" shadow="never">
      <el-empty description="分析功能开发中...">
        <template #image>
          <el-icon :size="80" color="#909399"><DataAnalysis /></el-icon>
        </template>
        <p class="coming-soon-text">
          多模态视频分析功能即将上线，敬请期待！
        </p>
        <el-button type="primary" @click="$router.push('/upload')">
          先去上传视频
        </el-button>
      </el-empty>
    </el-card>
    
    <!-- 功能预览 -->
    <el-row :gutter="20" class="feature-preview">
      <el-col :xs="24" :sm="12" :lg="8">
        <el-card class="feature-card" shadow="hover">
          <div class="feature-icon" style="--color: #667eea">
            <el-icon :size="32"><VideoCamera /></el-icon>
          </div>
          <h3>视频特征分析</h3>
          <p>场景识别、人脸检测、关键帧提取</p>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :lg="8">
        <el-card class="feature-card" shadow="hover">
          <div class="feature-icon" style="--color: #f093fb">
            <el-icon :size="32"><Microphone /></el-icon>
          </div>
          <h3>音频分析</h3>
          <p>语音转文字、情感识别、声纹分析</p>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :lg="8">
        <el-card class="feature-card" shadow="hover">
          <div class="feature-icon" style="--color: #4facfe">
            <el-icon :size="32"><Document /></el-icon>
          </div>
          <h3>文本分析</h3>
          <p>主题提取、关键词识别、情感倾向</p>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :lg="8">
        <el-card class="feature-card" shadow="hover">
          <div class="feature-icon" style="--color: #43e97b">
            <el-icon :size="32"><School /></el-icon>
          </div>
          <h3>高校身份识别</h3>
          <p>自动识别视频中的高校相关信息</p>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :lg="8">
        <el-card class="feature-card" shadow="hover">
          <div class="feature-icon" style="--color: #fa709a">
            <el-icon :size="32"><Warning /></el-icon>
          </div>
          <h3>风险预警</h3>
          <p>舆论倾向预测、风险等级评估</p>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :lg="8">
        <el-card class="feature-card" shadow="hover">
          <div class="feature-icon" style="--color: #ffecd2">
            <el-icon :size="32"><TrendCharts /></el-icon>
          </div>
          <h3>可视化报告</h3>
          <p>数据图表展示、PDF报告导出</p>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped lang="scss">
.analysis-page {
  .header-actions {
    margin-bottom: 20px;
    
    .page-title {
      font-size: 20px;
      font-weight: 600;
      margin: 0;
    }
  }
  
  .content-card {
    border-radius: 12px;
    margin-bottom: 30px;
    
    .coming-soon-text {
      color: #909399;
      margin: 16px 0;
    }
  }
  
  .feature-preview {
    .el-col {
      margin-bottom: 20px;
    }
    
    .feature-card {
      border-radius: 12px;
      text-align: center;
      padding: 20px;
      cursor: default;
      transition: transform 0.3s;
      
      &:hover {
        transform: translateY(-4px);
      }
      
      .feature-icon {
        width: 64px;
        height: 64px;
        border-radius: 16px;
        background: linear-gradient(135deg, var(--color), color-mix(in srgb, var(--color) 60%, white));
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 16px;
        color: #fff;
      }
      
      h3 {
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 8px;
        color: #303133;
      }
      
      p {
        font-size: 13px;
        color: #909399;
        margin: 0;
      }
    }
  }
}
</style>

