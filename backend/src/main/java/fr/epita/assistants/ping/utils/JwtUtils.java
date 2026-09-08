package fr.epita.assistants.ping.utils;
import io.smallrye.jwt.build.Jwt;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public class JwtUtils {
    private static final long EXPIRATION_SECONDS = 3600;

    public static String generateToken(UUID userId, boolean isAdmin) {
        Instant now = Instant.now();
        return Jwt.issuer("ping-api")
                .subject(userId.toString())
                .groups(Set.of(isAdmin ? "admin" : "user"))
                .issuedAt(now)
                .expiresAt(now.plusSeconds(EXPIRATION_SECONDS))
                .sign();
    }
}
