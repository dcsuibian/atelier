-- 建 atelier 用户和库，用 postgres 超级用户执行一次：
--   psql -U postgres -f development/init.sql
-- 表由 Flyway 建，超级管理员 admin 由应用首次启动时创建。
--
-- 重置环境：DROP DATABASE atelier; DROP USER atelier; 然后从头来。

CREATE USER atelier WITH PASSWORD 'password';
-- template0：PostGIS、TimescaleDB 之类的镜像可能往 template1 里预装扩展
CREATE DATABASE atelier OWNER atelier TEMPLATE template0;
