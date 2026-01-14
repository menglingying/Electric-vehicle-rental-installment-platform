package com.evlease.installment.controller.admin;

import com.evlease.installment.repo.OrderRepository;
import com.evlease.installment.model.RepaymentPlanItem;
import com.evlease.installment.service.OrderEnricher;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/reminders")
public class AdminReminderController {
  private final OrderRepository orderRepository;
  private final OrderEnricher orderEnricher;

  public AdminReminderController(OrderRepository orderRepository, OrderEnricher orderEnricher) {
    this.orderRepository = orderRepository;
    this.orderEnricher = orderEnricher;
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
          case "due_soon" -> dueDate.equals(soon);
          default -> dueDate.equals(today) || dueDate.equals(soon);
        };
        if (!match) continue;
        items.add(
          Map.of(
            "id",
            "rem_" + order.getId() + "_" + p.getPeriod(),
            "orderId",
            order.getId(),
            "phone",
            order.getPhone(),
            "productName",
            order.getProductName(),
            "period",
            p.getPeriod(),
            "dueDate",
            p.getDueDate(),
            "amount",
            amount
          )
        );
      }
    }
    items.sort((a, b) -> String.valueOf(a.get("dueDate")).compareTo(String.valueOf(b.get("dueDate"))));
    return items;
  }
}
