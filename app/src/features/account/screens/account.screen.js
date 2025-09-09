import React, { useContext, useState, useEffect } from 'react';
import {
  Image,
  Linking,
  Platform,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { Spacer } from '../../../components/spacer/spacer.component';
import { AuthenticationContext } from '../../../services/authentication/authentication.context';
import {
  AccountContainer,
  AuthButton,
  AuthButtonImageWrapper,
  AuthButtonText,
  Hyperlink,
  LoginInput,
  OtherLoginButtonsContainer,
} from '../components/account.styles';
import * as Animatable from 'react-native-animatable';
import remoteConfig from '@react-native-firebase/remote-config';
import { Text } from '../../../components/typography/text.component';
import { Button } from 'react-native-paper';
import { SafeArea } from '../../../components/utility/safe-area.component';
import { ErrorMessage, SuccessMessage } from '../../../components/styles';
import { useTheme } from 'styled-components/native';
import { AppleButton } from '@invertase/react-native-apple-authentication';
import { useSelector } from 'react-redux';

export const AccountScreen = ({ navigation }) => {
  const PRIVACY_POLICY_URL = remoteConfig()
    .getValue('PRIVACY_POLICY_URL')
    .asString();
  const ALLOW_GUEST_LOGIN = remoteConfig()
    .getValue('ALLOW_GUEST_LOGIN')
    .asBoolean();
  console.log(ALLOW_GUEST_LOGIN, typeof ALLOW_GUEST_LOGIN);

  const [email, setEmail] = useState({ value: null, error: false });
  const [password, setPassword] = useState({ value: null, error: false });
  const [confirmPassword, setConfirmPassword] = useState({
    value: null,
    error: false,
  });
  const appTheme = useSelector(state => state.service.theme);
  const themeType = useColorScheme();

  const [showPassword, setShowPassword] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [showLoader, setShowLoader] = useState(false);
  const [mode, setMode] = useState('signin');
  const theme = useTheme();
  const {
    onGoogleAuthentication,
    onAnonymousAuthentication,
    onSignInWithEmail,
    onResetPassword,
    onSignUpWithEmail,
    onAppleAuthentication,
  } = useContext(AuthenticationContext);

  const onClickSubmit = async () => {
    setError(null);
    setSuccess(null);
    if (mode === 'signin')
      if (
        !email.value ||
        email.value === '' ||
        !password.value ||
        password.value === ''
      ) {
        return;
      }
    if (mode === 'signup') {
      if (
        !email.value ||
        email.value === '' ||
        !password.value ||
        password.value === '' ||
        !confirmPassword.value ||
        confirmPassword.value === ''
      ) {
        return;
      } else {
        if (password.value.length < 6) {
          setError({ message: 'Password must be minimum 6 characters long' });
          return;
        }

        if (password.value !== confirmPassword.value) {
          setError({ message: 'Passwords do not match' });
          return;
        }
      }
    }
    if (mode === 'passwordreset') {
      if (!email.value || email.value === '') {
        return;
      }
    }

    setShowLoader(true);
    let result;
    if (mode === 'signin') {
      result = await onSignInWithEmail(
        email.value.toLowerCase(),
        password.value,
      );
    }
    if (mode === 'signup') {
      result = await onSignUpWithEmail(
        email.value.toLowerCase(),
        password.value,
      );
    }
    if (mode === 'passwordreset') {
      result = await onResetPassword(email.value.toLowerCase());
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

  const onResetAllValues = () => {
    setEmail({ value: null, error: false });
    setPassword({ value: null, error: false });
    setShowPassword(true);
    setError(null);
    setShowLoader(false);
  };

  const onChangeMode = mode => {
    onResetAllValues();
    setMode(mode);
  };

  const openPrivacyPolicy = () => {
    Linking.openURL(PRIVACY_POLICY_URL);
  };

  useEffect(() => {
    let showEmailError = false;
    let showPasswordError = false;
    let showConfirmPasswordError = false;
    if (email.value === '') showEmailError = true;
    if (password.value === '') showPasswordError = true;
    if (confirmPassword.value === '') showConfirmPasswordError = true;
    setEmail(p => ({ ...p, error: showEmailError }));
    setPassword(p => ({ ...p, error: showPasswordError }));
    setConfirmPassword(p => ({ ...p, error: showConfirmPasswordError }));
  }, [email.value, password.value, confirmPassword.value]);

  return (
    <SafeArea>
      <Animatable.View
        animation={'pulse'}
        iterationCount={4}
        duration={2000}
        style={{
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
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
          fontsize="25px"
        >
          Expenses Aura
        </Text>
      </Animatable.View>

      <AccountContainer showsVerticalScrollIndicator={false}>
        <Animatable.View animation="fadeIn" duration={3000}>
          {error && (
            <ErrorMessage fontsize="13px">{error.message}</ErrorMessage>
          )}
          {success && success.message && (
            <SuccessMessage fontsize="15px">{success.message}</SuccessMessage>
          )}

          <LoginInput
            theme={{ roundness: 10 }}
            mode="outlined"
            returnKeyType="done"
            onChangeText={n => setEmail(p => ({ ...p, value: n.trim() }))}
            value={email.value}
            placeholder="Email"
            keyboardType="email-address"
            right={
              email.value && (
                <LoginInput.Icon
                  icon="close-circle"
                  iconColor="#bbb"
                  onPress={() => setEmail(p => ({ ...p, value: '' }))}
                />
              )
            }
            left={<LoginInput.Icon icon="account-circle" iconColor="#bbb" />}
          />
          {email.error && (
            <ErrorMessage fontsize="13px">Email-address required</ErrorMessage>
          )}
          {/* show password and confirm passowrd if only sign in and sign up */}
          {(mode === 'signin' || mode === 'signup') && (
            <>
              {/* for password */}
              <Spacer size={'medium'} />
              <LoginInput
                secureTextEntry={showPassword}
                theme={{ roundness: 10 }}
                mode="outlined"
                returnKeyType="done"
                onChangeText={n =>
                  setPassword(p => ({ ...p, value: n.trim() }))
                }
                value={password.value}
                placeholder="Password"
                keyboardType="default"
                right={
                  password.value && (
                    <LoginInput.Icon
                      icon={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      iconColor="#bbb"
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  )
                }
                left={<LoginInput.Icon icon="lock" iconColor="#bbb" />}
              />

              {password.error && (
                <ErrorMessage fontsize="13px">Password required</ErrorMessage>
              )}

              {/* for confirm password */}

              {mode === 'signup' && (
                <Spacer size={'medium'}>
                  <LoginInput
                    secureTextEntry={true}
                    theme={{ roundness: 10 }}
                    mode="outlined"
                    returnKeyType="done"
                    onChangeText={n =>
                      setConfirmPassword(p => ({ ...p, value: n.trim() }))
                    }
                    value={confirmPassword.value}
                    placeholder="Confirm Password"
                    keyboardType="default"
                    right={
                      confirmPassword.value && (
                        <LoginInput.Icon
                          icon="close-circle"
                          iconColor="#bbb"
                          onPress={() =>
                            setConfirmPassword(p => ({ ...p, value: '' }))
                          }
                        />
                      )
                    }
                    left={
                      <LoginInput.Icon icon="check-circle" iconColor="#bbb" />
                    }
                  />

                  {confirmPassword.error && (
                    <ErrorMessage fontsize="13px">
                      Confirm Password required
                    </ErrorMessage>
                  )}
                </Spacer>
              )}
            </>
          )}
          <Spacer size={'large'} />
          <TouchableOpacity onPress={openPrivacyPolicy}>
            <Hyperlink fontsize="12px">
              By continuing, you agree to our Privacy Policy
            </Hyperlink>
          </TouchableOpacity>
          <Spacer size={'large'} />

          <Button
            theme={{ roundness: 10 }}
            mode="contained"
            style={{ height: 40 }}
            textColor="#fff"
            onPress={onClickSubmit}
            loading={showLoader}
            icon="location-exit"
            disabled={showLoader}
          >
            {mode === 'signin'
              ? 'SIGN IN'
              : mode === 'signup'
              ? 'SIGN UP'
              : 'SEND PASSWORD RESET LINK'}
          </Button>
          {mode === 'signin' && (
            <>
              <Spacer size={'large'}>
                <TouchableOpacity onPress={() => onChangeMode('passwordreset')}>
                  <Hyperlink>Forgot Password?</Hyperlink>
                </TouchableOpacity>
              </Spacer>

              {ALLOW_GUEST_LOGIN && (
                <Spacer size={'medium'}>
                  <TouchableOpacity onPress={onAnonymousAuthentication}>
                    <Hyperlink underline={true}>
                      Continue as a Guest Without Account
                    </Hyperlink>
                  </TouchableOpacity>
                </Spacer>
              )}
            </>
          )}

          {mode === 'passwordreset' && (
            <Spacer size={'xlarge'}>
              <TouchableOpacity
                onPress={() => {
                  onChangeMode('signin');
                  setSuccess(null);
                }}
              >
                <Hyperlink>Go back to Login Screen.</Hyperlink>
              </TouchableOpacity>
            </Spacer>
          )}

          {mode !== 'passwordreset' && (
            <OtherLoginButtonsContainer>
              {Platform.OS === 'ios' && (
                <>
                  <AppleButton
                    buttonStyle={
                      appTheme === 'automatic'
                        ? themeType === 'light'
                          ? AppleButton.Style.BLACK
                          : AppleButton.Style.WHITE
                        : appTheme === 'light'
                        ? AppleButton.Style.BLACK
                        : AppleButton.Style.WHITE
                    }
                    buttonType={AppleButton.Type.SIGN_IN}
                    cornerRadius={20}
                    onPress={onAppleAuthentication}
                    style={{
                      height: 45,
                    }}
                  />
                  <Spacer size={'large'} />
                </>
              )}
              <AuthButton color="#4185f4" onPress={onGoogleAuthentication}>
                <AuthButtonImageWrapper>
                  <Image
                    source={require('../../../../assets/google.png')}
                    style={{
                      height: 25,
                      width: 30,
                    }}
                  />
                </AuthButtonImageWrapper>

                <AuthButtonText>Sign In With Google</AuthButtonText>
              </AuthButton>
              <Spacer size={'large'} />

              <AuthButton onPress={() => navigation.navigate('PhoneLogin')}>
                <AuthButtonImageWrapper>
                  <Image
                    source={require('../../../../assets/phone.png')}
                    style={{
                      height: 25,
                      width: 30,
                    }}
                  />
                </AuthButtonImageWrapper>

                <AuthButtonText>Sign In With Phone</AuthButtonText>
              </AuthButton>

              <Spacer size={'xlarge'} />
              {mode === 'signin' && (
                <TouchableOpacity onPress={() => onChangeMode('signup')}>
                  <Hyperlink>Don't have an account? Create here</Hyperlink>
                </TouchableOpacity>
              )}

              {mode === 'signup' && (
                <TouchableOpacity onPress={() => onChangeMode('signin')}>
                  <Hyperlink>
                    Already have an account? Click here to login
                  </Hyperlink>
                </TouchableOpacity>
              )}
            </OtherLoginButtonsContainer>
          )}
        </Animatable.View>
      </AccountContainer>
    </SafeArea>
  );
};
