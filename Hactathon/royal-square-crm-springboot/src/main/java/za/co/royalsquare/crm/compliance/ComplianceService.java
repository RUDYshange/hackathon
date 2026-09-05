package za.co.royalsquare.crm.compliance;

import org.springframework.stereotype.Service;
import za.co.royalsquare.crm.client.Client;
import za.co.royalsquare.crm.compliance.dto.ComplianceDocumentResponse;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ComplianceService {

    /**
     * Returns a row for every document type, including the ones with nothing on
     * file. A register that only lists what exists cannot show you what is
     * missing, and missing is the state that matters most.
     */
    public List<ComplianceDocumentResponse> documentsFor(Client client) {
        LocalDate today = LocalDate.now();
        Map<DocumentType, ComplianceDocument> held = client.getDocuments().stream()
                .collect(Collectors.toMap(ComplianceDocument::getType, Function.identity(),
                        (a, b) -> a.getSignedOn().isAfter(b.getSignedOn()) ? a : b));

        return java.util.Arrays.stream(DocumentType.values())
                .map(type -> {
                    ComplianceDocument doc = held.get(type);
                    if (doc == null) {
                        return new ComplianceDocumentResponse(type.name(), type.getLabel(),
                                type.getShortLabel(), type.getRenewal().getLabel(),
                                null, null, DocumentStatus.MISSING.name(), "Not on file");
                    }
                    DocumentStatus status = doc.status(today);
                    return new ComplianceDocumentResponse(type.name(), type.getLabel(),
                            type.getShortLabel(), type.getRenewal().getLabel(),
                            doc.getSignedOn(), doc.expiresOn(),
                            status.name(), describe(status, doc.expiresOn(), today));
                })
                .toList();
    }

    public int gapCount(Client client) {
        LocalDate today = LocalDate.now();
        Map<DocumentType, ComplianceDocument> held = client.getDocuments().stream()
                .collect(Collectors.toMap(ComplianceDocument::getType, Function.identity(),
                        (a, b) -> a));

        return (int) java.util.Arrays.stream(DocumentType.values())
                .filter(type -> {
                    ComplianceDocument doc = held.get(type);
                    return doc == null || doc.status(today) == DocumentStatus.LAPSED;
                })
                .count();
    }

    private String describe(DocumentStatus status, LocalDate expiry, LocalDate today) {
        return switch (status) {
            case MISSING -> "Not on file";
            case LAPSED  -> "Lapsed " + ChronoUnit.DAYS.between(expiry, today) + " days ago";
            case DUE     -> "Renews in " + ChronoUnit.DAYS.between(today, expiry) + " days";
            case CURRENT -> "Current";
        };
    }
}
