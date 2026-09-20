# Form Design & Validation Guidelines

All forms across the platform adhere to a strict pattern:

## 1. Component Structure
```text
FormField
├── Label (with asterisk for required fields)
├── Input / Select / Textarea
├── Helper text (contextual guidance before typing)
└── Error message (actionable explanation if invalid)
```

## 2. Core Rules
1. **Never use placeholder text as the only label**: Placeholders disappear upon focus, creating severe accessibility barriers for screen readers and cognitive load for users.
2. **Actionable Error Messages**: Explain *how* to resolve the mistake (e.g., "Please enter a valid Cambodian phone number (+855...)" rather than "Invalid input").
3. **No Premature Errors**: Do not show validation errors on pristine, untouched forms before user submission.
4. **Grouped Sections**: In complex forms (like Place suggestions or Admin Article editing), group fields logically under clean section headings with collapsible panels for advanced metadata.
