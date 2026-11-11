/**
 * Things to try in FoodScholar's question box: claims to check and everyday
 * questions, shown in the short lists under the box.
 *
 * English only for now; the page chrome is translated through vue-i18n and
 * falls back to English.
 */

export const COMMON_MYTHS: string[] = [
  'Eating after 8 pm makes you gain weight.',
  'Brown sugar is healthier than white sugar.',
  'Eggs raise your blood cholesterol.',
  'Frozen vegetables are less nutritious than fresh ones.',
  'Detox juices clean toxins out of your body.',
  'You need to drink 8 glasses of water a day.',
  'Coffee dehydrates you.',
  'Carbs at dinner make you gain weight.'
]

export interface EverydayTopic {
  id: string
  title: string
  icon: string
  questions: string[]
}

export const EVERYDAY_TOPICS: EverydayTopic[] = [
  {
    id: 'meals',
    title: 'Everyday meals',
    icon: 'i-lucide-utensils',
    questions: [
      'Is it bad to skip breakfast?',
      'Are frozen vegetables as healthy as fresh ones?',
      'How many portions of fruit and vegetables should I eat a day?'
    ]
  },
  {
    id: 'sweet',
    title: 'Sugar and snacks',
    icon: 'i-lucide-cookie',
    questions: [
      'Is fruit juice as healthy as whole fruit?',
      'Are sweeteners safe to use every day?',
      'Is dark chocolate actually good for you?'
    ]
  },
  {
    id: 'protein-fat',
    title: 'Protein and fats',
    icon: 'i-lucide-egg',
    questions: [
      'Are eggs bad for my cholesterol?',
      'Do I need protein shakes if I exercise?',
      'Is olive oil healthier than butter?'
    ]
  },
  {
    id: 'family',
    title: 'Family and children',
    icon: 'i-lucide-baby',
    questions: [
      'How much sugar is too much for children?',
      'What makes a healthy school lunchbox?',
      'Do children need vitamin supplements?'
    ]
  }
]
