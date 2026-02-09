package com.internmatch.internmatch;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EnableJpaRepositories(basePackages = "com.internmatch.internmatch.repository")
public class InternmatchApplication {

	public static void main(String[] args) {
		SpringApplication.run(InternmatchApplication.class, args);
	}

}
