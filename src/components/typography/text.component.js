import React from "react";
import styled from "styled-components/native";

const defaultTextStyles = (theme, color, fontsize, fontfamily) => `
    font-family : ${theme.fonts.bodyMedium};
    font-weight : ${theme.fontWeights.medium};
    color : ${!color ? theme.colors.text.primary : color};
    ${fontsize && `font-size : ${fontsize}`};
    ${fontfamily && `font-family : ${theme.fonts[fontfamily]}`};
    flex-wrap : wrap;
    margin-top : 0px;
    margin-bottom : 0px;
`;

const body = (theme, fontsize) => `
    font-size : ${theme.fontSizes.body};
    ${fontsize && `font-size : ${fontsize}`};

`;

const hint = (theme, fontsize) => `
    font-size : ${theme.fontSizes.body}
    ${fontsize && `font-size : ${fontsize}`};

`;

const error = (theme, fontsize) => `
    color : ${theme.colors.text.error};
    ${fontsize && `font-size : ${fontsize}`};

`;

const caption = (theme, fontsize) => `
    font-size : ${theme.fontSizes.caption};
    font-weight : ${theme.fontWeights.bold};
    ${fontsize && `font-size : ${fontsize}`};

`;

const label = (theme, fontsize) => `
    font-family : ${theme.fonts.heading};
    font-size : ${theme.fontSizes.body};
    font-weight : ${theme.fontWeights.medium};
    ${fontsize && `font-size : ${fontsize}`};

`;

const variants = {
  body,
  label,
  caption,
  error,
  hint,
};

export const Text = styled.Text`
  ${({ theme, color, fontsize, fontfamily }) =>
    defaultTextStyles(theme, color, fontsize, fontfamily)}
  ${({ variant, theme, fontsize }) => variants[variant](theme, fontsize)}
`;

Text.defaultProps = {
  variant: "body",
};
