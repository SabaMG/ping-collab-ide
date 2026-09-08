package fr.epita.assistants.ping.api.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserResponse {
    private UUID id;
    private String login;
    private String displayName;
    private boolean isAdmin;
    private String avatar;

    @JsonProperty("isAdmin")
    public boolean getIsAdmin() {
        return isAdmin;
    }
}
