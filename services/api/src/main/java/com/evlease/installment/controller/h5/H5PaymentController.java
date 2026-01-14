package com.evlease.installment.controller.h5;

import com.evlease.installment.auth.AuthContext;
import com.evlease.installment.auth.PrincipalType;
import com.evlease.installment.common.ApiException;
import com.evlease.installment.model.PaymentIntent;
import com.evlease.installment.repo.OrderRepository;
import com.evlease.installment.repo.PaymentRepository;
import com.evlease.installment.service.OrderLogService;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/h5/orders")
public class H5PaymentController {
  private final OrderRepository orderRepository;
  private final PaymentRepository paymentRepository;
  private final OrderLogService orderLogService;

  public H5PaymentController(
    OrderRepository orderRepository,
    PaymentRepository paymentRepository,
    OrderLogService orderLogService
  ) {
    this.orderRepository = orderRepository;
    this.paymentRepository = paymentRepository;
    this.orderLogService = orderLogService;
  }

  @PostMapping("/{orderId}/payment/start")
  public PaymentIntent start(HttpServletRequest request, @PathVariable String orderId) {
    var principal = AuthContext.require(request, PrincipalType.H5);
    var order = orderRepository.findById(orderId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "订单不存在"));
    if (!order.getPhone().equals(principal.phoneOrUsername())) throw new ApiException(HttpStatus.FORBIDDEN, "无权限");

    var intent = new PaymentIntent();
    intent.setId("pay_" + UUID.randomUUID().toString().replace("-", ""));
    intent.setOrderId(orderId);
    intent.setStatus("PENDING");
    intent.setCashierUrl("https://example.com/pay/cashier?paymentId=" + intent.getId());
    intent.setCreatedAt(Instant.now());
    intent.setUpdatedAt(Instant.now());
    paymentRepository.save(intent);

    orderLogService.add(order, "PAYMENT_STARTED", "H5", l -> {
      l.setActor(principal.phoneOrUsername());
      l.setPaymentId(intent.getId());
    });
    orderRepository.save(order);
    return intent;
  }
}

