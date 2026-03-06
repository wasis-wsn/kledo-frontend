/* eslint-disable react-refresh/only-export-components */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import {
  redirect,
  Form,
  useLoaderData,
  useNavigation,
  useSearchParams,
  useSubmit,
  type ActionFunctionArgs,
} from 'react-router-dom'

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

function parseFormId(value: FormDataEntryValue | null) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? String(parsed) : null
}

export async function regionsAction({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'reset') {
    return redirect('/')
  }

  const province = parseFormId(formData.get('province'))
  const regency = parseFormId(formData.get('regency'))
  const district = parseFormId(formData.get('district'))

  const params = new URLSearchParams()

  if (province) {
    params.set('province', province)
  }

  if (province && regency) {
    params.set('regency', regency)
  }

  if (province && regency && district) {
    params.set('district', district)
  }

  const search = params.toString()
  return redirect(search.length > 0 ? `/?${search}` : '/')
}

type SelectOption = {
  value: number
  label: string
}

type SelectValue = number | ''

type DisplayOption = {
  value: SelectValue
  label: string
}

type SelectFieldProps = {
  label: string
  name: 'province' | 'regency' | 'district'
  value: SelectValue
  disabled?: boolean
  placeholder: string
  options: SelectOption[]
  onSelect: (value: SelectValue) => void
  icon: ReactNode
}

function SelectField({
  label,
  name,
  value,
  disabled,
  placeholder,
  options,
  onSelect,
  icon,
}: Readonly<SelectFieldProps>) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)

  const allOptions = useMemo<DisplayOption[]>(() => {
    return [{ value: '', label: placeholder }, ...options]
  }, [options, placeholder])

  const selectedIndex = useMemo(() => {
    const index = allOptions.findIndex((option) => option.value === value)
    return Math.max(index, 0)
  }, [allOptions, value])

  const normalizedHighlightedIndex = Math.min(highlightedIndex, allOptions.length - 1)

  const openWithHighlighted = useCallback(
    (index: number) => {
      setIsOpen(true)
      setHighlightedIndex(index)
    },
    [setIsOpen, setHighlightedIndex],
  )

  const selectHighlighted = useCallback(() => {
    const target = allOptions[normalizedHighlightedIndex]

    if (!target) {
      return
    }

    setIsOpen(false)
    onSelect(target.value)
  }, [allOptions, normalizedHighlightedIndex, onSelect])

  const handleButtonKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) {
        return
      }

      switch (event.key) {
        case 'Escape':
          if (isOpen) {
            event.preventDefault()
            setIsOpen(false)
          }
          return
        case 'Home':
          if (isOpen) {
            event.preventDefault()
            setHighlightedIndex(0)
          }
          return
        case 'End':
          if (isOpen) {
            event.preventDefault()
            setHighlightedIndex(allOptions.length - 1)
          }
          return
        case 'ArrowDown':
          event.preventDefault()

          if (!isOpen) {
            openWithHighlighted(Math.min(selectedIndex + 1, allOptions.length - 1))
            return
          }

          setHighlightedIndex((current) => Math.min(current + 1, allOptions.length - 1))
          return
        case 'ArrowUp':
          event.preventDefault()

          if (!isOpen) {
            openWithHighlighted(Math.max(selectedIndex - 1, 0))
            return
          }

          setHighlightedIndex((current) => Math.max(current - 1, 0))
          return
        case 'Enter':
        case ' ':
          event.preventDefault()

          if (isOpen) {
            selectHighlighted()
            return
          }

          openWithHighlighted(selectedIndex)
          return
        default:
          return
      }
    },
    [
      allOptions.length,
      disabled,
      isOpen,
      openWithHighlighted,
      selectHighlighted,
      selectedIndex,
      setHighlightedIndex,
    ],
  )

  const selectedLabel = useMemo(() => {
    if (value === '') {
      return placeholder
    }

    return options.find((option) => option.value === value)?.label ?? placeholder
  }, [options, placeholder, value])

  const commitSelection = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>, nextValue: SelectValue) => {
      event.preventDefault()
      event.stopPropagation()
      setIsOpen(false)
      onSelect(nextValue)
    },
    [onSelect],
  )

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const root = rootRef.current

      if (!root) {
        return
      }

      if (!root.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [])

  return (
    <div className="block">
      <span className="mb-2 block text-sm font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      <input type="hidden" name={name} value={value} />

      <div ref={rootRef} className="group relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center text-slate-400 transition-colors group-focus-within:text-blue-500">
          {icon}
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (disabled) {
              return
            }

            setIsOpen((current) => {
              const next = !current

              if (next) {
                setHighlightedIndex(selectedIndex)
              }

              return next
            })
          }}
          onKeyDown={handleButtonKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className="h-12 w-full appearance-none rounded-2xl border border-slate-300 bg-white/95 pl-12 pr-12 text-base font-medium text-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.08)] outline-none transition-all enabled:cursor-pointer enabled:hover:border-blue-400 enabled:hover:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          <span className={value === '' ? 'text-slate-400' : ''}>{selectedLabel}</span>
        </button>

        <div className="pointer-events-none absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 transition-transform duration-200 group-focus-within:text-blue-500">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
            <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.174l3.71-2.944a.75.75 0 1 1 .93 1.172l-4.18 3.316a.75.75 0 0 1-.93 0L5.25 8.402a.75.75 0 0 1-.02-1.06Z" />
          </svg>
        </div>

        {isOpen && !disabled && (
          <ul className="absolute z-20 mt-2 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-[0_12px_30px_rgba(15,23,42,0.12)]">
            <li>
              <button
                type="button"
                onMouseDown={(event) => {
                  commitSelection(event, '')
                }}
                onMouseEnter={() => {
                  setHighlightedIndex(0)
                }}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                  value === '' || normalizedHighlightedIndex === 0
                    ? 'bg-blue-50 font-semibold text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50'
                } cursor-pointer`}
              >
                {placeholder}
              </button>
            </li>

            {options.map((option, index) => (
              <li key={option.value}>
                <button
                  type="button"
                  onMouseDown={(event) => {
                    commitSelection(event, option.value)
                  }}
                  onMouseEnter={() => {
                    setHighlightedIndex(index + 1)
                  }}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                    value === option.value || normalizedHighlightedIndex === index + 1
                      ? 'bg-blue-50 font-semibold text-blue-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  } cursor-pointer`}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function parseId(value: FormDataEntryValue | string | null) {
  if (typeof value !== 'string' || value.length === 0) {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export default function FilterPage() {
  const { provinces, regencies, districts } = useLoaderData<RegionData>()
  const [searchParams] = useSearchParams()
  const submit = useSubmit()
  const navigation = useNavigation()

  const isPending = navigation.state !== 'idle'

  const provinceId = parseId(searchParams.get('province'))
  const regencyId = parseId(searchParams.get('regency'))
  const districtId = parseId(searchParams.get('district'))

  const pendingFormData = navigation.formMethod === 'POST' ? navigation.formData : undefined
  const isActionNavigation = pendingFormData != null

  const pendingProvinceId = pendingFormData ? parseId(pendingFormData.get('province')) : null
  const pendingRegencyId = pendingFormData ? parseId(pendingFormData.get('regency')) : null
  const pendingDistrictId = pendingFormData ? parseId(pendingFormData.get('district')) : null

  const effectiveProvinceId = isActionNavigation ? pendingProvinceId : provinceId
  const nextRegencyId = isActionNavigation ? pendingRegencyId : regencyId
  const effectiveRegencyId = effectiveProvinceId ? nextRegencyId : null
  const nextDistrictId = isActionNavigation ? pendingDistrictId : districtId
  const effectiveDistrictId = effectiveRegencyId ? nextDistrictId : null

  const provinceById = useMemo(() => {
    return new Map(provinces.map((province) => [province.id, province]))
  }, [provinces])

  const regencyById = useMemo(() => {
    return new Map(regencies.map((regency) => [regency.id, regency]))
  }, [regencies])

  const districtById = useMemo(() => {
    return new Map(districts.map((district) => [district.id, district]))
  }, [districts])

  const regenciesByProvinceId = useMemo(() => {
    const grouped = new Map<number, Regency[]>()

    for (const regency of regencies) {
      const current = grouped.get(regency.province_id)

      if (current) {
        current.push(regency)
        continue
      }

      grouped.set(regency.province_id, [regency])
    }

    return grouped
  }, [regencies])

  const districtsByRegencyId = useMemo(() => {
    const grouped = new Map<number, District[]>()

    for (const district of districts) {
      const current = grouped.get(district.regency_id)

      if (current) {
        current.push(district)
        continue
      }

      grouped.set(district.regency_id, [district])
    }

    return grouped
  }, [districts])

  const selectedProvince = useMemo(
    () => (effectiveProvinceId ? provinceById.get(effectiveProvinceId) ?? null : null),
    [provinceById, effectiveProvinceId],
  )

  const selectedRegency = useMemo(() => {
    if (!selectedProvince || !effectiveRegencyId) {
      return null
    }

    const candidate = regencyById.get(effectiveRegencyId)
    return candidate?.province_id === selectedProvince.id ? candidate : null
  }, [selectedProvince, regencyById, effectiveRegencyId])

  const selectedDistrict = useMemo(() => {
    if (!selectedRegency || !effectiveDistrictId) {
      return null
    }

    const candidate = districtById.get(effectiveDistrictId)
    return candidate?.regency_id === selectedRegency.id ? candidate : null
  }, [selectedRegency, districtById, effectiveDistrictId])

  const availableRegencies = useMemo(
    () => (selectedProvince ? regenciesByProvinceId.get(selectedProvince.id) ?? [] : []),
    [regenciesByProvinceId, selectedProvince],
  )

  const availableDistricts = useMemo(
    () => (selectedRegency ? districtsByRegencyId.get(selectedRegency.id) ?? [] : []),
    [districtsByRegencyId, selectedRegency],
  )

  const breadcrumbItems = useMemo(() => {
    const items = ['Indonesia', selectedProvince?.name, selectedRegency?.name, selectedDistrict?.name]
    return items.filter((item): item is string => Boolean(item))
  }, [selectedProvince, selectedRegency, selectedDistrict])

  const submitFilters = useCallback(
    (next: { province: number | ''; regency: number | ''; district: number | '' }) => {
      const payload = new FormData()
      payload.set('province', next.province === '' ? '' : String(next.province))
      payload.set('regency', next.regency === '' ? '' : String(next.regency))
      payload.set('district', next.district === '' ? '' : String(next.district))

      submit(payload, { method: 'post', replace: true })
    },
    [submit],
  )

  const handleProvinceSelect = useCallback(
    (value: number | '') => {
      submitFilters({ province: value, regency: '', district: '' })
    },
    [submitFilters],
  )

  const handleRegencySelect = useCallback(
    (value: number | '') => {
      submitFilters({ province: selectedProvince?.id ?? '', regency: value, district: '' })
    },
    [selectedProvince, submitFilters],
  )

  const handleDistrictSelect = useCallback(
    (value: number | '') => {
      submitFilters({
        province: selectedProvince?.id ?? '',
        regency: selectedRegency?.id ?? '',
        district: value,
      })
    },
    [selectedProvince, selectedRegency, submitFilters],
  )

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 transition-opacity duration-200" aria-busy={isPending}>
      <div className="mx-auto grid min-h-screen max-w-screen-2xl grid-cols-1 lg:grid-cols-[320px_1fr]">
        <aside className="border-r border-slate-200 bg-slate-50 px-7 py-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-earth-icon lucide-earth">
                <path d="M21.54 15H17a2 2 0 0 0-2 2v4.54"/>
                <path d="M7 3.34V5a3 3 0 0 0 3 3a2 2 0 0 1 2 2c0 1.1.9 2 2 2a2 2 0 0 0 2-2c0-1.1.9-2 2-2h3.17"/>
                <path d="M11 21.95V18a2 2 0 0 0-2-2a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05"/>
                <circle cx="12" cy="12" r="10"/>
              </svg>
            </span>
            <h1 className="text-xl font-bold">Frontend Assessment</h1>
          </div>

          <section className="mt-12">
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Filter Wilayah</h2>

            <Form method="post" replace className="mt-7 space-y-6">
              <fieldset disabled={isPending} className="space-y-6 disabled:opacity-70">
                <SelectField
                  label="Provinsi"
                  name="province"
                  value={selectedProvince?.id ?? ''}
                  placeholder="Pilih Provinsi"
                  options={provinces.map((province) => ({ value: province.id, label: province.name }))}
                  onSelect={handleProvinceSelect}
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-icon lucide-map">
                        <path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/>
                        <path d="M15 5.764v15"/>
                        <path d="M9 3.236v15"/>
                    </svg>
                  }
                />

                <SelectField
                  label="Kota/Kabupaten"
                  name="regency"
                  value={selectedRegency?.id ?? ''}
                  placeholder={selectedProvince ? 'Pilih Kota/Kabupaten' : 'Pilih Provinsi dulu'}
                  options={availableRegencies.map((regency) => ({ value: regency.id, label: regency.name }))}
                  onSelect={handleRegencySelect}
                  disabled={!selectedProvince || isPending}
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-building2-icon lucide-building-2">
                        <path d="M10 12h4"/><path d="M10 8h4"/>
                        <path d="M14 21v-3a2 2 0 0 0-4 0v3"/>
                        <path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"/>
                        <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/>
                    </svg>
                  }
                />

                <SelectField
                  label="Kecamatan"
                  name="district"
                  value={selectedDistrict?.id ?? ''}
                  placeholder={selectedRegency ? 'Pilih Kecamatan' : 'Pilih Kota/Kabupaten dulu'}
                  options={availableDistricts.map((district) => ({ value: district.id, label: district.name }))}
                  onSelect={handleDistrictSelect}
                  disabled={!selectedRegency || isPending}
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin-house-icon lucide-map-pin-house">
                        <path d="M15 22a1 1 0 0 1-1-1v-4a1 1 0 0 1 .445-.832l3-2a1 1 0 0 1 1.11 0l3 2A1 1 0 0 1 22 17v4a1 1 0 0 1-1 1z"/>
                        <path d="M18 10a8 8 0 0 0-16 0c0 4.993 5.539 10.193 7.399 11.799a1 1 0 0 0 .601.2"/><path d="M18 22v-3"/>
                        <circle cx="10" cy="10" r="3"/>
                    </svg>
                  }
                />
              </fieldset>

              <button
                type="submit"
                name="intent"
                value="reset"
                disabled={isPending}
                className="mt-10 h-12 w-full rounded-xl border-2 border-blue-500 text-sm font-semibold uppercase tracking-widest text-blue-600 transition enabled:hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                Reset
              </button>
            </Form>
          </section>
        </aside>

        <div className="flex min-h-screen flex-col transition-opacity duration-200 motion-reduce:transition-none">
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
