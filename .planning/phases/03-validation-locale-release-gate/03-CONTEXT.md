# Phase 3 : Validation locale & release gate — Context

**Gathered:** 2026-04-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 est une **phase de process et validation**, pas de code feature. Elle livre :
1. Un fix ciblé du bug pré-existant `Session sans expiry => invalide` dans `auth.js` (1 ligne — `Boolean()` wrap), restaurant 491/491 tests OK.
2. Une nouvelle suite de tests E2E intégrée `E2E - manifest complet lifecycle` qui simule le flow utilisateur complet (création → save → reload → generate PDF → round-trip round-trip) en un seul test.
3. Un script `npm run verify` dans `package.json` à la racine qui exécute `node tests/run-harness.cjs` — le release gate automatisé.
4. Une section **"Release checklist"** ajoutée à `CLAUDE.md` définissant le processus avant push master (7 étapes : verify, serve, scenario E2E manuel, push, check email prod post-deploy).

**Hors scope :**
- Setup local des Azure Functions (`login`, `send-email`) — testées uniquement en prod après push (D-11).
- Couverture additionnelle au-delà du bug fix + E2E suite (112 suites actuelles suffisent).
- Git pre-push hooks, GitHub Actions CI (trop d'overhead pour ce projet solo).
- Documentation publique du bypass session DevTools (trick interne, pas officialisé).
- Migration forcée des anciens manifestes (la rétro-compat par lecture défensive de Phase 1/2 est déjà en place).
- Refactor ou optimisation de code produit.

</domain>

<decisions>
## Implementation Decisions

### Fix du bug pré-existant `Session sans expiry => invalide`
- **D-01:** Appliquer le fix suggéré dans `.planning/phases/01-mat-riel-uld-r-tro-compat/deferred-items.md` : dans `static/js/auth.js` `isSessionValid()`, wrapper l'expression finale avec `!!` (ou `Boolean(...)`) pour forcer un retour booléen strict. Ligne modifiée ≈ ligne 75-76 de auth.js (à localiser précisément par le planner).
- **D-02:** Exemple de modification attendue :
  ```
  // Avant (bug: retourne undefined quand expiry manque) :
  const { expiry } = JSON.parse(session);
  if (expiry <= Date.now()) return false;
  return true; // suppose que expiry existe

  // Après (strict booléen) :
  const data = JSON.parse(session);
  if (!data || typeof data.expiry !== 'number') return false;
  return data.expiry > Date.now();
  ```
  L'approche exacte à la charge du planner, tant que le test `Session sans expiry => invalide` retourne `false` strict.
- **D-03:** Le fix doit être **défensif** : gérer aussi expiry non-numérique (string, NaN, null explicite) sans régresser. Un ou deux tests supplémentaires de durcissement session sont les bienvenus si le planner juge utile (NaN, string, negative).

### Suite de tests E2E intégrée
- **D-04:** Nouvelle suite `E2E - manifest complet lifecycle` dans `tests/tests.html`, à la fin (ou regroupée avec les autres E2E existantes). Pattern : `await (async function() { ... })()` pour gérer le chiffrement localStorage.
- **D-05:** Scénario couvert par la suite :
  1. `newManifest()` — reset
  2. Remplir client/agent/dest/recipients (via setter direct sur inputs DOM)
  3. `addUld()` — ULD 1 type PMC avec matériel complet (sangles, flooring EU forfait, commentaire "Fragile")
  4. `addUld()` — ULD 2 type VRAC avec matériel partiel (sangles, intercalaires, commentaire "<script>alert(1)</script>")
  5. `addRow(0)` — ligne LTA sur ULD 1
  6. Set un LTA + colis + DGR
  7. `saveManifest()` — round-trip localStorage chiffré
  8. `newManifest()` — reset à nouveau (vérifier que le DOM est vide)
  9. `loadManifest(id)` — recharger depuis localStorage
  10. Asserts : client/agent/dest restaurés, 2 ULDs présentes (PMC + VRAC), type de chaque ULD correct, matériel restauré (sangles, forfait EU, commentaire), XSS uldComment échappé (pas de script injecté, window._xss toujours à 0), ULD VRAC a bien masqué planchers dans modal mais conservé data-attributes, récap écran contient "dont Vrac : 1 (...)"
  11. `buildPdf(collectData())` — ne crash pas, `doc.getNumberOfPages() === 3` (page 1 récap + 2 ULDs)
  12. `buildPalettesVracSplit(data.ulds)` — hasVrac=true, palettes.count=1, vrac.count=1
- **D-06:** Cette suite sert aussi de **smoke test anti-régression** pour toute modification future majeure. Elle couvre le happy path complet croisant Phase 1 + Phase 2 + sécurité.

### Release gate automatisé
- **D-07:** Ajouter un `package.json` à la racine du projet (si absent) OU étendre celui existant si présent. Scripts obligatoires :
  ```json
  {
    "scripts": {
      "verify": "node tests/run-harness.cjs",
      "dev": "npx serve . -l 4000"
    }
  }
  ```
  Note : `npx serve` n'a pas besoin de dépendance installée — il résout à la volée. `serve` peut être ajouté en `devDependencies` si l'on veut éviter le téléchargement répété, mais pas bloquant.
- **D-08:** Aucun hook git pre-push, aucune GitHub Action CI ajoutée. Le release gate est **process-driven**, pas enforcement-driven. Raison : projet solo, push direct master assumé, la discipline (checklist CLAUDE.md + `npm run verify`) suffit.

### Release checklist dans CLAUDE.md
- **D-09:** Ajouter une section **"## Release checklist"** dans CLAUDE.md, après "## Tests" et avant "## URL". Liste linéaire 7 étapes :
  1. `npm run verify` — tous les tests passent (exigé : 491/491 OK depuis le fix D-01, sinon investiguer)
  2. `npm run dev` (= `npx serve . -l 4000`) — app démarre sans erreur
  3. Ouvrir http://localhost:4000 et login (ou bypass DevTools pour tests rapides UI)
  4. Scénario E2E manuel :
     - Créer manifeste avec client/agent/dest
     - Ajouter 1 ULD PMC + matériel (sangles + forfait EU + commentaire)
     - Ajouter 1 ULD VRAC + matériel (sangles + intercalaires)
     - Vérifier récap écran : `ULD : 2 dont Vrac : 1 (X colis, Y kg)`
     - Vérifier modal VRAC masque planchers EU/Std
     - Sauvegarder → Nouveau → Recharger : round-trip OK, pas de perte
     - Générer PDF : page 1 a "Detail par categorie" avec "dont Palettes : 1 (...)" + "dont Vrac : 1 (...)", page ULD VRAC a bien "Type : VRAC" dans infoBox
  5. Tester rétro-compat : si un manifeste ancien existe dans localStorage (pre-Phase 1/2), vérifier qu'il se charge sans erreur
  6. `git push origin master` — déclenche le build Azure SWA auto
  7. **Post-deploy** : login en prod + envoyer 1 email de test à soi-même → vérifier que l'email arrive avec le bon rendu (UAT #4 Phase 2)
- **D-10:** Format littéral à respecter dans CLAUDE.md : liste numérotée markdown, sans sous-sections, chaque étape ≤ 3 lignes. Le planner doit coller les étapes verbatim (pas de paraphrase).

### Azure Functions locales — hors scope
- **D-11:** **Pas de setup `azure-functions-core-tools`** documenté dans Phase 3. Les Functions `api/login` et `api/send-email` sont testées **en prod uniquement** via l'étape 7 de la checklist (envoi d'un email réel post-deploy). Raison : overhead de setup (install global, local.settings.json, run parallel) non justifié pour projet solo où le push prod est rapide et réversible.
- **D-12:** Le test frontend bypass la session via le snippet DevTools (non documenté officiellement dans CLAUDE.md, cf. D-13). Ce bypass suffit pour les UAT #1/#2/#3 (sélecteur, mobile, PDF). UAT #4 (email dans Outlook/Gmail) reste un test prod.
- **D-13:** Le bypass session DevTools **n'est PAS documenté** dans CLAUDE.md (décision utilisateur). Il reste un trick interne utilisable quand un dev en a besoin, mais pas officialisé (évite le risque qu'un futur agent l'active en prod par erreur).

### Claude's Discretion
- Emplacement exact du fix dans `auth.js` (la ligne précise à toucher) — à la charge du planner après lecture du code.
- Nom de la constante/fonction helper si refactor de `isSessionValid` nécessaire (la décision D-02 suggère une forme, le planner peut ajuster).
- Ordre exact des asserts dans la suite E2E D-05 — le planner peut regrouper logiquement.
- Wording exact du `CLAUDE.md` "## Release checklist" tant que les 7 étapes sont présentes et respectent l'ordre D-09.
- Si `package.json` existe déjà (potentiellement dans `api/` mais pas à la racine), le planner décide de créer un nouveau fichier racine ou de réutiliser.

### Folded Todos
Aucun todo promu (`todo match-phase 3` retourne 0).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` — Core value ("manifeste → PDF → email sans perte"), v1 requirements complet list
- `.planning/REQUIREMENTS.md` — TEST-01 (couverture tests) + TEST-03 (validation locale avant push) — les 2 derniers requirements v1 pending
- `.planning/ROADMAP.md` §Phase 3 — Objectif + 4 critères de succès

### Décisions héritées des phases précédentes
- `.planning/phases/01-mat-riel-uld-r-tro-compat/01-CONTEXT.md` — Pattern tests async, rétro-compat lecture défensive
- `.planning/phases/01-mat-riel-uld-r-tro-compat/01-VERIFICATION.md` — Leçon : documenter explicitement nuances
- `.planning/phases/01-mat-riel-uld-r-tro-compat/deferred-items.md` — **Le bug exact à fixer** (D-01, D-02) avec suggestion de fix
- `.planning/phases/02-type-uld-vrac/02-CONTEXT.md` — Override D-09 Phase 1 via D-18 (masquage planchers VRAC), nuance D-09 Phase 2 (pas de relabel "Palettes"), format canonique "dont Palettes/Vrac : N (X colis, Y kg)"
- `.planning/phases/02-type-uld-vrac/02-VERIFICATION.md` — Status passed après UAT humain validé

### Conventions projet
- `CLAUDE.md` §Tests — Règle existante : toute nouvelle feature doit avoir des tests. Phase 3 ajoute la **release checklist** à ce fichier.
- `CLAUDE.md` §Sécurité — ne JAMAIS mettre le mot de passe en clair ; fix D-01 à auth.js respecte cette règle (pas de hash changé, pas de mot de passe touché).
- `CLAUDE.md` §Commandes utiles — `npx serve .` déjà documenté (sera aligné avec `npm run dev` en D-07).

### Code source principal
- `static/js/auth.js:70-80` — `isSessionValid()` à modifier (D-01, D-02, D-03)
- `tests/tests.html` — Pattern des suites E2E existantes (`Retro-compatibilite ancien format (pmcs)`, suites `saveManifest/loadManifest round-trip`, etc.)
- `tests/run-harness.cjs` — Runner Node+JSDOM existant, inchangé par cette phase, invoqué par `npm run verify`
- Racine du repo — chercher si `package.json` existe ; si absent, le créer avec D-07 scripts minimum

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`node tests/run-harness.cjs`** (existant) — passe 490/491 (avec le bug D-01 présent). Après fix D-01, doit passer 491/491.
- **Pattern async `await (async function() { ... })()`** dans tests.html — déjà utilisé pour tous les tests crypto/storage. La suite E2E D-04/D-05 suit le même pattern.
- **`newManifest()`, `addUld()`, `addRow()`, `collectData()`, `saveManifest()`, `loadManifest()`, `buildPdf()`, `buildPalettesVracSplit()`** — toutes les fonctions nécessaires à la suite E2E existent déjà après Phase 2.
- **`deriveAndStoreKey()` + `writeSavedManifests()` + `getSavedManifests()`** — existants, utilisés par les suites storage actuelles.

### Established Patterns
- **Ordre des étapes dans un test E2E** : reset DOM via `newManifest()`, manipuler via DOM direct (input.value, select.value), déclencher via fonctions window, vérifier via `collectData()` + `querySelector`.
- **Assertions XSS** : `window._xss` counter + grep `innerHTML.indexOf('<script>') < 0` — pattern Phase 1/2 réutilisable.
- **Scripts npm** : racine du repo n'a pas de package.json (à vérifier), seul `api/package.json` existe pour les Azure Functions.

### Integration Points
- **`static/js/auth.js`** — fix 1 ligne (D-01), potentiellement 2-3 tests durcissement (D-03)
- **`tests/tests.html`** — ajouter 1 suite E2E (D-04, D-05, D-06)
- **`package.json` racine** — créer/étendre avec scripts `verify` + `dev` (D-07)
- **`CLAUDE.md`** — ajouter section `## Release checklist` (D-09, D-10)

</code_context>

<specifics>
## Specific Ideas

- **Le fix D-01 doit faire passer le test `Session sans expiry => invalide` de FAIL à OK** — vérifiable via `grep -c "FAIL" <(node tests/run-harness.cjs 2>&1)` qui doit retourner 0 après le fix.
- **La suite E2E D-04 doit être un test COMPLET, pas 20 asserts triviaux** — une seule fonction async qui orchestre le cycle complet. Si elle passe, confiance élevée sur le happy path. Si elle fail, symptôme clair d'une régression.
- **Le XSS payload dans l'E2E** : utiliser `<script>alert(1)</script>` comme uldComment → vérifier que `window._xss === 0` après load + render recap + buildPdf. Mêmes payloads que Phase 1.
- **Package.json racine minimal** :
  ```json
  {
    "name": "loadsheet-autonome",
    "version": "1.8.x",
    "private": true,
    "scripts": {
      "verify": "node tests/run-harness.cjs",
      "dev": "npx serve . -l 4000"
    }
  }
  ```
  Pas de `dependencies` (le harness est standalone via Node + JSDOM dans devDependencies si on veut être explicite). Le planner décide si devDependencies sont listées ou restent implicites.
- **La release checklist dans CLAUDE.md** doit rester **concise** — 1 écran, pas de prose. L'agent qui release doit pouvoir la scanner en 30 secondes.

</specifics>

<deferred>
## Deferred Ideas

- **Setup Azure Functions locales** (`azure-functions-core-tools`) — overhead trop lourd pour un gain marginal. À revoir si l'équipe grossit ou si des bugs backend apparaissent régulièrement en prod.
- **Git pre-push hook (husky)** — ajout de dépendance + risque de blocage en cas d'environnement défaillant. Phase 3 privilégie discipline > enforcement.
- **GitHub Actions CI** — nécessiterait passer par des PRs (actuellement push direct master). À revoir quand le projet ouvrira aux contributeurs externes.
- **Stub backend local (`api/local-dev-server.js`)** — divergence potentielle avec les vraies Functions, maintenance code supplémentaire. Pas justifié aujourd'hui.
- **Documentation officielle du bypass session DevTools** — risque qu'un futur agent l'active en prod par erreur. Reste un trick de conversation/debug, pas une interface publique.
- **Tests rétro-compat en masse (20+ anciens manifestes)** — la couverture actuelle + le test manuel terrain de la checklist (étape 5 de D-09) suffit.
- **Refactor DRY de `addUld`/`loadManifest`** — toujours reporté depuis Phase 1. Phase 3 n'est pas le bon moment (pas de valeur métier, risque de régression).

### Reviewed Todos (not folded)
Aucun todo matché pour Phase 3 — liste vide.

</deferred>

---

*Phase: 03-validation-locale-release-gate*
*Context gathered: 2026-04-24*
