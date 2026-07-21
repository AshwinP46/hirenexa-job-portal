package com.hirenexa.service;

import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * MatchScoreService
 * Core business logic helper to calculate skill matching score
 */
@Service
public class MatchScoreService {

    public int computeMatchScore(String[] studentSkills, String[] jobSkills) {
        if (studentSkills == null || studentSkills.length == 0 || jobSkills == null || jobSkills.length == 0) {
            return 0;
        }
        
        Set<String> studentSkillsSet = new HashSet<>();
        for (String skill : studentSkills) {
            studentSkillsSet.add(skill.trim().toLowerCase());
        }
        
        long matched = Arrays.stream(jobSkills)
            .map(skill -> skill.trim().toLowerCase())
            .filter(studentSkillsSet::contains)
            .count();
            
        return (int) (matched * 100 / jobSkills.length);
    }
}
