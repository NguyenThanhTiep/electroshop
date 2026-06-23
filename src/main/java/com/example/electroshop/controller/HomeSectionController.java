package com.example.electroshop.controller;

import com.example.electroshop.entity.HomeSection;
import com.example.electroshop.service.HomeSectionService;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/home-sections")

@RequiredArgsConstructor

@CrossOrigin("*")

public class HomeSectionController {

    private final HomeSectionService homeSectionService;

    @GetMapping
    public List<HomeSection> getAllSections() {

        return homeSectionService.getAllSections();
    }

    @GetMapping("/active")
    public List<HomeSection> getActiveSections() {

        return homeSectionService.getActiveSections();
    }

    @PostMapping
    public HomeSection createSection(
            @RequestBody HomeSection section
    ) {

        return homeSectionService.createSection(section);
    }

    @PutMapping("/{id}")
    public HomeSection updateSection(
            @PathVariable Long id,
            @RequestBody HomeSection section
    ) {

        return homeSectionService.updateSection(
                id,
                section
        );
    }

    @DeleteMapping("/{id}")
    public String deleteSection(
            @PathVariable Long id
    ) {

        homeSectionService.deleteSection(id);

        return "Deleted successfully";
    }
}