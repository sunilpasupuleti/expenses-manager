package com.webwizard.expensesmanager;

import android.os.Bundle; // added this.
import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;

import org.devio.rn.splashscreen.SplashScreen; // added this.

// added for android app state
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;


public class MainActivity extends ReactActivity {

   // Added this method.
   @Override
   protected void onCreate(Bundle savedInstanceState) {
       SplashScreen.show(this);
       super.onCreate(savedInstanceState);
   }

  // added for android app state
  @Override
  public void onWindowFocusChanged(boolean hasFocus) {
    ReactContext reactContext = getReactInstanceManager()
      .getCurrentReactContext();
    WritableMap params = Arguments.createMap();
    if (hasFocus) {
      params.putString("event", "active");
    } else {
      params.putString("event", "inactive");
    }

    if (reactContext != null) {
      getReactInstanceManager()
        .getCurrentReactContext()
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit("ActivityStateChange", params);
    }
  }



  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "expensesmanager";
  }

  /**
   * Returns the instance of the {@link ReactActivityDelegate}. Here we use a util class {@link
   * DefaultReactActivityDelegate} which allows you to easily enable Fabric and Concurrent React
   * (aka React 18) with two boolean flags.
   */
  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new DefaultReactActivityDelegate(
        this,
        getMainComponentName(),
        // If you opted-in for the New Architecture, we enable the Fabric Renderer.
        DefaultNewArchitectureEntryPoint.getFabricEnabled()
        );
  }
}
