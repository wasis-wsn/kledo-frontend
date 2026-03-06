export type Province = {
  id: number
  name: string
}

export type Regency = {
  id: number
  name: string
  province_id: number
}

export type District = {
  id: number
  name: string
  regency_id: number
}

export type RegionData = {
  provinces: Province[]
  regencies: Regency[]
  districts: District[]
}

export async function regionsLoader() {
  const response = await fetch('/data/indonesia_regions.json')

  if (!response.ok) {
    throw new Response('Failed to load region data', { status: response.status })
  }

  return (await response.json()) as RegionData
}
