package com.easyjobspot.backend.config;

import com.easyjobspot.backend.job.entity.Job;
import com.easyjobspot.backend.job.repository.JobRepository;
import com.easyjobspot.backend.user.entity.User;
import com.easyjobspot.backend.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class DemoDataInitializer {

    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner createDemoData() {
        return args -> {

            // ===== USERS =====
            if (!userRepository.existsByEmail("rahul@gmail.com")) {
                userRepository.save(User.builder()
                        .name("Rahul Kumar")
                        .email("rahul@gmail.com")
                        .password(passwordEncoder.encode("12345678"))
                        .role(User.Role.USER)
                        .userType(User.UserType.JOB_SEEKER)
                        .profileCompleted(true)
                        .build());
            }

            if (!userRepository.existsByEmail("arjun@gmail.com")) {
                userRepository.save(User.builder()
                        .name("Arjun Dev")
                        .email("arjun@gmail.com")
                        .password(passwordEncoder.encode("12345678"))
                        .role(User.Role.USER)
                        .userType(User.UserType.JOB_SEEKER)
                        .profileCompleted(true)
                        .build());
            }

            if (!userRepository.existsByEmail("provider@gmail.com")) {
                userRepository.save(User.builder()
                        .name("TechNova")
                        .email("provider@gmail.com")
                        .password(passwordEncoder.encode("12345678"))
                        .role(User.Role.USER)
                        .userType(User.UserType.JOB_PROVIDER)
                        .providerStatus(User.ProviderStatus.APPROVED)
                        .build());
            }

            User provider = userRepository.findByEmail("provider@gmail.com").orElse(null);
            if (provider == null) return;

            // ===== JOBS =====
            if (jobRepository.count() == 0) {

                saveJob("Java Developer", "TechNova", "Bangalore", provider);
                saveJob("Spring Boot Developer", "TechNova", "Hyderabad", provider);
                saveJob("Frontend Developer", "TechNova", "Remote", provider);
                saveJob("React Developer", "TechNova", "Delhi", provider);
                saveJob("Full Stack Developer", "TechNova", "Pune", provider);
            }
        };
    }

    private void saveJob(String title, String company, String location, User provider) {
        Job job = Job.builder()
                .title(title)
                .company(company)
                .category("IT")
                .location(location)
                .jobType(Job.JobType.FULL_TIME)
                .description(title + " role")
                .createdBy(provider.getId())
                .build();

        job = jobRepository.save(job);
        job.approve();
        jobRepository.save(job);
    }
}
