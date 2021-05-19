import io from 'socket.io-client';
import {RTCIceCandidate, RTCPeerConnection, RTCSessionDescription} from "react-native-webrtc";
import apiCall from "./apiCall";

const server = "http://192.168.31.49:3000/"
export const peerConnectionConfig = {
  'iceServers': [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
    {
      urls: 'stun:stun1.l.google.com:19302',
    },
    {
      urls: 'stun:stun2.l.google.com:19302',
    },
  ]
};
let socket = null;

export const EVENT_BE_CALLED = 'user-call';
export const EVENT_STOP_CALL = 'stop-call';
export const EVENT_ROOM_LIST = 'room-list';
export const EVENT_USER_REJECT = 'user-reject';
export const EVENT_FULL_ROOM = 'full-room';
export const EVENT_USER_JOIN = 'user-joined';
export const EVENT_SIGNAL = 'signal';
export const EVENT_USER_LEFT = 'user-left';
export const EVENT_ROOM_USERS = 'room-users';
export const EVENT_ROOM_INVITE = 'invite';
export const EVENT_ROOM_PARTNER_LIST= 'partner_list';

const webRTCSdk = {

  setEventListener(event, callback){
      socket.on(event, callback);
  },

  connect: async (userId, callbackInit, callbackList) => {
    if(socket){
      socket.disconnect();
    }
    socket = await io.connect(server);

    socket.on('connect', async () => {

      console.log('====socket connected===', socket.id);
      socket.emit('user-login', userId);

      socket.on('list', function(user_list, room_list){
        callbackList(user_list, room_list);
      });

      callbackInit();
    });
  },

  getId: () => socket.id,

  call: (userId, receiverId) => {
    socket.emit('call', userId, receiverId);
  },

  stopCall: (userId) => {
    socket.emit('stop-call', userId);
  },


  reject: (uid, cuid) => {
    socket.emit('reject', uid, cuid);
  },

  receive: (uid, cuid, room) => {
    socket.emit('receive', uid, cuid, room);
  },

  leave: (roomId, userId) => {
    socket.emit('user-leave', roomId, userId);
  },

  join: (rid, userId) => {
      socket.emit('join', rid, userId);
  },

  signal: (fromId, message) => {
      socket.emit('signal', fromId, message)
  },

  logOut: (userId) => {
    socket.emit('user-logout', userId);
  },

  setMuteState: (roomId, userId, muted) => {
    socket.emit('user-muted', roomId, userId, muted);
  },

  authBeforeCall: (params, success, fail) => {
    apiCall.post("videochat/authBeforeCall", params, success, fail);
  },

  authLoginRoom: (params, success, fail) => {
    apiCall.post("videochat/authLoginRoom", params, success, fail);
  },

  callStatus: (params, success = ()=>{}, fail=()=>{}) => {
    apiCall.post("videochat/callStatus", params, success, fail);
  },

  invite: (rid, from, to) => {
    socket.emit('invite', rid, from, to);
  }
};

export default  webRTCSdk;
