package fr.epita.assistants.ping.api.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ExecFeatureRequest {
    private String feature;
    private String command;
    private List<String> params;
}
