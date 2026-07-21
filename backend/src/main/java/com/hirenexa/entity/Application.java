package com.hirenexa.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "applications")
public class Application {

    @Id
    @Column(name = "id", nullable = false)
    private String id;

    @Column(name = "student_id", nullable = false)
    private String studentId;

    @Column(name = "job_id", nullable = false)
    private String jobId;

    @Column(name = "status", nullable = false)
    private String status = "applied";

    @Column(name = "match_score")
    private Integer matchScore;

    @Column(name = "notes", columnDefinition = "text")
    private String notes;

    @Column(name = "applied_at")
    private LocalDateTime appliedAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Application() {}

    public Application(String id, String studentId, String jobId, String status, Integer matchScore, String notes, LocalDateTime appliedAt, LocalDateTime updatedAt) {
        this.id = id;
        this.studentId = studentId;
        this.jobId = jobId;
        this.status = status;
        this.matchScore = matchScore;
        this.notes = notes;
        this.appliedAt = appliedAt;
        this.updatedAt = updatedAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public String getJobId() { return jobId; }
    public void setJobId(String jobId) { this.jobId = jobId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getMatchScore() { return matchScore; }
    public void setMatchScore(Integer matchScore) { this.matchScore = matchScore; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getAppliedAt() { return appliedAt; }
    public void setAppliedAt(LocalDateTime appliedAt) { this.appliedAt = appliedAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
