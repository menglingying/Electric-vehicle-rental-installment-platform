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
  
  // 新增字段
  @Column(name = "biz_type")
  private String bizType;        // 业务类型: LOGIN/REMIND/OVERDUE/MANUAL
  @Column(name = "biz_id")
  private String bizId;          // 关联业务ID（如订单ID）
  private String provider;       // 供应商: ihuyi/mock
  @Column(name = "provider_msg_id")
  private String providerMsgId;  // 供应商返回的消息ID
  @Column(name = "error_code")
  private String errorCode;      // 错误码
  @Column(name = "error_msg", length = 500)
  private String errorMsg;       // 错误信息

  public SmsRecord() {}

  public SmsRecord(String id, String phone, String content, Instant createdAt, String status) {
    this.id = id;
    this.phone = phone;
    this.content = content;
    this.createdAt = createdAt;
    this.status = status;
  }

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }

  public String getPhone() { return phone; }
  public void setPhone(String phone) { this.phone = phone; }

  public String getContent() { return content; }
  public void setContent(String content) { this.content = content; }

  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }

  public String getBizType() { return bizType; }
  public void setBizType(String bizType) { this.bizType = bizType; }

  public String getBizId() { return bizId; }
  public void setBizId(String bizId) { this.bizId = bizId; }

  public String getProvider() { return provider; }
  public void setProvider(String provider) { this.provider = provider; }

  public String getProviderMsgId() { return providerMsgId; }
  public void setProviderMsgId(String providerMsgId) { this.providerMsgId = providerMsgId; }

  public String getErrorCode() { return errorCode; }
  public void setErrorCode(String errorCode) { this.errorCode = errorCode; }

  public String getErrorMsg() { return errorMsg; }
  public void setErrorMsg(String errorMsg) { this.errorMsg = errorMsg; }
}
