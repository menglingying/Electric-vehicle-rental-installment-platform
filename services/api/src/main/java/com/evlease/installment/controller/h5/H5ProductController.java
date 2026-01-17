package com.evlease.installment.controller.h5;

import com.evlease.installment.common.ApiException;
import com.evlease.installment.model.Product;
import com.evlease.installment.repo.ProductRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/h5/products")
public class H5ProductController {
  private final ProductRepository productRepository;

  public H5ProductController(ProductRepository productRepository) {
    this.productRepository = productRepository;
  }

  @GetMapping
  public List<Product> list(@RequestParam(required = false) String categoryId) {
    if (categoryId == null || categoryId.isBlank()) return productRepository.findAll();
    return productRepository.findAllByCategoryId(categoryId);
  }

  @GetMapping("/{id}")
  public Product get(@PathVariable String id) {
    return productRepository.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "商品不存在"));
  }
}
