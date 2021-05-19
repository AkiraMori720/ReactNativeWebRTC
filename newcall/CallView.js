import React, {useState, useEffect, useRef} from 'react';
import {View, Text, StatusBar, TouchableOpacity, ScrollView, FlatList} from 'react-native';
import {
    RTCView,
    mediaDevices, RTCSessionDescription, RTCIceCandidate, RTCPeerConnection,
} from 'react-native-webrtc';
import Video from "react-native-video";

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Octicons from 'react-native-vector-icons/Octicons';
import AntDesign from 'react-native-vector-icons/AntDesign';

import webRTCSdk, {
    EVENT_ROOM_PARTNER_LIST,
    EVENT_ROOM_USERS,
    EVENT_SIGNAL, EVENT_STOP_CALL,
    EVENT_USER_JOIN,
    EVENT_USER_LEFT,
    EVENT_USER_REJECT,
    peerConnectionConfig
} from "./sdk";
import {Button} from "react-native-paper";
import InCallManager from "react-native-incall-manager";

const styles = {
    container: {
        flex: 1,
        position: 'relative'
    },
    localVideos: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    localVideo: {
        width: '120%',
        height: '120%'
    },
    remoteVideos: {
        position: 'absolute',
        flexDirection: "row",
        justifyContent:"flex-end",
        top: '60%',
        height: 150,
        width: "100%"
    },
    remoteContainer:{

    },
    remoteBtnText:{
        textAlign: 'center',
        width: 16,
        height: 16,
        padding: 4,
        borderRadius: 8
    },
    remoteVideo: {
        height: 140,
        width: 110,
    },
    stateContainer: {
        position: 'absolute',
        width: '100%',
        top: '46%'
    },
    buttonContainer: {
        position: 'absolute',
        top: '86%',
        flex: 1,
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center'
    },
    btn: {
        width: 100,
        marginVertical: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnText: {
        textAlign: 'center',
        width: 54,
        height: 54,
        padding: 13,
        borderRadius: 27
    },
    muteIcon: {
        backgroundColor: 'white',
    },
    endCallIcon: {
        backgroundColor: 'red',
    },
    receiveCallIcon: {
        backgroundColor: 'green',
    },
    switchIcon: {
        backgroundColor: 'white',
    },
    userText: {
        color: 'white',
        textAlign: 'center'
    },
    addPartnerContainer: {
        position: 'absolute',
        top: '5%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        width: '100%'
    },
    ring: {
        width: 0,
        height: 0,
    }
}

const CALL_STATUS_START = "callStart";
const CALL_STATUS_END = "callEnd";
const CALL_STATUS_ENTERED_ROOM = "enteredRoom";
const CALL_STATUS_VIDEO_MUTED = "videoMuted";
const CALL_STATUS_VIDEO_UNMUTED = "videoUnmuted";

export default function CallScreen({navigation, route, ...props}) {
    const userId = route.params.userId??null;
    const receiverId = route.params.receiverId??null;
    const callerId = route.params.callerId??null;
    const rid = route.params.rid??null;
    const room = route.params.room??null;

    console.log('params', rid, receiverId, userId, room);

    const [roomId, setRoomId] = useState(null);
    const [roomPass, setRoomPass] = useState(null);
    const [remoteIndexes, setRemoteIndexes] = useState({});
    const [remoteUsers, setRemoteUsers] = useState([]);
    const [connections, setConnections] = useState({});
    const [realStream1, setRealStream1] = useState(null);
    const [realStream2, setRealStream2] = useState(null);
    const [realStream3, setRealStream3] = useState(null);
    const [callState, setCallState] = useState('');
    const [localStream, setLocalStream] = useState(null);
    const [activeStream, setActiveStream] = useState(0);
    const [muted, setMuted] = useState(false);
    const [openPartnerList, setOpenPartnerList] = useState(false);
    const [partnerList, setPartnerList] = useState([]);

    const userStream = useRef();
    const realStreamRef1 = useRef();
    const realStreamRef2 = useRef();
    const realStreamRef3 = useRef();
    let varRoomId = null;

    useEffect(() => {
        getLocalStreamDevice(onInit);
    }, []);

    const onInit = async () => {
        try {
            InCallManager.start({media: 'audio'});
            InCallManager.setForceSpeakerphoneOn(true);
            InCallManager.setSpeakerphoneOn(true);
        } catch (err) {
            console.log('InApp Caller ---------------------->', err);
        }

        console.log('onInit Call +++++++++++++++++++');
        webRTCSdk.setEventListener(EVENT_USER_JOIN, onUserJoined);
        webRTCSdk.setEventListener(EVENT_SIGNAL, gotMessageFromServer);
        webRTCSdk.setEventListener(EVENT_USER_REJECT, onReject);
        webRTCSdk.setEventListener(EVENT_USER_LEFT, onLeft);
        webRTCSdk.setEventListener(EVENT_STOP_CALL, onStopCall);
        webRTCSdk.setEventListener(EVENT_ROOM_USERS, onRoomUsers);
        webRTCSdk.setEventListener(EVENT_ROOM_PARTNER_LIST, onPartnerList);
        // Join Room
        if(rid){
            console.log('==== Join Room ====');
            setCallState('join');
            webRTCSdk.join(rid, userId);
            setCallStatus(rid, CALL_STATUS_ENTERED_ROOM, "");

        } else if(receiverId) {  // Call User
            console.log('==== Call ====', userId, receiverId);
            setCallState('call');
            webRTCSdk.call(userId, receiverId);

        } else if(callerId){   // Receive Call
            console.log('==== Receive Call ====', userId,  callerId);
            setCallState('receive');
        }
    }

    const setCallStatus = (rid, status, additionals) => {
        let params = {
            token: "myToken_1234",
            client_id: userId,
            type: status,
            msg:{
                room_id: rid,
                additionals: additionals
            }
        }
        webRTCSdk.callStatus(params);
    }

    const onDisconnect = () =>{
        if(callState === 'matching'){
          return;
        } else if(callState === 'call'){
            webRTCSdk.stopCall(receiverId);
        } else if(callState === 'receive'){
            webRTCSdk.reject(userId, callerId);
        } else {
            webRTCSdk.leave(roomId, userId);
        }

        setRealStream1(null);
        setRealStream2(null);
        setRealStream3(null);
        setCallStatus(roomId, CALL_STATUS_END, "");

        exitCall();
    }

    const onStopCall = () => {
        exitCall();
    }

    const onRoomUsers = (rid, users) => {
        console.log('==== room users ====', rid, users);
        if(varRoomId === rid){
            let newRemoteUsers = remoteUsers;
            users.forEach(({userId, socketId, muted}) => {
                let index =  remoteIndexes[socketId];
                if(index){
                    newRemoteUsers[index - 1] = {userId, muted};
                }
            });
            setRemoteUsers([...newRemoteUsers]);
            console.log('=== set remote users ===', newRemoteUsers);
        }
    }

    const onPartnerList = (rid, partnerList) => {
        if(varRoomId === rid){
            console.log('==== partner_list ====', partnerList);
            setPartnerList(partnerList);
        }
    }

    const onReceive = () => {

        // todo @@@
        // let token = createToken(TOKEN_LENGTH);
        // let params = {
        //   token: token.toString(),
        //   client_id: userId.toString(),
        //   partner_id: cuid.toString(),
        //   forceNewRoom: true
        // };

        let params = {
            token: "myToken_1234",
            client_id: "cli_1234",
            partner_id: "par_1234",
            forceNewRoom: true
        }

        setCallState("matching");

        webRTCSdk.authBeforeCall(params, (response) => {
            console.log('authBeforCall', response);
            let room = response;
            webRTCSdk.receive(userId, callerId, room);
            setCallStatus(room.room_id, CALL_STATUS_START, "");
        }, () => {
            exitCall();
            webRTCSdk.reject(userId, callerId);
        })
    }

    const exitCall = () => {
        closeConnections();
        webRTCSdk.setEventListener(EVENT_USER_JOIN, ()=>{});
        webRTCSdk.setEventListener(EVENT_SIGNAL, ()=>{});
        webRTCSdk.setEventListener(EVENT_USER_REJECT, ()=>{});
        webRTCSdk.setEventListener(EVENT_USER_LEFT, ()=>{});
        webRTCSdk.setEventListener(EVENT_STOP_CALL, ()=>{});
        webRTCSdk.setEventListener(EVENT_ROOM_USERS, ()=>{});
        webRTCSdk.setEventListener(EVENT_ROOM_PARTNER_LIST, ()=>{});
        console.log('exit call ******************');
        navigation.navigate('List');
    }

    const onReject = () => {
        setCallState('reject');
        exitCall();
    }

    const onLeft = (rId, id, partners) => {
        console.log('====user left====', rId, id, partners);

        setPartnerList(partners);
        if(id === userId){
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

            let peer = connections[id];
            if(peer){
                peer.onicecandidate = null;
                peer.onaddstream = null;
                peer.close();
            }

            if(!Object.keys(remoteIndexes).length){
                webRTCSdk.leave(rId, userId);
                setRoomId(null);
                varRoomId = null;
                exitCall();
            }
        }
    }

    const onSwitchCamera = () => {
        localStream.getVideoTracks().forEach( (track) =>{
            track._switchCamera();
        });
    }

    const onToggleAddingPartner = () => {
        setOpenPartnerList(!openPartnerList);
    }

    const onInvite = (item) => {
        console.log('=== invite ===', varRoomId, roomId, item);
        webRTCSdk.invite(roomId, userId, item.userId);
        setOpenPartnerList(false);
    }

    const onMute = () => {
        setMuted(!muted);
        localStream.getAudioTracks().forEach( (track) =>{
            track.enabled = muted;
        });

        if(!muted){
            setCallStatus(roomId, CALL_STATUS_VIDEO_MUTED, "");
        } else {
            setCallStatus(roomId, CALL_STATUS_VIDEO_UNMUTED, "");
        }
        webRTCSdk.setMuteState(roomId, userId, !muted);
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
                            width: '100',
                            height: '100',
                            minFrameRate: 30
                        },
                        facingMode: isFront ? 'user' : 'environment',
                        optional: videoSourceId ? [{sourceId: videoSourceId}] : [],
                    }
                })
                .then((stream) => {
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

    function gotRemoteStream(event, userId, id, muted) {
        console.log('====remote stream====', event, userId, id);

        if(remoteIndexes[id]){
            return;
        }

        let index = null;
        let newRemoteUsers = remoteUsers;
        if(!realStreamRef1.current){
            realStreamRef1.current = event.stream;
            index = 1;
            newRemoteUsers[index - 1] = {userId, muted};
            setRemoteUsers(newRemoteUsers);
            setRealStream1(event.stream);
            console.log('setRealStream1', event.stream);
        } else if(!realStreamRef2.current){
            realStreamRef2.current = event.stream;
            index = 2;
            newRemoteUsers[index - 1] = {userId, muted};
            setRemoteUsers(newRemoteUsers);
            setRealStream2(event.stream);
            console.log('setRealStream2', realStream2);
        } else if(!realStreamRef3.current){
            realStreamRef3.current = event.stream;
            index = 3;
            newRemoteUsers[index - 1] = {userId, muted};
            setRemoteUsers(newRemoteUsers);
            setRealStream3(event.stream);
            console.log('setRealStream3', realStream3);
        }
        let newRemoteIndexes = remoteIndexes;
        newRemoteIndexes[id] = index;
        setRemoteIndexes(newRemoteIndexes);
    }

    function gotMessageFromServer(fromId, message){

        //Parse the incoming signal
        let signal = JSON.parse(message)

        //Make sure it's not coming from yourself
        if(fromId !== webRTCSdk.getId()) {

            if(signal.sdp){
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function() {
                    if(signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer().then(function(description){
                            connections[fromId].setLocalDescription(description).then(function() {
                                webRTCSdk.signal(fromId, JSON.stringify({'sdp': connections[fromId].localDescription}));
                            }).catch(e => console.log('local description',e));
                        }).catch(e => console.log('answer fail', e));
                    }
                }).catch(e => console.log('remote description',e));
            }

            if(signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e));
            }
        }
    }

    function onUserJoined(room, id, clients, partners){
        console.log('join: ', room, id, clients, partners);
        const { room_id, room_pass } = room;
        setCallState('connect');

        setRoomId(room_id);
        varRoomId = room_id;
        setRoomPass(room_pass);
        setPartnerList(partners)

        clients.forEach(function({userId, socketId, muted}) {

            if (!connections[socketId]) {
                //Wait for their ice candidate
                let newConnections = connections;
                newConnections[socketId] = new RTCPeerConnection(peerConnectionConfig);

                console.log('connections', newConnections, socketId);
                //Wait for their video stream
                newConnections[socketId].onicecandidate = function (event) {
                    if (event.candidate != null) {
                        console.log('SENDING ICE');
                        webRTCSdk.signal(socketId, JSON.stringify({'ice': event.candidate}));
                    }

                }
                newConnections[socketId].onaddstream = function (event) {
                    gotRemoteStream(event, userId, socketId, muted)
                }

                //Add the local video stream
                newConnections[socketId].addStream(userStream.current);

                console.log('connection', newConnections, socketId);
                setConnections(newConnections);
            }
        });

        //Create an offer to connect with your local description
        if(connections[id]){
            connections[id].createOffer().then(function(description){
                connections[id].setLocalDescription(description).then(function() {
                    // console.log(connections);
                    webRTCSdk.signal(id, JSON.stringify({'sdp': connections[id].localDescription}));
                }).catch(e => console.log(e));
            });
        }

        setCallState('calling');
    }

    function closeConnections(){
        if(userStream.current){
            setLocalStream(null);
            userStream.current.getTracks().forEach(item => item.stop());
            userStream.current.release();
        }

        Object.keys(connections).forEach(key => {
            let peer = connections[key];
            peer.onicecandidate = null;
            peer.onaddstream = null;
            peer.close();
        });

        setConnections({});
    }

    return (
        <View style={styles.container}>
            <StatusBar hidden={true}/>
            <View style={styles.localVideos}>
                <RTCView
                    key={0}
                    zOrder={0}
                    streamURL={
                        (activeStream === 1 && realStream1 && realStream1.toURL()) ||
                        (activeStream === 2 && realStream2 && realStream2.toURL()) ||
                        (activeStream === 3 && realStream3 && realStream3.toURL()) ||
                        (localStream && localStream.toURL())}
                    style={styles.localVideo}
                />
            </View>
            <View style={styles.remoteVideos}>
                {realStream1 && (
                    <View style={styles.remoteContainer}>
                        <Octicons size={8} style={[styles.remoteBtnText, styles.muteIcon]} name={remoteUsers[0].muted?"mute":"unmute"}/>
                        <TouchableOpacity
                            onPress={() => setActiveStream(1)}
                            >
                            <RTCView
                                key={1}
                                zOrder={0}
                                streamURL={realStream1 && realStream1.toURL()}
                                style={styles.remoteVideo}
                            />
                            <Text style={styles.userText}>{remoteUsers[0].userId}</Text>
                        </TouchableOpacity>
                    </View>
                )}
                {realStream2 && (
                    <View style={styles.remoteContainer}>
                        <Octicons size={8} style={[styles.remoteBtnText, styles.muteIcon]} name={remoteUsers[1].muted?"mute":"unmute"}/>
                        <TouchableOpacity
                            onPress={() => setActiveStream(2)}
                        >
                            <RTCView
                                key={2}
                                zOrder={0}
                                streamURL={realStream2 && realStream2.toURL()}
                                style={styles.remoteVideo}
                            />
                            <Text style={styles.userText}>{remoteUsers[1].userId}</Text>
                        </TouchableOpacity>
                    </View>
                )}
                {realStream3 && (
                    <View style={styles.remoteContainer}>
                        <Octicons size={8} style={[styles.remoteBtnText, styles.muteIcon]} name={remoteUsers[2].muted?"mute":"unmute"}/>
                        <TouchableOpacity
                            onPress={() => setActiveStream(3)}
                        >
                            <RTCView
                                key={3}
                                zOrder={0}
                                streamURL={realStream3 && realStream3.toURL()}
                                style={styles.remoteVideo}
                            />
                            <Text style={styles.userText}>{remoteUsers[2].userId}</Text>
                        </TouchableOpacity>
                    </View>
                )}
                {localStream && (
                    <View style={styles.remoteContainer}>
                        <Octicons size={8} style={[styles.remoteBtnText, styles.muteIcon]} name={localStream.getAudioTracks()[0].enabled?"unmute":"mute"}/>
                        <TouchableOpacity
                            onPress={() => setActiveStream(0)}
                        >
                            <RTCView
                                key={4}
                                zOrder={0}
                                streamURL={localStream && localStream.toURL()}
                                style={styles.remoteVideo}
                            />
                            <Text style={styles.userText}>You</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
            <View style={ styles.stateContainer }>
                {callState === "call" &&
                    <Text style={{fontSize: 22, width: '100%', textAlign:'center', color: 'white'}}>
                        Calling {userId} ...
                    </Text>
                }
                {callState === "join" &&
                    <Text style={{fontSize: 22, width: '100%', textAlign:'center', color: 'white'}}>
                        Joining Room {rid} ...
                    </Text>
                }
                {callState === "reject" &&
                    <Text style={{fontSize: 22, width: '100%', textAlign:'center', color: 'white'}}>
                        {userId} rejected your call
                    </Text>
                }
                {callState === "receive" &&
                    <Text style={{fontSize: 22, width: '100%', textAlign:'center', color: 'white'}}>
                        {callerId} calling you
                    </Text>
                }
                {callState === "matching" &&
                    <Text style={{fontSize: 22, width: '100%', textAlign:'center', color: 'white'}}>
                        Creating Room ...
                    </Text>
                }
            </View>
            { callState === "receive"?
                <View style={ styles.buttonContainer }>
                    <TouchableOpacity
                        style={styles.btn}
                        onPress={() => onReceive()}>
                        <MaterialIcons size={24} style={[styles.btnText, styles.receiveCallIcon]} color={'white'} name="call"/>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.btn}
                        onPress={() => onDisconnect()}>
                        <MaterialIcons size={24} style={[styles.btnText, styles.endCallIcon]} color={'white'} name="call-end"/>
                    </TouchableOpacity>
                </View>
                : (callState !== ""?
                <View style={ styles.buttonContainer }>
                    <TouchableOpacity
                        style={styles.btn}
                        onPress={() => onMute()}>
                        <Octicons size={24} style={[styles.btnText, styles.muteIcon]} name={muted?"unmute":"mute"}/>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.btn}
                        onPress={() => onDisconnect()}>
                        <MaterialIcons size={24} style={[styles.btnText, styles.endCallIcon]} color={'white'} name="call-end"/>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.btn}
                        onPress={() => onSwitchCamera()}>
                        <Ionicons size={24} style={[styles.btnText, styles.switchIcon]} name="camera-reverse"/>
                    </TouchableOpacity>
                </View>: null)
            }
            { callState === 'connect'?
                <View style={styles.addPartnerContainer}>
                    <TouchableOpacity
                        style={styles.btn}
                        onPress={() => onToggleAddingPartner()}>
                        { !openPartnerList ?
                            <AntDesign size={24} style={[styles.btnText, styles.muteIcon]} name={"adduser"}/>
                            :
                            <AntDesign size={24} style={[styles.btnText, styles.muteIcon]} name={"close"}/>
                        }
                    </TouchableOpacity>
                    { openPartnerList ?
                        <ScrollView style={{ width: 350, height: 400, paddingLeft: 50 }}>
                            { partnerList.length ?
                                <FlatList
                                    data={partnerList}
                                    renderItem={({item, index}) => (
                                        <View style={{flex: 1, flexDirection: 'row', paddingVertical: 8}}>
                                            <Text
                                                style={{color: 'white', width: 120, marginLeft: 8}}>{item.userId}</Text>
                                            <Button
                                                mode="contained"
                                                style={{width: 100}}
                                                onPress={() => onInvite(item)}>
                                                Invite
                                            </Button>
                                        </View>
                                    )}/>
                                :
                                <Text>There are no Partners</Text>
                            }
                        </ScrollView>
                        :
                        null
                    }
                </View>
                :
                null
            }
            { (callState === 'call' || callState === 'receive')?
                <View style={styles.ring}>
                    <Video
                        source={require('./ring.mp3')}
                        paused={false}
                        repeat={true}
                    />
                </View> :
                null
            }
        </View>
    );
}
