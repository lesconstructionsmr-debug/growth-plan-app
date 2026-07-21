'use client'

import { useEffect, useRef, useState } from 'react'

interface AddressComponents {
  adresse: string
  ville: string
  province: string
  code_postal: string
}

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onAddressSelect: (components: AddressComponents) => void
  placeholder?: string
}

export default function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  placeholder = 'Rechercher une adresse...',
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

  useEffect(() => {
    if (!apiKey) return
    if ((window as any).google?.maps?.places) {
      setScriptLoaded(true)
      return
    }

    const scriptId = 'google-maps-places-script'
    let script = document.getElementById(scriptId) as HTMLScriptElement

    if (!script) {
      script = document.createElement('script')
      script.id = scriptId
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=fr-CA`
      script.async = true
      script.defer = true
      document.body.appendChild(script)
    }

    const handleLoad = () => setScriptLoaded(true)
    script.addEventListener('load', handleLoad)

    return () => {
      script.removeEventListener('load', handleLoad)
    }
  }, [apiKey])

  useEffect(() => {
    if (!scriptLoaded || !inputRef.current) return

    try {
      const google = (window as any).google
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'CA' },
        fields: ['address_components', 'formatted_address'],
        types: ['address'],
      })

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        if (!place.address_components) return

        let streetNumber = ''
        let route = ''
        let city = ''
        let province = 'QC'
        let postalCode = ''

        for (const component of place.address_components) {
          const types = component.types
          if (types.includes('street_number')) {
            streetNumber = component.long_name
          } else if (types.includes('route')) {
            route = component.long_name
          } else if (types.includes('locality')) {
            city = component.long_name
          } else if (types.includes('administrative_area_level_1')) {
            province = component.short_name
          } else if (types.includes('postal_code')) {
            postalCode = component.long_name
          }
        }

        const streetAddress = `${streetNumber} ${route}`.trim()
        
        onAddressSelect({
          adresse: streetAddress,
          ville: city,
          province: province,
          code_postal: postalCode,
        })
      })
    } catch (err) {
      console.error('Google Maps Autocomplete failed to initialize:', err)
    }
  }, [scriptLoaded, onAddressSelect])

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        background: 'var(--bg-2)',
        border: '0.5px solid var(--line)',
        borderRadius: '7px',
        padding: '8px 11px',
        fontSize: '12px',
        color: 'var(--txt-1)',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
      }}
      onFocus={e => (e.target.style.borderColor = 'var(--gold-3)')}
      onBlur={e => (e.target.style.borderColor = 'var(--line)')}
    />
  )
}
