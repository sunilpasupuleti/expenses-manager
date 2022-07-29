import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import React, {useContext, useRef, useState} from 'react';
import {TouchableOpacity} from 'react-native';
import {Searchbar} from 'react-native-paper';
import {useTheme} from 'styled-components/native';
import {Spacer} from '../../../components/spacer/spacer.component';
import {FlexRow, MainWrapper} from '../../../components/styles';
import {Text} from '../../../components/typography/text.component';
import {SafeArea} from '../../../components/utility/safe-area.component';
import {SheetsContext} from '../../../services/sheets/sheets.context';
import {SheetsInfo} from '../components/sheet-info.component';
import {
  AddSheetIcon,
  CameraButton,
  CameraIcon,
  IconsContainer,
  NewSheet,
  UpperIcon,
} from '../components/sheets.styles';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';

export const SheetsScreen = ({navigation}) => {
  const theme = useTheme();
  const {sheets} = useContext(SheetsContext);
  const [searchKeyword, setSearchKeyword] = useState('');
  let menuRef = useRef();
  const menuOptionStyles = {
    optionWrapper: {padding: 25, paddingTop: 10},
    OptionTouchableComponent: TouchableOpacity,
  };

  const onClickScanButton = async mode => {
    let options = {
      mediaType: 'photo',
      cameraType: 'back',
      includeBase64: true,
      saveToPhotos: true,
      presentationStyle: 'popover',
    };
    if (mode === 'camera') {
      await launchCamera(options);
    } else {
      await launchImageLibrary(options);
    }
  };
  return (
    <SafeArea main={false}>
      <MainWrapper>
        <IconsContainer>
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings', {screen: 'Sync'})}>
            <UpperIcon
              name="cloud-offline-outline"
              size={25}
              color={theme.colors.brand.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <UpperIcon
              name="md-cog-outline"
              size={30}
              color={theme.colors.brand.primary}
            />
          </TouchableOpacity>
        </IconsContainer>
        <Text fontfamily="bodyBold" fontsize="30px">
          Sheets
        </Text>

        <Spacer size={'large'} />
        {sheets && sheets.length > 0 && (
          <Searchbar
            value={searchKeyword}
            theme={{roundness: 10}}
            style={{elevation: 2}}
            placeholder="Search"
            onChangeText={k => setSearchKeyword(k)}
            clearIcon={() =>
              searchKeyword !== '' && (
                <Ionicons
                  onPress={() => setSearchKeyword('')}
                  name="close-circle-outline"
                  size={25}
                  color={theme.colors.brand.primary}
                />
              )
            }
          />
        )}

        <SheetsInfo navigation={navigation} searchKeyword={searchKeyword} />

        <NewSheet onPress={() => navigation.navigate('AddSheet')}>
          <AddSheetIcon
            name="md-add-outline"
            size={25}
            color="#fff"
            // color={theme.colors.brand.primary}
          />
          {/* <Text fontfamily="heading" color={theme.colors.brand.primary}>
            New Sheet
          </Text> */}
        </NewSheet>

        <Menu
          onBackdropPress={() => menuRef.current.close()}
          ref={element => (menuRef.current = element)}>
          <MenuTrigger
            customStyles={{
              triggerTouchable: {
                underlayColor: '#eee',
                // onPress: () => {
                //   console.log('pressed');
                //   menuRef.current.open();
                // },
              },
              TriggerTouchableComponent: TouchableOpacity,
            }}>
            <CameraButton onPress={() => menuRef.current.open()}>
              <CameraIcon
                name="camera-outline"
                size={25}
                color="#fff"
                // color={theme.colors.brand.primary}
              />
            </CameraButton>
          </MenuTrigger>

          <MenuOptions
            optionsContainerStyle={{
              marginLeft: 15,
              marginTop: -40,
              borderRadius: 10,
              minWidth: 250,
            }}>
            <MenuOption
              customStyles={menuOptionStyles}
              onSelect={() => {
                menuRef.current.close();
                onClickScanButton('camera');
              }}>
              <FlexRow justifyContent="space-between">
                <Text color="#2f2f2f" fontfamily="heading">
                  Take a Photo
                </Text>
                <Ionicons name="camera-outline" size={25} />
              </FlexRow>
            </MenuOption>
            <MenuOption
              customStyles={menuOptionStyles}
              onSelect={() => {
                menuRef.current.close();
                onClickScanButton('gallery');
              }}>
              <FlexRow justifyContent="space-between">
                <Text color="#2f2f2f" fontfamily="heading">
                  Choose a Photo
                </Text>
                <FontAwesome name="photo" size={20} />
              </FlexRow>
            </MenuOption>
          </MenuOptions>
          <Spacer size={'medium'} />
        </Menu>
      </MainWrapper>
    </SafeArea>
  );
};
