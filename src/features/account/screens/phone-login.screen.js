import React, {useContext, useEffect, useState} from 'react';
import {Image, View} from 'react-native';
import {Button} from 'react-native-paper';
import {useTheme} from 'styled-components/native';
import {Spacer} from '../../../components/spacer/spacer.component';
import {
  ErrorMessage,
  MainWrapper,
  SuccessMessage,
} from '../../../components/styles';
import {Text} from '../../../components/typography/text.component';
import {SafeArea} from '../../../components/utility/safe-area.component';
import {AuthenticationContext} from '../../../services/authentication/authentication.context';
import {AccountContainer, LoginInput} from '../components/account.styles';
export const PhoneLoginScreen = ({navigation, route}) => {
  const [phone, setPhone] = useState({value: null, error: false});
  const [otp, setOtp] = useState({value: null, error: false});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showLoader, setShowLoader] = useState(false);
  const [mode, setMode] = useState('phone');
  const theme = useTheme();

  const {onSignInWithMobile} = useContext(AuthenticationContext);

  const onResetAllValues = () => {
    setPhone({value: null, error: false});
    setOtp({value: null, error: false});
    setError(null);
    setShowLoader(false);
  };

  const onChangeMode = mode => {
    onResetAllValues();
    setMode(mode);
  };

  useEffect(() => {
    let showPhoneError = false;
    let showOtpError = false;
    if (phone.value === '') showPhoneError = true;
    if (otp.value === '') showOtpError = true;
    setPhone(p => ({...p, error: showPhoneError}));
    setOtp(p => ({...p, error: showOtpError}));
  }, [phone.value, otp.value]);

  const onClickSubmit = async () => {
    setError(null);
    setSuccess(null);
    if (mode === 'phone') {
      if (phone.value === '' || !phone.value) {
        return;
      }
      let isnum = /^\d+$/.test(phone.value);
      if (!isnum) {
        // val is a number
        setError({message: 'Mobile number bad format!'});
        return;
      }
    }

    setShowLoader(true);
    let result;
    let number = '+' + phone.value;
    if (mode === 'phone') {
      result = await onSignInWithMobile(number);
    }
    setShowLoader(false);
    if (result.status) {
      onResetAllValues();
      setSuccess(result);
    }
    if (!result.status) {
      setError(result);
    }
  };
  return (
    <SafeArea>
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Image
          style={{
            width: 160,
            height: 160,
            borderRadius: 100,
            borderColor: '#ddd',
            borderWidth: 1,
          }}
          source={require('../../../../assets/login-screen.png')}
        />
      </View>

      <Text
        fontfamily="bodyBold"
        style={{textAlign: 'center'}}
        color="#000"
        fontsize="25px">
        Expenses manager
      </Text>
      <AccountContainer>
        {error && <ErrorMessage fontsize="13px">{error.message}</ErrorMessage>}
        {success && success.message && (
          <SuccessMessage fontsize="15px">{success.message}</SuccessMessage>
        )}

        <LoginInput
          theme={{roundness: 10}}
          mode="outlined"
          returnKeyType="done"
          onChangeText={n => setPhone(p => ({...p, value: n.trim()}))}
          value={phone.value}
          placeholder="Ex: 91 XXXXXXXXXX"
          keyboardType="phone-pad"
          right={
            phone.value && (
              <LoginInput.Icon
                name="close-circle"
                color="#bbb"
                onPress={() => setPhone(p => ({...p, value: ''}))}
              />
            )
          }
          left={<LoginInput.Icon name="phone" color="#bbb" />}
        />
        <Spacer size={'large'} />
        <Text fontsize="14px" color="#aaa">
          Note : Enter mobile number with country code
        </Text>

        {phone.error && (
          <ErrorMessage fontsize="13px">Mobile number required</ErrorMessage>
        )}

        <Spacer size={'xlarge'} />

        <Button
          theme={{roundness: 10}}
          mode="contained"
          style={{height: 40}}
          color={theme.colors.brand.primary}
          onPress={onClickSubmit}
          loading={showLoader}
          disabled={showLoader}>
          {mode === 'phone' ? 'SEND OTP' : mode === 'otp' ? 'VERIFY OTP' : ''}
        </Button>
      </AccountContainer>
    </SafeArea>
  );
};
