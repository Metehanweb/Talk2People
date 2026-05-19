import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './src/features/auth/screens/LoginScreen';
import RegisterScreen from './src/features/auth/screens/RegisterScreen';

import ChannelListScreen from './src/features/channels/screens/ChannelListScreen';
import ChatScreen from './src/features/messages/screens/ChatScreen';
import VoiceChannelScreen from './src/features/voice/screens/VoiceChannelScreen';

const Stack = createNativeStackNavigator();

export default function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Login">
                <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
                <Stack.Screen name="ChannelList" component={ChannelListScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Sohbet' }} />
                <Stack.Screen name="VoiceChannel" component={VoiceChannelScreen} options={{ title: 'Sesli Kanal' }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
