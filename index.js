/**
 * @format
 */
import { NativeModules } from "react-native";
import Reactotron from 'reactotron-react-native';

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
console.disableYellowBox = true;

const useReactotron = true;
//const useReactotron = false;
if(useReactotron){
    const scriptURL = NativeModules.SourceCode.scriptURL;
    const scriptHostname = scriptURL.split('://')[1].split(':')[0];
    Reactotron
        .configure({ host: scriptHostname })
        .useReactNative()
        .connect();
    // Running on android device
    // $ adb reverse tcp:9090 tcp:9090
    Reactotron.clear();
    console.warn = Reactotron.log;
    console.log = Reactotron.log;
}
AppRegistry.registerComponent(appName, () => App);
