import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Currency Formatting ─────────────────────────────────────────────────────
export function formatCurrency(
  amount: number,
  currency = 'MYR',
  compact = false
): string {
  if (compact && Math.abs(amount) >= 1_000_000) {
    return `${currency} ${(amount / 1_000_000).toFixed(1)}M`
  }
  if (compact && Math.abs(amount) >= 1_000) {
    return `${currency} ${(amount / 1_000).toFixed(1)}K`
  }
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// ─── Financial Calculations ──────────────────────────────────────────────────

/** Net Worth = Total Assets − Total Liabilities */
export function calcNetWorth(totalAssets: number, totalLiabilities: number): number {
  return totalAssets - totalLiabilities
}

/** Debt Ratio = Total Liabilities / Total Assets × 100 */
export function calcDebtRatio(totalAssets: number, totalLiabilities: number): number {
  if (totalAssets === 0) return 0
  return Math.min((totalLiabilities / totalAssets) * 100, 100)
}

/** Emergency Fund Runway = Liquid Assets / Monthly Commitments */
export function calcRunway(liquidAssets: number, monthlyCommitments: number): number {
  if (monthlyCommitments === 0) return 99
  return liquidAssets / monthlyCommitments
}

/** Liquidity Score 0–100 based on runway months */
export function calcLiquidityScore(runwayMonths: number): number {
  if (runwayMonths >= 12) return 100
  if (runwayMonths >= 6) return 80
  if (runwayMonths >= 3) return 60
  if (runwayMonths >= 1) return 40
  return 20
}

/** Financial Freedom Score: Passive Income / Monthly Commitment × 100 */
export function calcFinancialFreedomScore(
  passiveIncomeMonthly: number,
  monthlyCommitments: number
): number {
  if (monthlyCommitments === 0) return 100
  return Math.min((passiveIncomeMonthly / monthlyCommitments) * 100, 100)
}

/** Monthly Cashflow = Total Income − Total Expenses */
export function calcMonthlyCashflow(totalIncome: number, totalExpenses: number): number {
  return totalIncome - totalExpenses
}

/** Liquidity risk label */
export function getLiquidityRisk(runwayMonths: number): 'green' | 'yellow' | 'red' {
  if (runwayMonths >= 6) return 'green'
  if (runwayMonths >= 3) return 'yellow'
  return 'red'
}

/** Project achievement date for a goal */
export function projectAchievementDate(
  currentAmount: number,
  targetAmount: number,
  monthlyGrowthRate: number
): Date | null {
  if (monthlyGrowthRate <= 0) return null
  if (currentAmount >= targetAmount) return new Date()
  const monthsNeeded = Math.ceil((targetAmount - currentAmount) / monthlyGrowthRate)
  const date = new Date()
  date.setMonth(date.getMonth() + monthsNeeded)
  return date
}

// ─── Misc helpers ────────────────────────────────────────────────────────────
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
}

export function getMonthLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-MY', { month: 'short', year: '2-digit' })
}

export const COMMISSION_STATUS_LABELS: Record<string, string> = {
  prospect: 'Prospect',
  booking: 'Booking',
  spa_signed: 'SPA Signed',
  loan_approved: 'Loan Approved',
  pending_claim: 'Pending Claim',
  claimed: 'Claimed',
  paid: 'Paid',
}

export const COMMISSION_STATUS_COLORS: Record<string, string> = {
  prospect: 'bg-slate-700 text-slate-200',
  booking: 'bg-blue-900 text-blue-200',
  spa_signed: 'bg-indigo-900 text-indigo-200',
  loan_approved: 'bg-violet-900 text-violet-200',
  pending_claim: 'bg-amber-900 text-amber-200',
  claimed: 'bg-teal-900 text-teal-200',
  paid: 'bg-green-900 text-green-200',
}

export const ASSET_TYPE_LABELS: Record<string, string> = {
  property: 'Property',
  shares: 'Shares',
  reits: 'REITs',
  cash: 'Cash',
  fixed_deposit: 'Fixed Deposit',
  crypto: 'Crypto',
  business: 'Business',
  vehicle: 'Vehicle',
  other: 'Other',
}

export const LIABILITY_TYPE_LABELS: Record<string, string> = {
  mortgage: 'Mortgage',
  car_loan: 'Car Loan',
  personal_loan: 'Personal Loan',
  credit_card: 'Credit Card',
  business_loan: 'Business Loan',
  student_loan: 'Student Loan',
  other: 'Other',
}
