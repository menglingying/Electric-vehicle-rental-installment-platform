<template>
  <div class="dashboard">
    <div class="panel">
      <div class="panel-title">
        <div>平台概览</div>
        <span class="link">服务到期时间：2030-12-31</span>
      </div>
      <div class="stats-row">
        <div v-for="item in topStats" :key="item.label" class="stat-card">
          <div class="stat-value">{{ item.value }}</div>
          <div class="stat-label">{{ item.label }}</div>
        </div>
      </div>
    </div>

    <div class="dashboard-grid" style="margin-top: 16px">
      <div class="panel">
        <div class="panel-title">
          <div>订单数据</div>
          <a-link>查看详情</a-link>
        </div>
        <div class="stats-row">
          <div v-for="item in orderStats" :key="item.label" class="stat-card">
            <div class="stat-value">{{ item.value }}</div>
            <div class="stat-label">{{ item.label }}</div>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-title">
          <div>昨日资金流水</div>
          <a-link>查看详情</a-link>
        </div>
        <div class="stats-row">
          <div v-for="item in financeStats" :key="item.label" class="stat-card">
            <div class="stat-value">{{ item.value }}</div>
            <div class="stat-label">{{ item.label }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const topStats = [
  { label: '订单总数', value: '--' },
  { label: '今日新增订单', value: '--' },
  { label: '待审核订单', value: '--' },
  { label: '逾期订单', value: '--' }
];

const orderStats = [
  { label: '今日新增订单总租金（元）', value: '****' },
  { label: '今日新增订单数（单）', value: '****' },
  { label: '订单总租金（元）', value: '****' },
  { label: '订单已收租金（元）', value: '****' },
  { label: '订单待收租金（元）', value: '****' },
  { label: '订单总数（单）', value: '****' }
];

const financeStats = [
  { label: '收入金额（元）', value: '0.00' },
  { label: '退款金额（元）', value: '0.00' },
  { label: '实收金额（元）', value: '0.00' }
];
</script>
