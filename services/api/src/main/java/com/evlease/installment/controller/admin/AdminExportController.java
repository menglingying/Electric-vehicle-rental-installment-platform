package com.evlease.installment.controller.admin;

import com.evlease.installment.model.Contract;
import com.evlease.installment.model.PaymentIntent;
import com.evlease.installment.model.RepaymentPlanItem;
import com.evlease.installment.repo.OrderRepository;
import com.evlease.installment.repo.SmsRepository;
import com.evlease.installment.service.CsvUtil;
import com.evlease.installment.service.OrderEnricher;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/exports")
public class AdminExportController {
  private final OrderRepository orderRepository;
  private final OrderEnricher orderEnricher;
  private final SmsRepository smsRepository;

  public AdminExportController(OrderRepository orderRepository, OrderEnricher orderEnricher, SmsRepository smsRepository) {
    this.orderRepository = orderRepository;
    this.orderEnricher = orderEnricher;
    this.smsRepository = smsRepository;
  }

  private static String employmentStatusText(Object code) {
    if (code == null) return "";
    return switch (code.toString()) {
      case "employed" -> "全职";
      case "part_time" -> "兼职";
      case "freelancer" -> "自由职业";
      case "self_employed" -> "个体经营";
      case "student" -> "学生";
      case "unemployed" -> "无业";
      case "retired" -> "退休";
      default -> code.toString();
    };
  }

  private static String incomeRangeText(Object code) {
    if (code == null) return "";
    return switch (code.toString()) {
      case "0_1000" -> "0-1000";
      case "1000_2000" -> "1000-2000";
      case "2001_3000" -> "2001-3000";
      case "3001_4000" -> "3001-4000";
      case "4001_5000" -> "4001-5000";
      case "5001_8000" -> "5001-8000";
      case "8001_12000" -> "8001-12000";
      case "12001_20000" -> "12001-20000";
      case "20000_plus" -> "20000+";
      case "12001_plus" -> "12001+";
      default -> code.toString();
    };
  }

  private static String contactRelationText(Object code) {
    if (code == null) return "";
    return switch (code.toString()) {
      case "parent" -> "父母";
      case "spouse" -> "配偶";
      case "child" -> "子女";
      case "colleague" -> "同事";
      case "friend" -> "朋友";
      case "other" -> "其他";
      default -> code.toString();
    };
  }

  private static String formatHomeAddress(Map<String, Object> e) {
    var province = e.get("homeProvinceName");
    if (province == null) province = e.get("homeProvinceCode");
    var city = e.get("homeCityName");
    if (city == null) city = e.get("homeCityCode");
    var district = e.get("homeDistrictName");
    if (district == null) district = e.get("homeDistrictCode");
    var detail = e.get("homeAddressDetail");
    return String.join(" ", List.of(
      province == null ? "" : province.toString(),
      city == null ? "" : city.toString(),
      district == null ? "" : district.toString(),
      detail == null ? "" : detail.toString()
    ).stream().filter(s -> !s.isBlank()).toList());
  }

  @GetMapping("/orders.csv")
  public void orders(HttpServletResponse response) throws IOException {
    List<List<Object>> rows = new ArrayList<>();
    rows.add(List.of("订单ID", "手机号", "商品", "状态", "期数", "周期(天)", "押金比例",
        "电池配置", "还款方式", "KYC状态", "真实姓名", "就业状态", "单位/职业", "月收入", "联系人姓名",
        "联系人电话", "联系人关系", "住家地址", "创建时间", "剩余应还", "合同状态", "收款状态"));
    for (var o : orderRepository.findAllByOrderByCreatedAtDesc()) {
      @SuppressWarnings("unchecked")
      var e = (Map<String, Object>) orderEnricher.enrich(o);
      var contract = (Contract) e.get("contract");
      var payment = (PaymentIntent) e.get("payment");

      // 电池配置转中文
      var batteryOption = e.get("batteryOption");
      String batteryText = "";
      if ("WITHOUT_BATTERY".equals(batteryOption)) batteryText = "空车";
      else if ("WITH_BATTERY".equals(batteryOption)) batteryText = "含电池";

      // 还款方式转中文
      var repaymentMethod = e.get("repaymentMethod");
      String repaymentText = "";
      if ("AUTO_DEDUCT".equals(repaymentMethod)) repaymentText = "自动扣款";
      else if ("MANUAL_TRANSFER".equals(repaymentMethod)) repaymentText = "手动转账";
      else if ("OFFLINE".equals(repaymentMethod)) repaymentText = "线下收款";

      // KYC状态
      var kycCompleted = e.get("kycCompleted");
      String kycText = Boolean.TRUE.equals(kycCompleted) ? "已完成" : "未完成";
      var employmentName = e.get("employmentName");
      if (employmentName == null) employmentName = e.get("occupation");

      rows.add(
        List.of(
          e.get("id"),
          e.get("phone"),
          e.get("productName"),
          e.get("status"),
          e.get("periods"),
          e.get("cycleDays"),
          e.get("depositRatio"),
          batteryText,
          repaymentText,
          kycText,
          e.get("realName") != null ? e.get("realName") : "",
          employmentStatusText(e.get("employmentStatus")),
          employmentName == null ? "" : employmentName,
          incomeRangeText(e.get("incomeRangeCode")),
          e.get("contactName") != null ? e.get("contactName") : "",
          e.get("contactPhone") != null ? e.get("contactPhone") : "",
          contactRelationText(e.get("contactRelation")),
          formatHomeAddress(e),
          e.get("createdAt"),
          e.get("remainingAmount"),
          contract == null ? "" : contract.getStatus(),
          payment == null ? "" : payment.getStatus()
        )
      );
    }
    CsvUtil.write(response, "orders.csv", rows);
  }

  @GetMapping("/repayments.csv")
  public void repayments(HttpServletResponse response) throws IOException {
    List<List<Object>> rows = new ArrayList<>();
    rows.add(List.of("订单ID", "手机号", "商品", "期次", "到期日", "金额", "是否已还"));
    for (var o : orderRepository.findAllByOrderByCreatedAtDesc()) {
      @SuppressWarnings("unchecked")
      var e = (Map<String, Object>) orderEnricher.enrich(o);
      @SuppressWarnings("unchecked")
      var plan = (List<RepaymentPlanItem>) e.get("repaymentPlan");
      for (var p : plan) {
        rows.add(
          List.of(
            e.get("id"),
            e.get("phone"),
            e.get("productName"),
            p.getPeriod(),
            p.getDueDate(),
            p.getAmount(),
            p.isPaid() ? "是" : "否"
          )
        );
      }
    }
    CsvUtil.write(response, "repayments.csv", rows);
  }

  @GetMapping("/overdue.csv")
  public void overdue(HttpServletResponse response) throws IOException {
    List<List<Object>> rows = new ArrayList<>();
    rows.add(List.of("订单ID", "手机号", "商品", "状态", "期次", "到期日", "金额", "逾期天数"));
    var today = LocalDate.now();

    for (var o : orderRepository.findAllByOrderByCreatedAtDesc()) {
      @SuppressWarnings("unchecked")
      var e = (Map<String, Object>) orderEnricher.enrich(o);
      @SuppressWarnings("unchecked")
      var plan = (List<RepaymentPlanItem>) e.get("repaymentPlan");
      for (var p : plan) {
        var paid = p.isPaid();
        var amount = p.getAmount();
        if (paid || amount <= 0) continue;
        var due = p.getDueDate();
        int days = (int) ChronoUnit.DAYS.between(due, today);
        if (days <= 0) continue;
        rows.add(List.of(e.get("id"), e.get("phone"), e.get("productName"), e.get("status"), p.getPeriod(), p.getDueDate(), amount, days));
      }
    }

    CsvUtil.write(response, "overdue.csv", rows);
  }

  @GetMapping("/sms.csv")
  public void sms(HttpServletResponse response) throws IOException {
    List<List<Object>> rows = new ArrayList<>();
    rows.add(List.of("记录ID", "手机号", "内容", "时间", "状态"));
    for (var r : smsRepository.findAllByOrderByCreatedAtDesc()) {
      rows.add(List.of(r.getId(), r.getPhone(), r.getContent(), r.getCreatedAt(), r.getStatus()));
    }
    CsvUtil.write(response, "sms.csv", rows);
  }
}
