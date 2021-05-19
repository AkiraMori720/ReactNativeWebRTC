import {
    Dimensions,
} from 'react-native';

export const WINDOW = Dimensions.get('window');
//export const WsConnection ='https://jbtwebrtcheroku.herokuapp.com';
export const WsConnection ='http://192.168.1.2:4001/';
export const SOCKET_HOST ='http://192.168.1.2:4001/';
export const RTCPeerConnections = {
    //change the config as you need
    iceServers: [
        {
            urls: 'stun:stun.l.google.com:19302',
        }, {
            urls: 'stun:stun1.l.google.com:19302',
        }, {
            urls: 'stun:stun2.l.google.com:19302',
        }

    ],
}
