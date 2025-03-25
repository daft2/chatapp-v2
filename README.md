# ChatApp v2

A real-time chat and video calling application built with React Native and Expo.

## Thumbnail and Video

![Thumbnail](https://github.com/daft2/chatapp-v2/blob/master/demo/thumbnail.png)
![Video File](https://github.com/daft/chatapp-v2/demo/demo.mov)

## Features

- 💬 Real-time chat messaging
- 📱 Video calling functionality
- 🔐 User authentication
- 👤 User profiles
- 🎨 Modern UI with NativeWind styling

## Tech Stack

- [Expo](https://expo.dev/) with [expo-dev-client](https://docs.expo.dev/development/getting-started/)
- [React Native](https://reactnative.dev/)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Cloud Firestore](https://firebase.google.com/docs/firestore)
- [Agora RTC](https://www.agora.io/)
- [NativeWind](https://www.nativewind.dev/)

## Prerequisites

- Node.js
- Expo CLI
- Firebase account and configuration
- Agora account and API keys
- iOS/Android development environment

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd chatapp-v2
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file and add your configuration:
```
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_URL=your_firebase_url
EXPO_PUBLIC_AGORA_APP_ID=your_agora_app_id
```

## Development

Due to native dependencies, this app requires building with expo-dev-client:

```bash
npx expo prebuild
npx expo run:android  # for Android
npx expo run:ios      # for iOS
```

## License

MIT License

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.