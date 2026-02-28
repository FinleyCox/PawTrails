# Paws & Paths - Mobile App Design

## Design Philosophy

**Paws & Paths** is a warm, playful dog walking companion app designed for iOS/Android in **portrait orientation (9:16)**. The design prioritizes **one-handed usage**, friendly interactions, and celebrating the bond between dogs and their owners.

### Visual Identity

**Color Palette (Amber/Orange Tones):**
- **Primary**: `#F59E0B` (Warm Amber) - Main actions, highlights
- **Secondary**: `#FB923C` (Soft Orange) - Accents, hover states
- **Tertiary**: `#FBBF24` (Light Amber) - Backgrounds, cards
- **Background**: `#FFFBF0` (Cream White) - Warm neutral base
- **Text Primary**: `#78350F` (Deep Brown) - Main text
- **Text Secondary**: `#92400E` (Medium Brown) - Secondary text
- **Accent**: `#10B981` (Green) - Success states, positive feedback
- **Warning**: `#EF4444` (Red) - Alerts, temperature warnings

**Typography:**
- **Display**: "Poppins" (bold, friendly) - Headers, app name
- **Body**: "Inter" (clean, readable) - Content text
- **Monospace**: "JetBrains Mono" - Stats, numbers

**Shapes:**
- **Border Radius**: 24px for cards, 16px for buttons, 12px for inputs
- **Rounded corners throughout** for a soft, approachable feel

---

## Screen List & Layout

### 1. **Home Screen** (Tab: Home)
**Primary Purpose**: Quick overview of today's activities and next walk

**Content & Functionality:**
- **Header**: App name "Paws & Paths" with current time/date
- **Today's Summary Card**: 
  - Total walks today (count)
  - Total distance walked (km/miles)
  - Total time spent (hours:minutes)
  - Quick weather badge (temperature, condition icon)
- **Active Dogs Section**:
  - Horizontal scrollable list of dog avatars
  - Tap to select dog for quick walk start
- **Quick Start Button**: Large, prominent "Start Walk" button (amber background)
- **Recent Walks Preview**: Last 3 walks with timestamps and dog names
- **Bottom Navigation**: Home, Dogs, Walks, Settings

### 2. **Dog Profiles Screen** (Tab: Dogs)
**Primary Purpose**: Manage and view all dog profiles

**Content & Functionality:**
- **Dog List**: Vertical scrollable list of all dogs
  - Each dog card shows:
    - Dog avatar/photo (circular, 80px)
    - Dog name (bold)
    - Breed and age
    - Total walks this month
    - Tap to view/edit profile
- **Add Dog Button**: Floating action button (FAB) in bottom-right corner
- **Dog Detail Screen** (modal/sheet):
  - Large dog photo at top
  - Dog name, breed, age, weight
  - Health notes (allergies, medications)
  - Favorite walk locations
  - Edit button, delete button

### 3. **Start Walk Screen** (Modal from Home or Dogs)
**Primary Purpose**: Begin a new walk session

**Content & Functionality:**
- **Dog Selection**: 
  - Show selected dog prominently
  - Option to add multiple dogs to this walk
- **Walk Details Input**:
  - Destination/location (optional text input)
  - Expected duration (slider: 15-120 minutes)
  - Walk type (casual, exercise, training, potty break)
- **Weather Display**:
  - Current temperature
  - Condition (sunny, rainy, etc.)
  - Floor temperature (if available)
  - UV index
- **Start Button**: Begin walk tracking
- **Cancel Button**: Close modal

### 4. **Active Walk Screen** (Full screen during walk)
**Primary Purpose**: Track walk in real-time with map and stats

**Content & Functionality:**
- **Map View** (top 60% of screen):
  - Real-time location tracking
  - Route drawn on map
  - Current location marker
  - Pinch to zoom, tap to center
- **Walk Stats** (bottom 40% of screen, semi-transparent overlay):
  - Elapsed time (MM:SS format)
  - Distance walked (km/miles)
  - Average speed
  - Current pace
  - Calories burned (estimated)
- **Control Buttons**:
  - Pause button (pause tracking)
  - End Walk button (finish and save)
  - Emergency SOS button (red, small, top-right)
- **Dog Info**: Dog name and photo in small header

### 5. **Walk History Screen** (Tab: Walks)
**Primary Purpose**: View past walks and statistics

**Content & Functionality:**
- **Filter/Sort Options**:
  - By dog (dropdown)
  - By date range (this week, this month, all time)
  - Sort by date, distance, duration
- **Walk List**:
  - Each walk card shows:
    - Date and time
    - Dog name(s)
    - Distance and duration
    - Weather icon
    - Tap to view walk details
- **Walk Detail Screen** (modal):
  - Full map of walk route
  - All stats (distance, duration, pace, calories)
  - Photos taken during walk (if any)
  - Notes/observations
  - Edit or delete options

### 6. **Weather & Floor Temperature Screen** (Tab: Settings → Weather)
**Primary Purpose**: Check conditions before and during walks

**Content & Functionality:**
- **Current Weather**:
  - Large temperature display
  - Weather condition (icon + text)
  - Feels-like temperature
  - Humidity, wind speed
  - UV index with warning if high
- **Floor Temperature**:
  - Current pavement/ground temperature
  - Visual indicator (safe/caution/hot)
  - Recommendation: "Safe for paws" / "Use booties" / "Stay indoors"
- **Hourly Forecast**: 6-hour forecast with icons
- **Daily Forecast**: 7-day forecast cards
- **Location**: Current location name, option to change

### 7. **Settings Screen** (Tab: Settings)
**Primary Purpose**: App configuration and preferences

**Content & Functionality:**
- **Profile Section**:
  - User name (if logged in)
  - Profile photo
  - Edit profile button
- **Preferences**:
  - Units (km/miles, °C/°F)
  - Notifications (walk reminders, weather alerts)
  - Dark mode toggle
  - Language selection
- **Data & Privacy**:
  - Export walk data
  - Clear history
  - Privacy policy link
  - Terms of service link
- **About**:
  - App version
  - Feedback button
  - Rate app button

---

## Key User Flows

### Flow 1: Start a Walk
1. User taps "Start Walk" on home screen
2. Select dog (single or multiple)
3. Choose walk type and expected duration
4. Review weather and floor temperature
5. Tap "Start" → Active Walk screen opens
6. Map and stats display in real-time
7. User can pause, resume, or end walk
8. Upon end, walk is saved with summary

### Flow 2: Add a New Dog
1. User taps "+" button on Dogs tab
2. Add Dog form opens (modal)
3. Enter dog name, breed, age, weight, photo
4. Add optional health notes
5. Tap "Save" → Dog profile created
6. Dog appears in list and available for walks

### Flow 3: Check Weather Before Walk
1. User navigates to Settings → Weather
2. View current conditions and floor temperature
3. See hourly and daily forecast
4. Decide if conditions are safe for dog
5. Return to home and start walk (or reschedule)

### Flow 4: Review Walk History
1. User taps Walks tab
2. Filter by dog or date range
3. Tap a walk to view details
4. See full map, stats, and notes
5. Option to edit or delete walk

---

## Component Architecture

### Reusable Components
- **DogCard**: Dog profile card with avatar, name, stats
- **WalkCard**: Walk summary card with date, distance, duration
- **StatBadge**: Small stat display (distance, time, calories)
- **WeatherWidget**: Current weather display with icon
- **MapView**: Embedded map with route visualization
- **Button**: Rounded button with amber/orange theme
- **Input**: Rounded text input with warm styling
- **Tabs**: Bottom tab navigation with icons

### Screens (Tabs)
- `HomeScreen`: Home tab
- `DogsScreen`: Dogs tab
- `WalksScreen`: Walks tab
- `SettingsScreen`: Settings tab
- `StartWalkModal`: Modal for starting walk
- `ActiveWalkScreen`: Full-screen walk tracking
- `DogDetailModal`: Dog profile detail view
- `WalkDetailModal`: Walk history detail view

---

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#F59E0B` | Main actions, highlights |
| `secondary` | `#FB923C` | Accents, hover states |
| `background` | `#FFFBF0` | Screen background |
| `surface` | `#FEF3C7` | Card backgrounds |
| `text-primary` | `#78350F` | Main text |
| `text-secondary` | `#92400E` | Secondary text |
| `border-radius-lg` | `24px` | Cards, large elements |
| `border-radius-md` | `16px` | Buttons, inputs |
| `border-radius-sm` | `12px` | Small elements |
| `spacing-unit` | `8px` | Base spacing unit |

---

## Interaction Patterns

### Button Feedback
- **Press**: Scale 0.97 + opacity 0.9
- **Haptic**: Light impact on tap
- **State**: Disabled = opacity 0.5

### Card Interactions
- **Tap**: Opacity 0.7 + navigate or open detail
- **Long Press**: Show context menu (edit, delete)

### Scroll Behavior
- **Smooth scrolling** for lists and horizontal carousels
- **Pull-to-refresh** on home and walks screens

### Animations
- **Subtle fade-ins** on screen load (200ms)
- **Smooth transitions** between tabs (150ms)
- **Gentle scale** on button press (80ms)

---

## Accessibility Considerations

- **Color Contrast**: All text meets WCAG AA standards
- **Touch Targets**: Minimum 44×44pt for all interactive elements
- **Labels**: All buttons and inputs have clear labels
- **Dark Mode**: Full support with adjusted color palette
- **Screen Reader**: Semantic structure with proper labels

---

## Notes for Development

- Use **AsyncStorage** for local walk data persistence (no backend required unless user requests cloud sync)
- Integrate **flutter_location** for GPS tracking during walks
- Use **flutter_map** for map display
- Fetch weather data from free API (e.g., Open-Meteo)
- Implement **haptic feedback** for key interactions
- Test on both iOS and Android for consistent experience
