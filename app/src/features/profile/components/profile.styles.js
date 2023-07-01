import {ActivityIndicator, Text, TextInput} from 'react-native-paper';
import {styled} from 'styled-components/native';
import {colors} from '../../../infrastructure/theme/colors';

export const ProfileWrapper = styled.View`
  align-items: center;
  justify-content: center;
`;

export const ProfilePictureWrapper = styled.View`
  height: 150px;
  width: 150px;
  align-items: center;
  justify-content: center;
`;

export const ProfilePictureActivityIndicator = styled(ActivityIndicator)`
  position: absolute;
`;

export const ProfilePicture = styled.Image`
  height: 100%;
  width: 100%;
  border-radius: 100px;
`;

export const ProfileInput = styled(TextInput).attrs({
  outlineColor: 'transparent',
  selectionColor: colors.brand.primary,
})`
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
  border-color: #ddd;
  border-radius: 10px;
`;

export const ProfileInputErrorMessage = styled(Text)`
  color: red;
  margin-left: 5px;
  margin-bottom: 5px;
`;

export const ProfileImageButtonContainer = styled.View`
  margin-top: 50px;
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  max-width: 100%;
  gap: 10px;
`;
