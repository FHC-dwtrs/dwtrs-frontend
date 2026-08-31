import apiClient from './client'

export interface UserRole {
  userId: string
  roleId: string
  assignedAt: string
  role: {
    roleId: string
    name: string
    description: string
    isActive: boolean
    createdAt: string
  }
}

export interface UserUnit {
  unitId: string
  name: string
  unitType: 'SECTOR' | 'DIRECTORATE' | 'GROUP'
  parentUnitId: string | null
  isActive: boolean
}

export interface UserRoleInfo {
  roleId: string
  name: string
  description: string | null
  isActive: boolean
}

export interface User {
  userId: string
  name: string
  email: string
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
  unit: {
    unitId: string
    name: string
    unitType: string
    isActive: boolean
    parent: { unitId: string; name: string; unitType: string; isActive: boolean } | null
  } | null
  role: UserRoleInfo
}

export interface CreateUserRequest {
  name: string
  email: string
  password: string
  unitId?: string | null
  isActive: boolean
}

export interface UpdateUserRequest {
  name: string
  email: string
  unitId: string | null
}

// GET /users
export async function getUsers(): Promise<{
  success: boolean
  data: User[]
}> {
  const response = await apiClient.get('/users')

  return response.data
}

  // GET /users/:userId
  export async function getUser(
    userId: string
  ): Promise<{
    success: boolean
    data: User
  }> {
    const response = await apiClient.get(
      `/users/${userId}`
    )
  
    return response.data
  }
  
  

export async function createUser(data: CreateUserRequest) {
  const response = await apiClient.post('/users', data)

  return response.data
}

// PATCH /users/:userId
export async function updateUser(
  userId: string,
  data: UpdateUserRequest
): Promise<{
  success: boolean
  data: User
}> {
  const response = await apiClient.patch(
    `/users/${userId}`,
    data
  )

  return response.data
}


// PATCH /users/:userId/status
export async function updateUserStatus(
  userId: string,
  isActive: boolean
): Promise<{
  success: boolean
  data: User
}> {
  const response = await apiClient.patch(
    `/users/${userId}/status`,
    { isActive }
  )

  return response.data
}

// PATCH /users/:userId/unit
export async function updateUserUnit(
  userId: string,
  unitId: string | null
): Promise<{
  success: boolean
  data: User
}> {
  const response = await apiClient.patch(
    `/users/${userId}/unit`,
    { unitId }
  )

  return response.data
}