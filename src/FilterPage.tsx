import { useMemo } from 'react'
import { useLoaderData, useNavigate, useSearchParams } from 'react-router-dom'
import type { RegionData } from './routes/region-data'

function parseId(value: string | null) {
  if (!value) {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

// Komponen ini merangkum seluruh kebutuhan dalam satu halaman.
export default function FilterPage() {
  const { provinces, regencies, districts } = useLoaderData<RegionData>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const provinceId = parseId(searchParams.get('province'))
  const regencyId = parseId(searchParams.get('regency'))
  const districtId = parseId(searchParams.get('district'))

  const selectedProvince = useMemo(
    () => provinces.find((province) => province.id === provinceId) ?? null,
    [provinces, provinceId],
  )

  const availableRegencies = useMemo(
    () =>
      selectedProvince
        ? regencies.filter((regency) => regency.province_id === selectedProvince.id)
        : [],
    [regencies, selectedProvince],
  )

  const selectedRegency = useMemo(
    () => availableRegencies.find((regency) => regency.id === regencyId) ?? null,
    [availableRegencies, regencyId],
  )

  const availableDistricts = useMemo(
    () =>
      selectedRegency
        ? districts.filter((district) => district.regency_id === selectedRegency.id)
        : [],
    [districts, selectedRegency],
  )

  const selectedDistrict = useMemo(
    () => availableDistricts.find((district) => district.id === districtId) ?? null,
    [availableDistricts, districtId],
  )

  const breadcrumbItems = useMemo(() => {
    const items = ['Indonesia', selectedProvince?.name, selectedRegency?.name, selectedDistrict?.name]
    return items.filter((item): item is string => Boolean(item))
  }, [selectedProvince, selectedRegency, selectedDistrict])

  const updateSearchParams = (updates: {
    province?: string | null
    regency?: string | null
    district?: string | null
  }) => {
    const nextParams = new URLSearchParams(searchParams)

    const applyValue = (key: string, value?: string | null) => {
      if (!value) {
        nextParams.delete(key)
        return
      }

      nextParams.set(key, value)
    }

    applyValue('province', updates.province)
    applyValue('regency', updates.regency)
    applyValue('district', updates.district)

    const nextSearch = nextParams.toString()
    navigate({ search: nextSearch ? `?${nextSearch}` : '' }, { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto grid min-h-screen max-w-screen-2xl grid-cols-1 lg:grid-cols-[320px_1fr]">
        <aside className="border-r border-slate-200 bg-slate-50 px-7 py-8">
          <h1 className="text-2xl font-bold">Frontend Assessment</h1>

          <section className="mt-12">
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Filter Wilayah</h2>

            <div className="mt-7 space-y-6">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Provinsi
                </span>
                <select
                  name="province"
                  value={selectedProvince?.id ?? ''}
                  onChange={(event) => {
                    updateSearchParams({
                      province: event.target.value || null,
                      regency: null,
                      district: null,
                    })
                  }}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-blue-500"
                >
                  <option value="">Pilih Provinsi</option>
                  {provinces.map((province) => (
                    <option key={province.id} value={province.id}>
                      {province.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Kota/Kabupaten
                </span>
                <select
                  name="regency"
                  value={selectedRegency?.id ?? ''}
                  onChange={(event) => {
                    updateSearchParams({
                      province: selectedProvince ? String(selectedProvince.id) : null,
                      regency: event.target.value || null,
                      district: null,
                    })
                  }}
                  disabled={!selectedProvince}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base outline-none transition enabled:focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="">{selectedProvince ? 'Pilih Kota/Kabupaten' : 'Pilih Provinsi dulu'}</option>
                  {availableRegencies.map((regency) => (
                    <option key={regency.id} value={regency.id}>
                      {regency.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Kecamatan
                </span>
                <select
                  name="district"
                  value={selectedDistrict?.id ?? ''}
                  onChange={(event) => {
                    updateSearchParams({
                      province: selectedProvince ? String(selectedProvince.id) : null,
                      regency: selectedRegency ? String(selectedRegency.id) : null,
                      district: event.target.value || null,
                    })
                  }}
                  disabled={!selectedRegency}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base outline-none transition enabled:focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="">{selectedRegency ? 'Pilih Kecamatan' : 'Pilih Kota/Kabupaten dulu'}</option>
                  {availableDistricts.map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <button
            type="button"
            onClick={() => {
              navigate({ search: '' }, { replace: true })
            }}
            className="mt-10 h-12 w-full rounded-xl border-2 border-blue-500 text-sm font-semibold uppercase tracking-widest text-blue-600 transition hover:bg-blue-50"
          >
            Reset
          </button>
        </aside>

        <div className="flex min-h-screen flex-col">
          <nav className="breadcrumb border-b border-slate-200 px-8 py-6 text-sm text-slate-500">
            <ol className="flex flex-wrap items-center gap-2">
              {breadcrumbItems.map((item, index) => (
                <li key={`${item}-${index}`} className="flex items-center gap-2">
                  <span className={index === breadcrumbItems.length - 1 ? 'font-semibold text-blue-600' : ''}>
                    {item}
                  </span>
                  {index !== breadcrumbItems.length - 1 && <span aria-hidden>›</span>}
                </li>
              ))}
            </ol>
          </nav>

          <main className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
            <section>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-blue-300">Provinsi</p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
                {selectedProvince?.name ?? '-'}
              </h2>
            </section>

            <p className="my-8 text-3xl text-slate-300">↓</p>

            <section>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-blue-300">Kota / Kabupaten</p>
              <h3 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
                {selectedRegency?.name ?? '-'}
              </h3>
            </section>

            <p className="my-8 text-3xl text-slate-300">↓</p>

            <section>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-blue-300">Kecamatan</p>
              <h4 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
                {selectedDistrict?.name ?? '-'}
              </h4>
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}
