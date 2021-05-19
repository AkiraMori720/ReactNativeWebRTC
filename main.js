"use strict";

import React, { Component, useRef } from "react";
import {
  AppRegistry,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
  TextInput,
  FlatList,
  Platform,
} from "react-native";

import io from "socket.io-client";

// const socket = io.connect("https://react-native-webrtc.herokuapp.com", {
//   transports: ["websocket"],
// });
const socket = io.connect("http://185.95.213.20:3005/", {
  transports: ["websocket"],
});

import {
  RTCPeerConnection,
  RTCMediaStream,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  MediaStreamTrack,
  mediaDevices,
} from "react-native-webrtc";

//const configuration = { iceServers: [{ url: "stun:stun.l.google.com:19302" }] };

const configuration = {
  iceServers: [
    {
        urls: ["stun:eu-turn4.xirsys.com"]
    },
    {
        username: "ml0jh0qMKZKd9P_9C0UIBY2G0nSQMCFBUXGlk6IXDJf8G2uiCymg9WwbEJTMwVeiAAAAAF2__hNSaW5vbGVl",
        credential: "4dd454a6-feee-11e9-b185-6adcafebbb45",
        urls: [
            "turn:eu-turn4.xirsys.com:80?transport=udp",
            "turn:eu-turn4.xirsys.com:3478?transport=tcp"
        ]
    }
]
  // iceServers: [
  //   {
  //     urls: 'stun:stun.l.google.com:19302',
  //   },
  //   {
  //     urls: 'stun:stun1.l.google.com:19302',
  //   },
  //   {
  //     urls: 'stun:stun2.l.google.com:19302',
  //   },
  // ],
};

const pcPeers = {};
let localStream;
var socketId;
function getLocalStream(isFront, callback) {
  let videoSourceId;

  // on android, you don't have to specify sourceId manually, just use facingMode
  // uncomment it if you want to specify
  if (Platform.OS === "ios") {
    mediaDevices.enumerateDevices().then((sourceInfos) => {
      for (let i = 0; i < sourceInfos.length; i++) {
        const sourceInfo = sourceInfos[i];
        if (
          sourceInfo.kind == "videoinput" &&
          sourceInfo.facing == (isFront ? "front" : "environment")
        ) {
          videoSourceId = sourceInfo.deviceId;
        }
      }
    });
    // MediaStreamTrack.getSources((sourceInfos) => {
    //   console.log("sourceInfos: ", sourceInfos);

    //   for (const i = 0; i < sourceInfos.length; i++) {
    //     const sourceInfo = sourceInfos[i];
    //     if (
    //       sourceInfo.kind == "video" &&
    //       sourceInfo.facing == (isFront ? "front" : "back")
    //     ) {
    //       videoSourceId = sourceInfo.id;
    //     }
    //   }
    // });
  } else {
    mediaDevices.enumerateDevices().then((sourceInfos) => {
      for (let i = 0; i < sourceInfos.length; i++) {
        const sourceInfo = sourceInfos[i];
        if (
          sourceInfo.kind == "videoinput" &&
          sourceInfo.facing == (isFront ? "front" : "environment")
        ) {
          videoSourceId = sourceInfo.deviceId;
        }
      }
    });
  }

  mediaDevices
    .getUserMedia({
      audio: true,
      video: {
        facingMode: isFront ? "user" : "environment",
        optional: videoSourceId ? [{ sourceId: videoSourceId }] : [],
      },
      screen: true,
      oneway: true,
    })
    .then((stream) => {
      console.log("=====callMethod===userLoginId====" + userLoginId);
      // Got stream!
      callback(stream);
      //  }, 1000);
    })
    .catch((error) => {
      // Log error
    });
  mediaDevices
    .getUserMedia({
      audio: true,
      video: {
        mandatory: {
          minWidth: 640, // Provide your own width, height and frame rate here
          minHeight: 360,
          minFrameRate: 30,
        },
        facingMode: isFront ? "user" : "environment",
        optional: videoSourceId ? [{ sourceId: videoSourceId }] : [],
      },
    })
    .then((stream) => {
      console.log("getUserMedia success", stream);
      callback(stream);
    }, logError);
}

function join(roomID) {
  socket.emit("join", roomID, function (socketIds) {
    //console.log("=====call method===emit======join====" + socketIds);
    // for (const i in socketIds) {
    //   const socketId = socketIds[i];
    //   createPC(socketId, true);
    // }
  });

  socket.on("join", function (socketIds) {
    console.log("======callMethod=======on======join===========", socketIds);
    for (const i in socketIds) {
      const partnerName = socketIds[i];
      if(partnerName != socketId) {
        createPC(partnerName, true);
      } else {
        createPC(partnerName, false);
      }
      
    }
  });
}
const pc = [RTCPeerConnection()];

function createPC(partnerName, isOffer) {
  pc[partnerName] = new RTCPeerConnection(configuration);
  pcPeers[partnerName] = pc;
  pc[partnerName].onicecandidate = async function (event) {
    console.log("=====callMethod=========onicecandidate", event.candidate);
    if (event.candidate) {
      await socket.emit("exchange", {
        sender: socketId,
        to: partnerName,
        candidate: event.candidate,
      });
    }
  };

  if(isOffer) {
    pc[partnerName].onnegotiationneeded = function () {
      console.log("=====callMethod=========onnegotiationneeded");
        createOffer();
    };
  }
  
  async function createOffer() {
    console.log("=====callMethod=========createOffer==140");
    try {
      let offer = await pc[partnerName].createOffer();

      await pc[partnerName].setLocalDescription(offer);

      socket.emit("exchange", {
        sender: socketId,
        to: partnerName,
        sdp: pc[partnerName].localDescription,
      });

      console.log("=====callMethod=========offer" + offer);
      // pc[socketId].createOffer(function (desc) {
      //   console.log("=====callMethod=====createOffer", desc);
      //   pc[socketId].setLocalDescription(
      //     desc,
      //     function () {
      //       console.log(
      //         "=====callMethod=========setLocalDescription",
      //         pc[socketId].localDescription
      //       );
      //       socket.emit("exchange", {
      //         to: socketId,
      //         sdp: pc[socketId].localDescription,
      //       });
      //     },
      //     logError
      //   );
      // }, logError);
    } catch (e) {
      console.log("=====callMethod=========createOffer error message", e);
    }
  }
  pc[partnerName].oniceconnectionstatechange = function (event) {
    console.log(
      "======callMethod=============oniceconnectionstatechange",
      event.target.iceConnectionState
    );
    if (event.target.iceConnectionState === "completed") {
      setTimeout(() => {
        getStats();
      }, 1000);
    }
    if (event.target.iceConnectionState === "connected") {
      createDataChannel();
    }
  };
  pc[partnerName].onsignalingstatechange = function (event) {
    console.log(
      "======callMethod=============onsignalingstatechange",
      event.target.signalingState
    );
  };

  pc[partnerName].onaddstream = function (event) {
    console.log("======callMethod=============onaddstream", event.stream);

    container.setState({ info: "One peer join!" });

    const remoteList = container.state.remoteList;
    remoteList[partnerName] = event.stream.toURL();
    container.setState({ remoteList: remoteList });
  };
  pc[partnerName].onremovestream = function (event) {
    console.log("======callMethod=============onremovestream", event.stream);
  };

  pc[partnerName].addStream(localStream);
  function createDataChannel() {
    if (pc[partnerName].textDataChannel) {
      return;
    }
    const dataChannel = pc[partnerName].createDataChannel("text");

    dataChannel.onerror = function (error) {
      console.log("======callMethod=============dataChannel.onerror", error);
    };

    dataChannel.onmessage = function (event) {
      console.log(
        "======callMethod=============dataChannel.onmessage:",
        event.data
      );
      container.receiveTextData({ user: socketId, message: event.data });
    };

    dataChannel.onopen = function () {
      console.log("======callMethod=============dataChannel.onopen");
      container.setState({ textRoomConnected: true });
    };

    dataChannel.onclose = function () {
      console.log("======callMethod=============dataChannel.onclose");
    };

    pc[partnerName].textDataChannel = dataChannel;
  }
  return pc[partnerName];
}

async function exchange(data) {
  console.log("======callMethod=============exchange sdp", data);
  const fromId = data.from;
  let pc;
  if (fromId in pcPeers) {
    pc = pcPeers[fromId];
  } else {
    pc = createPC(fromId, false);
  }

  if (data.sdp) {
    console.log("======callMethod=============exchange sdp", data);
    if (data.sdp.type == "offer") {
      console.log("======callMethod=============exchange sdp offer", data);
      const peerReference = useRef();
      peerReference.current =  pc[fromId];
      await peerReference.current.setRemoteDescription( new RTCSessionDescription( data.sdp ) );
      //await pc[fromId].setRemoteDescription( new RTCSessionDescription( data.sdp ) );
    } else if(data.sdp.type == "answer") {
      console.log("======callMethod=============exchange sdp answer", data);
      const peerReference = useRef();
      peerReference.current =  pc[fromId];
      await peerReference.current.setRemoteDescription( new RTCSessionDescription( data.sdp ) );
      //await pc[fromId].setRemoteDescription( new RTCSessionDescription( data.sdp ) );
    }
    
    // pc[fromId].setRemoteDescription(
    //   new RTCSessionDescription(data.sdp),
    //   function () {
    //     if (pc[fromId].remoteDescription.type == "offer")
    //       pc[fromId].createAnswer(function (desc) {
    //         console.log("createAnswer", desc);
    //         pc[fromId].setLocalDescription(
    //           desc,
    //           function () {
    //             console.log("setLocalDescription", pc[fromId].localDescription);
    //             socket.emit("exchange", {
    //               sender: socketId,
    //               to: fromId,
    //               sdp: pc[fromId].localDescription,
    //             });
    //           },
    //           logError
    //         );
    //       }, logError);
    //   },
    //   logError
    // );
  } else {
    console.log(
      "======callMethod=============exchange data.candidate",
      data.candidate
    );
    if (data.candidate != null) {
      console.log("data.candidate====>");
      await pc[fromId].addIceCandidate(new RTCIceCandidate(data.candidate));
    } else {
    }
  }
}

function leave(socketId) {
  console.log("======callMethod=============leave", socketId);
  const pc = pcPeers[socketId];
  const viewIndex = pc.viewIndex;
  pc.close();
  delete pcPeers[socketId];

  const remoteList = container.state.remoteList;
  delete remoteList[socketId];
  container.setState({ remoteList: remoteList });
  container.setState({ info: "One peer leave!" });
}

socket.on("exchange", function (data) {
  console.log("======callMethod=============exchange==data======", data);
  exchange(data);
});
socket.on("leave", function (socketId) {
  leave(socketId);
});

socket.on("connect", function (data) {
  socketId = socket.io.engine.id;
  console.log(
    "======callMethod=============connect==socketId=========",
    socketId
  );
  getLocalStream(true, function (stream) {
    localStream = stream;
    container.setState({ selfViewSrc: stream.toURL() });
    container.setState({
      status: "ready",
      info: "Please enter or create room ID",
    });
  });
});

function logError(error) {
  console.log("======callMethod=============logError", error);
}

function mapHash(hash, func) {
  const array = [];
  for (const key in hash) {
    const obj = hash[key];
    array.push(func(obj, key));
  }
  return array;
}

function getStats() {
  const pc = pcPeers[Object.keys(pcPeers)[0]];
  if (
    pc.getRemoteStreams()[0] &&
    pc.getRemoteStreams()[0].getAudioTracks()[0]
  ) {
    const track = pc.getRemoteStreams()[0].getAudioTracks()[0];
    console.log("======callMethod=====track", track);
    pc.getStats(
      track,
      function (report) {
        console.log("getStats report", report);
      },
      logError
    );
  }
}

let container;

class App extends Component {
  constructor(props) {
    console.log("=======constructor=============");
    super(props);
    this.state = {
      info: "Initializing",
      status: "init",
      roomID: "",
      isFront: true,
      selfViewSrc: null,
      remoteList: {},
      textRoomConnected: false,
      textRoomData: [],
      textRoomValue: "",
    };
    container = this;
    container = this;
    this._press = this._press.bind(this);
    this._switchVideoType = this._switchVideoType.bind(this);
  }

  _press(event) {
    //this.refs.roomID.blur();
    this.setState({ status: "connect", info: "Connecting socket" });
    join(this.state.roomID);
  }
  _switchVideoType() {
    const isFront = !this.state.isFront;
    this.setState({ isFront });
    getLocalStream(isFront, function (stream) {
      if (localStream) {
        for (const id in pcPeers) {
          const pc = pcPeers[id];
          pc && pc.removeStream(localStream);
        }
        localStream.release();
      }
      localStream = stream;
      container.setState({ selfViewSrc: stream.toURL() });

      for (const id in pcPeers) {
        const pc = pcPeers[id];
        pc && pc.addStream(localStream);
      }
    });
  }
  receiveTextData(data) {
    const textRoomData = this.state.textRoomData.slice();
    textRoomData.push(data);
    this.setState({ textRoomData, textRoomValue: "" });
  }
  _textRoomPress() {
    if (!this.state.textRoomValue) {
      return;
    }
    const textRoomData = this.state.textRoomData.slice();
    textRoomData.push({ user: "Me", message: this.state.textRoomValue });
    for (const key in pcPeers) {
      const pc = pcPeers[key];
      pc.textDataChannel.send(this.state.textRoomValue);
    }
    this.setState({ textRoomData, textRoomValue: "" });
  }
  _renderTextRoom() {
    return (
      <View style={styles.listViewContainer}>
        {/* <FlatList
          scrollEnabled={true}
          data={this.ds.cloneWithRows(this.state.textRoomData)}
          horizontal={true}
          renderItem={({ item, index }) => {
            return (
              <TouchableOpacity
                key={index}
                // onPress={() => onSelectedJoinUser(index)}
              >
                <Text>{`${item.user}: ${item.message}`}</Text>
              </TouchableOpacity>
            );
          }}
        /> */}
        <TextInput
          style={{
            width: 200,
            height: 30,
            borderColor: "gray",
            borderWidth: 1,
          }}
          onChangeText={(value) => this.setState({ textRoomValue: value })}
          value={this.state.textRoomValue}
        />
        <TouchableHighlight onPress={this._textRoomPress}>
          <Text>Send</Text>
        </TouchableHighlight>
      </View>
    );
  }
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>{this.state.info}</Text>
        {this.state.textRoomConnected && this._renderTextRoom()}
        <View style={{ flexDirection: "row" }}>
          <Text>
            {this.state.isFront ? "Use front camera" : "Use back camera"}
          </Text>
          <TouchableHighlight
            style={{ borderWidth: 1, borderColor: "black" }}
            onPress={this._switchVideoType}
          >
            <Text>Switch camera</Text>
          </TouchableHighlight>
        </View>
        {this.state.status == "ready" ? (
          <View>
            <TextInput
              ref="roomID"
              autoCorrect={false}
              style={{
                width: 200,
                height: 40,
                borderColor: "gray",
                borderWidth: 1,
              }}
              onChangeText={(text) => this.setState({ roomID: text })}
              value={this.state.roomID}
            />
            <TouchableHighlight onPress={this._press}>
              <Text>Enter room</Text>
            </TouchableHighlight>
          </View>
        ) : null}
        <RTCView streamURL={this.state.selfViewSrc} style={styles.selfView} />
        {mapHash(this.state.remoteList, function (remote, index) {
          return (
            <RTCView key={index} streamURL={remote} style={styles.remoteView} />
          );
        })}
      </View>
    );
  }
}

export default App;

const styles = StyleSheet.create({
  selfView: {
    width: 200,
    height: 150,
  },
  remoteView: {
    width: 200,
    height: 150,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#F5FCFF",
  },
  welcome: {
    fontSize: 20,
    textAlign: "center",
    margin: 10,
  },
  listViewContainer: {
    height: 150,
  },
});

//AppRegistry.registerComponent("RCTWebRTCDemo", () => RCTWebRTCDemo);
