import React, {useEffect} from 'react';
import {Text, View, TextInput, TouchableOpacity} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import {useRecoilValue, useSetRecoilState} from 'recoil';
import {userState} from '../recoil/Atom';

// @ts-ignore
import {Formik} from 'formik';
import * as Yup from 'yup';
import {LoginStyle} from '../style';

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Required'),
});

const Login = props => {
  const setUser = useSetRecoilState(userState);
  return (
  
    <Formik
      initialValues={{name: ''}}
      validationSchema={validationSchema}
      onSubmit={async (values, actions) => {
       // setUser({id: values.name});
        await AsyncStorage.setItem('userId', values.name);
        setTimeout(() => {
          actions.setSubmitting(false);
          props.navigation.push('GroupCall');
        }, 1000);
      }}>
      {({
        handleChange,
        values,
        touched,
        handleSubmit,
        errors,
        isValid,
        isSubmitting,
      }) => (
        <View style={LoginStyle.container}>
          <React.Fragment>
            <View>
              <TextInput
                name={'name'}
                style={LoginStyle.inputContainer}
                placeholder={'Enter Login ID'}
                placeholderTextColor={'black'}
                onChangeText={handleChange('name')}
              />
              {errors.name && touched.name && (
                <View style={{marginVertical: 20}}>
                  <Text style={{color: 'red'}}>{errors.name}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={[LoginStyle.buttonContainer, LoginStyle.sendButton]}
              onPress={handleSubmit}>
              <Text>Submit</Text>
            </TouchableOpacity>
          </React.Fragment>
        </View>
      )}
    </Formik>
    
  );
};

export default Login;
