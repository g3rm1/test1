# Suivi CSM — clients à contacter

Une page qui lit le rapport Salesforce et dit, pour un mois donné, quels clients contacter,
**par ordre de revenu M-1 décroissant**.
Rien à installer : ouvre `index.html` dans ton navigateur (double-clic).
Le fichier importé reste dans ton navigateur, rien n'est envoyé ni publié
(ce dossier n'est pas mis en ligne avec le site).

## Utilisation

1. Dans Salesforce, ouvre le rapport → **Exporter** → **Détails uniquement** → format **CSV** (ou `.xlsx` → « Enregistrer sous » CSV).
2. Ouvre `index.html`, clique **Importer le rapport** (ou glisse le fichier dans la zone).
3. Choisis le **mois** (mois en cours par défaut) et, si besoin, ton nom dans **CSM Owner**.
4. Coche **✓** quand un client est contacté (mémorisé dans ce navigateur).
5. **Exporter la liste (.csv)** donne la liste du mois, lisible directement dans Excel.

Le dernier rapport importé est gardé : réimporte simplement le nouveau rapport chaque mois.

## Colonnes attendues

`STP Program`, `CLI COUNTRY`, `Nom du compte`, `Propriétaire du compte: Nom complet`,
`CSM Owner: Nom complet`, `Program Start Date`, `Program End Date`,
`ELM CURRENT MONTH REVENUE`, `ELT TOTAL REV M-1`, `Dernière activité`.

Obligatoires : programme, compte, dates de début et de fin, rev M-1.
Séparateur `;`, `,` ou tabulation ; dates `JJ/MM/AAAA` ou `AAAA-MM-JJ` ; montants `1 234,56 €` ou `1,234.56`.

## Règles de follow-up

| Programme (`STP Program` contient…) | Durée | Contacts |
|---|---|---|
| Early  | 6 mois | 1 follow-up à mi-parcours (milieu entre début et fin) |
| Growth | 1 an   | tous les 3 mois après le début : M+3, M+6, M+9 |
| Nvidia | 1 an   | tous les 3 mois après le début : M+3, M+6, M+9 |

Les comptes avec un programme non reconnu ou des dates illisibles apparaissent dans
l'encart **« à vérifier »** en bas de la page.

Pour ajouter ou changer une règle, modifie `RULES` en haut de `schedule.js`, par exemple :

```js
{ match: "scale", label: "Scale", everyMonths: 2 },
```

`sample.csv` contient des clients fictifs pour essayer la page.
