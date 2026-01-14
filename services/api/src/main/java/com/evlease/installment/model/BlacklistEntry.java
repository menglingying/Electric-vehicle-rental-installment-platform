package com.evlease.installment.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "blacklist")
public class BlacklistEntry {
  @Id
  private String phone;
  private String reason;
  private Instant createdAt;

  public BlacklistEntry() {}

  public BlacklistEntry(String phone, String reason, Instant createdAt) {
    this.phone = phone;
    this.reason = reason;
    this.createdAt = createdAt;
  }

  public String getPhone() {
    return phone;
  }

  public void setPhone(String phone) {
    this.phone = phone;
  }

  public String getReason() {
    return reason;
  }

  public void setReason(String reason) {
    this.reason = reason;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }
}
