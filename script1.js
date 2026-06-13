//debut de partie
let plateau = [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]; 
let scoreJ1 = 0;
let scoreJ2 = 0;
let tourActif = 1;         
let statutPartie = "En cours";
let animationEnCours = false; 


//Affiche le panneau rouge d'alerte ou une boîte de secours si le HTML bloque
 
function notifierFauteDeJeu(message) {
    const panneau = document.getElementById("panneau-notification");
    const texteErreur = document.getElementById("texte-erreur");
    
    // 1. On tente l'affichage dans ton panneau HTML
    if (panneau && texteErreur) {
        texteErreur.textContent = message;
        panneau.classList.remove("hidden");
        
        // force l'affichage si .hidden a un probleme
        panneau.style.display = "block"; 
        
        setTimeout(function() {
            panneau.classList.add("hidden");
            panneau.style.display = "none";
        }, 5000);
    } 
    // 2.si panneau pas trouve on force l'alert
    else {
        alert(message);
    }
}
 // Calcule l'etat graphique du DOM pour refleter les données de la mémoire

function actualiserInterfaceGraphique() {
    const cases = document.querySelectorAll(".case-trou");
    
    cases.forEach(function(elementCase) {
        
       let idx = parseInt(elementCase.dataset.index, 10);
        
       
        const compteur = elementCase.querySelector(".compteur-graines");
        if (compteur) {
            compteur.textContent = plateau[idx];
        }

       
        elementCase.classList.remove("case-active", "case-verrouillee");

        // Coloration des case du jouer actif
        if (statutPartie === "En cours" && !animationEnCours) {
            if (tourActif === 1 && idx >= 0 && idx <= 6 && plateau[idx] > 0) {
                elementCase.classList.add("case-active");
            } else if (tourActif === 2 && idx >= 7 && idx <= 13 && plateau[idx] > 0) {
                elementCase.classList.add("case-active");
            } else {
                elementCase.classList.add("case-verrouillee");
            }
        } else {
            elementCase.classList.add("case-verrouillee");
        }
    });

    //  scores cumules 
    document.getElementById("score-j1").textContent = scoreJ1;
    document.getElementById("score-j2").textContent = scoreJ2;

    // Message d'ambiance du tour central
    const affichageTour = document.getElementById("affichage-central-tour");
    if (statutPartie === "Termine") {
        let gagnant = (scoreJ1 >= 40) ? "Joueur 1 (Sud)" : "Joueur 2 (Nord)";
        affichageTour.textContent = "FIN ! Victoire du " + gagnant;
        affichageTour.style.background = "#2a9d8f"; 
    } else {
        if (tourActif === 1) {
            affichageTour.textContent = "AU TOUR DU JOUEUR 1 (SUD)";
            affichageTour.style.background = "#2e7d32";
        } else {
            affichageTour.textContent = "AU TOUR DU JOUEUR 2 (NORD)";
            affichageTour.style.background = "#b71c1c";
        }
    }
}

// fonction qui cree un visuel pour les deplacement des graines
function delaiEgrenage(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// EXÉCUTION MAJEURE DE LA LOGIQUE D'UN COUP JOUÉ LOCALEMENT
 
async function traiterCoupLocal(indexCase) {
    if (statutPartie === "Termine" || animationEnCours) return;

    // 1 controle des cote
    if (tourActif === 1 && (indexCase < 0 || indexCase > 6)) {
        notifierFauteDeJeu("Faute : Vous etes le Joueur 1, jouez dans votre camp (Bas) !");
        return;
    }
    if (tourActif === 2 && (indexCase < 7 || indexCase > 13)) {
        notifierFauteDeJeu("Faute : Vous etes le Joueur 2, jouez dans votre camp (Haut) !");
        return;
    }

    let graines = plateau[indexCase];
    if (graines === 0) {
        notifierFauteDeJeu("Impossible : Cette case ne contient aucune graine !");
        return;
    }

    // 2 regle de solidarite
    let campAdverseDebut = (tourActif === 1) ? 7 : 0;
    let campAdverseFin   = (tourActif === 1) ? 13 : 6;
    let adversaireAffame = true;

    for (let i = campAdverseDebut; i <= campAdverseFin; i++) {
        if (plateau[i] > 0) {
            adversaireAffame = false;
            break;
        }
    }

    if (adversaireAffame) {
        let simulationIndex = indexCase;
        let simulationGraines = graines;
        let coupNourrissant = false;

        while (simulationGraines > 0) {
            simulationIndex = (simulationIndex - 1 + 14) % 14;
            if (simulationIndex === indexCase) continue; 
            if (simulationIndex >= campAdverseDebut && simulationIndex <= campAdverseFin) {
                coupNourrissant = true;
            }
            simulationGraines--;
        }

        if (!coupNourrissant) {
            let unCoupNourricierExiste = false;
            let monCampDebut = (tourActif === 1) ? 0 : 7;
            let monCampFin   = (tourActif === 1) ? 6 : 13;

            for (let c = monCampDebut; c <= monCampFin; c++) {
                let gMonCamp = plateau[c];
                if (gMonCamp > 0) {
                    let idxS = c;
                    while (gMonCamp > 0) {
                        idxS = (idxS - 1 + 14) % 14;
                        if (idxS === c) continue;
                        if (idxS >= campAdverseDebut && idxS <= campAdverseFin) {
                            unCoupNourricierExiste = true;
                            break;
                        }
                        gMonCamp--;
                    }
                }
            }

            if (unCoupNourricierExiste) {
                notifierFauteDeJeu("Regle de Solidarite : Vous devez imperativement nourrir votre adversaire affame !");
                return;
            }
        }
    }

    // phase cinématique de déplacement
    animationEnCours = true;
    plateau[indexCase] = 0;
    actualiserInterfaceGraphique();

    let currentIndex = indexCase;

    // mouvement dans le sens horaire
    while (graines > 0) {
        currentIndex = (currentIndex- 1+14) % 14;
        
        if (currentIndex === indexCase) continue;

        plateau[currentIndex]++;
        graines--;
        actualiserInterfaceGraphique();
        await delaiEgrenage(500); 
    }

    // condition de captures des graines
    let estDansLeCampAdverse = (tourActif === 1 && currentIndex >= 7 && currentIndex <= 13) ||
                               (tourActif === 2 && currentIndex >= 0 && currentIndex <= 6);

    if (estDansLeCampAdverse) {
        let gainPotentiel = 0;
        let casesA_Vider = [];
        let indexRafle = currentIndex;
        let rafleValide = estDansLeCampAdverse;

        while (rafleValide && plateau[indexRafle] >= 2 && plateau[indexRafle] <= 4) {
            if (tourActif === 1 && indexRafle === 7) break;
            if (tourActif === 2 && indexRafle === 6) break;

            gainPotentiel += plateau[indexRafle];
            casesA_Vider.push(indexRafle);

            indexRafle = (indexRafle + 1) % 14;
            rafleValide = (tourActif === 1 && indexRafle >= 7 && indexRafle <= 13) ||
                          (tourActif === 2 && indexRafle >= 0 && indexRafle <= 6);
        }

        let totalGrainesAdversaire = 0;
        for (let j = campAdverseDebut; j <= campAdverseFin; j++) {
            totalGrainesAdversaire += plateau[j];
        }

        if (gainPotentiel > 0 && gainPotentiel === totalGrainesAdversaire) {
            notifierFauteDeJeu("Interdit applique : Rafle annule ! Il est interdit de piller la totalite des graines adverses.");
            casesA_Vider = []; 
        }

        if (casesA_Vider.length > 0) {
            for (let idxPrise of casesA_Vider) {
                if (tourActif === 1) scoreJ1 += plateau[idxPrise];
                else scoreJ2 += plateau[idxPrise];
                
                plateau[idxPrise] = 0;
                actualiserInterfaceGraphique();
                await delaiEgrenage(150);
            }
        }
    }

    // condition de fin de partie
    if (scoreJ1 >= 40 || scoreJ2 >= 40) {
        statutPartie = "Terminé";
    }

    tourActif = (tourActif ===1) ? 2 : 1;
    animationEnCours = false;
    actualiserInterfaceGraphique();
}
//lancement automatique
document.addEventListener("DOMContentLoaded", function() {
    // Premier rendu graphique
    actualiserInterfaceGraphique();

    // Remplacement des écouteurs de clics jQuery par addEventListener
    const cases = document.querySelectorAll(".case-trou");
    cases.forEach(function(elementCase) {
        elementCase.addEventListener("click", function() {
            let indexSelectionne = parseInt(elementCase.dataset.index, 10);
            traiterCoupLocal(indexSelectionne);
        });
    });

 //boutton reniatialiser
    const btnRecommencer = document.getElementById("btn-recommencer");
    if (btnRecommencer) {
        btnRecommencer.addEventListener("click", function() {
            if (confirm("Voulez-vous réinitialiser le tablier pour recommencer une partie locale ?")) {
                plateau = [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5];
                scoreJ1 = 0;
                scoreJ2 = 0;
                tourActif = 1;
                statutPartie = "En cours";
                animationEnCours = false;
                actualiserInterfaceGraphique();
            }
        });
    }
});
