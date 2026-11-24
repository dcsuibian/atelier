-- ----------------------------
-- Table structure for project
-- ----------------------------
CREATE TABLE project (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner_id BIGINT NOT NULL REFERENCES "user" (id) ON DELETE RESTRICT,
    description TEXT NOT NULL,
    create_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    update_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 按负责人筛选，以及删除用户前查他是否还负责项目
CREATE INDEX idx_project_owner_id ON project (owner_id);

COMMENT ON TABLE project IS '项目表';

COMMENT ON COLUMN project.id IS '项目ID';

COMMENT ON COLUMN project.name IS '项目名称';

COMMENT ON COLUMN project.owner_id IS '负责人ID';

COMMENT ON COLUMN project.description IS '项目描述';

COMMENT ON COLUMN project.create_time IS '创建时间';

COMMENT ON COLUMN project.update_time IS '更新时间';
