package fr.epita.assistants.ping.data.repository;

import fr.epita.assistants.ping.data.model.ProjectModel;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.UUID;
import java.util.List;

@ApplicationScoped
public class ProjectRepository implements PanacheRepositoryBase<ProjectModel, UUID> {
    public boolean existsByOwnerId(UUID ownerId) {
        return find("owner.id", ownerId).firstResultOptional().isPresent();
    }

    public List<ProjectModel> findByMemberId(UUID userId) {
        return find("element(members).id = ?1", userId).list();
    }

}


