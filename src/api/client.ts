import axios from 'axios'

const apiClient = axios.create({
  baseURL: 'https://dwtrs-backend.onrender.com/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('dwtrs_token')
  
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  
    return config
  })

export default apiClient