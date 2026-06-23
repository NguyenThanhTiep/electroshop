package com.example.electroshop.dto.checkout;

public class CheckoutItemRequest {

    private Long productId;

    private Integer quantity;

    /*
     * Tạm thời lưu JSON tùy chọn đã chọn.
     * Ví dụ:
     * {"color":"Đen","ram":"16GB"}
     */
    private String selectedOptions;

    public Long getProductId() {
        return productId;
    }

    public void setProductId(
            Long productId
    ) {
        this.productId = productId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(
            Integer quantity
    ) {
        this.quantity = quantity;
    }

    public String getSelectedOptions() {
        return selectedOptions;
    }

    public void setSelectedOptions(
            String selectedOptions
    ) {
        this.selectedOptions =
                selectedOptions;
    }
}