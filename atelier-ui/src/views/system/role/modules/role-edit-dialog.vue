<template>
  <ElDialog
    v-model="visible"
    :title="role ? $t('system.role.edit') : $t('system.role.add')"
    width="480px"
    align-center
    @open="handleOpen"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="auto">
      <ElFormItem :label="$t('system.role.name')" prop="name">
        <ElInput v-model="form.name" :placeholder="$t('system.role.namePlaceholder')" />
      </ElFormItem>
      <ElFormItem :label="$t('common.description')" prop="description">
        <ElInput v-model="form.description" type="textarea" :rows="3" />
      </ElFormItem>
      <ElFormItem :label="$t('common.status')" prop="status">
        <ElSwitch
          v-model="form.status"
          active-value="ENABLED"
          inactive-value="DISABLED"
          :active-text="$t('common.enabled')"
          :inactive-text="$t('common.disabled')"
        />
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
import { ElButton, ElDialog, ElForm, ElFormItem, ElInput, ElMessage, ElSwitch } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { addRole, editRolePartially } from '@/apis/role'
import type { Role, RoleStatus } from '@/types'

interface Props {
  /** 为 undefined 时是新增 */
  role?: Role
}

interface Emits {
  (e: 'submit'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = defineModel<boolean>('visible', { required: true })

interface Form {
  name: string
  description: string
  status: RoleStatus
}

const createForm = (): Form => ({
  name: '',
  description: '',
  status: 'ENABLED',
})

const { t } = useI18n()
const formRef = ref<FormInstance>()
const form = reactive<Form>(createForm())

// 与后端 Role 上的校验保持一致；描述不能为 null，但可以是空串
const rules = computed<FormRules<Form>>(() => ({
  name: [
    { required: true, message: t('system.role.enterName'), trigger: 'blur' },
    { max: 255, message: t('common.maxLength', { max: 255 }), trigger: 'blur' },
  ],
}))

const submitting = ref(false)

const handleOpen = () => {
  const role = props.role
  Object.assign(form, role ? { name: role.name, description: role.description, status: role.status } : createForm())
  nextTick(() => formRef.value?.clearValidate())
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) {
    return
  }
  submitting.value = true
  // 失败提示已由 http 层弹出，这里只管流程
  try {
    if (props.role) {
      await editRolePartially(props.role.id, { ...form })
    } else {
      await addRole({ ...form })
    }
    ElMessage.success(props.role ? t('common.saveSuccess') : t('common.addSuccess'))
    visible.value = false
    emit('submit')
  } catch {
    // 已提示
  } finally {
    submitting.value = false
  }
}
</script>
