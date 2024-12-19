import React, {useContext, useEffect, useRef, useState} from 'react';
import {
  Image,
  Keyboard,
  NativeEventEmitter,
  NativeModules,
  Platform,
  Pressable,
  View,
  useColorScheme,
} from 'react-native';
import {Button} from 'react-native-paper';
import {useTheme} from 'styled-components/native';
import {Spacer} from '../../../components/spacer/spacer.component';
import {
  ErrorMessage,
  FlexRow,
  Input,
  SuccessMessage,
} from '../../../components/styles';
import {Text} from '../../../components/typography/text.component';
import {SafeArea} from '../../../components/utility/safe-area.component';
import {AuthenticationContext} from '../../../services/authentication/authentication.context';
import {
  AccountContainer,
  Hyperlink,
  LoginInput,
} from '../components/account.styles';
import * as Animatable from 'react-native-animatable';
import CountryPicker, {
  DARK_THEME,
  getCallingCode,
} from 'react-native-country-picker-modal';
import {
  OTPContainer,
  OTPinputContainer,
  SplitBoxText,
  SplitBoxes,
  SplitBoxesFocused,
  SplitOTPBoxesContainer,
  TextInputHidden,
} from '../components/phone-login.styles';
import {getCountry} from 'react-native-localize';
import {useSelector} from 'react-redux';
import {ScrollView} from 'react-native-gesture-handler';

const SmsListener =
  Platform.OS === 'android' ? NativeModules.SmsListener : null;
const smsListenerEmitter =
  Platform.OS === 'android' ? new NativeEventEmitter(SmsListener) : null;

export const PhoneLoginScreen = ({navigation, route}) => {
  const [phone, setPhone] = useState({valreacue: '', error: false});
  const [otp, setOtp] = useState({value: '', error: false, focused: false});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showLoader, setShowLoader] = useState({
    status: false,
    type: null,
  });
  const [mode, setMode] = useState('phone');
  const maximumOtpLength = 6;
  const [confirmCode, setConfirmCode] = useState(null);
  const [isPinReady, setIsPinReady] = useState(false);
  const boxArray = new Array(maximumOtpLength).fill(0);
  const themeType = useColorScheme();
  const appTheme = useSelector(state => state.service.theme);
  const [countryCode, setCountryCode] = useState(getCountry());
  const [country, setCountry] = useState(null);

  let darkMode =
    appTheme === 'automatic'
      ? themeType === 'light'
        ? false
        : true
      : appTheme === 'light'
      ? false
      : true;

  const otpInputRef = useRef();

  const theme = useTheme();

  const {onSignInWithMobile} = useContext(AuthenticationContext);

  const onShowLoader = type => {
    setShowLoader({
      type: type,
      status: true,
    });
  };

  const onHideLoader = () => {
    setShowLoader({
      type: null,
      status: false,
    });
  };

  const onResetAllValues = () => {
    setOtp({value: '', error: false});
    setError(null);
    onHideLoader();
  };

  const onChangeCountry = value => {
    setCountryCode(value.cca2);
    setCountry(value);
  };

  const onChangeMode = mode => {
    if (mode === 'phone') {
      setPhone({value: '', error: false});
      setSuccess('');
      setError('');
    }
    onResetAllValues();
    setMode(mode);
  };

  const onVerifyOtp = async () => {
    setError(null);
    setSuccess(null);
    if (!otp.value || otp.value.length < 6) {
      return;
    }

    onShowLoader('verifyOtp');
    confirmCode
      .confirm(otp.value)
      .then(res => {
        // console.log(res, 'Authenticated succesfully using phone');
        onHideLoader();
      })
      .catch(e => {
        onHideLoader();
        let error = '';
        switch (e.code) {
          case 'auth/invalid-verification-code':
            error = 'Otp is incorrect!';
            break;
          case 'auth/code-expired':
            error =
              'The SMS code has expired. Please re-send the verification code to try again';
            break;
          default:
            error = 'Something error occured in verifying otp';
        }
        setError({message: error});
        console.log(e, 'error in verifying otp ');
      });
  };

  const onChangeOtpValue = (v, i) => {
    setOtp(p => ({
      ...p,
      value: v.trim(),
    }));
    otpInputRef.current.focus();
  };

  const handleOnBlur = () => {
    setOtp(p => ({
      ...p,
      focused: false,
    }));
  };

  const handleOnFocus = () => {
    setOtp(p => ({
      ...p,
      focused: true,
    }));
  };

  const onClickSubmit = async (resend = false) => {
    setError(null);
    setSuccess(null);
    if (phone.value === '' || !phone.value) {
      setError({message: 'Invalid Mobile Number!'});
      return;
    }
    let isnum = /^\d+$/.test(phone.value);
    if (!isnum) {
      // val is a number
      setError({message: 'Mobile number bad format!'});
      return;
    }
    onShowLoader(resend ? 'resendOtp' : 'sendOtp');
    let callCode = await getCallingCode(countryCode);
    let number = '+' + callCode + phone.value;
    let result = await onSignInWithMobile(number, resend);
    if (result && result.status) {
      onChangeMode('otp');
      setSuccess(result);
      setConfirmCode(result.result);
    }
    if (!result.status) {
      setError(result);
    }
    onHideLoader();
  };

  const boxDigit = (_, index) => {
    const emptyInput = '';
    let otpValue = otp.value[index];
    const digit = otpValue || emptyInput;
    const isCurrentValue = index === otp.value.length;
    const isLastValue = index === maximumOtpLength - 1;
    const isOtpComplete = otp.value.length === maximumOtpLength;

    const isValueFocused = isCurrentValue || (isLastValue && isOtpComplete);
    const StyledSplitBoxes =
      (otp.focused && isValueFocused) || isPinReady
        ? SplitBoxesFocused
        : SplitBoxes;

    return (
      <StyledSplitBoxes key={index}>
        <SplitBoxText>{digit}</SplitBoxText>
      </StyledSplitBoxes>
    );
  };

  useEffect(() => {
    if (otp.value) {
      setError(null);
    }
    if (otp.value.length === maximumOtpLength) {
      setIsPinReady(true);
      Keyboard.dismiss();
      onVerifyOtp();
    }

    return () => {
      setIsPinReady(false);
    };
  }, [otp.value]);

  useEffect(() => {
    let showPhoneError = false;
    if (phone.value === '') {
      showPhoneError = true;
    }
    setPhone(p => ({...p, error: false}));
  }, [phone.value]);

  useEffect(() => {
    let smsSubscription = null;
    if (Platform.OS === 'android') {
      // auto verifying otp
      smsSubscription = smsListenerEmitter.addListener(
        'onSmsReceived',
        message => {
          if (message && message.body) {
            const otpKeywords =
              /(OTP|one[\s-]?time[\s-]?password|verification[\s-]?code)/i;
            let fetchedOtp = /\d{6}/g.exec(message.body);
            if (fetchedOtp && fetchedOtp[0] && otpKeywords.test(message.body)) {
              setOtp(p => ({
                ...p,
                value: fetchedOtp[0],
              }));
            }
          }
        },
      );
    }
    return () => {
      smsSubscription && smsSubscription.remove();
    };
  }, []);

  return (
    <SafeArea>
      <ScrollView
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flex: 1,
        }}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Animatable.Image
            animation={'slideInRight'}
            style={{
              width: 100,
              height: 100,
              borderRadius: 100,
              marginBottom: 30,
              marginTop: 30,
            }}
            source={require('../../../../assets/wallet.jpeg')}
          />
          <Text
            fontfamily="bodyBold"
            color={theme.colors.text.primary}
            fontsize="25px">
            Expenses Manager
          </Text>
        </View>

        {mode === 'phone' && (
          <AccountContainer>
            {error && (
              <ErrorMessage fontsize="13px">{error.message}</ErrorMessage>
            )}
            {success && success.message && (
              <SuccessMessage fontsize="15px">{success.message}</SuccessMessage>
            )}

            <FlexRow style={{height: 60}}>
              <CountryPicker
                countryCode={countryCode}
                withFilter
                withCallingCodeButton
                withEmoji
                withCloseButton
                withAlphaFilter
                withFlagButton
                withModal={true}
                theme={darkMode ? DARK_THEME : {}}
                containerButtonStyle={{
                  padding: 10,
                  marginTop: 5,
                }}
                onSelect={onChangeCountry}
              />

              <Input
                selectionColor={theme.colors.brand.primary}
                returnKeyType="done"
                maxLength={10}
                onChangeText={n => setPhone(p => ({...p, value: n.trim()}))}
                value={phone.value}
                placeholder="Enter your mobile number"
                style={{width: '70%'}}
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
              />
            </FlexRow>

            <Spacer size={'large'} />

            {phone.error && (
              <ErrorMessage fontsize="13px">
                Mobile number required
              </ErrorMessage>
            )}

            <Spacer size={'xlarge'} />

            <Button
              theme={{roundness: 10}}
              mode="contained"
              style={{height: 40}}
              textColor="#fff"
              onPress={() => onClickSubmit(false)}
              loading={showLoader.status}
              disabled={showLoader.status}>
              {showLoader.type === 'sendOtp' ? 'SENDING OTP' : ' SEND OTP'}
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
            <Spacer size="medium" />

            <OTPContainer onPress={Keyboard.dismiss}>
              <OTPinputContainer>
                <SplitOTPBoxesContainer>
                  {boxArray.map(boxDigit)}
                </SplitOTPBoxesContainer>
                <TextInputHidden
                  value={otp.value}
                  onChangeText={onChangeOtpValue}
                  maxLength={maximumOtpLength}
                  ref={otpInputRef}
                  keyboardType="numeric"
                  autoFocus
                  textContentType="oneTimeCode"
                  autoComplete="one-time-code"
                  onBlur={handleOnBlur}
                  onFocus={handleOnFocus}
                />
              </OTPinputContainer>
            </OTPContainer>
            <Spacer size={'xlarge'} />

            <AccountContainer>
              <Button
                mode="contained"
                style={{height: 40}}
                textColor="#fff"
                onPress={onVerifyOtp}
                loading={showLoader.status}
                disabled={showLoader.status}>
                {showLoader.type === 'verifyOtp'
                  ? 'VERIFYING OTP'
                  : showLoader.type === 'resendOtp'
                  ? 'RESENDING OTP'
                  : ' VERIFY OTP'}
              </Button>
              <Spacer size={'large'} />

              <Hyperlink onPress={() => onChangeMode('phone')}>
                Change number?
              </Hyperlink>
              <Spacer size="large" />
              <Hyperlink onPress={() => onClickSubmit(true)}>
                Otp not received? Resend Otp
              </Hyperlink>
            </AccountContainer>
          </>
        )}
      </ScrollView>
    </SafeArea>
  );
};
