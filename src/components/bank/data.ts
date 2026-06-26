export type Kpi = {
  label: string
  value: string
  delta: number
  spark: number[]
}

export const kpis: Kpi[] = [
  {
    label: 'Total Balance',
    value: '$5,465.00',
    delta: 6.3,
    spark: [12, 14, 11, 16, 13, 18, 15, 20, 17, 22, 19, 24],
  },
  {
    label: 'Card Spending',
    value: '$8,395.00',
    delta: 7.1,
    spark: [20, 18, 22, 19, 24, 21, 26, 23, 28, 25, 30, 27],
  },
  {
    label: 'Rewards Earned',
    value: '2,450 pts',
    delta: -5.7,
    spark: [24, 22, 25, 20, 23, 18, 21, 16, 19, 15, 17, 14],
  },
  {
    label: 'Cashback',
    value: '$425.00',
    delta: 5.2,
    spark: [10, 13, 11, 15, 12, 17, 14, 19, 16, 21, 18, 23],
  },
]

export type CardItem = {
  name: string
  price: string
  number: string
  gradient: string
}

export const cards: CardItem[] = [
  {
    name: 'Platinum Card',
    price: '$150 / year',
    number: '•••• 6050',
    gradient: 'linear-gradient(135deg, #3a3f4b 0%, #1c1f26 60%, #2b2f38 100%)',
  },
  {
    name: 'Gold Card',
    price: '$140 / year',
    number: '•••• 4021',
    gradient: 'linear-gradient(135deg, #6b5524 0%, #2a2210 60%, #4a3c18 100%)',
  },
  {
    name: 'Silver Card',
    price: '$130 / year',
    number: '•••• 7788',
    gradient: 'linear-gradient(135deg, #4a4f57 0%, #20242b 60%, #353a42 100%)',
  },
]

export const cardSwatches = ['#c8b68a', '#3a3f4b', '#7b6cf6', '#3d8b6e', '#b8553f']

export const monthlySpending = [
  8, 14, 10, 18, 12, 22, 16, 26, 19, 30, 24, 34, 28, 21, 17, 25, 31, 27, 20, 15,
]

export const monthlyActivity = [
  { label: 'Jan', value: 18 },
  { label: 'Feb', value: 24 },
  { label: 'Mar', value: 30 },
  { label: 'Apr', value: 48 },
  { label: 'May', value: 26 },
  { label: 'Jun', value: 34 },
  { label: 'Jul', value: 22 },
]

export const spendingCategories = [
  { label: 'Shopping', value: '$1,240', raw: 1240 },
  { label: 'Dining', value: '$340', raw: 340 },
  { label: 'Travel', value: '$520', raw: 520 },
  { label: 'Others', value: '$180', raw: 180 },
]

export const categoryBars = [
  6, 9, 7, 11, 8, 13, 10, 28, 30, 26, 14, 9, 7, 11, 8, 6, 10, 7, 9, 6,
]
