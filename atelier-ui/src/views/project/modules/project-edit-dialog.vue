<template>
  <ElDialog
    v-model="visible"
    :title="project ? $t('project.edit') : $t('project.add')"
    width="480px"
    align-center
    @open="handleOpen"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="auto">
      <ElFormItem :label="$t('project.name')" prop="name">
        <ElInput v-model="form.name" />
      </ElFormItem>
      <ElFormItem :label="$t('project.owner')" prop="ownerId">
        <OwnerSelect v-model="form.ownerId" :owner="project?.owner" class="w-full" />
      </ElFormItem>
      <ElFormItem :label="$t('common.description')" prop="description">
        <ElInput v-model="form.description" type="textarea" :rows="3" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="visible = false">{{ $t('common.cancel') }}</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">{{ $t('common.submit') }}</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref } from 'vue'
import { ElButton, ElDialog, ElForm, ElFormItem, ElInput, ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { addProject, editProjectPartially } from '@/apis/project'
import type { Project } from '@/types'
import OwnerSelect from './owner-select.vue'

interface Props {
  /** 为 undefined 时是新增 */
  project?: Project
}

interface Emits {
  (e: 'submit'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = defineModel<boolean>('visible', { required: true })

interface Form {
  name: string
  ownerId?: number
  description: string
}

const createForm = (): Form => ({
  name: '',
  ownerId: undefined,
  description: '',
})

const { t } = useI18n()
const formRef = ref<FormInstance>()
const form = reactive<Form>(createForm())

// 与后端 Project 上的校验保持一致；描述可以不填
const rules = computed<FormRules<Form>>(() => ({
  name: [
    { required: true, message: t('project.enterName'), trigger: 'blur' },
    { max: 255, message: t('common.maxLength', { max: 255 }), trigger: 'blur' },
  ],
  ownerId: [{ required: true, message: t('project.selectOwner'), trigger: 'change' }],
}))

const submitting = ref(false)

const handleOpen = () => {
  const project = props.project
  Object.assign(
    form,
    project ? { name: project.name, ownerId: project.owner.id, description: project.description } : createForm(),
  )
  nextTick(() => formRef.value?.clearValidate())
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) {
    return
  }
  submitting.value = true
  const data = { name: form.name, owner: { id: form.ownerId! }, description: form.description }
  // 失败提示已由 http 层弹出，这里只管流程
  try {
    if (props.project) {
      await editProjectPartially(props.project.id, data)
    } else {
      await addProject(data)
    }
    ElMessage.success(props.project ? t('common.saveSuccess') : t('common.addSuccess'))
    visible.value = false
    emit('submit')
  } catch {
    // 已提示
  } finally {
    submitting.value = false
  }
}
</script>
