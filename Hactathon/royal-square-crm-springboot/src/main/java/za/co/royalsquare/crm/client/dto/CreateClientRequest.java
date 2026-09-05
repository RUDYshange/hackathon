package za.co.royalsquare.crm.client.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * A request DTO is a separate type from a response DTO, even when the fields
 * overlap. Reusing one class for both means the client could POST an id, a
 * netWorth or a createdAt and you would have to remember to ignore them. Here
 * those fields simply do not exist, so they cannot be set.
 *
 * The validation annotations run before the controller method body does.
 */
public record CreateClientRequest(

        @NotBlank(message = "A title is required")
        @Size(max = 10)
        String title,

        @NotBlank(message = "A first name is required")
        @Size(max = 60)
        String firstName,

        @Size(max = 60)
        String secondName,

        @NotBlank(message = "A surname is required")
        @Size(max = 60)
        String surname,

        @Pattern(regexp = "\\d{13}", message = "A South African ID number is 13 digits")
        String idNumber,

        @Past(message = "A date of birth must be in the past")
        LocalDate dateOfBirth,

        @Size(max = 80)
        String occupation,

        @Size(max = 80)
        String employer,

        @PositiveOrZero(message = "Annual income cannot be negative")
        BigDecimal annualIncome,

        @Pattern(regexp = "^$|^[0-9 +()-]{10,20}$", message = "That does not look like a phone number")
        String mobileNumber,

        @Email(message = "That email address is not valid")
        String emailAddress,

        @Size(max = 200)
        String primaryAddress,

        String referredBy
) {}
