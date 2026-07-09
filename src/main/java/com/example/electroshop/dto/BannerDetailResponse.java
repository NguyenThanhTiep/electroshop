package com.example.electroshop.dto;

import com.example.electroshop.entity.Banner;
import com.example.electroshop.entity.Product;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BannerDetailResponse {

    private Banner banner;

    private List<Product> products;
}
