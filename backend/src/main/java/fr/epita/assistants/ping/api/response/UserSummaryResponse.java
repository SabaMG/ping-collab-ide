package fr.epita.assistants.ping.api.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserSummaryResponse {
    private UUID id;
    private String displayName;
    private String avatar;
}
