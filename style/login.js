import {StyleSheet} from 'react-native';
import StyleConfig from './config';

export default StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: StyleConfig.countPixelRatio(20),
    backgroundColor: '#B0E0E6',
  },
  inputContainer: {
    borderBottomColor: '#F5FCFF',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    height: StyleConfig.countPixelRatio(45),
    paddingLeft: StyleConfig.countPixelRatio(10),
  },
  buttonContainer: {
    height: StyleConfig.countPixelRatio(45),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: StyleConfig.countPixelRatio(20),
  },
  sendButton: {
    backgroundColor: "#FF4500",
  },
})
