import {useEffect} from 'react';
import SplashScreen from 'react-native-splash-screen';

const AppFake = () => {
  useEffect(() => {
    SplashScreen.hide();
  }, []);

  return null;
};

export default AppFake;
