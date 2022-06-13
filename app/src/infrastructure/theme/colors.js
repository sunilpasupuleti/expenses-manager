export const colors = {
  brand: {
    primary: '#5756d5',
    primaryHex: 'rgb(87,86,213)',
    secondary: 'rgb(204, 204, 238)',
    muted: '#c6daf7',
  },

  ui: {
    primary: '#262626',
    secondary: '#757575',
    teritary: '#f1f1f1',
    quaternary: '#ffffff',
    disabled: '#dedede',
    error: '#d0421b',
    success: '#138000',
    body: '#f2f2f6',
    icon: '#F36365',
  },

  bg: {
    primary: '#ffffff',
    secondary: '#f1f1f1',
  },

  text: {
    primary: '#262626',
    secondary: '#757575',
    disabled: '#9c9c9c',
    inverse: '#ffffff',
    error: '#d0421b',
    success: '#138000',
  },

  notify: {
    error: '#F8B9B9',
    success: '#2E7868',
    info: '#D9EDF7',
    warning: '#FEEFB3',
  },

  notifyText: {
    error: '#D93D25',
    success: '#fff',
    info: '#327292',
    warning: '#9F643F',
  },

  loader: {
    primary: '#6575E3',
    borderColor: '#fff',
    backdrop: 'rgba(0, 0, 0, 0.7)',
  },
  touchable: {
    highlight: '#9a99e6',
  },
  headerTintColor: '#000',
};

export const darkModeColors = {
  ...colors,
  brand: {
    ...colors.brand,
    secondary: 'rgba(28, 28, 68, 3)',
  },
  bg: {
    ...colors.bg,
    primary: '#000',
    secondary: '#222',
  },
  ui: {
    ...colors.ui,
    body: '#000',
  },
  text: {
    ...colors.text,
    primary: '#fff',
  },
  headerTintColor: '#fff',
};
