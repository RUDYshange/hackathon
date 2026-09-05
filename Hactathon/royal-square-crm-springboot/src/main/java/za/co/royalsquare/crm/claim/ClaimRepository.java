package za.co.royalsquare.crm.claim;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ClaimRepository extends JpaRepository<Claim, UUID> {

    List<Claim> findByClientId(UUID clientId);

    List<Claim> findByStageNot(ClaimStage stage);
}
