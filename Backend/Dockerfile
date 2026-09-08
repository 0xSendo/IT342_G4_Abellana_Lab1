# Build stage
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
ENV MAVEN_OPTS="-Xmx512m"
COPY pom.xml .
RUN mvn -B dependency:go-offline
COPY src ./src
RUN mvn -B -DskipTests clean package

# Runtime stage
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/internmatch-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8081
ENV SERVER_PORT=8081
ENV JAVA_OPTS="-Xmx320m -XX:+UseSerialGC -Djava.security.egd=file:/dev/./urandom"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]