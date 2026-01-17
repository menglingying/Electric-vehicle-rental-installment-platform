package com.evlease.installment.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "order_price_adjustment")
public class OrderPriceAdjustment {
  @Id
  private String id;
  private String orderId;
  private int beforeRentPerPeriod;
  private int afterRentPerPeriod;
  private int beforePeriods;
  private int afterPeriods;
  private int beforeCycleDays;
  private int afterCycleDays;
  private String reason;
  private String operatorName;
  @Column(name = "created_at")
  private Instant createdAt;

  public OrderPriceAdjustment() {}

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

  public int getBeforeRentPerPeriod() {
    return beforeRentPerPeriod;
  }

  public void setBeforeRentPerPeriod(int beforeRentPerPeriod) {
    this.beforeRentPerPeriod = beforeRentPerPeriod;
  }

  public int getAfterRentPerPeriod() {
    return afterRentPerPeriod;
  }

  public void setAfterRentPerPeriod(int afterRentPerPeriod) {
    this.afterRentPerPeriod = afterRentPerPeriod;
  }

  public int getBeforePeriods() {
    return beforePeriods;
  }

  public void setBeforePeriods(int beforePeriods) {
    this.beforePeriods = beforePeriods;
  }

  public int getAfterPeriods() {
    return afterPeriods;
  }

  public void setAfterPeriods(int afterPeriods) {
    this.afterPeriods = afterPeriods;
  }

  public int getBeforeCycleDays() {
    return beforeCycleDays;
  }

  public void setBeforeCycleDays(int beforeCycleDays) {
    this.beforeCycleDays = beforeCycleDays;
  }

  public int getAfterCycleDays() {
    return afterCycleDays;
  }

  public void setAfterCycleDays(int afterCycleDays) {
    this.afterCycleDays = afterCycleDays;
  }

  public String getReason() {
    return reason;
  }

  public void setReason(String reason) {
    this.reason = reason;
  }

  public String getOperatorName() {
    return operatorName;
  }

  public void setOperatorName(String operatorName) {
    this.operatorName = operatorName;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }
}
