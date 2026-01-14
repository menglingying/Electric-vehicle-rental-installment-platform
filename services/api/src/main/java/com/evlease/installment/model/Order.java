package com.evlease.installment.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "orders")
public class Order {
  @Id
  private String id;
  private String phone;
  private String productId;
  private String productName;
  private int periods;
  private int cycleDays;
  private double depositRatio;
  @Enumerated(EnumType.STRING)
  private OrderStatus status;
  @Column(name = "created_at")
  private Instant createdAt;
  private Instant approvedAt;
  private Instant rejectedAt;
  private Instant deliveredAt;
  private Instant pickedUpAt;
  private Instant returnedAt;
  private Instant settledAt;
  private Instant closedAt;

  // 新增字段：电池配置选择（WITHOUT_BATTERY/WITH_BATTERY）
  private String batteryOption;
  // 新增字段：还款方式（AUTO_DEDUCT/MANUAL_TRANSFER/OFFLINE）
  private String repaymentMethod;
  
  // KYC资料字段
  private String idCardFront;      // 身份证正面照片URL
  private String idCardBack;       // 身份证反面照片URL
  private String facePhoto;        // 人脸自拍照URL
  private String realName;         // 真实姓名
  private String idCardNumber;     // 身份证号
  private String occupation;       // 职业
  private String company;          // 工作单位
  private String workCity;         // 工作城市
  private String residenceAddress; // 现居地址
  private String residenceDuration;// 居住时长
  private String contactName;      // 联系人姓名
  private String contactPhone;     // 联系人电话
  private String contactRelation;  // 联系人关系
  private boolean kycCompleted;    // KYC是否完成
  
  // 公证相关字段
  private String notaryOrderNo;       // 聚证公证订单号
  private String notaryStatus;        // 公证状态：10-预审中 20-申办中 33-已出证 等
  private String notaryCertifiedTime; // 出证时间
  private String notaryName;          // 公证员姓名
  private String notaryCertUrl;       // 公证书下载URL

  @OneToMany(fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval = true)
  @JoinColumn(name = "order_id")
  private List<RepaymentPlanItem> repaymentPlan;

  @OneToMany(fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval = true)
  @JoinColumn(name = "order_id")
  private List<OrderLog> statusLogs;

  public Order() {}

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

  public String getProductId() {
    return productId;
  }

  public void setProductId(String productId) {
    this.productId = productId;
  }

  public String getProductName() {
    return productName;
  }

  public void setProductName(String productName) {
    this.productName = productName;
  }

  public int getPeriods() {
    return periods;
  }

  public void setPeriods(int periods) {
    this.periods = periods;
  }

  public int getCycleDays() {
    return cycleDays;
  }

  public void setCycleDays(int cycleDays) {
    this.cycleDays = cycleDays;
  }

  public double getDepositRatio() {
    return depositRatio;
  }

  public void setDepositRatio(double depositRatio) {
    this.depositRatio = depositRatio;
  }

  public OrderStatus getStatus() {
    return status;
  }

  public void setStatus(OrderStatus status) {
    this.status = status;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }

  public Instant getApprovedAt() {
    return approvedAt;
  }

  public void setApprovedAt(Instant approvedAt) {
    this.approvedAt = approvedAt;
  }

  public Instant getRejectedAt() {
    return rejectedAt;
  }

  public void setRejectedAt(Instant rejectedAt) {
    this.rejectedAt = rejectedAt;
  }

  public Instant getDeliveredAt() {
    return deliveredAt;
  }

  public void setDeliveredAt(Instant deliveredAt) {
    this.deliveredAt = deliveredAt;
  }

  public Instant getPickedUpAt() {
    return pickedUpAt;
  }

  public void setPickedUpAt(Instant pickedUpAt) {
    this.pickedUpAt = pickedUpAt;
  }

  public Instant getReturnedAt() {
    return returnedAt;
  }

  public void setReturnedAt(Instant returnedAt) {
    this.returnedAt = returnedAt;
  }

  public Instant getSettledAt() {
    return settledAt;
  }

  public void setSettledAt(Instant settledAt) {
    this.settledAt = settledAt;
  }

  public Instant getClosedAt() {
    return closedAt;
  }

  public void setClosedAt(Instant closedAt) {
    this.closedAt = closedAt;
  }

  public List<RepaymentPlanItem> getRepaymentPlan() {
    return repaymentPlan;
  }

  public void setRepaymentPlan(List<RepaymentPlanItem> repaymentPlan) {
    this.repaymentPlan = repaymentPlan;
  }

  public List<OrderLog> getStatusLogs() {
    return statusLogs;
  }

  public void setStatusLogs(List<OrderLog> statusLogs) {
    this.statusLogs = statusLogs;
  }

  public String getBatteryOption() {
    return batteryOption;
  }

  public void setBatteryOption(String batteryOption) {
    this.batteryOption = batteryOption;
  }

  public String getRepaymentMethod() {
    return repaymentMethod;
  }

  public void setRepaymentMethod(String repaymentMethod) {
    this.repaymentMethod = repaymentMethod;
  }

  public String getIdCardFront() {
    return idCardFront;
  }

  public void setIdCardFront(String idCardFront) {
    this.idCardFront = idCardFront;
  }

  public String getIdCardBack() {
    return idCardBack;
  }

  public void setIdCardBack(String idCardBack) {
    this.idCardBack = idCardBack;
  }

  public String getFacePhoto() {
    return facePhoto;
  }

  public void setFacePhoto(String facePhoto) {
    this.facePhoto = facePhoto;
  }

  public String getRealName() {
    return realName;
  }

  public void setRealName(String realName) {
    this.realName = realName;
  }

  public String getIdCardNumber() {
    return idCardNumber;
  }

  public void setIdCardNumber(String idCardNumber) {
    this.idCardNumber = idCardNumber;
  }

  public String getOccupation() {
    return occupation;
  }

  public void setOccupation(String occupation) {
    this.occupation = occupation;
  }

  public String getCompany() {
    return company;
  }

  public void setCompany(String company) {
    this.company = company;
  }

  public String getWorkCity() {
    return workCity;
  }

  public void setWorkCity(String workCity) {
    this.workCity = workCity;
  }

  public String getResidenceAddress() {
    return residenceAddress;
  }

  public void setResidenceAddress(String residenceAddress) {
    this.residenceAddress = residenceAddress;
  }

  public String getResidenceDuration() {
    return residenceDuration;
  }

  public void setResidenceDuration(String residenceDuration) {
    this.residenceDuration = residenceDuration;
  }

  public String getContactName() {
    return contactName;
  }

  public void setContactName(String contactName) {
    this.contactName = contactName;
  }

  public String getContactPhone() {
    return contactPhone;
  }

  public void setContactPhone(String contactPhone) {
    this.contactPhone = contactPhone;
  }

  public String getContactRelation() {
    return contactRelation;
  }

  public void setContactRelation(String contactRelation) {
    this.contactRelation = contactRelation;
  }

  public boolean isKycCompleted() {
    return kycCompleted;
  }

  public void setKycCompleted(boolean kycCompleted) {
    this.kycCompleted = kycCompleted;
  }

  public String getNotaryOrderNo() {
    return notaryOrderNo;
  }

  public void setNotaryOrderNo(String notaryOrderNo) {
    this.notaryOrderNo = notaryOrderNo;
  }

  public String getNotaryStatus() {
    return notaryStatus;
  }

  public void setNotaryStatus(String notaryStatus) {
    this.notaryStatus = notaryStatus;
  }

  public String getNotaryCertifiedTime() {
    return notaryCertifiedTime;
  }

  public void setNotaryCertifiedTime(String notaryCertifiedTime) {
    this.notaryCertifiedTime = notaryCertifiedTime;
  }

  public String getNotaryName() {
    return notaryName;
  }

  public void setNotaryName(String notaryName) {
    this.notaryName = notaryName;
  }

  public String getNotaryCertUrl() {
    return notaryCertUrl;
  }

  public void setNotaryCertUrl(String notaryCertUrl) {
    this.notaryCertUrl = notaryCertUrl;
  }
}
