package za.co.royalsquare.crm.compliance.dto;

import java.time.LocalDate;

public record ComplianceDocumentResponse(
        String type,
        String label,
        String shortLabel,
        String renewalRule,
        LocalDate signedOn,
        LocalDate expiresOn,
        String status,
        String statusLabel
) {}
