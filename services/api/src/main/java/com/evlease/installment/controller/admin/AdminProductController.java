package com.evlease.installment.controller.admin;

import com.evlease.installment.common.ApiException;
import com.evlease.installment.model.Product;
import com.evlease.installment.repo.ProductRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/products")
public class AdminProductController {
  private final ProductRepository productRepository;

  public AdminProductController(ProductRepository productRepository) {
    this.productRepository = productRepository;
  }

  @GetMapping
  public List<Product> list() {
    return productRepository.findAll();
  }

  public record UpsertRequest(
    String id,
    @NotNull String name,
    @NotNull Integer rentPerCycle,
    @NotNull String categoryId,
    List<String> tags,
    String coverUrl,
    List<String> images,
    String frameConfig,
    String batteryConfig,
    Integer rentWithoutBattery,
    Integer rentWithBattery
  ) {}

  @PostMapping
  public Product upsert(@Valid @RequestBody UpsertRequest req) {
    if (req.rentPerCycle() <= 0) throw new ApiException(HttpStatus.BAD_REQUEST, "租金/期必须大于0");
    if (req.categoryId() == null || req.categoryId().isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "请选择车型分类");
    }
    var id = (req.id() == null || req.id().isBlank()) ? ("p_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12)) : req.id();
    var tags = req.tags() == null ? List.<String>of() : req.tags();
    var normalizedTags = new ArrayList<String>();
    for (var t : tags) {
      if (t == null) continue;
      var s = t.trim();
      if (!s.isBlank()) normalizedTags.add(s);
    }

    var images = req.images() == null ? List.<String>of() : req.images();
    var normalizedImages = new ArrayList<String>();
    for (var img : images) {
      if (img == null) continue;
      var s = img.trim();
      if (!s.isBlank()) normalizedImages.add(s);
    }

    var coverUrl = req.coverUrl() == null ? "" : req.coverUrl().trim();
    if (!normalizedImages.isEmpty()) {
      coverUrl = normalizedImages.get(0);
    } else if (!coverUrl.isBlank()) {
      normalizedImages.add(coverUrl);
    }

    var p = new Product(
      id,
      req.name(),
      coverUrl,
      req.rentPerCycle(),
      req.categoryId(),
      normalizedTags,
      normalizedImages,
      req.frameConfig() == null ? "" : req.frameConfig(),
      req.batteryConfig() == null ? "" : req.batteryConfig(),
      req.rentWithoutBattery(),
      req.rentWithBattery()
    );
    productRepository.save(p);
    return p;
  }

  @DeleteMapping("/{id}")
  public void delete(@PathVariable String id) {
    if (!productRepository.existsById(id)) {
      throw new ApiException(HttpStatus.NOT_FOUND, "商品不存在");
    }
    productRepository.deleteById(id);
  }
}
