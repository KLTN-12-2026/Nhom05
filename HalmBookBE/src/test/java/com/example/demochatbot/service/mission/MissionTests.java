package com.example.demochatbot.service.mission;

import com.example.demochatbot.controller.*;
import com.example.demochatbot.dto.MissionClaimRequest;
import com.example.demochatbot.model.*;
import com.example.demochatbot.repository.*;
import com.example.demochatbot.service.customer.CustomerService;
import com.example.demochatbot.service.tier.TierService;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class MissionTests {
    static class Fixture {
        final MissionRepository missions = mock(MissionRepository.class);
        final MissionActivityRepository activities = mock(MissionActivityRepository.class);
        final UserMissionClaimRepository claims = mock(UserMissionClaimRepository.class);
        final CustomerRepository customers = mock(CustomerRepository.class);
        final AccessRecordRepository access = mock(AccessRecordRepository.class);
        final ChatMessageRepository chat = mock(ChatMessageRepository.class);
        final PotatoTransactionRepository ledger = mock(PotatoTransactionRepository.class);
        final NotificationRepository inbox = mock(NotificationRepository.class);
        final TierService tiers = mock(TierService.class);
        final MissionService service = new MissionService(missions, activities, claims, customers, access, chat, ledger, inbox, tiers);
        final Customer reader = new Customer();
        final Map<String, MissionActivity> events = new HashMap<>();
        final List<UserMissionClaim> receipts = new ArrayList<>();
        Fixture() {
            service.clock = Clock.fixed(Instant.parse("2026-11-20T02:00:00Z"), ZoneOffset.UTC);
            reader.setCustomer_id("alice"); reader.setPotatoBalance(20); reader.setTotalPotatoEarned(40);
            when(customers.findByIdForUpdate("alice")).thenReturn(Optional.of(reader));
            when(activities.findById(anyString())).thenAnswer(i -> Optional.ofNullable(events.get(i.getArgument(0))));
            when(activities.save(any())).thenAnswer(i -> { MissionActivity a = i.getArgument(0); events.put(a.getId(), a); return a; });
            when(claims.existsByCustomerIdAndMissionIdAndClaimDate(anyString(), anyString(), any())).thenAnswer(i -> receipts.stream().anyMatch(r -> r.getCustomerId().equals(i.getArgument(0)) && r.getMissionId().equals(i.getArgument(1)) && r.getClaimDate().equals(i.getArgument(2))));
            when(claims.existsByCustomerIdAndMissionId(anyString(), anyString())).thenAnswer(i -> receipts.stream().anyMatch(r -> r.getCustomerId().equals(i.getArgument(0)) && r.getMissionId().equals(i.getArgument(1))));
            when(claims.saveAndFlush(any())).thenAnswer(i -> { receipts.add(i.getArgument(0)); return i.getArgument(0); });
            doAnswer(i -> { reader.setTotalPotatoEarned(reader.getTotalPotatoEarned() + (int) i.getArgument(1)); return null; }).when(tiers).addExperiencePoints(eq(reader), anyInt(), anyString());
        }
        Mission config(String condition) {
            Mission m = Mission.builder().id("test-mission").title("Fixture mission").description("Fixture evidence")
                .condition(condition).period(MissionService.DAILY.contains(condition) ? "DAILY" : "MILESTONE")
                .targetValue(1).rewardPotato(7).rewardXp(13).active(true).build();
            when(missions.findLocked(m.getId())).thenReturn(Optional.of(m));
            when(missions.findAllByOrderByOrderIndexAscIdAsc()).thenReturn(List.of(m)); return m;
        }
        void advance(long seconds) { service.clock = Clock.offset(service.clock, Duration.ofSeconds(seconds)); }
        Access_Record grant(String bookId) {
            Book book = new Book(); book.setBook_id(bookId);
            Access_Record record = new Access_Record(); record.setBook(book); record.setStatus("ACTIVE");
            record.setEnd_date(LocalDateTime.now(service.clock.withZone(ZoneId.systemDefault())).plusDays(1));
            when(access.findByCustomerIdAndBookId("alice", bookId)).thenReturn(Optional.of(record)); return record;
        }
    }
    @Test void everyDailyMissionRequiresItsOwnEvidence() {
        for (String kind : MissionService.DAILY) {
            Fixture f = new Fixture(); Mission m = f.config(kind);
            assertThrows(ResponseStatusException.class, () -> f.service.claim("alice", m.getId()), kind);
            verifyNoInteractions(f.ledger, f.inbox, f.tiers); assertEquals(20, f.reader.getPotatoBalance());
        }
    }
    @Test void claimUsesAdminRewardsAwardsXpAndProducesOneReceiptLedgerAndNotification() {
        Fixture f = new Fixture(); Mission m = f.config("CHECKIN"); f.reader.setLastStreakDate(f.service.today());
        var first = f.service.claim("alice", m.getId()); var replay = f.service.claim("alice", m.getId());
        assertEquals(27, first.get("newBalance")); assertEquals(7, first.get("rewardPotato")); assertEquals(13, first.get("rewardXp"));
        assertEquals(true, replay.get("alreadyClaimed")); assertEquals(0, replay.get("rewardPotato"));
        assertEquals(60, f.reader.getTotalPotatoEarned()); assertEquals(1, f.receipts.size());
        UserMissionClaim receipt = f.receipts.getFirst(); assertEquals(64, receipt.getClaimKey().length()); assertEquals(m.getTitle(), receipt.getMissionTitle()); assertEquals(13, receipt.getRewardXp());
        verify(f.ledger, times(1)).save(argThat(t -> t.getAmount() == 7 && t.getBalanceAfter() == 27));
        verify(f.inbox, times(1)).save(argThat(n -> "alice".equals(n.getCustomerId()) && "REWARD".equals(n.getType())));
        var order = inOrder(f.customers, f.missions, f.ledger, f.claims, f.inbox);
        order.verify(f.customers).findByIdForUpdate("alice"); order.verify(f.missions).findLocked(m.getId());
        order.verify(f.ledger).save(any()); order.verify(f.claims).saveAndFlush(any()); order.verify(f.inbox).save(any());
    }
    @Test void responseBalanceIncludesMembershipBonusAndZeroXpStillRecalculatesTier() {
        Fixture f = new Fixture(); Mission m = f.config("CHECKIN"); m.setRewardXp(0); f.reader.setLastStreakDate(f.service.today());
        doAnswer(i -> { f.reader.setPotatoBalance(f.reader.getPotatoBalance() + 50); return null; }).when(f.tiers).calculateAndUpdateCustomerTier(f.reader);
        assertEquals(77, f.service.claim("alice", m.getId()).get("newBalance")); assertEquals(77, f.receipts.getFirst().getBalanceAfter());
        verify(f.tiers, never()).addExperiencePoints(any(), anyInt(), anyString());
    }
    @Test void legacyReceiptsRemainHonoredEvenIfMissionWasDisabled() {
        Fixture f = new Fixture(); Mission m = f.config("STREAK_DAYS"); m.setActive(false);
        f.receipts.add(UserMissionClaim.builder().customerId("alice").missionId(m.getId()).claimDate(f.service.today().minusYears(1)).rewardPotato(5).build());
        assertEquals(true, f.service.claim("alice", m.getId()).get("alreadyClaimed")); verifyNoInteractions(f.ledger, f.inbox, f.tiers);
    }
    @Test void dailyClaimsResetAtVietnamMidnightAndHaveDifferentUniqueKeys() {
        Fixture f = new Fixture(); Mission m = f.config("CHECKIN");
        f.service.clock = Clock.fixed(Instant.parse("2026-11-20T16:59:59Z"), ZoneOffset.UTC); f.reader.setLastStreakDate(f.service.today());
        f.service.claim("alice", m.getId()); f.advance(2);
        assertEquals(LocalDate.of(2026, 11, 21), f.service.today());
        assertThrows(ResponseStatusException.class, () -> f.service.claim("alice", m.getId()));
        f.reader.setLastStreakDate(f.service.today()); f.service.claim("alice", m.getId());
        assertEquals(2, f.receipts.size()); assertNotEquals(f.receipts.get(0).getClaimKey(), f.receipts.get(1).getClaimKey());
    }
    @Test void readingCountsServerTimeOnlyAndRejectsRevokedExpiredOrMissingEntitlement() {
        Fixture f = new Fixture(); Mission m = f.config("READING_SECONDS"); m.setTargetValue(30); Access_Record grant = f.grant("b1");
        assertEquals(0, f.service.heartbeat("alice", "b1", "session-reader-0001").get("seconds"));
        f.advance(15); assertEquals(15, f.service.heartbeat("alice", "b1", "session-reader-0001").get("seconds"));
        assertThrows(ResponseStatusException.class, () -> f.service.claim("alice", m.getId()));
        f.advance(15); assertEquals(30, f.service.heartbeat("alice", "b1", "session-reader-0001").get("seconds"));
        assertEquals(7, f.service.claim("alice", m.getId()).get("rewardPotato"));
        grant.setStatus("REVOKED"); f.advance(15); assertThrows(ResponseStatusException.class, () -> f.service.heartbeat("alice", "b1", "session-reader-0001"));
        grant.setStatus("ACTIVE"); grant.setEnd_date(LocalDateTime.MIN); assertThrows(ResponseStatusException.class, () -> f.service.heartbeat("alice", "b1", "session-reader-0001"));
        assertThrows(ResponseStatusException.class, () -> f.service.heartbeat("alice", "other", "session-reader-0001"));
    }
    @Test void readingDoesNotCreditLongGapsNewDevicesOrNewDayAndCapsShortGaps() {
        Fixture f = new Fixture(); f.grant("b1");
        f.service.heartbeat("alice", "b1", "session-reader-0001"); f.advance(40);
        assertEquals(30, f.service.heartbeat("alice", "b1", "session-reader-0001").get("seconds"));
        f.advance(120); assertEquals(30, f.service.heartbeat("alice", "b1", "session-reader-0001").get("seconds"));
        f.advance(20); assertEquals(30, f.service.heartbeat("alice", "b1", "session-reader-0002").get("seconds"));
        f.service.clock = Clock.fixed(Instant.parse("2026-11-20T17:00:01Z"), ZoneOffset.UTC); f.grant("b1");
        assertEquals(0, f.service.heartbeat("alice", "b1", "session-reader-0002").get("seconds"));
    }
    @Test void rapidHeartbeatsDoNotEraseTheElapsedReferencePoint() {
        Fixture f = new Fixture(); f.grant("b1");
        f.service.heartbeat("alice", "b1", "session-reader-0001");
        for (int i = 0; i < 4; i++) { f.advance(1); assertEquals(0, f.service.heartbeat("alice", "b1", "session-reader-0001").get("seconds")); }
        f.advance(1); assertEquals(5, f.service.heartbeat("alice", "b1", "session-reader-0001").get("seconds"));
    }
    @Test void visitsCannotWriteReadingChatOrCheckinProgressAndAreScopedToTheUserAndDay() {
        Fixture f = new Fixture(); Mission m = f.config("SEARCH");
        for (String kind : List.of("CHECKIN", "CHAT", "READING_SECONDS", "TOTAL_XP")) assertThrows(ResponseStatusException.class, () -> f.service.visit("alice", kind, "books"));
        assertThrows(ResponseStatusException.class, () -> f.service.visit("alice", "SEARCH", " "));
        f.service.visit("alice", "SEARCH", "sách"); f.service.visit("alice", "SEARCH", "sách"); assertEquals(1, f.events.size());
        assertEquals(1, f.service.progress(f.reader, m));
        Customer bob = new Customer(); bob.setCustomer_id("bob"); assertEquals(0, f.service.progress(bob, m));
        f.advance(86400); assertEquals(0, f.service.progress(f.reader, m));
    }
    @Test void chatNeedsAnActualPersistedUserMessageWithinTheVietnamBusinessDay() {
        Fixture f = new Fixture(); Mission m = f.config("CHAT");
        assertThrows(ResponseStatusException.class, () -> f.service.claim("alice", m.getId()));
        when(f.chat.countUserMessages(eq("alice"), any(), any())).thenReturn(1L);
        assertEquals(7, f.service.claim("alice", m.getId()).get("rewardPotato"));
        verify(f.chat, atLeastOnce()).countUserMessages("alice", LocalDateTime.ofInstant(Instant.parse("2026-11-19T17:00:00Z"), ZoneId.systemDefault()), LocalDateTime.ofInstant(Instant.parse("2026-11-20T17:00:00Z"), ZoneId.systemDefault()));
    }
    @Test void bookshelfMilestoneCountsDistinctCurrentlyAccessibleBooksOnly() {
        Fixture f = new Fixture(); Mission m = f.config("BOOKS_OWNED");
        Access_Record a = f.grant("b1"), duplicate = f.grant("b1"), revoked = f.grant("b2"), expired = f.grant("b3");
        revoked.setStatus("REVOKED"); expired.setEnd_date(LocalDateTime.MIN);
        when(f.access.findByCustomerOrderByLastReadAtDesc(f.reader)).thenReturn(List.of(a, duplicate, revoked, expired));
        assertEquals(1, f.service.progress(f.reader, m));
    }
    @Test void expiredStreakDoesNotUnlockMilestoneAndInactiveMissionsCannotBeClaimed() {
        Fixture f = new Fixture(); Mission m = f.config("STREAK_DAYS"); m.setTargetValue(7);
        f.reader.setStreakDays(7); f.reader.setLastStreakDate(f.service.today().minusDays(2));
        assertThrows(ResponseStatusException.class, () -> f.service.claim("alice", m.getId()));
        f.reader.setLastStreakDate(f.service.today()); m.setActive(false);
        assertThrows(ResponseStatusException.class, () -> f.service.claim("alice", m.getId()));
        assertTrue(((List<?>) f.service.dashboard(f.reader).get("missions")).isEmpty());
    }
    @Test void adminValidationRejectsUnsupportedConditionsPeriodMismatchAndInvalidTargetsOrRewards() {
        Fixture f = new Fixture(); Mission m = f.config("CHECKIN"); MissionService.validate(m);
        m.setCondition("REFERRAL"); assertThrows(ResponseStatusException.class, () -> MissionService.validate(m));
        m.setCondition("CHECKIN"); m.setPeriod("MILESTONE"); assertThrows(ResponseStatusException.class, () -> MissionService.validate(m));
        m.setPeriod("DAILY"); m.setTargetValue(2); assertThrows(ResponseStatusException.class, () -> MissionService.validate(m));
        m.setTargetValue(1); m.setRewardPotato(-1); assertThrows(ResponseStatusException.class, () -> MissionService.validate(m));
        m.setRewardPotato(10001); assertThrows(ResponseStatusException.class, () -> MissionService.validate(m));
        m.setRewardPotato(5); m.setRewardXp(10001); assertThrows(ResponseStatusException.class, () -> MissionService.validate(m));
    }
    @Test void adminCannotChangeIdentityConditionOrPeriodOfAnExistingMission() {
        Fixture f = new Fixture(); Mission current = f.config("CHECKIN");
        Mission input = Mission.builder().id("client-id").title("Changed").description("Updated").condition("OFFERS").period("DAILY").targetValue(1).active(false).build();
        assertThrows(ResponseStatusException.class, () -> f.service.saveConfig(current.getId(), input));
        input.setCondition("CHECKIN"); when(f.missions.save(any())).thenAnswer(i -> i.getArgument(0));
        assertEquals(current.getId(), f.service.saveConfig(current.getId(), input).getId());
        assertFalse(input.isActive());
    }
    @Test void claimRequestCannotChooseRewardsOrPeriodAndAnonymousCannotReadProgress() {
        CustomerService customers = mock(CustomerService.class); CustomerRepository repo = mock(CustomerRepository.class);
        when(customers.getCurrentAccountId()).thenReturn(1); Customer customer = new Customer(); customer.setCustomer_id("alice"); when(repo.findCustomerById(1)).thenReturn(customer);
        var controller = new UserFeaturesController(customers, null, null, repo, null, null, null, null, null, null, null);
        MissionService service = mock(MissionService.class); ReflectionTestUtils.setField(controller, "missions", service);
        MissionClaimRequest request = new MissionClaimRequest(); request.setMissionId("m1"); request.setRewardPotato(999999); request.setRewardXp(999999); request.setIsMilestone(true);
        when(service.claim("alice", "m1")).thenReturn(Map.of("newBalance", 7));
        assertEquals(200, controller.claimMissionReward(request).getStatusCode().value()); verify(service).claim("alice", "m1");
        when(repo.findCustomerById(1)).thenReturn(null);
        var progress = new MissionController(customers, repo, service); assertThrows(ResponseStatusException.class, progress::list);
    }
    @Test void seedDoesNotOverwriteAdminConfigurationAndOverflowDoesNotWriteRewards() {
        Fixture f = new Fixture(); when(f.missions.count()).thenReturn(1L); f.service.seedDefaults(); verify(f.missions, never()).saveAll(any());
        Mission m = f.config("CHECKIN"); f.reader.setLastStreakDate(f.service.today()); f.reader.setPotatoBalance(Integer.MAX_VALUE);
        assertThrows(ArithmeticException.class, () -> f.service.claim("alice", m.getId())); verifyNoInteractions(f.ledger, f.inbox, f.tiers);
    }
    @Test void claimRefreshesTheLockedAccountBeforeUsingWalletOrCompletionEvidence() {
        Fixture f = new Fixture(); Mission m = f.config("CHECKIN");
        jakarta.persistence.EntityManager em = mock(jakarta.persistence.EntityManager.class);
        ReflectionTestUtils.setField(f.service, "entityManager", em);
        doAnswer(i -> { f.reader.setPotatoBalance(70); f.reader.setLastStreakDate(f.service.today()); return null; })
            .when(em).refresh(f.reader, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        assertEquals(77, f.service.claim("alice", m.getId()).get("newBalance"));
        var order = inOrder(f.customers, em, f.missions);
        order.verify(f.customers).findByIdForUpdate("alice"); order.verify(em).refresh(f.reader, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE); order.verify(f.missions).findLocked(m.getId());
    }
    @Test void membershipPointMilestonesUseTheSameMetricAsTheMembershipPage() {
        Fixture f = new Fixture(); Mission m = f.config("TOTAL_XP"); m.setTargetValue(500);
        when(f.tiers.getTotalPoints(f.reader)).thenReturn(499); assertThrows(ResponseStatusException.class, () -> f.service.claim("alice", m.getId()));
        when(f.tiers.getTotalPoints(f.reader)).thenReturn(500); assertEquals(7, f.service.claim("alice", m.getId()).get("rewardPotato"));
        assertEquals(500, f.service.dashboard(f.reader).get("totalXp"));
    }
    @Test void persistenceFailuresPropagateAndDoNotProduceSuccessReceiptsOrNotifications() throws Exception {
        Fixture f = new Fixture(); Mission m = f.config("CHECKIN"); f.reader.setLastStreakDate(f.service.today());
        when(f.ledger.save(any())).thenThrow(new IllegalStateException("database failure"));
        assertThrows(IllegalStateException.class, () -> f.service.claim("alice", m.getId()));
        verify(f.claims, never()).saveAndFlush(any()); verifyNoInteractions(f.inbox);
        assertNotNull(MissionService.class.getMethod("claim", String.class, String.class).getAnnotation(org.springframework.transaction.annotation.Transactional.class));
        var constraint = UserMissionClaim.class.getAnnotation(jakarta.persistence.Table.class).uniqueConstraints()[0];
        assertEquals("uk_mission_claim_key", constraint.name()); assertArrayEquals(new String[]{"claim_key"}, constraint.columnNames());
    }
}
