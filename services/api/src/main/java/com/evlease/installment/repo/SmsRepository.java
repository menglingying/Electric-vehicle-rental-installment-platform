package com.evlease.installment.repo;

import com.evlease.installment.model.SmsRecord;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SmsRepository extends JpaRepository<SmsRecord, String> {
  List<SmsRecord> findAllByOrderByCreatedAtDesc();
}
