import React, {useContext, useEffect, useRef, useState} from 'react';
import {Image, View} from 'react-native';
import {Button} from 'react-native-paper';
import {useTheme} from 'styled-components/native';
import {Spacer} from '../../../components/spacer/spacer.component';
import {ErrorMessage, SuccessMessage} from '../../../components/styles';
import {Text} from '../../../components/typography/text.component';
import {SafeArea} from '../../../components/utility/safe-area.component';
import {AuthenticationContext} from '../../../services/authentication/authentication.context';
import {
  AccountContainer,
  Hyperlink,
  LoginInput,
  OtpStripInput,
  OtpStrips,
} from '../components/account.styles';
export const PhoneLoginScreen = ({navigation, route}) => {
  const [phone, setPhone] = useState({value: '91', error: false});
  const [otp, setOtp] = useState({value: '------', error: false});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showLoader, setShowLoader] = useState(false);
  const [mode, setMode] = useState('phone');

  const [confirmCode, setConfirmCode] = useState(null);

  const otpInputsRef = useRef([]);

  const theme = useTheme();

  const {onSignInWithMobile, onSetUserData} = useContext(AuthenticationContext);

  const onResetAllValues = () => {
    setPhone({value: '91', error: false});
    setOtp({value: '------', error: false});
    setError(null);
    setShowLoader(false);
  };

  const onChangeMode = mode => {
    onResetAllValues();
    setMode(mode);
  };

  useEffect(() => {
    if (otp.value) {
      setError(null);
    }
  }, [otp.value]);

  useEffect(() => {
    let showPhoneError = false;
    if (phone.value === '') {
      showPhoneError = true;
    }
    setPhone(p => ({...p, error: showPhoneError}));
  }, [phone.value]);

  const onVerifyOtp = async () => {
    setError(null);
    setSuccess(null);
    if (!otp.value || otp.value.length < 6 || otp.value.includes('-')) {
      return;
    }
    setShowLoader(true);
    confirmCode
      .confirm(otp.value)
      .then(res => {
        console.log(res);
        setShowLoader(false);
        onSetUserData(res);
      })
      .catch(e => {
        setShowLoader(false);
        let error = '';
        switch (e.code) {
          case 'auth/invalid-verification-code':
            error = 'Otp is incorrect!';
            break;
        }
        setError({message: error});
        console.log(e, 'error in verifying otp ');
      });
  };

  function replaceAt(value, index, replacement) {
    return (
      value.substring(0, index) +
      replacement +
      value.substring(index + replacement.length)
    );
  }

  const onChangeOtpValue = (v, i) => {
    let replaceValue = v;
    if (replaceValue) {
      if (otpInputsRef.current[i + 1]) otpInputsRef.current[i + 1].focus();
    }
    if (!replaceValue) {
      if (otpInputsRef.current[i - 1]) otpInputsRef.current[i - 1].focus();
      replaceValue = '-';
    }
    let otpValue = otp.value;
    let value = replaceAt(otpValue, i, replaceValue);

    setOtp(p => ({...p, value: value}));
  };

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
      if (result.status) {
        onChangeMode('otp');
        setSuccess(result);
        setConfirmCode(result.result);
      }
    }
    setShowLoader(false);
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
      {mode === 'phone' && (
        <AccountContainer>
          {error && (
            <ErrorMessage fontsize="13px">{error.message}</ErrorMessage>
          )}
          {success && success.message && (
            <SuccessMessage fontsize="15px">{success.message}</SuccessMessage>
          )}

          <LoginInput
            theme={{roundness: 10}}
            autoFocus
            selectionColor={theme.colors.brand.primary}
            mode="outlined"
            returnKeyType="done"
            onChangeText={n => setPhone(p => ({...p, value: n.trim()}))}
            value={phone.value}
            placeholder="Ex: 91 XXXXXXXXXX"
            keyboardType="phone-pad"
            right={
              phone.value && (
                <LoginInput.Icon
                  icon="close-circle"
                  iconColor="#bbb"
                  onPress={() => setPhone(p => ({...p, value: ''}))}
                />
              )
            }
            left={<LoginInput.Icon icon="phone" iconColor="#bbb" />}
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
            buttonColor={theme.colors.brand.primary}
            onPress={onClickSubmit}
            loading={showLoader}
            disabled={showLoader}>
            {showLoader ? 'SENDING OTP' : ' SEND OTP'}
          </Button>
          <Spacer size={'large'} />
          <Hyperlink onPress={() => navigation.goBack()}>
            Go back to login screen ?
          </Hyperlink>
        </AccountContainer>
      )}

      {mode === 'otp' && (
        <>
          <Spacer size={'xlarge'} />

          {error && (
            <ErrorMessage fontsize="13px">{error.message}</ErrorMessage>
          )}
          {success && success.message && (
            <SuccessMessage fontsize="15px">{success.message}</SuccessMessage>
          )}

          <OtpStrips>
            {[...Array(6)].map((x, i) => {
              return (
                <OtpStripInput
                  key={i}
                  selectionColor={theme.colors.brand.primary}
                  theme={{roundness: 10}}
                  value={
                    otp.value?.charAt(i) === '-' ? '' : otp.value.charAt(i)
                  }
                  onChangeText={n => onChangeOtpValue(n.trim(), i)}
                  ref={el => (otpInputsRef.current[i] = el)}
                />
              );
            })}
          </OtpStrips>

          <Spacer size={'xlarge'} />

          <AccountContainer>
            <Button
              mode="contained"
              style={{height: 40}}
              buttonColor={theme.colors.brand.primary}
              onPress={onVerifyOtp}
              loading={showLoader}
              disabled={showLoader}>
              {showLoader ? 'VERIFYING OTP' : ' VERIFY OTP'}
            </Button>
            <Spacer size={'large'} />
            <Hyperlink onPress={() => onChangeMode('phone')}>
              Change number ?
            </Hyperlink>
          </AccountContainer>
        </>
      )}
    </SafeArea>
  );
};
