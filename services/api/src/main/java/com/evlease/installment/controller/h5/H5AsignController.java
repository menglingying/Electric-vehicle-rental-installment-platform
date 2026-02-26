package com.evlease.installment.controller.h5;

import com.evlease.installment.asign.AsignService;
import com.evlease.installment.auth.AuthContext;
import com.evlease.installment.auth.PrincipalType;
import com.evlease.installment.common.ApiException;
import com.evlease.installment.repo.OrderRepository;
import com.evlease.installment.service.OrderLogService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/h5/orders")
public class H5AsignController {
  private final OrderRepository orderRepository;
  private final OrderLogService orderLogService;
  private final AsignService asignService;

  public H5AsignController(
    OrderRepository orderRepository,
    OrderLogService orderLogService,
    AsignService asignService
  ) {
    this.orderRepository = orderRepository;
    this.orderLogService = orderLogService;
    this.asignService = asignService;
  }

  @PostMapping("/{orderId}/asign-auth")
  public Map<String, Object> startAuth(HttpServletRequest request, @PathVariable String orderId) throws Exception {
    var principal = AuthContext.require(request, PrincipalType.H5);
    var order = orderRepository.findById(orderId)
      .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "订单不存在"));
    if (!order.getPhone().equals(principal.phoneOrUsername())) {
      throw new ApiException(HttpStatus.FORBIDDEN, "无权限");
    }
    if (!order.isKycCompleted()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "请先完成资料提交");
    }

    var result = asignService.requestPersonIdentifyUrl(order);
    if (result.serialNo() != null && !result.serialNo().isBlank()) {
      order.setAsignSerialNo(result.serialNo());
      // 清空旧的认证结果，等待回调更新
      order.setAsignAuthResult(null);
    }
    orderLogService.add(order, "ASIGN_AUTH_START", "H5", l -> l.setActor(principal.phoneOrUsername()));
    orderRepository.save(order);

    if (result.authUrl() == null || result.authUrl().isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "爱签认证链接生成失败");
    }
    return Map.of("authUrl", result.authUrl(), "serialNo", result.serialNo());
  }
}
