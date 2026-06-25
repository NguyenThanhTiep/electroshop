package com.example.electroshop.dto;

import com.example.electroshop.entity.HomeSectionBanner;
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
public class HomeSectionBannerResponse {

    private HomeSectionBanner banner;

    private List<Product> products;
}