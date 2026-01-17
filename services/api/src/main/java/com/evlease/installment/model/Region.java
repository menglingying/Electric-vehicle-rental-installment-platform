package com.evlease.installment.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "region")
public class Region {
  @Id
  private String code;
  private String name;
  private int level;
  private String parentCode;
  private int sort;

  public Region() {}

  public Region(String code, String name, int level, String parentCode, int sort) {
    this.code = code;
    this.name = name;
    this.level = level;
    this.parentCode = parentCode;
    this.sort = sort;
  }

  public String getCode() {
    return code;
  }

  public void setCode(String code) {
    this.code = code;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public int getLevel() {
    return level;
  }

  public void setLevel(int level) {
    this.level = level;
  }

  public String getParentCode() {
    return parentCode;
  }

  public void setParentCode(String parentCode) {
    this.parentCode = parentCode;
  }

  public int getSort() {
    return sort;
  }

  public void setSort(int sort) {
    this.sort = sort;
  }
}
