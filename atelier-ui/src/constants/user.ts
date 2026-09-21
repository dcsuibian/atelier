/**
 * 超级管理员固定为 id 1，与后端 UserConstants.SUPER_ADMIN_ID 对应
 *
 * 后端对它有两处特判：可用权限为全部启用的权限，不走角色；不能被删除或禁用。
 * 前端据此隐藏删除按钮、锁住状态开关，别让人看见点不动的入口
 */
const SUPER_ADMIN_ID = 1

export { SUPER_ADMIN_ID }
