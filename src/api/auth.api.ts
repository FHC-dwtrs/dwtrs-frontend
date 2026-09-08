import { AuthUser } from '@/types'
import apiClient from './client'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  success: boolean
  message: string
  data: {
    token: string
    user: AuthUser
  }
}

// ============================================================
// AUTHENTICATED USER
// ============================================================

export interface MeUser {
  userId: string
  name: string
  email: string

  unit: {
    id: string
    name: string
    unitType: string
  }

  role: string
  permissions: string[]
}

export interface MeResponse {
  success: boolean
  message: string
  user: MeUser
}

// ============================================================
// LOGIN
// ============================================================

export async function login(
  credentials: LoginRequest
): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>(
    '/auth/login',
    credentials
  )

  return response.data
}

// ============================================================
// GET CURRENT USER
// ============================================================

export async function getMe(): Promise<MeResponse> {
  const response = await apiClient.get<MeResponse>(
    '/auth/me'
  )

  return response.data
}