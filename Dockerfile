# Stage 1 — Build với Maven image chính thức (không cần apt-get install maven)
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app
# Copy pom.xml trước để Docker cache layer dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn package -DskipTests -q

# Stage 2 — Runtime với JRE nhẹ
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p uploads
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
