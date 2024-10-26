/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/self-closing-comp */
/* eslint-disable react/no-unstable-nested-components */
import Ionicons from 'react-native-vector-icons/Ionicons';
import React, {useContext, useEffect, useState} from 'react';
import {ScrollView, TouchableOpacity} from 'react-native';
import {Card} from 'react-native-paper';
import {useTheme} from 'styled-components/native';
import {
  CategoryColor,
  AddNewCategoryIcon,
  CategoryItem,
  NewCategory,
} from '../../../categories/components/categories.styles';
import {SheetsContext} from '../../../../services/sheets/sheets.context';
import {SafeArea} from '../../../../components/utility/safe-area.component';
import {Text} from '../../../../components/typography/text.component';
import {
  FlexRow,
  Input,
  MainWrapper,
  TouchableHighlightWithColor,
} from '../../../../components/styles';
import _ from 'lodash';
import {Spacer} from '../../../../components/spacer/spacer.component';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {MultipleSelectList} from 'react-native-dropdown-select-list';
import moment from 'moment';

const repeatValues = [
  {
    name: 'Never',
    value: 'never',
  },
  {
    name: 'Daily',
    value: 'daily',
  },
  {
    name: 'Weekly',
    value: 'weekly',
  },
  {
    name: 'Monthly',
    value: 'monthly',
  },
  {
    name: 'Yearly',
    value: 'yearly',
  },
];

export const SelectRepeatScreen = ({navigation, route}) => {
  const [repeat, setRepeat] = useState(null);
  const [selectedDays, setSelectedDays] = useState([]);

  const theme = useTheme();
  useEffect(() => {
    if (route.params.repeat) {
      setRepeat(route.params.repeat);
    }
  }, [route.params]);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FlexRow>
            <Ionicons
              name="chevron-back-outline"
              size={25}
              color={theme.colors.brand.primary}></Ionicons>
            <Text color={theme.colors.brand.primary}>Back</Text>
          </FlexRow>
        </TouchableOpacity>
      ),
    });
  }, []);

  const onChangeRepeat = item => {
    let value = item.value;
    if (value === 'weekly') {
      console.log(moment().format('E'));
      setSelectedDays([Number(moment().format('d'))]);
    }

    setRepeat(item);
  };

  const onSelectWeek = value => {
    const selWeeks = _.cloneDeep(selectedDays);
    const itemExists = _.includes(selWeeks, value);
    if (itemExists) {
      _.pull(selWeeks, value);
    } else {
      selWeeks.push(value);
    }
    const uniqueArray = _.uniq(selWeeks);
    setSelectedDays(uniqueArray);
  };

  const getEventOccurance = () => {
    let value = repeat?.value;
    if (!value) {
      return '';
    }
    let message = '';
    if (value === 'weekly') {
      if (selectedDays.length === 6) {
        message = 'Event will occur everyday';
        return message;
      }
      const dayNames = _.chain(selectedDays)
        .sortBy()
        .map(dayNumber => moment().day(dayNumber).format('dddd'))
        .value();
      if (dayNames.length === 1) {
        message = `Event will occur every week on ${dayNames[0]}.`;
      } else {
        const lastDay = dayNames.pop();
        message = `Event will occur every week on ${dayNames.join(
          ', ',
        )} and ${lastDay}.`;
      }
    }
    return message;
  };

  return (
    <SafeArea child={true}>
      <MainWrapper>
        <Spacer size={'xlarge'}></Spacer>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Card
            theme={{roundness: 5}}
            style={{
              marginBottom: 20,
              backgroundColor: theme.colors.bg.card,
              margin: 1,
            }}>
            {repeatValues.map(r => {
              return (
                <TouchableHighlightWithColor
                  key={r.value}
                  onPress={() => {
                    onChangeRepeat(r);
                    // navigation.navigate('AddSheetDetail', {
                    //   repeat: r,
                    // });
                  }}>
                  <Card.Content>
                    <FlexRow justifyContent="space-between">
                      <CategoryItem>
                        <Spacer position={'left'} size={'medium'} />
                        <Text fontfamily="heading">{r.name}</Text>
                      </CategoryItem>
                      {repeat && repeat.value === r.value && (
                        <Ionicons
                          name="checkmark-outline"
                          size={25}
                          color={theme.colors.brand.primary}
                        />
                      )}
                    </FlexRow>

                    <Spacer size={'small'} />
                  </Card.Content>
                </TouchableHighlightWithColor>
              );
            })}
          </Card>

          <Spacer position="left">
            <Text fontsize="14px" color={'#272727'} fontfamily="monospace">
              {getEventOccurance()}{' '}
            </Text>
          </Spacer>

          {repeat?.value === 'weekly' && (
            <Card
              theme={{roundness: 5}}
              style={{
                marginBottom: 100,
                marginTop: 20,
                backgroundColor: theme.colors.bg.card,
                margin: 1,
              }}>
              {_.range(6).map(value => {
                return (
                  <TouchableHighlightWithColor
                    key={value}
                    onPress={() => {
                      onSelectWeek(value);
                      // navigation.navigate('AddSheetDetail', {
                      //   repeat: r,
                      // });
                    }}>
                    <Card.Content>
                      <FlexRow justifyContent="space-between">
                        <CategoryItem>
                          <Spacer position={'left'} size={'medium'} />
                          <Text fontfamily="heading">
                            {moment().day(value).format('dddd')}
                          </Text>
                        </CategoryItem>
                        {selectedDays && selectedDays.includes(value) && (
                          <Ionicons
                            name="checkmark-outline"
                            size={25}
                            color={theme.colors.brand.primary}
                          />
                        )}
                      </FlexRow>

                      <Spacer size={'small'} />
                    </Card.Content>
                  </TouchableHighlightWithColor>
                );
              })}
            </Card>
          )}
        </ScrollView>
      </MainWrapper>
    </SafeArea>
  );
};
