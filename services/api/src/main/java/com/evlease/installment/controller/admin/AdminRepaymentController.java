package com.evlease.installment.controller.admin;

import com.evlease.installment.common.ApiException;
import com.evlease.installment.model.RepaymentRecord;
import com.evlease.installment.repo.OrderRepository;
import com.evlease.installment.repo.ProductRepository;
import com.evlease.installment.repo.RepaymentRepository;
import com.evlease.installment.service.OrderEnricher;
import com.evlease.installment.service.OrderLogService;
import com.evlease.installment.service.OrderPlanService;
import jakarta.validation.constraints.Min;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
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
  private final ProductRepository productRepository;
  private final OrderEnricher orderEnricher;
  private final OrderLogService orderLogService;
  private final OrderPlanService orderPlanService;

  public AdminRepaymentController(
    OrderRepository orderRepository,
    RepaymentRepository repaymentRepository,
    ProductRepository productRepository,
    OrderEnricher orderEnricher,
    OrderLogService orderLogService,
    OrderPlanService orderPlanService
  ) {
    this.orderRepository = orderRepository;
    this.repaymentRepository = repaymentRepository;
    this.productRepository = productRepository;
    this.orderEnricher = orderEnricher;
    this.orderLogService = orderLogService;
    this.orderPlanService = orderPlanService;
  }

  @GetMapping("/repayments")
  public Object get(@RequestParam String orderId) {
    var order = orderRepository.findById(orderId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "订单不存在"));
    var dto = orderEnricher.enrich(order);
    var result = new HashMap<String, Object>();
    result.put("orderId", orderId);
    result.put("repaymentPlan", dto.get("repaymentPlan"));
    result.put("repaymentRecords", dto.get("repaymentRecords"));
    return result;
  }

  @PostMapping("/orders/{id}/generate-plan")
  public Map<String, Object> generatePlan(@PathVariable String id,
      @RequestParam(defaultValue = "false") boolean force) {
    var order = orderRepository.findById(id)
      .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "订单不存在"));

    if (!force && order.getRepaymentPlan() != null && !order.getRepaymentPlan().isEmpty()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "该订单已有还款计划，如需重算请传 force=true");
    }

    var product = productRepository.findById(order.getProductId()).orElse(null);
    int rentPerCycle;
    if (product != null) {
      if ("WITH_BATTERY".equals(order.getBatteryOption()) && product.getRentWithBattery() != null) {
        rentPerCycle = product.getRentWithBattery();
      } else if ("WITHOUT_BATTERY".equals(order.getBatteryOption()) && product.getRentWithoutBattery() != null) {
        rentPerCycle = product.getRentWithoutBattery();
      } else {
        rentPerCycle = product.getRentPerCycle();
      }
    } else {
      throw new ApiException(HttpStatus.BAD_REQUEST, "找不到关联商品，无法计算租金");
    }

    var plan = orderPlanService.buildRentPlan(rentPerCycle, order.getPeriods(), order.getCycleDays(), order.getDepositRatio());
    order.setRepaymentPlan(plan);
    orderRepository.save(order);

    orderLogService.add(order, "PLAN_GENERATED", "ADMIN", l -> {});

    return Map.of("ok", true, "periods", plan.size());
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
