package com.hirenexa.controller;

import com.hirenexa.entity.Application;
import com.hirenexa.service.ApplicationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    @Autowired
    private ApplicationService applicationService;

    @GetMapping
    public List<Application> getApplications(
            @RequestParam(required = false) String studentId,
            @RequestParam(required = false) String jobId) {
        if (studentId != null) {
            return applicationService.getApplicationsByStudent(studentId);
        } else if (jobId != null) {
            return applicationService.getApplicationsByJob(jobId);
        }
        throw new IllegalArgumentException("Either studentId or jobId parameter is required");
    }

    @PostMapping
    public Application apply(@RequestBody Map<String, String> request) {
        String studentId = request.get("studentId");
        String jobId = request.get("jobId");
        String notes = request.get("notes");
        return applicationService.applyToJob(studentId, jobId, notes);
    }

    @PatchMapping("/{id}/status")
    public Application updateStatus(@PathVariable String id, @RequestBody Map<String, String> request) {
        String status = request.get("status");
        return applicationService.updateStatus(id, status);
    }
}
