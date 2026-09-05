package za.co.royalsquare.crm.claim;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.co.royalsquare.crm.claim.dto.ClaimResponse;
import za.co.royalsquare.crm.claim.dto.RegisterClaimRequest;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/claims")
public class ClaimController {

    private final ClaimService service;

    public ClaimController(ClaimService service) {
        this.service = service;
    }

    @GetMapping
    public List<ClaimResponse> list() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ClaimResponse detail(@PathVariable UUID id) {
        return service.findById(id);
    }

    @PostMapping
    public ResponseEntity<ClaimResponse> register(@Valid @RequestBody RegisterClaimRequest request) {
        return ResponseEntity.status(201).body(service.register(request));
    }

    /** POST rather than PUT: advancing is an action, not a replacement of state. */
    @PostMapping("/{id}/advance")
    public ClaimResponse advance(@PathVariable UUID id) {
        return service.advance(id);
    }

    @PostMapping("/{id}/scene/{item}")
    public ClaimResponse toggleSceneItem(@PathVariable UUID id, @PathVariable SceneItem item) {
        return service.toggleSceneItem(id, item);
    }
}
