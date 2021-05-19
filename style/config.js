import { PixelRatio,Platform} from 'react-native';
import {WINDOW,deviceType } from '../iosocket/global'

const iPhoneX = Platform.OS === 'ios' && WINDOW.height === 812

const height = Platform.OS === 'ios' ? iPhoneX ? WINDOW.height - 78 : WINDOW.height : WINDOW.height - 24

const smartScale = (value) => {
  return PixelRatio.roundToNearestPixel((WINDOW.width + WINDOW.height) * (value / ((Platform.OS === 'ios') ? 1100 : 1000)));
}

const scalarSpace = iPhoneX ? smartScale(11) : smartScale(13);

const screenPaddingValue = iPhoneX ? smartScale(17) : smartScale(26);

const getWidthByColumn = (column = 1) => {
  const totalPixel = WINDOW.width;
  const totalSpace = ((screenPaddingValue * 2) + (scalarSpace * (column - 1)));
  return ((totalPixel - totalSpace) / column);
}

const AppColors = {
  //Color
  red:'#E35C5C',
  neroBlack: '#9B9B9B',
  white: '#ffffff',
  shamrock:'#3BD5B1',
  shamrock2:'#1DBC94',
  shamrock3:'#41D4AF',
  silver:'#C6C6C6',
  summerSky: '#29ABE2',
  rollingStone:'#7A7B7B',
  gainsboro:'#E2E2E2',
  black:'#323232',
  EveningSea:'#255A4D',
  EveningSea2:'#6CADA6',
  LightGrey:'#D1D1D1',
  dimGray: '#747474',
  dimGray2:'#717171',
  pinkSwan: '#B2B2B2',
  nobel: '#969696',
  Roman : '#E35C5C',
  tradewind: '#6CADA6',
  whisper: '#F9F9F9',
  scampi: '#6F7298',
  darkBlack: '#0D0D0D',
  nightRider: '#2D2D2D',
  primrose: '#EADE9A',
  bananaMania: '#FEEFB3',
  gray:'#D9D9D9',
  snow: '#FAFAFA',
  onahau: '#BAE8F7',
  cosmicLatte: '#CAFEDB',
  sushi: '#779E2E',
  peach: '#FDEDE2',
  whiteSmoke: '#F4F4F4',
  mediumSlateBlue: '#6660F6'

};

export default {
  countPixelRatio: (defaultValue) => {
    return smartScale(defaultValue);
  },

  screen: {
    height,
  },

  // Fonts
  bold: 'Alleyn-Bold',
  boldItalic: 'Alleyn-Bold-Italic',
  regular: 'Alleyn-Regular',
  regularItalic: 'Alleyn-Regular-Italic',
  medium: 'Alleyn-Medium',
  mediumItalic: 'Alleyn-Medium-Italic',
  semiBold: 'Alleyn-Semibold',
  semiBoldItalic: 'Alleyn-Semibold-Italic',
  light: 'Alleyn-Light',
  lightItalic: 'Alleyn-Light-Italic',
  book: 'Alleyn-Book',
  bookItalic: 'Alleyn-Book-Italic',

  //Colors
  ...AppColors,

  //Font Size for Phone & Tablet
  headerHeight: Platform.OS === 'ios' ? iPhoneX ? smartScale(87) : smartScale(65) : smartScale(45),
  fontSizeXL: smartScale((deviceType == 'phone') ? 40 : 70),
  fontSizeX: smartScale((deviceType == 'phone') ? 28 : 40),
  fontSizeParagraph: smartScale((deviceType == 'phone') ? 11 : 15),
  fontSizeSubParagraph: smartScale((deviceType == 'phone') ? 8 : 12),
  fontSizeH1: smartScale((deviceType == 'phone') ? 38 : 50),
  fontSizeH2: smartScale((deviceType == 'phone') ? 22 : 29),
  fontSizeH3: smartScale((deviceType == 'phone') ? 20 : 25),
  fontSizeH4: smartScale((deviceType == 'phone') ? 17 : 24),
  fontSizeH5: smartScale((deviceType == 'phone') ? 16 : 23),
  fontSizeH6: smartScale((deviceType == 'phone') ? 14 : 21),
  fontSizeH7: smartScale((deviceType == 'phone') ? 13 : 20),
  fontSizeH8: smartScale((deviceType == 'phone') ? 12 : 19),
  fontSizeH9: smartScale((deviceType == 'phone') ? 10 : 17),
  fontSizeH10: smartScale((deviceType == 'phone') ? 9 : 16),
  fontSizeFieldTitle: smartScale((deviceType == 'phone') ? 13 : 17),
  fieldButtonFontSize: smartScale(),

  //Buttons Config
  buttonHeightH1: smartScale(46),
  buttonHeightH2: smartScale(25),

  buttonTextH1: smartScale((deviceType == 'phone') ? 15 : 17),
  buttonTextH2: smartScale((deviceType == 'phone') ? 10 : 13),

  //Grid values
  screenPaddingValue: smartScale(8),
  scalarSpace: scalarSpace,
  getScreenPadding: screenPaddingValue,
  getWidthByColumn: (column = 1) => {
    return (column == 3)
      ? getWidthByColumn(2) + getWidthByColumn(4) + scalarSpace
      : getWidthByColumn(column);
  }
}
