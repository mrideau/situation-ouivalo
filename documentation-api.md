# API iot
API ayant pour but d’interfacer les données envoyées par des objets connectés (iot), avec une base de données sur Google Sheets. 

## Généralités
url d’accès en méthode POST
https://script.google.com/macros/s/AKfycby-TJmFFUFTfiNUbMoSIZx8LVtiskQ-bUt4xO6hmrU0XQpJS8IPUBow/exec 
Toute requête doit autoriser la redirection, car Google en effectue une. 
url de la Google sheet pour tester la bonne réception :
https://docs.google.com/spreadsheets/d/1_OY8SdY9zqH5fThEXefUuzyIXFG0fmrha6mnxkwJOwo/edit#gid=0 

## Documentation requêtes posts
### Body
Doit contenir dans le body un objet json, présentant les paramètres suivants :
- “cle” | String, de valeur “CLE-TEST-IOT” pour le moment
- “donnees” | tableau json, pouvant comprendre ou non les éléments suivants. Chacun de ces éléments est optionnel  mais recommandé :
- "id" | String, id de l’objet émétteur
- "date" | Date, date du ping
- "tagRfid" | String, Tag RFID de l’utilisateur ouvrant le bac
- "urlRelais" | String, url / id du point relais correspondant. Exemple : “les-hameaux-bio-nantes”
- "message" | String, Message / information à faire passer

### Valeurs de retour 
Valeur textuelle, décrivant si la requête a été traitée avec succès ou si elle a échouée, auquel cas la raison de l’échec est indiquée. 
 
