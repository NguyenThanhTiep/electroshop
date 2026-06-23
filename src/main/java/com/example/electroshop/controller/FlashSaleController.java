package com.example.electroshop.controller;

import com.example.electroshop.dto.FlashSaleProductDto;
import com.example.electroshop.dto.FlashSaleResponseDto;
import com.example.electroshop.entity.FlashSale;
import com.example.electroshop.entity.FlashSaleItem;
import com.example.electroshop.entity.Product;
import com.example.electroshop.repository.FlashSaleItemRepository;
import com.example.electroshop.repository.FlashSaleRepository;
import com.example.electroshop.repository.ProductRepository;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/flash-sales")
@CrossOrigin("*")
public class FlashSaleController {

    private final FlashSaleRepository flashSaleRepository;

    private final FlashSaleItemRepository flashSaleItemRepository;

    private final ProductRepository productRepository;

    public FlashSaleController(
            FlashSaleRepository flashSaleRepository,
            FlashSaleItemRepository flashSaleItemRepository,
            ProductRepository productRepository
    ) {
        this.flashSaleRepository =
                flashSaleRepository;

        this.flashSaleItemRepository =
                flashSaleItemRepository;

        this.productRepository =
                productRepository;
    }

    // Lấy tất cả chiến dịch cho admin
    @GetMapping
    public List<FlashSale> getAllFlashSales() {

        return flashSaleRepository.findAll();
    }

    // Lấy chiến dịch đang chạy cho HomePage
    @GetMapping("/active")
    public FlashSaleResponseDto getActiveFlashSale() {

        LocalDateTime now =
                LocalDateTime.now();

        FlashSale flashSale =
                flashSaleRepository
                        .findFirstByActiveTrueAndStartTimeLessThanEqualAndEndTimeGreaterThanEqualOrderBySortOrderAsc(
                                now,
                                now
                        )
                        .orElse(null);

        if (flashSale == null) {
            return null;
        }

        return buildFlashSaleResponse(flashSale);
    }

    // Lấy giá Flash Sale đang áp dụng cho 1 sản phẩm
@GetMapping("/active/product/{productId}")
public ResponseEntity<FlashSaleProductDto>
getActiveFlashSaleProduct(
        @PathVariable Long productId
) {
    LocalDateTime now =
            LocalDateTime.now();

    FlashSale flashSale =
            flashSaleRepository
                    .findFirstByActiveTrueAndStartTimeLessThanEqualAndEndTimeGreaterThanEqualOrderBySortOrderAsc(
                            now,
                            now
                    )
                    .orElse(null);

    if (flashSale == null) {
        return ResponseEntity
                .noContent()
                .build();
    }

    FlashSaleItem item =
            flashSaleItemRepository
                    .findFirstByFlashSaleIdAndProductIdAndActiveTrueOrderByIdDesc(
                            flashSale.getId(),
                            productId
                    )
                    .orElse(null);

    if (item == null) {
        return ResponseEntity
                .noContent()
                .build();
    }

    int saleQuantity =
            item.getSaleQuantity() == null
                    ? 0
                    : item.getSaleQuantity();

    int soldQuantity =
            item.getSoldQuantity() == null
                    ? 0
                    : item.getSoldQuantity();

    /*
     * Không áp dụng Flash Sale nếu:
     * - chưa có giá sale;
     * - giá sale không hợp lệ;
     * - đã bán hết số lượng Flash Sale.
     */
    if (
            item.getSalePrice() == null ||
            item.getSalePrice().signum() <= 0 ||
            saleQuantity <= soldQuantity
    ) {
        return ResponseEntity
                .noContent()
                .build();
    }

    FlashSaleProductDto result =
            buildProductItemDto(item);

    if (result == null) {
        return ResponseEntity
                .notFound()
                .build();
    }

    return ResponseEntity.ok(result);
}
    // Lấy chi tiết 1 chiến dịch kèm item
    @GetMapping("/{id}")
    public FlashSaleResponseDto getFlashSaleById(
            @PathVariable Long id
    ) {
        FlashSale flashSale =
                flashSaleRepository.findById(id)
                        .orElseThrow();

        return buildFlashSaleResponse(flashSale);
    }

    // Tạo chiến dịch
    @PostMapping
    public FlashSale createFlashSale(
            @RequestBody FlashSale flashSale
    ) {
        if (flashSale.getActive() == null) {
            flashSale.setActive(true);
        }

        if (flashSale.getSortOrder() == null) {
            flashSale.setSortOrder(1);
        }

        return flashSaleRepository.save(flashSale);
    }

    // Cập nhật chiến dịch
    @PutMapping("/{id}")
    public FlashSale updateFlashSale(
            @PathVariable Long id,
            @RequestBody FlashSale flashSale
    ) {
        FlashSale oldFlashSale =
                flashSaleRepository.findById(id)
                        .orElseThrow();

        oldFlashSale.setTitle(
                flashSale.getTitle()
        );

        oldFlashSale.setSubtitle(
                flashSale.getSubtitle()
        );

        oldFlashSale.setBannerImage(
                flashSale.getBannerImage()
        );

        oldFlashSale.setStartTime(
                flashSale.getStartTime()
        );

        oldFlashSale.setEndTime(
                flashSale.getEndTime()
        );

        oldFlashSale.setActive(
                flashSale.getActive()
        );

        oldFlashSale.setSortOrder(
                flashSale.getSortOrder()
        );

        return flashSaleRepository.save(oldFlashSale);
    }

    // Xóa chiến dịch
    @DeleteMapping("/{id}")
    public void deleteFlashSale(
            @PathVariable Long id
    ) {
        flashSaleRepository.deleteById(id);
    }

    // Lấy danh sách sản phẩm trong chiến dịch cho admin
    @GetMapping("/{flashSaleId}/items")
    public List<FlashSaleItem> getItemsByFlashSale(
            @PathVariable Long flashSaleId
    ) {
        return flashSaleItemRepository
                .findByFlashSaleIdOrderByIdDesc(
                        flashSaleId
                );
    }

    // Thêm sản phẩm vào chiến dịch
    @PostMapping("/{flashSaleId}/items")
    public FlashSaleItem addItemToFlashSale(
            @PathVariable Long flashSaleId,
            @RequestBody FlashSaleItem item
    ) {
        item.setFlashSaleId(
                flashSaleId
        );

        if (item.getActive() == null) {
            item.setActive(true);
        }

        if (item.getSoldQuantity() == null) {
            item.setSoldQuantity(0);
        }

        if (item.getSaleQuantity() == null) {
            item.setSaleQuantity(100);
        }

        if (item.getLimitPerUser() == null) {
            item.setLimitPerUser(1);
        }

        return flashSaleItemRepository.save(item);
    }

    // Cập nhật sản phẩm trong chiến dịch
    @PutMapping("/items/{itemId}")
    public FlashSaleItem updateFlashSaleItem(
            @PathVariable Long itemId,
            @RequestBody FlashSaleItem item
    ) {
        FlashSaleItem oldItem =
                flashSaleItemRepository.findById(itemId)
                        .orElseThrow();

        oldItem.setProductId(
                item.getProductId()
        );

        oldItem.setSalePrice(
                item.getSalePrice()
        );

        oldItem.setDiscountPercent(
                item.getDiscountPercent()
        );

        oldItem.setSaleQuantity(
                item.getSaleQuantity()
        );

        oldItem.setSoldQuantity(
                item.getSoldQuantity()
        );

        oldItem.setLimitPerUser(
                item.getLimitPerUser()
        );

        oldItem.setActive(
                item.getActive()
        );

        return flashSaleItemRepository.save(oldItem);
    }

    // Xóa sản phẩm khỏi chiến dịch
    @DeleteMapping("/items/{itemId}")
    public void deleteFlashSaleItem(
            @PathVariable Long itemId
    ) {
        flashSaleItemRepository.deleteById(itemId);
    }

    // Hàm build dữ liệu trả ra HomePage
    private FlashSaleResponseDto buildFlashSaleResponse(
            FlashSale flashSale
    ) {
        List<FlashSaleItem> items =
                flashSaleItemRepository
                        .findByFlashSaleIdAndActiveTrueOrderByIdDesc(
                                flashSale.getId()
                        );

        List<FlashSaleProductDto> itemDtos =
                items.stream()
                        .map(this::buildProductItemDto)
                        .filter(item -> item != null)
                        .collect(Collectors.toList());

        return FlashSaleResponseDto
                .builder()
                .id(flashSale.getId())
                .title(flashSale.getTitle())
                .subtitle(flashSale.getSubtitle())
                .bannerImage(flashSale.getBannerImage())
                .startTime(flashSale.getStartTime())
                .endTime(flashSale.getEndTime())
                .active(flashSale.getActive())
                .sortOrder(flashSale.getSortOrder())
                .items(itemDtos)
                .build();
    }

    private FlashSaleProductDto buildProductItemDto(
            FlashSaleItem item
    ) {
        Product product =
                productRepository
                        .findById(item.getProductId())
                        .orElse(null);

        if (product == null) {
            return null;
        }

        Integer saleQuantity =
                item.getSaleQuantity() == null
                        ? 0
                        : item.getSaleQuantity();

        Integer soldQuantity =
                item.getSoldQuantity() == null
                        ? 0
                        : item.getSoldQuantity();

        Integer soldPercent =
                0;

        if (saleQuantity > 0) {
            soldPercent =
                    Math.min(
                            100,
                            (int) Math.round(
                                    soldQuantity * 100.0 / saleQuantity
                            )
                    );
        }

return FlashSaleProductDto
        .builder()
        .itemId(item.getId())
        .productId(product.getId())
        .productName(product.getName())
        .image(product.getImage())
        .brand(product.getBrand())
        .category(product.getCategory())
        .description(product.getDescription())
        .originalPrice(product.getPrice())
        .salePrice(item.getSalePrice())
        .discountPercent(item.getDiscountPercent())
        .saleQuantity(saleQuantity)
        .soldQuantity(soldQuantity)
        .soldPercent(soldPercent)
        .limitPerUser(item.getLimitPerUser())
        .build();
    }
}