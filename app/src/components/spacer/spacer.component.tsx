import React from 'react';
import {useTheme} from 'styled-components/native';
import styled from 'styled-components/native';
const sizeVariant = {
  small: 1,
  medium: 2,
  large: 3,
  xlarge: 4,
};

const marginVariant = {
  top: 'margin-top',
  left: 'margin-left',
  bottom: 'margin-bottom',
  right: 'margin-right',
};

const paddingVariant = {
  top: 'padding-top',
  left: 'padding-left',
  bottom: 'padding-bottom',
  right: 'padding-right',
};

const getVariant = (
  type: Props['type'],
  position: Props['position'],
  size: Props['size'],
  theme: any,
) => {
  let property;
  const sizeIndex = sizeVariant[size];
  if (type === 'padding') {
    property = paddingVariant[position];
  } else {
    property = marginVariant[position];
  }

  const value = theme.space[sizeIndex];
  return `${property} : ${value}`;
};

const SpacerView = styled.View<{variant: any}>`
  ${({variant}) => variant}
`;

interface Props {
  children: React.ReactNode;
  position: 'top' | 'bottom' | 'left' | 'right';
  type: 'padding' | 'margin';
  size: 'small' | 'medium' | 'large' | 'xlarge';
  theme: any;
}

export const Spacer = (props: Props) => {
  const theme = useTheme();
  let {position = 'top', size = 'small', children, type} = props;
  const variant = getVariant(type, position, size, theme);
  return (
    <SpacerView variant={variant} {...props}>
      {children}
    </SpacerView>
  );
};
