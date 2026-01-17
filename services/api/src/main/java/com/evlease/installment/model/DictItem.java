package com.evlease.installment.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "dict_item")
public class DictItem {
  @Id
  private String id;
  private String dictCode;
  private String itemCode;
  private String itemLabel;
  private int sort;
  private int status;

  public DictItem() {}

  public DictItem(String id, String dictCode, String itemCode, String itemLabel, int sort, int status) {
    this.id = id;
    this.dictCode = dictCode;
    this.itemCode = itemCode;
    this.itemLabel = itemLabel;
    this.sort = sort;
    this.status = status;
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getDictCode() {
    return dictCode;
  }

  public void setDictCode(String dictCode) {
    this.dictCode = dictCode;
  }

  public String getItemCode() {
    return itemCode;
  }

  public void setItemCode(String itemCode) {
    this.itemCode = itemCode;
  }

  public String getItemLabel() {
    return itemLabel;
  }

  public void setItemLabel(String itemLabel) {
    this.itemLabel = itemLabel;
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
