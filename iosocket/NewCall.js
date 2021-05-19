import React, {useState, useCallback, useEffect, useRef} from 'react';
import {View, TouchableOpacity, FlatList, Text, ScrollView} from 'react-native';
import {GroupCallStyle} from '../style';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Octicons from 'react-native-vector-icons/Octicons';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  MediaStream,
  MediaStreamTrack,
  mediaDevices,
  registerGlobals,
} from 'react-native-webrtc';
import {Button} from 'react-native-paper';
import {useFocusEffect} from '@react-navigation/native';
import {userState} from '../recoil/Atom';
import SOCKET from './socket';
import AsyncStorage from '@react-native-community/async-storage';
import io from 'socket.io-client';
import groupCall from '../style/groupCall';
import {call} from "react-native-reanimated";
import {connect} from "formik";

const newJoinUsersList = [
  {
    id: 0,
    imageUrl:
        'https://www.jiomart.com/images/product/150x150/590000025/orange-imported-1-kg-0-20200628.jpg',
    title: 'something',
  },
  {
    id: 1,
    imageUrl: 'https://reactnative.dev/img/tiny_logo.png',
    title: 'something two',
  },
  {
    id: 2,
    imageUrl:
        'https://www.jiomart.com/images/product/150x150/590002136/onion-5-kg-pack-0-20200628.jpg',
    title: 'something three',
  },
  {
    id: 3,
    imageUrl: 'https://reactnative.dev/img/tiny_logo.png',
    title: 'something four',
  },
  {
    id: 4,
    imageUrl:
        'https://www.jiomart.com/images/product/150x150/590003662/green-capsicum-500-g-0-20200628.jpg',
    title: 'something five',
  },
  {
    id: 5,
    imageUrl: 'https://reactnative.dev/img/tiny_logo.png',
    title: 'something six',
  },
];

export default function CallScreen({navigation, ...props}) {
  let varRoomId = null;
  var socketId;
  const [userId, setUserId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [remoteIndexes, setRemoteIndexes] = useState({});
  const [realStream1, setRealStream1] = useState(null);
  const [realStream2, setRealStream2] = useState(null);
  const [realStream3, setRealStream3] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [connections, setConnections] = useState({});
  const [fullRoomFlag, setFullRoomFlag] = useState(false);

  const userStream = useRef();
  const realStreamRef1 = useRef();
  const realStreamRef2 = useRef();
  const realStreamRef3 = useRef();
  const socketRef = useRef();

  var peerConnectionConfig = {
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

  const onLogout = () => {
    console.log("log out=============");
    userStream.current.getTracks().forEach(item => item.stop());
    userStream.current.release();
    socketRef.current.emit('leave', roomId);

    setLocalStream(null);
    setRemoteIndexes({});
    setRealStream1(null);
    realStreamRef1.current = null;
    setRealStream2(null);
    realStreamRef2.current = null;
    setRealStream3(null);
    realStreamRef3.current = null;
    setFullRoomFlag(false);

    Object.keys(connections).forEach(key => {
      let peer = connections[key];
      peer.onicecandidate = null;
      peer.onaddstream = null;
      peer.close();
    });

    setConnections({});

    AsyncStorage.removeItem('roomId').then(()=>{
      AsyncStorage.removeItem('userId').then((res) => {
        navigation.push('Login');
      });
    })
  };

  useEffect(() => {
    navigation.setOptions({
      title: 'Room ID - ' + roomId + '     Your ID - ' + userId,
      headerRight: () => (
          <Button mode="text" onPress={onLogout} style={{paddingRight: 10}}>
            Logout
          </Button>
      ),
    });
  }, [roomId, userId]);

  useEffect(() => {
    AsyncStorage.getItem('roomId').then((id) => {
      console.log('=====Room Id======================' + id);
      if (id) {
        setRoomId(id);
        varRoomId = id;
        console.log('========roomId=============', id);
      } else {
        setRoomId('');
        navigation.push('Login');
      }
    }).then(() => {
      AsyncStorage.getItem('userId').then((id) => {
        console.log(id);
        if (id) {
          setUserId(id);
          console.log('========userLoginId=============', id);
          getLocalStreamDevice(connectSocket);
        } else {
          setUserId('');
          navigation.push('Login');
        }
      });
    })
  }, []);

  let socket = null;
  async function connectSocket() {
    socket = await io.connect('http://192.168.31.95:3000/');
    socketRef.current = socket;

    socket.on('signal', gotMessageFromServer);

    socket.on('connect', async () => {

      socketId = socket.id;
      console.log('====socket connected===', socketId);
      socket.emit('join', varRoomId);

      socket.on('full-room', function(){
        setFullRoomFlag(true);
      });

      socket.on('user-left', function(rId, id){
        console.log('====user left====', rId, id);
        if(rId !== varRoomId){
          return;
        }

        let leftRemoteIndex = null;
        Object.keys(remoteIndexes).forEach(sid => {if(sid === id){ leftRemoteIndex = remoteIndexes[sid]; }});
        if(leftRemoteIndex){
          let newRemoteIndexes = remoteIndexes;
          delete newRemoteIndexes[id];
          setRemoteIndexes(newRemoteIndexes);
          switch (leftRemoteIndex) {
            case 1:
              setRealStream1(null);
              break;
            case 2:
              setRealStream2(null);
              break;
            case 3:
              setRealStream3(null);
              break;
          }
        }
      });
      socket.on('user-joined', function(rId, id, count, clients){
        console.log('join: ', rId, id, count, clients);
        if(rId !== varRoomId){
          return;
        }

        clients.forEach(function(socketListId) {


          if(!connections[socketListId]){
            //Wait for their ice candidate
            let newConnections = connections;
            newConnections[socketListId] = new RTCPeerConnection(peerConnectionConfig);

            console.log('connections', newConnections, socketListId);
            //Wait for their video stream
            newConnections[socketListId].onicecandidate = function(event){
              if(event.candidate != null) {
                console.log('SENDING ICE');
                socket.emit('signal', socketListId, JSON.stringify({'ice': event.candidate}));
              }

            }
            newConnections[socketListId].onaddstream = function(event){
              gotRemoteStream(event, socketListId)

            }

            //Add the local video stream
            newConnections[socketListId].addStream(userStream.current);

            console.log('connections', newConnections, socketListId);
            setConnections(newConnections);
          }
        });

        //Create an offer to connect with your local description
        if(count >= 2){
          connections[id].createOffer().then(function(description){
            connections[id].setLocalDescription(description).then(function() {
              // console.log(connections);
              socket.emit('signal', id, JSON.stringify({'sdp': connections[id].localDescription}));
            }).catch(e => console.log(e));
          });
        }
      });
    });
  }

  const getLocalStreamDevice = (callback) => {
    let isFront = false;
    mediaDevices.enumerateDevices().then((sourceInfos) => {
      let videoSourceId;
      for (let i = 0; i < sourceInfos.length; i++) {
        const sourceInfo = sourceInfos[i];
        if (
            sourceInfo.kind == 'videoinput' &&
            sourceInfo.facing == (isFront ? 'front' : 'environment')
        ) {
          videoSourceId = sourceInfo.deviceId;
        }
      }
      mediaDevices
          .getUserMedia({
            audio: true,
            video: {
              mandatory:{
                minWidth: 500,
                minHeight: 300,
                minFrameRate: 30
              },
              facingMode: isFront ? 'user' : 'environment',
              optional: videoSourceId ? [{sourceId: videoSourceId}] : [],
            }
          })
          .then((stream) => {
            console.log('=====call method======', stream);
            // Got stream!
            userStream.current = stream;
            setLocalStream(stream);
            callback();
          })
          .catch((error) => {
            console.log('error', error);
            // Log error
          });
    });
  };

  function gotRemoteStream(event, id) {
    let index = null;
    if(!realStreamRef1.current){
      realStreamRef1.current = event.stream;
      setRealStream1(event.stream);
      index = 1;
    } else if(!realStreamRef2.current){
      realStreamRef2.current = event.stream;
      setRealStream2(event.stream);
      index = 2;
    } else if(!realStreamRef3.current){
      realStreamRef3.current = event.stream;
      setRealStream3(event.stream);
      index = 3;
    }
    let newRemoteIndexes = remoteIndexes;
    newRemoteIndexes[id] = index;
    setRemoteIndexes(newRemoteIndexes);
  }

  function gotMessageFromServer(fromId, message) {

    //Parse the incoming signal
    var signal = JSON.parse(message)

    //Make sure it's not coming from yourself
    if(fromId != socketId) {

      if(signal.sdp){
        connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function() {
          if(signal.sdp.type == 'offer') {
            connections[fromId].createAnswer().then(function(description){
              connections[fromId].setLocalDescription(description).then(function() {
                socket.emit('signal', fromId, JSON.stringify({'sdp': connections[fromId].localDescription}));
              }).catch(e => console.log(e));
            }).catch(e => console.log(e));
          }
        }).catch(e => console.log(e));
      }

      if(signal.ice) {
        connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e));
      }
    }
  }

  return (
      <View style={GroupCallStyle.container}>
        <View style={GroupCallStyle.videoContainer}>
          <View style={[GroupCallStyle.videos, GroupCallStyle.localVideos]}>
            {localStream && (
                <RTCView
                    key={0}
                    zOrder={0}
                    streamURL={localStream && localStream.toURL()}
                    style={GroupCallStyle.localVideo}
                />
            )}
          </View>
          <ScrollView style={{backgroundColor: 'teal'}}>
              {realStream1 && (
                  <RTCView
                      key={1}
                      zOrder={0}
                      streamURL={realStream1 && realStream1.toURL()}
                      style={{ width: '100%', height: 200, marginTop: 8 }}
                  />
              )}
              {realStream2 && (
                  <RTCView
                      key={1}
                      zOrder={0}
                      streamURL={realStream2 && realStream2.toURL()}
                      style={{ width: '100%', height: 200, marginTop: 8 }}
                  />
              )}
              {realStream3 && (
                  <RTCView
                      key={1}
                      zOrder={0}
                      streamURL={realStream3 && realStream3.toURL()}
                      style={{ width: '100%', height: 200, marginTop: 8 }}
                  />
              )}
            {!realStream1 && !realStream2 && !realStream3 && !fullRoomFlag && (
                <View style={{padding: 15}}>
                  <Text style={{fontSize: 22, textAlign: 'center', color: 'white'}}>
                    Waiting for Peer connection ...
                  </Text>
                </View>
            )}
            {fullRoomFlag && (
                <View style={{padding: 15}}>
                  <Text style={{fontSize: 22, textAlign: 'center', color: 'white'}}>
                    FUll ROOM !!!!
                  </Text>
                </View>
            )}
          </ScrollView>

        </View>
      </View>
  );
}
