![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/rishi8815/dietPlanner?utm_source=oss&utm_medium=github&utm_campaign=rishi8815%2FdietPlanner&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

# 🥗 AI Diet Planner

A personalized AI-powered diet planning mobile application built with React Native and Expo. Get smart meal recommendations, track your nutrition, and achieve your health goals with ease.

![React Native](https://img.shields.io/badge/React_Native-0.81.5-blue?logo=react)
![Expo](https://img.shields.io/badge/Expo-SDK_54-000020?logo=expo)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

### 🍽️ **Smart Meal Planning**
- AI-powered personalized meal recommendations
- Breakfast, lunch, dinner, and snack suggestions
- Customizable meal plans based on your preferences
- More ai features

### 📊 **Nutrition Tracking**
- Track daily calories, protein, carbs, and fat intake
- Visual progress indicators and charts
- Set and monitor personalized nutrition goals

### 📅 **Calendar Integration**
- Plan meals for specific dates
- Beautiful calendar modal for date selection
- View meal history by date

### 🌙 **Dark Mode Support**
- Full dark/light theme support
- System theme detection
- Smooth theme transitions

### 👤 **User Profile**
- Personal information management
- Activity level and goal tracking
- Dietary restrictions and allergies support

---

## 📱 Screenshots

| Home | Meals | Profile | Settings |
|------|-------|---------|----------|
| Daily overview | Meal planning | Stats & achievements | Preferences |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Bun](https://bun.sh/) (recommended) or npm
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rishi8815/dietPlanner.git
   cd dietPlanner
   ```

2. **Install dependencies**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Start the development server**
   ```bash
   bun start
   # or
   npx expo start
   ```

4. **Run on your preferred platform**
   - Press `w` for web
   - Press `a` for Android
   - Press `i` for iOS
   - Scan QR code with Expo Go app on your phone

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React Native** | Cross-platform mobile development |
| **Expo SDK 54** | Development framework and tooling |
| **TypeScript** | Type-safe development |
| **Expo Router** | File-based navigation |
| **React Navigation** | Navigation components |
| **React Native Calendars** | Calendar UI component |
| **React Native Chart Kit** | Data visualization |
| **Expo Secure Store** | Secure data storage |

---

## 📁 Project Structure

```
App/
├── app/                    # App screens (file-based routing)
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Home screen
│   │   ├── meals.tsx      # Meals planning
│   │   ├── profile.tsx    # User profile
│   │   ├── settings.tsx   # App settings
│   │   └── stats.tsx      # Statistics & charts
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
│   ├── ui/               # UI components
│   │   └── CalendarModal.tsx
│   ├── AIFoodRecommendation.tsx
│   ├── CustomBottomNav.tsx
│   ├── MealPlanContext.tsx
│   └── ThemeContext.tsx
├── services/              # API services
│   ├── GeminiService.ts   # AI recommendations
│   └── StorageService.ts  # Data persistence
├── constants/             # App constants
│   └── Colors.ts
├── hooks/                 # Custom React hooks
└── assets/               # Images and fonts
```

---

## 🎨 Theme Configuration

The app supports both light and dark themes with a comprehensive color palette:

```typescript
// Light Theme
primary: '#4CAF50'
background: '#f1e3ec'
surface: '#ffffff'

// Dark Theme  
primary: '#66BB6A'
background: '#121212'
surface: '#1E1E1E'
```

---

## 🔮 Roadmap

- [ ] Backend API integration
- [ ] User authentication (Clerk OAuth)
- [ ] Social sharing features
- [ ] Grocery list generation
- [ ] Recipe details with instructions
- [ ] Water intake tracking
- [ ] Exercise logging
- [ ] Weekly/Monthly reports

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Rishi** - [@rishi8815](https://github.com/rishi8815)

---

## 🙏 Acknowledgments

- [Expo](https://expo.dev/) for the amazing development platform
- [React Native](https://reactnative.dev/) community
- [Google Gemini](https://deepmind.google/technologies/gemini/) for AI capabilities

---

<p align="center">
  Made with ❤️ using React Native & Expo
</p>
