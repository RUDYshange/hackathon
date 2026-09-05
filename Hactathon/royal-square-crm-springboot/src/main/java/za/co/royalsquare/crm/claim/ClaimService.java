package za.co.royalsquare.crm.claim;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import za.co.royalsquare.crm.claim.dto.*;
import za.co.royalsquare.crm.client.Client;
import za.co.royalsquare.crm.client.ClientRepository;
import za.co.royalsquare.crm.common.NotFoundException;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class ClaimService {

    private final ClaimRepository claims;
    private final ClientRepository clients;

    public ClaimService(ClaimRepository claims, ClientRepository clients) {
        this.claims = claims;
        this.clients = clients;
    }

    @Transactional(readOnly = true)
    public List<ClaimResponse> findAll() {
        return claims.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ClaimResponse findById(UUID id) {
        return toResponse(claims.findById(id).orElseThrow(() -> new NotFoundException("Claim", id)));
    }

    @Transactional
    public ClaimResponse register(RegisterClaimRequest request) {
        Client client = clients.findById(request.clientId())
                .orElseThrow(() -> new NotFoundException("Client", request.clientId()));

        Claim claim = new Claim(client, nextReference(), request.insurer(),
                request.claimType(), request.incidentDate());
        claim.setDescription(request.description());
        return toResponse(claims.save(claim));
    }

    @Transactional
    public ClaimResponse advance(UUID id) {
        Claim claim = claims.findById(id).orElseThrow(() -> new NotFoundException("Claim", id));
        claim.advance();
        return toResponse(claim);
    }

    @Transactional
    public ClaimResponse toggleSceneItem(UUID id, SceneItem item) {
        Claim claim = claims.findById(id).orElseThrow(() -> new NotFoundException("Claim", id));
        if (claim.hasGathered(item)) claim.ungather(item); else claim.gather(item);
        return toResponse(claim);
    }

    private String nextReference() {
        return "CLM-" + LocalDate.now().getYear() + "-" + String.format("%04d", claims.count() + 1);
    }

    private ClaimResponse toResponse(Claim c) {
        return new ClaimResponse(
                c.getId(), c.getReference(), c.getClient().getId(), c.getClient().fullName(),
                c.getInsurer(), c.getPolicyNumber(), c.getInsurerClaimNumber(),
                c.getClaimsHandler(), c.getClaimType(), c.getIncidentDate(), c.getLodgedDate(),
                c.getDescription(), c.getStage().name(), c.getStage().stepNumber(),
                ClaimStage.values().length, c.getStage().isFinal(),
                Arrays.stream(SceneItem.values())
                        .map(i -> new SceneItemResponse(i.name(), i.getDescription(), c.hasGathered(i)))
                        .toList(),
                c.getLog().stream()
                        .map(l -> new ClaimLogResponse(l.getText(), l.getRecordedAt()))
                        .toList());
    }
}
