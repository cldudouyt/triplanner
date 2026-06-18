// Cache en memoire persistant pendant la session SPA
const cache = new Map<string, [number, number]>()

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function geocodeLocations(
  locations: string[]
): Promise<Map<string, [number, number]>> {
  // Deduplique et filtre les locations deja en cache
  const uniqueLocations = [...new Set(locations)]
  const toGeocode = uniqueLocations.filter(loc => !cache.has(loc))

  // Geocode sequentiellement avec rate limiting
  for (let i = 0; i < toGeocode.length; i++) {
    const loc = toGeocode[i]

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(loc)},France&limit=1`,
        {
          headers: {
            'User-Agent': 'triathlon-app',
          },
        }
      )

      const data = await response.json()

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat)
        const lon = parseFloat(data[0].lon)
        cache.set(loc, [lat, lon])
      }
    } catch {
      // Echec silencieux - la competition n'aura pas de marqueur
    }

    // Rate limit: attendre 1 seconde entre chaque requete (sauf pour la derniere)
    if (i < toGeocode.length - 1) {
      await delay(1000)
    }
  }

  return cache
}
