import remoteConfig from '@react-native-firebase/remote-config';

export const getFirebaseAccessUrl = (path = '') => {
  const FIREBASE_STORAGE_URL = remoteConfig()
    .getValue('FIREBASE_STORAGE_URL')
    .asString();
  let URL = FIREBASE_STORAGE_URL + path.replaceAll('/', '%2f') + '?alt=media';
  return URL;
};
