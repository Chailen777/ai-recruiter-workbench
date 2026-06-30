'use server'

import { fetchDashboardStats } from '@/lib/dashboard'

export async function getDashboardStats() {
  return fetchDashboardStats()
}
