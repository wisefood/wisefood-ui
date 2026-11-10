"""On-screen words for every clip, per interface language.

English is the reference. Titles are the help panel's own feature titles, so
the clip and the panel name the task the same way. Hungarian and Slovenian
use the informal address of the help text (te / ti) and need a native-speaker
read before they reach participants.
"""

T = {
    'foodscholar-ask': {
        'en': {
            'title': 'Ask a question',
            'q': 'How much salt should an adult eat per day?',
            'c1': 'Type your question in your own words',
            'c2': 'Press Enter or the arrow',
            'fast': 'Sped up',
            'c3': 'The answer is built from studies and official dietary guidelines',
            'c4': 'Every source it used is listed on the right',
        },
        'hu': {
            'title': 'Kérdés feltevése',
            'q': 'Mennyi sót egyen naponta egy felnőtt?',
            'c1': 'Írd be a kérdésed a saját szavaiddal',
            'c2': 'Nyomd meg az Entert vagy a nyilat',
            'fast': 'Gyorsítva',
            'c3': 'A válasz tanulmányokon és hivatalos táplálkozási ajánlásokon alapul',
            'c4': 'A felhasznált források a jobb oldalon vannak',
        },
        'sl': {
            'title': 'Postavi vprašanje',
            'q': 'Koliko soli naj odrasla oseba poje na dan?',
            'c1': 'Vprašanje napiši s svojimi besedami',
            'c2': 'Pritisni Enter ali puščico',
            'fast': 'Pospešeno',
            'c3': 'Odgovor temelji na raziskavah in uradnih prehranskih smernicah',
            'c4': 'Vsi uporabljeni viri so na desni',
        },
    },
    'foodscholar-memory': {
        'en': {
            'title': 'Let FoodScholar remember',
            'q': "I don't eat meat. How can I get enough protein?",
            'c1': 'Ask as usual, and say what matters to you',
            'c2': 'FoodScholar offers to remember it',
            'c3': 'Nothing is saved until you click Remember',
            'c4': 'See it, correct it or remove it in your profile',
            'fast': 'Sped up',
        },
        'hu': {
            'title': 'A FoodScholar megjegyezheti',
            'q': 'Nem eszem húst. Hogyan juthatok elég fehérjéhez?',
            'c1': 'Kérdezz, ahogy szoktál, és mondd el, mi fontos neked',
            'c2': 'A FoodScholar felajánlja, hogy megjegyzi',
            'c3': 'Semmi sem mentődik, amíg nem kattintasz a Jegyezd meg gombra',
            'c4': 'A profilodban megnézheted, javíthatod vagy törölheted',
            'fast': 'Gyorsítva',
        },
        'sl': {
            'title': 'Naj si FoodScholar zapomni',
            'q': 'Ne jem mesa. Kako dobim dovolj beljakovin?',
            'c1': 'Vprašaj kot običajno in povej, kaj ti je pomembno',
            'c2': 'FoodScholar ponudi, da si to zapomni',
            'c3': 'Nič se ne shrani, dokler ne klikneš Zapomni si',
            'c4': 'V profilu to vidiš, popraviš ali izbrišeš',
            'fast': 'Pospešeno',
        },
    },
    'foodscholar-sources': {
        'en': {
            'title': 'Check the sources',
            'q': 'How much salt should an adult eat per day?',
            'q2': 'And for children?',
            'c1': 'Click a citation in the answer',
            'c2': 'See the exact rule or passage it comes from',
            'c3': 'Ask a follow-up: FoodScholar remembers the conversation',
            'fast': 'Sped up',
        },
        'hu': {
            'title': 'A források ellenőrzése',
            'q': 'Mennyi sót egyen naponta egy felnőtt?',
            # Naming an age: a bare "És a gyerekek?" always got a which-age question back.
            'q2': 'És a 4–8 éves gyerekeknek mennyi?',
            'c1': 'Kattints egy hivatkozásra a válaszban',
            'c2': 'Látod a pontos ajánlást vagy szövegrészt, amelyből származik',
            'c3': 'Kérdezz tovább: a FoodScholar emlékszik a beszélgetésre',
            'fast': 'Gyorsítva',
        },
        'sl': {
            'title': 'Preveri vire',
            'q': 'Koliko soli naj odrasla oseba poje na dan?',
            'q2': 'Kaj pa otroci?',
            'c1': 'Klikni sklic v odgovoru',
            'c2': 'Vidiš natančno smernico ali odlomek, iz katerega izhaja',
            'c3': 'Vprašaj naprej: FoodScholar si zapomni pogovor',
            'fast': 'Pospešeno',
        },
    },
    'foodscholar-catalog-search': {
        'en': {
            'title': 'Search scientific articles',
            'query': 'eating more vegetables and heart disease',
            'c1': 'Describe the topic as you would to a person',
            'c2': 'An AI summary sums up what the top studies say',
            'c3': 'Open a study to read it',
            'fast': 'Sped up',
        },
        'hu': {
            'title': 'Tudományos cikkek keresése',
            # The articles are in English and search finds nothing in Hungarian.
            'query': 'eating more vegetables and heart disease',
            'c1': 'A cikkek angolul vannak: írd le a témát angolul, egyszerű szavakkal',
            'c2': 'Az MI-összefoglaló elmondja, mit mutatnak a legjobb tanulmányok',
            'c3': 'Nyiss meg egy tanulmányt az elolvasásához',
            'fast': 'Gyorsítva',
        },
        'sl': {
            'title': 'Iskanje znanstvenih člankov',
            # The articles are in English and search finds nothing in Slovenian.
            'query': 'eating more vegetables and heart disease',
            'c1': 'Članki so v angleščini: temo opiši v angleščini, s preprostimi besedami',
            'c2': 'Povzetek UI strne, kaj pravijo najboljše raziskave',
            'c3': 'Odpri raziskavo in jo preberi',
            'fast': 'Pospešeno',
        },
    },
    'foodscholar-article': {
        # Filtering by a topic finds enriched articles: those have the
        # plain-language abstract, "How sure are we?" and the Q&A.
        'en': {
            'title': 'Understand the study',
            'filters_label': 'Show Filters', 'simplify_label': 'Simplify', 'tab2_label': 'For Practitioners',
            'c1': 'Open the filters and pick a topic',
            'c2': 'Open a study',
            'c3': 'Read it in plain words',
            'c4': 'See how sure we can be about the result',
            'c5': 'Questions and answers, for you or for professionals',
            'fast': 'Sped up',
        },
        'hu': {
            'title': 'A tanulmány megértése',
            'filters_label': 'Szűrők megjelenítése', 'simplify_label': 'Egyszerűsítés', 'tab2_label': 'Szakembereknek',
            'c1': 'Nyisd meg a szűrőket, és válassz egy témát',
            'c2': 'Nyiss meg egy tanulmányt',
            'c3': 'Olvasd el egyszerű szavakkal',
            'c4': 'Nézd meg, mennyire lehetünk biztosak az eredményben',
            'c5': 'Kérdések és válaszok neked vagy szakembereknek',
            'fast': 'Gyorsítva',
        },
        'sl': {
            'title': 'Razumi raziskavo',
            'filters_label': 'Prikaži filtre', 'simplify_label': 'Poenostavi', 'tab2_label': 'Za strokovnjake',
            'c1': 'Odpri filtre in izberi temo',
            'c2': 'Odpri raziskavo',
            'c3': 'Preberi jo s preprostimi besedami',
            'c4': 'Poglej, kako zanesljiv je rezultat',
            'c5': 'Vprašanja in odgovori zate ali za strokovnjake',
            'fast': 'Pospešeno',
        },
    },
    'foodscholar-guides-map': {
        'en': {
            'title': 'Explore by map',
            'country': 'IE',
            'c1': 'Switch to the map',
            'c2': 'Pick a country on the map or in the list',
            'c3': 'Open its dietary guides',
        },
        'hu': {
            'title': 'Felfedezés térképen',
            'country': 'HU',
            'c1': 'Válts a térképre',
            'c2': 'Válassz egy országot a térképen vagy a listában',
            'c3': 'Nyisd meg a táplálkozási útmutatóit',
        },
        'sl': {
            'title': 'Raziskuj na zemljevidu',
            'country': 'SI',
            'c1': 'Preklopi na zemljevid',
            'c2': 'Izberi državo na zemljevidu ali na seznamu',
            'c3': 'Odpri njene prehranske vodnike',
        },
    },
    'foodscholar-guides-explorer': {
        'en': {
            'title': 'Filter a country’s rules',
            'country': 'IE',
            'slug': 'ireland',
            'c1': 'Open the rules of all its guides',
            'c2': 'Narrow them by topic or age group',
            'c3': 'Each rule shows who it is for and what it is about',
        },
        'hu': {
            'title': 'Egy ország szabályainak szűrése',
            'country': 'HU',
            'slug': 'hungary',
            'c1': 'Nyisd meg az összes útmutató szabályait',
            'c2': 'Szűkítsd téma vagy korcsoport szerint',
            'c3': 'Minden szabálynál látod, kinek szól és miről',
        },
        'sl': {
            'title': 'Filtriraj pravila države',
            'country': 'SI',
            'slug': 'slovenia',
            'c1': 'Odpri pravila vseh njenih vodnikov',
            'c2': 'Zoži jih po temi ali starostni skupini',
            'c3': 'Pri vsakem pravilu vidiš, komu je namenjeno in o čem govori',
        },
    },
    'foodscholar-hierarchy': {
        'en': {
            'title': 'Browse and read the evidence',
            'query': 'vitamin D',
            'c1': 'Search for a food, a nutrient or a topic',
            'c2': 'Read what the evidence says, and how strong it is',
            'c3': 'Narrow the tree down to it',
        },
        'hu': {
            'title': 'Böngészés és bizonyítékok',
            'query': 'vitamin D',
            'c1': 'Keress egy élelmiszerre, tápanyagra vagy témára',
            'c2': 'Olvasd el, mit mondanak a bizonyítékok, és mennyire erősek',
            'c3': 'Szűkítsd le rá a fát',
        },
        'sl': {
            'title': 'Brskanje in dokazi',
            'query': 'vitamin D',
            'c1': 'Poišči živilo, hranilo ali temo',
            'c2': 'Preberi, kaj pravijo dokazi in kako močni so',
            'c3': 'Zoži drevo nanj',
        },
    },
    'foodscholar-textbooks': {
        'en': {
            'title': 'Find a textbook',
            'query': 'nutrition',
            'c1': 'Search by title, author or topic',
            'c2': 'Open a textbook',
            'c3': 'Look inside before you download it',
        },
        'hu': {
            'title': 'Tankönyv keresése',
            'query': 'nutrition',
            'c1': 'Keress cím, szerző vagy téma szerint',
            'c2': 'Nyiss meg egy tankönyvet',
            'c3': 'Lapozz bele, mielőtt letöltöd',
        },
        'sl': {
            'title': 'Poišči učbenik',
            'query': 'nutrition',
            'c1': 'Išči po naslovu, avtorju ali temi',
            'c2': 'Odpri učbenik',
            'c3': 'Pokukaj vanj, preden ga preneseš',
        },
    },
}
