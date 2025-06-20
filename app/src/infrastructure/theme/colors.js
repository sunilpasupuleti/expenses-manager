export const colors = {
  darkMode: false,
  brand: {
    primary: '#5756d5',
    primaryHex: 'rgb(87,86,213)',
    secondary: '#CCCCEE',
    secondaryHex: 'rgb(204, 204, 238)',
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
    card: '#f7f7f7',
    listSubCard: '#f6f6f7',
    sectionListCard: '#f7f7f7',
    sectionListCardLabel: '#444',
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
  switchBg: '#ddd',
};

export const darkModeColors = {
  ...colors,
  darkMode: true,
  brand: {
    ...colors.brand,
    secondary: 'rgba(28, 28, 68, 3)',
  },
  bg: {
    ...colors.bg,
    primary: '#000',
    secondary: '#222',
    card: '#2a2730',
    sectionListCard: '#2a2730',
    sectionListCardLabel: '#ccc',
    listSubCard: '#333438',
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
  switchBg: 'transparent',
};
