package com.evlease.installment.auth;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class TokenService {
  private static class Entry {
    final Principal principal;
    final Instant expiresAt;

    Entry(Principal principal, Instant expiresAt) {
      this.principal = principal;
      this.expiresAt = expiresAt;
    }
  }

  private final Map<String, Entry> store = new ConcurrentHashMap<>();

  public String issue(Principal principal) {
    var token = UUID.randomUUID().toString().replace("-", "");
    store.put(token, new Entry(principal, Instant.now().plus(Duration.ofDays(3))));
    return token;
  }

  public Principal verify(String token) {
    if (token == null || token.isBlank()) return null;
    var entry = store.get(token);
    if (entry == null) return null;
    if (Instant.now().isAfter(entry.expiresAt)) {
      store.remove(token);
      return null;
    }
    return entry.principal;
  }
}

