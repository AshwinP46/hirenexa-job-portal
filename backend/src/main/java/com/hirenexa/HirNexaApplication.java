package com.hirenexa;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * HireNexa - AI-powered Campus Recruitment Platform
 * Java Spring Boot Backend Application Entry Point
 *
 * @author Ashwin P
 * @version 1.0.0
 */
@SpringBootApplication
public class HirNexaApplication {

    public static void main(String[] args) {
        SpringApplication.run(HirNexaApplication.class, args);
        System.out.println("\n✅ HireNexa Backend is running at http://localhost:8080");
        System.out.println("📡 API Base: http://localhost:8080/api");
        System.out.println("📋 Health:   http://localhost:8080/api/health\n");
    }
}
