package com.example.electroshop.security;

import java.security.Key;
import java.util.Date;

import org.springframework.stereotype.Service;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    private final String SECRET =
        "electroshopsecretkeyelectroshopsecretkey";

    private final Key key =
        Keys.hmacShaKeyFor(
            SECRET.getBytes()
        );

    public String generateToken(
        String email
    ) {

        return Jwts.builder()

            .setSubject(email)

            .setIssuedAt(
                new Date()
            )

            .setExpiration(
                new Date(
                    System.currentTimeMillis()
                    + 1000 * 60 * 60
                )
            )

            .signWith(
                key,
                SignatureAlgorithm.HS256
            )

            .compact();
    }
}