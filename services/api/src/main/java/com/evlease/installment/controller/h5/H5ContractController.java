package com.evlease.installment.controller.h5;

import com.evlease.installment.auth.AuthContext;
import com.evlease.installment.auth.PrincipalType;
import com.evlease.installment.common.ApiException;
import com.evlease.installment.model.Contract;
import com.evlease.installment.repo.ContractRepository;
import com.evlease.installment.repo.OrderRepository;
import com.evlease.installment.service.OrderLogService;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/h5/contracts")
public class H5ContractController {
  private final OrderRepository orderRepository;
  private final ContractRepository contractRepository;
  private final OrderLogService orderLogService;

  public H5ContractController(
    OrderRepository orderRepository,
    ContractRepository contractRepository,
    OrderLogService orderLogService
  ) {
    this.orderRepository = orderRepository;
    this.contractRepository = contractRepository;
    this.orderLogService = orderLogService;
  }

  @PostMapping("/{orderId}/start")
  public Contract start(HttpServletRequest request, @PathVariable String orderId) {
    var principal = AuthContext.require(request, PrincipalType.H5);
    var order = orderRepository.findById(orderId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "订单不存在"));
    if (!order.getPhone().equals(principal.phoneOrUsername())) throw new ApiException(HttpStatus.FORBIDDEN, "无权限");

    var existing = contractRepository.findById(orderId).orElse(null);
    if (existing != null && ("SIGNING".equals(existing.getStatus()) || "SIGNED".equals(existing.getStatus()))) {
      return existing;
    }

    var contract = new Contract();
    contract.setId("c_" + UUID.randomUUID().toString().replace("-", ""));
    contract.setOrderId(orderId);
    contract.setStatus("SIGNING");
    contract.setSignUrl("https://example.com/esign/sign?orderId=" + orderId);
    contract.setCreatedAt(Instant.now());
    contract.setUpdatedAt(Instant.now());
    contractRepository.save(contract);

    orderLogService.add(order, "CONTRACT_STARTED", "H5", l -> l.setActor(principal.phoneOrUsername()));
    orderRepository.save(order);
    return contract;
  }

  @GetMapping("/{orderId}")
  public Contract get(HttpServletRequest request, @PathVariable String orderId) {
    var principal = AuthContext.require(request, PrincipalType.H5);
    var order = orderRepository.findById(orderId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "订单不存在"));
    if (!order.getPhone().equals(principal.phoneOrUsername())) throw new ApiException(HttpStatus.FORBIDDEN, "无权限");
    return contractRepository.findById(orderId).orElse(null);
  }
}
