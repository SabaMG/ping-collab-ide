package fr.epita.assistants.ping.api.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class NewUserRequest {
    private String login;
    private String password;
    private Boolean isAdmin;
}
