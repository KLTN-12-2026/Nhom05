package com.example.demochatbot.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "chat_session")
public class Chat_Session {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int chat_session_id;
    private LocalDateTime start_at;
    private LocalDateTime last_interaction;

    @ManyToOne
    @JoinColumn(name = "customer_id" , referencedColumnName = "customer_id")
    private Customer customer;

    @OneToMany(mappedBy = "chat_session")
    private List<Chat_Message> messages;
}
