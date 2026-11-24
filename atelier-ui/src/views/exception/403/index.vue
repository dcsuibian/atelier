<!-- 403页面 -->
<template>
  <ArtException
    :data="{
      title: '403',
      desc: $t('exceptionPage.403'),
      btnText: $t('exceptionPage.gohome'),
      imgUrl,
    }"
  />
</template>

<script setup lang="ts">
import imgUrl from '@/assets/images/svg/403.svg'
import ArtException from '@/components/art/views/exception/art-exception.vue'
defineOptions({ name: 'Forbidden' })
</script>
