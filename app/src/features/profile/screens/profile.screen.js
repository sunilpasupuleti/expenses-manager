import Ionicons from 'react-native-vector-icons/Ionicons';
import React, {useContext, useEffect, useState} from 'react';
import {Button, Card, TextInput} from 'react-native-paper';
import {useDispatch} from 'react-redux';
import {useTheme} from 'styled-components/native';
import {ErrorMessage, MainWrapper} from '../../../components/styles';
import {SafeArea} from '../../../components/utility/safe-area.component';
import {AuthenticationContext} from '../../../services/authentication/authentication.context';
import {
  ProfileInput,
  ProfileInputErrorMessage,
  ProfilePicture,
  ProfileWrapper,
} from '../components/profile.styles';
import {Spacer} from '../../../components/spacer/spacer.component';
import {ScrollView} from 'react-native';
import {
  ProfileContext,
  ProfileContextProvider,
} from '../../../services/profile/profile.context';

const defaultInputState = {
  displayName: {
    error: false,
    errorMessage: '',
    value: '',
  },
  phoneNumber: {
    error: false,
    errorMessage: '',
    value: '',
  },
  email: {
    error: false,
    errorMessage: '',
    value: '',
  },
};

const errors = {
  nameRequired: 'Name required',
  invalidEmail: 'Invalid Email Address',
  invalidPhone: 'Invalid Phone Number',
};

export const ProfileScreen = ({navigation, route}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const {userData} = useContext(AuthenticationContext);
  const {onUpdateProfile} = useContext(ProfileContext);

  const [inputs, setInputs] = useState(defaultInputState);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Manage Profile',
      headerRight: () => (
        <Ionicons
          onPress={() => navigation.goBack()}
          style={{marginRight: 20}}
          name="close-circle-outline"
          size={30}
          color={theme.colors.brand.primary}
        />
      ),
      headerLeft: () => null,
    });
  }, []);

  useEffect(() => {
    if (userData) {
      let values = {};
      let {displayName, phoneNumber, email} = userData;
      if (displayName) {
        values.displayName = displayName;
      }
      if (phoneNumber) {
        values.phoneNumber = phoneNumber;
      }
      if (email) {
        values.email = email;
      }

      Object.keys(values).map(key => {
        setInputs(prevState => ({
          ...prevState,
          [key]: {
            error: false,
            errorMessage: '',
            value: values[key],
          },
        }));
      });
    }
  }, [userData]);

  const onValueChangeHandler = (name, value) => {
    setInputs(p => ({
      ...p,
      [name]: {
        value: value,
        error: false,
        errorMessage: '',
      },
    }));
  };

  const onClickUpdateProfile = () => {
    let {displayName, email, phoneNumber} = inputs;
    var hadErrors = false;
    const onSetErrorMessage = (name, message) => {
      setInputs(p => ({
        ...p,
        [name]: {
          ...p[name],
          error: true,
          errorMessage: message,
        },
      }));
      hadErrors = true;
    };
    if (!displayName.value) {
      onSetErrorMessage('displayName', errors.nameRequired);
    }

    let data = {
      displayName: displayName.value.trim(),
    };

    console.log(userData);

    if (
      email.value &&
      userData.providerId &&
      userData.providerId !== 'google.com'
    ) {
      let emailRegex = /^\S+@\S+\.\S+$/;
      let validEmail = emailRegex.test(email.value);
      if (!validEmail) {
        onSetErrorMessage('email', errors.invalidEmail);
      } else {
        data.email = email.value;
      }
    }

    if (phoneNumber.value) {
      let phoneRegex = /^\d+$/;
      let validPhone = phoneRegex.test(phoneNumber.value);
      if (!validPhone) {
        onSetErrorMessage('phoneNumber', errors.invalidPhone);
      } else {
        data.phoneNumber = phoneNumber.value;
      }
    }

    if (!hadErrors) {
      setLoading(true);
      onUpdateProfile(
        data,
        () => {
          setLoading(false);
        },
        () => {
          setLoading(false);
        },
      );
    }
  };

  return (
    <SafeArea>
      <MainWrapper>
        <ScrollView showsVerticalScrollIndicator={false}>
          <ProfileWrapper>
            {userData && userData.photoURL && (
              <ProfilePicture
                source={{
                  uri: userData?.photoURL,
                }}
              />
            )}

            {userData && !userData.photoURL && (
              <ProfilePicture source={require('../../../../assets/user.png')} />
            )}
          </ProfileWrapper>

          <Spacer size="xlarge" />
          <Card>
            <Card.Content>
              <ProfileInput
                theme={{roundness: 10}}
                mode="outlined"
                returnKeyType="done"
                onChangeText={n => onValueChangeHandler('displayName', n)}
                value={inputs.displayName.value}
                placeholder="Your Name"
                keyboardType="default"
                right={<ProfileInput.Icon icon="account" iconColor="#bbb" />}
              />

              <ProfileInputErrorMessage fontsize="13px">
                {inputs.displayName.errorMessage}
              </ProfileInputErrorMessage>

              <ProfileInput
                theme={{roundness: 10}}
                mode="outlined"
                returnKeyType="done"
                onChangeText={n => onValueChangeHandler('email', n.trim())}
                value={inputs.email.value}
                placeholder="Email Address"
                keyboardType="default"
                disabled={userData?.providerId === 'google.com'}
                right={<ProfileInput.Icon icon="email" iconColor="#bbb" />}
              />

              <ProfileInputErrorMessage fontsize="13px">
                {inputs.email.errorMessage}
              </ProfileInputErrorMessage>

              <ProfileInput
                theme={{roundness: 10}}
                mode="outlined"
                returnKeyType="done"
                onChangeText={n =>
                  onValueChangeHandler('phoneNumber', n.trim())
                }
                value={inputs.phoneNumber.value}
                placeholder="Phone Number"
                keyboardType="phone-pad"
                right={<ProfileInput.Icon icon="phone" iconColor="#bbb" />}
              />

              <ProfileInputErrorMessage fontsize="13px">
                {inputs.phoneNumber.errorMessage}
              </ProfileInputErrorMessage>
            </Card.Content>
            <Card.Actions>
              <Button
                theme={{roundness: 10}}
                mode="contained"
                style={{height: 40, width: '100%'}}
                onPress={onClickUpdateProfile}
                icon={'content-save-all-outline'}
                buttonColor={theme.colors.brand.primary}
                textColor="#fff"
                loading={loading}
                disabled={loading}>
                Update Profile
              </Button>
            </Card.Actions>
          </Card>
        </ScrollView>
      </MainWrapper>
    </SafeArea>
  );
};
