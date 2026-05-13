import antfu from '@antfu/eslint-config'
import reactNative from '@react-native/eslint-plugin'

export default antfu({}, {
  plugins: {
    'react-native': reactNative,
  },
})
