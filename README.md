Pour lancer le service PSQL:
```
export PGDATA="$HOME/postgres_data"
export PGHOST="/tmp"
export PGPORT="5432"
postgres -k "$PGHOST"
```

Pour importer la DB:
```
initdb --locale "$LANG" -E UTF8
createdb -U postgres ping
psql -U postgres -d ping -f ping.sql
```

Pour lire le contenu de la DB par exemple les users:
```
psql -U postgres -d ping
SELECT * FROM users;
```

Pour lancer le backend:
```
cd backend
mvn clean install
mvn quarkus:dev
```

Pour faire des requêtes il faut être authentifié avec un token JWS récupérable ainsi:
```
curl -i -X POST http://localhost:8080/api/user/login \
              -H "Content-Type: application/json" \
              -d '{"login":"admin.login","password":"password"}'
```
Ce qui donne ça:
```
<REDACTED_TOKEN>
```

Qu'il faut ensuite utiliser comme ça dans les requêtes:
```
curl -i -X GET http://localhost:8080/api/projects/all \
                 -H "Authorization: Bearer $TOKEN_ADMIN"
```
