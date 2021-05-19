import React, {useState, useEffect, useRef} from 'react';
import {View, Text, ScrollView, FlatList} from 'react-native';
import {GroupCallStyle} from '../style';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  mediaDevices,
} from 'react-native-webrtc';
import {Button} from 'react-native-paper';
import AsyncStorage from '@react-native-community/async-storage';
import io from 'socket.io-client';

export default function CallScreen({navigation, ...props}) {
  let varUserId = null;
  var socketId;
  const [userId, setUserId] = useState('');
  const [userList, setUserList] = useState([]);
  const [roomList, setRoomList] = useState([]);
  const [roomId, setRoomId] = useState(null);
  const [remoteIndexes, setRemoteIndexes] = useState({});
  const [connections, setConnections] = useState({});
  const [realStream1, setRealStream1] = useState(null);
  const [realStream2, setRealStream2] = useState(null);
  const [realStream3, setRealStream3] = useState(null);
  const [callState, setCallState] = useState('wait');
  const [callSocketId, setCallSocketId] = useState(null);
  const [beCalled, setBeCalled] = useState(false);
  const [callingUserId, setCallingUserId] = useState(null);
  const [callingSocketId, setCallingSocketId] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [message, setMessage] = useState(null);
  const [muted, setMuted] = useState(false);
  const [fullRoomFlag, setFullRoomFlag] = useState(false);

  const userStream = useRef();
  const realStreamRef1 = useRef();
  const realStreamRef2 = useRef();
  const realStreamRef3 = useRef();
  const socketRef = useRef();
  const roomIdRef = useRef();

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
    socketRef.current.emit('user-leave', userId);

    setLocalStream(null);
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
    setCallState('wait');

    AsyncStorage.removeItem('userId').then((res) => {
      navigation.push('Login');
    });
  };

  useEffect(() => {
    navigation.setOptions({
      title: 'Your ID - ' + userId,
      headerRight: () => (
          <Button mode="text" onPress={onLogout} style={{paddingRight: 10}}>
            Logout
          </Button>
      ),
    });
  }, [userId]);

  useEffect(() => {
      AsyncStorage.getItem('userId').then((id) => {
        if (id) {
          console.log('========userLoginId=============', id);
          setUserId(id);
          varUserId = id;
          getLocalStreamDevice(connectSocket);
        } else {
          setUserId('');
          navigation.push('Login');
        }
      });
  }, []);

  let socket = null;
  async function connectSocket() {
    socket = await io.connect('http://192.168.31.95:3000/');
    socketRef.current = socket;

    socket.on('signal', gotMessageFromServer);

    socket.on('connect', async () => {

      socketId = socket.id;
      console.log('====socket connected===', socketId);
      socket.emit('single-join', varUserId);

      socket.on('user-list', function(list, room_list){
        console.log('====user list===', list, room_list);
        let otherList = list.filter(item => item.userId !== varUserId);
        let rooms = Object.keys(room_list);
        setUserList(otherList);
        setRoomList(rooms);
      });
      socket.on('room-list', function(room_list){
        console.log('room-list', room_list);
        let rooms = Object.keys(room_list);
        setRoomList(rooms);
      });
      socket.on('end-call', function(){
        setBeCalled(false);
        setCallingUserId(null);
        setCallingSocketId(null);
        setMessage(null);
      })
      socket.on('user-call', function(userId, socketId){
        console.log('call me from ', userId, socketId);
        setBeCalled(true);
        setCallingUserId(userId);
        setCallingSocketId(socketId);
      });
      socket.on('user-reject', function(userId, socketId){
        console.log('call reject from ', userId, socketId);
        setCallState('wait');
        setMessage("User " + userId + " rejected !");
      });
      socket.on('full-room', function(){
        setFullRoomFlag(true);
        setRoomId(null);
        roomIdRef.current = null;
      });
      socket.on('user-left', function(rId, id){
        console.log('====user left====', rId, id);

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

          let peer = connections[id];
          if(peer){
            peer.onicecandidate = null;
            peer.onaddstream = null;
            peer.close();
          }
        }
        if(!Object.keys(remoteIndexes).length){
          socketRef.current.emit('user-leave', rId);
          setCallState('wait');
          setCallingUserId(null);
          setCallingSocketId(null);
          setRoomId(null);
          roomIdRef.current = null;
          setConnections({});
        }
      });
      socket.on('user-joined', function(rId, id, clients){
        console.log('join: ', rId, id, clients, connections);
        setCallState('connect');
        if(!roomId){
          setRoomId(rId);
        }

        clients.forEach(function(socketListId) {


          if (!connections[socketListId]) {
            //Wait for their ice candidate
            let newConnections = connections;
            newConnections[socketListId] = new RTCPeerConnection(peerConnectionConfig);

            console.log('connections', newConnections, socketListId);
            //Wait for their video stream
            newConnections[socketListId].onicecandidate = function (event) {
              if (event.candidate != null) {
                console.log('SENDING ICE');
                socket.emit('signal', socketListId, JSON.stringify({'ice': event.candidate}));
              }

            }
            newConnections[socketListId].onaddstream = function (event) {
              gotRemoteStream(event, socketListId)
            }

            //Add the local video stream
            newConnections[socketListId].addStream(userStream.current);

            console.log('connection', newConnections, socketListId);
            setConnections(newConnections);
          }
        });

        //Create an offer to connect with your local description
        if(connections[id]){
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

  const onCall = ({userId, socketId}) => {
    setCallState('calling');
    console.log('socketId', socketId);
    setCallSocketId(socketId);
    socketRef.current.emit('call', userId, socketId);
  }
  const onEndCall = ()=> {
    setCallState('wait');
    socketRef.current.emit('end-call', callSocketId);
    setCallSocketId(null);
  }
  const onJoin = (rid) => {
    setRoomId(rid);
    roomIdRef.current = rid;
    socketRef.current.emit('join', rid);
  }
  const onDisconnect = () =>{
    socketRef.current.emit('user-leave', roomId);

    setRealStream1(null);
    setRealStream2(null);
    setRealStream3(null);
    setBeCalled(false);
    setCallingUserId(null);
    setCallingSocketId(null);

    Object.keys(connections).forEach(key => {
      let peer = connections[key];
      peer.onicecandidate = null;
      peer.onaddstream = null;
      peer.close();
    });

    setConnections({});
    setCallState('wait');
  }
  const onSwithCamera = () => {
    localStream.getVideoTracks().forEach( (track) =>{
      track._switchCamera();
    });
  }
  const onMute = () => {
    setMuted(!muted);
    localStream.getAudioTracks().forEach( (track) =>{
      track.enabled = muted;
    });
    if(realStream1){
      realStream1.getAudioTracks().forEach( (track) =>{
        track.enabled = muted;
      });
    }
    if(realStream2) {
      realStream2.getAudioTracks().forEach((track) => {
        track.enabled = muted;
      });
    }
    if(realStream3) {
      realStream3.getAudioTracks().forEach((track) => {
        track.enabled = muted;
      });
    }
  }
  const onReceive = (userId, socketId) => {
    setCallState('wait');
    setBeCalled(false);
    console.log('receive', socketId);
    socketRef.current.emit('receive', userId, socketId);
  }
  const onReject = (userId, socketId) => {
    socketRef.current.emit('reject', userId, socketId);
    setBeCalled(false);
    setCallingUserId(null);
    setCallingSocketId(null);
    console.log('reject', socketId);
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
          {
            message?
                <View style={{color: 'red', height: 50}}>
                  <Text>{message}</Text>
                </View>
                :
                null
          }
          {
            beCalled ?
                <View style={{backgroundColor: 'teal', flexDirection:'row', height: 50,paddingVertical: 4}}>
                  <Text style={{ color: 'white', width: 140 }}>{callingUserId} is calling you</Text>
                  <Button
                      mode="contained"
                      style={{ width: 100, marginRight: 8}}
                      onPress={ () => onReceive(callingUserId, callingSocketId)}>
                    Receive
                  </Button>
                  <Button
                      mode="contained"
                      style={{ width: 100}}
                      onPress={ () => onReject(callingUserId, callingSocketId)}>
                    Reject
                  </Button>
                </View>
                : null
          }
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
          <View style={{ flexDirection: "row", justifyContent:"center", height: 200, width: "100%" }}>
            {realStream1 && (
                <RTCView
                    key={1}
                    zOrder={0}
                    streamURL={realStream1 && realStream1.toURL()}
                    style={{ marginTop: 8, height: 200, width:'30%' }}
                />
            )}
            {realStream2 && (
                <RTCView
                    key={2}
                    zOrder={0}
                    streamURL={realStream2 && realStream2.toURL()}
                    style={{ marginTop: 8, height: 200,width:'30%' }}
                />
            )}
            {realStream3 && (
                <RTCView
                    key={3}
                    zOrder={0}
                    streamURL={realStream3 && realStream3.toURL()}
                    style={{ marginTop: 8, height: 200, width:'30%' }}
                />
            )}
          </View>
          <View style={{backgroundColor: 'teal', flex: 1, height: 300}}>
            { callState ==="wait" &&
            <ScrollView>
              <FlatList
                  data={userList}
                  renderItem={ ({item, index}) => (
                      <View style={{ flex: 1, flexDirection: 'row', paddingVertical: 8}}>
                        <Text style={{ color: 'white', width: 250, marginLeft: 8 }}>{item.userId}</Text>
                        <Button
                            mode="contained"
                            style={{ width: 100}}
                            onPress={ () => onCall(item)}>
                          Call
                        </Button>
                      </View>
                  )}/>
              <Text style={{fontSize: 22, width: '100%', color: 'black'}}>Rooms</Text>
              {fullRoomFlag && (
                  <View style={{padding: 15}}>
                    <Text style={{fontSize: 22, textAlign: 'center', color: 'white'}}>
                      FUll ROOM !!!!
                    </Text>
                  </View>
              )}
              <FlatList
                  data={roomList}
                  renderItem={ ({item, index}) => (
                      <View style={{ flex: 1, flexDirection: 'row', paddingVertical: 8}}>
                        <Text style={{ color: 'white', width: 250, marginLeft: 8 }}>{item}</Text>
                        <Button
                            mode="contained"
                            style={{ width: 100}}
                            onPress={ () => onJoin(item)}>
                          Join
                        </Button>
                      </View>
                  )}/>
            </ScrollView>
            }
            {callState === "calling" &&
              <View style={{padding: 15, flexDirection: 'row'}}>
                <Text style={{fontSize: 22, width: 150, color: 'white'}}>
                  Calling ...
                </Text>
                <Button
                    mode="contained"
                    style={{width: 100}}
                    onPress={() => onEndCall()}>
                  End
                </Button>
              </View>
              }
            {callState === "connect" &&
            <View style={{padding: 15, flexDirection: 'row'}}>
              <Button
                  mode="contained"
                  style={{width: 100, marginRight: 8}}
                  onPress={() => onDisconnect()}>
                End
              </Button>
              <Button
                  mode="contained"
                  style={{width: 100, marginRight: 8}}
                  onPress={() => onSwithCamera()}>
                switch
              </Button>
              <Button
                  mode="contained"
                  style={{width: 100}}
                  onPress={() => onMute()}>
                {muted?'UnMute':'Mute'}
              </Button>
            </View>
            }
          </View>
        </View>
      </View>
  );
}
