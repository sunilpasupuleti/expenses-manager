package com.webwizard.expensesmanager.alarmmanager;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.webwizard.expensesmanager.MainApplication;

public class AlarmReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d("AlarmReceiver", "Alarm Triggered");

        // Retrieve any data passed to the intent
        String data = intent.getStringExtra("data");

        // Send the event to React Native
        ReactApplicationContext reactContext = MainApplication.reactAppContext;
        if (reactContext != null) {
            reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("onAlarmTriggered", data);
        } else {
            Log.e("AlarmReceiver", "ReactApplicationContext is null");
        }
    }
}
