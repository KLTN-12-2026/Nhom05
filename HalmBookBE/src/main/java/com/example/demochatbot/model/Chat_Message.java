package com.example.demochatbot.model;

import com.openai.models.beta.chatkit.threads.ChatSession;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "chat_message")
public class Chat_Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int chatMessage_id;
    private String sender;
    private String content;
    private LocalDateTime sent_at;

    @ManyToOne
    @JoinColumn(name = "chat_session_id" , referencedColumnName = "chat_session_id")
    private Chat_Session chat_session;
}
