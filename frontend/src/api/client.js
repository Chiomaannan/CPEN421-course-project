import axios from 'axios'

function makeClient(baseURL) {
  const client = axios.create({ baseURL })

  client.interceptors.request.use((config) => {
    const token = localStorage.getItem('gercs_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  client.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 401) {
        localStorage.removeItem('gercs_token')
        window.location.href = '/login'
      }
      return Promise.reject(err)
    },
  )

  return client
}

export const authApi = makeClient('http://localhost:3001')
export const resourceApi = makeClient('http://localhost:3002')
export const incidentApi = makeClient('http://localhost:3003')
export const dispatchApi = makeClient('http://localhost:3004')
export const analyticsApi = makeClient('http://localhost:3005')
