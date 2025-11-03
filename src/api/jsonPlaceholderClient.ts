import { HttpClient, type QueryParamValue } from '#src/api/httpClient'

const client = new HttpClient({
  baseUrl: 'https://jsonplaceholder.typicode.com/',
  defaultHeaders: {
    Accept: 'application/json',
  },
})

export async function get<T>(
  path: string,
  query: Record<string, QueryParamValue> = {},
) {
  return client.get<T>(path, {
    searchParams: query,
  })
}
