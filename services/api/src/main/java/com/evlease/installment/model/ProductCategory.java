package com.evlease.installment.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "product_category")
public class ProductCategory {
  @Id
  private String id;
  private String parentId;
  private int level;
  private String name;
  private int sort;
  private int status;

  public ProductCategory() {}

  public ProductCategory(String id, String parentId, int level, String name, int sort, int status) {
    this.id = id;
    this.parentId = parentId;
    this.level = level;
    this.name = name;
    this.sort = sort;
    this.status = status;
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getParentId() {
    return parentId;
  }

  public void setParentId(String parentId) {
    this.parentId = parentId;
  }

  public int getLevel() {
    return level;
  }

  public void setLevel(int level) {
    this.level = level;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public int getSort() {
    return sort;
  }

  public void setSort(int sort) {
    this.sort = sort;
  }

  public int getStatus() {
    return status;
  }

  public void setStatus(int status) {
    this.status = status;
  }
}
