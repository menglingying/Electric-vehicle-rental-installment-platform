package com.evlease.installment.controller;

import com.evlease.installment.common.ApiException;
import com.evlease.installment.juzheng.NotaryService;
import com.evlease.installment.repo.ContractRepository;
import com.evlease.installment.repo.OrderRepository;
import com.evlease.installment.repo.PaymentRepository;
import com.evlease.installment.service.OrderLogService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/callbacks")
public class CallbackController {
  private final OrderRepository orderRepository;
  private final ContractRepository contractRepository;
  private final PaymentRepository paymentRepository;
  private final OrderLogService orderLogService;
  private final NotaryService notaryService;

  public CallbackController(
    OrderRepository orderRepository,
    ContractRepository contractRepository,
    PaymentRepository paymentRepository,
    OrderLogService orderLogService,
    NotaryService notaryService
  ) {
    this.orderRepository = orderRepository;
    this.contractRepository = contractRepository;
    this.paymentRepository = paymentRepository;
    this.orderLogService = orderLogService;
    this.notaryService = notaryService;
  }

  public record EsignCallback(@NotBlank String orderId, String status) {}

  @PostMapping("/esign")
  public Map<String, Object> esign(@Valid @RequestBody EsignCallback req) {
    var order = orderRepository.findById(req.orderId()).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "订单不存在"));
    var contract = contractRepository.findById(req.orderId()).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "合同不存在"));
    contract.setStatus(req.status() == null ? "SIGNED" : req.status());
    contract.setUpdatedAt(Instant.now());
    contractRepository.save(contract);
    orderLogService.add(order, "CONTRACT_CALLBACK", "CALLBACK", l -> l.setContractStatus(contract.getStatus()));
    orderRepository.save(order);

    if ("SIGNED".equalsIgnoreCase(contract.getStatus())) {
      try {
        applyNotary(order);
      } catch (Exception ex) {
        order.setNotaryStatus("FAILED");
        orderLogService.add(order, "NOTARY_AUTO_FAILED", "CALLBACK", l -> l.setActor(ex.getMessage()));
        orderRepository.save(order);
      }
    }
    return Map.of("ok", true);
  }

  public record PaymentCallback(@NotBlank String paymentId, String status) {}

  @PostMapping("/payment")
  public Map<String, Object> payment(@Valid @RequestBody PaymentCallback req) {
    var intent = paymentRepository.findById(req.paymentId()).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "支付单不存在"));
    intent.setStatus(req.status() == null ? "SUCCESS" : req.status());
    intent.setUpdatedAt(Instant.now());
    paymentRepository.save(intent);
    var order = orderRepository.findById(intent.getOrderId()).orElse(null);
    if (order != null) {
      orderLogService.add(order, "PAYMENT_CALLBACK", "CALLBACK", l -> {
        l.setPaymentId(intent.getId());
        l.setPaymentStatus(intent.getStatus());
      });
      orderRepository.save(order);
    }
    return Map.of("ok", true);
  }

  private void applyNotary(com.evlease.installment.model.Order order) throws Exception {
    if (order.getNotaryOrderNo() != null && !order.getNotaryOrderNo().isBlank()) {
      return;
    }
    if (!order.isKycCompleted()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "客户未完成KYC，无法发起公证");
    }
    String outOrderNo = notaryService.applyLeaseNotary(order);
    order.setNotaryOrderNo(outOrderNo);
    order.setNotaryStatus("10");
    orderLogService.add(order, "NOTARY_APPLY", "CALLBACK", l -> l.setActor("签署完成后自动发起"));
    orderRepository.save(order);
  }
}
