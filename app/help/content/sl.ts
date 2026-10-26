import type { HelpContent } from '../types'

// Labels in [[…]] render as the interface's own Slovenian text, so they are
// quoted, not declined: sentences put them after a colon or in brackets. The
// text avoids the gendered past tense ("si naredil/a") by using the present.
const sl: HelpContent = {
  ui: {
    button: 'Pomoč',
    title: 'Pomoč',
    close: 'Zapri pomoč',
    whatYouCanDo: 'Kaj lahko narediš tukaj',
    tips: 'Dobro je vedeti',
    allTopics: 'Vse teme pomoči',
    backToPage: 'Nazaj na to stran',
    thisPage: 'Ta stran',
    showMe: 'Pokaži mi',
    tourStarting: 'Vodeni ogled se začenja …',
    tourUnavailable: 'Ta vodeni ogled še ni na voljo',
    tourUnavailableBody: 'Za zdaj sledi korakom v pomoči.',
    watch: 'Video',
    videoLabel: 'Kratek video: {title}',
    stillStuck: 'Se ti je zataknilo?',
    stillStuckBody: 'Povej nam, kaj želiš narediti. Preberemo vsako sporočilo.',
    sendFeedback: 'Pošlji mnenje',
    reportBug: 'Prijavi napako',
    noTopic: 'Za to stran pomoč še ni napisana. Spodaj izberi temo.',
    keyboardHint: 'Pomoč odpreš na kateri koli strani s tipko ?',
    areas: {
      start: 'Prvi koraki',
      foodchat: 'FoodChat',
      foodscholar: 'FoodScholar',
      recipewrangler: 'RecipeWrangler',
      account: 'Tvoj račun'
    }
  },
  topics: {
    'dashboard': {
      title: 'Tvoja nadzorna plošča',
      summary: 'Tukaj začneš: odpri aplikacijo, poglej današnje obroke in nadaljuj tam, kjer je ostalo.',
      features: {
        'open-apps': {
          title: 'Odpri aplikacijo',
          body: 'WiseFood ima tri aplikacije. FoodScholar odgovarja na vprašanja o hrani in prehrani, RecipeWrangler išče in izboljšuje recepte, FoodChat pa načrtuje obroke zate.',
          steps: [
            'Klikni kartico: [[dashboard.apps.foodScholar.title]], [[dashboard.apps.recipeWrangler.title]] ali [[dashboard.apps.foodChat.title]].',
            'Z majhnim gumbom (i) na kartici vidiš, kaj vsebuje, še preden jo odpreš.',
            'Sem se kadar koli vrneš z logotipom WiseFood levo zgoraj.'
          ]
        },
        'todays-meals': {
          title: 'Današnji obroki',
          body: 'Tukaj ([[dashboard.schedule.title]]) so obroki, načrtovani za danes. Trenutni je označen: [[dashboard.schedule.now]].',
          steps: [
            'Klikni obrok, da odpreš njegov recept.',
            'Za spremembo načrta: [[dashboard.schedule.refineInFoodChat]]. Če načrta še nimaš: [[dashboard.schedule.createInFoodChat]].',
            'Deljenje s povezavo ali po e-pošti: [[share.button]].'
          ]
        },
        'tips': {
          title: 'Nasvet dneva',
          body: 'Kartica ([[dashboard.spotlight.badge]]) prikazuje kratek nasvet ali zanimivost o hrani in zdravju in se spreminja iz dneva v dan.',
          steps: [
            'Preberi nasvet na kartici.',
            'Če nasvet izhaja iz raziskave, prek njene povezave bereš naprej v FoodScholarju.'
          ]
        },
        'recommendations': {
          title: 'Recepti, izbrani zate',
          body: 'Tukaj ([[dashboard.recipes.recommendedForYou]]) predlagamo recepte, ki ustrezajo profilu, ki ga uporabljaš.',
          steps: [
            'Klikni recept, da ga odpreš.',
            'S povezavo pod karticami iščeš med vsemi recepti v RecipeWranglerju.'
          ],
          note: 'Več ko WiseFoodu poveš na strani Moj profil, bolje se predlogi ujemajo.'
        },
        'switch-profile': {
          title: 'Za koga načrtuješ',
          body: 'Gospodinjstvo ima lahko več profilov. Vse, kar shraniš, in vsak načrt pripadata profilu, ki je v uporabi.',
          steps: [
            'Klikni svojo sliko desno zgoraj.',
            'Izberi: [[header.menu.switchProfile]].',
            'Izberi osebo, za katero želiš načrtovati.'
          ]
        },
        'guest': {
          title: 'WiseFood preizkušaš kot gost',
          body: 'Vse deluje, vendar so tvoji podatki začasni in se ob koncu gostujoče seje izbrišejo.',
          steps: [
            'Če želiš obdržati, kar nastane, v pasici na vrhu klikni: [[claim.cta]].',
            'Vnesi e-poštni naslov, ime in geslo ter potrdi.',
            'Znova se prijavi z novim računom; nič se ne izgubi.'
          ],
          note: 'Raje odhajaš? S tem takoj izbrišeš svoje gostujoče podatke: [[auth.guestErase]].'
        }
      }
    },

    'foodchat': {
      title: 'FoodChat: načrtuj svoje obroke',
      summary: 'Povej FoodChatu, kaj bi rad jedel, in sestavi dan ali teden obrokov, ki ustreza tvojemu gospodinjstvu, nato pa ga med pogovorom prilagaja.',
      features: {
        'generate-plan': {
          title: 'Pridobi načrt obrokov',
          body: 'S svojimi besedami opiši, kaj želiš, ali začni s predlogom.',
          steps: [
            'V polje vpiši, kaj želiš, na primer »teden brez glutena, veliko beljakovin«.',
            'Ali klikni predlog: [[foodChatHome.suggestedQuestions.dailyPlan]] ali [[foodChatHome.suggestedQuestions.weeklyPlan]].',
            'Pošlji s tipko Enter ali gumbom s puščico.',
            'Počakaj nekaj trenutkov; načrt se prikaže ob pogovoru.',
            'Če te FoodChat najprej kaj vpraša, odgovori v pogovoru in nadaljuje.'
          ],
          note: 'FoodChat potrebuje gospodinjstvo in izbran profil. Če ju zahteva, sledi gumbu na zaslonu.'
        },
        'refine': {
          title: 'Spremeni načrt s pogovorom',
          body: 'Spremembe zahtevaj z navadnimi besedami: lažje večerje, v ponedeljek brez rib, dodaj sladico.',
          steps: [
            'Spremembo vpiši v polje pod pogovorom in jo pošlji.',
            'Za zamenjavo enega obroka odpri meni ⋮ na njegovi kartici ([[foodChatHome.mealCard.menu]]) in izberi: [[foodChatHome.mealCard.replace]].',
            'Predlagano sporočilo po želji uredi in ga pošlji.',
            'Odgovor našteje, kaj se je spremenilo.'
          ]
        },
        'tools': {
          title: 'Povzetki, seštevki in nakupovalni seznam',
          body: 'Meni načrta ([[foodChatHome.tools.label]]) z enim klikom odgovori na pogosta vprašanja o njem.',
          steps: [
            'Nad načrtom odpri: [[foodChatHome.tools.label]].',
            'Izberi: [[foodChatHome.tools.weekSummary]], [[foodChatHome.tools.planTotals]] ali [[foodChatHome.tools.shoppingList]].',
            'Odgovor se prikaže na kartici nad načrtom; ko končaš, jo zapri.',
            'Za ponovno načrtovanje celega dne: [[foodChatHome.tools.replaceDay]].'
          ]
        },
        'save-share': {
          title: 'Shrani ali deli načrt',
          body: 'Shranjeni načrti so v Moji knjižnici. Deljeni načrti se odprejo vsakomur s povezavo, tudi brez računa.',
          steps: [
            'Načrt obdržiš v Moji knjižnici z gumbom: [[foodChatHome.planHeader.savePlan]].',
            'Deljenje: [[share.button]] – odpre se okno: [[share.title]].',
            'Kopiranje povezave: [[share.copy]]. Pošiljanje po e-pošti: [[share.emailLabel]].',
            'Si premisliš? Povezavo izklopiš z: [[share.revoke]].'
          ]
        },
        'pantry': {
          title: 'Kuhaj iz tega, kar imaš',
          body: 'Povej FoodChatu, kaj je v tvoji kuhinji, in načrt bo zgrajen okoli tega, zato manj hrane konča v smeteh.',
          steps: [
            'Povej v pogovoru, na primer »imam špinačo in pol kozarca oliv«.',
            'Ali odpri [[foodChatHome.planningState.title]] in tukaj ([[foodChatHome.planningState.pantryLabel]]) uporabi: [[foodChatHome.planningState.pantryAdd]].',
            'Ko imaš sestavine: [[foodChatHome.pantryPicker.open]], označi, kaj uporabiti, nato: [[foodChatHome.pantryPicker.cook]].'
          ]
        },
        'settings': {
          title: 'Nastavitve načrta',
          body: 'Nastavi, koliko časa želiš kuhati, koliko truda, svoj cilj in kako pogosto se obroki lahko ponovijo.',
          steps: [
            'Nad načrtom odpri: [[foodChatHome.planSettings.title]].',
            'Spremeni: [[foodChatHome.chat.planParams.params.cooking_time]], [[foodChatHome.chat.planParams.params.difficulty]], [[foodChatHome.chat.planParams.params.goal]], [[foodChatHome.chat.planParams.params.food_waste]] ali [[foodChatHome.chat.planParams.params.repeat_meals]].',
            'Vsaka sprememba velja takoj.'
          ]
        },
        'diners': {
          title: 'Načrtuj za več oseb',
          body: 'Ko ima gospodinjstvo več profilov, izberi, kdo bo jedel, in načrt upošteva potrebe vseh.',
          steps: [
            'Tukaj vklopi osebe, ki bodo jedle: [[foodChatHome.diners.label]].',
            'Tvoj profil je vedno vključen.',
            'Zahtevo pošlji kot običajno.'
          ],
          note: 'Prikazano le, ko ima gospodinjstvo več kot en profil.'
        },
        'compose': {
          title: 'Sestavi dan sam',
          body: 'Raje izbiraš sam? Izberi nekaj jedi, FoodChat pa dopolni ostalo.',
          steps: [
            'Na začetnem zaslonu klikni: [[foodChatHome.manual.entry]].',
            'Klikni [[foodChatHome.manual.addRecipe]] in poišči recept; priljubljeni so na vrhu.',
            'Dodaj, kolikor obrokov želiš.',
            'Za dopolnitev načrta: [[foodChatHome.manual.fillRest]].'
          ]
        },
        'adapt': {
          title: 'Prilagodi recept v načrtu',
          body: 'Naredi obrok bolj zdrav ali zamenjaj sestavino, ne da bi zapustil načrt.',
          steps: [
            'Odpri meni ⋮ na obroku in izberi: [[foodChatHome.mealCard.adapt]].',
            'Preglej predlagane spremembe.',
            'Klikni: [[foodChatHome.adaptModal.save]].'
          ],
          note: 'Prilagojena različica se uporabi ob naslednji posodobitvi načrta.'
        }
      },
      tips: [
        'Shift + Enter začne novo vrstico namesto pošiljanja.',
        'Pod načrtom nam povej, kako je bilo: [[foodChatHome.canvas.rateThisPlan]].',
        'Ko ti FoodChat ponudi, da si kaj zapomni, izberi: [[foodChatHome.chat.memory.remember]] ali [[foodChatHome.chat.memory.noThanks]]. Pregledaš ga lahko na strani Moj profil.',
        'Nov pogovor: [[foodChatHome.chat.startFresh]] (gumb +); prejšnji ostanejo tukaj: [[foodChatHome.chat.previousSessions]].'
      ]
    },

    'foodscholar': {
      title: 'FoodScholar: vprašaj o hrani in prehrani',
      summary: 'Postavi vprašanje in dobi odgovor, ki temelji na znanstvenih raziskavah in uradnih prehranskih smernicah, z vsemi viri.',
      features: {
        'ask': {
          title: 'Postavi vprašanje',
          body: 'Vprašaj karkoli o hrani, prehrani ali zdravju, s svojimi besedami.',
          steps: [
            'Preveri, da je izbrano: [[foodScholarHome.qa.tabs.askQuestions]].',
            'Vprašanje vpiši v polje ali klikni enega od predlaganih vprašanj.',
            'Pritisni Enter ali gumb s puščico.',
            'Preberi odgovor ([[foodScholarHome.qa.answer]]). Številke v besedilu kažejo na uporabljene vire.'
          ],
          note: 'Včasih FoodScholar postavi kratko vprašanje nazaj, da te bolje razume.'
        },
        'sources': {
          title: 'Preveri vire',
          body: 'Vsaka trditev v odgovoru vodi do raziskave ali smernice, iz katere izhaja.',
          steps: [
            'Klikni številko v odgovoru, da vidiš odlomek, na katerem temelji.',
            'Celotna raziskava: [[foodScholarHome.qa.passagePeek.openArticle]].',
            'Vsi viri so tukaj: [[foodScholarHome.qa.sidebar.cited]] in [[foodScholarHome.qa.sidebar.consulted]].'
          ]
        },
        'follow-up': {
          title: 'Vprašaj naprej ali začni znova',
          body: 'Nadaljuj pogovor; FoodScholar si zapomni prejšnja vprašanja.',
          steps: [
            'Klikni vprašanje tukaj: [[foodScholarHome.qa.followUpSuggestions]], ali vpiši svoje.',
            'Nova tema: [[foodScholarHome.qa.thread.new]].'
          ]
        },
        'rate': {
          title: 'Povej, ali je odgovor pomagal',
          body: 'Tvoja ocena nam pomaga izboljšati odgovore.',
          steps: [
            'Pod odgovorom ([[foodScholarHome.qa.feedback.helpfulQuestion]]) klikni: [[foodScholarHome.common.yes]] ali [[foodScholarHome.common.no]].',
            'Če je odgovor »ne«, na kratko opiši, kaj je šlo narobe.',
            'Ko vidiš dva odgovora drug ob drugem, klikni tistega, ki ti je bolj všeč.'
          ]
        },
        'advanced': {
          title: 'Napredne nastavitve',
          body: 'Za raziskovalce in strokovnjake: izberi, kako se odgovori pripravijo in razložijo.',
          steps: [
            'Ob polju za vprašanje klikni: [[foodScholarHome.qa.advanced.title]].',
            'Vklopi napredne možnosti, nato spremeni metodo, model, globino virov ali slog razlage.',
            'Vprašanje postavi kot običajno.'
          ]
        },
        'library': {
          title: 'Brskaj po knjižnici',
          body: 'Neposredno išči med znanstvenimi članki, nacionalnimi prehranskimi vodniki in učbeniki.',
          steps: [
            'Klikni zavihek: [[foodScholarHome.qa.tabs.library]].',
            'Vpiši v iskalno polje in pritisni Enter ali izberi predlog.',
            'Ali odpri razdelek: članki, prehranski vodniki, učbeniki ali hierarhija znanja.'
          ]
        }
      }
    },

    'foodscholar-catalog': {
      title: 'Iskanje znanstvenih člankov',
      summary: 'Poišči raziskave tako, da opišeš, kaj iščeš, nato seznam zoži s filtri.',
      features: {
        search: {
          title: 'Iskanje z navadnimi besedami',
          body: 'Temo opiši tako, kot bi jo človeku; natančne ključne besede niso potrebne.',
          steps: [
            'Vpiši v iskalno polje, na primer »zdravje črevesja in probiotiki«.',
            'Ali klikni enega od primerov iskanja pod poljem.',
            'Pritisni Enter in odpri kateri koli članek med zadetki.'
          ]
        },
        filters: {
          title: 'Zoži zadetke',
          body: 'Filtriraj po temi, letu, vrsti raziskave, starostni skupini, državi in drugem.',
          steps: [
            'Klikni: [[foodScholarCatalog.filters.show]].',
            'Izberi filtre; seznam se takoj posodobi.',
            'Filter odstraniš tukaj: [[foodScholarCatalog.activeFilters]], vse pa z: [[foodScholarCatalog.actions.resetAllFilters]].',
            'Vrstni red spremeniš tukaj: [[foodScholarCatalog.sort.label]].'
          ]
        },
        summary: {
          title: 'Preberi povzetek UI',
          body: 'Po iskanju povzetek ([[foodScholarCatalog.summary.title]]) strne, kaj pravijo najboljši zadetki.',
          steps: [
            'Zaženi iskanje.',
            'Preberi povzetek nad zadetki in klikni: [[foodScholarCatalog.summary.clickToReadMore]].',
            'Klikni temo tukaj ([[foodScholarCatalog.summary.relatedTopics]]), da jo poiščeš.'
          ],
          note: 'Povzetek ustvari umetna inteligenca iz člankov. Podrobnosti preveri v člankih.'
        }
      }
    },

    'foodscholar-article': {
      title: 'Branje članka',
      summary: 'Vsaka stran članka razloži raziskavo v preprostem jeziku, s ključnimi ugotovitvami in tem, kako trdni so dokazi.',
      features: {
        read: {
          title: 'Razumi raziskavo',
          body: 'Začni s preprosto različico, nato po želji pojdi globlje.',
          steps: [
            'Lažja različica povzetka: [[foodScholarArticle.actions.simplify]].',
            'Preberi: [[foodScholarArticle.sections.keyTakeaways]].',
            'Kako trdni so dokazi: [[foodScholarArticle.sections.studyEvaluation]].'
          ]
        },
        questions: {
          title: 'Vprašanja in odgovori',
          body: 'Pogosta vprašanja o raziskavi z odgovori za različne bralce.',
          steps: [
            'Pojdi na: [[foodScholarArticle.sections.qa]].',
            'Izberi: [[foodScholarArticle.qaTabs.forYou]], [[foodScholarArticle.qaTabs.forPractitioners]] ali [[foodScholarArticle.qaTabs.forExperts]].'
          ]
        },
        save: {
          title: 'Shrani ali deli',
          body: 'Obdrži članek v Moji knjižnici ali ga pošlji komu.',
          steps: [
            'Klikni: [[foodScholarArticle.actions.save]]; ko je shranjen, piše: [[foodScholarArticle.actions.saved]].',
            'Deljenje: [[foodScholarArticle.actions.copyLink]].'
          ],
          note: 'Za shranjevanje potrebuješ izbran profil.'
        }
      }
    },

    'foodscholar-guides': {
      title: 'Prehranski vodniki po državah',
      summary: 'Preberi uradne prehranske smernice evropskih držav in primerjaj njihova pravila.',
      features: {
        find: {
          title: 'Poišči vodnik',
          body: 'Išči med vsemi vodniki po naslovu, državi ali temi.',
          steps: [
            'Vpiši v iskalno polje za vodnike.',
            'Ali seznam zoži z gumbi držav.',
            'Klikni vodnik, da ga odpreš.'
          ]
        },
        map: {
          title: 'Raziskuj na zemljevidu',
          body: 'Poglej, katere države imajo vodnike, in jih odpri z zemljevida.',
          steps: [
            'Klikni zavihek: [[=Map]].',
            'Klikni državo na zemljevidu ali na seznamu ob njem.',
            'Vodniki te države: [[=Open explorer]].'
          ],
          note: 'Na zaslonu na dotik najprej tapni [[guidelines.map.explore]], da lahko premikaš in povečuješ zemljevid.'
        },
        explorer: {
          title: 'Filtriraj pravila države',
          body: 'Vsaka stran države našteje njene vodnike in posamezna pravila v njih.',
          steps: [
            'Odpri zavihek: [[=Guidelines]].',
            'Filtriraj po temi, ciljni skupini, vodniku ali letu.',
            'Še bolj zoži: [[guidelines.filters.lifeStage]], [[guidelines.filters.foodGroup]] ali [[guidelines.filters.nutrient]].',
            'Za nov začetek: [[guidelines.filters.clear]].'
          ]
        },
        read: {
          title: 'Preberi vodnik',
          body: 'Dokument vodnika in njegova pravila sta drug ob drugem.',
          steps: [
            'Odpri vodnik.',
            'Pravila preiščeš s poljem nad seznamom ([[guidelines.panes.rules]]).',
            'Na telefonu na vrhu preklapljaš: [[guidelines.panes.document]] in [[guidelines.panes.rules]].',
            'Z gumbom za shranjevanje ga dodaš v Mojo knjižnico.'
          ]
        }
      }
    },

    'foodscholar-textbooks': {
      title: 'Učbeniki',
      summary: 'Učbeniki o prehrani, po katerih lahko iščeš, pokukaš vanje in jih preneseš.',
      features: {
        find: {
          title: 'Poišči učbenik',
          body: 'Išči po naslovu, avtorju ali temi ter filtriraj po jeziku, ciljni skupini ali regiji.',
          steps: [
            'Vpiši v iskalno polje.',
            'Filtri po jeziku, ciljni skupini ali regiji: [[=Show filters]].',
            'Klikni učbenik, da ga odpreš.'
          ]
        },
        inside: {
          title: 'Pokukaj vanj',
          body: 'Poglej pomembne odlomke, preden preneseš knjigo.',
          steps: [
            'Odpri učbenik.',
            'Preberi odlomke tukaj: [[=Inside this textbook]].',
            'Celotna knjiga: [[=Download PDF]]. Z gumbom za shranjevanje jo dodaš v Mojo knjižnico.'
          ]
        }
      }
    },

    'foodscholar-hierarchy': {
      title: 'Hierarhija znanja',
      summary: 'Brskaj, kako so povezani živila, hranila in zdravstvene teme, ter kateri dokazi so za vsako povezavo.',
      features: {
        search: {
          title: 'Iskanje v hierarhiji',
          body: 'Skoči naravnost do živila, hranila ali teme.',
          steps: [
            'Vpiši v iskalno polje na vrhu.',
            'Izberi zadetek, da se odpre v drevesu.'
          ]
        },
        browse: {
          title: 'Brskanje in dokazi',
          body: 'Odpiraj veje drevesa in beri, kaj podpira posamezen element.',
          steps: [
            'Razširi vrstice tukaj: [[graph.tree.title]].',
            'Klikni element, da vidiš: [[graph.inspector.title]].',
            'Več odlomkov: [[graph.inspector.moreEvidence]].'
          ]
        },
        ask: {
          title: 'Zoži ali vprašaj',
          body: 'Drevo zoži na en element ali o njem vprašaj FoodScholar.',
          steps: [
            'Samo vsebina pod elementom: [[graph.inspector.scopeHere]].',
            'Vprašanje o njem za FoodScholar: [[graph.inspector.askAbout]].'
          ]
        }
      }
    },

    'recipes': {
      title: 'RecipeWrangler: poišči recepte',
      summary: 'Išči med tisoči receptov, izloči alergene, primerjaj jih drug ob drugem in analiziraj svoje.',
      features: {
        search: {
          title: 'Iskanje receptov',
          body: 'Opiši, česa se ti zahoče; uporabiš lahko cele stavke.',
          steps: [
            'Vpiši v iskalno polje, na primer »hitre veganske večerje«.',
            'Pritisni Enter ali klikni ikono za iskanje.',
            'Ali izberi predlog, nedavno iskanje ali kategorijo.',
            'Klikni recept, da ga odpreš.'
          ]
        },
        personalized: {
          title: 'Zadetki, ki ti ustrezajo',
          body: 'Ko je to vklopljeno ([[recipeWrangler.search.personalized]]), zadetki upoštevajo prehrano in alergije profila, ki ga uporabljaš.',
          steps: [
            'Ob filtrih pusti vklopljeno: [[recipeWrangler.search.personalized]].',
            'Izklopi, če želiš videti vse recepte, na primer ko ni zadetkov.'
          ],
          note: 'Potreben je izbran profil.'
        },
        filters: {
          title: 'Filtriranje in razvrščanje',
          body: 'Izloči alergene, izberi prehrano in kuhinjo ali začni s pripravljenim filtrom.',
          steps: [
            'Klikni: [[recipeWrangler.filters.show]] (na telefonu: [[recipeWrangler.filters.open]]).',
            'Uporabi [[recipeWrangler.filters.excludeAllergens]] in [[recipeWrangler.filters.dietTags]] ali pripravljen filter ([[recipeWrangler.filters.quickFilters]]).',
            'Vrstni red: [[recipeWrangler.filters.sortBy]].',
            'Filter odstraniš z oznako pod iskalnim poljem, vse pa z: [[recipeWrangler.filters.clearAll]].'
          ]
        },
        compare: {
          title: 'Primerjaj recepte',
          body: 'Do štiri recepte postavi drug ob drugega: Nutri-Score, čas, kalorije in hranila.',
          steps: [
            'Označi kvadratek levo zgoraj na kartici recepta.',
            'Označi vsaj še enega (največ štiri).',
            'Klikni gumb za primerjavo, ki se prikaže.'
          ]
        },
        analyze: {
          title: 'Analiziraj svoj recept',
          body: 'Prilepi kateri koli recept in dobi njegovo hranilno vrednost, Nutri-Score, vpliv na okolje in ceno.',
          steps: [
            'Odpri zavihek: [[=Analyze Recipe]].',
            'Prilepi besedilo recepta (najbolje deluje s sestavinami in količinami).',
            'Izberi svojo regijo.',
            'Klikni [[recipeWrangler.analyzer.analyze]] in preberi rezultate.'
          ],
          note: 'Prilepi besedilo samo; povezave do spletnih strani z recepti ne delujejo.'
        },
        favorites: {
          title: 'Tvoji priljubljeni',
          body: 'Recepte označi s srčkom, da jih hitro znova najdeš.',
          steps: [
            'Klikni srček na kartici recepta.',
            'Z gumbom s srčkom nad zadetki prikažeš samo priljubljene.',
            'Vse najdeš tudi v Moji knjižnici.'
          ]
        },
        sources: {
          title: 'Od kod so recepti in številke',
          body: 'Recepti izhajajo iz objavljenih zbirk, hranilne vrednosti pa iz nacionalnih tabel sestave živil.',
          steps: [
            'Na glavni strani se pomakni do: [[=Recipe Collections]] ali [[=Food Composition Tables]].',
            'Odpri eno, da vidiš, od kod je in kaj vsebuje.'
          ]
        }
      }
    },

    'recipe': {
      title: 'Recept od blizu',
      summary: 'Poglej, kako zdrav in trajnosten je recept, prilagodi število porcij, zamenjaj sestavine in naredi boljšo različico.',
      features: {
        scores: {
          title: 'Ocene na prvi pogled',
          body: 'Pas na vrhu prikazuje [[recipeWrangler.recipe.nutriScore]], vpliv na okolje in, kadar je znana, ceno.',
          steps: [
            'Preberi črko ([[recipeWrangler.recipe.nutriScore]]): A je najbolj zdravo, E najmanj.',
            'Klikni ? ob njej, da vidiš, kako je bila ocena izračunana.',
            'Poglej še: [[recipeWrangler.detail.sustainability.label]] (CO₂ na porcijo) in [[recipeWrangler.recipe.cost.label]] (cenovni razred).'
          ],
          note: 'Vsi recepti še nimajo podatkov o ceni.'
        },
        nutrition: {
          title: 'Podrobnosti o hranilni vrednosti',
          body: 'Kalorije in hranila za eno porcijo ali na 100 g.',
          steps: [
            'Pojdi na: [[recipeWrangler.detail.nutritionalInfo]].',
            'Preklopi: [[recipeWrangler.detail.basisPerServing]] / [[recipeWrangler.detail.basisPer100g]].',
            'Preklopi: [[recipeWrangler.detail.chartView]] / [[recipeWrangler.detail.gridView]].'
          ]
        },
        servings: {
          title: 'Porcije in nadomestki',
          body: 'Kuhaj za več ali manj ljudi ali zamenjaj sestavino, ki je nimaš.',
          steps: [
            'Uporabi + in − ob: [[recipeWrangler.detail.scale.label]]; količine se posodobijo.',
            'Klikni ikono za zamenjavo ob sestavini ([[recipeWrangler.detail.substitution.action]]).',
            'S seznama izberi nadomestek.'
          ]
        },
        improve: {
          title: 'Naj bo bolj zdravo ali bolj zeleno',
          body: 'Dobi predloge za izboljšavo recepta in shrani svojo različico.',
          steps: [
            'Ob sestavinah klikni: [[recipeWrangler.detail.adaptation.improve]].',
            'Izberi: [[recipeWrangler.detail.adaptation.modeNutrition]], [[recipeWrangler.detail.adaptation.modeSustainability]] ali [[recipeWrangler.detail.adaptation.modeReduce]].',
            'Preglej predlagane spremembe.',
            'Klikni: [[recipeWrangler.detail.adaptation.save]].'
          ],
          note: 'Na voljo, ko je hranilna vrednost recepta izračunana.'
        },
        save: {
          title: 'Shrani ga',
          body: 'Obdrži recept v Moji knjižnici.',
          steps: [
            'Na vrhu strani klikni: [[recipeWrangler.recipe.save]].',
            'V Moji knjižnici ga najdeš tukaj: [[library.savedRecipes]].'
          ]
        },
        report: {
          title: 'Prijavi težavo z receptom',
          body: 'Napačni alergeni, čudne količine, koraki, ki ne delujejo: povej našim urednikom.',
          steps: [
            'Klikni zastavico na vrhu: [[report.trigger]].',
            'Izberi, kaj je narobe.',
            'Po želji dodaj nekaj besed, nato klikni: [[report.send]].'
          ]
        }
      }
    },

    'recipes-compare': {
      title: 'Primerjava receptov',
      summary: 'Do štirje recepti drug ob drugem, vrstico za vrstico.',
      features: {
        read: {
          title: 'Branje primerjave',
          body: 'Vsaka vrstica primerja eno stvar: Nutri-Score, čas, porcije, kalorije in hranila.',
          steps: [
            'Beri vrstico od leve proti desni, da primerjaš recepte.',
            'Klikni ime recepta, da ga odpreš.',
            'Na telefonu izberi dva recepta, ki ju želiš videti drug ob drugem.'
          ]
        },
        manage: {
          title: 'Spremeni, kaj primerjaš',
          body: 'Vrni se na iskanje in dodaj druge ali začni znova.',
          steps: [
            'Vrni se v RecipeWrangler in označi druge recepte.',
            'Izprazni primerjavo: [[recipeWrangler.comparePage.clearAll]].'
          ]
        }
      }
    },

    'library': {
      title: 'Moja knjižnica',
      summary: 'Vse, kar shraniš v WiseFoodu, na enem mestu.',
      features: {
        saved: {
          title: 'Tvoje shranjene stvari',
          body: 'Shranjeni recepti, članki, prehranski vodniki in učbeniki so tukaj, razvrščeni po vrsti.',
          steps: [
            'Shranjuj sproti: srček na receptu, gumb za shranjevanje na članku, vodniku ali učbeniku.',
            'Od tu odpreš kar koli.',
            'Še nič? Začni tukaj: [[library.emptyCta]].'
          ],
          note: 'Shranjene stvari pripadajo profilu, ki je v uporabi. Zamenjaj profil, da vidiš stvari druge osebe.'
        },
        plans: {
          title: 'Shranjeni načrti obrokov',
          body: 'Načrti, ki jih obdržiš v FoodChatu, so tukaj: [[library.savedPlans]].',
          steps: [
            'Poišči načrt po datumu.',
            'Odpri ga ali ga spreminjaj naprej: [[library.planOpen]].'
          ]
        }
      }
    },

    'my-profile': {
      title: 'Moj profil',
      summary: 'Kar WiseFood ve o profilu v uporabi: prehrana, alergije, kaj ima rad in česa ne. Vsaka aplikacija to uporablja za prilagajanje.',
      features: {
        'quick-setup': {
          title: 'Hitra nastavitev',
          body: 'Odgovori na nekaj vprašanj in naenkrat nastavi prehrano, alergije ter priljubljena in nepriljubljena živila.',
          steps: [
            'Klikni: [[myProfile.actions.quickSetup]].',
            'Pojdi skozi korake.',
            'Na koncu klikni: [[preferencesWizard.actions.save]].'
          ]
        },
        'diet-allergies': {
          title: 'Prehrana in alergije',
          body: 'WiseFood nikoli ne predlaga hrane, ki je v nasprotju z alergijo, navedeno tukaj.',
          steps: [
            'Tukaj ([[myProfile.sections.dietaryPreferences]]) klikni [[myProfile.actions.add]] in izberi prehrano.',
            'Tukaj ([[myProfile.sections.allergiesAndIntolerances]]) klikni [[myProfile.actions.add]] in izberi, čemu se izogibaš.',
            'Z ikono koša odstraniš vnos.'
          ]
        },
        'likes': {
          title: 'Živila, ki so ti všeč in ki ti niso',
          body: 'Recepti in načrti dajejo prednost temu, kar ti je všeč, in izpustijo, kar ti ni.',
          steps: [
            'Tukaj ([[myProfile.sections.foodLikes]] ali [[myProfile.sections.foodDislikes]]) klikni: [[myProfile.actions.add]].',
            'Išči ali brskaj in označi živila.',
            'Potrdi. Z × na živilu ga odstraniš.'
          ]
        },
        'memory': {
          title: 'Kaj si WiseFood zapomni',
          body: 'Ko v pogovoru dovoliš, si WiseFood zapomni stvari, kot so cilji ali navade. Vedno jih lahko vidiš, popraviš ali odstraniš.',
          steps: [
            'Pojdi na: [[myProfile.sections.memory]].',
            'Klikni ?, da vidiš: [[myProfile.memory.why.title]].',
            'S svinčnikom popraviš vnos, s tem pa ga izbrišeš: [[myProfile.memory.forget]].'
          ]
        },
        'details': {
          title: 'Ime, slika in podatki',
          body: 'Spremeni ime profila, starostno skupino ali sliko.',
          steps: [
            'Klikni [[myProfile.actions.edit]] (tukaj: [[myProfile.sections.profileDetails]]).',
            'S svinčnikom na sliki izbereš drugo.',
            'Shrani spremembe.'
          ]
        },
        'privacy': {
          title: 'Zasebnost in tvoji podatki',
          body: 'Ti odločaš, kaj zbiramo, in vse lahko izbrišeš.',
          steps: [
            'Vklopi ali izklopi: [[myProfile.privacy.analyticsTitle]].',
            'Kaj vse hranimo: [[myProfile.dataKept.title]].',
            'Izbris profila, gospodinjstva ali računa: [[myProfile.sections.dangerZone]].'
          ],
          note: 'Izbrisa ni mogoče razveljaviti.'
        }
      }
    },

    'profiles': {
      title: 'Profili v tvojem gospodinjstvu',
      summary: 'Vsaka oseba v gospodinjstvu ima svoj profil z lastno prehrano, alergijami in shranjenimi stvarmi. Izberi, za koga uporabljaš WiseFood.',
      features: {
        choose: {
          title: 'Izberi profil',
          body: 'Vse, kar narediš potem, velja za to osebo.',
          steps: [
            'Klikni sliko osebe.',
            'Pozneje zamenjaš s sliko desno zgoraj: [[header.menu.switchProfile]].'
          ]
        },
        add: {
          title: 'Dodaj osebo',
          body: 'Dodaj profil za vsako osebo, za katero načrtuješ obroke.',
          steps: [
            'Klikni: [[profileSelection.actions.addProfile]].',
            'Vpiši ime in po želji starostno skupino ter izberi sliko.',
            'Klikni: [[profileSelection.actions.createProfile]].'
          ],
          note: 'Prehrano in alergije nato nastavi na strani Moj profil.'
        },
        manage: {
          title: 'Odstrani profil',
          body: 'Odstrani profile, ki jih ne potrebuješ več.',
          steps: [
            'Klikni: [[profileSelection.actions.manageProfiles]].',
            'Klikni rdeči × na profilu in potrdi.',
            'Klikni: [[profileSelection.actions.done]].'
          ]
        },
        setup: {
          title: 'Prva nastavitev',
          body: 'Ob prvem obisku kratek vodič nastavi tvoje gospodinjstvo in tvoj profil.',
          steps: [
            'Gospodinjstvu daj ime in po želji državo.',
            'Dodaj svoje ime, starostno skupino in prehrano.',
            'Končaj ali preskoči in to naredi pozneje.'
          ]
        }
      }
    }
  }
}

export default sl
