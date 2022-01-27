import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { NavigationFormulaireService } from '../services/navigation-formulaire.service';
import { ActivatedRoute, Router, RouterState } from '@angular/router';
import { NgForm } from '@angular/forms';
import { Store, Select } from '@ngxs/store';
import { Observable, BehaviorSubject, Subscription, UnsubscriptionError, EMPTY } from 'rxjs';
import { RouterNavigation, RouterDataResolved } from '@ngxs/router-plugin';
import { FormulaireState, ChangerPage, InitType} from '../store/formulaire';
import { SetReponse, HerosState, SetId } from '../store/heros';
import { VerificationChampsService } from '../services/verification-champs.service';
import { PaiementService } from '../services/paiement.service';
import { ChargerInfosRelais } from '../store/relais';
import { EnvoiDonneesService } from '../services/envoi-donnees.service';
import { ChangerNumPagePaiement, ChangerStatut } from '../store/paiement';
import { Location } from '@angular/common';
import KRGlue from "@lyracom/embedded-form-glue";

@Component({
  selector: 'app-formulaire',
  templateUrl: './formulaire.component.html',
  styleUrls: ['./formulaire.component.scss']
})
export class FormulaireComponent implements OnInit {


  //Caractéristiques page
  hauteurActions: number;
  htmlTexte: string;
  affichage: number;
  modeAffichage: string;
  questions: Object[] = [];
  pontLogique: Object;
  nomPage: string= "";

  //VALIDATION DONNEES
  verifChamp: number[]=[];
  reponse: any[] = [];
  valeurInitiale: any;

  //NAVIGATION
  formId$: Observable<any>;

  id: number = 0;

  isModalActiveRetour: boolean = false;
  isModalActiveSortie: boolean = false;

  recap: any[]=[];
  spinner: boolean = false;

  boutonRetourSubscription: any;

  ///Données générales
  hauteurBoutonAction: number;

  constructor(private store: Store, private route: ActivatedRoute, private router: Router,
    private navigationService: NavigationFormulaireService, private verifChampsService: VerificationChampsService,
    private paiementService: PaiementService, private envoiDonneesService: EnvoiDonneesService,private locationStrategy: Location) {

      //relais
      let typeUrl =  this.route.snapshot.params['type']; //type demandé du formulaire
      let resValide: boolean = this.navigationService.initialiserNavigation(typeUrl);

      if(!resValide){
        this.router.navigate(['non-trouve']);
      }

      /*
      window.onpopstate = function(event){
        console.log(event.state.navigationId);
      }
      */
  }

  ngOnInit(): void {

    // suppression du suscribe sur le bouton retour
    if (this.boutonRetourSubscription && !this.boutonRetourSubscription.closed) {
      this.boutonRetourSubscription.unsubscribe();
    }
    this.preventBackButton();
    this.preventCloseTab();

    //================================= INITIALISATIONS GENERALES ===================================
    this.hauteurBoutonAction = this.navigationService.hauteurBoutonAction();

    //================================= NAVIGATION AUTOMATIQUE =============================

    this.formId$ = this.store.select(state => state.formulaire.idQuestionAffichee);

    this.formId$.subscribe(
      (value) => {
        window.scrollTo(0,0);
        var idTemp = Number(value);
        this.hauteurActions=this.navigationService.hauteurActions(idTemp)+this.hauteurBoutonAction;
        //console.log("hauteur action : "+this.hauteurActions);
        this.htmlTexte = this.evaluateHtml(this.navigationService.html(idTemp));
        this.modeAffichage= this.navigationService.modeAffichage(idTemp);
        //console.log("nouveau mode"+this.modeAffichage);
        this.questions= this.navigationService.questions(idTemp);
        //console.log("Questions maj élément 0 : "+this.questions[0]);
        this.pontLogique = this.navigationService.pontLogique(idTemp);
        this.nomPage = this.navigationService.nom(idTemp);

        //Recap :
        if(this.modeAffichage==='recap'){
          this.recap=this.navigationService.editerRecap();
          //console.log("edition recap");
        }else if(this.nomPage==='ecran-fin'){


          this.envoiDernieresDonnees();

        }

        //console.log("Initialisation");

        for(let i = 0; i < this.questions.length; i++){
          if(this.questions[i]["proposition-reponse"]!==undefined){
            this.valeurInitiale = this.questions[i]["proposition-reponse"];
          }else{
            this.valeurInitiale=undefined;
          }
          this.store.select(state => state.donneesHeros.reponses[this.questions[i]["nom"]]).subscribe(
            (value) =>{

                if((value===-15)&&(this.valeurInitiale!==undefined)){
                  //initialisation spécifique de la valeur du champ
                  this.reponse[i]=this.valeurInitiale;
                  this.onChange(this.reponse[i], i);
                  //this.valeurInitiale=undefined; // on ne le fait qu'une fois
                }else{
                  this.reponse[i]=value;
                }
                this.majVerifChamps();

              //console.log("reponse n°"+i+" : "+value);
            }
          );
        }
        this.id=idTemp;
        //Changement de l'affichage
        if(this.modeAffichage==="paiement"){
          this.store.dispatch(new ChangerNumPagePaiement(this.store.selectSnapshot(state => state.formulaire.idQuestionAffichee)));
          let formatRelais = this.store.selectSnapshot(state => state.relais.type);
          let alias = false;
          let abonnement = false;
          if((formatRelais == "SEAU-MOIS")||(formatRelais == "MOIS")||(formatRelais == "MOIS-CONCIERGERIE")||(formatRelais == "LIVRAISON")||(formatRelais == "BAC-ITINERANT")||(formatRelais == "ENREGISTREMENT")){
            alias = true;
            if((formatRelais == "SEAU-MOIS")||(formatRelais == "MOIS")||(formatRelais == "MOIS-CONCIERGERIE")||(formatRelais == "BAC-ITINERANT")){
              abonnement = true;
            }
          }
          this.createPaiement(alias,abonnement);
        }

      }
    );


   //========================================== Réactions aux paiements :

   this.store.select(state => state.paiement.statut).subscribe(
     (value) => {
      //console.log("Réaction paiement");
      //value  => non-realise/preparation/erreur
      //console.log("ici paiment trigger statut on change : "+value)
      if((value!="preparation")&&(value!="non-prepare")){
        this.spinner=false;
        if(value=="succes"){
            let idCalc = this.navigationService.getPageSuivante(this.id, -1);
            this.store.dispatch(new ChangerPage(idCalc,this.questions));
        }
      }
     }
   );

   //================================= INITIALISATION DONNEES =============================

   let  type = this.store.selectSnapshot(state => state.formulaire.type);
   //console.log(type)
   if((type!="IDENTIFICATION-ESPACE")){

      var url = this.store.selectSnapshot(state => state.relais.url);
      var id;
      this.envoiDonneesService.init(url, type).subscribe(
        (value) => {
          id=value;
          this.store.dispatch(new SetId(id));
          let date = VerificationChampsService.dateFormat(new Date());
          //console.log(date);
          let type = this.store.selectSnapshot(state => state.formulaire.type);
          this.envoiDonneesService.envoiDonnees(id,["date-debut",date],type).subscribe(
            () => console.log("Bienvenue dans le formulaire d'inscription :)")
          );
        },
        (error) => {
          /*console.log('Erreur pour l"init ');
          var out='';
          for (var i in error) {
            out += i + ": " + error[i] + "\n";
          }
          //console.log(out);*/
        }
      );
    }
    else{


      //================================= CAS PARTICULIER ESPACE =============================

      this.store.select(state => state.donneesHeros.reponses.prenom).subscribe(
        (value) => {

          //console.log("Réaction à l'arrivée du prénom : "+value);

          if((value!="")&&(value!=undefined)){

            if(value=="NON-TROUVE"){
              this.spinner=false;
              //console.log("pas trouvé le mail, afficher une erreur à l'utilisateur");
              document.getElementById("erreurRechercheMail").style.display = "block";
            }else{
              //console.log("succes");
              this.spinner=false;
              let idCalc = this.navigationService.getPageSuivante(this.id, -1);
              this.store.dispatch(new ChangerPage(idCalc,this.questions));
            }
          }
        }
      );

    }
  }

  onpopstateFunction(event:any): void{
    var idActuel = event.state.id;
    var idStore = this.store.selectSnapshot(state => state.formulaire.id);
    if(idActuel<idStore){
      this.store.dispatch(new ChangerPage(this.navigationService.getPagePrecedente(idActuel+1),this.questions));
    }
  }

  envoiDernieresDonnees(){
    // Envoi des dernières données ! :)
    var modePaiement = this.store.selectSnapshot(state => state.donneesHeros.reponses['mode-paiement']);
    var statutPaiement = this.store.selectSnapshot(state => state.paiement.statut);
    if(modePaiement=='autre'){
      statutPaiement = "autre";
    }
    var id = this.store.selectSnapshot(state => state.donneesHeros.id);
    var date = VerificationChampsService.dateFormat(new Date());
    //console.log("Ecran fin, envoi de la date");

    let  type = this.store.selectSnapshot(state => state.formulaire.type);
    const result = this.envoiDonneesService.envoiDonnees(id,["statut-paiement",statutPaiement], type).subscribe(
      (value) => {
        let type = this.store.selectSnapshot(state => state.formulaire.type);
        this.envoiDonneesService.envoiDonnees(id,["date-fin",date], type).subscribe(
        (value) => {
          let type = this.store.selectSnapshot(state => state.formulaire.type);
          this.envoiDonneesService.envoiDonnees(id,["mode-paiement",modePaiement], type).subscribe(
          () => console.log("Succès de l'inscription :)")
        )
          }
      )
        }
    );
  }

  evaluateHtml(html:string):string{
    //Fonction qui permet le passage de variables dans le html

    var posDeb = html.search('#PPR#');
    var resultat = html;

    //console.log("Trouvé ? "+posDeb);

    if(posDeb!=-1){
      //On a voulu faire passer une variable

      var pos=posDeb;
      pos=pos+5; //on prend en compte la longueur du #PPR#
      var posFinVariable=pos;

      //On cherche le modèle dont on souhaite récupérer une propriété
      var ch: string = html[pos];
      var modele: string="";
      while(ch!=="#"){
        //tant qu'on a pas de nouveau hashtag
        modele+=ch;
        pos++;
        ch = html[pos];
      }

      pos++;

      //On cherche la propriété à afficher
      ch = html[pos];
      var variable: string="";
      while(ch!=="#"){
        //tant qu'on a pas de nouveau hashtag
        variable+=ch;
        pos++;
        ch = html[pos];
      }

      posFinVariable=pos+1; //on stocke la dernière position

      //console.log("variable trouvée : "+variable);

      var donneeRecuperee: any;

      if(modele=="heros"){
        this.store.select(state => state.donneesHeros.reponses[variable]).subscribe(
          (value) =>{
            donneeRecuperee=value;
          }
        );
      }else if(modele="relais"){
        this.store.select(state => state.relais[variable]).subscribe(
          (value) =>{
            donneeRecuperee=value;
          }
        );
      }

      //console.log("donnée trouvée: "+donneeRecuperee);

      //split la chaîne en deux
      var str1 = html.substring(0,posDeb)

      var str2 = html.substring(posFinVariable, html.length);
      str2 = this.evaluateHtml(str2); //Appel récursif pour tester si d'autres apparitions

      //remplace le ## par le prénom

      resultat = str1 + " "+ donneeRecuperee + str2;

    }

    //console.log(resultat);

    return resultat;
  }

  toggleModalRetour() {
    this.isModalActiveRetour = !this.isModalActiveRetour;
  }
  toggleModalSortie() {
    this.isModalActiveSortie = !this.isModalActiveSortie;
  }

  retourCartePointRelais()
  {
    this.boutonRetourSubscription.unsubscribe();
    this.router.navigate([''])
  }

  fermetureOnglet(){
    //close l'onglet
  }

  preventCloseTab(){
    //subscribe ou eventlistener pour la fermture d'onglet
  }

  preventBackButton() {

    history.pushState(null, null, location.href);
    this.boutonRetourSubscription = this.locationStrategy.subscribe(() => {
        history.pushState(null, null, location.href);
        // questionprecedente est appellee jusqu'a revenir sur la premiere page de formulaire
        if(this.navigationService.getPageSuivante(this.id) > 2 && this.modeAffichage!='fin'&& this.nomPage!='ecran-fin'){
          this.questionPrecedente();
        }
        else{
          this.toggleModalRetour()
        }
      })

  }

  questionPrecedente(){
    //console.log("question précédente");
    let idCalc= this.navigationService.getPagePrecedente(this.id);
    //console.log("id calculé : "+idCalc);
    this.store.dispatch(new ChangerPage(idCalc, this.questions));
  }

  majVerifChamps(){
    //Vérifie le remplissage des champs actuels
    //si ok, passe verifChamp à true
    //sinon, false
    //console.log("verifchamp");

    for(let i = 0; i < this.questions.length; i++){
      //console.log("majVerifChamps pour la réponse : "+this.reponse[i]);
      if( (this.reponse[i] !== undefined)&&(this.reponse[i] !== '')){
        //console.log("passe le test");
        let min = 0;
        let max=0;
        let required=false;
        if(this.questions[i]["type-reponse"]===6){
          min = this.questions[i]["min"];
          if(this.questions[i]["max"]!==undefined){
            max = this.questions[i]["max"];
          }
        }
        if(this.questions[i]["type-reponse"]===5){
          if(this.questions[i]["required"]===true){
            required=true;
          }
        }
        this.verifChamp[i]=this.verifChampsService.verifChamp(this.questions[i]["type-reponse"], this.reponse[i], min, max, required);
        //console.log("Vérification du champ "+this.questions[i]["nom"]+" : "+this.verifChamp[i]);
      }else{
        //console.log("ne passe pas le test");
        this.verifChamp[i]=0;
        //console.log("Vérification du champ non trouvée "+this.questions[i]["nom"]+" : "+this.verifChamp[i]);
      }
    }
  }

  isDisabled(): boolean{
    if(this.questions.length<1){
      //pas de question ici, on laisse ouvert
      return false;
    }
    for (let i = 0; i< this.reponse.length; i++){
      if(this.verifChamp[i]<2){
        return true;
      }
    }
    return false;
  }

  onChange(event: any, id:number=0, nom:string=''){
    //Vérification des inputs
    //console.log(this.verifChamp);
    //console.log("Onchange event : "+event+" pour l'id : "+id);

    let value=event;

    if(this.questions[id]['type-reponse']===6){
      value=this.verifChampsService.arrondi(value,this.questions[id]['step']);
    }else if(this.questions[id]['type-reponse']===2){ //Textarea enlever les line breaks
      value = value.replace(/(\r\n|\n|\r)/gm,"").replace(/"/g,"'");
    }else if(this.questions[id]['type-reponse']===7){ //Telephone : forcer le 0
      if(value!=0){
        value="0"+value;
      }
    }else if(this.modeAffichage==='paiement'){

      
    }
    //console.log("Réponse : "+value);
    this.store.dispatch(new SetReponse(this.questions[id]['nom'],value)).subscribe(
      () => this.majVerifChamps()
    );

  }

  onSubmit(form: NgForm){
    //On route à la suivante
    let choix = -1;
    //console.log("onSubmit");
    if(this.questions[0]!=undefined){
      //est-ce qu'on a une question ?
      if(this.questions[0]['type-reponse']===4){
        if(this.pontLogique!==undefined){
          //console.log("pont-logique trouvé");
          choix=this.reponse[0];
        }else{
          //console.log("pas de pont logique trouvé");
        }
      }
    }

    let typeForm = this.store.selectSnapshot(state => state.formulaire.type);

    //console.log("submit mode "+this.modeAffichage);

    if(this.modeAffichage==="paiement"){
      //console.log("submit paiement");
      // verif si cgu coché
      if(this.questions[0]["nom"]==="cgu" && this.verifChamp[0]==2 && this.spinner==false){

        //nsole.log("submit paiement if");
        this.spinner=true;

      }
      else{
        //console.log("don't spamm buddy")
      }
    }

    else if(typeForm==="IDENTIFICATION-ESPACE"){

      let email = this.store.selectSnapshot(state => state.donneesHeros.reponses.mail);

      this.spinner=true;
      this.envoiDonneesService.rechercheEmail(email, typeForm).subscribe(
        (result) => {
          this.store.dispatch(new SetReponse('prenom', result));
        }
      );

    }else{
      let idCalc = this.navigationService.getPageSuivante(this.id, choix);
      this.store.dispatch(new ChangerPage(idCalc, this.questions));
    }



  }

  getUrlImage(nom: string): string{
    var urlBase: string = 'assets/img/questionnaire/';
    return urlBase+nom;
  }

  public nombrePages(){
    return this.navigationService.nombrePages();
  }

  incrementer(id: number, min: number, step: number){
    //console.log("increment de "+step)
    if(this.reponse[id]<min){
      this.reponse[id]=min;
    }else{
      this.reponse[id]+=step;
    }
    this.onChange(this.reponse[id],id);
  }
  decrementer(id: number, min: number, step: number){
    //console.log("decrement de : "+step);
    if((this.reponse[id]-step)<=min){
      this.reponse[id]=min;
    }else{
      this.reponse[id]-=step;
    }
    this.onChange(this.reponse[id],id);
  }

  public editerRecap(): any[]{
    return this.navigationService.editerRecap();
  }

  public paymentId(){
    if(this.modeAffichage==="paiement"){
      return "form"; //payment-form pour Stripe
    }else{
      return "formulaire-form";
    }
  }

  public createPaiement(alias:boolean,abonnement:boolean){

    //soge
    let mail: string = this.store.selectSnapshot(state => state.donneesHeros.reponses.mail);
    let montantInitial: number = this.store.selectSnapshot(state => state.paiement.montant);
    montantInitial *= 100;
    let montantAbo = 0;
    let idCommande = this.store.selectSnapshot(state => state.donneesHeros.id);
    let nom = this.store.selectSnapshot(state => state.donneesHeros.reponses.prenom) + " " + this.store.selectSnapshot(state => state.donneesHeros.reponses.nom);
    if(alias){
      //console.log(this.store.selectSnapshot(state => state.donneesHeros.reponses["montant-cotisation"]));
      //console.log(this.store.selectSnapshot(state => state.donneesHeros.reponses.montant-cotisation));
      montantAbo = this.store.selectSnapshot(state => state.donneesHeros.reponses["montant-cotisation"]);
      //console.log(montantAbo);
      montantAbo= montantAbo*100;
    }

    this.paiementService.creerForm(idCommande,mail, nom, alias, abonnement ,montantInitial, montantAbo).subscribe(
      data => {
        const formToken: String = data.substr(1,data.length -2 );

        KRGlue.loadLibrary(this.paiementService.endpoint, this.paiementService.publicKey)/* Load the remote library */
           .then(({KR, result}) => {
              try{
                KR.setFormConfig({
                  // set the minimal configuration
                  formToken: formToken,
                  "kr-language": "fr-FR" // to update initialization parameter
                })
                .then(({ KR }) =>
                  KR.addForm("#myPaymentForm"), //ajoute et lie le form au html
                )
                .then(({ KR, result }) =>
                  KR.showForm(result.formId) // l'affiche
                )
                .catch(
                  ({KR, result}) => {
                    console.log(result); // probleme formulaire
                  }
                );

                KR.onFormReady(() => {
                });
                KR.onError( (event,KR) => {
                  if(event.code == 100 ){
                  event.errorMessage = "Veuillez recharger la page"
                  }
                });

                KR.onSubmit((result)=>{
                  if (result.clientAnswer.orderStatus === "PAID") {
                    KR.removeForms();

                    // Si besoin d'un abonnement
                    if(abonnement == true){
                      let token = result.clientAnswer.transactions[0].paymentMethodToken;
                      this.paiementService.creerAbo(idCommande,mail,token, montantAbo).subscribe(
                        data => {

                          //ok abonnement reçu

                          //question suivante
                          this.store.dispatch(new ChangerStatut("succes"));


                        },
                        error => {
                          console.log("erreur init paiement");
                        }
                      );

                    }else{
                      // question suivante
                      this.store.dispatch(new ChangerStatut("succes"));

                    }
                  } else {
                    // erreur de paiement
                    console.log(result.clientAnswer.orderStatus);
                  }
                });
              }catch(error){
                console.log(error); //probleme de KR
              }
            })
            .catch(
              ({KR, result}) => {
                console.log(result); // probleme load librairie
              }
            )
      },
      error => {
        console.log("erreur init paiement");
      }
    );

  }

  public formPaiementDisplay(bool?: boolean){
    if(bool != undefined && !bool){
      if((this.modeAffichage==="paiement") && (this.verifChamp[0]==2)){
        return "none";
      }else{
        return "block";
      }

    }
    if((this.modeAffichage==="paiement") && (this.verifChamp[0]==2)){
      return "block";
    }else{
      return "none";
    }


  }

  public paiementDisplay(){
    if(this.modeAffichage==="paiement"){
      return "block";
    }else{
      return "none";
    }
  }
  public paiementClassDisplay(){
    if(this.modeAffichage==="paiement"){
      return true;
    }else{
      return false;
    }
  }

  public paiementRecurrentDisplay(){
    let typeRelais = this.store.selectSnapshot(state => state.relais.type);
    if((typeRelais == "SEAU-MOIS")||(typeRelais == "MOIS")||(typeRelais == "MOIS-CONCIERGERIE")||(typeRelais == "BAC-ITINERANT")){
      return "block";
    }else{
      return "none";
    }
  }

  public modePaiement():boolean{
    var modePaiement = this.store.selectSnapshot(state => state.donneesHeros.reponses["mode-paiement"]);
    if(modePaiement==="carte"){
      return true;
    }else{
      return false;
    }
  }
  public changerModePaiement(){
    this.store.dispatch(new SetReponse("mode-paiement","autre"));
    let idCalc = this.navigationService.getPageSuivante(this.id, -1);
    this.store.dispatch(new ChangerPage(idCalc, this.questions));
  }

  public autrePaiementDisplay(){
    let typeRelais = this.store.selectSnapshot(state => state.relais.type);
    if((typeRelais!="LIVRAISON")){
      return "inline";
    }else{
      return "none";
    }
  }

  public paiementRecurrentSeauxDisplay(){
    let typeRelais = this.store.selectSnapshot(state => state.relais.type);
    if((typeRelais=="LIVRAISON")){
      return "block";
    }else{
      return "none";
    }
  }

public paiementNullDisplay(){
  //console.log("paiement null display");

  var amount = this.store.selectSnapshot(state => state.paiement.montant);
  var typeRelais = this.store.selectSnapshot(state => state.relais.type);

  //console.log("typeRelais : "+typeRelais+" amount "+amount+" mode affichage "+this.modeAffichage);

  if(typeRelais=="MOIS-CONCIERGERIE" && amount==0 && this.modeAffichage==="paiement"){
    //console.log("true");
    return true;
  }else {
    //console.log("false");
    return false;
  }
}
public passerEtapePaiement(){
  //console.log("coucou ");
  this.store.dispatch(new ChangerStatut("succes"));
}


}


