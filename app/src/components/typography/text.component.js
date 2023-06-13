import React from 'react';
import styled from 'styled-components/native';

const defaultTextStyles = (theme, color, fontsize, fontfamily) => `
    color : ${!color ? theme.colors.text.primary : color};
    font-family : ${
      fontfamily ? theme.fonts[fontfamily] : theme.fonts.bodyMedium
    };
    font-weight : ${
      fontfamily ? theme.fontWeights[fontfamily] : theme.fontWeights.bodyMedium
    };
    font-size : ${fontsize ? fontsize : theme.fontSizes.bodyMedium};
    flex-wrap : wrap;
    margin-top : 0px;
    margin-bottom : 0px;
`;

const body = (theme, fontsize) => ` 
  font-size : ${fontsize ? fontsize : theme.fontSizes.body};
`;

const hint = (theme, fontsize) => `
    font-size : ${fontsize ? fontsize : theme.fontSizes.body};
`;

const error = (theme, fontsize) => `
    color : ${theme.colors.text.error};
    font-size : ${fontsize ? fontsize : theme.fontSizes.body};
`;

const caption = (theme, fontsize) => `
    font-size : ${fontsize ? fontsize : theme.fontSizes.caption};
    font-weight : ${theme.fontWeights.bodyMedium};
`;

const label = (theme, fontsize) => `
    font-family : ${theme.fonts.heading};
    font-size : ${fontsize ? fontsize : theme.fontSizes.caption};
`;

const variants = {
  body,
  label,
  caption,
  error,
  hint,
};

export const Text = styled.Text`
  ${({theme, color, fontsize, fontfamily}) =>
    defaultTextStyles(theme, color, fontsize, fontfamily)}
  ${({variant, theme, fontsize}) => variants[variant](theme, fontsize)}
`;

Text.defaultProps = {
  variant: 'body',
};
