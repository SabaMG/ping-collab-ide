package fr.epita.assistants.ping.api.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LogEntryResponse {
    private String timestamp;
    private String message;
}
