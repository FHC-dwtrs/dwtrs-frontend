import apiClient from './client'

export type UnitType = 'SECTOR' | 'DIRECTORATE' | 'GROUP'

export interface OrganizationUnit {
  unitId: string
  name: string
  unitType: UnitType
  parentUnitId: string | null
  isActive: boolean
}

export interface CreateOrganizationRequest {
  name: string
  unitType: UnitType
  parentUnitId?: string | null
}

export interface UpdateOrganizationRequest {
  name?: string
  parentUnitId?: string | null
}

export interface UpdateOrganizationStatusRequest {
  isActive: boolean
}

export interface UpdateOrganizationPayload {
    name?: string
    parentUnitId?: string | null
  }
  
  export interface UpdateOrganizationStatusPayload {
    isActive: boolean
  }
// GET /organizations
export async function getOrganizations(params?: {
  unitType?: UnitType
  isActive?: boolean
}) {
  const response = await apiClient.get('/organizations', {
    params,
  })

  return response.data
}

// POST /organizations
export async function createOrganization(
  data: CreateOrganizationRequest
) {
  const response = await apiClient.post('/organizations', data)

  return response.data
}

// GET /organizations/:unitId
export async function getOrganization(
    unitId: string
  ): Promise<{ success: boolean; message: string; data: OrganizationUnit }> {
    const response = await apiClient.get(`/organizations/${unitId}`)
  
    return response.data
  }

// GET /organizations/:unitId/children
export async function getOrganizationChildren(unitId: string) {
  const response = await apiClient.get(
    `/organizations/${unitId}/children`
  )

  return response.data
}

// GET /organizations/:unitId/users
export async function getOrganizationUsers(unitId: string) {
  const response = await apiClient.get(
    `/organizations/${unitId}/users`
  )

  return response.data
}

// PATCH /organizations/:unitId
export async function updateOrganization(
    unitId: string,
    payload: UpdateOrganizationPayload
  ): Promise<{ success: boolean; message: string; data: OrganizationUnit }> {
    const response = await apiClient.patch(
      `/organizations/${unitId}`,
      payload
    )
  
    return response.data
  }

// PATCH /organizations/:unitId/status
export async function updateOrganizationStatus(
    unitId: string,
    payload: UpdateOrganizationStatusPayload
  ): Promise<{ success: boolean; message: string; data: OrganizationUnit }> {
    const response = await apiClient.patch(
      `/organizations/${unitId}/status`,
      payload
    )
  
    return response.data
  }