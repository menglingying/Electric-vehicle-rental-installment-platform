package com.evlease.installment.repo;

import com.evlease.installment.model.Region;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RegionRepository extends JpaRepository<Region, String> {
  List<Region> findByParentCodeOrderBySortAsc(String parentCode);

  List<Region> findByLevelOrderBySortAsc(int level);
}
