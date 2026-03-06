package com.evlease.installment.controller.admin;

import com.evlease.installment.auth.AuthContext;
import com.evlease.installment.auth.PrincipalType;
import com.evlease.installment.common.ApiException;
import com.evlease.installment.model.ProductCategory;
import com.evlease.installment.repo.ProductCategoryRepository;
import com.evlease.installment.repo.ProductRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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
@RequestMapping("/api/admin/categories")
public class AdminCategoryController {
  private final ProductCategoryRepository categoryRepository;
  private final ProductRepository productRepository;

  public AdminCategoryController(ProductCategoryRepository categoryRepository, ProductRepository productRepository) {
    this.categoryRepository = categoryRepository;
    this.productRepository = productRepository;
  }

  @GetMapping("/tree")
  public List<CategoryNode> tree() {
    var categories = categoryRepository.findAllByOrderByLevelAscSortAsc();
    categories.sort(Comparator.comparingInt(ProductCategory::getLevel).thenComparingInt(ProductCategory::getSort));
    return buildTree(categories);
  }

  public record CategoryRequest(
    String id,
    String parentId,
    @NotBlank String name,
    Integer sort,
    Integer status
  ) {}

  @PostMapping
  public ProductCategory upsert(@Valid @RequestBody CategoryRequest req) {
    var name = req.name().trim();
    var parentId = req.parentId() == null ? "" : req.parentId().trim();
    int level = 1;
    if (!parentId.isBlank()) {
      var parent = categoryRepository.findById(parentId)
        .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "上级分类不存在"));
      level = parent.getLevel() + 1;
      if (level > 3) throw new ApiException(HttpStatus.BAD_REQUEST, "仅支持三级分类");
    }

    var sort = req.sort() == null ? 0 : req.sort();
    var status = req.status() == null ? 1 : req.status();
    if (status != 0 && status != 1) throw new ApiException(HttpStatus.BAD_REQUEST, "状态仅支持0/1");

    var id = req.id();
    if (id == null || id.isBlank()) {
      id = "cat_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    } else if (!categoryRepository.existsById(id)) {
      throw new ApiException(HttpStatus.NOT_FOUND, "分类不存在");
    }

    var entity = new ProductCategory(id, parentId.isBlank() ? null : parentId, level, name, sort, status);
    categoryRepository.save(entity);
    return entity;
  }

  @DeleteMapping("/{id}")
  public void delete(@PathVariable String id, HttpServletRequest request) {
    var principal = AuthContext.require(request, PrincipalType.ADMIN);
    if (!"SUPER".equals(principal.role())) {
      throw new ApiException(HttpStatus.FORBIDDEN, "仅总账号可执行删除操作");
    }
    if (!categoryRepository.existsById(id)) {
      throw new ApiException(HttpStatus.NOT_FOUND, "分类不存在");
    }
    if (categoryRepository.existsByParentId(id)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "请先删除下级分类");
    }
    if (productRepository.existsByCategoryId(id)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "该分类下仍有商品");
    }
    categoryRepository.deleteById(id);
  }

  private List<CategoryNode> buildTree(List<ProductCategory> categories) {
    Map<String, CategoryNode> nodes = new LinkedHashMap<>();
    for (var c : categories) {
      nodes.put(c.getId(), new CategoryNode(c.getId(), c.getParentId(), c.getName(), c.getLevel(), c.getStatus(), c.getSort()));
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
    private final String parentId;
    private final String name;
    private final int level;
    private final int status;
    private final int sort;
    private final List<CategoryNode> children = new ArrayList<>();

    public CategoryNode(String id, String parentId, String name, int level, int status, int sort) {
      this.id = id;
      this.parentId = parentId;
      this.name = name;
      this.level = level;
      this.status = status;
      this.sort = sort;
    }

    public String getId() {
      return id;
    }

    public String getName() {
      return name;
    }

    public String getParentId() {
      return parentId;
    }

    public int getLevel() {
      return level;
    }

    public int getStatus() {
      return status;
    }

    public int getSort() {
      return sort;
    }

    public List<CategoryNode> getChildren() {
      return children;
    }
  }
}
