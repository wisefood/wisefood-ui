import type { HelpContent } from '../types'

const en: HelpContent = {
  ui: {
    button: 'Help',
    title: 'Help',
    close: 'Close help',
    whatYouCanDo: 'What you can do here',
    tips: 'Good to know',
    allTopics: 'All help topics',
    backToPage: 'Back to this page',
    thisPage: 'This page',
    showMe: 'Show me',
    tourStarting: 'Starting the walkthrough…',
    tourUnavailable: 'This walkthrough isn’t ready yet',
    tourUnavailableBody: 'Follow the steps in the help panel for now.',
    watch: 'Watch',
    videoLabel: 'Short video: {title}',
    stillStuck: 'Still stuck?',
    stillStuckBody: 'Tell us what you were trying to do. Every message is read.',
    sendFeedback: 'Send feedback',
    reportBug: 'Report a bug',
    noTopic: 'There is no help written for this page yet. Pick a topic below.',
    keyboardHint: 'Press ? to open help on any page',
    areas: {
      start: 'Getting started',
      foodchat: 'FoodChat',
      foodscholar: 'FoodScholar',
      recipewrangler: 'RecipeWrangler',
      account: 'Your account'
    }
  },
  topics: {
    'dashboard': {
      title: 'Your dashboard',
      summary: 'Your starting point: open an app, see today’s meals and pick up where you left off.',
      features: {
        'open-apps': {
          title: 'Open an app',
          body: 'WiseFood has three apps. FoodScholar answers food and nutrition questions, RecipeWrangler finds and improves recipes, and FoodChat plans meals for you.',
          steps: [
            'Click a card: [[dashboard.apps.foodScholar.title]], [[dashboard.apps.recipeWrangler.title]] or [[dashboard.apps.foodChat.title]].',
            'Click the small (i) on a card to see what is inside before opening it.',
            'Come back here at any time with the WiseFood logo at the top left.'
          ]
        },
        'todays-meals': {
          title: 'See today’s meals',
          body: '[[dashboard.schedule.title]] shows the meals planned for today, with the current one marked [[dashboard.schedule.now]].',
          steps: [
            'Click a meal to open its recipe.',
            'Click [[dashboard.schedule.refineInFoodChat]] to change the plan, or [[dashboard.schedule.createInFoodChat]] if you have none yet.',
            'Click [[share.button]] to send the plan to someone by link or email.'
          ]
        },
        'tips': {
          title: 'Today’s tip',
          body: '[[dashboard.spotlight.badge]] shows a short tip or fact about food and health, and changes from day to day.',
          steps: [
            'Read the tip on the card.',
            'When the tip comes from a study, follow its link to read more in FoodScholar.'
          ]
        },
        'recommendations': {
          title: 'Recipes picked for you',
          body: '[[dashboard.recipes.recommendedForYou]] suggests recipes that fit the profile you are using.',
          steps: [
            'Click a recipe to open it.',
            'Use the link under the cards to search all recipes in RecipeWrangler.'
          ],
          note: 'The more you tell WiseFood on My Profile, the better these suggestions fit.'
        },
        'switch-profile': {
          title: 'Switch who you are planning for',
          body: 'A household can have several profiles. Everything you save and every plan belongs to the profile in use.',
          steps: [
            'Click your picture at the top right.',
            'Choose [[header.menu.switchProfile]].',
            'Pick the person you want to plan for.'
          ]
        },
        'guest': {
          title: 'You are trying WiseFood as a guest',
          body: 'Everything works, but your data is temporary and is deleted when the guest session ends.',
          steps: [
            'To keep what you made, click [[claim.cta]] in the banner at the top.',
            'Enter your email, name and a password, then confirm.',
            'Sign in again with the new account; nothing is lost.'
          ],
          note: 'Leaving instead? [[auth.guestErase]] deletes your guest data right away.'
        }
      }
    },

    'foodchat': {
      title: 'FoodChat: plan your meals',
      summary: 'Tell FoodChat what you want to eat and it builds a day or week of meals that fits your household, then changes it as you chat.',
      features: {
        'generate-plan': {
          title: 'Get a meal plan',
          body: 'Describe what you would like in your own words, or start from a suggestion.',
          steps: [
            'Type what you want in the box, for example “a gluten-free week, high protein”.',
            'Or click a suggestion such as [[foodChatHome.suggestedQuestions.dailyPlan]] or [[foodChatHome.suggestedQuestions.weeklyPlan]].',
            'Press Enter or the arrow button to send.',
            'Wait a few moments; the plan appears next to the chat.',
            'If FoodChat asks you a question first, answer it in the chat to continue.'
          ],
          note: 'FoodChat needs a household and a selected profile. If it asks for one, follow the button on the screen.'
        },
        'refine': {
          title: 'Change the plan by chatting',
          body: 'Ask for changes in plain words: lighter dinners, no fish on Monday, add a dessert.',
          steps: [
            'Type the change in the box under the chat and send it.',
            'To swap one meal, open the ⋮ menu on its card ([[foodChatHome.mealCard.menu]]) and choose [[foodChatHome.mealCard.replace]].',
            'Edit the suggested message if you like, then send it.',
            'The reply lists what changed.'
          ]
        },
        'tools': {
          title: 'Summaries, totals and a shopping list',
          body: 'The [[foodChatHome.tools.label]] menu on the plan answers common questions about it in one click.',
          steps: [
            'Open [[foodChatHome.tools.label]] above the plan.',
            'Choose [[foodChatHome.tools.weekSummary]], [[foodChatHome.tools.planTotals]] or [[foodChatHome.tools.shoppingList]].',
            'The answer appears in a card above the plan; close it when you are done.',
            'Use [[foodChatHome.tools.replaceDay]] to redo a whole day.'
          ]
        },
        'save-share': {
          title: 'Save or share a plan',
          body: 'Saved plans go to My Library. Shared plans open for anyone with the link, no account needed.',
          steps: [
            'Click [[foodChatHome.planHeader.savePlan]] to keep the plan in My Library.',
            'Click [[share.button]] to open [[share.title]].',
            'Use [[share.copy]] to copy the link, or [[share.emailLabel]] to send it.',
            'Changed your mind? [[share.revoke]] turns the link off.'
          ]
        },
        'pantry': {
          title: 'Cook from what you have',
          body: 'Tell FoodChat what is in your kitchen and it plans around it, so less food goes to waste.',
          steps: [
            'Say it in the chat, for example “I have spinach and half a jar of olives”.',
            'Or open [[foodChatHome.planningState.title]] and use [[foodChatHome.planningState.pantryAdd]] under [[foodChatHome.planningState.pantryLabel]].',
            'Once you have items, click [[foodChatHome.pantryPicker.open]], tick what to use and click [[foodChatHome.pantryPicker.cook]].'
          ]
        },
        'settings': {
          title: 'Plan settings',
          body: 'Set how long you want to cook, how much effort, your goal and how often meals may repeat.',
          steps: [
            'Open [[foodChatHome.planSettings.title]] above the plan.',
            'Change [[foodChatHome.chat.planParams.params.cooking_time]], [[foodChatHome.chat.planParams.params.difficulty]], [[foodChatHome.chat.planParams.params.goal]], [[foodChatHome.chat.planParams.params.food_waste]] or [[foodChatHome.chat.planParams.params.repeat_meals]].',
            'Each change applies straight away.'
          ]
        },
        'diners': {
          title: 'Plan for more than one person',
          body: 'When your household has several profiles, choose who is eating and the plan respects everyone’s needs.',
          steps: [
            'Under [[foodChatHome.diners.label]], turn on the people who are eating.',
            'Your own profile is always included.',
            'Send your request as usual.'
          ],
          note: 'Only shown when the household has more than one profile.'
        },
        'compose': {
          title: 'Build a day yourself',
          body: 'Prefer to pick the meals? Choose some yourself and let FoodChat fill the gaps.',
          steps: [
            'On the start screen, click [[foodChatHome.manual.entry]].',
            'Click [[foodChatHome.manual.addRecipe]] and search for a recipe; your favourites come first.',
            'Add as many meals as you want.',
            'Click [[foodChatHome.manual.fillRest]] to complete the plan.'
          ]
        },
        'adapt': {
          title: 'Adapt a recipe in your plan',
          body: 'Make a meal healthier or change an ingredient without leaving the plan.',
          steps: [
            'Open the ⋮ menu on a meal and choose [[foodChatHome.mealCard.adapt]].',
            'Review the suggested changes.',
            'Click [[foodChatHome.adaptModal.save]].'
          ],
          note: 'The adapted version is used the next time the plan is updated.'
        }
      },
      tips: [
        'Shift + Enter starts a new line instead of sending.',
        'Use [[foodChatHome.canvas.rateThisPlan]] under the plan to tell us how it went.',
        'When FoodChat offers to remember something about you, choose [[foodChatHome.chat.memory.remember]] or [[foodChatHome.chat.memory.noThanks]]. You can review it on My Profile.',
        '[[foodChatHome.chat.startFresh]] (the + button) starts a new conversation; earlier ones stay under [[foodChatHome.chat.previousSessions]].'
      ]
    },

    'foodscholar': {
      title: 'FoodScholar: ask about food and nutrition',
      summary: 'Ask a question and get an answer based on scientific studies and official dietary guidelines, with every source shown.',
      features: {
        'ask': {
          title: 'Ask a question',
          body: 'Ask anything about food, nutrition or health, in your own words.',
          steps: [
            'Make sure [[foodScholarHome.qa.tabs.askQuestions]] is selected.',
            'Type your question in the box, or click one of the suggested questions.',
            'Press Enter or the arrow button.',
            'Read the [[foodScholarHome.qa.answer]]. The numbers in the text point to the sources used.'
          ],
          note: 'Sometimes FoodScholar asks a short question back to understand you better.'
        },
        'sources': {
          title: 'Check the sources',
          body: 'Every claim in an answer links to the study or guideline it comes from.',
          steps: [
            'Click a number in the answer to see the passage it is based on.',
            'Click [[foodScholarHome.qa.passagePeek.openArticle]] to read the whole study.',
            'See all sources under [[foodScholarHome.qa.sidebar.cited]] and [[foodScholarHome.qa.sidebar.consulted]].'
          ]
        },
        'follow-up': {
          title: 'Follow up or start over',
          body: 'Keep the conversation going; FoodScholar remembers what you asked before.',
          steps: [
            'Click a question under [[foodScholarHome.qa.followUpSuggestions]], or type your own.',
            'Click [[foodScholarHome.qa.thread.new]] to start a new topic.'
          ]
        },
        'rate': {
          title: 'Tell us if an answer helped',
          body: 'Your rating helps us improve the answers.',
          steps: [
            'Under the answer, at [[foodScholarHome.qa.feedback.helpfulQuestion]], click [[foodScholarHome.common.yes]] or [[foodScholarHome.common.no]].',
            'If you clicked [[foodScholarHome.common.no]], tell us briefly what went wrong.',
            'When you are shown two answers side by side, click the one you prefer.'
          ]
        },
        'advanced': {
          title: 'Advanced settings',
          body: 'For researchers and professionals: choose how answers are researched and explained.',
          steps: [
            'Click [[foodScholarHome.qa.advanced.title]] next to the question box.',
            'Turn on the advanced options, then change the method, model, source depth or explanation style.',
            'Ask your question as usual.'
          ]
        },
        'library': {
          title: 'Browse the library',
          body: 'Search scientific articles, national dietary guides and textbooks directly.',
          steps: [
            'Click the [[foodScholarHome.qa.tabs.library]] tab.',
            'Type in the search box and press Enter, or pick a suggestion.',
            'Or open a section: articles, dietary guides, textbooks or the knowledge hierarchy.'
          ]
        }
      }
    },

    'foodscholar-catalog': {
      title: 'Search scientific articles',
      summary: 'Find studies by describing what you are looking for, then narrow the list with filters.',
      features: {
        search: {
          title: 'Search in plain words',
          body: 'Describe the topic as you would to a person; you do not need exact keywords.',
          steps: [
            'Type in the search box, for example “gut health and probiotics”.',
            'Or click one of the example searches under the box.',
            'Press Enter and open any article in the results.'
          ]
        },
        filters: {
          title: 'Narrow the results',
          body: 'Filter by topic, year, study type, age group, country and more.',
          steps: [
            'Click [[foodScholarCatalog.filters.show]].',
            'Pick the filters you need; the list updates straight away.',
            'Remove a filter from [[foodScholarCatalog.activeFilters]], or click [[foodScholarCatalog.actions.resetAllFilters]].',
            'Change the order with [[foodScholarCatalog.sort.label]].'
          ]
        },
        summary: {
          title: 'Read the AI summary',
          body: 'After a search, an [[foodScholarCatalog.summary.title]] sums up what the top results say.',
          steps: [
            'Run a search.',
            'Read the [[foodScholarCatalog.summary.title]] above the results and click [[foodScholarCatalog.summary.clickToReadMore]].',
            'Click a topic under [[foodScholarCatalog.summary.relatedTopics]] to search for it.'
          ],
          note: 'The summary is generated by AI from the articles. Check the articles for details.'
        }
      }
    },

    'foodscholar-article': {
      title: 'Reading an article',
      summary: 'Each article page explains a study in plain language, with its key points and how strong the evidence is.',
      features: {
        read: {
          title: 'Understand the study',
          body: 'Start with the plain-language version, then go deeper if you want.',
          steps: [
            'Click [[foodScholarArticle.actions.simplify]] for an easier version of the abstract.',
            'Read the [[foodScholarArticle.sections.keyTakeaways]].',
            'See [[foodScholarArticle.sections.studyEvaluation]] for how strong the evidence is.'
          ]
        },
        questions: {
          title: 'Questions and answers',
          body: 'Common questions about the study, answered for different readers.',
          steps: [
            'Go to [[foodScholarArticle.sections.qa]].',
            'Pick [[foodScholarArticle.qaTabs.forYou]], [[foodScholarArticle.qaTabs.forPractitioners]] or [[foodScholarArticle.qaTabs.forExperts]].'
          ]
        },
        save: {
          title: 'Save or share it',
          body: 'Keep the article in My Library or send it to someone.',
          steps: [
            'Click [[foodScholarArticle.actions.save]]; it shows [[foodScholarArticle.actions.saved]] once kept.',
            'Click [[foodScholarArticle.actions.copyLink]] to share it.'
          ],
          note: 'Saving needs a selected profile.'
        }
      }
    },

    'foodscholar-guides': {
      title: 'Dietary guides by country',
      summary: 'Read the official food-based dietary guidelines of European countries and compare their rules.',
      features: {
        find: {
          title: 'Find a guide',
          body: 'Search all guides by title, country or topic.',
          steps: [
            'Type in the guide search box.',
            'Or narrow the list with the country buttons.',
            'Click a guide to open it.'
          ]
        },
        map: {
          title: 'Explore by map',
          body: 'See which countries have guides and open them from the map.',
          steps: [
            'Click the [[=Map]] tab.',
            'Click a country on the map or in the list next to it.',
            'Click [[=Open explorer]] to see that country’s guides.'
          ],
          note: 'On a touch screen, tap [[guidelines.map.explore]] first to move and zoom the map.'
        },
        explorer: {
          title: 'Filter a country’s rules',
          body: 'Each country page lists its guides and the individual rules inside them.',
          steps: [
            'Open the [[=Guidelines]] tab.',
            'Filter by topic, audience, guide or year.',
            'Narrow further by [[guidelines.filters.lifeStage]], [[guidelines.filters.foodGroup]] or [[guidelines.filters.nutrient]].',
            'Click [[guidelines.filters.clear]] to start again.'
          ]
        },
        read: {
          title: 'Read a guide',
          body: 'The guide’s document and its rules sit side by side.',
          steps: [
            'Open a guide.',
            'Search the rules with the box above the [[guidelines.panes.rules]] list.',
            'On a phone, switch between [[guidelines.panes.document]] and [[guidelines.panes.rules]] at the top.',
            'Click Save to keep it in My Library.'
          ]
        }
      }
    },

    'foodscholar-textbooks': {
      title: 'Textbooks',
      summary: 'Nutrition textbooks you can search, look inside and download.',
      features: {
        find: {
          title: 'Find a textbook',
          body: 'Search by title, author or topic, and filter by language, audience or region.',
          steps: [
            'Type in the search box.',
            'Click [[=Show filters]] to filter by language, audience or region.',
            'Click a textbook to open it.'
          ]
        },
        inside: {
          title: 'Look inside',
          body: 'See the passages that matter before you download the book.',
          steps: [
            'Open a textbook.',
            'Read the excerpts under [[=Inside this textbook]].',
            'Click [[=Download PDF]] to get the whole book, or Save to keep it in My Library.'
          ]
        }
      }
    },

    'foodscholar-hierarchy': {
      title: 'Knowledge hierarchy',
      summary: 'Browse how foods, nutrients and health topics connect, with the evidence behind each link.',
      features: {
        search: {
          title: 'Search the hierarchy',
          body: 'Jump straight to a food, a nutrient or a topic.',
          steps: [
            'Type in the search box at the top.',
            'Pick a result to open it in the tree.'
          ]
        },
        browse: {
          title: 'Browse and read the evidence',
          body: 'Open the branches of the tree and read what supports each item.',
          steps: [
            'Expand rows in [[graph.tree.title]].',
            'Click an item to see its [[graph.inspector.title]].',
            'Click [[graph.inspector.moreEvidence]] for more passages.'
          ]
        },
        ask: {
          title: 'Focus or ask',
          body: 'Narrow the tree to one item, or ask FoodScholar about it.',
          steps: [
            'Click [[graph.inspector.scopeHere]] to show only what is under an item.',
            'Click [[graph.inspector.askAbout]] to ask FoodScholar a question about it.'
          ]
        }
      }
    },

    'recipes': {
      title: 'RecipeWrangler: find recipes',
      summary: 'Search thousands of recipes, filter out allergens, compare them side by side and analyse your own.',
      features: {
        search: {
          title: 'Search for recipes',
          body: 'Describe what you feel like eating; you can use whole sentences.',
          steps: [
            'Type in the search box, for example “quick vegan dinners”.',
            'Press Enter or click the search icon.',
            'Or pick a suggestion, a recent search, or a category tile.',
            'Click a recipe to open it.'
          ]
        },
        personalized: {
          title: 'Results that fit you',
          body: 'With [[recipeWrangler.search.personalized]] on, results respect the diet and allergies of the profile you are using.',
          steps: [
            'Keep [[recipeWrangler.search.personalized]] switched on, next to the filters.',
            'Switch it off to see every recipe, for example when nothing matches.'
          ],
          note: 'Needs a selected profile.'
        },
        filters: {
          title: 'Filter and sort',
          body: 'Exclude allergens, choose diets and cuisines, or start from a ready-made filter.',
          steps: [
            'Click [[recipeWrangler.filters.show]] (on a phone: [[recipeWrangler.filters.open]]).',
            'Use [[recipeWrangler.filters.excludeAllergens]] and [[recipeWrangler.filters.dietTags]], or a [[recipeWrangler.filters.quickFilters]] option.',
            'Choose an order under [[recipeWrangler.filters.sortBy]].',
            'Remove a filter from the chips under the search box, or click [[recipeWrangler.filters.clearAll]].'
          ]
        },
        compare: {
          title: 'Compare recipes',
          body: 'Put up to four recipes side by side: Nutri-Score, time, calories and nutrients.',
          steps: [
            'Tick the box at the top left of a recipe card.',
            'Tick at least one more (up to four).',
            'Click the compare button that appears.'
          ]
        },
        analyze: {
          title: 'Analyse your own recipe',
          body: 'Paste any recipe and get its nutrition, Nutri-Score, environmental impact and cost.',
          steps: [
            'Open the [[=Analyze Recipe]] tab.',
            'Paste the recipe text (ingredients with amounts work best).',
            'Choose your region.',
            'Click [[recipeWrangler.analyzer.analyze]] and read the results.'
          ],
          note: 'Paste the text itself; links to recipe websites do not work.'
        },
        favorites: {
          title: 'Keep your favourites',
          body: 'Mark recipes with the heart to find them again quickly.',
          steps: [
            'Click the heart on a recipe card.',
            'Click the heart button above the results to show only your favourites.',
            'Find them all again in My Library.'
          ]
        },
        sources: {
          title: 'Where the recipes and numbers come from',
          body: 'Recipes come from published collections, and nutrition values from national food composition tables.',
          steps: [
            'Scroll to [[=Recipe Collections]] or [[=Food Composition Tables]] on the main page.',
            'Open one to see where it comes from and what it contains.'
          ]
        }
      }
    },

    'recipe': {
      title: 'A recipe up close',
      summary: 'See how healthy and sustainable a recipe is, scale it, swap ingredients and make a better version.',
      features: {
        scores: {
          title: 'Scores at a glance',
          body: 'The strip at the top shows the [[recipeWrangler.recipe.nutriScore]], the environmental impact and, when known, the cost.',
          steps: [
            'Read the [[recipeWrangler.recipe.nutriScore]] letter: A is the healthiest, E the least.',
            'Click the ? next to it to see how the score was worked out.',
            'Check [[recipeWrangler.detail.sustainability.label]] for the CO₂ per serving and [[recipeWrangler.recipe.cost.label]] for a price band.'
          ],
          note: 'Not every recipe has cost data yet.'
        },
        nutrition: {
          title: 'Nutrition details',
          body: 'See calories and nutrients for one serving or per 100 g.',
          steps: [
            'Go to [[recipeWrangler.detail.nutritionalInfo]].',
            'Switch between [[recipeWrangler.detail.basisPerServing]] and [[recipeWrangler.detail.basisPer100g]].',
            'Switch between [[recipeWrangler.detail.chartView]] and [[recipeWrangler.detail.gridView]].'
          ]
        },
        servings: {
          title: 'Servings and substitutes',
          body: 'Cook for more or fewer people, or replace an ingredient you do not have.',
          steps: [
            'Use + and − next to [[recipeWrangler.detail.scale.label]]; amounts update.',
            'Click the swap icon next to an ingredient ([[recipeWrangler.detail.substitution.action]]).',
            'Pick a substitute from the list.'
          ]
        },
        improve: {
          title: 'Make it healthier or greener',
          body: 'Get suggestions to improve the recipe and save your own version.',
          steps: [
            'Click [[recipeWrangler.detail.adaptation.improve]] next to the ingredients.',
            'Choose [[recipeWrangler.detail.adaptation.modeNutrition]], [[recipeWrangler.detail.adaptation.modeSustainability]] or [[recipeWrangler.detail.adaptation.modeReduce]].',
            'Review the suggested changes.',
            'Click [[recipeWrangler.detail.adaptation.save]].'
          ],
          note: 'Available once the recipe’s nutrition has been calculated.'
        },
        save: {
          title: 'Save it',
          body: 'Keep the recipe in My Library.',
          steps: [
            'Click [[recipeWrangler.recipe.save]] near the top of the page.',
            'Find it again under [[library.savedRecipes]] in My Library.'
          ]
        },
        report: {
          title: 'Report a problem with the recipe',
          body: 'Wrong allergens, odd amounts, steps that do not work: tell our curators.',
          steps: [
            'Click [[report.trigger]] (the flag at the top).',
            'Choose what is wrong.',
            'Add a few words if you like, then click [[report.send]].'
          ]
        }
      }
    },

    'recipes-compare': {
      title: 'Comparing recipes',
      summary: 'Up to four recipes side by side, row by row.',
      features: {
        read: {
          title: 'Read the comparison',
          body: 'Each row compares one thing: Nutri-Score, time, servings, calories and nutrients.',
          steps: [
            'Read across a row to compare the recipes.',
            'Click a recipe’s name to open it.',
            'On a phone, choose the two recipes to show side by side.'
          ]
        },
        manage: {
          title: 'Change what you compare',
          body: 'Go back to the search to add others, or start again.',
          steps: [
            'Go back to RecipeWrangler and tick other recipes.',
            'Click [[recipeWrangler.comparePage.clearAll]] to empty the comparison.'
          ]
        }
      }
    },

    'library': {
      title: 'My Library',
      summary: 'Everything you saved across WiseFood, in one place.',
      features: {
        saved: {
          title: 'Your saved items',
          body: 'Recipes, articles, dietary guides and textbooks you saved appear here, grouped by type.',
          steps: [
            'Save things as you go: the heart on a recipe, Save on an article, guide or textbook.',
            'Open any item from here.',
            'Nothing yet? Click [[library.emptyCta]] to start.'
          ],
          note: 'Saved items belong to the profile in use. Switch profile to see someone else’s.'
        },
        plans: {
          title: 'Saved meal plans',
          body: 'Plans you kept in FoodChat are listed under [[library.savedPlans]].',
          steps: [
            'Find the plan by its date.',
            'Click [[library.planOpen]] to see it or keep changing it.'
          ]
        }
      }
    },

    'my-profile': {
      title: 'My Profile',
      summary: 'What WiseFood knows about the profile in use: diet, allergies, likes and dislikes. Every app uses it to personalise.',
      features: {
        'quick-setup': {
          title: 'Quick setup',
          body: 'Answer a few questions to set diet, allergies, likes and dislikes in one go.',
          steps: [
            'Click [[myProfile.actions.quickSetup]].',
            'Go through the steps.',
            'Click [[preferencesWizard.actions.save]] at the end.'
          ]
        },
        'diet-allergies': {
          title: 'Diet and allergies',
          body: 'WiseFood will never suggest food that conflicts with an allergy you list here.',
          steps: [
            'In [[myProfile.sections.dietaryPreferences]], click [[myProfile.actions.add]] and pick a diet.',
            'In [[myProfile.sections.allergiesAndIntolerances]], click [[myProfile.actions.add]] and pick what you avoid.',
            'Use the bin icon to remove one.'
          ]
        },
        'likes': {
          title: 'Foods you like and dislike',
          body: 'Recipes and plans favour what you like and leave out what you do not.',
          steps: [
            'In [[myProfile.sections.foodLikes]] or [[myProfile.sections.foodDislikes]], click [[myProfile.actions.add]].',
            'Search or browse, and tick the foods.',
            'Confirm. The × on a food removes it.'
          ]
        },
        'memory': {
          title: 'What WiseFood remembers',
          body: 'When you allow it in a chat, WiseFood remembers things like goals or habits. You can always see, correct or remove them.',
          steps: [
            'Go to [[myProfile.sections.memory]].',
            'Click ? to see [[myProfile.memory.why.title]].',
            'Click the pencil to correct one, or [[myProfile.memory.forget]] to delete it.'
          ]
        },
        'details': {
          title: 'Name, picture and details',
          body: 'Change the profile’s name, age group or picture.',
          steps: [
            'Click [[myProfile.actions.edit]] in [[myProfile.sections.profileDetails]].',
            'Click the pencil on the picture to choose another one.',
            'Save your changes.'
          ]
        },
        'privacy': {
          title: 'Privacy and your data',
          body: 'You decide what is collected, and you can delete it all.',
          steps: [
            'Switch [[myProfile.privacy.analyticsTitle]] on or off.',
            'See [[myProfile.dataKept.title]] for the full list of what is stored.',
            'Delete a profile, the household or the account under [[myProfile.sections.dangerZone]].'
          ],
          note: 'Deleting cannot be undone.'
        }
      }
    },

    'profiles': {
      title: 'Profiles in your household',
      summary: 'Each person in your household has a profile with their own diet, allergies and saved items. Pick who you are using WiseFood for.',
      features: {
        choose: {
          title: 'Choose a profile',
          body: 'Everything you do after this is for that person.',
          steps: [
            'Click a person’s picture.',
            'Switch later from your picture at the top right, then [[header.menu.switchProfile]].'
          ]
        },
        add: {
          title: 'Add someone',
          body: 'Add a profile for each person you plan meals for.',
          steps: [
            'Click [[profileSelection.actions.addProfile]].',
            'Enter a name and, if you like, an age group, and pick a picture.',
            'Click [[profileSelection.actions.createProfile]].'
          ],
          note: 'Set their diet and allergies afterwards on My Profile.'
        },
        manage: {
          title: 'Remove a profile',
          body: 'Remove profiles you no longer need.',
          steps: [
            'Click [[profileSelection.actions.manageProfiles]].',
            'Click the red × on the profile and confirm.',
            'Click [[profileSelection.actions.done]].'
          ]
        },
        setup: {
          title: 'First-time setup',
          body: 'The first time, a short guide sets up your household and your own profile.',
          steps: [
            'Give your household a name and, if you like, a country.',
            'Add your name, age group and diet.',
            'Finish, or skip and do it later.'
          ]
        }
      }
    }
  }
}

export default en
