<template>
  <ElDialog
    v-model="visible"
    :title="user ? $t('system.user.edit') : $t('system.user.add')"
    width="480px"
    align-center
    @open="handleOpen"
  >
    <ElForm ref="formRef" v-loading="loading" :model="form" :rules="rules" label-width="auto">
      <ElFormItem :label="$t('system.user.name')" prop="name">
        <ElInput v-model="form.name" :disabled="infoDisabled" :placeholder="$t('system.user.namePlaceholder')" />
      </ElFormItem>
      <ElFormItem :label="$t('system.user.password')" prop="password">
        <ElInput
          v-model="form.password"
          :disabled="infoDisabled"
          type="password"
          show-password
          autocomplete="new-password"
          :placeholder="user ? $t('system.user.passwordPlaceholderEdit') : $t('system.user.passwordPlaceholderNew')"
        />
      </ElFormItem>
      <ElFormItem :label="$t('system.user.realName')" prop="realName">
        <ElInput v-model="form.realName" :disabled="infoDisabled" />
      </ElFormItem>
      <ElFormItem :label="$t('system.user.phoneNumber')" prop="phoneNumber">
        <ElInput v-model="form.phoneNumber" :disabled="infoDisabled" />
      </ElFormItem>
      <ElFormItem :label="$t('system.user.email')" prop="email">
        <ElInput v-model="form.email" :disabled="infoDisabled" />
      </ElFormItem>
      <ElFormItem :label="$t('system.user.gender')" prop="gender">
        <ElRadioGroup v-model="form.gender" :disabled="infoDisabled">
          <ElRadio value="MALE">{{ $t('system.user.genders.MALE') }}</ElRadio>
          <ElRadio value="FEMALE">{{ $t('system.user.genders.FEMALE') }}</ElRadio>
          <ElRadio value="UNKNOWN">{{ $t('system.user.genders.UNKNOWN') }}</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem :label="$t('common.status')" prop="status">
        <ElSwitch
          v-model="form.status"
          :disabled="infoDisabled || isSuperAdmin"
          active-value="ENABLED"
          inactive-value="DISABLED"
          :active-text="$t('common.enabled')"
          :inactive-text="$t('common.disabled')"
        />
      </ElFormItem>
      <!-- 超级管理员的权限不走角色，给它分配角色没有意义 -->
      <ElFormItem v-if="rolesVisible" :label="$t('system.user.roles')" prop="roleIds">
        <ElSelect
          v-model="form.roleIds"
          multiple
          filterable
          remote
          :remote-method="searchRoles"
          :loading="rolesLoading"
          :placeholder="$t('system.user.rolesPlaceholder')"
        >
          <ElOption
            v-for="role in roleOptions"
            :key="role.id"
            :value="role.id"
            :label="'DISABLED' === role.status ? $t('system.user.roleDisabled', { name: role.name }) : role.name"
          />
        </ElSelect>
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
import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElRadio,
  ElRadioGroup,
  ElSelect,
  ElSwitch,
  vLoading,
} from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useI18n } from 'vue-i18n'
import {
  type UserAddDto,
  type UserEditPartiallyDto,
  addUser,
  editUserPartially,
  getRolesByUserId,
  setRolesByUserId,
} from '@/apis/user'
import { getRoles } from '@/apis/role'
import { usePermissionStore } from '@/stores/permission'
import { useSessionStore } from '@/stores/session'
import { PERMISSIONS } from '@/constants/permission'
import { SUPER_ADMIN_USER_ID } from '@/constants/user'
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

const permissionStore = usePermissionStore()
const sessionStore = useSessionStore()
const { t } = useI18n()

const isSuperAdmin = computed(() => SUPER_ADMIN_USER_ID === props.user?.id)
/** 只有分配角色权限的人也能打开编辑弹窗，这时资料只读 */
const infoDisabled = computed(() => undefined !== props.user && !permissionStore.check(PERMISSIONS.USER_EDIT))
const rolesVisible = computed(() => permissionStore.check(PERMISSIONS.USER_ASSIGN_ROLE) && !isSuperAdmin.value)

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
    { required: true, message: t('system.user.enterName'), trigger: 'blur' },
    { min: 2, max: 16, message: t('common.lengthBetween', { min: 2, max: 16 }), trigger: 'blur' },
  ],
  password: [
    { required: !props.user, message: t('system.user.enterPassword'), trigger: 'blur' },
    { min: 6, max: 72, message: t('common.lengthBetween', { min: 6, max: 72 }), trigger: 'blur' },
  ],
  realName: [
    { required: true, message: t('system.user.enterRealName'), trigger: 'blur' },
    { max: 20, message: t('common.maxLength', { max: 20 }), trigger: 'blur' },
  ],
  phoneNumber: [{ min: 3, max: 20, message: t('common.lengthBetween', { min: 3, max: 20 }), trigger: 'blur' }],
  email: [{ type: 'email', message: t('system.user.invalidEmail'), trigger: 'blur' }],
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
    const page = await getRoles({ searchText: toOptional(searchText) }, 1, 20)
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

const toAddDto = (): UserAddDto => ({
  name: form.name,
  password: form.password,
  realName: form.realName,
  phoneNumber: toOptional(form.phoneNumber),
  email: toOptional(form.email),
  gender: form.gender,
  status: form.status,
})

// 编辑时密码留空表示不改
const toEditPartiallyDto = (): UserEditPartiallyDto => ({ ...toAddDto(), password: toOptional(form.password) })

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
      user = await addUser(toAddDto())
    } else if (!infoDisabled.value) {
      user = await editUserPartially(props.user.id, toEditPartiallyDto())
    } else {
      user = props.user
    }
    // 用户已经存下了，角色分配失败也要让列表刷新，免得再点提交重复新增
    visible.value = false
    emit('submit')
    if (rolesVisible.value) {
      await setRolesByUserId(user.id, form.roleIds)
    }
    // 改的是自己：页头的资料要跟着变，角色变了权限也要跟着变
    if (user.id === sessionStore.user?.id) {
      await sessionStore.refresh()
    }
    ElMessage.success(props.user ? t('common.saveSuccess') : t('common.addSuccess'))
  } catch {
    // 已提示
  } finally {
    submitting.value = false
  }
}
</script>
