package com.evlease.installment.repo;

import com.evlease.installment.model.BlacklistEntry;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BlacklistRepository extends JpaRepository<BlacklistEntry, String> {}
