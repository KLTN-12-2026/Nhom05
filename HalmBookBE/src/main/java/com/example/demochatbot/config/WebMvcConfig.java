package com.example.demochatbot.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.example.demochatbot.service.customer.CustomerService;
import com.example.demochatbot.service.order.OrderService;
import com.example.demochatbot.repository.BookRepository;
import com.example.demochatbot.model.Book;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final CustomerService customerService;
    private final OrderService orderService;
    private final BookRepository bookRepository;

    public WebMvcConfig(CustomerService customerService, OrderService orderService, BookRepository bookRepository) {
        this.customerService = customerService;
        this.orderService = orderService;
        this.bookRepository = bookRepository;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadDir = Paths.get("uploads");
        String normalized = uploadDir.toFile().getAbsolutePath().replace("\\", "/");
        if (!normalized.endsWith("/")) {
            normalized += "/";
        }
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + normalized)
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, org.springframework.core.io.Resource location) throws java.io.IOException {
                        Resource resource = super.getResource(resourcePath, location);
                        if (resource == null || !resourcePath.startsWith("pdfs/")) return resource;

                        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                        if (authentication == null || !authentication.isAuthenticated()
                                || "anonymousUser".equals(authentication.getPrincipal())) return null;
                        try {
                            int accountId = customerService.getCurrentAccountId();
                            String fileName = Paths.get(resourcePath).getFileName().toString();
                            Book book = bookRepository.findFirstByPdfPublicIdEndingWith("/" + fileName).orElse(null);
                            return book != null && orderService.checkBookAccess(accountId, book.getBook_id())
                                    ? resource
                                    : null;
                        } catch (Exception exception) {
                            return null;
                        }
                    }
                });
    }
}
