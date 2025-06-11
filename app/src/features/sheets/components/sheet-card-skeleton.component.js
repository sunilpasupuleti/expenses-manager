import React from 'react';
import {useColorScheme, View} from 'react-native';
import {Skeleton} from 'moti/skeleton';
import {MotiView} from 'moti';
import {Spacer} from '../../../components/spacer/spacer.component';
import {useTheme} from 'styled-components/native';
import {useSelector} from 'react-redux';

const SheetCardSkeleton = ({colorMode = 'dark'}) => {
  const appTheme = useSelector(state => state.service.theme);
  const themeType = useColorScheme();

  let darkMode =
    appTheme === 'automatic'
      ? themeType === 'light'
        ? false
        : true
      : appTheme === 'light'
      ? false
      : true;

  return (
    <MotiView
      transition={{type: 'timing'}}
      style={{
        backgroundColor: darkMode ? '#1c1c1e' : '#ffffff',
        padding: 16,
        marginBottom: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
      animate={{
        backgroundColor: darkMode ? '#1c1c1e' : '#ffffff',
      }}>
      {/* Avatar + Title */}
      <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <Skeleton
          colorMode={darkMode ? 'dark' : 'light'}
          height={40}
          width={40}
          radius="round"
        />
        <View style={{marginLeft: 12, flex: 1}}>
          <Skeleton
            colorMode={darkMode ? 'dark' : 'light'}
            width={'60%'}
            height={16}
            radius="round"
          />
          <Spacer height={6} />
          <Skeleton
            colorMode={darkMode ? 'dark' : 'light'}
            width={'40%'}
            height={14}
            radius="round"
          />
        </View>
      </View>

      <Spacer height={16} />

      {/* Income / Expense Row */}
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <Skeleton
          colorMode={darkMode ? 'dark' : 'light'}
          width={'48%'}
          height={20}
          radius="round"
        />
        <Skeleton
          colorMode={darkMode ? 'dark' : 'light'}
          width={'48%'}
          height={20}
          radius="round"
        />
      </View>

      <Spacer height={14} />

      {/* Avl Bal */}
      <Skeleton
        colorMode={darkMode ? 'dark' : 'light'}
        width={'30%'}
        height={20}
        radius="round"
      />
    </MotiView>
  );
};

export default SheetCardSkeleton;
