package com.example.demochatbot.service.cart;

import com.example.demochatbot.dto.AddToCartRequest;
import com.example.demochatbot.dto.CartItemDto;
import com.example.demochatbot.model.Book;
import com.example.demochatbot.model.Cart;
import com.example.demochatbot.model.Cart_Item;
import com.example.demochatbot.model.Customer;
import com.example.demochatbot.repository.BookRepository;
import com.example.demochatbot.repository.CartItemRepository;
import com.example.demochatbot.repository.CartRepository;
import com.example.demochatbot.repository.CustomerRepository;
import com.example.demochatbot.service.customer.CustomerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CartServiceImpl implements CartService {

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private CustomerService customerService;

    private Customer getCurrentCustomer() {
        int accountId = customerService.getCurrentAccountId();
        Customer customer = customerRepository.findCustomerById(accountId);
        if (customer == null) {
            throw new RuntimeException("Không tìm thấy thông tin khách hàng!");
        }
        return customer;
    }

    private Cart getOrCreateCart(Customer customer) {
        return cartRepository.findByCustomerId(customer.getCustomer_id())
                .orElseGet(() -> {
                    Cart newCart = new Cart();
                    newCart.setCustomer(customer);
                    return cartRepository.save(newCart);
                });
    }

    private int resolveRentalDays(String planKey) {
        if (planKey == null || planKey.trim().isEmpty()) {
            return 7;
        }
        if ("forever".equalsIgnoreCase(planKey)) {
            return 99999;
        }
        try {
            return Integer.parseInt(planKey.trim());
        } catch (NumberFormatException e) {
            return 7;
        }
    }

    @Override
    @Transactional
    public void addToCart(AddToCartRequest request) {
        if (request == null || request.getBookId() == null || request.getBookId().trim().isEmpty()) {
            throw new IllegalArgumentException("Mã sách không hợp lệ!");
        }

        Customer customer = getCurrentCustomer();
        Cart cart = getOrCreateCart(customer);

        Book book = bookRepository.findById(request.getBookId())
                .orElseGet(() -> bookRepository.findBookById(request.getBookId()));

        if (book == null) {
            throw new RuntimeException("Sách không tồn tại trong hệ thống!");
        }

        Optional<Cart_Item> existingItem = cartItemRepository.findByCartIdAndBookId(cart.getCart_id(), book.getBook_id());
        String planKey = request.getPlanKey() == null || request.getPlanKey().trim().isEmpty()
                ? "7" : request.getPlanKey();

        if (existingItem.isPresent()) {
            Cart_Item item = existingItem.get();
            item.setPlanKey(planKey);
            item.setRentalDays(resolveRentalDays(planKey));
            item.setSelectedPrice(request.getPrice() != null ? request.getPrice() : book.getRent_price());
            cartItemRepository.save(item);
            return;
        }

        Cart_Item newItem = new Cart_Item();
        newItem.setCart(cart);
        newItem.setBook(book);
        newItem.setPlanKey(planKey);
        newItem.setRentalDays(resolveRentalDays(planKey));
        newItem.setSelectedPrice(request.getPrice() != null ? request.getPrice() : book.getRent_price());
        cartItemRepository.save(newItem);
    }

    @Override
    public List<CartItemDto> getCartItems() {
        Customer customer = getCurrentCustomer();
        Optional<Cart> cartOpt = cartRepository.findByCustomerId(customer.getCustomer_id());
        if (cartOpt.isEmpty()) {
            return new ArrayList<>();
        }

        List<Cart_Item> items = cartItemRepository.findByCartId(cartOpt.get().getCart_id());
        return items.stream().map(item -> {
            Book b = item.getBook();
            return new CartItemDto(
                    item.getCart_item_id(),
                    b != null ? b.getBook_id() : "",
                    b != null ? b.getBookName() : "",
                    b != null ? b.getAuthor() : "",
                    b != null ? b.getImg_url() : "",
                    b != null ? b.getRent_price() : 0.0,
                    item.getPlanKey() == null ? "7" : item.getPlanKey(),
                    item.getRentalDays() == null ? 7 : item.getRentalDays(),
                    item.getSelectedPrice() != null
                            ? item.getSelectedPrice()
                            : (b != null ? b.getRent_price() : 0.0)
            );
        }).collect(Collectors.toList());
    }

    @Override
    public int getCartItemCount() {
        try {
            Customer customer = getCurrentCustomer();
            Optional<Cart> cartOpt = cartRepository.findByCustomerId(customer.getCustomer_id());
            return cartOpt.map(cart -> cartItemRepository.countTotalItems(cart.getCart_id())).orElse(0);
        } catch (Exception e) {
            return 0;
        }
    }

    @Override
    @Transactional
    public void removeFromCart(int cartItemId) {
        Customer customer = getCurrentCustomer();
        Cart cart = cartRepository.findByCustomerId(customer.getCustomer_id())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giỏ hàng!"));

        Cart_Item item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm trong giỏ hàng!"));

        if (item.getCart().getCart_id() != cart.getCart_id()) {
            throw new RuntimeException("Bạn không có quyền xóa sản phẩm này!");
        }

        cartItemRepository.delete(item);
    }
}
