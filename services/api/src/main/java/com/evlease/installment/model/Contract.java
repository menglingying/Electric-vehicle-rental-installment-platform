package com.evlease.installment.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "contract")
public class Contract {
  @Column(name = "contract_id")
  private String id;
  @Id
  private String orderId;
  // ORDER / MANUAL
  private String contractType;
  // ASIGN / MANUAL
  private String provider;
  // 合同编号
  private String contractNo;
  // 模板ID（电子签）
  private String templateId;
  private String status;
  private String signUrl;
  // 合同文件URL（签署后或历史PDF）
  private String fileUrl;
  // 签署完成时间
  private Instant signedAt;
  // 签署人
  private String signedBy;
  // 关键字段JSON
  @Column(columnDefinition = "text")
  private String meta;
  // 公证证书下载链接（存档）
  private String notaryCertUrl;
  private String voidReason;
  private Instant createdAt;
  private Instant updatedAt;

  public Contract() {}

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getOrderId() {
    return orderId;
  }

  public void setOrderId(String orderId) {
    this.orderId = orderId;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public String getSignUrl() {
    return signUrl;
  }

  public void setSignUrl(String signUrl) {
    this.signUrl = signUrl;
  }

  public String getContractType() {
    return contractType;
  }

  public void setContractType(String contractType) {
    this.contractType = contractType;
  }

  public String getProvider() {
    return provider;
  }

  public void setProvider(String provider) {
    this.provider = provider;
  }

  public String getContractNo() {
    return contractNo;
  }

  public void setContractNo(String contractNo) {
    this.contractNo = contractNo;
  }

  public String getTemplateId() {
    return templateId;
  }

  public void setTemplateId(String templateId) {
    this.templateId = templateId;
  }

  public String getFileUrl() {
    return fileUrl;
  }

  public void setFileUrl(String fileUrl) {
    this.fileUrl = fileUrl;
  }

  public Instant getSignedAt() {
    return signedAt;
  }

  public void setSignedAt(Instant signedAt) {
    this.signedAt = signedAt;
  }

  public String getSignedBy() {
    return signedBy;
  }

  public void setSignedBy(String signedBy) {
    this.signedBy = signedBy;
  }

  public String getMeta() {
    return meta;
  }

  public void setMeta(String meta) {
    this.meta = meta;
  }

  public String getNotaryCertUrl() {
    return notaryCertUrl;
  }

  public void setNotaryCertUrl(String notaryCertUrl) {
    this.notaryCertUrl = notaryCertUrl;
  }

  public String getVoidReason() {
    return voidReason;
  }

  public void setVoidReason(String voidReason) {
    this.voidReason = voidReason;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(Instant updatedAt) {
    this.updatedAt = updatedAt;
  }
}
