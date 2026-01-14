package com.evlease.installment.repo;

import com.evlease.installment.model.Order;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, String> {
  List<Order> findByPhoneOrderByCreatedAtDesc(String phone);

  List<Order> findAllByOrderByCreatedAtDesc();
  
  Optional<Order> findByNotaryOrderNo(String notaryOrderNo);
}
