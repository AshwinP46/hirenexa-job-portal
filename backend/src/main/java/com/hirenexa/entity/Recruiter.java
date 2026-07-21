package com.hirenexa.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "recruiters")
public class Recruiter {

    @Id
    @Column(name = "id", nullable = false)
    private String id;

    @Column(name = "recruiter_name")
    private String recruiterName;

    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(name = "industry")
    private String industry;

    @Column(name = "website")
    private String website;

    @Column(name = "company_logo")
    private String companyLogo;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Recruiter() {}

    public Recruiter(String id, String recruiterName, String companyName, String industry, String website, String companyLogo, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.recruiterName = recruiterName;
        this.companyName = companyName;
        this.industry = industry;
        this.website = website;
        this.companyLogo = companyLogo;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRecruiterName() { return recruiterName; }
    public void setRecruiterName(String recruiterName) { this.recruiterName = recruiterName; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getIndustry() { return industry; }
    public void setIndustry(String industry) { this.industry = industry; }

    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }

    public String getCompanyLogo() { return companyLogo; }
    public void setCompanyLogo(String companyLogo) { this.companyLogo = companyLogo; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
