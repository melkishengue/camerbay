package com.camerbay.camerbay.category;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

  private final CategoryRepository categoryRepository;

  public CategoryListResponse getActiveCategories() {
    List<CategoryResponse> categories = categoryRepository.findByActiveTrue().stream()
        .map(CategoryResponse::from)
        .toList();
    return new CategoryListResponse(categories);
  }

  @Transactional
  public CategoryResponse createCategory(CreateCategoryRequest request) {
    Category category = Category.create(request.title(), request.name());
    Category saved = categoryRepository.save(category);
    return CategoryResponse.from(saved);
  }
}
