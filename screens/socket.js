import io from 'socket.io-client';
//import {SOCKET_HOST} from '../common/global';

let socket = null;

const SocketUtils = {
  init: async () => {
    socket = await io.connect("http://192.168.1.2/:4001/");
  },
  getId: () => socket.id,
  joinRoom: async roomID => {
    console.log('in join rooooommmmm', roomID, socket);
    socket.emit('join room', roomID);
  },
  otherUser: async callBack => {
    socket.on('other user', callBack);
  },
  userJoined: async callBack => {
    socket.on('user joined', callBack);
  },
  offer: async payload => {
    socket.emit('offer', payload);
  },

  onOffer: async callBack => {
    socket.on('offer', callBack);
  },

  onAnswer: async callBack => {
    socket.on('answer', callBack);
  },

  answer: async payload => {
    socket.emit('answer', payload);
  },

  onIceCandidate: async callBack => {
    socket.on('ice-candidate', callBack);
  },

  iceCandidate: async payload => {
    socket.emit('ice-candidate', payload);
  },
  onLeave: async callBack => {
    socket.on('leave', callBack);
  },
  leave: async payload => {
    socket.emit('leave', payload);
  },
};

module.exports = SocketUtils;
