package com.evlease.installment.repo;

import com.evlease.installment.model.RepaymentRecord;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RepaymentRepository extends JpaRepository<RepaymentRecord, Long> {
  Optional<RepaymentRecord> findByOrderIdAndPeriod(String orderId, int period);

  List<RepaymentRecord> findByOrderIdOrderByPeriodAsc(String orderId);
}
