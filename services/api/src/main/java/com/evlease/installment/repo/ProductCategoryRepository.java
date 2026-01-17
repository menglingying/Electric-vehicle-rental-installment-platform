package com.evlease.installment.repo;

import com.evlease.installment.model.ProductCategory;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductCategoryRepository extends JpaRepository<ProductCategory, String> {
  List<ProductCategory> findAllByOrderByLevelAscSortAsc();

  List<ProductCategory> findAllByStatusOrderByLevelAscSortAsc(int status);

  boolean existsByParentId(String parentId);
}
