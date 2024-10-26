package com.webwizard.expensesmanager

import android.os.Bundle // added this.
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import org.devio.rn.splashscreen.SplashScreen // added this.

// added for android app state
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule


class MainActivity : ReactActivity () {

    // Added this method.
    override fun onCreate(savedInstanceState: Bundle?) {
      SplashScreen.show(this)
      super.onCreate(savedInstanceState)
    }
  
  
    // added for android app state
    override fun onWindowFocusChanged(hasFocus: Boolean) {
      val reactContext: ReactContext? = reactInstanceManager.currentReactContext
      val params: WritableMap = Arguments.createMap()
  
      if (hasFocus) {
          params.putString("event", "active")
      } else {
          params.putString("event", "inactive")
      }
  
      if (reactContext != null) {
          reactInstanceManager.currentReactContext!!
              .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
              .emit("ActivityStateChange", params)
      }
    }



  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "expensesmanager"
    /**
     * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
     * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
     */
    override fun createReactActivityDelegate(): ReactActivityDelegate =
    DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
