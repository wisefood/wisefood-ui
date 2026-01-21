// Avatar configuration type - defined here to avoid circular imports
export interface AvatarConfig {
  bgColor: string
  skinColor: string
  hairColor: string
  hairStyle: 'short' | 'curly' | 'long' | 'spiky' | 'bald' | 'ponytail'
  eyeColor: string
  eyeStyle: 'round' | 'almond'
  eyebrowStyle: 'arched' | 'straight'
  mouthStyle: 'smile' | 'grin' | 'open' | 'small'
  mouthColor: string
  hasBlush: boolean
  accessory: 'none' | 'glasses' | 'hat'
}

// Predefined avatar configurations for users to choose from
export const avatarPresets: AvatarConfig[] = [
  // Avatar 1: Cheerful with pink bg
  {
    bgColor: '#fce4ec',
    skinColor: '#ffdbac',
    hairColor: '#4a3728',
    hairStyle: 'curly',
    eyeColor: '#5d4037',
    eyeStyle: 'round',
    eyebrowStyle: 'arched',
    mouthStyle: 'grin',
    mouthColor: '#c85a5a',
    hasBlush: true,
    accessory: 'none'
  },
  // Avatar 2: Cool with blue bg
  {
    bgColor: '#e3f2fd',
    skinColor: '#ffe0bd',
    hairColor: '#1a1a2e',
    hairStyle: 'short',
    eyeColor: '#263238',
    eyeStyle: 'almond',
    eyebrowStyle: 'straight',
    mouthStyle: 'smile',
    mouthColor: '#d47a7a',
    hasBlush: false,
    accessory: 'glasses'
  },
  // Avatar 3: Sunny with yellow bg
  {
    bgColor: '#fff9c4',
    skinColor: '#f5cba7',
    hairColor: '#d4a373',
    hairStyle: 'long',
    eyeColor: '#5d4037',
    eyeStyle: 'round',
    eyebrowStyle: 'arched',
    mouthStyle: 'smile',
    mouthColor: '#c97878',
    hasBlush: true,
    accessory: 'none'
  },
  // Avatar 4: Energetic with green bg
  {
    bgColor: '#c8e6c9',
    skinColor: '#ffe4c4',
    hairColor: '#8d5524',
    hairStyle: 'spiky',
    eyeColor: '#3e2723',
    eyeStyle: 'round',
    eyebrowStyle: 'straight',
    mouthStyle: 'open',
    mouthColor: '#c85a5a',
    hasBlush: false,
    accessory: 'none'
  },
  // Avatar 5: Calm with purple bg
  {
    bgColor: '#e1bee7',
    skinColor: '#deb887',
    hairColor: '#2c1810',
    hairStyle: 'ponytail',
    eyeColor: '#4e342e',
    eyeStyle: 'almond',
    eyebrowStyle: 'arched',
    mouthStyle: 'small',
    mouthColor: '#b5697a',
    hasBlush: true,
    accessory: 'none'
  },
  // Avatar 6: Wise with teal bg
  {
    bgColor: '#b2dfdb',
    skinColor: '#e8beac',
    hairColor: '#6d6d6d',
    hairStyle: 'bald',
    eyeColor: '#37474f',
    eyeStyle: 'almond',
    eyebrowStyle: 'straight',
    mouthStyle: 'smile',
    mouthColor: '#a86464',
    hasBlush: false,
    accessory: 'glasses'
  },
  // Avatar 7: Playful with orange bg
  {
    bgColor: '#ffe0b2',
    skinColor: '#ffdab9',
    hairColor: '#c0392b',
    hairStyle: 'curly',
    eyeColor: '#33691e',
    eyeStyle: 'round',
    eyebrowStyle: 'arched',
    mouthStyle: 'grin',
    mouthColor: '#d45c5c',
    hasBlush: true,
    accessory: 'none'
  },
  // Avatar 8: Dreamy with lavender bg
  {
    bgColor: '#d1c4e9',
    skinColor: '#ffecd2',
    hairColor: '#5c3d2e',
    hairStyle: 'long',
    eyeColor: '#6a5acd',
    eyeStyle: 'round',
    eyebrowStyle: 'arched',
    mouthStyle: 'smile',
    mouthColor: '#c98686',
    hasBlush: true,
    accessory: 'none'
  },
  // Avatar 9: Bold with coral bg
  {
    bgColor: '#ffccbc',
    skinColor: '#c68642',
    hairColor: '#1c1c1c',
    hairStyle: 'short',
    eyeColor: '#3e2723',
    eyeStyle: 'almond',
    eyebrowStyle: 'straight',
    mouthStyle: 'smile',
    mouthColor: '#a05252',
    hasBlush: false,
    accessory: 'none'
  },
  // Avatar 10: Fresh with mint bg
  {
    bgColor: '#c8e6c9',
    skinColor: '#ffdbac',
    hairColor: '#654321',
    hairStyle: 'ponytail',
    eyeColor: '#558b2f',
    eyeStyle: 'round',
    eyebrowStyle: 'arched',
    mouthStyle: 'grin',
    mouthColor: '#c97070',
    hasBlush: true,
    accessory: 'hat'
  },
  // Avatar 11: Gentle with peach bg
  {
    bgColor: '#ffefd5',
    skinColor: '#f5deb3',
    hairColor: '#8b7355',
    hairStyle: 'curly',
    eyeColor: '#8b4513',
    eyeStyle: 'round',
    eyebrowStyle: 'arched',
    mouthStyle: 'small',
    mouthColor: '#bc8f8f',
    hasBlush: true,
    accessory: 'none'
  },
  // Avatar 12: Modern with grey bg
  {
    bgColor: '#eceff1',
    skinColor: '#d2b48c',
    hairColor: '#2d2d2d',
    hairStyle: 'spiky',
    eyeColor: '#455a64',
    eyeStyle: 'almond',
    eyebrowStyle: 'straight',
    mouthStyle: 'smile',
    mouthColor: '#9e7777',
    hasBlush: false,
    accessory: 'glasses'
  }
]

// Convert avatar index to a storable string (for image_url field)
// Format: "avatar:0", "avatar:5", etc.
export function avatarIndexToString(index: number): string {
  return `avatar:${index}`
}

// Parse avatar string back to config
// Supports both formats:
// - New format: "avatar:0" (index only)
// - Legacy format: "avatar:{...}" (full JSON config)
export function stringToAvatarConfig(str: string): AvatarConfig | null {
  if (!str?.startsWith('avatar:')) return null

  const value = str.slice(7) // Remove "avatar:" prefix

  // Try parsing as index first (new format)
  const index = parseInt(value, 10)
  if (!isNaN(index) && index >= 0 && index < avatarPresets.length) {
    return avatarPresets[index]
  }

  // Try parsing as JSON (legacy format)
  try {
    return JSON.parse(value) as AvatarConfig
  } catch {
    return null
  }
}

// Get avatar config by preset index
export function getAvatarByIndex(index: number): AvatarConfig {
  return avatarPresets[index % avatarPresets.length]
}

// Get preset index from config (for display purposes)
export function getAvatarPresetIndex(config: AvatarConfig): number {
  const configStr = JSON.stringify(config)
  return avatarPresets.findIndex(preset => JSON.stringify(preset) === configStr)
}
