import React, {useState, useEffect, useRef} from 'react';
import {View, Text, ScrollView, FlatList} from 'react-native';
import {GroupCallStyle} from '../style';
import {Button} from 'react-native-paper';
import AsyncStorage from '@react-native-community/async-storage';
import webRTCSdk, {EVENT_BE_CALLED, EVENT_FULL_ROOM, EVENT_ROOM_INVITE, EVENT_ROOM_LIST, EVENT_STOP_CALL} from "./sdk";
import {setIn} from "formik";

const TOKEN_LENGTH = 16;

export default function CallScreen({navigation, ...props}) {
  let varUserId = null;
  const [userId, setUserId] = useState('');
  const [userList, setUserList] = useState([]);
  const [roomList, setRoomList] = useState([]);
  const [message, setMessage] = useState(null);
  const [invited, setInvited] = useState(false);
  const [inviteRoom, setInviteRoom] = useState(null);
  const [inviteUserId, setInviteUserId] = useState(null);

  const onLogout = () => {

    webRTCSdk.logOut(varUserId);

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
          webRTCSdk.connect(id, onInit, onList);
        } else {
          setUserId('');
          navigation.push('Login');
        }
      });
  }, []);

  const onBeCalled = (cuid) => {
    console.log('beCalled----------------', cuid);
    navigation.push("Call", {userId: varUserId, callerId: cuid});
  }

  const onList = (users, rooms) => {
    let userList = users.filter(item => item.userId !== varUserId);
    console.log('==== List ====', userList, rooms)
    setUserList(userList);
    setRoomList(rooms);
  }

  const onInit = () => {
    webRTCSdk.setEventListener(EVENT_BE_CALLED, onBeCalled);
    webRTCSdk.setEventListener(EVENT_ROOM_LIST, onRoomList);
    webRTCSdk.setEventListener(EVENT_FULL_ROOM, onFullRoom);
    webRTCSdk.setEventListener(EVENT_ROOM_INVITE, onInvite);
  }

  const onInvite = (room, inviteId) => {
    setInvited(true);
    setInviteRoom(room);
    setInviteUserId(inviteId);
  }

  const onInviteReject = () => {
    setInvited(false);
    setInviteRoom(null);
    setInviteUserId(null);
  }

  const onRoomList = (rooms) => {
    setRoomList(rooms);
  }

  const onFullRoom = () => {
    setMessage('Full Room !!!');
  }

  const onCall = ({userId: uid}) => {
    console.log('onCall -------------', uid);
    navigation.push("Call", {userId, receiverId: uid});
  }

  const onJoin = (room) => {
    const { room_id, room_pass } = room;

    setInvited(false);
    setInviteRoom(null);
    setInviteUserId(null);

    // todo @@@
    // let token = createToken(TOKEN_LENGTH);
    // let params = {
    //     token: token,
    //     client_id: userId,
    //     room_id: room_id,
    //     room_pass: room_pass
    // };

    let params = {
      token: "myToken_1234",
      client_id: "cli_1234",
      room_id: room_id,
      room_pass: room_pass
    }

    webRTCSdk.authLoginRoom(params, (response) => {
      console.log('authLoginRoom', response);
      navigation.push("Call", {rid: room_id, userId});
    }, () => {
      setMessage("You can not access room");
    })
  }

  function createToken(length) {
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
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
            invited ?
                <View style={{backgroundColor: 'teal', flexDirection:'row', height: 50,paddingVertical: 4}}>
                  <Text style={{ color: 'white', width: 140 }}>{inviteUserId} invited you to Room </Text>
                  <Button
                      mode="contained"
                      style={{ width: 100, marginRight: 8}}
                      onPress={ () => onJoin(inviteRoom)}>
                    Join
                  </Button>
                  <Button
                      mode="contained"
                      style={{ width: 100}}
                      onPress={ () => onInviteReject()}>
                    Reject
                  </Button>
                </View>
                : null
          }
          <View style={{backgroundColor: 'teal', flex: 1, height: 300}}>
            <ScrollView>
              <Text style={{fontSize: 22, width: '100%', color: 'black'}}>Users</Text>
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
              <FlatList
                  data={roomList}
                  renderItem={ ({item, index}) => (
                      <View style={{ flex: 1, flexDirection: 'row', paddingVertical: 8}}>
                        <Text style={{ color: 'white', width: 250, marginLeft: 8 }}>{item.room_id}</Text>
                        <Button
                            mode="contained"
                            style={{ width: 100}}
                            onPress={ () => onJoin(item)}>
                          Join
                        </Button>
                      </View>
                  )}/>
            </ScrollView>
          </View>
        </View>
      </View>
  );
}
