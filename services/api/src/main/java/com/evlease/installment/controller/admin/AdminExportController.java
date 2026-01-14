package com.evlease.installment.controller.admin;

import com.evlease.installment.repo.OrderRepository;
import com.evlease.installment.repo.SmsRepository;
import com.evlease.installment.model.Contract;
import com.evlease.installment.model.PaymentIntent;
import com.evlease.installment.model.RepaymentPlanItem;
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

  @GetMapping("/orders.csv")
  public void orders(HttpServletResponse response) throws IOException {
    List<List<Object>> rows = new ArrayList<>();
    rows.add(List.of("订单ID", "手机号", "商品", "状态", "期数", "周期(天)", "押金比例", 
        "电池配置", "还款方式", "KYC状态", "真实姓名", "创建时间", "剩余应还", "合同状态", "收款状态"));
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
