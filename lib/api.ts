import { getAuthToken } from "@/lib/auth"

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "")

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  auth?: boolean
  body?: unknown
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { auth = true, body, headers, ...rest } = options

  const requestHeaders = new Headers(headers || {})
  const token = auth ? getAuthToken() : null

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`)
  }

  let requestBody: BodyInit | undefined
  if (body !== undefined && body !== null) {
    requestHeaders.set("Content-Type", "application/json")
    requestBody = JSON.stringify(body)
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: requestHeaders,
      body: requestBody,
      signal: controller.signal,
    })
  } catch {
    throw new ApiError(
      0,
      `Cannot reach API server at ${API_BASE_URL}. Start backend with "npm run api:start" (or "npm.cmd run api:start" in PowerShell) and verify NEXT_PUBLIC_API_URL.`
    )
  } finally {
    clearTimeout(timeout)
  }

  if (!response.ok) {
    let message = "Request failed"
    try {
      const payload = await response.json()
      message = payload?.message || message
    } catch {
      message = response.statusText || message
    }

    throw new ApiError(response.status, message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}
