package com.example.demochatbot.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mock.env.MockEnvironment;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DatasourceConfigurationTests {
    private MockEnvironment applicationEnvironment() throws Exception {
        MockEnvironment environment = new MockEnvironment();
        environment.getPropertySources().addLast(new YamlPropertySourceLoader()
                .load("application", new ClassPathResource("application.yml")).getFirst());
        return environment;
    }

    @Test void defaultConfigurationConnectsToTheLocalMysqlPort() throws Exception {
        String url = applicationEnvironment().getProperty("spring.datasource.url");
        assertTrue(url.startsWith("jdbc:mysql://127.0.0.1:3306/halmbook?"));
        assertTrue(url.contains("connectTimeout=5000"));
    }

    @Test void anotherEnvironmentCanOverrideTheDatabaseAddress() throws Exception {
        MockEnvironment environment = applicationEnvironment();
        environment.setProperty("DB_URL", "jdbc:mysql://database.internal:3307/halmbook");
        assertEquals("jdbc:mysql://database.internal:3307/halmbook", environment.getProperty("spring.datasource.url"));
    }
}
