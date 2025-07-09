import {createNavigationContainerRef} from '@react-navigation/native';
import * as React from 'react';

export const navigationRef = createNavigationContainerRef();
export function navigate(name, params) {
  return new Promise((resolve, reject) => {
    navigationRef?.navigate(name, params);
    resolve(true);
  });
}

export function getCurrentRouteName() {
  return navigationRef.getCurrentRoute()?.name;
}
