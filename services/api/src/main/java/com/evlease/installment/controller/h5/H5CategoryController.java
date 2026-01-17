package com.evlease.installment.controller.h5;

import com.evlease.installment.model.ProductCategory;
import com.evlease.installment.repo.ProductCategoryRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/h5/categories")
public class H5CategoryController {
  private final ProductCategoryRepository categoryRepository;

  public H5CategoryController(ProductCategoryRepository categoryRepository) {
    this.categoryRepository = categoryRepository;
  }

  @GetMapping("/tree")
  public List<CategoryNode> tree() {
    var categories = categoryRepository.findAllByStatusOrderByLevelAscSortAsc(1);
    categories.sort(Comparator.comparingInt(ProductCategory::getLevel).thenComparingInt(ProductCategory::getSort));
    return buildTree(categories);
  }

  private List<CategoryNode> buildTree(List<ProductCategory> categories) {
    Map<String, CategoryNode> nodes = new LinkedHashMap<>();
    for (var c : categories) {
      nodes.put(c.getId(), new CategoryNode(c.getId(), c.getName(), c.getLevel()));
    }

    List<CategoryNode> roots = new ArrayList<>();
    for (var c : categories) {
      var node = nodes.get(c.getId());
      if (c.getParentId() == null || c.getParentId().isBlank()) {
        roots.add(node);
      } else {
        var parent = nodes.get(c.getParentId());
        if (parent != null) parent.children.add(node);
      }
    }
    return roots;
  }

  public static class CategoryNode {
    private final String id;
    private final String name;
    private final int level;
    private final List<CategoryNode> children = new ArrayList<>();

    public CategoryNode(String id, String name, int level) {
      this.id = id;
      this.name = name;
      this.level = level;
    }

    public String getId() {
      return id;
    }

    public String getName() {
      return name;
    }

    public int getLevel() {
      return level;
    }

    public List<CategoryNode> getChildren() {
      return children;
    }
  }
}
