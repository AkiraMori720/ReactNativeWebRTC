import Socket from 'socket.io-client';
import {StyleSheet, View, Alert} from 'react-native';
import React, {useRef, useState, useEffect} from 'react';
import {Text} from 'react-native-paper';
import {Button} from 'react-native-paper';
import {TextInput} from 'react-native-paper';
import SOCKET from './screens/socket';
import {
  RTCView,
  RTCPeerConnection,
  RTCIceCandidate,
  mediaDevices,
} from 'react-native-webrtc';
// import {Text, View} from 'react-native';

const config = {
  iceServers: [
    {
      urls: ['stun:stun.l.google.com:19302'],
    },
  ],
};

const styles = StyleSheet.create({
  viewer: {
    flex: 1,
    display: 'flex',
    backgroundColor: '#4F4',
  },
  root: {
    backgroundColor: '#fff',
    flex: 1,
    padding: 20,
  },
  inputField: {
    marginBottom: 10,
    flexDirection: 'column',
  },
  videoContainer: {
    flex: 1,
    minHeight: 450,
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
    height: 400,
  },
  localVideo: {
    backgroundColor: '#f2f2f2',
    height: '100%',
    width: '100%',
  },
  remoteVideo: {
    backgroundColor: '#f2f2f2',
    height: '100%',
    width: '100%',
  },
});

// export default class App extends React.Component {

//   constructor() {
//       super();

//       this.state = {
//           echo: ''
//       };
//   }

//   componentDidMount() {
//       // var socket = new WebSocket('wss://echo.websocket.org/');
//       //var socket = new WebSocket('wss://localhost:1337/');
//       var socket = new WebSocket('http://192.168.1.4:1337/');
//       socket.onopen = () => socket.send(new Date().toGMTString());

//       socket.onmessage = ({data}) => {
//           this.setState({echo: data});
//           setTimeout(() => {
//               socket.send(new Date().toGMTString());
//           }, 1000);
//       }
//   }

//   render() {
//       return (
//           <View>
//               <Text>websocket echo: {this.state.echo}</Text>
//           </View>
//       );
//   }
// }

const App = () => {
  const peerRef = useRef();
  const otherUser = useRef();
  const userStream = useRef();
  const newUser = useRef();
  const peer = new RTCPeerConnection({
    iceServers: [
      {
        urls: 'stun:stun.l.google.com:19302',
      },
      {
        urls: 'stun:stun1.l.google.com:19302',
      },
      {
        urls: 'stun:stun2.l.google.com:19302',
      },
    ],
  });
  const onCall = () => {
    setCalling(true);

    connectedUser = callToUsername;
    console.log('Caling to', callToUsername);
    // create an offer

    yourConn.createOffer().then(offer => {
      yourConn.setLocalDescription(offer).then(() => {
        console.log('Sending Ofer');
        console.log(offer);
        send({
          type: 'offer',
          offer: offer,
        });
        // Send pc.localDescription to peer
      });
    });
  };
  const onFrontCamera = () => {
    setFrontCamera(!isFront);
    mediaDevices.enumerateDevices().then(sourceInfos => {
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
          videoType: 'front',
          video: {
            mandatory: {
              minWidth: 500, // Provide your own width, height and frame rate here
              minHeight: 300,
              minFrameRate: 30,
            },
            facingMode: isFront ? 'user' : 'environment',
            optional: videoSourceId ? [{sourceId: videoSourceId}] : [],
          },
        })
        .then(stream => {
          // Got stream!
          setLocalStream(stream);

          // setup stream listening
          // yourConn.addStream(stream);
        })
        .catch(error => {
          // Log error
        });
    });
    console.log('click event onFrontCamera');
  };
  // you have to keep the peer connections without re-rendering
  // every time a peer connects/disconnects
  const peerConnections = useRef(new Map());
  const [isFront, setFrontCamera] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const getUser = '123';
  //const [socket] = useState(Socket.connect('ws://8f9e54dd.ngrok.io')); // replace with your host machine's IP or public url
  const [socket] = useState(Socket.connect('ws://192.168.1.4:4001/')); // replace with your host machine's IP or public url
  const [socketActive, setSocketActive] = useState(false);
  useEffect(() => {
    socket.on('connect', () => {
      if (localStream) socket.emit('broadcaster');

      socket.on('watcher', async id => {
        const connectionBuffer = new RTCPeerConnection(config);

        localStream.getTracks.forEach(track =>
          connectionBuffer.addTrack(track, localStream),
        );

        connectionBuffer.onicecandidate = ({candidate}) => {
          if (candidate) socket.emit('candidate', id, candidate);
        };

        const localDescription = await connectionBuffer.createOffer();

        await connectionBuffer.setLocalDescription(localDescription);

        socket.emit('offer', id, connectionBuffer.localDescription);

        peerConnections.current.set(id, connectionBuffer);
      });

      socket.on('candidate', (id, candidate) => {
        const candidateBuffer = new RTCIceCandidate(candidate);
        const connectionBuffer = peerConnections.current.get(id);

        connectionBuffer.addIceCandidate(candidateBuffer);
      });

      socket.on('answer', (id, remoteOfferDescription) => {
        const connectionBuffer = peerConnections.current.get(id);

        connectionBuffer.setRemoteDescription(remoteOfferDescription);
      });

      socket.on('disconnectPeer', id => {
        peerConnections.current.get(id).close();
        peerConnections.current.delete(id);
      });
    });

    return () => {
      if (socket.connected) socket.close(); // close the socket if the view is unmounted
    };
  }, [socket, localStream]);

  /* useEffect(() => {
    if (!localStream) {
      (async () => {
        const availableDevices = await mediaDevices.enumerateDevices();
        const {deviceId: sourceId} = availableDevices.find(
          // once we get the stream we can just call .switchCamera() on the track to switch without re-negotiating
          // ref: https://github.com/react-native-webrtc/react-native-webrtc#mediastreamtrackprototype_switchcamera
          device => device.kind === 'videoinput' && device.facing === 'front',
        );

        const streamBuffer = await mediaDevices.getUserMedia({
          audio: true,
          video: {
            mandatory: {
              // Provide your own width, height and frame rate here
              minWidth: 100,
              minHeight: 100,
              height: 100,
              minFrameRate: 30,
            },
            facingMode: 'user',
            optional: [{sourceId}],
          },
        });

        setLocalStream(streamBuffer);
      })();
    }
  }, [localStream]); */

  useEffect(() => {
    SOCKET.otherUser(callUser);
    SOCKET.userJoined(userJoin);
    getLocalStreamDevice();
  }, []);
  const getLocalStreamDevice = () => {
    let isFront = false;
    mediaDevices.enumerateDevices().then(sourceInfos => {
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
            facingMode: isFront ? 'user' : 'environment',
            optional: videoSourceId ? [{sourceId: videoSourceId}] : [],
          },
          screen: true,
          oneway: true,
        })
        .then(stream => {
          // Got stream!
          userStream.current = stream;
          setLocalStream(stream);
          peer.addStream(stream);
          SOCKET.joinRoom(getUser.id);
          SOCKET.onOffer(handleRecieveCall);
          SOCKET.onIceCandidate(handleNewICECandidateMsg);
          SOCKET.onAnswer(handleAnswer);
        })
        .catch(error => {
          // Log error
        });
    });
  };

  const callUser = userID => {
    peerRef.current = createPeer(userID);
  };

  const createPeer = otherUser => {
    peer.onicecandidate = handleICECandidateEvent;
    peer.ontrack = handleTrackEvent;
    peer.onaddstream = handleRemoteStream;
    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(otherUser);
    return peer;
  };

  return (
    <View style={styles.root}>
      <View style={styles.inputField}>
        <TextInput
          label="Enter Friends Id"
          mode="outlined"
          style={{marginBottom: 7}}
          onChangeText={text => setCallToUsername(text)}
        />
        <Button
          mode="contained"
          onPress={onCall}
          //  loading={calling}
          //   style={styles.btn}
          contentStyle={styles.btnContent}
          disabled={!(socketActive && userId.length > 0)}>
          Call
        </Button>
        <Button onPress={onFrontCamera}>FrontCamera</Button>
      </View>

      <View style={styles.videoContainer}>
        <View style={[styles.videos, styles.localVideos]}>
          <Text>Your Video</Text>
          <RTCView streamURL={localStream?.toURL()} style={styles.localVideo} />
        </View>
        <View style={[styles.videos, styles.remoteVideos]}>
          <Text>Friends Video</Text>
          {/* <RTCView
            streamURL={localStream?.toURL()}
            style={styles.remoteVideo}
          /> */}
        </View>
      </View>
    </View>
  );

  //return <RTCView streamURL={stream?.toURL()} style={styles.viewer} />;
};

export default App;
// import React from 'react';
// import {NavigationContainer} from '@react-navigation/native';
// import {createStackNavigator} from '@react-navigation/stack';

// import LoginScreen from './screens/LoginScreen';
// import CallScreen from './screens/CallScreen';
// import {SafeAreaView} from 'react-native-safe-area-context';

// const Stack = createStackNavigator();

// const App = () => {
//   return (
//     <NavigationContainer>
//       <Stack.Navigator>
//         <Stack.Screen
//           name="Login"
//           component={LoginScreen}
//           options={{headerShown: false}}
//         />
//         <Stack.Screen name="Call" component={CallScreen} />
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// };

// export default App;
