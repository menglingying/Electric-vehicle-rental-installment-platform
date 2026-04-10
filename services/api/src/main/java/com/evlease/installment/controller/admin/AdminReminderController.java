package com.evlease.installment.controller.admin;

import com.evlease.installment.repo.OrderRepository;
import com.evlease.installment.model.RepaymentPlanItem;
import com.evlease.installment.service.OrderEnricher;
import com.evlease.installment.sms.SmsService;
import com.evlease.installment.sms.SmsResult;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/reminders")
public class AdminReminderController {
  private final OrderRepository orderRepository;
  private final OrderEnricher orderEnricher;
  private final SmsService smsService;

  public AdminReminderController(
      OrderRepository orderRepository,
      OrderEnricher orderEnricher,
      SmsService smsService
  ) {
    this.orderRepository = orderRepository;
    this.orderEnricher = orderEnricher;
    this.smsService = smsService;
  }

  @GetMapping
  public List<Map<String, Object>> list(@RequestParam(defaultValue = "all") String kind) {
    var today = LocalDate.now();
    var soon = today.plusDays(3);

    List<Map<String, Object>> items = new ArrayList<>();
    for (var order : orderRepository.findAll()) {
      @SuppressWarnings("unchecked")
      var enriched = (Map<String, Object>) orderEnricher.enrich(order);
      @SuppressWarnings("unchecked")
      var plan = (List<RepaymentPlanItem>) enriched.get("repaymentPlan");
      for (var p : plan) {
        var paid = p.isPaid();
        var amount = p.getAmount();
        if (paid || amount <= 0) continue;
        var dueDate = p.getDueDate();
        boolean match = switch (kind) {
          case "due_today" -> dueDate.equals(today);
          case "due_soon" -> !dueDate.isBefore(today) && !dueDate.isAfter(soon) && !dueDate.equals(today);
          default -> !dueDate.isBefore(today) && !dueDate.isAfter(soon);
        };
        if (!match) continue;
        items.add(
          Map.of(
            "id", "rem:" + order.getId() + ":" + p.getPeriod(),
            "orderId", order.getId(),
            "phone", order.getPhone(),
            "productName", order.getProductName() != null ? order.getProductName() : "",
            "realName", order.getRealName() != null ? order.getRealName() : "",
            "period", p.getPeriod(),
            "dueDate", p.getDueDate(),
            "amount", amount
          )
        );
      }
    }
    items.sort((a, b) -> String.valueOf(a.get("dueDate")).compareTo(String.valueOf(b.get("dueDate"))));
    return items;
  }

  public record SendRequest(List<String> ids) {}

  @PostMapping("/send")
  public Map<String, Object> send(@RequestBody SendRequest req) {
    List<Map<String, Object>> results = new ArrayList<>();
    int successCount = 0;
    int failCount = 0;

    for (String id : req.ids()) {
      // ID format: rem:{orderId}:{period}  (colon-separated to avoid conflict with orderId underscores)
      int firstColon = id.indexOf(':');
      int lastColon = id.lastIndexOf(':');
      if (firstColon < 0 || firstColon == lastColon) continue;
      String orderId = id.substring(firstColon + 1, lastColon);
      int period;
      try {
        period = Integer.parseInt(id.substring(lastColon + 1));
      } catch (NumberFormatException e) {
        continue;
      }

      var orderOpt = orderRepository.findById(orderId);
      if (orderOpt.isEmpty()) continue;
      var order = orderOpt.get();

      // 查找对应期次
      var planItem = order.getRepaymentPlan().stream()
          .filter(p -> p.getPeriod() == period)
          .findFirst();
      if (planItem.isEmpty()) continue;

      var p = planItem.get();
      String dueDateStr = p.getDueDate().format(DateTimeFormatter.ofPattern("yyyy年MM月dd日"));
      
      SmsResult result = smsService.sendRepaymentReminder(
          order.getPhone(), period, p.getAmount(), dueDateStr, orderId);

      results.add(Map.of(
          "id", id,
          "success", result.success(),
          "errorMsg", result.errorMsg() != null ? result.errorMsg() : ""
      ));

      if (result.success()) successCount++;
      else failCount++;
    }

    return Map.of(
        "total", req.ids().size(),
        "success", successCount,
        "fail", failCount,
        "results", results
    );
  }
}
