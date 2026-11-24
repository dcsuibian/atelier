<!-- 404页面 -->
<template>
  <ArtException
    :data="{
      title: '404',
      desc: $t('exceptionPage.404'),
      btnText: $t('exceptionPage.gohome'),
      imgUrl,
    }"
  />
</template>

<script setup lang="ts">
import imgUrl from '@/assets/images/svg/404.svg'
import ArtException from '@/components/art/views/exception/art-exception.vue'
defineOptions({ name: 'NotFound' })
</script>
