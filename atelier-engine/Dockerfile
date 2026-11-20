FROM eclipse-temurin:25-jdk AS builder

WORKDIR /build

COPY .mvn .mvn
COPY mvnw pom.xml ./
# 依赖写进普通镜像层而不是 cache mount：GitHub Actions 的 gha 缓存只导出镜像层，
# 不保留 cache mount，用 cache mount 的话 CI 上每次构建都会全量重新下载依赖
RUN ./mvnw dependency:go-offline -B

COPY src ./src
RUN ./mvnw package -DskipTests -B \
    && mv target/atelier-engine-*.jar app.jar

FROM eclipse-temurin:25-jre

WORKDIR /app
COPY --from=builder /build/app.jar app.jar

ENV SPRING_PROFILES_ACTIVE=production
EXPOSE 80
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
