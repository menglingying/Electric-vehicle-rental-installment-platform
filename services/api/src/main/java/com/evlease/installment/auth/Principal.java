package com.evlease.installment.auth;

public record Principal(PrincipalType type, String id, String phoneOrUsername) {}

