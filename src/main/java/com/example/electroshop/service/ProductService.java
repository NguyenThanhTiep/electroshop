package com.example.electroshop.service;

import com.example.electroshop.dto.ProductResponse;
import com.example.electroshop.entity.Product;
import com.example.electroshop.entity.ProductImage;
import com.example.electroshop.entity.Review;
import com.example.electroshop.repository.BrandRepository;
import com.example.electroshop.repository.CategoryRepository;
import com.example.electroshop.repository.FlashSaleItemRepository;
import com.example.electroshop.repository.OrderItemRepository;
import com.example.electroshop.repository.ProductRepository;
import com.example.electroshop.repository.PromotionRepository;
import com.example.electroshop.repository.ReviewRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final OrderItemRepository orderItemRepository;
    private final PromotionRepository promotionRepository;
    private final FlashSaleItemRepository flashSaleItemRepository;
    private final ReviewRepository reviewRepository;

    public List<ProductResponse> getAllProducts() {
        List<Product> products = productRepository.findAll();
        Map<Long, RatingStats> ratingMap = buildRatingMap(products);

        return products
                .stream()
                .map(product -> toProductResponse(product, ratingMap.get(product.getId())))
                .toList();
    }

    public ProductResponse getProductById(Long id) {
        Product product = getProductEntityById(id);
        RatingStats ratingStats = buildRatingStats(
                reviewRepository.findByProductIdOrderByCreatedAtDesc(id)
        );

        return toProductResponse(product, ratingStats);
    }

    private Product getProductEntityById(Long id) {
        return productRepository
                .findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Không tìm thấy sản phẩm"
                        )
                );
    }

    public Product createProduct(Product product) {
        validateProduct(product, null);
        normalizeProduct(product);

        if (product.getImages() != null) {
            for (ProductImage image : product.getImages()) {
                image.setId(null);
                image.setProduct(product);
            }
        }

        return productRepository.save(product);
    }

    public Product updateProduct(
            Long id,
            Product product
    ) {
        Product existingProduct =
                getProductEntityById(id);

        validateProduct(product, id);
        normalizeProduct(product);

        existingProduct.setName(product.getName());
        existingProduct.setPrice(product.getPrice());
        existingProduct.setImage(product.getImage());
        existingProduct.setDescription(product.getDescription());
        existingProduct.setSpecifications(product.getSpecifications());
        existingProduct.setHighlights(product.getHighlights());
        existingProduct.setPromotions(product.getPromotions());
        existingProduct.setOptions(product.getOptions());
        existingProduct.setStock(product.getStock());
        existingProduct.setCategory(product.getCategory());
        existingProduct.setBrand(product.getBrand());

        if (existingProduct.getImages() == null) {
            existingProduct.setImages(new ArrayList<>());
        } else {
            existingProduct.getImages().clear();
        }

        if (product.getImages() != null) {
            for (ProductImage image : product.getImages()) {
                image.setId(null);
                image.setProduct(existingProduct);
                existingProduct.getImages().add(image);
            }
        }

        return productRepository.save(existingProduct);
    }

    public void deleteProduct(Long id) {
        Product existingProduct =
                getProductEntityById(id);

        if (orderItemRepository.existsByProductId(id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Không thể xóa sản phẩm vì đã phát sinh đơn hàng"
            );
        }

        if (promotionRepository.existsByProductId(id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Không thể xóa sản phẩm vì đang hoặc đã được gắn khuyến mãi"
            );
        }

        if (flashSaleItemRepository.existsByProductId(id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Không thể xóa sản phẩm vì đang hoặc đã được gắn flash sale"
            );
        }

        productRepository.delete(existingProduct);
    }

    private Map<Long, RatingStats> buildRatingMap(List<Product> products) {
        List<Long> productIds = products
                .stream()
                .map(Product::getId)
                .toList();

        if (productIds.isEmpty()) {
            return Map.of();
        }

        return reviewRepository
                .findByProductIdIn(productIds)
                .stream()
                .collect(
                        Collectors.groupingBy(
                                Review::getProductId,
                                Collectors.collectingAndThen(
                                        Collectors.toList(),
                                        this::buildRatingStats
                                )
                        )
                );
    }

    private RatingStats buildRatingStats(List<Review> reviews) {
        if (reviews == null || reviews.isEmpty()) {
            return new RatingStats(0.0, 0L);
        }

        double average =
                reviews.stream()
                        .mapToInt(Review::getRating)
                        .average()
                        .orElse(0);

        average = Math.round(average * 10.0) / 10.0;

        return new RatingStats(average, (long) reviews.size());
    }

    private ProductResponse toProductResponse(
            Product product,
            RatingStats ratingStats
    ) {
        RatingStats safeRatingStats =
                ratingStats == null
                        ? new RatingStats(0.0, 0L)
                        : ratingStats;

        return ProductResponse
                .builder()
                .id(product.getId())
                .name(product.getName())
                .price(product.getPrice())
                .image(product.getImage())
                .description(product.getDescription())
                .stock(product.getStock())
                .soldQuantity(product.getSoldQuantity())
                .category(product.getCategory())
                .brand(product.getBrand())
                .specifications(product.getSpecifications())
                .highlights(product.getHighlights())
                .promotions(product.getPromotions())
                .options(product.getOptions())
                .images(product.getImages())
                .averageRating(safeRatingStats.averageRating())
                .totalReviews(safeRatingStats.totalReviews())
                .build();
    }

    private record RatingStats(
            Double averageRating,
            Long totalReviews
    ) {
    }

    private void validateProduct(
            Product product,
            Long updateId
    ) {
        if (product == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Dữ liệu sản phẩm không hợp lệ"
            );
        }

        String name =
                requireText(
                        product.getName(),
                        "Tên sản phẩm không được để trống"
                );

        if (updateId == null) {
            if (productRepository.existsByNameIgnoreCase(name)) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Tên sản phẩm đã tồn tại"
                );
            }
        } else {
            if (
                    productRepository
                            .existsByNameIgnoreCaseAndIdNot(
                                    name,
                                    updateId
                            )
            ) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Tên sản phẩm đã tồn tại"
                );
            }
        }

        if (
                product.getPrice() == null ||
                product.getPrice()
                        .compareTo(BigDecimal.ZERO) <= 0
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Giá sản phẩm phải lớn hơn 0"
            );
        }

        if (
                product.getStock() == null ||
                product.getStock() < 0
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tồn kho không được nhỏ hơn 0"
            );
        }

        if (
                product.getSoldQuantity() != null &&
                product.getSoldQuantity() < 0
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Số lượng đã bán không được nhỏ hơn 0"
            );
        }

        String category =
                requireText(
                        product.getCategory(),
                        "Danh mục sản phẩm không được để trống"
                );

        String brand =
                requireText(
                        product.getBrand(),
                        "Thương hiệu sản phẩm không được để trống"
                );

        if (
                !categoryRepository
                        .existsByNameIgnoreCase(category)
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Danh mục sản phẩm không tồn tại"
            );
        }

        if (
                !brandRepository
                        .existsByNameIgnoreCaseAndCategoryIgnoreCase(
                                brand,
                                category
                        )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Thương hiệu không tồn tại trong danh mục đã chọn"
            );
        }

        if (!hasAnyImage(product)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sản phẩm phải có ít nhất một ảnh"
            );
        }

        validateImages(product);
    }

    private void normalizeProduct(Product product) {
        product.setName(product.getName().trim());
        product.setCategory(product.getCategory().trim());
        product.setBrand(product.getBrand().trim());

        product.setImage(normalize(product.getImage()));
        product.setDescription(normalize(product.getDescription()));
        product.setSpecifications(normalize(product.getSpecifications()));
        product.setHighlights(normalize(product.getHighlights()));
        product.setPromotions(normalize(product.getPromotions()));
        product.setOptions(normalize(product.getOptions()));

        if (product.getSoldQuantity() == null) {
            product.setSoldQuantity(0);
        }

        if (product.getImages() != null) {
            for (ProductImage image : product.getImages()) {
                image.setImageUrl(
                        normalize(image.getImageUrl())
                );
            }
        }
    }

    private boolean hasAnyImage(Product product) {
        if (!isBlank(product.getImage())) {
            return true;
        }

        if (product.getImages() == null) {
            return false;
        }

        return product
                .getImages()
                .stream()
                .anyMatch(image ->
                        image != null &&
                        !isBlank(image.getImageUrl())
                );
    }

    private void validateImages(Product product) {
        if (product.getImages() == null) {
            return;
        }

        for (ProductImage image : product.getImages()) {
            if (
                    image == null ||
                    isBlank(image.getImageUrl())
            ) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Danh sách ảnh sản phẩm không hợp lệ"
                );
            }
        }
    }

    private String requireText(
            String value,
            String message
    ) {
        if (isBlank(value)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    message
            );
        }

        return value.trim();
    }

    private String normalize(String value) {
        return value == null
                ? null
                : value.trim();
    }

    private boolean isBlank(String value) {
        return value == null ||
                value.trim().isEmpty();
    }
}
