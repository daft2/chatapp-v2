# expo-nativewind-template

Opiniated Expo, React Native, NativeWind Template by Me

## Overview

This repository serves as an opinionated template for starting new projects with Expo, React Native, NativeWind, and Lucide React Native Icons. It provides a solid foundation to kickstart your development process with best practices and pre-configured libraries.

## Features

- **Expo**: A framework that enables you to build native apps using React.
- **React Native**: JavaScript-based UI library for building natively rendered mobile applications.
- **NativeWind**: A Tailwind CSS-like utility-first styling solution for React Native.
- **Lucide Icons**: A collection of 240+ free, open-source icons with custom colors and sizes.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/)
- [Expo CLI](https://docs.expo.dev/guides/installation/)

### Installation

1. **Clone the repository:**

   ```sh
   git clone https://github.com/yourusername/expo-nativewind-template.git
   cd expo-nativewind-template
   ```

2. **Install dependencies:**

   ```sh
   npm install
   # or if you prefer using yarn
   yarn install
   ```

3. **Run the project:**

   ```sh
   npm start
   # or with yarn
   yarn start
   ```

4. **Build and publish (optional):**
   If you need to build and publish your app, refer to [Expo's documentation](https://docs.expo.dev/guides/build-reference/overview/) for more details.

## Usage

### Styling with NativeWind

You can use NativeWind to style your components. For example:

```jsx
import { View, Text } from "react-native";
import tw from "tw";

const App = () => (
  <View style={tw`flex-1 justify-center items-center bg-gray-500`}>
    <Text style={tw`text-2xl font-bold text-white`}>Hello NativeWind!</Text>
  </View>
);

export default App;
```

### Using Lucide Icons

To use a Lucide icon, import it and include it in your components. For example:

```jsx
import { Home } from "lucide-react-native";

const App = () => <Home size={24} color="blue" />;

export default App;
```

## Contributing

Contributions are welcome! Feel free to open issues, submit pull requests, or provide feedback on the template.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
