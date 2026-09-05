package za.co.royalsquare.crm.client;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;
import za.co.royalsquare.crm.client.dto.ClientDetailResponse;
import za.co.royalsquare.crm.client.dto.ClientSummaryResponse;
import za.co.royalsquare.crm.client.dto.CreateClientRequest;

import java.net.URI;
import java.util.List;
import java.util.UUID;

/**
 * Thin on purpose. It reads the request, calls one service method, and chooses
 * a status code. Anything more than that has drifted out of the web layer.
 */
@RestController
@RequestMapping("/api/clients")
public class ClientController {

    private final ClientService service;

    public ClientController(ClientService service) {
        this.service = service;
    }

    @GetMapping
    public List<ClientSummaryResponse> list(@RequestParam(required = false) String q) {
        return service.search(q);
    }

    @GetMapping("/{id}")
    public ClientDetailResponse detail(@PathVariable UUID id) {
        return service.findById(id);
    }

    /**
     * 201 Created with a Location header pointing at the new resource, which is
     * what a POST that creates something is supposed to return.
     */
    @PostMapping
    public ResponseEntity<ClientDetailResponse> create(@Valid @RequestBody CreateClientRequest request,
                                                       UriComponentsBuilder uri) {
        ClientDetailResponse created = service.create(request);
        URI location = uri.path("/api/clients/{id}").buildAndExpand(created.id()).toUri();
        return ResponseEntity.created(location).body(created);
    }
}
