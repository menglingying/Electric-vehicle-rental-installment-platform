package com.evlease.installment.controller.admin;

import com.evlease.installment.auth.AuthContext;
import com.evlease.installment.auth.PrincipalType;
import com.evlease.installment.common.ApiException;
import com.evlease.installment.model.Order;
import com.evlease.installment.model.OrderStatus;
import com.evlease.installment.repo.ContractRepository;
import com.evlease.installment.repo.OrderPriceAdjustmentRepository;
import com.evlease.installment.repo.OrderRepository;
import com.evlease.installment.service.OrderEnricher;
import com.evlease.installment.service.OrderLogService;
import com.evlease.installment.service.OrderPlanService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/orders")
public class AdminOrderController {
  private final OrderRepository orderRepository;
  private final OrderEnricher orderEnricher;
  private final OrderLogService orderLogService;
  private final OrderPlanService orderPlanService;
  private final OrderPriceAdjustmentRepository adjustmentRepository;
  private final ContractRepository contractRepository;

  public AdminOrderController(
    OrderRepository orderRepository,
    OrderEnricher orderEnricher,
    OrderLogService orderLogService,
    OrderPlanService orderPlanService,
    OrderPriceAdjustmentRepository adjustmentRepository,
    ContractRepository contractRepository
  ) {
    this.orderRepository = orderRepository;
    this.orderEnricher = orderEnricher;
    this.orderLogService = orderLogService;
    this.orderPlanService = orderPlanService;
    this.adjustmentRepository = adjustmentRepository;
    this.contractRepository = contractRepository;
  }

  @GetMapping
  public List<Map<String, Object>> list() {
    return orderRepository.findAllByOrderByCreatedAtDesc().stream()
      .map(orderEnricher::enrich)
      .toList();
  }

  @GetMapping("/{id}")
  public Object get(@PathVariable String id) {
    var order = orderRepository.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "订单不存在"));
    return orderEnricher.enrich(order);
  }

  @PostMapping("/{id}/approve")
  public Order approve(@PathVariable String id) {
    var order = orderRepository.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "订单不存在"));
    if (order.getStatus() != OrderStatus.PENDING_REVIEW) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "订单状态不允许操作");
    }
    order.setStatus(OrderStatus.ACTIVE);
    order.setApprovedAt(Instant.now());
    orderLogService.add(order, "APPROVED", "ADMIN");
    orderRepository.save(order);
    return order;
  }

  public record RejectRequest(@NotBlank String reason) {}

  @PostMapping("/{id}/reject")
  public Order reject(@PathVariable String id, @Valid @RequestBody RejectRequest req) {
    var order = orderRepository.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "订单不存在"));
    if (order.getStatus() != OrderStatus.PENDING_REVIEW) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "订单状态不允许操作");
    }
    order.setStatus(OrderStatus.REJECTED);
    order.setRejectedAt(Instant.now());
    orderLogService.add(order, "REJECTED", "ADMIN", l -> l.setActor(req.reason()));
    orderRepository.save(order);
    return order;
  }

  @PostMapping("/{id}/deliver")
  public Order deliver(@PathVariable String id) {
    var order = orderRepository.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "订单不存在"));
    if (order.getStatus() != OrderStatus.ACTIVE) throw new ApiException(HttpStatus.BAD_REQUEST, "订单状态不允许操作");
    order.setStatus(OrderStatus.DELIVERED);
    order.setDeliveredAt(Instant.now());
    orderLogService.add(order, "DELIVERED", "ADMIN");
    orderRepository.save(order);
    return order;
  }

  @PostMapping("/{id}/pickup")
  public Order pickup(@PathVariable String id) {
    var order = orderRepository.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "订单不存在"));
    if (order.getStatus() != OrderStatus.DELIVERED) throw new ApiException(HttpStatus.BAD_REQUEST, "订单状态不允许操作");
    order.setStatus(OrderStatus.IN_USE);
    order.setPickedUpAt(Instant.now());
    orderLogService.add(order, "PICKED_UP", "ADMIN");
    orderRepository.save(order);
    return order;
  }

  @PostMapping("/{id}/return")
  public Order doReturn(@PathVariable String id) {
    var order = orderRepository.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "订单不存在"));
    if (order.getStatus() != OrderStatus.IN_USE) throw new ApiException(HttpStatus.BAD_REQUEST, "订单状态不允许操作");
    order.setStatus(OrderStatus.RETURNED);
    order.setReturnedAt(Instant.now());
    orderLogService.add(order, "RETURNED", "ADMIN");
    orderRepository.save(order);
    return order;
  }

  @PostMapping("/{id}/settle")
  public Order settle(@PathVariable String id) {
    var order = orderRepository.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "订单不存在"));
    if (order.getStatus() != OrderStatus.RETURNED) throw new ApiException(HttpStatus.BAD_REQUEST, "订单状态不允许操作");
    order.setStatus(OrderStatus.SETTLED);
    order.setSettledAt(Instant.now());
    orderLogService.add(order, "SETTLED", "ADMIN");
    orderRepository.save(order);
    return order;
  }

  @PostMapping("/{id}/close")
  public Order close(@PathVariable String id) {
    var order = orderRepository.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "订单不存在"));
    if (order.getStatus() == OrderStatus.SETTLED || order.getStatus() == OrderStatus.REJECTED) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "订单状态不允许操作");
    }
    order.setStatus(OrderStatus.CLOSED);
    order.setClosedAt(Instant.now());
    orderLogService.add(order, "CLOSED", "ADMIN");
    orderRepository.save(order);
    return order;
  }

  public record PriceAdjustRequest(
    @Min(1) int rentPerPeriod,
    @Min(3) int periods,
    @Min(7) int cycleDays,
    @NotBlank String reason
  ) {}

  @PostMapping("/{id}/price-adjust")
  public Order adjustPrice(@PathVariable String id, @Valid @RequestBody PriceAdjustRequest req) {
    var order = orderRepository.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "订单不存在"));
    if (order.getStatus() != OrderStatus.PENDING_REVIEW) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "仅审核前订单可调价");
    }

    var beforeRent = order.getRepaymentPlan() == null
      ? 0
      : order.getRepaymentPlan().stream().mapToInt(item -> item.getAmount()).max().orElse(0);
    var beforePeriods = order.getPeriods();
    var beforeCycleDays = order.getCycleDays();

    order.setPeriods(req.periods());
    order.setCycleDays(req.cycleDays());
    // baseDate 固定为订单创建日；调价不改写还款日的历史锚点
    order.setRepaymentPlan(orderPlanService.buildRentPlan(
        req.rentPerPeriod(), req.periods(), req.cycleDays(), order.getDepositRatio(),
        com.evlease.installment.service.OrderPlanService.baseDateOf(order)));

    var adjustment = new com.evlease.installment.model.OrderPriceAdjustment();
    adjustment.setId("adj_" + UUID.randomUUID().toString().replace("-", ""));
    adjustment.setOrderId(order.getId());
    adjustment.setBeforeRentPerPeriod(beforeRent);
    adjustment.setAfterRentPerPeriod(req.rentPerPeriod());
    adjustment.setBeforePeriods(beforePeriods);
    adjustment.setAfterPeriods(req.periods());
    adjustment.setBeforeCycleDays(beforeCycleDays);
    adjustment.setAfterCycleDays(req.cycleDays());
    adjustment.setReason(req.reason());
    adjustment.setOperatorName("admin");
    adjustment.setCreatedAt(Instant.now());
    adjustmentRepository.save(adjustment);

    var contract = contractRepository.findById(order.getId()).orElse(null);
    if (contract != null) {
      contract.setStatus("VOID");
      contract.setVoidReason("PRICE_ADJUST");
      contract.setUpdatedAt(Instant.now());
      contractRepository.save(contract);
    }

    orderLogService.add(order, "PRICE_ADJUSTED", "ADMIN", l -> l.setActor(req.reason()));
    orderRepository.save(order);
    return order;
  }

  @DeleteMapping("/{orderId}")
  @Transactional
  public void delete(@PathVariable String orderId, HttpServletRequest request) {
    var principal = AuthContext.require(request, PrincipalType.ADMIN);
    if (!"SUPER".equals(principal.role())) {
      throw new ApiException(HttpStatus.FORBIDDEN, "仅总账号可执行删除操作");
    }
    var order = orderRepository.findById(orderId)
      .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "订单不存在"));
    
    if (order.getStatus() == OrderStatus.IN_USE) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "使用中的订单不能删除");
    }
    
    // 删除关联的合同
    contractRepository.deleteById(orderId);
    
    // 删除调价记录
    adjustmentRepository.deleteByOrderId(orderId);
    
    // 删除订单
    orderRepository.deleteById(orderId);
  }

  /**
   * 重置订单为ACTIVE状态，删除合同，方便测试
   */
  @PostMapping("/{orderId}/reset-for-test")
  @Transactional
  public Map<String, Object> resetForTest(@PathVariable String orderId) {
    var order = orderRepository.findById(orderId)
      .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "订单不存在"));
    
    // 重置订单状态为 ACTIVE
    order.setStatus(OrderStatus.ACTIVE);
    
    // 删除关联的合同
    contractRepository.deleteById(orderId);
    
    // 清除公证相关字段
    order.setNotaryOrderNo(null);
    order.setNotaryStatus(null);
    order.setNotaryCertifiedTime(null);
    order.setNotaryName(null);
    order.setNotaryCertUrl(null);
    
    orderLogService.add(order, "RESET_FOR_TEST", "ADMIN");
    orderRepository.save(order);
    
    return orderEnricher.enrich(order);
  }
}
