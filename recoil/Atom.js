import {atom} from 'recoil'
import {UserVariables} from './CustomTypes'

export const userState = atom<UserVariables>({
  key: 'userState',
  default: UserVariables
})
