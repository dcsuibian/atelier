-- ----------------------------
-- Table structure for user
-- ----------------------------
CREATE TABLE "user" (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(16) NOT NULL,
    "password" TEXT NOT NULL,
    phone_number VARCHAR(20),
    real_name VARCHAR(20) NOT NULL,
    avatar TEXT,
    email VARCHAR(255),
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('MALE', 'FEMALE', 'UNKNOWN')),
    "status" VARCHAR(10) NOT NULL CHECK ("status" IN ('ENABLED', 'DISABLED')),
    create_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    update_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 用户名、邮箱不区分大小写。接口层先查重给出具体文案，这里兜底并发下的重名
CREATE UNIQUE INDEX idx_user_name ON "user" (LOWER(name));

CREATE UNIQUE INDEX idx_user_email ON "user" (LOWER(email))
WHERE
    email IS NOT NULL;

CREATE INDEX idx_user_phone_number ON "user" (phone_number)
WHERE
    phone_number IS NOT NULL;

COMMENT ON TABLE "user" IS '用户表';

COMMENT ON COLUMN "user".id IS '用户ID';

COMMENT ON COLUMN "user".name IS '用户名（不区分大小写）';

COMMENT ON COLUMN "user"."password" IS '密码（哈希）';

COMMENT ON COLUMN "user".phone_number IS '手机号';

COMMENT ON COLUMN "user".real_name IS '真实姓名';

COMMENT ON COLUMN "user".avatar IS '头像URL';

COMMENT ON COLUMN "user".email IS '邮箱（不区分大小写）';

COMMENT ON COLUMN "user".gender IS '性别';

COMMENT ON COLUMN "user"."status" IS '状态';

COMMENT ON COLUMN "user".create_time IS '创建时间';

COMMENT ON COLUMN "user".update_time IS '更新时间';

-- ----------------------------
-- Table structure for role
-- ----------------------------
CREATE TABLE role (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    "status" VARCHAR(10) NOT NULL CHECK ("status" IN ('ENABLED', 'DISABLED')),
    create_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    update_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 接口层先查重给出具体文案，这里兜底并发下的重名
CREATE UNIQUE INDEX idx_role_name ON role (name);

COMMENT ON TABLE role IS '角色表';

COMMENT ON COLUMN role.id IS '角色ID';

COMMENT ON COLUMN role.name IS '角色名称';

COMMENT ON COLUMN role.description IS '角色描述';

COMMENT ON COLUMN role."status" IS '状态';

COMMENT ON COLUMN role.create_time IS '创建时间';

COMMENT ON COLUMN role.update_time IS '更新时间';

-- ----------------------------
-- Table structure for permission
-- ----------------------------
CREATE TABLE permission (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    "status" VARCHAR(10) NOT NULL CHECK ("status" IN ('ENABLED', 'DISABLED')),
    create_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    update_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_permission_code ON permission (code);

COMMENT ON TABLE permission IS '权限表';

COMMENT ON COLUMN permission.id IS '权限ID';

COMMENT ON COLUMN permission.code IS '权限代码';

COMMENT ON COLUMN permission.name IS '权限名称';

COMMENT ON COLUMN permission.description IS '权限描述';

COMMENT ON COLUMN permission."status" IS '状态';

COMMENT ON COLUMN permission.create_time IS '创建时间';

COMMENT ON COLUMN permission.update_time IS '更新时间';

-- ----------------------------
-- Table structure for user_role
-- ----------------------------
CREATE TABLE user_role (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES "user" (id) ON DELETE RESTRICT,
    role_id BIGINT NOT NULL REFERENCES role (id) ON DELETE RESTRICT,
    create_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_user_role_user_role ON user_role (user_id, role_id);

-- 反向查询用
CREATE INDEX idx_user_role_role ON user_role (role_id);

COMMENT ON TABLE user_role IS '用户角色关联表';

COMMENT ON COLUMN user_role.id IS '关联ID';

COMMENT ON COLUMN user_role.user_id IS '用户ID';

COMMENT ON COLUMN user_role.role_id IS '角色ID';

COMMENT ON COLUMN user_role.create_time IS '创建时间（即把角色分配给用户的时间）';

-- ----------------------------
-- Table structure for role_permission
-- ----------------------------
CREATE TABLE role_permission (
    id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL REFERENCES role (id) ON DELETE RESTRICT,
    permission_id BIGINT NOT NULL REFERENCES permission (id) ON DELETE RESTRICT,
    create_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_role_permission_role_permission ON role_permission (role_id, permission_id);

-- 反向查询用
CREATE INDEX idx_role_permission_permission ON role_permission (permission_id);

COMMENT ON TABLE role_permission IS '角色权限关联表';

COMMENT ON COLUMN role_permission.id IS '关联ID';

COMMENT ON COLUMN role_permission.role_id IS '角色ID';

COMMENT ON COLUMN role_permission.permission_id IS '权限ID';

COMMENT ON COLUMN role_permission.create_time IS '创建时间（即把权限分配给角色的时间）';
