import apiClient from './client'

export interface CreateUserRequest {
  name: string
  email: string
  password: string
  unitId?: string | null
  isActive: boolean
}

export async function createUser(data: CreateUserRequest) {
  const response = await apiClient.post('/users', data)

  return response.data
}