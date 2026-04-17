package com.evlease.installment.service;

import com.evlease.installment.model.Order;
import com.evlease.installment.model.RepaymentPlanItem;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class OrderPlanService {
  private static final ZoneId ZONE = ZoneId.of("Asia/Shanghai");

  /**
   * 按指定基准日期构建还款计划。第 i 期的 dueDate = baseDate + i * cycleDays。
   * 基准日期 baseDate 原则上应该是"订单创建日"或"合同生效日"，**不要**使用
   * `LocalDate.now()`——否则一旦 plan 在下单 N 天之后被重算，所有期次的
   * 还款日都会被推迟 N 天，导致台账与合同不符、公司收款顺延。
   */
  public List<RepaymentPlanItem> buildRentPlan(
      int rentPerCycle, int periods, int cycleDays, double depositRatio, LocalDate baseDate) {
    LocalDate start = baseDate != null ? baseDate : LocalDate.now(ZONE);
    var items = new ArrayList<RepaymentPlanItem>();
    for (int i = 1; i <= periods; i++) {
      items.add(new RepaymentPlanItem(i, start.plusDays((long) cycleDays * i), rentPerCycle));
    }
    return items;
  }

  /** 兼容旧签名：默认 baseDate=今天。**仅用于新订单创建**，已有订单一律走
   *  {@link #buildRentPlan(int,int,int,double,LocalDate)} 并显式传订单创建日。*/
  public List<RepaymentPlanItem> buildRentPlan(
      int rentPerCycle, int periods, int cycleDays, double depositRatio) {
    return buildRentPlan(rentPerCycle, periods, cycleDays, depositRatio, LocalDate.now(ZONE));
  }

  /** 从订单的 createdAt 解析基准日期（上海时区）。createdAt 为空时返回 today。*/
  public static LocalDate baseDateOf(Order order) {
    Instant t = order != null ? order.getCreatedAt() : null;
    return t != null ? t.atZone(ZONE).toLocalDate() : LocalDate.now(ZONE);
  }
}
