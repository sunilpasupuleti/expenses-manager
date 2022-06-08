import Ionicons from 'react-native-vector-icons/Ionicons';
import React, {useState, useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import styled, {useTheme} from 'styled-components/native';
import {notificationActions} from '../../store/notification-slice';
import {Animated, Platform, View} from 'react-native';
import {Provider, Snackbar} from 'react-native-paper';
import {Text} from '../typography/text.component';
const StyledSnackBar = styled(Snackbar).attrs({})`
  background-color: ${props => props.theme.colors.notify[props.status]};
  color: #000;
`;
const StyledSnackBarText = styled.Text`
  color: ${props => props.theme.colors.notifyText[props.status]};
  font-weight: 500;
  font-size: 15px;
`;

export const Notification = () => {
  const theme = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [snackBarVisible, setSnackBarVisible] = useState(false);

  const dispatch = useDispatch();
  const toast = useSelector(state => state.notification.toast);

  useEffect(() => {
    if (toast) {
      setSnackBarVisible(true);
    } else {
      setSnackBarVisible(false);
    }
  }, [toast]);

  const onDismissSNackBar = () => {
    dispatch(notificationActions.hideToast());
  };

  return toast ? (
    <StyledSnackBar
      visible={snackBarVisible}
      onDismiss={onDismissSNackBar}
      status={toast.status}
      action={{
        label: (
          <Text
            color={theme.colors.notifyText[toast.status]}
            style={{fontSize: 12}}>
            close
          </Text>
        ),
        onPress: () => {
          onDismissSNackBar();
        },
      }}>
      <StyledSnackBarText status={toast.status}>
        {toast.message}
      </StyledSnackBarText>
    </StyledSnackBar>
  ) : null;
};
