package com.example.demochatbot.banner;

import com.example.demochatbot.dto.BannerDto;
import com.example.demochatbot.model.Banner;
import com.example.demochatbot.repository.BannerRepository;
import com.example.demochatbot.repository.SiteSettingRepository;
import com.example.demochatbot.service.banner.BannerServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class BannerPlatformTests {
    private final BannerRepository repository = mock(BannerRepository.class);
    private final BannerServiceImpl service = new BannerServiceImpl(repository, mock(SiteSettingRepository.class), new ObjectMapper());
    private Banner banner(String id, String platform, int order) {
        return Banner.builder().id(id).platform(platform).layoutType("showcase").title(id).orderIndex(order).build();
    }

    @Test void publicListsAreScopedAndLegacyRequestsDefaultToWeb() {
        when(repository.findByPlatformAndIsActiveTrueOrderByOrderIndexAscIdAsc("WEB")).thenReturn(List.of(banner("web", "WEB", 1)));
        when(repository.findByPlatformAndIsActiveTrueOrderByOrderIndexAscIdAsc("APP")).thenReturn(List.of(banner("app", "APP", 1)));
        assertEquals("WEB", service.getActiveBanners(null).getFirst().getPlatform());
        assertEquals("APP", service.getActiveBanners("app").getFirst().getPlatform());
        assertThrows(IllegalArgumentException.class, () -> service.getActiveBanners("MOBILE"));
    }

    @Test void cannotEditToggleOrDeleteABannerFromAnotherChannel() {
        Banner app = banner("app", "APP", 1);
        when(repository.findById("app")).thenReturn(Optional.of(app));
        assertThrows(IllegalArgumentException.class, () -> service.updateBanner("app", BannerDto.builder().title("changed").build(), "WEB"));
        assertThrows(IllegalArgumentException.class, () -> service.toggleBannerStatus("app", "WEB"));
        assertThrows(IllegalArgumentException.class, () -> service.deleteBanner("app", "WEB"));
        assertEquals("app", app.getTitle());
        verify(repository, never()).save(any());
        verify(repository, never()).delete(any());
    }

    @Test void cannotMoveAnExistingBannerToTheOtherChannel() {
        when(repository.findById("app")).thenReturn(Optional.of(banner("app", "APP", 1)));
        assertThrows(IllegalArgumentException.class, () -> service.updateBanner("app", BannerDto.builder().platform("WEB").build(), "APP"));
        verify(repository, never()).save(any());
    }

    @Test void reorderOnlyChangesOrderWithinItsChannel() {
        Banner first = banner("a", "APP", 1), second = banner("b", "APP", 2);
        when(repository.findByPlatformOrderByOrderIndexAscIdAsc("APP")).thenReturn(List.of(first, second));
        var result = service.saveAllBanners(List.of(BannerDto.builder().id("b").title("stale title").build(), BannerDto.builder().id("a").build()), "APP");
        assertEquals(List.of("b", "a"), result.stream().map(BannerDto::getId).toList());
        assertEquals("b", second.getTitle());
        verify(repository, never()).deleteAllInBatch();
        verify(repository, never()).deleteAllInBatch(anyIterable());
        verify(repository, never()).findByPlatformOrderByOrderIndexAscIdAsc("WEB");
    }

    @Test void staleEmptyMixedAndDuplicateReordersCannotDeleteOrModifyRecords() {
        Banner first = banner("a", "APP", 1), second = banner("b", "APP", 2);
        when(repository.findByPlatformOrderByOrderIndexAscIdAsc("APP")).thenReturn(List.of(first, second));
        assertThrows(IllegalArgumentException.class, () -> service.saveAllBanners(List.of(), "APP"));
        assertThrows(IllegalArgumentException.class, () -> service.saveAllBanners(List.of(BannerDto.builder().id("a").build()), "APP"));
        assertThrows(IllegalArgumentException.class, () -> service.saveAllBanners(List.of(BannerDto.builder().id("b").build(), BannerDto.builder().id("web").build()), "APP"));
        assertThrows(IllegalArgumentException.class, () -> service.saveAllBanners(List.of(BannerDto.builder().id("a").build(), BannerDto.builder().id("a").build()), "APP"));
        assertEquals(1, first.getOrderIndex()); assertEquals(2, second.getOrderIndex());
        verify(repository, never()).saveAll(anyIterable());
        verify(repository, never()).deleteAllInBatch(anyIterable());
    }

    @Test void resettingAppOnlyDeletesAppRecordsAndSeedsAppDestinations() {
        List<Banner> app = List.of(banner("app-old", "APP", 1));
        when(repository.findByPlatformOrderByOrderIndexAscIdAsc("APP")).thenReturn(app);
        service.resetDefaultBanners("APP");
        verify(repository).deleteAllInBatch(app);
        verify(repository, never()).deleteAllInBatch();
        verify(repository, never()).findByPlatformOrderByOrderIndexAscIdAsc("WEB");
        verify(repository).saveAll(argThat(rows -> {
            for (Banner row : rows) if (!"APP".equals(row.getPlatform()) || !row.getActionLink().startsWith("app:")) return false;
            return true;
        }));
    }

    @Test void appCreationValidatesDestinationAndAssignsAnIndependentId() {
        when(repository.findByPlatformOrderByOrderIndexAscIdAsc("APP")).thenReturn(List.of());
        when(repository.save(any())).thenAnswer(call -> call.getArgument(0));
        BannerDto dto = BannerDto.builder().id("banner-1").platform("APP").layoutType("showcase").title("Discover").actionLink("app:offers").build();
        BannerDto saved = service.createBanner(dto);
        assertEquals("APP", saved.getPlatform()); assertNotEquals("banner-1", saved.getId());
        assertEquals(1, saved.getOrder());
        assertThrows(IllegalArgumentException.class, () -> service.createBanner(BannerDto.builder().platform("APP").layoutType("showcase").title("Invalid").actionLink("javascript:alert(1)").build()));
    }
}
