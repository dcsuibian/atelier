<!-- 工作台页面。数据是假的，但别当演示内容删：它是卡片、图表组件的用法示例，下游拼 dashboard 时照着改 -->
<template>
  <div>
    <CardList></CardList>

    <ElRow :gutter="20">
      <ElCol :sm="24" :md="12" :lg="10">
        <ActiveUser />
      </ElCol>
      <ElCol :sm="24" :md="12" :lg="14">
        <SalesOverview />
      </ElCol>
    </ElRow>

    <ElRow :gutter="20">
      <ElCol :sm="24" :md="24" :lg="12">
        <NewUser />
      </ElCol>
      <ElCol :sm="24" :md="12" :lg="6">
        <Dynamic />
      </ElCol>
      <ElCol :sm="24" :md="12" :lg="6">
        <TodoList />
      </ElCol>
    </ElRow>

    <AboutProject />
  </div>
</template>

<script setup lang="ts">
import CardList from './modules/card-list.vue'
import ActiveUser from './modules/active-user.vue'
import SalesOverview from './modules/sales-overview.vue'
import NewUser from './modules/new-user.vue'
import Dynamic from './modules/dynamic-stats.vue'
import TodoList from './modules/todo-list.vue'
import AboutProject from './modules/about-project.vue'

defineOptions({ name: 'Console' })
</script>
