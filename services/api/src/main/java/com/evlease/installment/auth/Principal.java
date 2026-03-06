package com.evlease.installment.auth;

public record Principal(PrincipalType type, String id, String phoneOrUsername, String role) {
  public Principal(PrincipalType type, String id, String phoneOrUsername) {
    this(type, id, phoneOrUsername, null);
  }
}

