/**
 * Where a shopping-list item lives in a shop, and a picture for it.
 *
 * FoodChat's list is ingredient names as the recipes wrote them ("baby
 * spinach", "italian seasoned tomatoes", "chicken thigh fillets"), with no
 * category. A word list is enough to put most of them in the right aisle and
 * give each a face; anything it does not know lands in "Other" with a basket,
 * which is honest and still useful.
 *
 * Order matters twice: aisles are matched in the order of `RULES` (so "black
 * pepper" is a spice before "pepper" can be a vegetable, and "coconut milk"
 * is the cupboard before "milk" can be dairy), and the first emoji rule that
 * matches wins.
 */

/** One use of an item: the meal (and day, on a multi-day plan) that needs it. */
export interface ShoppingUse {
  day?: number | null
  meal_type?: string
  weekdays?: boolean
}

/** One row of FoodChat's shopping list. */
export interface ShoppingItem {
  item: string
  for?: string[]
  uses?: ShoppingUse[]
}

export type AisleKey = 'produce' | 'protein' | 'dairy' | 'grains' | 'cupboard' | 'herbs' | 'other'

export const AISLE_ORDER: AisleKey[] = ['produce', 'protein', 'dairy', 'grains', 'cupboard', 'herbs', 'other']

export const AISLE_EMOJI: Record<AisleKey, string> = {
  produce: '🥬',
  protein: '🥩',
  dairy: '🧀',
  grains: '🌾',
  cupboard: '🫙',
  herbs: '🌿',
  other: '🛒'
}

/**
 * [words, aisle, emoji]. A word matches a whole word of the item, plus at most
 * a plural ("tomato" in "cherry tomatoes", "strawberr" in "strawberries") —
 * never a longer word, so "pea" is not "pear", "roll" is not "rolled oats".
 */
const RULES: Array<[string[], AisleKey, string]> = [
  // Spices and seasonings first: "black pepper", "chilli powder", "garlic powder".
  [['black pepper', 'white pepper', 'peppercorn', 'salt'], 'herbs', '🧂'],
  [['chilli powder', 'chili powder', 'garlic powder', 'onion powder', 'curry powder', 'paprika', 'cumin', 'turmeric',
    'cinnamon', 'nutmeg', 'cardamom', 'clove', 'coriander seed', 'fennel seed', 'chilli flake', 'chili flake',
    'garam masala', 'allspice', 'spice', 'seasoning', 'oregano', 'dried'], 'herbs', '🧂'],
  [['basil', 'parsley', 'mint', 'coriander', 'cilantro', 'dill', 'thyme', 'rosemary', 'sage', 'chive', 'tarragon',
    'bay leaf', 'bay leaves', 'herb'], 'herbs', '🌿'],
  // The cupboard before dairy: "coconut milk", "almond milk", "peanut butter".
  [['coconut milk', 'coconut cream', 'almond milk', 'oat milk', 'soy milk', 'soya milk'], 'cupboard', '🥥'],
  [['peanut butter', 'tahini', 'nut butter'], 'cupboard', '🥜'],
  [['olive oil', 'oil'], 'cupboard', '🫒'],
  [['honey', 'maple syrup', 'syrup', 'sugar', 'jam'], 'cupboard', '🍯'],
  [['soy sauce', 'sauce', 'vinegar', 'stock', 'broth', 'mustard', 'ketchup', 'mayonnaise', 'paste', 'tinned',
    'canned', 'passata', 'puree', 'purée', 'seasoned tomato'], 'cupboard', '🫙'],
  [['almond', 'walnut', 'cashew', 'pecan', 'hazelnut', 'pistachio', 'peanut', 'nut', 'pine nut', 'seed', 'chia',
    'flax', 'sesame'], 'cupboard', '🥜'],
  [['raisin', 'sultana', 'date', 'dried apricot', 'cranberr'], 'cupboard', '🍇'],
  [['chocolate', 'cocoa'], 'cupboard', '🍫'],
  // Protein.
  [['chicken', 'turkey', 'duck'], 'protein', '🍗'],
  [['bacon', 'pancetta', 'ham', 'prosciutto'], 'protein', '🥓'],
  [['beef', 'lamb', 'pork', 'veal', 'venison', 'mince', 'steak', 'sausage', 'chorizo', 'salami'], 'protein', '🥩'],
  [['prawn', 'shrimp', 'crab', 'lobster', 'mussel', 'clam', 'squid', 'scallop'], 'protein', '🦐'],
  [['salmon', 'tuna', 'cod', 'haddock', 'trout', 'sardine', 'anchov', 'mackerel', 'fish', 'hake', 'sea bass'], 'protein', '🐟'],
  [['tofu', 'tempeh', 'seitan'], 'protein', '🧊'],
  [['chickpea', 'lentil', 'bean', 'pea'], 'protein', '🫘'],
  // Dairy and eggs.
  [['egg'], 'dairy', '🥚'],
  [['milk'], 'dairy', '🥛'],
  [['butter'], 'dairy', '🧈'],
  [['yoghurt', 'yogurt', 'kefir', 'skyr'], 'dairy', '🥣'],
  [['cheese', 'feta', 'parmesan', 'mozzarella', 'cheddar', 'ricotta', 'halloumi', 'paneer', 'mascarpone', 'brie',
    'gouda', 'goat'], 'dairy', '🧀'],
  [['cream', 'crème', 'creme'], 'dairy', '🥛'],
  // Grains and bread.
  [['bread', 'baguette', 'pita', 'tortilla', 'wrap', 'roll', 'bun', 'toast', 'naan', 'bagel', 'muffin', 'crumpet',
    'filo', 'pastry'], 'grains', '🍞'],
  [['pasta', 'spaghetti', 'penne', 'noodle', 'lasagne', 'macaroni', 'fusilli', 'linguine'], 'grains', '🍝'],
  [['rice', 'risotto'], 'grains', '🍚'],
  [['oat', 'flour', 'quinoa', 'couscous', 'bulgur', 'barley', 'polenta', 'semolina', 'buckwheat', 'cornflake',
    'cereal', 'granola', 'muesli'], 'grains', '🌾'],
  // Fruit and vegetables.
  [['tomato'], 'produce', '🍅'],
  [['carrot'], 'produce', '🥕'],
  [['potato', 'kumara', 'sweet potato'], 'produce', '🥔'],
  [['onion', 'shallot', 'leek', 'spring onion', 'scallion'], 'produce', '🧅'],
  [['garlic'], 'produce', '🧄'],
  [['ginger'], 'produce', '🫚'],
  [['chilli', 'chili', 'jalapeño', 'jalapeno'], 'produce', '🌶️'],
  [['capsicum', 'bell pepper', 'pepper'], 'produce', '🫑'],
  [['spinach', 'kale', 'lettuce', 'cabbage', 'chard', 'rocket', 'arugula', 'salad', 'leaves', 'greens',
    'bok choy', 'pak choi', 'watercress'], 'produce', '🥬'],
  [['broccoli', 'broccolini', 'cauliflower'], 'produce', '🥦'],
  [['mushroom'], 'produce', '🍄'],
  [['cucumber', 'zucchini', 'courgette'], 'produce', '🥒'],
  [['eggplant', 'aubergine'], 'produce', '🍆'],
  [['corn', 'sweetcorn'], 'produce', '🌽'],
  [['avocado'], 'produce', '🥑'],
  [['pumpkin', 'squash', 'beetroot', 'celery', 'asparagus', 'radish', 'fennel', 'artichoke', 'olive'], 'produce', '🥗'],
  [['lemon', 'lime'], 'produce', '🍋'],
  [['orange', 'mandarin', 'clementine'], 'produce', '🍊'],
  [['apple'], 'produce', '🍎'],
  [['pear'], 'produce', '🍐'],
  [['banana'], 'produce', '🍌'],
  [['strawberr', 'raspberr'], 'produce', '🍓'],
  [['blueberr', 'berr'], 'produce', '🫐'],
  [['grape'], 'produce', '🍇'],
  [['peach', 'apricot', 'nectarine', 'plum'], 'produce', '🍑'],
  [['mango', 'pineapple', 'kiwi', 'melon', 'watermelon', 'pomegranate', 'fig', 'cherr'], 'produce', '🥭'],
  [['coconut'], 'produce', '🥥']
]

const PLURAL_TAILS = new Set(['', 's', 'es', 'ies', 'y'])

function hasWord(text: string, word: string): boolean {
  let from = 0
  while (from <= text.length) {
    const at = text.indexOf(word, from)
    if (at < 0) return false
    const startsWord = at === 0 || !/[a-zà-ž]/.test(text[at - 1] ?? '')
    const tail = /^[a-zà-ž]*/.exec(text.slice(at + word.length))?.[0] ?? ''
    if (startsWord && PLURAL_TAILS.has(tail)) return true
    from = at + 1
  }
  return false
}

export interface Placed {
  aisle: AisleKey
  emoji: string
}

/** The aisle and picture for one item, by its name. */
export function placeItem(name: string): Placed {
  const text = String(name || '').toLowerCase()
  for (const [words, aisle, emoji] of RULES) {
    if (words.some(word => hasWord(text, word))) return { aisle, emoji }
  }
  return { aisle: 'other', emoji: '🛒' }
}

/** Whether a kitchen item covers a list item ("tomatoes" covers "cherry tomatoes"). */
export function inKitchen(name: string, pantry: readonly string[]): boolean {
  const text = String(name || '').toLowerCase()
  return pantry.some((raw) => {
    const have = String(raw || '').toLowerCase().trim().replace(/s$/, '')
    return have.length > 2 && hasWord(text, have)
  })
}
