package com.example.demochatbot.support;
import com.example.demochatbot.model.CommercePolicy;
import com.example.demochatbot.repository.*;
import com.example.demochatbot.service.policy.CommercePolicyService;
import com.example.demochatbot.service.tier.TierService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Optional;
import static org.mockito.Mockito.*;
public final class TestCommercePolicies {
    private TestCommercePolicies() {}
    public static com.example.demochatbot.service.offer.OfferPricingService pricing(BookRepository books, PromotionRepository promotions, CommercePolicyService policy) {
        return new com.example.demochatbot.service.offer.OfferPricingService(mock(com.example.demochatbot.service.offer.BookOfferService.class), books, promotions, policy);
    }
    public static CommercePolicyService defaults(TierService tiers) {
        try {
            ObjectMapper mapper = new ObjectMapper(); CommercePolicy row = new CommercePolicy(); row.setId(1); row.setRevision(1);
            row.setRentalPlansJson(mapper.writeValueAsString(CommercePolicyService.defaults()));
            CommercePolicyRepository repository = mock(CommercePolicyRepository.class);
            lenient().when(repository.findById(1)).thenReturn(Optional.of(row));
            lenient().when(repository.lockForCheckout()).thenReturn(Optional.of(row));
            return new CommercePolicyService(repository, mock(MembershipTierRepository.class), tiers, mapper);
        } catch (Exception e) { throw new IllegalStateException(e); }
    }
}
