import type { ColorKey } from '@/types'

export const COLORS: ColorKey[] = ['sun', 'bubblegum', 'sky', 'mint', 'tangerine', 'grape', 'cherry', 'lime']

export const bg: Record<ColorKey, string> = {
  sun: 'bg-sun',
  bubblegum: 'bg-bubblegum',
  sky: 'bg-sky',
  mint: 'bg-mint',
  tangerine: 'bg-tangerine',
  grape: 'bg-grape',
  cherry: 'bg-cherry',
  lime: 'bg-lime',
}

export const bgSoft: Record<ColorKey, string> = {
  sun: 'bg-sun/25',
  bubblegum: 'bg-bubblegum/25',
  sky: 'bg-sky/25',
  mint: 'bg-mint/25',
  tangerine: 'bg-tangerine/25',
  grape: 'bg-grape/25',
  cherry: 'bg-cherry/20',
  lime: 'bg-lime/30',
}

export const fill: Record<ColorKey, string> = {
  sun: 'fill-sun',
  bubblegum: 'fill-bubblegum',
  sky: 'fill-sky',
  mint: 'fill-mint',
  tangerine: 'fill-tangerine',
  grape: 'fill-grape',
  cherry: 'fill-cherry',
  lime: 'fill-lime',
}

export const hex: Record<ColorKey, string> = {
  sun: '#ffd23f',
  bubblegum: '#ff92c8',
  sky: '#74b9ff',
  mint: '#52e0a6',
  tangerine: '#ffa04d',
  grape: '#b89cff',
  cherry: '#ff6363',
  lime: '#c9f25c',
}
