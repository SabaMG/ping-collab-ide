package fr.epita.assistants.ping.api.response;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FSEntryResponse {
    private String name;
    private String path;
    private boolean isDirectory;
    private long sizeInBytes;
}
