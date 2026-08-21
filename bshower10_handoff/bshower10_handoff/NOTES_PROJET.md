# B-Shower 10 — ASM — État du projet

## Contexte
Projet pour l'agence événementielle ASM (Assets & Services Management, Lomé, Togo).
Reprend l'architecture déjà validée sur le projet TalentsPool (autre projet ASM) :
Google Sheet comme base de données, Google Drive pour le stockage des CV, Google
Apps Script comme backend, HTML/CSS/JS autonome comme frontend.

## Fichiers du projet
- `bshower10_inscription.html` — Formulaire public en 5 étapes (identité → parcours
  → domaines d'intérêt → CV → récap/envoi). Le candidat peut soit uploader un CV
  existant (converti en base64, envoyé au backend), soit en générer un directement
  dans le formulaire (formations/expériences répétables, impression PDF via fenêtre
  dédiée).
- `bshower10_dashboard_annuaire.html` — Espace de gestion interne, fusionné en un
  seul fichier avec navigation par onglets (une seule requête réseau au chargement) :
  - Onglet **Dashboard** : KPIs, graphiques Chart.js (timeline, statut, niveau,
    disponibilité, type de CV, domaines les plus demandés), derniers inscrits.
  - Onglet **Talent Pool** (anciennement nommé "Annuaire" côté UI, renommé sur
    demande — les ids/fonctions internes gardent le nom `annuaire` en interne,
    seul le texte affiché a changé) : grille de fiches candidats, recherche +
    filtres (domaine/niveau/disponibilité), fiche détaillée en modal avec édition
    inline, suppression à double confirmation, export PDF (A4 paysage multi-pages
    via fenêtre dédiée + window.print()), export image (html2canvas, découpage en
    sections côte à côte).
- `Code.gs` — Backend Apps Script à coller dans un Google Sheet
  (Extensions > Apps Script). `doGet` = lecture de toutes les inscriptions,
  `doPost` = create/update/delete selon `action`. `SpreadsheetApp.flush()`
  systématique après chaque écriture (leçon apprise sur TalentsPool).
- `asm-logo.png` — Logo ASM, déjà intégré en base64 inline dans les deux fichiers
  HTML (plus besoin de fichier séparé pour l'affichage du logo).
- `bshower10-visuel.png` — Visuel officiel de l'affiche B-Shower 10 (référence
  couleurs : navy #0E1E44, or #B8934A, vert #4F8B3B, bleu ciel #2E6DA4).

## À faire pour la mise en production
1. Créer un Google Sheet vide → Extensions > Apps Script → coller `Code.gs`.
2. Déployer en application Web (Exécuter en tant que : Moi ; Accès : Tous).
3. Copier l'URL `/exec` obtenue.
4. Remplacer `REMPLACER_PAR_URL_APPS_SCRIPT` dans les DEUX fichiers HTML
   (chercher cette chaîne exacte dans chaque fichier).
5. Héberger les deux HTML (ex. Tiiny.host — seule option sans friction identifiée
   sur le projet TalentsPool ; Netlify/Cloudflare Pages/Vercel/GitHub Pages ont
   chacun des contraintes bloquantes constatées précédemment).

## Bugs déjà corrigés
- Les cases à cocher (domaines d'intérêt étape 3, RGPD étape 5) étaient dans des
  `<label>`, provoquant un double déclenchement du clic (coche puis décoche
  immédiatement). Corrigé avec `e.preventDefault()` sur le clic du label.

## Décisions en attente / prochaines étapes possibles
- Tester le formulaire de bout en bout avec des données factices avant diffusion.
- Éventuellement ajouter d'autres champs de tri/filtre au Talent Pool si besoin.
- Vérifier le rendu mobile réel (responsive déjà prévu en CSS, non testé sur device).
