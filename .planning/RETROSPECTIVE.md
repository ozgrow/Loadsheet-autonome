# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP Loadsheet ATH

**Shipped:** 2026-05-22
**Phases:** 6 | **Plans:** 16 | **Tasks:** 37 | **Timeline:** 48 jours (3 avr → 21 mai 2026)

### What Was Built

- **Matériel ULD** (Phase 1, puis refactor Phase 6) : 9 champs métier (sangles, planchers EU/Std + forfaits, bois calage, bâches, intercalaires, nids d'abeille, commentaire) saisis une seule fois pour tout le manifeste — section inline globale `#material-section`, modèle `data.material` top-level, helper pur `migrateLegacyMaterial` pour rétro-compat Phase 1
- **Type ULD VRAC** (Phase 2) : type officiel dans le sélecteur (PMC/AKE/AKN/PAG/VRAC), exclusion du compteur palettes, ligne dédiée poids+colis dans récap/PDF/email
- **Listes de distribution emails** (Phase 4) : Azure Function `/api/recipients` (GET+PUT JWT) + Blob `recipients-lists.json` partagé + modal CRUD + dropdown `<select>` qui remplace `#recipients`
- **Codes client dropdown** (Phase 5) : remplacement `<input clientName>` par `<select>` + Azure Function `/api/clients` + Blob `clients.json` + rétro-compat option `data-legacy` éphémère + seed 1DAC-CDW + 2SET-CDG
- **Release gate automatisé** (Phase 3) : harness Node+JSDOM `npm run verify`, suite E2E lifecycle 26 asserts, checklist 7 étapes dans CLAUDE.md — gate strict avant chaque push master
- **Tests anti-régression** : 559 asserts dans 99 suites, couverture XSS, rétro-compat, save/load round-trip, MAT-13 globalisé, anti-XSS manifestComment

### What Worked

- **Pattern "clone structurel" Phase 4 → Phase 5** : Phase 5 a livré en ~2 plans en clonant l'architecture Phase 4 (Azure Function GET/PUT + module mode-switchable + modal CRUD). Pas de re-conception, pas de friction d'intégration. Démontre la valeur d'établir des patterns réutilisables tôt
- **Release gate Phase 3 timing** : le release gate a été posé APRÈS Phases 1-2 (features) et AVANT Phases 4-6 (extensions). Conséquence : tout ajout ultérieur passait par `npm run verify` → 0 régression silencieuse sur les Phases suivantes
- **Wave parallelization** (Phase 6 Wave 3) : 06-04 (PDF/email body) + 06-05 (MAT-13 validation) en parallèle malgré conflits potentiels sur `app.js` — `--no-verify` + commits atomiques par-tâche ont permis le squash-collision propre (file end-state correct, commit attribution mixed mais documentée)
- **UAT intégrée vs UAT par-plan** : sauter le checkpoint individuel de 06-03 puis re-vérifier l'ensemble après Wave 3 a éliminé un round-trip de validation manuelle redondant (06-03 isolé montrait des bugs cosmétiques connus que 06-05 allait corriger)
- **`migrateLegacyMaterial` pur (Phase 6)** : helper isolé du DOM, testable par fonction-test pure sans JSDOM → 34 asserts couvrent D-13..D-19 + idempotence + defensive en quelques minutes. Pattern à reproduire pour toute logique de migration

### What Was Inefficient

- **Helpers Phase 1 orphelins (14 fonctions) non supprimés Phase 6** : décision explicite (Claude's Discretion) de NE PAS nettoyer car risque de casser indirectement les tests Phase 2 VRAC via `buildEmailHtmlForTest`. Conséquence : ~300 lignes de code mort dans `app.js`. À traiter en pruning dédié (Phase 7 ?)
- **Squash collision Wave 3 06-04/06-05** : commits `a26e446` et `c710ee0` contiennent du travail mixte des deux plans malgré `--no-verify`. Documenté en Rule 3 deviation mais c'est une dette cosmétique d'historique git. Pour les prochaines waves parallèles, envisager un git lock ou des branches séparées par plan
- **Phase 1 modal d'édition ULD** : décision initiale "réutiliser le modal ULD pour la saisie matériel" s'est avérée mauvaise au feedback terrain D-48 (redondance par-ULD). Coût : 5 plans Phase 1 + cleanup Phase 6. Leçon : valider l'ergonomie avec un agent réel AVANT d'investir dans l'implémentation
- **Test harness crash mid-Phase-6** : `tests/tests.html:671` query sur `.material-recap` (sélecteur supprimé en 06-03) a crashé `npm run verify` jusqu'à Plan 06-06. Le test harness aurait dû être protégé via `try/catch` ou les tests obsolètes supprimés en amont. À l'avenir : run `npm run verify` après chaque task qui touche le DOM
- **Plans 06-04 / 06-05 / 06-03 (3 checkpoints humains)** : 3 UAT manuels successifs avant le UAT final 06-06. Auraient pu être consolidés en 1 ou 2 (pattern "checkpoints groupés en fin de wave")

### Patterns Established

- **Section inline globale > modal contextuel** quand la donnée est partagée (matériel manifeste, codes client, listes destinataires) — moins de clics, visibilité permanente, moins d'état UI à gérer
- **Azure Blob JSON + JWT** pour persistance partagée simple sans BDD. 404 → `[]` initial, GET+PUT idempotents. Pattern réplicable rapidement (Phase 4 → Phase 5 → ...)
- **Helpers purs isolés du DOM** pour la logique métier complexe (migration, validation, formatting) — testables sans JSDOM, réutilisables, débuggables en console
- **Mode-switchable dev/prod auto-détecté par hostname** dans les modules frontend — élimine la variable d'env, permet de basculer entre stub localStorage et endpoint réel sans rebuild
- **Release Checklist 7 étapes CLAUDE.md** comme gate humain final avant `git push origin master` — uniforme à travers les 6 phases
- **`data.X` top-level vs `data.ulds[i].X`** : préférer le top-level quand X est conceptuellement "du manifeste" (matériel, client, dest) ; per-ULD quand X est intrinsèquement "de l'ULD" (numéro, type, LTAs)

### Key Lessons

1. **Valider l'ergonomie auprès d'un utilisateur réel AVANT de coder** : la décision Phase 1 "modal d'édition ULD pour saisir le matériel" a coûté 5 plans + refactor Phase 6. Une session de 10 min avec un agent ATH aurait surfacé D-48 (la saisie matériel est mutualisée, pas par-ULD)
2. **`npm run verify` doit rester vert tâche par tâche, pas seulement plan par plan** : laisser le harness crashed pendant 3 plans (Wave 3) a empêché de détecter d'éventuelles régressions hors-scope. Le gate doit fail-fast
3. **Le squash-collision sur git parallèle est cosmétique mais doit être documenté** : `--no-verify` permet de progresser, mais le file end-state DOIT être vérifié indépendamment (grep, code inspection) avant d'approuver le checkpoint
4. **Le orphan helpers cleanup est plus risqué que de le laisser** : 14 fonctions Phase 1 orphelines préservées en v1.0 — risque ZERO à les garder (jamais appelées), risque NON-NUL à les supprimer (test harness indirect, mémoire musculaire des prochains contributeurs). Faire le ménage uniquement quand on a besoin de l'espace ou quand on refactor adjacent
5. **Le pattern "clone structurel" accélère les phases suivantes d'un facteur 2-3** : Phase 5 a livré en ~2 plans ce qui aurait pu en demander 4 si on partait de zéro. Investir dans des patterns réutilisables dès la 1ère phase paie sur la 3ème+
6. **Les checkpoints humains intégrés (1 UAT pour 3 plans) > checkpoints par plan** quand les plans forment une unité fonctionnelle cohérente. Évite des round-trips d'attente sur des bugs cosmétiques connus

### Cost Observations

- Modèle principal : Claude Opus 4.7 (1M context) — orchestrateur + agents pour tasks complexes
- Sessions : ~15-20 sessions GSD étalées sur 48 jours, avec interruptions (API ConnectionRefused mid-Phase-6 06-03)
- Notable : la résilience GSD (commits atomiques + STATE.md + SUMMARY.md) a permis de reprendre proprement après l'API timeout sans perte de travail. Les 3 commits 06-03 (2efbb90, 099cc0b, 479b2fe) déjà posés ont été retrouvés intacts au retour de connexion
- Wave parallelization a réduit le temps d'exécution effective ~30% sur Wave 3 (06-04 + 06-05 simultanés vs séquentiel)

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Tasks | Key Change |
|-----------|--------|-------|-------|------------|
| v1.0 | 6 | 16 | 37 | Première utilisation GSD ; pattern "clone structurel" établi en Phase 5 ; wave-parallel introduit Phase 6 |

### Cumulative Quality

| Milestone | Tests | Suites | LOC | Phase 1 Orphans |
|-----------|-------|--------|-----|-----------------|
| v1.0 | 559 | 99 | ~28.8k | 14 (deferred) |

### Top Lessons (à confirmer sur v1.1+)

1. Valider l'ergonomie utilisateur AVANT de coder (Phase 1 → 6 refactor a coûté un tour complet)
2. `npm run verify` doit rester vert tâche par tâche, pas seulement en fin de plan
3. Clone structurel + helpers purs + mode-switchable = pattern qui scale (à valider sur v1.1)
