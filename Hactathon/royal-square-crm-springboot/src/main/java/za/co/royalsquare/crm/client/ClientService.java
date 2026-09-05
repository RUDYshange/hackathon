package za.co.royalsquare.crm.client;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import za.co.royalsquare.crm.client.dto.ClientDetailResponse;
import za.co.royalsquare.crm.client.dto.ClientSummaryResponse;
import za.co.royalsquare.crm.client.dto.CreateClientRequest;
import za.co.royalsquare.crm.common.NotFoundException;

import java.util.List;
import java.util.UUID;

/**
 * Business rules live here. The controller handles HTTP, the repository handles
 * SQL, and everything in between belongs to the service.
 */
@Service
public class ClientService {

    private final ClientRepository repository;
    private final ClientMapper mapper;

    public ClientService(ClientRepository repository, ClientMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    /** readOnly lets the database skip write locks and dirty checking. */
    @Transactional(readOnly = true)
    public List<ClientSummaryResponse> findAll() {
        return mapper.toSummaries(repository.findAllWithLedger());
    }

    @Transactional(readOnly = true)
    public List<ClientSummaryResponse> search(String term) {
        if (term == null || term.isBlank()) return findAll();
        return mapper.toSummaries(
                repository.findByFirstNameContainingIgnoreCaseOrSurnameContainingIgnoreCase(term, term));
    }

    @Transactional(readOnly = true)
    public ClientDetailResponse findById(UUID id) {
        Client client = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Client", id));
        return mapper.toDetail(client);
    }

    @Transactional
    public ClientDetailResponse create(CreateClientRequest request) {
        Client client = mapper.fromRequest(request, nextReference());
        return mapper.toDetail(repository.save(client));
    }

    /**
     * References run C-1001 upward. In production this belongs in a database
     * sequence — two advisers creating a client at the same moment would
     * otherwise race for the same number.
     */
    private String nextReference() {
        long count = repository.count();
        String candidate;
        do {
            candidate = "C-" + (1001 + count++);
        } while (repository.existsByReference(candidate));
        return candidate;
    }
}
