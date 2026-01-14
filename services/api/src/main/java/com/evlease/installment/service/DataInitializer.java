package com.evlease.installment.service;

import com.evlease.installment.model.Product;
import com.evlease.installment.repo.ProductRepository;
import java.util.List;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Profile("dev")
@Component
public class DataInitializer {
  public DataInitializer(ProductRepository productRepository) {
    if (!productRepository.existsById("p1")) {
      productRepository.save(
        new Product(
          "p1",
          "City commuter e-bike (Standard)",
          "",
          299,
          List.of("commute", "installment"),
          List.of(),
          "Standard frame",
          "48V 20Ah",
          269,
          299
        )
      );
    }

    if (!productRepository.existsById("p2")) {
      productRepository.save(
        new Product(
          "p2",
          "Delivery e-bike (Pro)",
          "",
          399,
          List.of("long-range", "heavy-load", "installment"),
          List.of(),
          "Reinforced frame",
          "60V 30Ah",
          359,
          399
        )
      );
    }
  }
}
