module.exports = {
  // project: {
  //   ios: {},
  //   android: {}, // grouped into "project"
  // },
  dependencies: {
    'react-native-vector-icons': {
      platforms: {
        ios: null,
      },
    },
  },
  assets: [
    './assets/fonts/',
    './assets/notification_primary.wav',
    './assets/notification_secondary.wav',
  ], // stays the same
};
