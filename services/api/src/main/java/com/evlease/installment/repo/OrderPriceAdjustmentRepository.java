package com.evlease.installment.repo;

import com.evlease.installment.model.OrderPriceAdjustment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderPriceAdjustmentRepository extends JpaRepository<OrderPriceAdjustment, String> {
  List<OrderPriceAdjustment> findByOrderIdOrderByCreatedAtDesc(String orderId);
  void deleteByOrderId(String orderId);
}
