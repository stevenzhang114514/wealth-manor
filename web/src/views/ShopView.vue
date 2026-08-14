<script setup>
/**
 * 装扮商城：装饰/皮肤/称号三栏，金币钻石购买，装备后同步庄园实景
 */
import { ref, computed, onMounted } from 'vue'
import { getShopItems, buyShopItem, equipShopItem } from '../api/shop.js'
import { useManorStore } from '../stores/manor.js'
import { toast } from '../utils/toast.js'
import BackHeader from '../components/BackHeader.vue'
import SegmentedControl from '../components/SegmentedControl.vue'

const manor = useManorStore()
const items = ref([])
const tab = ref('decoration')
const buying = ref('')

const TABS = [
  { key: 'decoration', label: '🛋️ 装饰' },
  { key: 'skin', label: '🏰 皮肤' },
  { key: 'title', label: '🎖️ 称号' },
]

const RARITY = {
  normal: { label: '普通', color: '#8a8f99' },
  rare: { label: '稀有', color: '#4e8c4e' },
  epic: { label: '史诗', color: '#8e7cc3' },
  legend: { label: '传说', color: 'var(--ios-blue)' },
}

const filtered = computed(() => items.value.filter((i) => i.category === tab.value))

const load = async () => {
  const res = await getShopItems()
  items.value = res.items
  manor.setState(res.manor)
}

onMounted(load)

const priceText = (i) => (i.price.coins ? `🪙 ${i.price.coins}` : `💎 ${i.price.diamonds}`)

const onBuy = async (item) => {
  buying.value = item.id
  try {
    const res = await buyShopItem(item.id)
    manor.setState(res.manor)
    await load()
    toast(`购买成功：${item.emoji} ${item.name} 已放入庄园仓库`, 'success')
  } catch {
    // 错误提示由拦截器统一弹出
  } finally {
    buying.value = ''
  }
}

const onEquip = async (item) => {
  await equipShopItem(item.id)
  await load()
  toast(
    item.equipped ? `已卸下「${item.name}」` : `${item.emoji} 「${item.name}」已装扮到庄园`,
    'success',
  )
}
</script>

<template>
  <div class="shop-view">
    <BackHeader title="🛍️ 庄园商城" />

    <!-- 余额条 -->
    <div class="balance-bar">
      <span class="balance-title">我的余额</span>
      <span class="wm-chip">🪙 {{ manor.coins }}</span>
      <span class="wm-chip">💎 {{ manor.state?.diamonds ?? 0 }}</span>
      <span class="balance-tip">金币=理财行为 · 钻石=里程碑成就</span>
    </div>

    <!-- 分类页签 -->
    <SegmentedControl v-model="tab" :options="TABS" />

    <!-- 商品列表 -->
    <div class="item-grid">
      <div v-for="item in filtered" :key="item.id" class="item-card">
        <div class="item-emoji">{{ item.emoji }}</div>
        <div class="item-info">
          <div class="item-name">
            {{ item.name }}
            <span
              class="rarity-tag"
              :style="{ color: RARITY[item.rarity].color, borderColor: RARITY[item.rarity].color }"
            >
              {{ RARITY[item.rarity].label }}
            </span>
          </div>
          <div class="item-desc">{{ item.desc }}</div>
          <div class="item-foot">
            <span class="item-price" :class="{ diamond: item.price.diamonds }">{{
              priceText(item)
            }}</span>
            <button
              v-if="!item.owned"
              class="wm-btn item-btn"
              :disabled="buying === item.id"
              @click="onBuy(item)"
            >
              购买
            </button>
            <button
              v-else
              class="wm-btn item-btn"
              :class="item.equipped ? 'ghost' : ''"
              @click="onEquip(item)"
            >
              {{ item.equipped ? '已装扮' : '装扮' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="shop-tip">💡 装饰装备后回到庄园即可看到实景摆件</div>
  </div>
</template>

<style scoped>
.shop-view {
  padding-bottom: 14px;
}

.balance-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 10px 12px 0;
  background: linear-gradient(135deg, #fff6dd, #ffe9b0);
  border: 1px solid #f2dc9a;
  border-radius: 12px;
  padding: 9px 12px;
}

.balance-title {
  font-size: 12px;
  font-weight: 800;
  color: #8a6d1f;
}

.balance-tip {
  margin-left: auto;
  font-size: 9.5px;
  color: #a08a4e;
}

.item-grid {
  margin: 10px 12px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-card {
  display: flex;
  gap: 12px;
  background: #fff;
  border-radius: var(--radius);
  padding: 12px;
  box-shadow: 0 2px 8px rgba(31, 45, 61, 0.04);
}

.item-emoji {
  font-size: 34px;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: #f4f6f8;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 13px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 6px;
}

.rarity-tag {
  font-size: 9px;
  font-weight: 700;
  border: 1px solid;
  border-radius: 999px;
  padding: 0 6px;
}

.item-desc {
  font-size: 10.5px;
  color: var(--text-sub);
  margin: 3px 0 8px;
}

.item-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-price {
  font-size: 12px;
  font-weight: 800;
  color: #b07d1a;
}

.item-price.diamond {
  color: #7b68b8;
}

.item-btn {
  font-size: 11px;
  padding: 6px 14px;
}

.shop-tip {
  text-align: center;
  font-size: 10.5px;
  color: var(--text-sub);
  margin-top: 10px;
}
</style>
