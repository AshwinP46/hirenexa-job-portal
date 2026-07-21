package com.hirenexa.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class HealthController {

    @GetMapping("/api/health")
    public Map<String, Object> health() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "UP");
        status.put("service", "HireNexa Java Spring Boot Backend Service");
        status.put("version", "1.0.0");
        status.put("javaVersion", System.getProperty("java.version"));
        status.put("timestamp", System.currentTimeMillis());
        return status;
    }
}
