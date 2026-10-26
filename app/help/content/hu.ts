import type { HelpContent } from '../types'

// Labels in [[…]] render as the interface's own Hungarian text. Sentences are
// built so a label stands on its own (after a colon or in brackets): the a/az
// article and the suffixes cannot agree with a word we do not know in advance.
const hu: HelpContent = {
  ui: {
    button: 'Súgó',
    title: 'Súgó',
    close: 'Súgó bezárása',
    whatYouCanDo: 'Mit tehetsz itt',
    tips: 'Jó tudni',
    allTopics: 'Minden súgótéma',
    backToPage: 'Vissza ehhez az oldalhoz',
    thisPage: 'Ez az oldal',
    showMe: 'Mutasd meg',
    tourStarting: 'Indul a bemutató…',
    tourUnavailable: 'Ez a bemutató még nem érhető el',
    tourUnavailableBody: 'Addig kövesd a lépéseket a súgóban.',
    watch: 'Videó',
    videoLabel: 'Rövid videó: {title}',
    stillStuck: 'Elakadtál?',
    stillStuckBody: 'Írd meg, mit szerettél volna csinálni. Minden üzenetet elolvasunk.',
    sendFeedback: 'Visszajelzés küldése',
    reportBug: 'Hiba bejelentése',
    noTopic: 'Ehhez az oldalhoz még nincs súgó. Válassz egy témát alább.',
    keyboardHint: 'Bármelyik oldalon a ? billentyűvel nyithatod meg a súgót',
    areas: {
      start: 'Első lépések',
      foodchat: 'FoodChat',
      foodscholar: 'FoodScholar',
      recipewrangler: 'RecipeWrangler',
      account: 'A fiókod'
    }
  },
  topics: {
    'dashboard': {
      title: 'Az irányítópultod',
      summary: 'Innen indulsz: megnyithatsz egy alkalmazást, láthatod a mai étkezéseket, és ott folytathatod, ahol abbahagytad.',
      features: {
        'open-apps': {
          title: 'Alkalmazás megnyitása',
          body: 'A WiseFoodban három alkalmazás van. A FoodScholar étkezési és táplálkozási kérdésekre válaszol, a RecipeWrangler recepteket keres és javít, a FoodChat pedig étkezéseket tervez neked.',
          steps: [
            'Kattints egy kártyára: [[dashboard.apps.foodScholar.title]], [[dashboard.apps.recipeWrangler.title]] vagy [[dashboard.apps.foodChat.title]].',
            'A kártyán lévő kis (i) gombbal megnézheted, mit tartalmaz, mielőtt megnyitod.',
            'Ide bármikor visszajöhetsz a bal felső WiseFood logóval.'
          ]
        },
        'todays-meals': {
          title: 'A mai étkezések',
          body: 'Itt látod a mára tervezett étkezéseket: [[dashboard.schedule.title]]. Az aktuálisat ez jelöli: [[dashboard.schedule.now]].',
          steps: [
            'Kattints egy étkezésre a recept megnyitásához.',
            'A terv módosításához kattints ide: [[dashboard.schedule.refineInFoodChat]]. Ha még nincs terved: [[dashboard.schedule.createInFoodChat]].',
            'Megosztás linkkel vagy e-mailben: [[share.button]].'
          ]
        },
        'tips': {
          title: 'A nap tippje',
          body: 'A kártya ([[dashboard.spotlight.badge]]) egy rövid tippet vagy érdekességet mutat az ételekről és az egészségről, és naponta változik.',
          steps: [
            'Olvasd el a tippet a kártyán.',
            'Ha a tipp egy tanulmányból származik, a linkjén továbbolvashatsz a FoodScholarban.'
          ]
        },
        'recommendations': {
          title: 'Neked válogatott receptek',
          body: 'Itt ([[dashboard.recipes.recommendedForYou]]) olyan recepteket ajánlunk, amelyek illenek a használt profilhoz.',
          steps: [
            'Kattints egy receptre a megnyitásához.',
            'A kártyák alatti linkkel az összes recept között kereshetsz a RecipeWranglerben.'
          ],
          note: 'Minél többet árulsz el magadról a Profilom oldalon, annál jobban illenek az ajánlások.'
        },
        'switch-profile': {
          title: 'Kinek tervezel?',
          body: 'Egy háztartásban több profil is lehet. Minden mentés és minden terv a használt profilhoz tartozik.',
          steps: [
            'Kattints a képedre jobb felül.',
            'Válaszd ezt: [[header.menu.switchProfile]].',
            'Válaszd ki, kinek szeretnél tervezni.'
          ]
        },
        'guest': {
          title: 'Vendégként próbálod a WiseFoodot',
          body: 'Minden működik, de az adataid ideiglenesek, és a vendégmunkamenet végén törlődnek.',
          steps: [
            'Ha meg szeretnéd tartani, amit létrehoztál, kattints a felső sávban: [[claim.cta]].',
            'Add meg az e-mail-címedet, a nevedet és egy jelszót, majd erősítsd meg.',
            'Jelentkezz be újra az új fiókkal; semmi sem vész el.'
          ],
          note: 'Inkább kilépnél? Ezzel azonnal törlöd a vendégadataidat: [[auth.guestErase]].'
        }
      }
    },

    'foodchat': {
      title: 'FoodChat: tervezd meg az étkezéseidet',
      summary: 'Írd meg, mit ennél szívesen, és a FoodChat összeállít egy napra vagy egy hétre szóló, a háztartásodhoz illő étrendet, amelyet beszélgetés közben módosít.',
      features: {
        'generate-plan': {
          title: 'Étrend készítése',
          body: 'Írd le a saját szavaiddal, mit szeretnél, vagy indulj egy javaslatból.',
          steps: [
            'Írd be a mezőbe, mit szeretnél, például: „gluténmentes hét, sok fehérjével”.',
            'Vagy kattints egy javaslatra: [[foodChatHome.suggestedQuestions.dailyPlan]] vagy [[foodChatHome.suggestedQuestions.weeklyPlan]].',
            'Küldd el Enterrel vagy a nyíl gombbal.',
            'Várj néhány pillanatot; a terv a beszélgetés mellett jelenik meg.',
            'Ha a FoodChat előbb kérdez valamit, válaszolj a beszélgetésben a folytatáshoz.'
          ],
          note: 'A FoodChathez háztartás és kiválasztott profil kell. Ha kéri, kövesd a képernyőn lévő gombot.'
        },
        'refine': {
          title: 'Módosítás beszélgetéssel',
          body: 'Kérj változtatást egyszerű szavakkal: könnyebb vacsorák, hétfőn ne legyen hal, legyen desszert.',
          steps: [
            'Írd be a változtatást a beszélgetés alatti mezőbe, és küldd el.',
            'Egy étkezés cseréjéhez nyisd meg a kártyáján a ⋮ menüt ([[foodChatHome.mealCard.menu]]), és válaszd ezt: [[foodChatHome.mealCard.replace]].',
            'Ha szeretnéd, módosítsd a javasolt üzenetet, majd küldd el.',
            'A válasz felsorolja, mi változott.'
          ]
        },
        'tools': {
          title: 'Összefoglalók, összesítések és bevásárlólista',
          body: 'A terv menüje ([[foodChatHome.tools.label]]) egy kattintással megválaszolja a gyakori kérdéseket.',
          steps: [
            'Nyisd meg a terv felett: [[foodChatHome.tools.label]].',
            'Válassz: [[foodChatHome.tools.weekSummary]], [[foodChatHome.tools.planTotals]] vagy [[foodChatHome.tools.shoppingList]].',
            'A válasz egy kártyán jelenik meg a terv felett; utána bezárhatod.',
            'Egy teljes nap újratervezése: [[foodChatHome.tools.replaceDay]].'
          ]
        },
        'save-share': {
          title: 'Terv mentése vagy megosztása',
          body: 'A mentett tervek a Könyvtáramba kerülnek. A megosztott terveket bárki megnyithatja a linkkel, fiók nélkül is.',
          steps: [
            'A terv megtartása a Könyvtáramban: [[foodChatHome.planHeader.savePlan]].',
            'Megosztás: [[share.button]] – megnyílik ez az ablak: [[share.title]].',
            'A link másolása: [[share.copy]]. Küldés e-mailben: [[share.emailLabel]].',
            'Meggondoltad magad? A linket ezzel kapcsolod ki: [[share.revoke]].'
          ]
        },
        'pantry': {
          title: 'Főzz abból, amid van',
          body: 'Mondd el, mi van a konyhádban, és a FoodChat erre építi a tervet, így kevesebb étel megy kárba.',
          steps: [
            'Írd meg a beszélgetésben, például: „van spenótom és fél üveg olívabogyóm”.',
            'Vagy nyisd meg ezt: [[foodChatHome.planningState.title]], és itt ([[foodChatHome.planningState.pantryLabel]]) használd ezt: [[foodChatHome.planningState.pantryAdd]].',
            'Ha már vannak tételek: [[foodChatHome.pantryPicker.open]], jelöld be, mit használnál, majd: [[foodChatHome.pantryPicker.cook]].'
          ]
        },
        'settings': {
          title: 'A terv beállításai',
          body: 'Állítsd be, mennyit főznél, mennyi munkával, mi a célod, és milyen gyakran ismétlődhetnek az ételek.',
          steps: [
            'Nyisd meg a terv felett: [[foodChatHome.planSettings.title]].',
            'Módosítsd: [[foodChatHome.chat.planParams.params.cooking_time]], [[foodChatHome.chat.planParams.params.difficulty]], [[foodChatHome.chat.planParams.params.goal]], [[foodChatHome.chat.planParams.params.food_waste]] vagy [[foodChatHome.chat.planParams.params.repeat_meals]].',
            'Minden változtatás azonnal érvényes.'
          ]
        },
        'diners': {
          title: 'Tervezés több személyre',
          body: 'Ha a háztartásodban több profil van, válaszd ki, kik esznek, és a terv mindenki igényeit figyelembe veszi.',
          steps: [
            'Itt kapcsold be, kik esznek: [[foodChatHome.diners.label]].',
            'A saját profilod mindig benne van.',
            'Küldd el a kérésedet a szokásos módon.'
          ],
          note: 'Csak akkor látszik, ha a háztartásban egynél több profil van.'
        },
        'compose': {
          title: 'Rakd össze magad a napot',
          body: 'Inkább te választanál? Válassz ki néhány ételt, a hiányzókat a FoodChat pótolja.',
          steps: [
            'A kezdőképernyőn kattints ide: [[foodChatHome.manual.entry]].',
            'Kattints ide: [[foodChatHome.manual.addRecipe]], és keress receptet; a kedvenceid vannak elöl.',
            'Adj hozzá annyi étkezést, amennyit szeretnél.',
            'A terv kiegészítése: [[foodChatHome.manual.fillRest]].'
          ]
        },
        'adapt': {
          title: 'Recept átalakítása a tervben',
          body: 'Tedd egészségesebbé az ételt, vagy cserélj ki egy hozzávalót anélkül, hogy elhagynád a tervet.',
          steps: [
            'Nyisd meg egy étkezés ⋮ menüjét, és válaszd ezt: [[foodChatHome.mealCard.adapt]].',
            'Nézd át a javasolt változtatásokat.',
            'Kattints ide: [[foodChatHome.adaptModal.save]].'
          ],
          note: 'Az átalakított változat a terv következő frissítésekor kerül be.'
        }
      },
      tips: [
        'Shift + Enter új sort kezd küldés helyett.',
        'A terv alatt értékelheted, mennyire volt jó: [[foodChatHome.canvas.rateThisPlan]].',
        'Ha a FoodChat felajánlja, hogy megjegyez rólad valamit, válassz: [[foodChatHome.chat.memory.remember]] vagy [[foodChatHome.chat.memory.noThanks]]. A Profilom oldalon átnézheted.',
        'Új beszélgetés: [[foodChatHome.chat.startFresh]] (a + gomb); a korábbiakat itt találod: [[foodChatHome.chat.previousSessions]].'
      ]
    },

    'foodscholar': {
      title: 'FoodScholar: kérdezz az ételekről és a táplálkozásról',
      summary: 'Tegyél fel egy kérdést, és tudományos tanulmányokon és hivatalos táplálkozási ajánlásokon alapuló választ kapsz, minden forrással együtt.',
      features: {
        'ask': {
          title: 'Kérdés feltevése',
          body: 'Kérdezz bármit az ételekről, a táplálkozásról vagy az egészségről, a saját szavaiddal.',
          steps: [
            'Ellenőrizd, hogy ez van kiválasztva: [[foodScholarHome.qa.tabs.askQuestions]].',
            'Írd be a kérdésed a mezőbe, vagy kattints egy javasolt kérdésre.',
            'Nyomd meg az Entert vagy a nyíl gombot.',
            'Olvasd el a választ ([[foodScholarHome.qa.answer]]). A szövegben lévő számok a felhasznált forrásokra mutatnak.'
          ],
          note: 'Néha a FoodScholar visszakérdez, hogy jobban megértsen.'
        },
        'sources': {
          title: 'A források ellenőrzése',
          body: 'A válasz minden állítása arra a tanulmányra vagy ajánlásra mutat, amelyből származik.',
          steps: [
            'Kattints egy számra a válaszban, és megjelenik a szakasz, amelyre épül.',
            'A teljes tanulmány elolvasása: [[foodScholarHome.qa.passagePeek.openArticle]].',
            'Az összes forrást itt látod: [[foodScholarHome.qa.sidebar.cited]] és [[foodScholarHome.qa.sidebar.consulted]].'
          ]
        },
        'follow-up': {
          title: 'Kérdezz tovább, vagy kezdd újra',
          body: 'Folytasd a beszélgetést; a FoodScholar emlékszik a korábbi kérdéseidre.',
          steps: [
            'Kattints egy kérdésre itt: [[foodScholarHome.qa.followUpSuggestions]], vagy írj sajátot.',
            'Új téma kezdése: [[foodScholarHome.qa.thread.new]].'
          ]
        },
        'rate': {
          title: 'Jelezd, ha segített a válasz',
          body: 'Az értékelésed segít jobbá tenni a válaszokat.',
          steps: [
            'A válasz alatt ([[foodScholarHome.qa.feedback.helpfulQuestion]]) kattints: [[foodScholarHome.common.yes]] vagy [[foodScholarHome.common.no]].',
            'Ha nemmel válaszoltál, írd le röviden, mi volt a gond.',
            'Ha két választ látsz egymás mellett, kattints arra, amelyik jobban tetszik.'
          ]
        },
        'advanced': {
          title: 'Speciális beállítások',
          body: 'Kutatóknak és szakembereknek: megválaszthatod, hogyan készüljön és hogyan szóljon a válasz.',
          steps: [
            'Kattints a kérdésmező mellett: [[foodScholarHome.qa.advanced.title]].',
            'Kapcsold be a speciális beállításokat, majd módosítsd a módszert, a modellt, a források mélységét vagy a magyarázat stílusát.',
            'Tedd fel a kérdésed a szokásos módon.'
          ]
        },
        'library': {
          title: 'Böngészés a könyvtárban',
          body: 'Közvetlenül kereshetsz tudományos cikkek, nemzeti táplálkozási útmutatók és tankönyvek között.',
          steps: [
            'Kattints erre a fülre: [[foodScholarHome.qa.tabs.library]].',
            'Írj a keresőmezőbe, és nyomd meg az Entert, vagy válassz egy javaslatot.',
            'Vagy nyiss meg egy részt: cikkek, táplálkozási útmutatók, tankönyvek vagy a tudáshierarchia.'
          ]
        }
      }
    },

    'foodscholar-catalog': {
      title: 'Tudományos cikkek keresése',
      summary: 'Keress tanulmányokat úgy, hogy leírod, mit keresel, majd szűkítsd a listát szűrőkkel.',
      features: {
        search: {
          title: 'Keresés hétköznapi szavakkal',
          body: 'Írd le a témát úgy, ahogy egy embernek mondanád; nem kellenek pontos kulcsszavak.',
          steps: [
            'Írj a keresőmezőbe, például: „bélrendszer egészsége és probiotikumok”.',
            'Vagy kattints a mező alatti példakeresések egyikére.',
            'Nyomd meg az Entert, és nyiss meg bármelyik cikket a találatok közül.'
          ]
        },
        filters: {
          title: 'A találatok szűkítése',
          body: 'Szűrhetsz téma, év, tanulmánytípus, korcsoport, ország és még sok más szerint.',
          steps: [
            'Kattints ide: [[foodScholarCatalog.filters.show]].',
            'Válaszd ki a szűrőket; a lista azonnal frissül.',
            'Szűrő eltávolítása itt: [[foodScholarCatalog.activeFilters]], vagy kattints ide: [[foodScholarCatalog.actions.resetAllFilters]].',
            'A sorrend módosítása: [[foodScholarCatalog.sort.label]].'
          ]
        },
        summary: {
          title: 'Az MI-összefoglaló',
          body: 'Keresés után egy összefoglaló ([[foodScholarCatalog.summary.title]]) foglalja össze, mit mondanak a legjobb találatok.',
          steps: [
            'Indíts egy keresést.',
            'Olvasd el a találatok feletti összefoglalót, és kattints ide: [[foodScholarCatalog.summary.clickToReadMore]].',
            'Kattints egy témára itt ([[foodScholarCatalog.summary.relatedTopics]]), hogy arra keress.'
          ],
          note: 'Az összefoglalót mesterséges intelligencia készíti a cikkekből. A részleteket a cikkekben ellenőrizd.'
        }
      }
    },

    'foodscholar-article': {
      title: 'Egy cikk olvasása',
      summary: 'Minden cikkoldal érthetően elmagyarázza a tanulmányt, a fő pontjaival és azzal, mennyire erős a bizonyíték.',
      features: {
        read: {
          title: 'A tanulmány megértése',
          body: 'Kezdd a közérthető változattal, és ha szeretnéd, menj mélyebbre.',
          steps: [
            'Az összefoglaló egyszerűbb változata: [[foodScholarArticle.actions.simplify]].',
            'Olvasd el: [[foodScholarArticle.sections.keyTakeaways]].',
            'A bizonyíték erőssége: [[foodScholarArticle.sections.studyEvaluation]].'
          ]
        },
        questions: {
          title: 'Kérdések és válaszok',
          body: 'Gyakori kérdések a tanulmányról, különböző olvasóknak megválaszolva.',
          steps: [
            'Lépj ide: [[foodScholarArticle.sections.qa]].',
            'Válassz: [[foodScholarArticle.qaTabs.forYou]], [[foodScholarArticle.qaTabs.forPractitioners]] vagy [[foodScholarArticle.qaTabs.forExperts]].'
          ]
        },
        save: {
          title: 'Mentés vagy megosztás',
          body: 'Tartsd meg a cikket a Könyvtáramban, vagy küldd el valakinek.',
          steps: [
            'Kattints ide: [[foodScholarArticle.actions.save]]; mentés után ez látszik: [[foodScholarArticle.actions.saved]].',
            'Megosztás: [[foodScholarArticle.actions.copyLink]].'
          ],
          note: 'A mentéshez kiválasztott profil kell.'
        }
      }
    },

    'foodscholar-guides': {
      title: 'Táplálkozási útmutatók országonként',
      summary: 'Olvasd el az európai országok hivatalos, élelmiszer-alapú táplálkozási ajánlásait, és hasonlítsd össze a szabályaikat.',
      features: {
        find: {
          title: 'Útmutató keresése',
          body: 'Kereshetsz cím, ország vagy téma szerint az összes útmutató között.',
          steps: [
            'Írj az útmutatók keresőmezőjébe.',
            'Vagy szűkítsd a listát az országgombokkal.',
            'Kattints egy útmutatóra a megnyitásához.'
          ]
        },
        map: {
          title: 'Felfedezés térképen',
          body: 'Nézd meg, mely országoknak van útmutatója, és nyisd meg őket a térképről.',
          steps: [
            'Kattints erre a fülre: [[=Map]].',
            'Kattints egy országra a térképen vagy a mellette lévő listában.',
            'Az ország útmutatói: [[=Open explorer]].'
          ],
          note: 'Érintőképernyőn előbb koppints ide a térkép mozgatásához és nagyításához: [[guidelines.map.explore]].'
        },
        explorer: {
          title: 'Egy ország szabályainak szűrése',
          body: 'Minden országoldal felsorolja az útmutatókat és a bennük lévő egyes szabályokat.',
          steps: [
            'Nyisd meg ezt a fület: [[=Guidelines]].',
            'Szűrj téma, célcsoport, útmutató vagy év szerint.',
            'Tovább szűkíthetsz: [[guidelines.filters.lifeStage]], [[guidelines.filters.foodGroup]] vagy [[guidelines.filters.nutrient]].',
            'Újrakezdés: [[guidelines.filters.clear]].'
          ]
        },
        read: {
          title: 'Útmutató olvasása',
          body: 'Az útmutató dokumentuma és a szabályai egymás mellett jelennek meg.',
          steps: [
            'Nyiss meg egy útmutatót.',
            'A szabályok között a lista ([[guidelines.panes.rules]]) feletti mezővel kereshetsz.',
            'Telefonon felül válthatsz: [[guidelines.panes.document]] és [[guidelines.panes.rules]].',
            'A mentés gombbal a Könyvtáramba kerül.'
          ]
        }
      }
    },

    'foodscholar-textbooks': {
      title: 'Tankönyvek',
      summary: 'Táplálkozástudományi tankönyvek, amelyekben kereshetsz, beléjük nézhetsz és letöltheted őket.',
      features: {
        find: {
          title: 'Tankönyv keresése',
          body: 'Keress cím, szerző vagy téma szerint, és szűrj nyelv, célközönség vagy régió szerint.',
          steps: [
            'Írj a keresőmezőbe.',
            'Szűrés nyelv, célközönség vagy régió szerint: [[=Show filters]].',
            'Kattints egy tankönyvre a megnyitásához.'
          ]
        },
        inside: {
          title: 'Belelapozás',
          body: 'Nézd meg a fontos részeket, mielőtt letöltöd a könyvet.',
          steps: [
            'Nyiss meg egy tankönyvet.',
            'Olvasd el a részleteket itt: [[=Inside this textbook]].',
            'Az egész könyv letöltése: [[=Download PDF]]. A mentés gombbal a Könyvtáramba kerül.'
          ]
        }
      }
    },

    'foodscholar-hierarchy': {
      title: 'Tudáshierarchia',
      summary: 'Böngészd, hogyan kapcsolódnak az ételek, a tápanyagok és az egészségügyi témák, és milyen bizonyítékok állnak mögöttük.',
      features: {
        search: {
          title: 'Keresés a hierarchiában',
          body: 'Ugorj egyenesen egy ételhez, tápanyaghoz vagy témához.',
          steps: [
            'Írj a felső keresőmezőbe.',
            'Válassz egy találatot, és megnyílik a fában.'
          ]
        },
        browse: {
          title: 'Böngészés és bizonyítékok',
          body: 'Nyisd ki a fa ágait, és olvasd el, mi támasztja alá az egyes elemeket.',
          steps: [
            'Nyiss ki sorokat itt: [[graph.tree.title]].',
            'Kattints egy elemre, és megjelennek a részletei ([[graph.inspector.title]]).',
            'További szakaszok: [[graph.inspector.moreEvidence]].'
          ]
        },
        ask: {
          title: 'Szűkítés vagy kérdés',
          body: 'Szűkítsd a fát egyetlen elemre, vagy kérdezd róla a FoodScholart.',
          steps: [
            'Csak egy elem alatti rész mutatása: [[graph.inspector.scopeHere]].',
            'Kérdés róla a FoodScholarnak: [[graph.inspector.askAbout]].'
          ]
        }
      }
    },

    'recipes': {
      title: 'RecipeWrangler: receptek keresése',
      summary: 'Keress több ezer recept között, szűrd ki az allergéneket, hasonlítsd össze őket, és elemeztesd a saját receptjeidet.',
      features: {
        search: {
          title: 'Receptek keresése',
          body: 'Írd le, mihez van kedved; egész mondatokat is használhatsz.',
          steps: [
            'Írj a keresőmezőbe, például: „gyors vegán vacsorák”.',
            'Nyomd meg az Entert, vagy kattints a nagyító ikonra.',
            'Vagy válassz egy javaslatot, egy korábbi keresést vagy egy kategóriát.',
            'Kattints egy receptre a megnyitásához.'
          ]
        },
        personalized: {
          title: 'Hozzád illő találatok',
          body: 'Ha ez be van kapcsolva ([[recipeWrangler.search.personalized]]), a találatok figyelembe veszik a használt profil étrendjét és allergiáit.',
          steps: [
            'Hagyd bekapcsolva a szűrők mellett: [[recipeWrangler.search.personalized]].',
            'Kapcsold ki, ha minden receptet látni szeretnél, például ha nincs találat.'
          ],
          note: 'Kiválasztott profil kell hozzá.'
        },
        filters: {
          title: 'Szűrés és rendezés',
          body: 'Zárd ki az allergéneket, válassz étrendet és konyhát, vagy indulj egy kész szűrőből.',
          steps: [
            'Kattints ide: [[recipeWrangler.filters.show]] (telefonon: [[recipeWrangler.filters.open]]).',
            'Használd ezeket: [[recipeWrangler.filters.excludeAllergens]] és [[recipeWrangler.filters.dietTags]], vagy egy kész szűrőt ([[recipeWrangler.filters.quickFilters]]).',
            'Sorrend: [[recipeWrangler.filters.sortBy]].',
            'Egy szűrőt a keresőmező alatti címkével távolíthatsz el, az összeset ezzel: [[recipeWrangler.filters.clearAll]].'
          ]
        },
        compare: {
          title: 'Receptek összehasonlítása',
          body: 'Tegyél egymás mellé legfeljebb négy receptet: Nutri-Score, idő, kalória és tápanyagok.',
          steps: [
            'Jelöld be a négyzetet egy receptkártya bal felső sarkában.',
            'Jelölj be még legalább egyet (legfeljebb négyet).',
            'Kattints a megjelenő összehasonlítás gombra.'
          ]
        },
        analyze: {
          title: 'Saját recept elemzése',
          body: 'Illessz be bármilyen receptet, és megkapod a tápértékét, a Nutri-Score-ját, a környezeti hatását és a költségét.',
          steps: [
            'Nyisd meg ezt a fület: [[=Analyze Recipe]].',
            'Illeszd be a recept szövegét (mennyiségekkel együtt működik a legjobban).',
            'Válaszd ki a régiódat.',
            'Kattints ide: [[recipeWrangler.analyzer.analyze]], és olvasd el az eredményt.'
          ],
          note: 'Magát a szöveget illeszd be; receptoldalak linkjei nem működnek.'
        },
        favorites: {
          title: 'A kedvenceid',
          body: 'Jelöld meg a recepteket a szívvel, hogy gyorsan újra megtaláld őket.',
          steps: [
            'Kattints a szívre egy receptkártyán.',
            'A találatok feletti szív gombbal csak a kedvenceidet látod.',
            'Mindet megtalálod a Könyvtáramban is.'
          ]
        },
        sources: {
          title: 'Honnan származnak a receptek és az adatok?',
          body: 'A receptek közzétett gyűjteményekből, a tápértékek nemzeti élelmiszer-összetételi táblázatokból származnak.',
          steps: [
            'Görgess a főoldalon ide: [[=Recipe Collections]] vagy [[=Food Composition Tables]].',
            'Nyiss meg egyet, és megnézheted, honnan származik és mit tartalmaz.'
          ]
        }
      }
    },

    'recipe': {
      title: 'Egy recept közelről',
      summary: 'Nézd meg, mennyire egészséges és fenntartható egy recept, méretezd át, cserélj hozzávalót, és készíts jobb változatot.',
      features: {
        scores: {
          title: 'Pontszámok egy pillantással',
          body: 'A felső sáv mutatja ezt: [[recipeWrangler.recipe.nutriScore]], a környezeti hatást és – ha ismert – a költséget.',
          steps: [
            'Nézd meg a betűt ([[recipeWrangler.recipe.nutriScore]]): az A a legegészségesebb, az E a legkevésbé.',
            'A mellette lévő ? megmutatja, hogyan számoltuk ki.',
            'Nézd meg ezt is: [[recipeWrangler.detail.sustainability.label]] (CO₂ adagonként) és [[recipeWrangler.recipe.cost.label]] (árkategória).'
          ],
          note: 'Még nem minden recepthez van költségadat.'
        },
        nutrition: {
          title: 'Tápérték részletesen',
          body: 'Kalória és tápanyagok egy adagra vagy 100 grammra.',
          steps: [
            'Lépj ide: [[recipeWrangler.detail.nutritionalInfo]].',
            'Válts: [[recipeWrangler.detail.basisPerServing]] / [[recipeWrangler.detail.basisPer100g]].',
            'Válts: [[recipeWrangler.detail.chartView]] / [[recipeWrangler.detail.gridView]].'
          ]
        },
        servings: {
          title: 'Adagok és helyettesítők',
          body: 'Főzz több vagy kevesebb személyre, vagy cseréld ki azt a hozzávalót, amely nincs otthon.',
          steps: [
            'Használd a + és − gombot itt: [[recipeWrangler.detail.scale.label]]; a mennyiségek frissülnek.',
            'Kattints a csere ikonra egy hozzávaló mellett ([[recipeWrangler.detail.substitution.action]]).',
            'Válassz helyettesítőt a listából.'
          ]
        },
        improve: {
          title: 'Legyen egészségesebb vagy zöldebb',
          body: 'Kérj javaslatokat a recept javítására, és mentsd el a saját változatodat.',
          steps: [
            'Kattints a hozzávalók mellett: [[recipeWrangler.detail.adaptation.improve]].',
            'Válassz: [[recipeWrangler.detail.adaptation.modeNutrition]], [[recipeWrangler.detail.adaptation.modeSustainability]] vagy [[recipeWrangler.detail.adaptation.modeReduce]].',
            'Nézd át a javasolt változtatásokat.',
            'Kattints ide: [[recipeWrangler.detail.adaptation.save]].'
          ],
          note: 'Akkor érhető el, amikor a recept tápértéke már elkészült.'
        },
        save: {
          title: 'Mentés',
          body: 'Tartsd meg a receptet a Könyvtáramban.',
          steps: [
            'Kattints az oldal tetején: [[recipeWrangler.recipe.save]].',
            'A Könyvtáramban itt találod: [[library.savedRecipes]].'
          ]
        },
        report: {
          title: 'Hiba a receptben',
          body: 'Rossz allergének, furcsa mennyiségek, működésképtelen lépések: szólj a szerkesztőinknek.',
          steps: [
            'Kattints felül a zászlóra: [[report.trigger]].',
            'Válaszd ki, mi a hiba.',
            'Ha szeretnéd, írj pár szót, majd kattints ide: [[report.send]].'
          ]
        }
      }
    },

    'recipes-compare': {
      title: 'Receptek összehasonlítása',
      summary: 'Legfeljebb négy recept egymás mellett, soronként.',
      features: {
        read: {
          title: 'Az összehasonlítás olvasása',
          body: 'Minden sor egy dolgot hasonlít össze: Nutri-Score, idő, adagok, kalória és tápanyagok.',
          steps: [
            'Olvasd végig a sort a receptek összehasonlításához.',
            'Kattints egy recept nevére a megnyitásához.',
            'Telefonon válaszd ki azt a két receptet, amelyet egymás mellett látnál.'
          ]
        },
        manage: {
          title: 'Mit hasonlítasz össze?',
          body: 'Menj vissza a kereséshez, és adj hozzá másokat, vagy kezdd újra.',
          steps: [
            'Menj vissza a RecipeWranglerbe, és jelölj be más recepteket.',
            'Az összehasonlítás kiürítése: [[recipeWrangler.comparePage.clearAll]].'
          ]
        }
      }
    },

    'library': {
      title: 'Könyvtáram',
      summary: 'Minden, amit a WiseFoodban elmentettél, egy helyen.',
      features: {
        saved: {
          title: 'A mentett elemeid',
          body: 'Az elmentett receptek, cikkek, táplálkozási útmutatók és tankönyvek itt jelennek meg, típus szerint csoportosítva.',
          steps: [
            'Ments menet közben: a szívvel egy recepten, a mentés gombbal egy cikken, útmutatón vagy tankönyvön.',
            'Innen bármelyiket megnyithatod.',
            'Még semmi sincs itt? Kezdd itt: [[library.emptyCta]].'
          ],
          note: 'A mentett elemek a használt profilhoz tartoznak. Válts profilt, ha valaki másét szeretnéd látni.'
        },
        plans: {
          title: 'Mentett étrendek',
          body: 'A FoodChatben megtartott terveid itt vannak: [[library.savedPlans]].',
          steps: [
            'Keresd meg a tervet a dátuma alapján.',
            'Megnyitás vagy további módosítás: [[library.planOpen]].'
          ]
        }
      }
    },

    'my-profile': {
      title: 'Profilom',
      summary: 'Amit a WiseFood a használt profilról tud: étrend, allergiák, kedvelt és nem kedvelt ételek. Minden alkalmazás ezt használja a személyre szabáshoz.',
      features: {
        'quick-setup': {
          title: 'Gyors beállítás',
          body: 'Néhány kérdés, és egyszerre beállítod az étrendet, az allergiákat, a kedvelt és a nem kedvelt ételeket.',
          steps: [
            'Kattints ide: [[myProfile.actions.quickSetup]].',
            'Menj végig a lépéseken.',
            'A végén kattints ide: [[preferencesWizard.actions.save]].'
          ]
        },
        'diet-allergies': {
          title: 'Étrend és allergiák',
          body: 'A WiseFood soha nem javasol olyan ételt, amely ütközik egy itt megadott allergiával.',
          steps: [
            'Itt ([[myProfile.sections.dietaryPreferences]]) kattints erre: [[myProfile.actions.add]], és válassz étrendet.',
            'Itt ([[myProfile.sections.allergiesAndIntolerances]]) kattints erre: [[myProfile.actions.add]], és válaszd ki, mit kerülsz.',
            'A kuka ikonnal törölhetsz.'
          ]
        },
        'likes': {
          title: 'Kedvelt és nem kedvelt ételek',
          body: 'A receptek és a tervek előnyben részesítik, amit szeretsz, és kihagyják, amit nem.',
          steps: [
            'Itt ([[myProfile.sections.foodLikes]] vagy [[myProfile.sections.foodDislikes]]) kattints erre: [[myProfile.actions.add]].',
            'Keress vagy böngéssz, és jelöld be az ételeket.',
            'Erősítsd meg. Egy ételt a × jellel távolíthatsz el.'
          ]
        },
        'memory': {
          title: 'Amit a WiseFood megjegyez',
          body: 'Ha egy beszélgetésben engeded, a WiseFood megjegyez dolgokat, például célokat vagy szokásokat. Ezeket bármikor megnézheted, kijavíthatod vagy törölheted.',
          steps: [
            'Lépj ide: [[myProfile.sections.memory]].',
            'A ? megmutatja ezt: [[myProfile.memory.why.title]].',
            'A ceruzával javíthatsz, ezzel pedig törölhetsz: [[myProfile.memory.forget]].'
          ]
        },
        'details': {
          title: 'Név, kép és adatok',
          body: 'Módosítsd a profil nevét, korcsoportját vagy képét.',
          steps: [
            'Kattints ide: [[myProfile.actions.edit]] (itt: [[myProfile.sections.profileDetails]]).',
            'A képen lévő ceruzával másik képet választhatsz.',
            'Mentsd a változtatásokat.'
          ]
        },
        'privacy': {
          title: 'Adatvédelem és az adataid',
          body: 'Te döntöd el, mit gyűjtünk, és mindent törölhetsz.',
          steps: [
            'Kapcsold be vagy ki: [[myProfile.privacy.analyticsTitle]].',
            'Mit tárolunk pontosan: [[myProfile.dataKept.title]].',
            'Profil, háztartás vagy fiók törlése itt: [[myProfile.sections.dangerZone]].'
          ],
          note: 'A törlés nem vonható vissza.'
        }
      }
    },

    'profiles': {
      title: 'Profilok a háztartásodban',
      summary: 'A háztartás minden tagjának saját profilja van, saját étrenddel, allergiákkal és mentett elemekkel. Válaszd ki, kinek használod a WiseFoodot.',
      features: {
        choose: {
          title: 'Profil kiválasztása',
          body: 'Ezután minden, amit csinálsz, ehhez a személyhez tartozik.',
          steps: [
            'Kattints valakinek a képére.',
            'Később a jobb felső képeddel válthatsz: [[header.menu.switchProfile]].'
          ]
        },
        add: {
          title: 'Valaki hozzáadása',
          body: 'Adj hozzá profilt mindenkinek, akinek étkezést tervezel.',
          steps: [
            'Kattints ide: [[profileSelection.actions.addProfile]].',
            'Adj meg egy nevet, ha szeretnéd, egy korcsoportot is, és válassz képet.',
            'Kattints ide: [[profileSelection.actions.createProfile]].'
          ],
          note: 'Az étrendjét és az allergiáit utána a Profilom oldalon állítsd be.'
        },
        manage: {
          title: 'Profil eltávolítása',
          body: 'Távolítsd el a már nem szükséges profilokat.',
          steps: [
            'Kattints ide: [[profileSelection.actions.manageProfiles]].',
            'Kattints a profil piros × jelére, és erősítsd meg.',
            'Kattints ide: [[profileSelection.actions.done]].'
          ]
        },
        setup: {
          title: 'Első beállítás',
          body: 'Első alkalommal egy rövid útmutató beállítja a háztartásodat és a saját profilodat.',
          steps: [
            'Adj nevet a háztartásnak, és ha szeretnéd, egy országot is.',
            'Add meg a neved, a korcsoportod és az étrended.',
            'Fejezd be, vagy hagyd ki, és csináld meg később.'
          ]
        }
      }
    }
  }
}

export default hu
