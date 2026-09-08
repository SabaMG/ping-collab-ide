package fr.epita.assistants.ping.converter;

import fr.epita.assistants.ping.api.response.UserResponse;
import fr.epita.assistants.ping.data.model.UserModel;

public class UserConverter {
    public static UserResponse convert(UserModel u) {
        return new UserResponse(
            u.getId(),
            u.getLogin(),
            u.getDisplayName(),
            u.getIsAdmin(),
            u.getAvatar()
        );
    }
}
