import io from 'socket.io-client';
import {SOCKET_HOST} from './global';

let socket = null;

const SocketUtils = {
  init: async () => {
    console.log("======SOCKET============SOCKET_HOST====="+SOCKET_HOST);
    socket = await io.connect(SOCKET_HOST);
  },
  getId: () => socket.id,
  joinRoom: async roomID => {
    console.log('in join rooooommmmm', roomID, socket);
    socket.emit('join room', roomID);
  },
  otherUser: async callBack => {
    console.log("======SOCKET================other user=====");
    socket.on('other user', callBack);
  },
  userJoined: async callBack => {
    console.log("======SOCKET================user joined=====");
    socket.on('user joined', callBack);
  },
  offer: async payload => {
    console.log("======SOCKET================offer==payload===");
    socket.emit('offer', payload);
  },

  onOffer: async callBack => {
    console.log("======SOCKET================offer==callBack===");
    socket.on('offer', callBack);
  },

  onAnswer: async callBack => {
    console.log("======SOCKET================answer===callBack==");
    socket.on('answer', callBack);
  },

  answer: async payload => {
    console.log("======SOCKET================answer===payload==");
    socket.emit('answer', payload);
  },

  onIceCandidate: async callBack => {
    console.log("======SOCKET================ice-candidate===callBack==");
    socket.on('ice-candidate', callBack);
  },

  iceCandidate: async payload => {
    console.log("======SOCKET================ice-candidate===payload==");
    socket.emit('ice-candidate', payload);
  },
  onLeave: async callBack => {
    console.log("======SOCKET================leave===callBack==");
    socket.on('leave', callBack);
  },
  leave: async payload => {
    console.log("======SOCKET================leave===payload==");
    socket.emit('leave', payload);
  },
};

module.exports = SocketUtils;
