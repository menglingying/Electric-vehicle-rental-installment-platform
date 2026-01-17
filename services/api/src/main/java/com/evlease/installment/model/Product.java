package com.evlease.installment.model;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import java.util.List;

@Entity
@Table(name = "product")
public class Product {
  @Id
  private String id;
  private String name;
  private String coverUrl;
  private int rentPerCycle;
  private String categoryId;

  @ElementCollection(fetch = FetchType.EAGER)
  @CollectionTable(name = "product_tag", joinColumns = @JoinColumn(name = "product_id"))
  @Column(name = "tag")
  private List<String> tags;

  @ElementCollection(fetch = FetchType.EAGER)
  @CollectionTable(name = "product_image", joinColumns = @JoinColumn(name = "product_id"))
  @OrderColumn(name = "sort_index")
  @Column(name = "url")
  private List<String> images;
  private String frameConfig;
  private String batteryConfig;
  
  // 空车租金/期（元）
  private Integer rentWithoutBattery;
  // 含电池租金/期（元）
  private Integer rentWithBattery;

  public Product() {}

  public Product(
    String id,
    String name,
    String coverUrl,
    int rentPerCycle,
    String categoryId,
    List<String> tags,
    List<String> images,
    String frameConfig,
    String batteryConfig,
    Integer rentWithoutBattery,
    Integer rentWithBattery
  ) {
    this.id = id;
    this.name = name;
    this.coverUrl = coverUrl;
    this.rentPerCycle = rentPerCycle;
    this.categoryId = categoryId;
    this.tags = tags;
    this.images = images;
    this.frameConfig = frameConfig;
    this.batteryConfig = batteryConfig;
    this.rentWithoutBattery = rentWithoutBattery;
    this.rentWithBattery = rentWithBattery;
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getCoverUrl() {
    return coverUrl;
  }

  public void setCoverUrl(String coverUrl) {
    this.coverUrl = coverUrl;
  }

  public int getRentPerCycle() {
    return rentPerCycle;
  }

  public void setRentPerCycle(int rentPerCycle) {
    this.rentPerCycle = rentPerCycle;
  }

  public String getCategoryId() {
    return categoryId;
  }

  public void setCategoryId(String categoryId) {
    this.categoryId = categoryId;
  }

  public List<String> getTags() {
    return tags;
  }

  public void setTags(List<String> tags) {
    this.tags = tags;
  }

  public List<String> getImages() {
    return images;
  }

  public void setImages(List<String> images) {
    this.images = images;
  }

  public String getFrameConfig() {
    return frameConfig;
  }

  public void setFrameConfig(String frameConfig) {
    this.frameConfig = frameConfig;
  }

  public String getBatteryConfig() {
    return batteryConfig;
  }

  public void setBatteryConfig(String batteryConfig) {
    this.batteryConfig = batteryConfig;
  }

  public Integer getRentWithoutBattery() {
    return rentWithoutBattery;
  }

  public void setRentWithoutBattery(Integer rentWithoutBattery) {
    this.rentWithoutBattery = rentWithoutBattery;
  }

  public Integer getRentWithBattery() {
    return rentWithBattery;
  }

  public void setRentWithBattery(Integer rentWithBattery) {
    this.rentWithBattery = rentWithBattery;
  }
}
