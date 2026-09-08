# Multi-stage Quarkus build
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml .
RUN mvn -q dependency:go-offline
COPY src src
RUN mvn -q package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /build/target/quarkus-app /app
RUN mkdir -p /tmp/ping/projects
EXPOSE 8080
CMD ["java", "-jar", "quarkus-run.jar"]
