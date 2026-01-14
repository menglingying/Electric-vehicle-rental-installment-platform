package com.evlease.installment.controller.admin;

import com.evlease.installment.model.Order;
import com.evlease.installment.model.RepaymentPlanItem;
import com.evlease.installment.service.OrderEnricher;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/overdue")
public class AdminOverdueController {
  private final com.evlease.installment.repo.OrderRepository orderRepository;
  private final OrderEnricher orderEnricher;

  public AdminOverdueController(com.evlease.installment.repo.OrderRepository orderRepository, OrderEnricher orderEnricher) {
    this.orderRepository = orderRepository;
    this.orderEnricher = orderEnricher;
  }

  @GetMapping
  public List<Map<String, Object>> list(@RequestParam(defaultValue = "all") String tier) {
    var today = LocalDate.now();
    List<Map<String, Object>> result = new ArrayList<>();

    for (var order : orderRepository.findAll()) {
      @SuppressWarnings("unchecked")
      var enriched = (Map<String, Object>) orderEnricher.enrich(order);
      @SuppressWarnings("unchecked")
      var plan = (List<RepaymentPlanItem>) enriched.get("repaymentPlan");
      List<Map<String, Object>> overduePeriods = new ArrayList<>();
      int max = 0;
      for (var p : plan) {
        var paid = p.isPaid();
        var amount = p.getAmount();
        if (paid || amount <= 0) continue;
        var due = p.getDueDate();
        int days = (int) ChronoUnit.DAYS.between(due, today);
        if (days <= 0) continue;
        if (days > max) max = days;
        overduePeriods.add(
          Map.of(
            "period",
            p.getPeriod(),
            "dueDate",
            p.getDueDate(),
            "amount",
            amount,
            "overdueDays",
            days
          )
        );
      }
      if (overduePeriods.isEmpty()) continue;
      boolean match = switch (tier) {
        case "1-3" -> max >= 1 && max <= 3;
        case "3-10" -> max >= 3 && max <= 10;
        case "10-30" -> max >= 10 && max <= 30;
        case "30+" -> max >= 30;
        default -> true;
      };
      if (!match) continue;

      result.add(
        Map.of(
          "orderId",
          order.getId(),
          "phone",
          order.getPhone(),
          "productName",
          order.getProductName(),
          "status",
          order.getStatus(),
          "maxOverdueDays",
          max,
          "overduePeriods",
          overduePeriods
        )
      );
    }

    result.sort((a, b) -> ((Number) b.get("maxOverdueDays")).intValue() - ((Number) a.get("maxOverdueDays")).intValue());
    return result;
  }
}
