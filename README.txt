The Chronos Team
++++++++++++++++

1. TODO
-------


2. NETTY
---------
Pour lancer le serveur Netty
* mvn clean package exec:java
ou
* mvn clean package
* sh target/appassembler/bin/netty

Pour lancer une requete Http en ligne de commande :
* curl -i -X POST -H Accept:application/json -H Content-Type:application/json -d '{"firstname" : "string", "lastname" : "string", "mail" : "string","password" : "string"}' http://localhost:8080/api/user
* curl -i -X GET http://localhost:8080/api/question/1
