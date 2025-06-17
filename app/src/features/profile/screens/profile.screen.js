import Ionicons from 'react-native-vector-icons/Ionicons';
import React, {useContext, useEffect, useState} from 'react';
import {Button, Card, IconButton} from 'react-native-paper';
import {useDispatch} from 'react-redux';
import {useTheme} from 'styled-components/native';
import {Input, MainWrapper} from '../../../components/styles';
import {SafeArea} from '../../../components/utility/safe-area.component';
import {AuthenticationContext} from '../../../services/authentication/authentication.context';
import {
  ProfileImageButtonContainer,
  ProfileInputErrorMessage,
  ProfilePicture,
  ProfilePictureActivityIndicator,
  ProfilePictureWrapper,
  ProfileWrapper,
} from '../components/profile.styles';
import {Spacer} from '../../../components/spacer/spacer.component';
import {Alert, Pressable, ScrollView} from 'react-native';
import {ProfileContext} from '../../../services/profile/profile.context';

import {launchImageLibrary} from 'react-native-image-picker';

import _ from 'lodash';
import {getFirebaseAccessUrl} from '../../../components/utility/helper';
import {useNetInfo} from '@react-native-community/netinfo';

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
  const {userData} = useContext(AuthenticationContext);
  const {
    onUpdateProfile,
    onRemoveProfilePicture,
    onUpdateProfilePicture,
    onDownloadProfilePicture,
  } = useContext(ProfileContext);
  const {isConnected} = useNetInfo();
  const [inputs, setInputs] = useState(defaultInputState);

  const [loading, setLoading] = useState(false);

  const [buttonLoading, setButtonLoading] = useState({
    update: false,
    remove: false,
  });

  const [reloadImageKey, setReloadImageKey] = useState('rendomid');

  const [previewImage, setPreviewImage] = useState(null);

  const [profilePictureLoading, setProfilePictureLoading] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Manage Profile',
      headerRight: () => (
        <Pressable
          onPress={() => navigation.goBack()}
          style={{marginRight: 20}}>
          <Ionicons
            name="close-circle-outline"
            size={30}
            color={theme.colors.brand.primary}
          />
        </Pressable>
      ),
      headerLeft: () => null,
    });
  }, []);

  useEffect(() => {
    if (userData) {
      setReloadImageKey(Date.now());

      let values = {};
      let {displayName, phoneNumber, email} = userData;
      if (displayName) {
        values.displayName = displayName;
      }
      if (phoneNumber) {
        phoneNumber = phoneNumber.replace('+', '');
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

    if (!email.value) {
      onSetErrorMessage('email', errors.invalidEmail);
    }

    let data = {
      displayName: displayName.value.trim(),
    };

    if (email.value) {
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

  const onClickRemoveProfilePicture = () => {
    Alert.alert(
      `Remove Profile Picture?`,
      'Are you sure you want to remove your profile picture? You wont be able to revert this action back.',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: () => {
            const showRemoveButtonLoader = status => {
              setButtonLoading({
                update: false,
                remove: status,
              });
            };
            showRemoveButtonLoader(true);

            onRemoveProfilePicture(
              () => {
                showRemoveButtonLoader(false);
              },
              () => {
                showRemoveButtonLoader(false);
              },
            );
          },
          style: 'default',
        },
      ],
      {cancelable: false},
    );
  };

  const onSelectProfilePicture = async () => {
    let options = {
      mediaType: 'photo',
      cameraType: 'back',
      includeBase64: true,
      presentationStyle: 'popover',
    };
    let callback = response => {
      if (
        response &&
        response.assets &&
        response.assets[0] &&
        response.assets[0].base64
      ) {
        let onlyBase64 = response.assets[0].base64;
        let pictureType = response.assets[0].type;
        let uri = response.assets[0].uri;
        let pictureExtension = pictureType.split('/')[1];
        let base64 = 'data:' + pictureType + ';base64,' + onlyBase64;
        let data = {
          onlyBase64: onlyBase64,
          base64: base64,
          uri: uri,
          type: pictureType,
          extension: pictureExtension,
        };
        setPreviewImage(data);
      }
    };
    await launchImageLibrary(options, response => {
      callback(response);
    });
  };

  const onClickUploadProfilePicture = async () => {
    let data = {
      ...previewImage,
    };
    const showRemoveButtonLoader = status => {
      setButtonLoading({
        update: status,
        remove: false,
      });
    };
    showRemoveButtonLoader(true);

    onUpdateProfilePicture(
      data,
      () => {
        setPreviewImage(null);
        showRemoveButtonLoader(false);
      },
      () => {
        setPreviewImage(null);
        showRemoveButtonLoader(false);
      },
    );
  };

  const onCancelUploadPicture = () => {
    setPreviewImage(null);
    setButtonLoading({
      update: false,
      remove: false,
    });
  };

  const downloadProfilePicture = async () => {
    await onDownloadProfilePicture(() => {});
  };

  let signInIcon =
    userData.providerId === 'google.com'
      ? 'google'
      : userData.providerId === 'apple.com'
      ? 'apple'
      : userData.providerId === 'phone'
      ? 'cellphone'
      : 'login';

  return (
    <SafeArea child={true}>
      <MainWrapper>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="never">
          <ProfileWrapper>
            <ProfilePictureWrapper>
              {!previewImage && (
                <>
                  {userData && userData.photoURL && (
                    <ProfilePicture
                      onLoadStart={() => setProfilePictureLoading(true)}
                      onLoad={() => setProfilePictureLoading(false)}
                      source={{
                        uri: userData.photoURL.startsWith('users/')
                          ? `${getFirebaseAccessUrl(
                              userData.photoURL,
                            )}&time=${reloadImageKey}`
                          : userData.photoURL,
                      }}
                    />
                  )}

                  {userData && !userData.photoURL && (
                    <ProfilePicture
                      onLoadStart={() => setProfilePictureLoading(true)}
                      onLoad={() => setProfilePictureLoading(false)}
                      source={require('../../../../assets/user.png')}
                    />
                  )}

                  {profilePictureLoading && (
                    <ProfilePictureActivityIndicator
                      animating={true}
                      color={theme.colors.brand.primary}
                    />
                  )}
                </>
              )}

              {previewImage && (
                <ProfilePicture
                  onLoadStart={() => setProfilePictureLoading(true)}
                  onLoad={() => setProfilePictureLoading(false)}
                  source={{
                    uri: previewImage.base64,
                  }}
                />
              )}
            </ProfilePictureWrapper>

            {/* button containers */}
            {!previewImage && (
              <ProfileImageButtonContainer>
                {/* to show only one button full width */}
                {!buttonLoading.remove && (
                  <Button
                    theme={{roundness: 10}}
                    mode="contained"
                    style={{
                      height: 40,
                      width:
                        buttonLoading.update || !userData.photoURL
                          ? '100%'
                          : 'auto',
                    }}
                    icon={'camera'}
                    loading={buttonLoading.update}
                    buttonColor={theme.colors.brand.secondary}
                    onPress={
                      !buttonLoading.update ? onSelectProfilePicture : null
                    }
                    textColor="#fff">
                    {buttonLoading.update
                      ? 'Updating Picture'
                      : 'Update Picture'}
                  </Button>
                )}

                {!buttonLoading.update && userData.photoURL && (
                  <Button
                    theme={{roundness: 10}}
                    mode="contained"
                    style={{
                      height: 40,
                      width: buttonLoading.remove ? '100%' : 'auto',
                    }}
                    icon={'delete'}
                    onPress={
                      !buttonLoading.remove ? onClickRemoveProfilePicture : null
                    }
                    buttonColor={'tomato'}
                    loading={buttonLoading.remove}
                    textColor="#fff">
                    {buttonLoading.remove
                      ? 'Removing Picture'
                      : 'Remove Picture'}
                  </Button>
                )}

                {userData.photoURL &&
                  userData.photoURL.startsWith('users/') && (
                    <Button
                      theme={{roundness: 10}}
                      mode="flat"
                      style={{
                        height: 40,
                        width: buttonLoading.remove ? '100%' : 'auto',
                      }}
                      icon={'download'}
                      onPress={downloadProfilePicture}
                      buttonColor={theme.colors.brand.secondary}
                      textColor="#fff">
                      Download Picture
                    </Button>
                  )}
              </ProfileImageButtonContainer>
            )}

            {previewImage && (
              <ProfileImageButtonContainer>
                {!buttonLoading.update && (
                  <Button
                    theme={{roundness: 10}}
                    mode="contained"
                    style={{
                      height: 40,
                    }}
                    icon={'close'}
                    buttonColor={'grey'}
                    onPress={onCancelUploadPicture}
                    textColor="#fff">
                    Cancel
                  </Button>
                )}

                <Button
                  theme={{roundness: 10}}
                  mode="contained"
                  style={{
                    height: 40,
                    width: buttonLoading.update ? '100%' : 'auto',
                  }}
                  icon={'check'}
                  onPress={
                    !buttonLoading.update ? onClickUploadProfilePicture : null
                  }
                  buttonColor={'#198754'}
                  loading={buttonLoading.update}
                  textColor="#fff">
                  {buttonLoading.update
                    ? 'Uploading Picture'
                    : 'Upload Picture'}
                </Button>
              </ProfileImageButtonContainer>
            )}
          </ProfileWrapper>

          <Spacer size="xlarge" />
          <Card style={{backgroundColor: theme.colors.bg.card, margin: 1}}>
            <Card.Content>
              <Input
                mode="outlined"
                returnKeyType="done"
                onChangeText={n => onValueChangeHandler('displayName', n)}
                value={inputs.displayName.value}
                placeholder="Your Name"
                keyboardType="default"
                right={<Input.Icon icon="account" iconColor="#bbb" />}
              />

              <ProfileInputErrorMessage fontsize="13px">
                {inputs.displayName.errorMessage}
              </ProfileInputErrorMessage>

              <Input
                mode="outlined"
                returnKeyType="done"
                multiline
                onChangeText={n =>
                  onValueChangeHandler('email', n.toLowerCase().trim())
                }
                value={inputs.email.value}
                placeholder="Email Address"
                keyboardType="default"
                disabled={
                  userData?.providerId === 'google.com' ||
                  userData?.providerId === 'apple.com'
                }
                right={<Input.Icon icon="email" iconColor="#bbb" />}
              />

              <ProfileInputErrorMessage fontsize="13px">
                {inputs.email.errorMessage}
              </ProfileInputErrorMessage>

              {userData.phoneNumber && (
                <>
                  <Input
                    theme={{roundness: 10}}
                    mode="outlined"
                    returnKeyType="done"
                    disabled
                    onChangeText={n =>
                      onValueChangeHandler('phoneNumber', n.trim())
                    }
                    value={inputs.phoneNumber.value}
                    placeholder="Phone Number"
                    keyboardType="phone-pad"
                    right={<Input.Icon icon="phone" iconColor="#bbb" />}
                  />

                  <ProfileInputErrorMessage fontsize="13px">
                    {inputs.phoneNumber.errorMessage}
                  </ProfileInputErrorMessage>
                </>
              )}

              <Input
                theme={{roundness: 10}}
                mode="outlined"
                returnKeyType="done"
                disabled
                value={'Signed In Using - ' + userData.providerId.toUpperCase()}
                placeholder="Phone Number"
                keyboardType="phone-pad"
                right={<Input.Icon icon={signInIcon} iconColor="#bbb" />}
              />
            </Card.Content>
            <Card.Actions>
              <Button
                theme={{roundness: 10}}
                mode="contained"
                style={{
                  height: 40,
                  width: '100%',
                  marginTop: 20,
                  marginBottom: 20,
                }}
                onPress={onClickUpdateProfile}
                icon={'content-save-all-outline'}
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
