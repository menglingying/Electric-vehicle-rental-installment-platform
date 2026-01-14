package com.evlease.installment.controller.admin;

import com.evlease.installment.common.ApiException;
import com.evlease.installment.model.Order;
import com.evlease.installment.model.OrderStatus;
import com.evlease.installment.repo.OrderRepository;
import com.evlease.installment.service.OrderEnricher;
import com.evlease.installment.service.OrderLogService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
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

  public AdminOrderController(OrderRepository orderRepository, OrderEnricher orderEnricher, OrderLogService orderLogService) {
    this.orderRepository = orderRepository;
    this.orderEnricher = orderEnricher;
    this.orderLogService = orderLogService;
  }

  @GetMapping
  public List<Order> list() {
    return orderRepository.findAllByOrderByCreatedAtDesc();
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
}
