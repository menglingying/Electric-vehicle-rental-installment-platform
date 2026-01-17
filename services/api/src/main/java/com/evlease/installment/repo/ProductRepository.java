package com.evlease.installment.repo;

import com.evlease.installment.model.Product;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, String> {
  List<Product> findAllByCategoryId(String categoryId);

  boolean existsByCategoryId(String categoryId);
}
