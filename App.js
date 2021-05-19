import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import React from 'react';
import LoginView from "./newcall/LoginView";
import UserListView from "./newcall/UserListView";
import CallView from "./newcall/CallView";
const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Login"
          component={LoginView}
          options={{headerShown: false}}
        />
        <Stack.Screen
            name="List"
            component={UserListView} />
        <Stack.Screen
            name="Call"
            component={CallView}
            options={{headerShown: false}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
