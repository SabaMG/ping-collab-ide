package fr.epita.assistants.ping.converter;

import fr.epita.assistants.ping.api.response.ProjectResponse;
import fr.epita.assistants.ping.api.response.UserSummaryResponse;
import fr.epita.assistants.ping.data.model.ProjectModel;
import fr.epita.assistants.ping.data.model.UserModel;

import java.util.List;
import java.util.stream.Collectors;

public class ProjectConverter {
    public static ProjectResponse convert(ProjectModel p) {
        List<UserSummaryResponse> members = p.getMembers().stream()
                .map(ProjectConverter::convertUserSummary)
                .collect(Collectors.toList());
        UserSummaryResponse owner = convertUserSummary(p.getOwner());
        return new ProjectResponse(
                p.getId(),
                p.getName(),
                members,
                owner
        );
    }

    private static UserSummaryResponse convertUserSummary(UserModel user) {
        return new UserSummaryResponse(
                user.getId(),
                user.getDisplayName(),
                user.getAvatar()
        );
    }
}

