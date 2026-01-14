package com.evlease.installment.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "order_log")
public class OrderLog {
  @Id
  private String id;
  private String action;
  @Enumerated(EnumType.STRING)
  private OrderStatus status;
  @Column(name = "logged_at")
  private Instant at;
  @Column(name = "source")
  private String by;
  private String actor;
  private Integer period;
  private Integer amount;
  private String contractStatus;
  private String paymentStatus;
  private String paymentId;

  public OrderLog() {}

  public OrderLog(String id, String action, OrderStatus status, Instant at, String by) {
    this.id = id;
    this.action = action;
    this.status = status;
    this.at = at;
    this.by = by;
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getAction() {
    return action;
  }

  public void setAction(String action) {
    this.action = action;
  }

  public OrderStatus getStatus() {
    return status;
  }

  public void setStatus(OrderStatus status) {
    this.status = status;
  }

  public Instant getAt() {
    return at;
  }

  public void setAt(Instant at) {
    this.at = at;
  }

  public String getBy() {
    return by;
  }

  public void setBy(String by) {
    this.by = by;
  }

  public String getActor() {
    return actor;
  }

  public void setActor(String actor) {
    this.actor = actor;
  }

  public Integer getPeriod() {
    return period;
  }

  public void setPeriod(Integer period) {
    this.period = period;
  }

  public Integer getAmount() {
    return amount;
  }

  public void setAmount(Integer amount) {
    this.amount = amount;
  }

  public String getContractStatus() {
    return contractStatus;
  }

  public void setContractStatus(String contractStatus) {
    this.contractStatus = contractStatus;
  }

  public String getPaymentStatus() {
    return paymentStatus;
  }

  public void setPaymentStatus(String paymentStatus) {
    this.paymentStatus = paymentStatus;
  }

  public String getPaymentId() {
    return paymentId;
  }

  public void setPaymentId(String paymentId) {
    this.paymentId = paymentId;
  }
}
