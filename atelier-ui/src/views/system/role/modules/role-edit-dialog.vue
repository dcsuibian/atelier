<template>
  <ElDialog v-model="visible" :title="role ? '编辑角色' : '新增角色'" width="480px" align-center @open="handleOpen">
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="80px">
      <ElFormItem label="角色名称" prop="name">
        <ElInput v-model="form.name" placeholder="不区分大小写，不能重复" />
      </ElFormItem>
      <ElFormItem label="描述" prop="description">
        <ElInput v-model="form.description" type="textarea" :rows="3" />
      </ElFormItem>
      <ElFormItem label="状态" prop="status">
        <ElSwitch
          v-model="form.status"
          active-value="ENABLED"
          inactive-value="DISABLED"
          active-text="启用"
          inactive-text="禁用"
        />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">提交</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
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

const formRef = ref<FormInstance>()
const form = reactive<Form>(createForm())

// 与后端 Role 上的校验保持一致；描述不能为 null，但可以是空串
const rules: FormRules<Form> = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { max: 255, message: '不能超过 255 个字符', trigger: 'blur' },
  ],
}

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
    ElMessage.success(props.role ? '保存成功' : '新增成功')
    visible.value = false
    emit('submit')
  } catch {
    // 已提示
  } finally {
    submitting.value = false
  }
}
</script>
