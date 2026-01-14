package com.evlease.installment.controller.admin;

import com.evlease.installment.common.ApiException;
import com.evlease.installment.model.RepaymentRecord;
import com.evlease.installment.repo.OrderRepository;
import com.evlease.installment.repo.RepaymentRepository;
import com.evlease.installment.service.OrderEnricher;
import com.evlease.installment.service.OrderLogService;
import jakarta.validation.constraints.Min;
import java.time.Instant;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminRepaymentController {
  private final OrderRepository orderRepository;
  private final RepaymentRepository repaymentRepository;
  private final OrderEnricher orderEnricher;
  private final OrderLogService orderLogService;

  public AdminRepaymentController(
    OrderRepository orderRepository,
    RepaymentRepository repaymentRepository,
    OrderEnricher orderEnricher,
    OrderLogService orderLogService
  ) {
    this.orderRepository = orderRepository;
    this.repaymentRepository = repaymentRepository;
    this.orderEnricher = orderEnricher;
    this.orderLogService = orderLogService;
  }

  @GetMapping("/repayments")
  public Object get(@RequestParam String orderId) {
    var order = orderRepository.findById(orderId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "订单不存在"));
    var dto = orderEnricher.enrich(order);
    return Map.of(
      "orderId",
      orderId,
      "repaymentPlan",
      dto.get("repaymentPlan"),
      "repaymentRecords",
      dto.get("repaymentRecords")
    );
  }

  @PostMapping("/orders/{id}/repayments/{period}/mark-paid")
  public Map<String, Object> markPaid(@PathVariable String id, @PathVariable @Min(1) int period) {
    var order = orderRepository.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "订单不存在"));
    var planItem = order.getRepaymentPlan().stream().filter(p -> p.getPeriod() == period).findFirst()
      .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "期次不存在"));
    if (planItem.getAmount() <= 0) throw new ApiException(HttpStatus.BAD_REQUEST, "该期金额为0，无需还款");
    repaymentRepository.save(new RepaymentRecord(order.getId(), period, planItem.getAmount(), Instant.now()));
    orderLogService.add(order, "REPAYMENT_MARK_PAID", "ADMIN", l -> {
      l.setPeriod(period);
      l.setAmount(planItem.getAmount());
    });
    orderRepository.save(order);
    return Map.of("ok", true);
  }
}
