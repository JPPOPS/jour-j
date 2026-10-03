# Jour J

Application gratuite pour réviser les questions de l'examen pratique du permis B
(vérifications, sécurité routière, premiers secours), 5 minutes par jour.

- 100 % hors ligne après la première visite, aucune donnée collectée.
- Questions : `data/questions.json` (banque officielle DSR, version du 1er janvier 2023).
- Pour neutraliser une question : passer `neutralise_v`, `neutralise_sr` ou `neutralise_ps` à `true`
  pour la fiche concernée, puis changer `VERSION` dans `sw.js`.
- Avant publication : compléter `mentions-legales.html` (nom et e-mail).
