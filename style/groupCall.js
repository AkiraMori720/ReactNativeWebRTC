import {StyleSheet} from 'react-native';
import StyleConfig from './config';
import {WINDOW} from '../iosocket/global';

export default StyleSheet.create({
  btnContent: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
  },

  container: {
    flex: 1,
  },
  localVideo: {
    flex: 1,
  },
  inputContainer: {
    borderWidth: 1,
    backgroundColor: 'transparent',
    height: StyleConfig.countPixelRatio(45),
    width: '100%',
    paddingLeft: StyleConfig.countPixelRatio(30),
  },
  callButtonView: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: StyleConfig.countPixelRatio(10),
  },
  buttonContainer: {
    height: StyleConfig.countPixelRatio(50),
    width: StyleConfig.countPixelRatio(50),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'green',
  },
  cameraIconView: {
    alignItems: 'center',
    paddingHorizontal: StyleConfig.countPixelRatio(10),
    position: 'absolute',
    justifyContent: 'space-between',
    flexDirection: 'row',
    width: WINDOW.width,
    bottom: StyleConfig.countPixelRatio(5),
  },
  yourView: {
    borderWidth: 1,
    position: 'absolute',
    justifyContent: 'center',
    // left: StyleConfig.countPixelRatio(10),
    bottom: StyleConfig.countPixelRatio(120),
    height: StyleConfig.countPixelRatio(140),
    width: 400,
  },
  newUserImageStyle: {
    height: StyleConfig.countPixelRatio(130),
    width: StyleConfig.countPixelRatio(100),
    margin: StyleConfig.countPixelRatio(5),
    borderWidth: 2,
  },
  yourCameraView: {
    borderWidth: 1,
    height: StyleConfig.countPixelRatio(140),
    width: StyleConfig.countPixelRatio(90),
  },
  endCallButton: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: StyleConfig.countPixelRatio(145),
    bottom: StyleConfig.countPixelRatio(60),
    height: StyleConfig.countPixelRatio(50),
    width: StyleConfig.countPixelRatio(50),
    borderRadius: StyleConfig.countPixelRatio(25),
    backgroundColor: 'red',
  },
  otherView: {
    height: '100%',
  },
  speakerButton: {
    backgroundColor: '#CACACA',
    height: 50,
    width: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    flex: 1,
  },
  videos: {
    width: '100%',
    flex: 1,
    position: 'relative',
    overflow: 'hidden',

    borderRadius: 6,
  },
  localVideos: {
    height: 100,
    marginBottom: 10,
  },
  remoteVideos: {
    borderWidth: 1,
    height: 400,
  },
  remoteVideo: {
    backgroundColor: '#f2f2f2',
    height: '100%',
    width: '100%',
  },
});
