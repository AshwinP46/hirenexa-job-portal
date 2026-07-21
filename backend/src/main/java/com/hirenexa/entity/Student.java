package com.hirenexa.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;

@Entity
@Table(name = "students")
public class Student {

    @Id
    @Column(name = "id", nullable = false)
    private String id;

    @Column(name = "roll_number")
    private String rollNumber;

    @Column(name = "department")
    private String department;

    @Column(name = "cgpa")
    private Double cgpa;

    @Column(name = "year_of_study")
    private Integer yearOfStudy;

    @Column(name = "bio")
    private String bio;

    @Column(name = "resume_url")
    private String resumeUrl;

    @Column(name = "skills", columnDefinition = "text[]")
    @JdbcTypeCode(SqlTypes.ARRAY)
    private String[] skills;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Student() {}

    public Student(String id, String rollNumber, String department, Double cgpa, Integer yearOfStudy, String bio, String resumeUrl, String[] skills, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.rollNumber = rollNumber;
        this.department = department;
        this.cgpa = cgpa;
        this.yearOfStudy = yearOfStudy;
        this.bio = bio;
        this.resumeUrl = resumeUrl;
        this.skills = skills;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRollNumber() { return rollNumber; }
    public void setRollNumber(String rollNumber) { this.rollNumber = rollNumber; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public Double getCgpa() { return cgpa; }
    public void setCgpa(Double cgpa) { this.cgpa = cgpa; }

    public Integer getYearOfStudy() { return yearOfStudy; }
    public void setYearOfStudy(Integer yearOfStudy) { this.yearOfStudy = yearOfStudy; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getResumeUrl() { return resumeUrl; }
    public void setResumeUrl(String resumeUrl) { this.resumeUrl = resumeUrl; }

    public String[] getSkills() { return skills; }
    public void setSkills(String[] skills) { this.skills = skills; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
