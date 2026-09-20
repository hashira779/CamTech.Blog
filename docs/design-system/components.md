# Component Catalog & Variant System

To prevent UI divergence, all interactive elements and content cards are consumed from standard components.

## 1. UI Primitives (`apps/web/src/components/ui/`)
* **`Button`**:
  * `primary`: Main contextual call-to-action (`Plan Trip`, `Save`, `Search`).
  * `secondary`: Secondary supporting actions (`Preview`, `Reset`).
  * `outline`: Borders-only button for filters and neutral dialog dismissals.
  * `ghost`: Icon-only controls and subtle header actions.
  * `destructive`: Irreversible actions (`Archive`, `Reject`, `Remove`).
  * `link`: Inline text triggers.
* **`Badge`**:
  * `default`, `secondary`, `outline`, `success`, `warning`, `destructive`, `info`.
* **`Card`**:
  * Standard composition: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
  * Optional `hoverEffect` for interactive listing items.
* **`Input`, `Textarea`, `Select`, `FormField`**:
  * Standard form inputs with accessible labels, helper text, and error states.
* **`Skeleton`**:
  * Standard pulse placeholders matching destination and news card dimensions.
* **`Tabs`**:
  * Accessible `TabsList`, `TabsTrigger`, and `TabsContent` for category and day switching.
* **`Table`**:
  * High-density administrative table with responsive horizontal overflow.

## 2. Shared Product Components (`apps/web/src/components/shared/`)
* **`StatusBadge`**: Canonical verification and lifecycle indicator.
* **`Breadcrumbs`**: Standard navigation path with Lucide ChevronRight and Schema.org BreadcrumbList support.
* **`EmptyState`**: Explains what happened, why it's empty, and provides an actionable CTA button.
* **`ErrorState`**: Clear, calm, actionable error recovery with retry trigger.
* **`SearchBar`**: Global autocomplete search bar with filter chips.
* **`NewsCard`**: 16:9 hero, category badge, title, summary, source, and reading time.
* **`PlaceCard`**: 4:3 landmark photo, place type, title, location, and verified status.
* **`HotelCard`**: 4:3 room photo, amenities, verified rates, check-in details.
* **`TransportCard`**: Origin $\to$ Destination, departure/arrival, operator, duration, price.
* **`ToolCard`**: Utility icon, name, category, and launch trigger.
* **`QuizCard`**: Category, difficulty, question count, and start trigger.
