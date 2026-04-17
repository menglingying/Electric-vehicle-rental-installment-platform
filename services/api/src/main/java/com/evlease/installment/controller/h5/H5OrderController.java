package com.evlease.installment.controller.h5;

import com.evlease.installment.auth.AuthContext;
import com.evlease.installment.auth.PrincipalType;
import com.evlease.installment.common.ApiException;
import com.evlease.installment.model.Order;
import com.evlease.installment.model.OrderStatus;
import com.evlease.installment.repo.BlacklistRepository;
import com.evlease.installment.repo.ContractRepository;
import com.evlease.installment.repo.OrderRepository;
import com.evlease.installment.repo.ProductRepository;
import com.evlease.installment.service.OrderEnricher;
import com.evlease.installment.service.OrderLogService;
import com.evlease.installment.service.OrderPlanService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/h5/orders")
public class H5OrderController {
  private final ProductRepository productRepository;
  private final OrderRepository orderRepository;
  private final BlacklistRepository blacklistRepository;
  private final ContractRepository contractRepository;
  private final OrderEnricher orderEnricher;
  private final OrderLogService orderLogService;
  private final OrderPlanService orderPlanService;

  public H5OrderController(
    ProductRepository productRepository,
    OrderRepository orderRepository,
    BlacklistRepository blacklistRepository,
    ContractRepository contractRepository,
    OrderEnricher orderEnricher,
    OrderLogService orderLogService,
    OrderPlanService orderPlanService
  ) {
    this.productRepository = productRepository;
    this.orderRepository = orderRepository;
    this.blacklistRepository = blacklistRepository;
    this.contractRepository = contractRepository;
    this.orderEnricher = orderEnricher;
    this.orderLogService = orderLogService;
    this.orderPlanService = orderPlanService;
  }

  public record CreateOrderRequest(
    @NotBlank String productId,
    @Min(3) @Max(60) int periods,
    @Min(7) @Max(60) int cycleDays,
    @Min(0) @Max(1) double depositRatio,
    String batteryOption,
    String repaymentMethod
  ) {}

  @PostMapping
  public Object create(HttpServletRequest request, @Valid @RequestBody CreateOrderRequest req) {
    var principal = AuthContext.require(request, PrincipalType.H5);
    var phone = principal.phoneOrUsername();

    if (blacklistRepository.existsById(phone)) {
      throw new ApiException(HttpStatus.FORBIDDEN, "该账号已被限制下单");
    }

    var product = productRepository
      .findById(req.productId())
      .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "商品不存在"));

    var order = new Order();
    order.setId("o_" + UUID.randomUUID().toString().replace("-", ""));
    order.setPhone(phone);
    order.setProductId(product.getId());
    String displayName = product.getBrand() != null && !product.getBrand().isBlank()
        ? product.getBrand() + " " + product.getName()
        : product.getName();
    order.setProductName(displayName);
    order.setPeriods(req.periods());
    order.setCycleDays(req.cycleDays());
    order.setDepositRatio(req.depositRatio());
    order.setBatteryOption(req.batteryOption() != null ? req.batteryOption() : "WITHOUT_BATTERY");
    order.setRepaymentMethod(req.repaymentMethod() != null ? req.repaymentMethod() : "MANUAL_TRANSFER");
    order.setKycCompleted(false);
    order.setStatus(OrderStatus.PENDING_REVIEW);
    order.setCreatedAt(Instant.now());

    var batteryOption = req.batteryOption() != null ? req.batteryOption() : "WITHOUT_BATTERY";
    
    // 根据电池选项确定租金
    int rentPerCycle = product.getRentPerCycle();
    if ("WITH_BATTERY".equals(batteryOption) && product.getRentWithBattery() != null) {
      rentPerCycle = product.getRentWithBattery();
    } else if ("WITHOUT_BATTERY".equals(batteryOption) && product.getRentWithoutBattery() != null) {
      rentPerCycle = product.getRentWithoutBattery();
    }

    // 新订单基准日 = 下单当天（上海时区），后续任何重算请保持这个 baseDate 不变。
    order.setRepaymentPlan(orderPlanService.buildRentPlan(
        rentPerCycle, req.periods(), req.cycleDays(), req.depositRatio(),
        OrderPlanService.baseDateOf(order)));
    order.setStatusLogs(new ArrayList<>());
    orderLogService.add(order, "CREATED", "H5", l -> l.setActor(phone));
    orderRepository.save(order);
    return orderEnricher.enrich(order);
  }

  @GetMapping
  public List<java.util.Map<String, Object>> list(HttpServletRequest request) {
    var principal = AuthContext.require(request, PrincipalType.H5);
    return orderRepository.findByPhoneOrderByCreatedAtDesc(principal.phoneOrUsername()).stream().map(orderEnricher::enrich).toList();
  }

  @GetMapping("/{id}")
  public Object get(HttpServletRequest request, @PathVariable String id) {
    var principal = AuthContext.require(request, PrincipalType.H5);
    var order = orderRepository.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "订单不存在"));
    if (!order.getPhone().equals(principal.phoneOrUsername())) {
      throw new ApiException(HttpStatus.FORBIDDEN, "无权限");
    }
    return orderEnricher.enrich(order);
  }

  public record UpdateOrderRequest(
    @Min(3) @Max(60) int periods,
    @Min(7) @Max(60) int cycleDays,
    @Min(0) @Max(1) double depositRatio,
    String batteryOption,
    String repaymentMethod
  ) {}

  @PutMapping("/{id}")
  public Object update(HttpServletRequest request, @PathVariable String id, @Valid @RequestBody UpdateOrderRequest req) {
    var principal = AuthContext.require(request, PrincipalType.H5);
    var order = orderRepository.findById(id)
      .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "订单不存在"));

    if (!order.getPhone().equals(principal.phoneOrUsername())) {
      throw new ApiException(HttpStatus.FORBIDDEN, "无权限");
    }
    if (order.getStatus() != OrderStatus.PENDING_REVIEW) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "仅待审核状态的订单可以修改");
    }
    // 双保险：即使上层 status 校验被绕过，也不允许在已签合同的订单上改 plan
    assertNoSignedContract(id);

    var product = productRepository.findById(order.getProductId())
      .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "关联商品不存在"));

    order.setPeriods(req.periods());
    order.setCycleDays(req.cycleDays());
    order.setDepositRatio(req.depositRatio());
    order.setBatteryOption(req.batteryOption() != null ? req.batteryOption() : order.getBatteryOption());
    order.setRepaymentMethod(req.repaymentMethod() != null ? req.repaymentMethod() : order.getRepaymentMethod());

    var batteryOption = order.getBatteryOption();
    int rentPerCycle = product.getRentPerCycle();
    if ("WITH_BATTERY".equals(batteryOption) && product.getRentWithBattery() != null) {
      rentPerCycle = product.getRentWithBattery();
    } else if ("WITHOUT_BATTERY".equals(batteryOption) && product.getRentWithoutBattery() != null) {
      rentPerCycle = product.getRentWithoutBattery();
    }

    // 继续沿用"下单当天"作为基准，保证 H5 修改订单不会推迟还款日
    var newPlan = orderPlanService.buildRentPlan(
        rentPerCycle, req.periods(), req.cycleDays(), req.depositRatio(),
        OrderPlanService.baseDateOf(order));
    if (order.getRepaymentPlan() != null) {
      order.getRepaymentPlan().clear();
      order.getRepaymentPlan().addAll(newPlan);
    } else {
      order.setRepaymentPlan(newPlan);
    }

    orderLogService.add(order, "UPDATED", "H5", l -> l.setActor(principal.phoneOrUsername()));
    orderRepository.save(order);
    return orderEnricher.enrich(order);
  }

  private void assertNoSignedContract(String orderId) {
    var contract = contractRepository.findById(orderId).orElse(null);
    if (contract != null && "SIGNED".equalsIgnoreCase(contract.getStatus())) {
      throw new ApiException(HttpStatus.BAD_REQUEST,
        "合同已签署，不能修改还款计划。如需变更金额请联系管理员作废合同后重新生成。");
    }
  }
}
