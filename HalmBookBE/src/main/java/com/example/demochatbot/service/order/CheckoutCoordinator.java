package com.example.demochatbot.service.order;

import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.Locale;
import java.util.concurrent.locks.ReentrantLock;
import java.util.function.Supplier;

/** A key stays locked until its database transaction has committed. */
@Component
public class CheckoutCoordinator {
    private final TransactionTemplate transaction;
    private final ReentrantLock[] stripes = new ReentrantLock[256];

    public CheckoutCoordinator(PlatformTransactionManager manager) {
        transaction = new TransactionTemplate(manager);
        transaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        transaction.setIsolationLevel(TransactionDefinition.ISOLATION_READ_COMMITTED);
        for (int i = 0; i < stripes.length; i++) stripes[i] = new ReentrantLock();
    }

    public <T> T execute(String key, Supplier<T> action) {
        if (key == null || key.isBlank()) return transaction.execute(status -> action.get());
        String normalized = key.trim().toLowerCase(Locale.ROOT).replaceFirst("^idem-", "");
        ReentrantLock lock = stripes[Math.floorMod(normalized.hashCode(), stripes.length)];
        lock.lock();
        try { return transaction.execute(status -> action.get()); }
        finally { lock.unlock(); }
    }
}
