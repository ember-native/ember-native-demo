import { NativeScriptConfig } from '@nativescript/core';

export default {
  id: 'com.slacklite.app',
  appPath: 'app',
  appResourcesPath: 'App_Resources',
  android: {
    v8Flags: '--expose_gc',
    markingMode: 'none'
  },
  // Deep linking configuration for OAuth callback
  // This allows the app to handle URLs like: slacklite://slack/callback?code=xxx&state=yyy
  ios: {
    urlScheme: 'slacklite'
  },
  // For Android, URL scheme is configured in AndroidManifest.xml
  // Add this to App_Resources/Android/src/main/AndroidManifest.xml:
  // <intent-filter>
  //   <action android:name="android.intent.action.VIEW" />
  //   <category android:name="android.intent.category.DEFAULT" />
  //   <category android:name="android.intent.category.BROWSABLE" />
  //   <data android:scheme="slacklite" android:host="slack" />
  // </intent-filter>
} as NativeScriptConfig;
