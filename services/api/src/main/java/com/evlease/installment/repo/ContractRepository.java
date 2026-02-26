package com.evlease.installment.repo;

import com.evlease.installment.model.Contract;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContractRepository extends JpaRepository<Contract, String> {
  Contract findByContractNo(String contractNo);
}
