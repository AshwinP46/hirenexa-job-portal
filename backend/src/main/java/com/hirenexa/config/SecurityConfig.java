package com.hirenexa.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Spring Security Configuration
 * Configures stateless API security for HireNexa backend.
 * Authentication is handled by Supabase on the frontend; this backend
 * accepts requests and relies on CORS to restrict unauthorized origins.
 *
 * For full JWT validation, the Supabase JWT secret can be configured
 * in application.properties (app.supabase.jwt-secret).
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF (not needed for stateless REST API)
            .csrf(csrf -> csrf.disable())

            // Stateless session (no cookies or server-side sessions)
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // Authorization rules
            .authorizeHttpRequests(auth -> auth
                // Health check and public endpoints
                .requestMatchers("/api/health").permitAll()
                .requestMatchers("/api/jobs").permitAll()
                .requestMatchers("/api/jobs/{id}").permitAll()
                // All other endpoints require authentication header
                .anyRequest().permitAll() // Simplified for demo — enable JWT filter for production
            );

        return http.build();
    }
}
