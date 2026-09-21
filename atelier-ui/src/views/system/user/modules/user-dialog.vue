<template>
  <ElDialog v-model="visible" :title="user ? '编辑用户' : '新增用户'" width="480px" align-center @open="handleOpen">
    <ElForm ref="formRef" v-loading="loading" :model="form" :rules="rules" label-width="80px">
      <ElFormItem label="用户名" prop="name">
        <ElInput v-model="form.name" :disabled="infoDisabled" placeholder="用于登录，不区分大小写" />
      </ElFormItem>
      <ElFormItem label="密码" prop="password">
        <ElInput
          v-model="form.password"
          :disabled="infoDisabled"
          type="password"
          show-password
          autocomplete="new-password"
          :placeholder="user ? '留空则不修改' : '6 到 72 个字符'"
        />
      </ElFormItem>
      <ElFormItem label="真实姓名" prop="realName">
        <ElInput v-model="form.realName" :disabled="infoDisabled" />
      </ElFormItem>
      <ElFormItem label="手机号" prop="phoneNumber">
        <ElInput v-model="form.phoneNumber" :disabled="infoDisabled" />
      </ElFormItem>
      <ElFormItem label="邮箱" prop="email">
        <ElInput v-model="form.email" :disabled="infoDisabled" />
      </ElFormItem>
      <ElFormItem label="性别" prop="gender">
        <ElRadioGroup v-model="form.gender" :disabled="infoDisabled">
          <ElRadio value="MALE">男</ElRadio>
          <ElRadio value="FEMALE">女</ElRadio>
          <ElRadio value="UNKNOWN">未知</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem label="状态" prop="status">
        <ElSwitch
          v-model="form.status"
          :disabled="infoDisabled || isSuperAdmin"
          active-value="ENABLED"
          inactive-value="DISABLED"
          active-text="启用"
          inactive-text="禁用"
        />
      </ElFormItem>
      <!-- 超级管理员的权限不走角色，给它分配角色没有意义 -->
      <ElFormItem v-if="rolesVisible" label="角色" prop="roleIds">
        <ElSelect
          v-model="form.roleIds"
          multiple
          filterable
          remote
          :remote-method="searchRoles"
          :loading="rolesLoading"
          placeholder="输入名称搜索"
        >
          <ElOption
            v-for="role in roleOptions"
            :key="role.id"
            :value="role.id"
            :label="'DISABLED' === role.status ? `${role.name}（已禁用）` : role.name"
          />
        </ElSelect>
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
import { type UserForm, addUser, editUserPartially, getRolesByUserId, setRolesByUserId } from '@/apis/user'
import { getRoles } from '@/apis/role'
import { useAuth } from '@/hooks/core/useAuth'
import { PERMISSIONS } from '@/constants/permission'
import { SUPER_ADMIN_ID } from '@/constants/user'
import type { Role, User, UserGender, UserStatus } from '@/types'

interface Props {
  /** 为 undefined 时是新增 */
  user?: User
}

interface Emits {
  (e: 'submit'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = defineModel<boolean>('visible', { required: true })

const { hasAuth } = useAuth()

const isSuperAdmin = computed(() => SUPER_ADMIN_ID === props.user?.id)
/** 只有分配角色权限的人也能打开编辑弹窗，这时资料只读 */
const infoDisabled = computed(() => undefined !== props.user && !hasAuth(PERMISSIONS.USER_EDIT))
const rolesVisible = computed(() => hasAuth(PERMISSIONS.USER_ASSIGN_ROLE) && !isSuperAdmin.value)

interface Form {
  name: string
  password: string
  realName: string
  phoneNumber: string
  email: string
  gender: UserGender
  status: UserStatus
  roleIds: number[]
}

const createForm = (): Form => ({
  name: '',
  password: '',
  realName: '',
  phoneNumber: '',
  email: '',
  gender: 'UNKNOWN',
  status: 'ENABLED',
  roleIds: [],
})

const formRef = ref<FormInstance>()
const form = reactive<Form>(createForm())

// 与后端 User 上的校验保持一致，后端仍会再校验一遍
const rules = computed<FormRules<Form>>(() => ({
  name: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 16, message: '长度在 2 到 16 个字符之间', trigger: 'blur' },
  ],
  password: [
    { required: !props.user, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 72, message: '长度在 6 到 72 个字符之间', trigger: 'blur' },
  ],
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
    { max: 20, message: '不能超过 20 个字符', trigger: 'blur' },
  ],
  phoneNumber: [{ min: 3, max: 20, message: '长度在 3 到 20 个字符之间', trigger: 'blur' }],
  email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }],
}))

const loading = ref(false)
const submitting = ref(false)

const rolesLoading = ref(false)
const roleOptions = ref<Role[]>([])

/**
 * 角色走远程搜索，不一次拉全量。已选中的角色要留在选项里，否则标签上只剩一个 id
 */
const searchRoles = async (searchText: string) => {
  rolesLoading.value = true
  try {
    const page = await getRoles({ searchText: toOptional(searchText), pageNumber: 1, pageSize: 20 })
    const selected = roleOptions.value.filter(role => form.roleIds.includes(role.id))
    roleOptions.value = [...selected, ...page.data.filter(role => !form.roleIds.includes(role.id))]
  } finally {
    rolesLoading.value = false
  }
}

const handleOpen = async () => {
  Object.assign(form, createForm())
  roleOptions.value = []
  nextTick(() => formRef.value?.clearValidate())

  const user = props.user
  if (user) {
    Object.assign(form, {
      name: user.name,
      realName: user.realName,
      phoneNumber: user.phoneNumber ?? '',
      email: user.email ?? '',
      gender: user.gender,
      status: user.status,
    })
  }
  if (!rolesVisible.value) {
    return
  }
  loading.value = true
  try {
    if (user) {
      const roles = await getRolesByUserId(user.id)
      roleOptions.value = roles
      form.roleIds = roles.map(role => role.id)
    }
    await searchRoles('')
  } finally {
    loading.value = false
  }
}

/** 空字符串不提交：PATCH 里 undefined 才表示不修改，而空串过不了后端的长度校验 */
const toOptional = (value: string) => ('' === value ? undefined : value)

const toUserForm = (): UserForm => ({
  name: form.name,
  password: toOptional(form.password),
  realName: form.realName,
  phoneNumber: toOptional(form.phoneNumber),
  email: toOptional(form.email),
  gender: form.gender,
  status: form.status,
})

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) {
    return
  }
  submitting.value = true
  // 失败提示已由 http 层弹出，这里只管流程
  try {
    let user: User
    if (!props.user) {
      user = await addUser(toUserForm())
    } else if (!infoDisabled.value) {
      user = await editUserPartially(props.user.id, toUserForm())
    } else {
      user = props.user
    }
    // 用户已经存下了，角色分配失败也要让列表刷新，免得再点提交重复新增
    visible.value = false
    emit('submit')
    if (rolesVisible.value) {
      await setRolesByUserId(user.id, form.roleIds)
    }
    ElMessage.success(props.user ? '保存成功' : '新增成功')
  } catch {
    // 已提示
  } finally {
    submitting.value = false
  }
}
</script>
