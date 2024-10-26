import React from 'react';
import styled, {useTheme} from 'styled-components/native';

type FontSizes =
  | '0px'
  | '1px'
  | '2px'
  | '3px'
  | '4px'
  | '5px'
  | '6px'
  | '7px'
  | '8px'
  | '9px'
  | '10px'
  | '11px'
  | '12px'
  | '13px'
  | '14px'
  | '15px'
  | '16px'
  | '17px'
  | '18px'
  | '19px'
  | '20px'
  | '21px'
  | '22px'
  | '23px'
  | '24px'
  | '25px'
  | '26px'
  | '27px'
  | '28px'
  | '29px'
  | '30px'
  | '31px'
  | '32px'
  | '33px'
  | '34px'
  | '35px'
  | '36px'
  | '37px'
  | '38px'
  | '39px'
  | '40px'
  | '41px'
  | '42px'
  | '43px'
  | '44px'
  | '45px'
  | '46px'
  | '47px'
  | '48px'
  | '49px'
  | '50px';

interface Props {
  children: React.ReactNode;
  color: String;
  variantType: 'body' | 'error' | 'caption' | 'caption' | 'hint';
  fontsize: FontSizes;
  fontfamily:
    | 'body'
    | 'bodyMedium'
    | 'bodySemiBold'
    | 'bodyBold'
    | 'heading'
    | 'headingSemiBold'
    | 'headingBold'
    | 'monospace';
  theme: any;
}

const defaultTextStyles = (
  theme: any,
  color: any,
  fontsize: any,
  fontfamily: any,
) => `
    color : ${!color ? theme.colors.text.primary : color};
    font-family : ${
      fontfamily ? theme.fonts[fontfamily] : theme.fonts.bodyMedium
    };
    font-weight : ${
      fontfamily ? theme.fontWeights[fontfamily] : theme.fontWeights.bodyMedium
    };
    font-size : ${fontsize ? fontsize : theme.fontSizes.body};
    flex-wrap : wrap;
    margin-top : 0px;
    margin-bottom : 0px;
`;

const body = (theme: any, fontsize: any) => ` 
  font-size : ${fontsize ? fontsize : theme.fontSizes.body};
`;

const hint = (theme: any, fontsize: any) => `
    font-size : ${fontsize ? fontsize : theme.fontSizes.body};
`;

const error = (theme: any, fontsize: any) => `
    color : ${theme.colors.text.error};
    font-size : ${fontsize ? fontsize : theme.fontSizes.body};
`;

const caption = (theme: any, fontsize: any) => `
    font-size : ${fontsize ? fontsize : theme.fontSizes.caption};
    font-weight : ${theme.fontWeights.bodyMedium};
`;

const label = (theme: any, fontsize: any) => `
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

const StyledText = styled.Text<Props>`
  ${({theme, color, fontsize, fontfamily}) =>
    defaultTextStyles(theme, color, fontsize, fontfamily)}
  ${({variantType, theme, fontsize}) => variants[variantType](theme, fontsize)}
`;

export const Text = (props: Props) => {
  let {children, variantType = 'body'} = props;
  let th = useTheme();

  props.theme = th;

  return (
    <StyledText {...props} theme={th} variantType={variantType}>
      {children}
    </StyledText>
  );
};
