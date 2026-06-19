FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN sed -i 's/\r$//' mvnw
RUN chmod +x mvnw
RUN ./mvnw dependency:go-offline
COPY src ./src/
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENV SPRING_PROFILES_ACTIVE=render
ENV JAVA_OPTS="-XX:TieredStopAtLevel=1 -XX:+UseSerialGC -XX:MaxRAMPercentage=75 -Dspring.jmx.enabled=false"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
