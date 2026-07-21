package com.hirenexa.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RootController {

    @GetMapping("/")
    public String root() {
        return "<h1>Welcome to HireNexa Spring Boot Backend API</h1>" +
               "<p>The server is running successfully!</p>" +
               "<p>Available API Endpoints:</p>" +
               "<ul>" +
               "<li><a href=\"/api/health\">/api/health</a> - System Health Status</li>" +
               "<li>/api/jobs - Job Management API</li>" +
               "<li>/api/applications - Job Applications API</li>" +
               "<li>/api/students - Student Profile API</li>" +
               "<li>/api/recruiters - Recruiter Profile API</li>" +
               "<li>/api/interviews - Interview Scheduling API</li>" +
               "</ul>" +
               "<br><p><i>Note: For the user interface, please run the React frontend on port 5173.</i></p>";
    }
}
