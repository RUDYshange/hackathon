package za.co.royalsquare.crm.client;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ClientRepository extends JpaRepository<Client, UUID> {

    Optional<Client> findByReference(String reference);

    boolean existsByReference(String reference);

    /**
     * Spring Data derives the SQL from the method name. This one searches the
     * fields an adviser would actually type, and deliberately excludes the ID
     * number — searching by it would put personal information in a URL.
     */
    List<Client> findByFirstNameContainingIgnoreCaseOrSurnameContainingIgnoreCase(
            String firstName, String surname);

    List<Client> findByNextReviewDateBefore(LocalDate date);

    /**
     * The client list needs the ledger to compute net worth. Without this join
     * fetch, JPA issues one query per client — the N+1 problem, which turns a
     * 200-client page into 201 queries.
     */
    @Query("select distinct c from Client c left join fetch c.ledgerEntries")
    List<Client> findAllWithLedger();
}
