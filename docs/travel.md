# Daily Discovery — Travel, Transport & Map Architecture

## 1. Domain Hierarchy
The travel domain is database-driven and country-agnostic:

```text
Country (e.g. Cambodia, Thailand, Vietnam)
  ↓
Destination (e.g. Siem Reap, Phnom Penh, Kampot)
  ↓
Place / Specialized Accommodation / Hub (Angkor Wat, Raffles Hotel, Night Market Terminal)
```

## 2. Core Entities
1. **Destination:** Overview, coordinates, best time to visit, practical traveler guidelines.
2. **Place:** Geocoded coordinate pair, address, opening hours, pricing, verification status.
3. **Accommodation:** Specialized 1-to-1 extension on Place (room types, pool, breakfast, Wi-Fi, booking URL).
4. **TransportOperator:** Bus, Minivan, Train, Ferry, Taxi companies (Giant Ibis, Larryta Express, etc.).
5. **TransportHub:** Physical terminal stations and piers with passenger facilities.
6. **TransportRoute:** Origin -> Destination corridor with distance (km), duration (minutes), and base price.
7. **TransportSchedule:** Daily departure and arrival timetables, vehicle classes, verified pricing, and official booking links.
8. **Trip & TripDay:** Multi-day itineraries with hour-by-hour sequence.
9. **TravelGuide:** Curated field guides with reading time and practical rules.
10. **Event:** Cultural festivals and gatherings.

## 3. Spherical Haversine Nearby Search
Uses the great circle formula to compute spherical distances in kilometers without third-party vendor dependencies:
$$\text{dist} = 2r \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\text{lat}}{2}\right) + \cos(\text{lat}_1)\cos(\text{lat}_2)\sin^2\left(\frac{\Delta\text{lon}}{2}\right)}\right)$$
Automatically calculates estimated walk minutes (4.5 km/h) and driving minutes (30 km/h).
