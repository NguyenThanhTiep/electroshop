package com.example.electroshop.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class HomeBannerProductRequest {

    private List<Long> productIds;
}