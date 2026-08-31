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

export interface MeUser {
  sub: string
  email: string
  role: string
  unitId: string | null
}

export interface MeResponse {
  success: boolean
  message: string
  user: MeUser
}

export async function login(
  credentials: LoginRequest
): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>(
    '/auth/login',
    credentials
  )

  return response.data
}

export async function getMe(): Promise<MeResponse> {
  const response = await apiClient.get<MeResponse>('/auth/me')

  return response.data
}