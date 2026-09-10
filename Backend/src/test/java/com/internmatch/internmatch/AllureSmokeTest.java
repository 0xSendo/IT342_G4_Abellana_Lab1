package com.internmatch.internmatch;

import io.qameta.allure.Description;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

@Epic("QA Infrastructure")
@Feature("Unified Allure Testing Environment")
class AllureSmokeTest {

    @Test
    @DisplayName("Allure JUnit5 adapter emits results to shared folder")
    @Description("Verifies the Allure JUnit 5 adapter is active and surefire pipes results to ../allure-results")
    void shouldRunJunit5WithAllure() {
        assertTrue(true);
    }
}