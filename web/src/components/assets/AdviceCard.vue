<script setup>
/**
 * 资产体检报告卡（合规版）：
 * 只客观陈述资产结构事实与历史规律性风险提示，不提供任何时点性投资建议
 */
defineProps({
  report: { type: Object, default: null },
})
</script>

<template>
  <div v-if="report" class="wm-card">
    <div class="card-title">🩻 资产体检报告</div>

    <div v-for="(f, i) in report.facts" :key="'f' + i" class="fact-row"><span>ℹ️</span>{{ f }}</div>
    <div v-for="(r, i) in report.riskNotes" :key="'r' + i" class="fact-row warn">
      <span>⚠️</span>{{ r }}
    </div>

    <div class="report-note">📖 想了解「资产配置」「波动率」等术语含义？试试 AI金融翻译器</div>
    <div class="disclaimer">{{ report.disclaimer }}</div>
  </div>
</template>

<style scoped>
.fact-row {
  display: flex;
  gap: 6px;
  font-size: 11.5px;
  line-height: 1.65;
  color: #4b5563;
  margin-bottom: 7px;
}

.fact-row.warn {
  background: #fef5ec;
  border-radius: 10px;
  padding: 7px 9px;
  color: #8a5a2b;
}

.report-note {
  font-size: 10.5px;
  color: var(--ios-blue);
  background: #eef4ff;
  border-radius: 10px;
  padding: 7px 9px;
  margin-top: 4px;
}

.disclaimer {
  font-size: 9.5px;
  color: #b0b5bd;
  text-align: center;
  margin-top: 7px;
}
</style>
