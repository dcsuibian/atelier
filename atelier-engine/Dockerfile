FROM eclipse-temurin:25-jdk AS builder

WORKDIR /build

COPY .mvn .mvn
COPY mvnw pom.xml ./
# 依赖写进普通镜像层而不是 cache mount：GitHub Actions 的 gha 缓存只导出镜像层，
# 不保留 cache mount，用 cache mount 的话 CI 上每次构建都会全量重新下载依赖
RUN ./mvnw dependency:go-offline -B

COPY src ./src
# maven.test.skip 连测试代码也不编译，比 skipTests 省时间
RUN ./mvnw package -Dmaven.test.skip=true -B \
    && mv target/atelier-engine-*.jar app.jar \
    && java -Djarmode=tools -jar app.jar extract --layers --destination extracted

FROM eclipse-temurin:25-jre

WORKDIR /app
# 按变动频率分层：依赖不变时前几层直接复用，推送和拉取只传最后的应用代码
COPY --from=builder /build/extracted/dependencies/ ./
COPY --from=builder /build/extracted/spring-boot-loader/ ./
COPY --from=builder /build/extracted/snapshot-dependencies/ ./
COPY --from=builder /build/extracted/application/ ./

ENV SPRING_PROFILES_ACTIVE=production
EXPOSE 80
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
