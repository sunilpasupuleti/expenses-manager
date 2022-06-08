import { colors, darkModeColors } from "./colors";
import { lineHeights, space } from "./spacing";
import { sizes } from "./sizes";
import { fontSizes, fontWeights, fonts } from "./fonts";
export const lightTheme = {
  colors,
  space,
  lineHeights,
  sizes,
  fonts,
  fontSizes,
  fontWeights,
};

export const darkTheme = {
  ...lightTheme,
  colors: {
    ...darkModeColors,
  },
};
