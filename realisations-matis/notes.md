## Context
Composant "formulaire" d'inscription avec paiement optionnel 'pour cotisation pour les partenaires'.

## Role de chacun des fichiers
.html -> Vue/Contenu de la page

component.ts -> Model/Fonctionnement composant ET déclaration du composant
C'EST LE COMPOSANT

.service -> Utilitaire


## Interactions entre fichiers
component.ts > Interactions visuelles, Router

.html > appelé par component pour donner l'afficahge ET échange pour dynamiser les données

.service > Interactions de fonctionnalités

## Role des elements plus specifiquement
.component -> "cerveau". Il va imposer la logique et les états/étapes. Il va appeler le service quand il veut valider des données. Il reccueil les interactions.

.html -> conçu pour suivre le .component. Sa mise en page inclut les fonctionnalités proposée par le composant

.services met à disposition des outils au composant


-----------


## JS Ajax -> W3School
Structure requete ajax

## XMLHttpRequest > mozilla dev
doc ajax

## Json > mozilla dev
Doc json

## xmlhttprequest send json body
https://stackoverflow.com/questions/39519246/make-xmlhttprequest-post-using-json


## has been blocked by CORS policy
https://stackoverflow.com/questions/20035101/why-does-my-javascript-code-receive-a-no-access-control-allow-origin-header-i

https://web.dev/cross-origin-resource-sharing/

https://stackoverflow.com/questions/23272611/how-to-set-the-access-control-allow-origin-header-with-xmlhttprequest

## javascript xmlhttprequest post cors
https://www.html5rocks.com/en/tutorials/cors//


## It does not have HTTP ok status
https://stackoverflow.com/questions/5750696/how-to-get-a-cross-origin-resource-sharing-cors-post-request-working

https://stackoverflow.com/questions/10636611/how-does-access-control-allow-origin-header-work#:~:text=Access%2DControl%2DAllow%2DOrigin%20is%20a%20CORS%20(Cross,is%20accessible%20to%20certain%20origins.

## Suppression du setHeader
Fonctionne

## js form post
https://developer.mozilla.org/fr/docs/Learn/Forms/Sending_forms_through_JavaScript

## js on click get value from form input
https://stackoverflow.com/questions/11810874/how-to-get-an-input-text-value-in-javascript
Classique "Get element by id"

## html js form post
https://developer.mozilla.org/fr/docs/Learn/Forms/Sending_forms_through_JavaScript
Utiliation de Form Data

https://stackoverflow.com/questions/16323360/submitting-html-form-using-jquery-ajax
"Reecriture du submit"