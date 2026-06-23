package com.example.electroshop.service;

import com.example.electroshop.entity.Product;
import com.example.electroshop.entity.ProductImage;
import com.example.electroshop.repository.ProductRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor

public class ProductService {

    private final ProductRepository productRepository;

    // GET ALL

    public List<Product> getAllProducts() {

        return productRepository.findAll();
    }

    // GET BY ID

    public Product getProductById(Long id) {

        return productRepository.findById(id)

                .orElseThrow(() ->

                        new RuntimeException(
                                "Product not found"
                        ));
    }

    // CREATE

    public Product createProduct(
            Product product
    ) {

        if (product.getImages() != null) {

            product.getImages().forEach(image -> {
                image.setId(null);
                image.setProduct(product);
            });
        }

        return productRepository.save(product);
    }

    // UPDATE

    public Product updateProduct(
            Long id,
            Product product
    ) {

        Product existingProduct =
                getProductById(id);

        existingProduct.setName(
                product.getName()
        );

        existingProduct.setPrice(
                product.getPrice()
        );

        existingProduct.setImage(
                product.getImage()
        );

        existingProduct.setDescription(
                product.getDescription()
        );
        
        existingProduct.setSpecifications(
        product.getSpecifications()
        );

        existingProduct.setHighlights(
                product.getHighlights()
        );

        existingProduct.setPromotions(
                product.getPromotions()
        );

        existingProduct.setOptions(
        product.getOptions()
        );

        existingProduct.setStock(
                product.getStock()
        );

        existingProduct.setCategory(
                product.getCategory()
        );

        existingProduct.setBrand(
        product.getBrand()
        );

        // UPDATE IMAGES

        existingProduct
                .getImages()
                .clear();

if (product.getImages() != null) {

    for (
            ProductImage image
            : product.getImages()
    ) {

        image.setId(null);

        image.setProduct(
                existingProduct
        );

        existingProduct
                .getImages()
                .add(image);
    }
}

        return productRepository
                .save(existingProduct);
    }

    // DELETE

    public void deleteProduct(Long id) {

        productRepository.deleteById(id);
    }
}