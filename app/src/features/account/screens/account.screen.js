import React, {useContext, useState, useEffect} from 'react';
import {Image, TouchableOpacity, View} from 'react-native';
import {Spacer} from '../../../components/spacer/spacer.component';
import {AuthenticationContext} from '../../../services/authentication/authentication.context';
import {
  AccountContainer,
  GoogleButton,
  GoogleButtonImageWrapper,
  GoogleButtonText,
  Hyperlink,
  LoginInput,
  OtherLoginButtonsContainer,
} from '../components/account.styles';

import {Text} from '../../../components/typography/text.component';
import {Button} from 'react-native-paper';
import {SafeArea} from '../../../components/utility/safe-area.component';
import {ErrorMessage, SuccessMessage} from '../../../components/styles';
import {useTheme} from 'styled-components/native';

export const AccountScreen = ({navigation}) => {
  const [email, setEmail] = useState({value: null, error: false});
  const [password, setPassword] = useState({value: null, error: false});
  const [confirmPassword, setConfirmPassword] = useState({
    value: null,
    error: false,
  });

  const [showPassword, setShowPassword] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [showLoader, setShowLoader] = useState(false);
  const [mode, setMode] = useState('signin');
  const theme = useTheme();
  const {
    onGoogleAuthentication,
    onSignInWithEmail,
    onResetPassword,
    onSignUpWithEmail,
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
          setError({message: 'Password must be minimum 6 characters long'});
          return;
        }

        if (password.value !== confirmPassword.value) {
          setError({message: 'Passwords do not match'});
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
    setEmail({value: null, error: false});
    setPassword({value: null, error: false});
    setShowPassword(true);
    setError(null);
    setShowLoader(false);
  };

  const onChangeMode = mode => {
    onResetAllValues();
    setMode(mode);
  };

  useEffect(() => {
    let showEmailError = false;
    let showPasswordError = false;
    let showConfirmPasswordError = false;
    if (email.value === '') showEmailError = true;
    if (password.value === '') showPasswordError = true;
    if (confirmPassword.value === '') showConfirmPasswordError = true;
    setEmail(p => ({...p, error: showEmailError}));
    setPassword(p => ({...p, error: showPasswordError}));
    setConfirmPassword(p => ({...p, error: showConfirmPasswordError}));
  }, [email.value, password.value, confirmPassword.value]);

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
        color={theme.colors.text.primary}
        fontsize="25px">
        Expenses Manager
      </Text>
      <AccountContainer showsVerticalScrollIndicator={false}>
        {error && <ErrorMessage fontsize="13px">{error.message}</ErrorMessage>}
        {success && success.message && (
          <SuccessMessage fontsize="15px">{success.message}</SuccessMessage>
        )}

        <LoginInput
          theme={{roundness: 10}}
          mode="outlined"
          returnKeyType="done"
          onChangeText={n => setEmail(p => ({...p, value: n.trim()}))}
          value={email.value}
          placeholder="Email"
          keyboardType="email-address"
          right={
            email.value && (
              <LoginInput.Icon
                name="close-circle"
                color="#bbb"
                onPress={() => setEmail(p => ({...p, value: ''}))}
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
              theme={{roundness: 10}}
              mode="outlined"
              returnKeyType="done"
              onChangeText={n => setPassword(p => ({...p, value: n.trim()}))}
              value={password.value}
              placeholder="Password"
              keyboardType="default"
              right={
                password.value && (
                  <LoginInput.Icon
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    color="#bbb"
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
                  theme={{roundness: 10}}
                  mode="outlined"
                  returnKeyType="done"
                  onChangeText={n =>
                    setConfirmPassword(p => ({...p, value: n.trim()}))
                  }
                  value={confirmPassword.value}
                  placeholder="Confirm Password"
                  keyboardType="default"
                  right={
                    confirmPassword.value && (
                      <LoginInput.Icon
                        name="close-circle"
                        color="#bbb"
                        onPress={() =>
                          setConfirmPassword(p => ({...p, value: ''}))
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
        <Button
          theme={{roundness: 10}}
          mode="contained"
          style={{height: 40}}
          buttonColor={theme.colors.brand.primary}
          textColor="#fff"
          onPress={onClickSubmit}
          loading={showLoader}
          disabled={showLoader}>
          {mode === 'signin'
            ? 'SIGN IN'
            : mode === 'signup'
            ? 'SIGN UP'
            : 'SEND PASSWORD RESET LINK'}
        </Button>
        {mode === 'signin' && (
          <Spacer size={'xlarge'}>
            <TouchableOpacity onPress={() => onChangeMode('passwordreset')}>
              <Hyperlink>Forgot Password?</Hyperlink>
            </TouchableOpacity>
          </Spacer>
        )}

        {mode === 'passwordreset' && (
          <Spacer size={'xlarge'}>
            <TouchableOpacity
              onPress={() => {
                onChangeMode('signin');
                setSuccess(null);
              }}>
              <Hyperlink>Go back to Login Screen.</Hyperlink>
            </TouchableOpacity>
          </Spacer>
        )}

        {mode !== 'passwordreset' && (
          <OtherLoginButtonsContainer>
            <GoogleButton onPress={onGoogleAuthentication}>
              <GoogleButtonImageWrapper>
                <Image
                  source={require('../../../../assets/google.png')}
                  style={{
                    height: 25,
                    width: 30,
                  }}
                />
              </GoogleButtonImageWrapper>

              <GoogleButtonText>Sign In With Google</GoogleButtonText>
            </GoogleButton>
            <Spacer size={'large'} />
            <Button
              theme={{roundness: 10}}
              mode="contained"
              style={{height: 40}}
              buttonColor={theme.colors.brand.primary}
              textColor="#fff"
              icon="phone"
              onPress={() => navigation.navigate('PhoneLogin')}>
              SIGN IN USING PHONE
            </Button>

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
      </AccountContainer>
    </SafeArea>
  );
};
