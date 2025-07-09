import React, {useState, useEffect, useContext} from 'react';
import {View, StyleSheet, Dimensions, TouchableOpacity} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import {BlurView} from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import {Pagination} from 'react-native-reanimated-carousel';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {
  interpolate,
  runOnJS,
  SlideInUp,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  ZoomIn,
} from 'react-native-reanimated';
import moment from 'moment';
import {SQLiteContext} from '../../../services/sqlite/sqlite.context';
import {SheetsContext} from '../../../services/sheets/sheets.context';
import {AuthenticationContext} from '../../../services/authentication/authentication.context';
import {Text} from '../../../components/typography/text.component';
import {GetCurrencySymbol} from '../../../components/symbol.currency';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import {WatermelonDBContext} from '../../../services/watermelondb/watermelondb.context';
import {Q} from '@nozbe/watermelondb';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

const {width, height} = Dimensions.get('window');
const STORAGE_KEY = '@expenses-manager-recap';

// Gradient backgroundsf
const gradientColors = [
  ['#7F00FF', '#E100FF'],
  ['#ff9966', '#ff5e62'],
  ['#56CCF2', '#2F80ED'],
  ['#00F260', '#0575E6'],
  ['#f12711', '#f5af19'],
  ['#DA4453', '#89216B'],
];

const formatCurrency = (amount, symbol = '₹') => {
  return `${symbol}${Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};
// AsyncStorage.removeItem(STORAGE_KEY);
export const DailyStoryCard = ({forceShowRecap, setForceShowRecap}) => {
  const {db, getChildRecords} = useContext(WatermelonDBContext);
  const {userData} = useContext(AuthenticationContext);
  const [storyList, setStoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRecap, setShowRecap] = useState(true);
  const progress = useSharedValue(0);
  const [noRecapAvailable, setNoRecapAvailable] = useState(false);
  const translateY = useSharedValue(0);

  useEffect(() => {
    const loadRecap = async () => {
      try {
        if (!userData?.id) return;

        const today = moment().format('YYYY-MM-DD');
        const storedDate = await getStoredRecapDate();

        const accounts = await getChildRecords(
          'users',
          'id',
          userData.id,
          'accounts',
          {
            filters: [
              Q.where('archived', false),
              Q.where('isLoanAccount', false),
            ],
          },
        );

        if (accounts.length === 0 && !forceShowRecap) {
          setShowRecap(false); // New user - no accounts - don't show
          return;
        }

        if (storedDate === today && !forceShowRecap) {
          setShowRecap(false); // Already shown today
          return;
        }

        await fetchData(accounts); // Load recap normally
      } catch (error) {
        console.error('Error loading daily recap:', error);
      }
    };

    loadRecap();
  }, [userData, forceShowRecap]);

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{translateY: translateY.value}],
  }));

  const blurAmount = useDerivedValue(() => {
    return interpolate(translateY.value, [0, height], [4, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  });

  const animatedBlurProps = useAnimatedProps(() => ({
    blurAmount: blurAmount.value,
  }));

  const getStoredRecapDate = async () => {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEY);
      return value;
    } catch (error) {
      console.error('Error reading recap date:', error);
      return null;
    }
  };

  const setStoredRecapDate = async date => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, date);
    } catch (error) {
      console.error('Error setting recap date:', error);
    }
  };

  const fetchData = async (accounts = []) => {
    try {
      const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');
      const cards = [];

      for (const acc of accounts) {
        let totalIncome = 0;
        let totalExpense = 0;
        let totalTransactions = 0;
        let biggestTxn = {amount: 0, categoryName: ''};

        // Fetch transactions for this account from yesterday
        const txns = await acc.collections
          .get('transactions')
          .query(
            Q.where('accountId', acc.id),
            Q.where('date', Q.like(`${yesterday}%`)),
          )
          .fetch();

        const incomeTxns = txns.filter(t => t.type === 'income');
        const expenseTxns = txns.filter(t => t.type === 'expense');
        totalIncome = incomeTxns.reduce((sum, t) => sum + t.amount, 0);
        totalExpense = expenseTxns.reduce((sum, t) => sum + t.amount, 0);
        totalTransactions = txns.length;

        if (expenseTxns.length > 0) {
          const topExpense = expenseTxns.sort((a, b) => b.amount - a.amount)[0];
          const category = await topExpense.category.fetch();
          biggestTxn = {
            amount: topExpense.amount,
            categoryName: category?.name || '',
          };
        }

        const savings = totalIncome - totalExpense;
        const savingRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

        if (totalIncome === 0 && totalExpense === 0) continue;

        // Humanized dynamic analysis
        let verdict = '';
        if (savings > 0 && savingRate >= 50) {
          verdict = '🌟 Incredible savings! You’re mastering your money!';
        } else if (savings > 0) {
          verdict = '🎯 Great! You spent wisely and saved too!';
        } else if (savings < 0) {
          verdict = '⚡ Expenses overtook income yesterday. Let’s reset today!';
        } else {
          verdict = '✅ Balanced day. Stability is power!';
        }

        const symbol = GetCurrencySymbol(acc.currency) || '₹';
        const formattedIncome = formatCurrency(totalIncome, symbol);
        const formattedExpense = formatCurrency(totalExpense, symbol);
        const formattedSavings = formatCurrency(savings, symbol);
        const formattedBigTxn = biggestTxn.amount
          ? formatCurrency(biggestTxn.amount, symbol)
          : null;

        cards.push({
          title: `🏦 ${acc.name}`,
          formattedIncome,
          formattedExpense,
          formattedSavings,
          savingRate: savingRate.toFixed(1),
          totalTransactions,
          savings,
          formattedBigTxn,
          biggestTxnCategory: biggestTxn.categoryName || 'something memorable',
          biggestTxnAmount: biggestTxn.amount,
          verdict,
        });
      }
      if (cards.length === 0) {
        setNoRecapAvailable(true);
        cards.push({});
      } else {
        setNoRecapAvailable(false);
      }
      setStoryList(cards);
    } catch (error) {
      console.error('Fetch recap error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onCloseRecap = async () => {
    translateY.value = withSpring(height, {
      damping: 20,
      stiffness: 120,
      mass: 1,
    });

    setTimeout(async () => {
      if (!forceShowRecap) {
        const today = moment().format('YYYY-MM-DD');
        await setStoredRecapDate(today);
      }
      setShowRecap(false);
      setForceShowRecap(false);
      translateY.value = 0;
    }, 300);
  };

  const dragGesture = Gesture.Pan()
    .onUpdate(event => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd(event => {
      if (event.translationY > 150) {
        runOnJS(onCloseRecap)();
      } else {
        translateY.value = withSpring(0, {
          damping: 20,
          stiffness: 120,
          mass: 1,
        });
      }
    });

  if (loading || (!showRecap && !forceShowRecap) || storyList.length === 0)
    return null;
  return (
    <View style={styles.overlay}>
      <AnimatedBlurView
        style={styles.absolute}
        blurType="dark"
        animatedProps={animatedBlurProps}
      />
      <GestureDetector gesture={dragGesture}>
        <Animated.View
          entering={
            forceShowRecap
              ? SlideInUp.springify().damping(15)
              : ZoomIn.duration(500)
          }
          style={[styles.sheetContainer, animatedStyles]}>
          <View style={styles.handleBar} />

          <TouchableOpacity style={styles.closeButton} onPress={onCloseRecap}>
            <Ionicons name="close-circle" size={36} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.recapTitle}>
            ✨ Yesterday's Financial Journey ✨
          </Text>

          <View style={styles.carouselContainer}>
            <Carousel
              width={width * 0.85}
              height={height * 0.5}
              loop={storyList.length > 1 || false}
              scrollAnimationDuration={1600}
              data={storyList}
              onProgressChange={progress}
              renderItem={({item, index}) => (
                <LinearGradient
                  colors={gradientColors[index % gradientColors.length]}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.card}>
                  {noRecapAvailable ? (
                    <>
                      <Text style={styles.title}>🧘‍♂️ No Recap Available</Text>
                      <Text style={styles.message}>
                        Yesterday was a day of balance. ✨ No income, no
                        expenses — just steady calmness. 🌿 It's okay to have
                        quiet days — they build a strong foundation. 💪 Stay
                        focused, keep your goals in sight, and make today count!
                        🚀
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.title}>{item.title}</Text>

                      <Text style={styles.message}>
                        You earned{' '}
                        <Text style={styles.bold}>{item.formattedIncome}</Text>{' '}
                        and spent{' '}
                        <Text style={styles.bold}>{item.formattedExpense}</Text>{' '}
                        yesterday.
                        {'\n\n'}
                        {item.savings > 0 ? (
                          <>
                            Saved{' '}
                            <Text style={styles.bold}>
                              {item.formattedSavings}
                            </Text>{' '}
                            ({item.savingRate}%) - great work! 🌟
                          </>
                        ) : (
                          <>
                            Overspent{' '}
                            <Text style={styles.bold}>
                              {item?.formattedSavings?.replace('-', '')}
                            </Text>{' '}
                            - let's do better tomorrow! 🔄
                          </>
                        )}
                        {'\n\n'}
                        You made{' '}
                        <Text style={styles.bold}>
                          {item.totalTransactions}
                        </Text>{' '}
                        {item.totalTransactions === 1
                          ? 'transaction'
                          : 'transactions'}
                        .{'\n'}
                        {item.biggestTxnAmount > 0 ? (
                          <>
                            Your biggest expense was{' '}
                            <Text style={styles.bold}>
                              {item.formattedBigTxn}
                            </Text>{' '}
                            on{' '}
                            {item.biggestTxnCategory || 'something memorable'}.
                          </>
                        ) : (
                          <>No major expenses made. 🧘‍♂️</>
                        )}
                        {'\n\n'}
                        {item.verdict}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              )}
            />

            <Pagination.Basic
              progress={progress}
              data={storyList}
              dotStyle={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(255,255,255,0.5)',
              }}
              activeDotStyle={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: '#ffffff',
              }}
              containerStyle={{marginTop: 18, gap: 8}}
            />
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  absolute: {
    ...StyleSheet.absoluteFillObject,
  },
  handleBar: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignSelf: 'center',
    marginBottom: 15,
  },

  sheetContainer: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 21,
  },
  recapTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: -20,
    marginTop: 60,
    textAlign: 'center',
  },
  carouselContainer: {
    height: height * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: width * 0.85,
    height: height * 0.5,
    borderRadius: 26,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  message: {
    fontSize: 18,
    fontWeight: '400',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 28,
  },
  bold: {
    fontWeight: 'bold',
    color: '#fff',
  },
});
