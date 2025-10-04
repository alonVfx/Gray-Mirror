# Gray Mirror - Multi-Agent Chat System

A sophisticated multi-agent chat system built with React, Firebase, and Google's Gemini AI. This application allows users to create and manage AI agents, engage in real-time conversations, and provides both free and premium subscription tiers.

## Features

- 🔐 **User Authentication** - Secure email/password authentication with email verification
- 🤖 **Multi-Agent Chat** - Create and manage custom AI agents with unique personalities
- 💬 **Real-time Messaging** - Live chat interface with typing indicators and message history
- 📊 **Admin Dashboard** - Comprehensive admin panel for user management and system monitoring
- 💳 **Freemium Model** - Free tier with message limits, premium tier for unlimited usage
- 🎨 **Modern UI** - Beautiful, responsive interface built with Tailwind CSS
- 🔒 **Secure Backend** - Cloud Functions for secure API integration and data processing

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React Icons
- **Backend**: Firebase Cloud Functions, Firestore, Firebase Auth
- **AI**: Google Gemini AI API
- **Deployment**: Firebase Hosting

## Quick Start

### Prerequisites

- Node.js 18+ installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- Firebase project created
- Google Gemini API key

### Installation

1. **Clone and install dependencies**:
   ```bash
   npm install
   cd functions && npm install && cd ..
   ```

2. **Configure Firebase**:
   ```bash
   firebase login
   firebase use your-project-id
   ```

3. **Set up Firebase services**:
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Enable Cloud Functions
   - Enable Hosting

4. **Configure environment variables**:
   ```bash
   firebase functions:config:set gemini.api_key="your-gemini-api-key"
   ```

5. **Update Firebase config**:
   Edit `src/firebase/config.js` with your Firebase project configuration:
   ```javascript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "your-sender-id",
     appId: "your-app-id"
   };
   ```

6. **Deploy Firestore rules and indexes**:
   ```bash
   firebase deploy --only firestore
   ```

7. **Deploy Cloud Functions**:
   ```bash
   firebase deploy --only functions
   ```

8. **Start development server**:
   ```bash
   npm run dev
   ```

9. **Deploy to production**:
   ```bash
   npm run build
   firebase deploy
   ```

## Project Structure

```
gray-mirror/
├── src/
│   ├── components/          # React components
│   │   ├── ChatComponent.jsx
│   │   ├── AgentManager.jsx
│   │   └── LoadingSpinner.jsx
│   ├── contexts/           # React contexts
│   │   └── AuthContext.jsx
│   ├── pages/              # Page components
│   │   ├── AuthPage.jsx
│   │   ├── DashboardPage.jsx
│   │   └── AdminPage.jsx
│   ├── firebase/           # Firebase configuration
│   │   └── config.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── functions/              # Cloud Functions
│   ├── src/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── firebase.json           # Firebase configuration
├── firestore.rules         # Firestore security rules
├── firestore.indexes.json  # Firestore indexes
└── package.json
```

## Database Structure

### Users Collection (`users/{userId}`)
```javascript
{
  email: string,
  plan: 'free' | 'premium',
  quota: {
    messagesUsedToday: number,
    messagesLimitDaily: number,
    lastResetDate: string
  },
  createdAt: timestamp,
  emailVerified: boolean
}
```

### Agents Subcollection (`users/{userId}/agents/{agentId}`)
```javascript
{
  name: string,
  identity: string,
  personality: string,
  color: string,
  createdAt: timestamp
}
```

### Conversations Subcollection (`users/{userId}/conversations/{conversationId}`)
```javascript
{
  userMessage: string,
  aiResponse: string,
  agents: array,
  timestamp: timestamp,
  userId: string
}
```

## API Endpoints

### Cloud Functions

- `callGemini` - Generate AI responses using Gemini API
- `resetDailyQuotas` - Reset daily message quotas (scheduled)
- `getUserStats` - Get user statistics for admin dashboard

## Security

- Firestore security rules ensure users can only access their own data
- Admin functions require specific email verification
- API keys are stored securely in Firebase Functions config
- All user inputs are validated and sanitized

## Customization

### Adding New Agent Types
1. Update the `AgentManager` component
2. Modify the agent creation form
3. Update the chat interface to handle new agent types

### Modifying Quota Limits
1. Update the quota structure in `AuthContext.jsx`
2. Modify the Cloud Functions to handle new quota logic
3. Update the UI to display new quota information

### Adding Payment Integration
1. Create a new Cloud Function for payment processing
2. Integrate with Stripe or your preferred payment provider
3. Update the user plan management logic

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the GitHub repository.
