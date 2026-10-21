package com.example.demochatbot.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "book")
public class Book {
    @Id
    @Column(name = "book_id")
    private String book_id;
    private String bookName;
    private String author;
    private String publisher;
    private Integer yearOfPublished;
    private Double rent_price;
    private String img_url;
    private String imgPublicId;
    private String pdf_url;
    private String pdfPublicId;
    private String description;

    @OneToMany(mappedBy = "book")
    private List<Cart_Item> cart_item;

    @OneToMany(mappedBy = "book")
    private List<Access_Record> access_record;

    @OneToMany(mappedBy = "book")
    private List<Evaluate>  evaluate;

    @OneToMany(mappedBy = "book")
    private List<Order_Item> order_item;

    @ManyToOne
    @JoinColumn(name = "category_id" , referencedColumnName = "category_id")
    private Category category;



}
