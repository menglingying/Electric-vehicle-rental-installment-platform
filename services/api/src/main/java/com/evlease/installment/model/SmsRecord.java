package com.evlease.installment.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "sms_record")
public class SmsRecord {
  @Id
  private String id;
  private String phone;
  @Column(length = 2000)
  private String content;
  @Column(name = "created_at")
  private Instant createdAt;
  private String status;

  public SmsRecord() {}

  public SmsRecord(String id, String phone, String content, Instant createdAt, String status) {
    this.id = id;
    this.phone = phone;
    this.content = content;
    this.createdAt = createdAt;
    this.status = status;
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getPhone() {
    return phone;
  }

  public void setPhone(String phone) {
    this.phone = phone;
  }

  public String getContent() {
    return content;
  }

  public void setContent(String content) {
    this.content = content;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }
}
