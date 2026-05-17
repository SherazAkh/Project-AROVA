import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from './screen/Login/Login'
import Signup from './screen/Signup/Signup'
import Home from './components/screens/Home';
import MyCart from './components/screens/MyCart';
import ProductInfo from './components/screens/ProductInfo';
import ARScreen from './screen/ARScreen';
import ThreeDView from './screen/ThreeDView/ThreeDView';
import AllProducts from './screen/AllProducts/AllProducts';
import Welcome from './screen/Welcome/Welcome';
import CheckoutScreen from './components/screens/CheckoutScreen';
import AboutUs from './screen/AboutUs/AboutUs';
import TrackOrder from './screen/TrackOrder/TrackOrder';
import Profile from './components/screens/Profile';
import ResetPassword from './screen/ResetPassword/ResetPassword';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator();

const isLoggedIn = async () => {
  try {
    const usr = await AsyncStorage.getItem('user');
    if (!usr) return false;
    const user = JSON.parse(usr);
    return user && user.success;
  } catch (e) {
    return false;
  }
}

const App = () => {
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const usr = await AsyncStorage.getItem('user');
        if (usr) {
          try {
            setUser(JSON.parse(usr));
          } catch (parseError) {
            console.error('Invalid user data in storage', parseError);
            await AsyncStorage.removeItem('user');
          }
        }
      } catch (e) {
        console.error('Failed to load user', e);
      } finally {
        setLoading(false);
      }
    };
    checkLoginStatus();
  }, []);

  const options = {
    headerShown: false,
  };

  if (loading) {
    return null; // Or a splash screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={options}
        initialRouteName={user?.success ? "Home" : "Login"}
      >
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="Welcome" component={Welcome} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="AllProducts" component={AllProducts} />
        <Stack.Screen name="MyCart" component={MyCart} />
        <Stack.Screen name="CheckoutScreen" component={CheckoutScreen} />
        <Stack.Screen name="ProductInfo" component={ProductInfo} />
        <Stack.Screen name="ARScreen" component={ARScreen} />
        <Stack.Screen name="ThreeDView" component={ThreeDView} />
        <Stack.Screen name="AboutUs" component={AboutUs} />
        <Stack.Screen name="TrackOrder" component={TrackOrder} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="ResetPassword" component={ResetPassword} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};


export default App;
