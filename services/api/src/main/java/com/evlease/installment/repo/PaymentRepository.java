package com.evlease.installment.repo;

import com.evlease.installment.model.PaymentIntent;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<PaymentIntent, String> {
  Optional<PaymentIntent> findFirstByOrderIdOrderByCreatedAtDesc(String orderId);
}
