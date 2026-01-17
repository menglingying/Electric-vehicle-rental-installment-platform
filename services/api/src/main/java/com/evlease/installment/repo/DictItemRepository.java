package com.evlease.installment.repo;

import com.evlease.installment.model.DictItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DictItemRepository extends JpaRepository<DictItem, String> {
  List<DictItem> findByDictCodeAndStatusOrderBySortAsc(String dictCode, int status);
}
