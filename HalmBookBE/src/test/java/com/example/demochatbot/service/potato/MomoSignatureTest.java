package com.example.demochatbot.service.potato;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MomoSignatureTest {

    @Test
    void signsAndVerifiesHmacSha256() {
        String signature = MomoSignature.sign(
                "test-secret",
                "accessKey=test&amount=100&orderId=abc"
        );

        assertEquals("c92f536c460609a1c592926ebb8dc1389ee91a2866cee636538dfe9f251e538a", signature);
        assertTrue(MomoSignature.matches(
                "test-secret",
                "accessKey=test&amount=100&orderId=abc",
                signature.toUpperCase()
        ));
        assertFalse(MomoSignature.matches(
                "test-secret",
                "accessKey=test&amount=101&orderId=abc",
                signature
        ));
    }
}
