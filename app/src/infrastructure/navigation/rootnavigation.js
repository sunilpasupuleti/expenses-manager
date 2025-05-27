import * as React from 'react';

export const navigationRef = React.createRef();

export function navigate(name, params) {
  return new Promise((resolve, reject) => {
    navigationRef.current?.navigate(name, params);
    resolve(true);
  });
}
